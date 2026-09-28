"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { updateSegmentPayout, type SegmentPayoutState } from "@/app/admin/campagnes/[id]/actions";
import { placementLabel } from "@/lib/utils/placement-labels";
import { bracketLabel } from "@/lib/utils/runner-count-brackets";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/brand-form/form-field";
import { cn } from "@/lib/cn";

const GENDER_LABELS: Record<string, string> = {
  tous: "Tous genres",
  homme: "Hommes",
  femme: "Femmes",
  autre: "Autre",
};

export interface SegmentTabData {
  id: string;
  placement: string;
  targetGender: string;
  targetAgeMin: number;
  targetAgeMax: number;
  requestedRunnerCountMin: number;
  requestedRunnerCountMax: number;
  runnerPayoutAmount: number | null;
  validatedCount: number;
}

const initialPayoutState: SegmentPayoutState = {};

function PayoutForm({
  campaignId,
  segmentId,
  runnerPayoutAmount,
  onSaved,
}: {
  campaignId: string;
  segmentId: string;
  runnerPayoutAmount: number | null;
  onSaved?: () => void;
}) {
  const boundAction = updateSegmentPayout.bind(null, campaignId, segmentId);
  const [state, formAction, pending] = useActionState(boundAction, initialPayoutState);

  useEffect(() => {
    if (state.success) onSaved?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <div className="flex flex-col gap-2 rounded-nested bg-paper p-3 shadow-admin-card">
      <span className="text-caption tracking-caption uppercase text-mid-gray">
        Rémunération par coureur
      </span>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <FormField label="Montant (€)">
          <Input
            name="runnerPayoutAmount"
            type="number"
            step="0.01"
            min={0}
            defaultValue={runnerPayoutAmount ?? ""}
            className="w-28"
          />
        </FormField>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "..." : "Enregistrer"}
        </Button>
        {state.error ? <span className="text-body text-ember">{state.error}</span> : null}
      </form>
      {runnerPayoutAmount == null ? (
        <p className="text-caption text-ember">
          À définir avant de pouvoir proposer des coureurs sur ce ciblage.
        </p>
      ) : (
        <p className="text-caption text-admin-positive">Versé à chaque coureur validé.</p>
      )}
    </div>
  );
}

export function CampaignSegmentsTabs({
  campaignId,
  segments,
  onSaved,
}: {
  campaignId: string;
  segments: SegmentTabData[];
  onSaved?: () => void;
}) {
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

        <PayoutForm
          campaignId={campaignId}
          segmentId={segment.id}
          runnerPayoutAmount={segment.runnerPayoutAmount}
          onSaved={onSaved}
        />

        <Link href={`/admin/campagnes/${campaignId}/segments/${segment.id}`}>
          <Button type="button" className="w-full justify-center">
            Choisir les coureurs
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
