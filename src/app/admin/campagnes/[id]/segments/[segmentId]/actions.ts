"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";

export interface ProposeRunnersState {
  error?: string;
  success?: boolean;
  proposedCount?: number;
}

/**
 * Shortlists selected runners for a segment: creates `assignments` docs
 * already in status "validated_by_brand" — the admin's own selection here
 * IS the validation, brands no longer review/approve proposed profiles
 * themselves. The status name is kept as-is (rather than renamed) to avoid
 * touching every downstream reader of it (runner views, progress order,
 * firestore.rules); "brand" in the name is now just legacy terminology for
 * "past the initial shortlist".
 *
 * The assignment doc id is deterministic (`${segmentId}_${runnerId}`), so
 * re-submitting the same runner is a no-op rather than a duplicate.
 */
export async function proposeRunners(
  campaignId: string,
  segmentId: string,
  _prevState: ProposeRunnersState,
  formData: FormData
): Promise<ProposeRunnersState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const runnerIds = formData.getAll("runnerIds").map(String).filter(Boolean);
  if (runnerIds.length === 0) {
    return { error: "Sélectionnez au moins un coureur." };
  }

  const segmentSnap = await adminDb
    .collection("campaigns")
    .doc(campaignId)
    .collection("campaignSegments")
    .doc(segmentId)
    .get();
  const runnerPayoutAmount = segmentSnap.data()?.runnerPayoutAmount;
  if (typeof runnerPayoutAmount !== "number") {
    return {
      error: "Définissez d'abord la rémunération du coureur pour ce ciblage (dans le détail de la campagne).",
    };
  }

  const batch = adminDb.batch();
  let created = 0;
  for (const runnerId of runnerIds) {
    const assignmentRef = adminDb.collection("assignments").doc(`${segmentId}_${runnerId}`);
    const existing = await assignmentRef.get();
    if (existing.exists) continue;

    batch.set(assignmentRef, {
      id: assignmentRef.id,
      campaignSegmentId: segmentId,
      runnerId,
      status: "validated_by_brand",
      runnerPayoutAmount,
      proofPhotoUrl: null,
      proofSubmittedAt: null,
      brandValidatedAt: FieldValue.serverTimestamp(),
      runnerValidatedAt: null,
      stickerConfirmedAt: null,
      withdrawnAt: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    created++;
  }

  if (created > 0) {
    await batch.commit();
  }

  revalidatePath(`/admin/campagnes/${campaignId}/segments/${segmentId}`);
  revalidatePath(`/admin/campagnes/${campaignId}`);
  return { success: true, proposedCount: created };
}
