"use client";

import { useActionState, useState } from "react";
import { proposeRunners, type ProposeRunnersState } from "@/app/admin/campagnes/[id]/segments/[segmentId]/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { AdminCard as Card } from "@/components/admin/admin-card";
import { Checkbox } from "@/components/ui/checkbox";
import { ViewToggle } from "@/components/shared/view-toggle";
import { placementLabel } from "@/lib/utils/placement-labels";
import type { RunnerRow } from "@/lib/server/runners";

interface ShortlistFormProps {
  campaignId: string;
  segmentId: string;
  runners: RunnerRow[];
  alreadyProposedIds: Set<string>;
}

const initialState: ProposeRunnersState = {};

function PlacementChips({ placements }: { placements: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-1">
      {placements.map((p) => (
        <span key={p} className="rounded-full bg-admin-canvas px-2 py-0.5 text-caption text-mid-gray">
          {placementLabel(p)}
        </span>
      ))}
    </div>
  );
}

export function ShortlistForm({ campaignId, segmentId, runners, alreadyProposedIds }: ShortlistFormProps) {
  const boundAction = proposeRunners.bind(null, campaignId, segmentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [view, setView] = useState<"card" | "list">("list");

  const allProposed = runners.length > 0 && runners.every((r) => alreadyProposedIds.has(r.id));

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewToggle view={view} onChange={setView} />

        <div className="flex items-center gap-3">
          {state.error ? <span className="text-body text-ember">{state.error}</span> : null}
          {state.success ? (
            <span className="text-body text-admin-positive">
              {state.proposedCount ?? 0} coureur(s) validé(s).
            </span>
          ) : null}
          <Button type="submit" disabled={pending || allProposed}>
            {pending ? "..." : "Proposer les coureurs sélectionnés"}
          </Button>
        </div>
      </div>

      {view === "card" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {runners.map((runner) => {
            const alreadyProposed = alreadyProposedIds.has(runner.id);
            return (
              <Card key={runner.id} className="flex flex-col items-center gap-2 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={runner.profilePhotoUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-body font-medium text-ink">
                    {runner.firstName} {runner.lastName}
                  </p>
                  <p className="text-caption text-mid-gray">
                    {runner.age ?? "?"} ans · {runner.gender}
                  </p>
                </div>
                <PlacementChips placements={runner.acceptedPlacements} />
                {alreadyProposed ? (
                  <span className="text-caption font-medium text-admin-positive">Déjà validé</span>
                ) : (
                  <Checkbox name="runnerIds" value={runner.id} />
                )}
              </Card>
            );
          })}
          {runners.length === 0 ? (
            <p className="col-span-full text-body text-mid-gray">Aucun coureur ne correspond à ces filtres.</p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {runners.map((runner) => {
            const alreadyProposed = alreadyProposedIds.has(runner.id);
            return (
              <Card key={runner.id} className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={runner.profilePhotoUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-lg font-medium text-ink">
                    {runner.firstName} {runner.lastName}
                  </p>
                  <p className="text-body text-mid-gray">
                    {runner.age ?? "?"} ans · {runner.gender}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {runner.acceptedPlacements.map((p) => (
                    <span key={p} className="rounded-full bg-admin-canvas px-2 py-0.5 text-caption text-mid-gray">
                      {placementLabel(p)}
                    </span>
                  ))}
                </div>
                {alreadyProposed ? (
                  <span className="shrink-0 text-caption font-medium text-admin-positive">Déjà validé</span>
                ) : (
                  <Checkbox name="runnerIds" value={runner.id} />
                )}
              </Card>
            );
          })}
          {runners.length === 0 ? (
            <p className="text-body text-mid-gray">Aucun coureur ne correspond à ces filtres.</p>
          ) : null}
        </div>
      )}
    </form>
  );
}
