import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import { getPublicEventsWithRaces } from "@/lib/server/events";
import { getAllCampaignsForRunner, buildAssignmentsByEvent } from "@/lib/server/runner-assignments";
import { MyEvents } from "@/components/runner/my-events";

export default async function CoureurEventsPage() {
  const session = await getSession();
  const [events, runnerSnap, campaigns] = session
    ? await Promise.all([
        getPublicEventsWithRaces(),
        adminDb.collection("runners").doc(session.uid).get(),
        getAllCampaignsForRunner(session.uid),
      ])
    : [[], null, []];

  const runner = runnerSnap?.data();
  const participatingEventIds: string[] = runner?.participatingEventIds ?? [];
  const eventRaceSelections: Record<string, string> = runner?.eventRaceSelections ?? {};
  const runnerName = runner ? `${runner.firstName ?? ""} ${runner.lastName ?? ""}`.trim() : "Un coureur";

  const assignmentsByEvent = buildAssignmentsByEvent(campaigns);

  return (
    <main className="mx-auto max-w-(--page-max-width) px-8 py-8">
      <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">
        Événements
      </h1>
      <p className="mt-1 text-body text-mid-gray">
        Cochez les événements auxquels vous participez pour que Wearn puisse vous proposer des
        campagnes ciblées. Si l&apos;événement propose plusieurs courses, vous devrez préciser
        laquelle.
      </p>
      <div className="mt-6">
        {session ? (
          <MyEvents
            runnerId={session.uid}
            runnerName={runnerName}
            events={events}
            participatingEventIds={participatingEventIds}
            eventRaceSelections={eventRaceSelections}
            assignmentsByEvent={assignmentsByEvent}
          />
        ) : null}
      </div>
    </main>
  );
}
