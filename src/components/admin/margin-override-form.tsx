"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import {
  updateCommissionOverride,
  type MarginOverrideState,
} from "@/app/admin/campagnes/[id]/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/brand-form/form-field";

interface MarginOverrideFormProps {
  campaignId: string;
  defaultValue: number | null;
  /** Platform default rate (0–1), shown as the effective value when no
   * override is set on this campaign. */
  platformDefaultRate: number | null;
}

const initialState: MarginOverrideState = {};

export function MarginOverrideForm({ campaignId, defaultValue, platformDefaultRate }: MarginOverrideFormProps) {
  const boundAction = updateCommissionOverride.bind(null, campaignId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <div className="flex flex-col gap-3 rounded-nested bg-admin-canvas p-4 [&_input]:bg-paper">
      <div className="flex items-center gap-1.5">
        <Lock size={13} className="text-mid-gray" strokeWidth={2.5} />
        <span className="text-caption tracking-caption uppercase text-mid-gray">
          Confidentiel — admin uniquement
        </span>
      </div>
      <p className="text-body text-mid-gray">
        Par défaut :{" "}
        {platformDefaultRate != null ? `${Math.round(platformDefaultRate * 100)} %` : "non défini"} (paramètres
        globaux). Laissez vide pour garder ce taux, ou renseignez une valeur pour cette campagne
        uniquement.
      </p>

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <FormField label="Taux pour cette campagne">
          <Input
            name="commissionRateOverride"
            type="number"
            step="0.01"
            min={0}
            max={1}
            placeholder="Taux par défaut"
            defaultValue={defaultValue ?? ""}
            className="w-40"
          />
        </FormField>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "..." : "Enregistrer"}
        </Button>
      </form>

      {state.error ? <p className="text-body text-ember">{state.error}</p> : null}
      {state.success ? <p className="text-body text-admin-positive">Enregistré.</p> : null}
    </div>
  );
}
