import Link from "next/link";
import { Building2, Users, Wallet } from "lucide-react";
import { getDashboardSummary } from "@/lib/server/admin-dashboard";
import { getUnreadAdminNotifications } from "@/lib/server/admin-notifications";
import { StatCard } from "@/components/admin/stat-card";
import { AdminDashboardLists } from "@/components/admin/admin-dashboard-lists";
import { AdminNotificationsList } from "@/components/admin/admin-notifications-list";

function formatEuro(amount: number): string {
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export default async function AdminDashboardPage() {
  const [data, notifications] = await Promise.all([getDashboardSummary(), getUnreadAdminNotifications()]);

  return (
    <main className="mx-auto max-w-(--page-max-width) px-8 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">
          Vue d&apos;ensemble
        </h1>
        <Link href="/admin/campagnes">
          <span className="inline-flex h-10 items-center gap-2 rounded-buttons bg-admin-accent px-4 text-body font-medium text-white transition-colors hover:bg-admin-accent-hover">
            Voir les campagnes
          </span>
        </Link>
      </div>

      {notifications.length > 0 ? (
        <div className="mt-8">
          <AdminNotificationsList notifications={notifications} />
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Building2} label="Marques" value={String(data.brandCount)} trend={null} />
        <StatCard icon={Users} label="Coureurs" value={String(data.runnerCount)} trend={null} />
        <StatCard
          icon={Wallet}
          label="Revenu généré (devis signés)"
          value={formatEuro(data.signedRevenue)}
          trend={null}
        />
      </div>

      <AdminDashboardLists recentCampaigns={data.recentCampaigns} upcomingEvents={data.upcomingEvents} />
    </main>
  );
}
