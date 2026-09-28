"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import { setUserRole } from "@/lib/firebase/roles";
import { z } from "zod";

const brandFieldsSchema = z.object({
  companyName: z.string().trim().min(1, "Nom de l'entreprise requis"),
  siret: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => /^\d{14}$/.test(v), "SIRET invalide (14 chiffres)"),
});

const collaboratorFieldsSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().trim().min(6, "Téléphone invalide"),
});

/**
 * Creates a real Firebase Auth account for a brand collaborator (throwaway
 * password + a reset link to share manually), sets the `{role: "brand",
 * brandId}` custom claim, and writes the Firestore profile doc — same
 * posture as /admin/coureurs' manual runner creation.
 */
async function createCollaboratorAccount(
  brandId: string,
  data: z.infer<typeof collaboratorFieldsSchema>
): Promise<{ resetLink?: string; error?: string }> {
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
    console.error("[admin/marques] createUser failed:", err);
    return { error: "Création du compte impossible." };
  }

  try {
    await setUserRole(user.uid, "brand", brandId);
    await adminDb.collection("collaborators").doc(user.uid).set({
      id: user.uid,
      authUid: user.uid,
      brandId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    await adminAuth.deleteUser(user.uid).catch(() => {});
    console.error("[admin/marques] collaborator doc failed after auth creation:", err);
    return { error: "Création du profil impossible." };
  }

  const resetLink = await adminAuth.generatePasswordResetLink(data.email).catch((err) => {
    console.error("[admin/marques] generatePasswordResetLink failed:", err);
    return null;
  });

  return { resetLink: resetLink ?? undefined };
}

export interface CreateBrandState {
  error?: string;
  success?: boolean;
  resetLink?: string;
}

export async function createBrandWithCollaborator(
  _prevState: CreateBrandState,
  formData: FormData
): Promise<CreateBrandState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const parsedBrand = brandFieldsSchema.safeParse({
    companyName: formData.get("companyName"),
    siret: formData.get("siret"),
  });
  if (!parsedBrand.success) {
    return { error: parsedBrand.error.issues[0]?.message ?? "Informations invalides." };
  }

  const parsedCollaborator = collaboratorFieldsSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  if (!parsedCollaborator.success) {
    return { error: parsedCollaborator.error.issues[0]?.message ?? "Informations invalides." };
  }

  const brandRef = adminDb.collection("brands").doc();
  await brandRef.set({
    id: brandRef.id,
    companyName: parsedBrand.data.companyName,
    siret: parsedBrand.data.siret,
    contactName: `${parsedCollaborator.data.firstName} ${parsedCollaborator.data.lastName}`,
    contactEmail: parsedCollaborator.data.email,
    contactPhone: parsedCollaborator.data.phone,
    createdAt: FieldValue.serverTimestamp(),
  });

  const result = await createCollaboratorAccount(brandRef.id, parsedCollaborator.data);
  if (result.error) {
    await brandRef.delete();
    return { error: result.error };
  }

  revalidatePath("/admin/marques");
  return { success: true, resetLink: result.resetLink };
}

export interface UpdateBrandState {
  error?: string;
  success?: boolean;
}

export async function updateBrand(
  brandId: string,
  _prevState: UpdateBrandState,
  formData: FormData
): Promise<UpdateBrandState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const parsed = brandFieldsSchema.safeParse({
    companyName: formData.get("companyName"),
    siret: formData.get("siret"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Informations invalides." };
  }

  const brandSnap = await adminDb.collection("brands").doc(brandId).get();
  if (!brandSnap.exists) {
    return { error: "Marque introuvable." };
  }

  await adminDb.collection("brands").doc(brandId).update({
    companyName: parsed.data.companyName,
    siret: parsed.data.siret,
  });

  revalidatePath("/admin/marques");
  return { success: true };
}

export interface UpdateCollaboratorState {
  error?: string;
  success?: boolean;
}

const collaboratorUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  phone: z.string().trim().min(6, "Téléphone invalide"),
});

export async function updateCollaborator(
  collaboratorId: string,
  _prevState: UpdateCollaboratorState,
  formData: FormData
): Promise<UpdateCollaboratorState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const parsed = collaboratorUpdateSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Informations invalides." };
  }

  const collaboratorSnap = await adminDb.collection("collaborators").doc(collaboratorId).get();
  if (!collaboratorSnap.exists) {
    return { error: "Collaborateur introuvable." };
  }

  // Email is intentionally not editable here — it's the Firebase Auth
  // identity; changing it would need adminAuth.updateUser too and isn't
  // asked for, so it stays out of scope to avoid a half-updated identity.
  await adminDb.collection("collaborators").doc(collaboratorId).update({
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone: parsed.data.phone,
  });
  await adminAuth.updateUser(collaboratorId, {
    displayName: `${parsed.data.firstName} ${parsed.data.lastName}`,
  }).catch(() => {});

  revalidatePath("/admin/marques");
  return { success: true };
}

export interface AddCollaboratorState {
  error?: string;
  success?: boolean;
  resetLink?: string;
}

export async function addCollaborator(
  brandId: string,
  _prevState: AddCollaboratorState,
  formData: FormData
): Promise<AddCollaboratorState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const parsed = collaboratorFieldsSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Informations invalides." };
  }

  const brandSnap = await adminDb.collection("brands").doc(brandId).get();
  if (!brandSnap.exists) {
    return { error: "Marque introuvable." };
  }

  const result = await createCollaboratorAccount(brandId, parsed.data);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/admin/marques");
  return { success: true, resetLink: result.resetLink };
}
