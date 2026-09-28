"use client";

import { useActionState, useState, useTransition } from "react";
import { X } from "lucide-react";
import { addPlacement, removePlacement, type PlacementsState } from "@/app/admin/parametres-globaux/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const initialState: PlacementsState = {};

export function PlacementsManager({ placements }: { placements: string[] }) {
  const [state, formAction, pending] = useActionState(addPlacement, initialState);
  const [removingError, setRemovingError] = useState<string | null>(null);
  const [isRemoving, startRemoving] = useTransition();

  function handleRemove(placement: string) {
    setRemovingError(null);
    startRemoving(async () => {
      const result = await removePlacement(placement);
      if (result.error) setRemovingError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {placements.map((placement) => (
          <Badge key={placement} variant="soft" className="flex items-center gap-1.5">
            {placement}
            <button
              type="button"
              onClick={() => handleRemove(placement)}
              disabled={isRemoving}
              aria-label={`Supprimer ${placement}`}
              className="text-mid-gray hover:text-ember"
            >
              <X size={12} />
            </button>
          </Badge>
        ))}
      </div>
      {removingError ? <p className="text-body text-ember">{removingError}</p> : null}

      <form action={formAction} className="flex items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-caption tracking-caption uppercase text-mid-gray">
            Nouvel emplacement
          </span>
          <Input name="placement" placeholder="Ex. Casquette" className="w-56" />
        </label>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "..." : "Ajouter"}
        </Button>
      </form>
      {state.error ? <p className="text-body text-ember">{state.error}</p> : null}
    </div>
  );
}
