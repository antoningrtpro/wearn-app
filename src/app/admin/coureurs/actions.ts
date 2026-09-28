"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import {
  adminCreateRunnerSchema,
  ACCEPTED_PHOTO_TYPES,
  MAX_PROFILE_PHOTO_BYTES,
} from "@/lib/validation/runner";

export interface CreateRunnerState {
  error?: string;
  success?: boolean;
  resetLink?: string;
}

/**
 * Admin-side manual runner creation. Creates a real Firebase Auth account
 * (so the runner can eventually accept/decline proposals themselves, which
 * firestore.rules ties to request.auth.uid) with a throwaway password, then
 * hands back a password-reset link for the admin to share manually — email
 * sending isn't automated yet, same posture as the quote validation link.
 */
export async function createRunnerManually(
  _prevState: CreateRunnerState,
  formData: FormData
): Promise<CreateRunnerState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const parsed = adminCreateRunnerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    gender: formData.get("gender"),
    birthDate: formData.get("birthDate"),
    clothingSize: formData.get("clothingSize"),
    acceptedPlacements: formData.getAll("acceptedPlacements"),
    ibanOrPaymentRef: formData.get("ibanOrPaymentRef"),
    taxStatus: formData.get("taxStatus"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const data = parsed.data;

  const photo = formData.get("profilePhoto");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Photo de profil requise." };
  }
  if (!ACCEPTED_PHOTO_TYPES.includes(photo.type)) {
    return { error: "Format de photo invalide (JPEG, PNG ou WebP)." };
  }
  if (photo.size > MAX_PROFILE_PHOTO_BYTES) {
    return { error: "Photo trop volumineuse (5 Mo max)." };
  }

  const existing = await adminAuth.getUserByEmail(data.email).catch(() => null);
  if (existing) {
    return { error: "Un compte existe déjà avec cet email." };
  }

  let user;
  try {
    user = await adminAuth.createUser({
      email: data.email,
      password: nanoid(32),
      displayName: `${data.firstName} ${data.lastName}`,
    });
  } catch (err) {
    if ((err as { code?: string }).code === "auth/email-already-exists") {
      return { error: "Un compte existe déjà avec cet email." };
    }
    console.error("[admin/coureurs] createUser failed:", err);
    return { error: "Création du compte impossible." };
  }

  try {
    const bucket = adminStorage.bucket();
    const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    const filePath = `profilePhotos/${user.uid}/profile.${extension}`;
    const file = bucket.file(filePath);
    const buffer = Buffer.from(await photo.arrayBuffer());
    await file.save(buffer, { metadata: { contentType: photo.type } });
    const profilePhotoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;

    await adminAuth.setCustomUserClaims(user.uid, { role: "runner" });

    await adminDb.collection("runners").doc(user.uid).set({
      id: user.uid,
      authUid: user.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      birthDate: data.birthDate,
      city: null,
      clothingSize: data.clothingSize,
      profilePhotoUrl,
      acceptedPlacements: data.acceptedPlacements,
      ibanOrPaymentRef: data.ibanOrPaymentRef,
      taxStatus: data.taxStatus,
      participatingEventIds: [],
      eventRaceSelections: {},
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    await adminAuth.deleteUser(user.uid).catch(() => {});
    console.error("[admin/coureurs] setup failed after auth creation:", err);
    return { error: "Création du profil impossible." };
  }

  const resetLink = await adminAuth.generatePasswordResetLink(data.email).catch((err) => {
    console.error("[admin/coureurs] generatePasswordResetLink failed:", err);
    return null;
  });

  revalidatePath("/admin/coureurs");
  return { success: true, resetLink: resetLink ?? undefined };
}

export interface UpdateRunnerState {
  error?: string;
  success?: boolean;
}

const runnerUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  phone: z.string().trim().min(6, "Téléphone invalide"),
  gender: z.enum(["homme", "femme", "autre"]),
  birthDate: z.string().min(1, "Date de naissance requise"),
  clothingSize: z.enum(["XS", "S", "M", "L", "XL", "XXL"]).optional().nullable(),
  acceptedPlacements: z.array(z.string()).min(1, "Choisissez au moins un emplacement"),
});

/**
 * Admin-side edit of an existing runner profile. Email is not editable here
 * — same rationale as collaborators, it's the Auth identity.
 */
export async function updateRunnerManually(
  runnerId: string,
  _prevState: UpdateRunnerState,
  formData: FormData
): Promise<UpdateRunnerState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const parsed = runnerUpdateSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    gender: formData.get("gender"),
    birthDate: formData.get("birthDate"),
    clothingSize: formData.get("clothingSize") || null,
    acceptedPlacements: formData.getAll("acceptedPlacements"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const data = parsed.data;

  const runnerSnap = await adminDb.collection("runners").doc(runnerId).get();
  if (!runnerSnap.exists) {
    return { error: "Coureur introuvable." };
  }

  await adminDb.collection("runners").doc(runnerId).update({
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    gender: data.gender,
    birthDate: data.birthDate,
    clothingSize: data.clothingSize || null,
    acceptedPlacements: data.acceptedPlacements,
  });
  await adminAuth.updateUser(runnerId, {
    displayName: `${data.firstName} ${data.lastName}`,
  }).catch(() => {});

  revalidatePath("/admin/coureurs");
  return { success: true };
}
