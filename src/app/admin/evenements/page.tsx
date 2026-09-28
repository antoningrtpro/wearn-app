import { getPublicEventsWithRaces } from "@/lib/server/events";
import { AdminEventsView } from "@/components/admin/admin-events-view";

export default async function AdminEventsPage() {
  const events = await getPublicEventsWithRaces();

  return (
    <main className="mx-auto max-w-(--page-max-width) px-8 py-8">
      <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">Événements</h1>
      <p className="mt-1 text-body text-mid-gray">
        {events.length} événement(s) — cliquez sur un événement pour voir les coureurs participants.
      </p>

      <div className="mt-6">
        <AdminEventsView events={events} />
      </div>
    </main>
  );
}
