import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { getAllCampaignsForRunner, buildAssignmentsByEvent } from "@/lib/server/runner-assignments";
import { getPublicEventsWithRaces } from "@/lib/server/events";
import type { RunnerAssignmentRef } from "@/components/runner/my-events";
import type { PublicEventWithRaces } from "@/lib/types/public";

const ACTIVE_STATUSES = new Set([
  "validated_by_runner",
  "sticker_confirmed",
  "proof_submitted",
  "proof_approved",
  "paid",
]);
const HISTORY_STATUSES = new Set(["refused_by_brand", "declined_by_runner", "no_show"]);
/** Active but not yet paid out — "rémunération à venir". */
const UPCOMING_PAYOUT_STATUSES = new Set([
  "validated_by_runner",
  "sticker_confirmed",
  "proof_submitted",
  "proof_approved",
]);

/** A "Mes participations" row is either a real campaign assignment, or —
 * when the runner has just ticked "je participe" on an event that has no
 * campaign yet — a lightweight stand-in built straight from the public
 * event, status "participating". */
export interface RunnerParticipationRow {
  key: string;
  eventName: string;
  eventCity: string;
  eventDate: string;
  raceName: string | null;
  status: string;
  href: string;
}

export interface RunnerDashboardSummary {
  pendingCount: number;
  activeCount: number;
  historyCount: number;
  upcomingPayout: number;
  totalReceived: number;
  recentParticipations: RunnerParticipationRow[];
  upcomingEvents: PublicEventWithRaces[];
  runnerName: string;
  participatingEventIds: string[];
  eventRaceSelections: Record<string, string>;
  assignmentsByEvent: Record<string, RunnerAssignmentRef>;
}

export async function getRunnerDashboardSummary(runnerId: string): Promise<RunnerDashboardSummary> {
  const [rows, runnerSnap, events] = await Promise.all([
    getAllCampaignsForRunner(runnerId),
    adminDb.collection("runners").doc(runnerId).get(),
    getPublicEventsWithRaces(),
  ]);

  let pendingCount = 0;
  let activeCount = 0;
  let historyCount = 0;
  let upcomingPayout = 0;
  let totalReceived = 0;

  for (const row of rows) {
    if (row.status === "validated_by_brand") pendingCount++;
    else if (ACTIVE_STATUSES.has(row.status)) activeCount++;
    else if (HISTORY_STATUSES.has(row.status)) historyCount++;

    if (UPCOMING_PAYOUT_STATUSES.has(row.status)) upcomingPayout += row.runnerPayoutAmount ?? 0;
    if (row.status === "paid") totalReceived += row.runnerPayoutAmount ?? 0;
  }

  const runner = runnerSnap.data();
  const participatingEventIds: string[] = runner?.participatingEventIds ?? [];
  const eventRaceSelections: Record<string, string> = runner?.eventRaceSelections ?? {};
  const runnerName = runner ? `${runner.firstName ?? ""} ${runner.lastName ?? ""}`.trim() : "Un coureur";

  // Every campaign assignment is a participation row...
  const campaignRowsAsParticipation: RunnerParticipationRow[] = rows.map((row) => ({
    key: row.assignmentId,
    eventName: row.eventName,
    eventCity: row.eventCity,
    eventDate: row.eventDate,
    raceName: row.raceName,
    status: row.status,
    href: "/coureur/campagnes",
  }));
  // ...and so is a plain "je participe" with no campaign behind it yet — an
  // event checked from the dashboard/evenements page should show up here
  // right away, not only once a campaign gets built around it.
  const eventsWithCampaign = new Set(rows.map((row) => row.eventId).filter(Boolean));
  const eventById = new Map(events.map((e) => [e.id, e]));
  const participationOnlyRows: RunnerParticipationRow[] = participatingEventIds
    .filter((eventId) => !eventsWithCampaign.has(eventId))
    .map((eventId) => eventById.get(eventId))
    .filter((event): event is PublicEventWithRaces => event !== undefined)
    .map((event) => ({
      key: `participating-${event.id}`,
      eventName: event.name,
      eventCity: event.city,
      eventDate: event.date,
      raceName: event.races.find((race) => race.id === eventRaceSelections[event.id])?.name ?? null,
      status: "participating",
      href: "/coureur/evenements",
    }));

  const recentParticipations = [...campaignRowsAsParticipation, ...participationOnlyRows]
    .sort((a, b) => (b.eventDate || "").localeCompare(a.eventDate || ""))
    .slice(0, 5);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return {
    pendingCount,
    activeCount,
    historyCount,
    upcomingPayout,
    totalReceived,
    recentParticipations,
    upcomingEvents,
    runnerName,
    participatingEventIds,
    eventRaceSelections,
    assignmentsByEvent: buildAssignmentsByEvent(rows),
  };
}
