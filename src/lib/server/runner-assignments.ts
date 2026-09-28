import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { RunnerCampaignRow } from "@/lib/types/runner-view";
import type { RunnerAssignmentRef } from "@/components/runner/my-events";

interface JoinedContext {
  campaignId: string;
  eventId: string | null;
  eventName: string;
  eventDate: string;
  eventCity: string;
  raceName: string | null;
  placement: string;
  targetGender: string;
  targetAgeMin: number;
  targetAgeMax: number;
}

/** Joins an assignment's campaignSegmentId up to its campaign's event.
 * campaignSegments is a subcollection, so this is a collection-group lookup
 * by the segment's own `id` field (same pattern as the Cloud Functions). */
async function joinEventContext(campaignSegmentId: string): Promise<JoinedContext | null> {
  const segmentQuery = await adminDb
    .collectionGroup("campaignSegments")
    .where("id", "==", campaignSegmentId)
    .limit(1)
    .get();
  if (segmentQuery.empty) return null;
  const segment = segmentQuery.docs[0].data();

  const campaignSnap = await adminDb.collection("campaigns").doc(segment.campaignId).get();
  const campaign = campaignSnap.data();
  const eventSnap = campaign?.eventId
    ? await adminDb.collection("events").doc(campaign.eventId).get()
    : null;
  const event = eventSnap?.data();
  const raceSnap =
    campaign?.eventId && campaign?.raceId
      ? await adminDb.collection("events").doc(campaign.eventId).collection("races").doc(campaign.raceId).get()
      : null;
  const race = raceSnap?.data();

  return {
    campaignId: segment.campaignId,
    eventId: campaign?.eventId ?? null,
    eventName: event?.name ?? campaign?.customEventName ?? "Événement",
    eventDate: event?.date ?? "",
    eventCity: event?.city ?? "",
    raceName: race?.name ?? null,
    placement: segment.placement,
    targetGender: segment.targetGender,
    targetAgeMin: segment.targetAgeMin,
    targetAgeMax: segment.targetAgeMax,
  };
}

async function toRow(assignmentId: string, a: FirebaseFirestore.DocumentData): Promise<RunnerCampaignRow | null> {
  const context = await joinEventContext(a.campaignSegmentId);
  if (!context) return null;
  return {
    assignmentId,
    campaignId: context.campaignId,
    eventId: context.eventId,
    eventName: context.eventName,
    eventDate: context.eventDate,
    eventCity: context.eventCity,
    raceName: context.raceName,
    placement: context.placement,
    targetGender: context.targetGender,
    targetAgeMin: context.targetAgeMin,
    targetAgeMax: context.targetAgeMax,
    status: a.status,
    runnerPayoutAmount: a.runnerPayoutAmount,
    proofPhotoUrl: a.proofPhotoUrl ?? null,
  };
}

export async function getProposalsForRunner(runnerId: string): Promise<RunnerCampaignRow[]> {
  const assignmentsSnap = await adminDb
    .collection("assignments")
    .where("runnerId", "==", runnerId)
    .where("status", "==", "validated_by_brand")
    .get();

  const rows: RunnerCampaignRow[] = [];
  for (const aDoc of assignmentsSnap.docs) {
    const row = await toRow(aDoc.id, aDoc.data());
    if (row) rows.push(row);
  }
  return rows;
}

const ACTIVE_STATUSES = [
  "validated_by_runner",
  "sticker_confirmed",
  "proof_submitted",
  "proof_approved",
  "paid",
];

export async function getActiveAssignmentsForRunner(runnerId: string): Promise<RunnerCampaignRow[]> {
  const assignmentsSnap = await adminDb
    .collection("assignments")
    .where("runnerId", "==", runnerId)
    .where("status", "in", ACTIVE_STATUSES)
    .get();

  const rows: RunnerCampaignRow[] = [];
  for (const aDoc of assignmentsSnap.docs) {
    const row = await toRow(aDoc.id, aDoc.data());
    if (row) rows.push(row);
  }
  return rows;
}

/**
 * Every assignment the runner has ever had, except "proposed" (admin
 * shortlisted them, but the brand hasn't reviewed it yet — nothing to show
 * the runner, same rule as getProposalsForRunner). Used by "Mes campagnes"
 * for the full history, including refusals/declines.
 */
export async function getAllCampaignsForRunner(runnerId: string): Promise<RunnerCampaignRow[]> {
  const assignmentsSnap = await adminDb
    .collection("assignments")
    .where("runnerId", "==", runnerId)
    .get();

  const rows: RunnerCampaignRow[] = [];
  for (const aDoc of assignmentsSnap.docs) {
    const data = aDoc.data();
    if (data.status === "proposed") continue;
    const row = await toRow(aDoc.id, data);
    if (row) rows.push(row);
  }
  return rows;
}

/** First assignment found per eventId — used by <MyEvents> to decide what
 * happens when a runner un-participates from an event they already have a
 * campaign assignment for. */
export function buildAssignmentsByEvent(rows: RunnerCampaignRow[]): Record<string, RunnerAssignmentRef> {
  const assignmentsByEvent: Record<string, RunnerAssignmentRef> = {};
  for (const row of rows) {
    if (!row.eventId) continue;
    if (assignmentsByEvent[row.eventId]) continue;
    assignmentsByEvent[row.eventId] = { assignmentId: row.assignmentId, status: row.status };
  }
  return assignmentsByEvent;
}
