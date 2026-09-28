"use client";

import { useState } from "react";
import { AdminCard as Card } from "@/components/admin/admin-card";
import { RunnerDetailPanel } from "@/components/admin/runner-detail-panel";
import { RunnerFilterForm, type RunnerFilterFormValues } from "@/components/admin/runner-filter-form";
import { ViewToggle } from "@/components/shared/view-toggle";
import type { RunnerRow } from "@/lib/server/runners";

interface AdminCoureursViewProps {
  runners: RunnerRow[];
  placements: string[];
  filterAction: string;
  filterDefaultValues: RunnerFilterFormValues;
  filterResetHref: string;
}

export function AdminCoureursView({
  runners,
  placements,
  filterAction,
  filterDefaultValues,
  filterResetHref,
}: AdminCoureursViewProps) {
  const [view, setView] = useState<"card" | "list">("card");
  const [openRunnerId, setOpenRunnerId] = useState<string | null>(null);
  const openRunner = runners.find((r) => r.id === openRunnerId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <RunnerFilterForm
        action={filterAction}
        defaultValues={filterDefaultValues}
        resetHref={filterResetHref}
        hasEvent={false}
        placements={placements}
        viewToggle={<ViewToggle view={view} onChange={setView} />}
      />

      {runners.length === 0 ? (
        <p className="text-body text-mid-gray">Aucun coureur ne correspond à ces filtres.</p>
      ) : view === "card" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {runners.map((runner) => (
            <button key={runner.id} type="button" onClick={() => setOpenRunnerId(runner.id)} className="text-left">
              <Card className="flex flex-col items-center gap-2 p-4 text-center transition-colors hover:border-admin-accent/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={runner.profilePhotoUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-body font-medium text-ink">
                    {runner.firstName} {runner.lastName}
                  </p>
                  <p className="truncate text-caption text-mid-gray">{runner.email}</p>
                  <p className="text-caption text-mid-gray">{runner.phone}</p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {runners.map((runner) => (
            <button key={runner.id} type="button" onClick={() => setOpenRunnerId(runner.id)} className="w-full text-left">
              <Card className="flex items-center gap-4 transition-colors hover:border-admin-accent/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={runner.profilePhotoUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-lg font-medium text-ink">
                    {runner.firstName} {runner.lastName}
                  </p>
                  <p className="truncate text-body text-mid-gray">
                    {runner.email} · {runner.phone}
                  </p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      <RunnerDetailPanel runner={openRunner} placements={placements} onClose={() => setOpenRunnerId(null)} />
    </div>
  );
}
