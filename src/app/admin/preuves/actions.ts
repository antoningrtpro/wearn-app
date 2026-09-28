"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";

export interface ReviewActionState {
  error?: string;
  success?: boolean;
}

/** Approves a submitted proof photo: proof_submitted -> proof_approved.
 * Payment itself stays manual (marked separately once the transfer is done). */
export async function approveProof(
  assignmentId: string,
  _prevState: ReviewActionState,
  _formData: FormData
): Promise<ReviewActionState> {
  void _prevState;
  void _formData;

  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const ref = adminDb.collection("assignments").doc(assignmentId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.status !== "proof_submitted") {
    return { error: "Cette preuve n'est plus en attente de validation." };
  }

  await ref.update({ status: "proof_approved" });

  revalidatePath("/admin/preuves");
  return { success: true };
}

/** Marks an assignment as paid, once the transfer has actually been made
 * outside the platform — no payment automation in V1. */
export async function markPaid(
  assignmentId: string,
  _prevState: ReviewActionState,
  _formData: FormData
): Promise<ReviewActionState> {
  void _prevState;
  void _formData;

  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const ref = adminDb.collection("assignments").doc(assignmentId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.status !== "proof_approved") {
    return { error: "Cette preuve n'est pas (encore) approuvée." };
  }

  await ref.update({ status: "paid" });

  revalidatePath("/admin/preuves");
  return { success: true };
}
