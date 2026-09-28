"use client";

import { useState } from "react";
import { AdminCard as Card } from "@/components/admin/admin-card";
import { MyProposals } from "@/components/runner/my-proposals";
import { ActiveAssignments } from "@/components/runner/active-assignments";
import { CampaignDetailPanel } from "@/components/runner/campaign-detail-panel";
import { ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUS_DOT_CLASS } from "@/lib/utils/assignment-status";
import { cn } from "@/lib/cn";
import type { RunnerCampaignRow } from "@/lib/types/runner-view";

const TABS = ["pending", "active", "history"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  pending: "En attente de réponse",
  active: "En cours",
  history: "Historique",
};

interface RunnerCampaignsViewProps {
  pendingReview: RunnerCampaignRow[];
  active: RunnerCampaignRow[];
  history: RunnerCampaignRow[];
}

export function RunnerCampaignsView({ pendingReview, active, history }: RunnerCampaignsViewProps) {
  const [tab, setTab] = useState<Tab>(pendingReview.length > 0 ? "pending" : active.length > 0 ? "active" : "history");
  const [selected, setSelected] = useState<RunnerCampaignRow | null>(null);

  const counts: Record<Tab, number> = {
    pending: pendingReview.length,
    active: active.length,
    history: history.length,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-1 self-start rounded-full border border-hairline bg-paper p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-body font-medium transition-colors",
              tab === t ? "bg-admin-accent text-white shadow-admin-card" : "text-mid-gray hover:text-ink"
            )}
          >
            {TAB_LABELS[t]}
            <span
              className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-caption font-semibold",
                tab === t ? "bg-white/20 text-white" : "bg-admin-canvas text-mid-gray"
              )}
            >
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {tab === "pending" ? <MyProposals proposals={pendingReview} onDetails={setSelected} /> : null}

      {tab === "active" ? <ActiveAssignments assignments={active} onDetails={setSelected} /> : null}

      {tab === "history" ? (
        <div className="flex flex-col gap-3">
          {history.map((row) => (
            <Card
              key={row.assignmentId}
              onClick={() => setSelected(row)}
              className="flex cursor-pointer items-center justify-between gap-4 transition-colors hover:border-admin-accent/70"
            >
              <div className="min-w-0">
                <p className="truncate text-body-lg font-medium text-ink">{row.eventName}</p>
                <p className="truncate text-body text-mid-gray">
                  {row.eventCity}
                  {row.eventDate ? ` · ${new Date(row.eventDate).toLocaleDateString("fr-FR")}` : ""}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 text-caption text-mid-gray">
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", ASSIGNMENT_STATUS_DOT_CLASS[row.status] ?? "bg-mid-gray")}
                />
                {ASSIGNMENT_STATUS_LABELS[row.status] ?? row.status}
              </span>
            </Card>
          ))}
          {history.length === 0 ? (
            <p className="text-body text-mid-gray">Aucun historique pour le moment.</p>
          ) : null}
        </div>
      ) : null}

      <CampaignDetailPanel row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
