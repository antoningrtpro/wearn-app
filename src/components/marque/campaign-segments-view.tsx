"use client";

import { useState } from "react";
import { placementLabel } from "@/lib/utils/placement-labels";
import { bracketLabel } from "@/lib/utils/runner-count-brackets";
import { cn } from "@/lib/cn";

const GENDER_LABELS: Record<string, string> = {
  tous: "Tous genres",
  homme: "Hommes",
  femme: "Femmes",
  autre: "Autre",
};

export interface SegmentViewData {
  id: string;
  placement: string;
  targetGender: string;
  targetAgeMin: number;
  targetAgeMax: number;
  requestedRunnerCountMin: number;
  requestedRunnerCountMax: number;
  validatedCount: number;
}

/**
 * Read-only counterpart to the admin's CampaignSegmentsTabs — same pill-tab
 * shell, but no payout form and no "choisir les coureurs" action, since a
 * brand can only view targeting, never manage it. The validated count is now
 * per-ciblage (this tab's own segment), not a single number summed across
 * every ciblage on the campaign.
 */
export function CampaignSegmentsView({ segments }: { segments: SegmentViewData[] }) {
  const [active, setActive] = useState(0);

  if (segments.length === 0) {
    return <p className="text-body text-mid-gray">Aucun ciblage.</p>;
  }

  const segment = segments[Math.min(active, segments.length - 1)];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1 self-start rounded-full border border-hairline bg-paper p-1">
        {segments.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "rounded-full px-3 py-1.5 text-body transition-colors",
              i === active ? "bg-admin-accent text-white" : "text-mid-gray hover:text-ink"
            )}
          >
            Ciblage {i + 1}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-admin-card bg-admin-canvas p-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-admin-accent-soft px-2.5 py-1 text-caption font-medium text-admin-accent">
              {placementLabel(segment.placement)}
            </span>
            <span className="text-body text-ink">
              {GENDER_LABELS[segment.targetGender] ?? segment.targetGender}
            </span>
            <span className="text-body text-mid-gray">
              · {segment.targetAgeMin}–{segment.targetAgeMax} ans
            </span>
          </div>
          <p className="mt-2 text-body text-mid-gray">
            Objectif : {bracketLabel(segment.requestedRunnerCountMin, segment.requestedRunnerCountMax)}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-nested bg-paper px-3 py-2 shadow-admin-card">
          <span className="text-body text-ink">Coureurs validés sur ce ciblage</span>
          <span className="text-body-lg font-semibold text-ink">{segment.validatedCount}</span>
        </div>
      </div>
    </div>
  );
}
