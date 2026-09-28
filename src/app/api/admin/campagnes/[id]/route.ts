import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import { getPlatformConfig } from "@/lib/server/platform-config";
import { campaignStatusKey } from "@/lib/utils/campaign-status";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const campaignRef = adminDb.collection("campaigns").doc(id);
  const campaignSnap = await campaignRef.get();
  if (!campaignSnap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const campaign = campaignSnap.data()!;
  const needsEventList = !campaign.eventId && !!campaign.customEventName;

  const [brandSnap, eventSnap, raceSnap, segmentsSnap, allEventsSnap, config] = await Promise.all([
    campaign.brandId ? adminDb.collection("brands").doc(campaign.brandId).get() : Promise.resolve(null),
    campaign.eventId ? adminDb.collection("events").doc(campaign.eventId).get() : Promise.resolve(null),
    campaign.eventId && campaign.raceId
      ? adminDb.collection("events").doc(campaign.eventId).collection("races").doc(campaign.raceId).get()
      : Promise.resolve(null),
    campaignRef.collection("campaignSegments").orderBy("createdAt", "asc").get(),
    needsEventList ? adminDb.collection("events").orderBy("date", "asc").get() : Promise.resolve(null),
    getPlatformConfig(),
  ]);

  const brand = brandSnap?.data();
  const event = eventSnap?.data();
  const race = raceSnap?.data();

  const segmentIds = segmentsSnap.docs.map((doc) => doc.id);
  const validatedCounts: Record<string, number> = {};
  if (segmentIds.length > 0) {
    const assignmentsSnap = await adminDb
      .collection("assignments")
      .where("campaignSegmentId", "in", segmentIds)
      .get();
    for (const doc of assignmentsSnap.docs) {
      const segId = doc.data().campaignSegmentId as string;
      validatedCounts[segId] = (validatedCounts[segId] ?? 0) + 1;
    }
  }

  const allEvents =
    allEventsSnap?.docs.map((doc) => {
      const e = doc.data();
      return {
        id: doc.id,
        name: e.name as string,
        date: e.date as string,
        city: e.city as string,
        distanceKm: (e.distanceKm as number | undefined) ?? null,
        estimatedParticipants: e.estimatedParticipants as number,
        imageUrl: (e.imageUrl as string | undefined) ?? null,
      };
    }) ?? [];

  return NextResponse.json({
    campaign: {
      id,
      statusKey: campaignStatusKey((campaign.status as string | null) ?? null),
      brandId: campaign.brandId ?? null,
      brandName: brand?.companyName ?? null,
      contactName: brand?.contactName ?? null,
      contactEmail: brand?.contactEmail ?? null,
      contactPhone: brand?.contactPhone ?? null,
      eventName: event?.name ?? campaign.customEventName ?? null,
      eventCity: event?.city ?? null,
      eventDate: event?.date ?? null,
      eventDistanceKm: (event?.distanceKm as number | undefined) ?? null,
      raceName: race?.name ?? null,
      raceDistanceKm: (race?.distanceKm as number | undefined) ?? null,
      hasEvent: Boolean(event),
      customEventName: campaign.customEventName ?? null,
      needsEventList,
      pdfQuoteUrl: campaign.pdfQuoteUrl ?? null,
      quoteAmount: typeof campaign.quoteAmount === "number" ? campaign.quoteAmount : null,
      quoteSent: Boolean(campaign.quoteSentAt),
      quoteValidated: Boolean(campaign.quoteValidatedAt),
      commissionRateOverride:
        typeof campaign.commissionRateOverride === "number" ? campaign.commissionRateOverride : null,
    },
    segments: segmentsSnap.docs.map((doc) => {
      const s = doc.data();
      return {
        id: doc.id,
        placement: s.placement as string,
        targetGender: s.targetGender as string,
        targetAgeMin: s.targetAgeMin as number,
        targetAgeMax: s.targetAgeMax as number,
        requestedRunnerCountMin: s.requestedRunnerCountMin as number,
        requestedRunnerCountMax: s.requestedRunnerCountMax as number,
        runnerPayoutAmount: typeof s.runnerPayoutAmount === "number" ? s.runnerPayoutAmount : null,
        validatedCount: validatedCounts[doc.id] ?? 0,
      };
    }),
    allEvents,
    platformDefaultRate: config.defaultCommissionRate,
  });
}
