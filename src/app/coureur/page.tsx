import Link from "next/link";
import { Clock, PlayCircle, CheckCircle2, Wallet, PiggyBank } from "lucide-react";
import { getSession } from "@/lib/firebase/session";
import { getRunnerDashboardSummary } from "@/lib/server/runner-dashboard";
import { StatCard } from "@/components/admin/stat-card";
import { AdminCard } from "@/components/admin/admin-card";
import { MyEvents } from "@/components/runner/my-events";
import { ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUS_DOT_CLASS } from "@/lib/utils/assignment-status";
import { cn } from "@/lib/cn";

function formatEuro(amount: number): string {
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export default async function CoureurDashboardPage() {
  const session = await getSession();
  const data = await getRunnerDashboardSummary(session!.uid);

  return (
    <main className="mx-auto max-w-(--page-max-width) px-8 py-8">
      <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">Tableau de bord</h1>
      <p className="mt-1 text-body text-mid-gray">
        Vue d&apos;ensemble de vos campagnes et de votre rémunération.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Clock} label="En attente de réponse" value={String(data.pendingCount)} trend={null} />
        <StatCard icon={PlayCircle} label="En cours" value={String(data.activeCount)} trend={null} />
        <StatCard icon={CheckCircle2} label="Terminées" value={String(data.historyCount)} trend={null} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={Wallet} label="Rémunération à venir" value={formatEuro(data.upcomingPayout)} trend={null} />
        <StatCard icon={PiggyBank} label="Rémunération perçue" value={formatEuro(data.totalReceived)} trend={null} />
      </div>

      <div className="mt-10 flex flex-col gap-8">
        <div>
          <h2 className="text-body-lg font-semibold text-ink">Mes participations</h2>
          <div className="mt-4 flex flex-col gap-2">
            {data.recentParticipations.map((row) => (
              <Link key={row.key} href={row.href}>
                <AdminCard className="flex items-center justify-between gap-3 transition-colors hover:border-admin-accent/70">
                  <div className="min-w-0">
                    <p className="truncate text-body font-medium text-ink">{row.eventName}</p>
                    <p className="truncate text-caption text-mid-gray">
                      {row.eventCity}
                      {row.eventDate ? ` · ${new Date(row.eventDate).toLocaleDateString("fr-FR")}` : ""}
                      {row.raceName ? ` · ${row.raceName}` : ""}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-caption text-mid-gray">
                    <span
                      className={cn("h-1.5 w-1.5 rounded-full", ASSIGNMENT_STATUS_DOT_CLASS[row.status] ?? "bg-mid-gray")}
                    />
                    {ASSIGNMENT_STATUS_LABELS[row.status] ?? row.status}
                  </span>
                </AdminCard>
              </Link>
            ))}
            {data.recentParticipations.length === 0 ? (
              <p className="text-body text-mid-gray">Aucune participation pour le moment.</p>
            ) : null}
          </div>
        </div>

        <div>
          <h2 className="text-body-lg font-semibold text-ink">Événements à venir</h2>
          <div className="mt-4">
            <MyEvents
              runnerId={session!.uid}
              runnerName={data.runnerName}
              events={data.upcomingEvents}
              participatingEventIds={data.participatingEventIds}
              eventRaceSelections={data.eventRaceSelections}
              assignmentsByEvent={data.assignmentsByEvent}
              compact
              emptyMessage="Aucun événement à venir."
            />
          </div>
        </div>
      </div>
    </main>
  );
}
