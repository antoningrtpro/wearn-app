import { redirect } from "next/navigation";
import { getSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { NewCampaignButton } from "@/components/marque/new-campaign-button";
import { MarqueCampaignsView } from "@/components/marque/marque-campaigns-view";
import { getPublicEventsWithRaces } from "@/lib/server/events";
import { getPlatformConfig } from "@/lib/server/platform-config";

export default async function MarqueDashboardPage() {
  const session = await getSession();
  if (!session?.brandId) redirect("/");

  const [campaignsSnap, events, config] = await Promise.all([
    adminDb
      .collection("campaigns")
      .where("brandId", "==", session.brandId)
      .orderBy("createdAt", "desc")
      .get(),
    getPublicEventsWithRaces(),
    getPlatformConfig(),
  ]);

  const rows = await Promise.all(
    campaignsSnap.docs.map(async (doc) => {
      const data = doc.data();
      const eventSnap = data.eventId ? await adminDb.collection("events").doc(data.eventId).get() : null;
      return {
        id: doc.id,
        status: data.status as string | null,
        eventName: eventSnap?.data()?.name ?? data.customEventName ?? "—",
        createdAt: data.createdAt?.toDate?.() ?? null,
      };
    })
  );

  return (
    <main className="mx-auto max-w-(--page-max-width) px-8 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">
            Vos campagnes
          </h1>
          <p className="mt-2 text-body text-mid-gray">
            {rows.length} campagne(s) au total.
          </p>
        </div>
        <NewCampaignButton events={events} placements={config.placements} />
      </div>

      <MarqueCampaignsView rows={rows} />
    </main>
  );
}
