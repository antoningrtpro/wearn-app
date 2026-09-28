"use client";

import { SidePanel } from "@/components/admin/side-panel";
import { placementLabel } from "@/lib/utils/placement-labels";
import { ASSIGNMENT_STATUS_LABELS, ASSIGNMENT_STATUS_DOT_CLASS } from "@/lib/utils/assignment-status";
import { cn } from "@/lib/cn";
import type { RunnerCampaignRow } from "@/lib/types/runner-view";

const GENDER_LABELS: Record<string, string> = {
  homme: "Hommes",
  femme: "Femmes",
  autre: "Autre",
  tous: "Tous genres",
};

interface CampaignDetailPanelProps {
  row: RunnerCampaignRow | null;
  onClose: () => void;
}

export function CampaignDetailPanel({ row, onClose }: CampaignDetailPanelProps) {
  return (
    <SidePanel
      open={row !== null}
      onClose={onClose}
      title={row?.eventName ?? "Campagne"}
      subtitle={
        row
          ? `${row.eventCity}${row.eventDate ? ` · ${new Date(row.eventDate).toLocaleDateString("fr-FR")}` : ""}`
          : undefined
      }
      headerActions={
        row ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-admin-canvas px-2.5 py-1.5 text-caption font-medium text-ink">
            <span className={cn("h-1.5 w-1.5 rounded-full", ASSIGNMENT_STATUS_DOT_CLASS[row.status] ?? "bg-mid-gray")} />
            {ASSIGNMENT_STATUS_LABELS[row.status] ?? row.status}
          </span>
        ) : null
      }
    >
      {row ? (
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-caption tracking-caption uppercase text-mid-gray">Emplacement</span>
            <p className="mt-1 text-body text-ink">{placementLabel(row.placement)}</p>
          </div>
          <div>
            <span className="text-caption tracking-caption uppercase text-mid-gray">
              Ciblage de la marque
            </span>
            <p className="mt-1 text-body text-ink">
              {GENDER_LABELS[row.targetGender] ?? row.targetGender} · {row.targetAgeMin}–
              {row.targetAgeMax} ans
            </p>
          </div>
          <div className="rounded-nested bg-admin-canvas px-3 py-2">
            <span className="text-caption tracking-caption uppercase text-mid-gray">
              Votre rémunération
            </span>
            <p className="mt-1 text-body-lg font-semibold text-ink">
              {row.runnerPayoutAmount != null ? `${row.runnerPayoutAmount.toFixed(2)} €` : "—"}
            </p>
          </div>
          {row.proofPhotoUrl ? (
            <div>
              <span className="text-caption tracking-caption uppercase text-mid-gray">
                Preuve envoyée
              </span>
              <div className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.proofPhotoUrl}
                  alt="Preuve envoyée"
                  className="max-h-64 rounded-nested border border-hairline object-cover"
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </SidePanel>
  );
}
