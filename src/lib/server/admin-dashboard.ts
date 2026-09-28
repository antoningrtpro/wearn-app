import "server-only";

import { adminDb } from "@/lib/firebase/admin";

export interface RecentCampaignRow {
  id: string;
  brandName: string;
  eventName: string;
  status: string | null;
  updatedAt: Date | null;
}

export interface UpcomingEventRow {
  id: string;
  name: string;
  city: string;
  date: string;
}

export interface DashboardSummary {
  brandCount: number;
  runnerCount: number;
  /** Sum of the manually-entered quote amount across campaigns marked
   * signed (quoteValidatedAt set) — "devis signé". */
  signedRevenue: number;
  recentCampaigns: RecentCampaignRow[];
  upcomingEvents: UpcomingEventRow[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [brandsSnap, runnersSnap, campaignsSnap, eventsSnap] = await Promise.all([
    adminDb.collection("brands").count().get(),
    adminDb.collection("runners").where("signupCompleted", "==", true).count().get(),
    adminDb.collection("campaigns").orderBy("createdAt", "desc").get(),
    adminDb.collection("events").orderBy("date", "asc").get(),
  ]);

  let signedRevenue = 0;
  const recentCampaigns: RecentCampaignRow[] = [];

  for (const doc of campaignsSnap.docs) {
    const campaign = doc.data();

    if (campaign.quoteValidatedAt && typeof campaign.quoteAmount === "number") {
      signedRevenue += campaign.quoteAmount;
    }

    if (recentCampaigns.length < 5) {
      const [brandSnap, eventSnap] = await Promise.all([
        campaign.brandId ? adminDb.collection("brands").doc(campaign.brandId).get() : Promise.resolve(null),
        campaign.eventId ? adminDb.collection("events").doc(campaign.eventId).get() : Promise.resolve(null),
      ]);
      recentCampaigns.push({
        id: doc.id,
        brandName: brandSnap?.data()?.companyName ?? "—",
        eventName: eventSnap?.data()?.name ?? campaign.customEventName ?? "—",
        status: campaign.status ?? null,
        updatedAt: campaign.updatedAt?.toDate?.() ?? null,
      });
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents: UpcomingEventRow[] = eventsSnap.docs
    .map((doc) => {
      const e = doc.data();
      return { id: doc.id, name: e.name as string, city: e.city as string, date: e.date as string };
    })
    .filter((e) => e.date >= today)
    .slice(0, 5);

  return {
    brandCount: brandsSnap.data().count,
    runnerCount: runnersSnap.data().count,
    signedRevenue,
    recentCampaigns,
    upcomingEvents,
  };
}
