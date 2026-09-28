import { adminDb } from "@/lib/firebase/admin";
import { getPublicEventsWithRaces } from "@/lib/server/events";
import { getPlatformConfig } from "@/lib/server/platform-config";
import { CampaignsTable, type CampaignRow } from "@/components/admin/campaigns-table";
import { AdminCampaignForm } from "@/components/admin/admin-campaign-form";
import { relativeTime } from "@/lib/utils/relative-time";

export default async function CampaignsListPage() {
  const [snap, brandsSnap, events, config] = await Promise.all([
    adminDb.collection("campaigns").orderBy("createdAt", "desc").get(),
    adminDb.collection("brands").orderBy("companyName", "asc").get(),
    getPublicEventsWithRaces(),
    getPlatformConfig(),
  ]);

  const brands = brandsSnap.docs.map((doc) => ({
    id: doc.id,
    companyName: doc.data().companyName as string,
  }));

  const rows: CampaignRow[] = await Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data();

      const [brandSnap, eventSnap] = await Promise.all([
        data.brandId ? adminDb.collection("brands").doc(data.brandId).get() : Promise.resolve(null),
        data.eventId ? adminDb.collection("events").doc(data.eventId).get() : Promise.resolve(null),
      ]);

      const quoteValue = typeof data.quoteAmount === "number" ? data.quoteAmount : 0;
      const updatedAt: Date = data.updatedAt?.toDate?.() ?? data.createdAt?.toDate?.() ?? new Date();

      return {
        id: doc.id,
        brandName: brandSnap?.data()?.companyName ?? "—",
        status: data.status as string | null,
        quoteValue,
        city: eventSnap?.data()?.city ?? data.customEventName ?? "—",
        updatedLabel: relativeTime(updatedAt),
      };
    })
  );

  return (
    <main className="mx-auto max-w-(--page-max-width) px-8 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">Campagnes</h1>
          <p className="mt-1 text-body text-mid-gray">{rows.length} campagne(s) au total.</p>
        </div>
        <AdminCampaignForm brands={brands} events={events} placements={config.placements} />
      </div>

      <div className="mt-8">
        <CampaignsTable rows={rows} />
      </div>
    </main>
  );
}
