import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import { getPublicEventsWithRaces } from "@/lib/server/events";
import { getPlatformConfig } from "@/lib/server/platform-config";
import { campaignStatusKey } from "@/lib/utils/campaign-status";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [brandSnap, collaboratorsSnap, campaignsSnap, events, config] = await Promise.all([
    adminDb.collection("brands").doc(id).get(),
    adminDb.collection("collaborators").where("brandId", "==", id).get(),
    adminDb.collection("campaigns").where("brandId", "==", id).orderBy("createdAt", "desc").get(),
    getPublicEventsWithRaces(),
    getPlatformConfig(),
  ]);
  if (!brandSnap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const brand = brandSnap.data()!;

  const campaigns = await Promise.all(
    campaignsSnap.docs.map(async (doc) => {
      const c = doc.data();
      const eventSnap = c.eventId ? await adminDb.collection("events").doc(c.eventId).get() : null;
      return {
        id: doc.id,
        statusKey: campaignStatusKey(c.status ?? null),
        eventName: eventSnap?.data()?.name ?? c.customEventName ?? "—",
        createdAt: c.createdAt?.toDate?.().toISOString() ?? null,
      };
    })
  );

  return NextResponse.json({
    brand: {
      id,
      companyName: brand.companyName as string,
      siret: brand.siret as string,
      contactEmail: brand.contactEmail as string,
      contactPhone: brand.contactPhone as string,
    },
    collaborators: collaboratorsSnap.docs.map((doc) => {
      const c = doc.data();
      return {
        id: doc.id,
        firstName: c.firstName as string,
        lastName: c.lastName as string,
        email: c.email as string,
        phone: c.phone as string,
      };
    }),
    campaigns,
    events,
    placements: config.placements,
  });
}
