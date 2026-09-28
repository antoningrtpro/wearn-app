import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import { campaignStatusKey } from "@/lib/utils/campaign-status";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "brand" || !session.brandId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const campaignRef = adminDb.collection("campaigns").doc(id);
  const campaignSnap = await campaignRef.get();
  if (!campaignSnap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const campaign = campaignSnap.data()!;

  // A collaborator only ever sees campaigns belonging to their own brand —
  // this check is the actual authorization boundary (this route is
  // server-rendered via the Admin SDK, so Firestore rules don't apply here).
  if (campaign.brandId !== session.brandId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [eventSnap, raceSnap, segmentsSnap] = await Promise.all([
    campaign.eventId ? adminDb.collection("events").doc(campaign.eventId).get() : Promise.resolve(null),
    campaign.eventId && campaign.raceId
      ? adminDb.collection("events").doc(campaign.eventId).collection("races").doc(campaign.raceId).get()
      : Promise.resolve(null),
    campaignRef.collection("campaignSegments").orderBy("createdAt", "asc").get(),
  ]);
  const event = eventSnap?.data();
  const race = raceSnap?.data();

  // Every assignment for one of this campaign's segments has already been
  // admin-validated (see proposeRunners) — no separate brand review step —
  // so counting assignment docs per segment is enough, same as the admin
  // route this mirrors.
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

  return NextResponse.json({
    campaign: {
      id,
      statusKey: campaignStatusKey((campaign.status as string | null) ?? null),
      eventName: event?.name ?? campaign.customEventName ?? null,
      eventCity: event?.city ?? null,
      eventDate: event?.date ?? null,
      eventDistanceKm: (event?.distanceKm as number | undefined) ?? null,
      raceName: race?.name ?? null,
      raceDistanceKm: (race?.distanceKm as number | undefined) ?? null,
      hasEvent: Boolean(event),
      pdfQuoteUrl: campaign.pdfQuoteUrl ?? null,
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
        validatedCount: validatedCounts[doc.id] ?? 0,
      };
    }),
  });
}
