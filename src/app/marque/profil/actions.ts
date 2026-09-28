"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";

export interface UpdateCollaboratorProfileState {
  error?: string;
  success?: boolean;
}

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  phone: z.string().trim().min(6, "Téléphone invalide"),
});

/** Self-service update for a collaborator's own profile — same fields an
 * admin can already edit via /admin/marques' updateCollaborator, just
 * scoped to the signed-in collaborator's own doc instead of taking an id. */
export async function updateOwnCollaboratorProfile(
  _prevState: UpdateCollaboratorProfileState,
  formData: FormData
): Promise<UpdateCollaboratorProfileState> {
  const session = await getSession();
  if (!session || session.role !== "brand") {
    return { error: "Non autorisé." };
  }

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Informations invalides." };
  }

  await adminDb.collection("collaborators").doc(session.uid).update({
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone: parsed.data.phone,
  });
  await adminAuth
    .updateUser(session.uid, { displayName: `${parsed.data.firstName} ${parsed.data.lastName}` })
    .catch(() => {});

  revalidatePath("/marque/profil");
  return { success: true };
}
