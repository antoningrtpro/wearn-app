"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";

export interface UpdateAdminProfileState {
  error?: string;
  success?: boolean;
}

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  phone: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
});

export async function updateAdminProfile(
  _prevState: UpdateAdminProfileState,
  formData: FormData
): Promise<UpdateAdminProfileState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    jobTitle: formData.get("jobTitle"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Informations invalides." };
  }

  await adminDb.collection("admins").doc(session.uid).set(
    {
      id: session.uid,
      authUid: session.uid,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: session.email ?? "",
      phone: parsed.data.phone?.trim() || null,
      jobTitle: parsed.data.jobTitle?.trim() || null,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  revalidatePath("/admin/parametres");
  return { success: true };
}
