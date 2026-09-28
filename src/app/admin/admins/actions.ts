"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import { setUserRole } from "@/lib/firebase/roles";

const adminFieldsSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
});

export interface InviteAdminState {
  error?: string;
  success?: boolean;
  resetLink?: string;
}

/**
 * Creates a real Firebase Auth account for a new admin (throwaway password +
 * a reset link to share manually — same posture as brand collaborators and
 * manually-created runners, no email sending automated yet).
 */
export async function inviteAdmin(
  _prevState: InviteAdminState,
  formData: FormData
): Promise<InviteAdminState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const parsed = adminFieldsSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    jobTitle: formData.get("jobTitle"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Informations invalides." };
  }
  const data = parsed.data;

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
    console.error("[admin/admins] createUser failed:", err);
    return { error: "Création du compte impossible." };
  }

  try {
    await setUserRole(user.uid, "admin");
    await adminDb.collection("admins").doc(user.uid).set({
      id: user.uid,
      authUid: user.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone?.trim() || null,
      jobTitle: data.jobTitle?.trim() || null,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    await adminAuth.deleteUser(user.uid).catch(() => {});
    console.error("[admin/admins] profile doc failed after auth creation:", err);
    return { error: "Création du profil impossible." };
  }

  const resetLink = await adminAuth.generatePasswordResetLink(data.email).catch((err) => {
    console.error("[admin/admins] generatePasswordResetLink failed:", err);
    return null;
  });

  revalidatePath("/admin/admins");
  return { success: true, resetLink: resetLink ?? undefined };
}

export interface UpdateAdminState {
  error?: string;
  success?: boolean;
}

const adminUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  phone: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
});

export async function updateAdminAccount(
  targetAdminId: string,
  _prevState: UpdateAdminState,
  formData: FormData
): Promise<UpdateAdminState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const parsed = adminUpdateSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    jobTitle: formData.get("jobTitle"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Informations invalides." };
  }

  const targetSnap = await adminDb.collection("admins").doc(targetAdminId).get();
  if (!targetSnap.exists) {
    return { error: "Administrateur introuvable." };
  }

  await adminDb.collection("admins").doc(targetAdminId).update({
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone: parsed.data.phone?.trim() || null,
    jobTitle: parsed.data.jobTitle?.trim() || null,
  });
  await adminAuth
    .updateUser(targetAdminId, { displayName: `${parsed.data.firstName} ${parsed.data.lastName}` })
    .catch(() => {});

  revalidatePath("/admin/admins");
  return { success: true };
}

export interface DeleteAdminState {
  error?: string;
  success?: boolean;
}

export async function deleteAdminAccount(
  targetAdminId: string,
  _prevState: DeleteAdminState,
  _formData: FormData
): Promise<DeleteAdminState> {
  void _formData;
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }
  if (session.uid === targetAdminId) {
    return { error: "Vous ne pouvez pas supprimer votre propre compte." };
  }

  await adminDb.collection("admins").doc(targetAdminId).delete();
  await adminAuth.deleteUser(targetAdminId).catch(() => {});

  revalidatePath("/admin/admins");
  return { success: true };
}
