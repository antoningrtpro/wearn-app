import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { SegmentInput } from "@/lib/validation/campaign";

/**
 * Validates an event/race pair for a new campaign. Returns the resolved,
 * confirmed-to-exist ids, or an error message — never throws, since both
 * call sites (admin's own creation form and a brand collaborator's) need to
 * surface the same friendly messages.
 */
export async function resolveEventRace(
  eventId: string | null,
  rawRaceId: unknown
): Promise<{ eventId: string | null; raceId: string | null; error?: undefined } | { error: string }> {
  if (!eventId) return { eventId: null, raceId: null };

  const eventSnap = await adminDb.collection("events").doc(eventId).get();
  if (!eventSnap.exists) {
    return { error: "Événement introuvable." };
  }

  let raceId: string | null = null;
  if (typeof rawRaceId === "string" && rawRaceId.trim() !== "") {
    const raceSnap = await adminDb
      .collection("events")
      .doc(eventId)
      .collection("races")
      .doc(rawRaceId)
      .get();
    if (!raceSnap.exists) {
      return { error: "Course introuvable pour cet événement." };
    }
    raceId = rawRaceId;
  }

  return { eventId, raceId };
}

export interface CreateCampaignInput {
  brandId: string;
  /** The collaborator who created it from their own space, or null (admin-created). */
  collaboratorId: string | null;
  eventId: string | null;
  customEventName: string | null;
  raceId: string | null;
  segments: SegmentInput[];
}

/** Creates a campaign + its segments in one batch. Returns the new campaign id. */
export async function createCampaignWithSegments(input: CreateCampaignInput): Promise<string> {
  const campaignRef = adminDb.collection("campaigns").doc();
  const batch = adminDb.batch();
  batch.set(campaignRef, {
    id: campaignRef.id,
    brandId: input.brandId,
    collaboratorId: input.collaboratorId,
    eventId: input.eventId,
    customEventName: input.eventId ? null : input.customEventName,
    raceId: input.raceId,
    status: "draft",
    currentStep: "submitted",
    pdfQuoteUrl: null,
    quoteAmount: null,
    quoteSentAt: null,
    quoteValidatedAt: null,
    commissionRateOverride: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  for (const segment of input.segments) {
    const segRef = campaignRef.collection("campaignSegments").doc();
    batch.set(segRef, {
      id: segRef.id,
      campaignId: campaignRef.id,
      targetGender: segment.targetGender,
      targetAgeMin: segment.targetAgeMin,
      targetAgeMax: segment.targetAgeMax,
      placement: segment.placement,
      requestedRunnerCountMin: segment.requestedRunnerCountMin,
      requestedRunnerCountMax: segment.requestedRunnerCountMax,
      runnerPayoutAmount: null,
      notes: segment.notes || null,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  return campaignRef.id;
}
