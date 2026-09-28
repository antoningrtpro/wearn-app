import "server-only";

import { adminDb } from "@/lib/firebase/admin";

export interface AssignmentReviewRow {
  assignmentId: string;
  runnerFirstName: string;
  runnerLastName: string;
  runnerPhotoUrl: string;
  eventName: string;
  eventDate: string;
  placement: string;
  runnerPayoutAmount: number;
  status: string;
  proofPhotoUrl: string | null;
}

/** Admin-side join: assignment -> segment (placement) -> campaign -> event,
 * plus the runner's own name/photo (fine to show here — this is the admin's
 * own internal review view, not the brand-facing or public one). */
export async function getAssignmentsForReview(statuses: string[]): Promise<AssignmentReviewRow[]> {
  const assignmentsSnap = await adminDb
    .collection("assignments")
    .where("status", "in", statuses)
    .get();

  const rows: AssignmentReviewRow[] = [];
  for (const aDoc of assignmentsSnap.docs) {
    const a = aDoc.data();

    const [runnerSnap, segmentQuery] = await Promise.all([
      adminDb.collection("runners").doc(a.runnerId).get(),
      adminDb.collectionGroup("campaignSegments").where("id", "==", a.campaignSegmentId).limit(1).get(),
    ]);
    const runner = runnerSnap.data();
    if (!runner || segmentQuery.empty) continue;
    const segment = segmentQuery.docs[0].data();

    const campaignSnap = await adminDb.collection("campaigns").doc(segment.campaignId).get();
    const campaign = campaignSnap.data();
    const eventSnap = campaign?.eventId
      ? await adminDb.collection("events").doc(campaign.eventId).get()
      : null;
    const event = eventSnap?.data();

    rows.push({
      assignmentId: aDoc.id,
      runnerFirstName: runner.firstName,
      runnerLastName: runner.lastName,
      runnerPhotoUrl: runner.profilePhotoUrl,
      eventName: event?.name ?? "Événement",
      eventDate: event?.date ?? "",
      placement: segment.placement,
      runnerPayoutAmount: a.runnerPayoutAmount,
      status: a.status,
      proofPhotoUrl: a.proofPhotoUrl ?? null,
    });
  }
  return rows;
}
