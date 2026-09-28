import { redirect } from "next/navigation";
import { getSession } from "@/lib/firebase/session";
import { getPublicEventsWithRaces } from "@/lib/server/events";
import { getPlatformConfig } from "@/lib/server/platform-config";
import { MarqueEventsView } from "@/components/marque/marque-events-view";

export default async function MarqueEvenementsPage() {
  const session = await getSession();
  if (!session?.brandId) redirect("/");

  const [events, config] = await Promise.all([getPublicEventsWithRaces(), getPlatformConfig()]);

  return (
    <main className="mx-auto max-w-(--page-max-width) px-8 py-8">
      <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">Événements</h1>
      <p className="mt-1 text-body text-mid-gray">
        {events.length} événement(s) — créez une campagne directement depuis un événement.
      </p>

      <div className="mt-6">
        <MarqueEventsView events={events} placements={config.placements} />
      </div>
    </main>
  );
}
