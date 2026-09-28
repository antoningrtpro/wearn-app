import type { LucideIcon } from "lucide-react";
import { AdminCard } from "@/components/admin/admin-card";
import { TrendBadge } from "@/components/admin/trend-badge";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend: number | null;
}

export function StatCard({ icon: Icon, label, value, trend }: StatCardProps) {
  return (
    <AdminCard className="flex flex-col gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-nested bg-admin-accent-soft text-admin-accent">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="text-body text-mid-gray">{label}</span>
      <p className="text-heading font-bold tracking-heading text-ink">{value}</p>
      <TrendBadge value={trend} />
    </AdminCard>
  );
}
