"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import {
  updateDefaultCommissionRate,
  type PlatformConfigState,
} from "@/app/admin/parametres-globaux/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";

interface PlatformConfigFormProps {
  currentRate: number | null;
}

const initialState: PlatformConfigState = {};

export function PlatformConfigForm({ currentRate }: PlatformConfigFormProps) {
  const [state, formAction, pending] = useActionState(updateDefaultCommissionRate, initialState);

  return (
    <div className="rounded-admin-card border border-ember/30 bg-ember/5 p-5 shadow-admin-card">
      <div className="flex items-center gap-1.5">
        <Lock size={14} className="text-ember" strokeWidth={2.5} />
        <span className="text-caption tracking-caption uppercase text-ember font-medium">
          Confidentiel — admin uniquement
        </span>
      </div>

      <h2 className="mt-2 text-body-lg font-medium text-ink">Commission par défaut</h2>
      <p className="mt-1 max-w-md text-body text-mid-gray">
        Taux appliqué à toute campagne sans override spécifique. Jamais exposé côté marque ou
        coureur — seuls le prix marque et la rémunération déjà calculée le sont.
      </p>

      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-caption tracking-caption uppercase text-mid-gray">
            Taux (0 à 1)
          </span>
          <Input
            name="defaultCommissionRate"
            type="number"
            step="0.01"
            min={0}
            max={1}
            required
            defaultValue={currentRate ?? ""}
            className="w-40 border border-ember/20 bg-paper"
          />
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "..." : "Enregistrer"}
        </Button>
      </form>

      {state.error ? <p className="mt-2 text-body text-ember">{state.error}</p> : null}
      {state.success ? <p className="mt-2 text-body text-mid-gray">Enregistré.</p> : null}
    </div>
  );
}
