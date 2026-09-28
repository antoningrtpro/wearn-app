"use client";

import { useMemo, useState } from "react";
import { Search, Download } from "lucide-react";
import { InitialsAvatar } from "@/components/admin/initials-avatar";
import { AdminCard } from "@/components/admin/admin-card";
import { CampaignDetailPanel } from "@/components/admin/campaign-detail-panel";
import {
  CAMPAIGN_STATUS_DOT_CLASS,
  CAMPAIGN_STATUS_LABELS,
  campaignStatusKey,
} from "@/lib/utils/campaign-status";
import { cn } from "@/lib/cn";

export interface CampaignRow {
  id: string;
  brandName: string;
  status: string | null;
  quoteValue: number;
  city: string;
  updatedLabel: string;
}

const TABS = ["all", "draft", "quoted", "validated", "in_progress", "completed"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  all: "Tous statuts",
  draft: "Brouillon",
  quoted: "Devis envoyé",
  validated: "Validée",
  in_progress: "En cours",
  completed: "Terminée",
};

function formatEuro(amount: number): string {
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;
}

function exportCsv(rows: CampaignRow[]) {
  const header = ["Nom", "Statut", "Valeur devis", "Ville"];
  const lines = rows.map((r) => [
    r.brandName,
    CAMPAIGN_STATUS_LABELS[campaignStatusKey(r.status)],
    r.quoteValue.toFixed(2),
    r.city,
  ]);
  const csv = [header, ...lines]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "campagnes-wearn.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function CampaignsTable({ rows }: { rows: CampaignRow[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [openCampaignId, setOpenCampaignId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tab !== "all" && campaignStatusKey(r.status) !== tab) return false;
      if (search.trim() && !r.brandName.toLowerCase().includes(search.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [rows, tab, search]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-nested px-3 py-1.5 text-body transition-colors",
                tab === t ? "bg-admin-canvas font-medium text-ink" : "text-mid-gray hover:text-ink"
              )}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mid-gray" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher"
              className="h-9 w-48 rounded-inputs border border-hairline bg-paper pl-9 pr-3 text-body text-ink outline-none focus:border-ink"
            />
          </div>
          <button
            type="button"
            onClick={() => exportCsv(filtered)}
            className="flex h-9 items-center gap-2 rounded-inputs border border-hairline px-3 text-body text-ink hover:bg-ink/5"
          >
            <Download size={15} />
            Export
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {filtered.map((row) => {
          const statusKey = campaignStatusKey(row.status);
          return (
            <button key={row.id} type="button" onClick={() => setOpenCampaignId(row.id)} className="text-left">
              <AdminCard className="flex items-center gap-4 transition-colors hover:border-admin-accent/70">
                <InitialsAvatar name={row.brandName} />
                <span className="w-40 shrink-0 truncate text-body font-medium text-ink">{row.brandName}</span>
                <span className="flex w-36 shrink-0 items-center gap-2 text-body text-ink">
                  <span className={cn("h-2 w-2 rounded-full", CAMPAIGN_STATUS_DOT_CLASS[statusKey])} />
                  {CAMPAIGN_STATUS_LABELS[statusKey]}
                </span>
                <span className="w-24 shrink-0 text-body text-ink">
                  {row.quoteValue > 0 ? formatEuro(row.quoteValue) : "—"}
                </span>
                <span className="w-28 shrink-0 truncate text-body text-mid-gray">{row.city}</span>
                <span className="ml-auto shrink-0 text-caption text-mid-gray">{row.updatedLabel}</span>
              </AdminCard>
            </button>
          );
        })}
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-body text-mid-gray">Aucune campagne pour ce filtre.</p>
        ) : null}
      </div>

      <CampaignDetailPanel campaignId={openCampaignId} onClose={() => setOpenCampaignId(null)} />
    </div>
  );
}
