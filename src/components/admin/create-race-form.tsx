"use client";

import { useActionState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { createRace, type CreateRaceState } from "@/app/admin/evenements/[id]/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/brand-form/form-field";

const initialState: CreateRaceState = {};

export function CreateRaceForm({ eventId, onSuccess }: { eventId: string; onSuccess?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = createRace.bind(null, eventId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <FormField label="Nom">
          <Input name="name" placeholder="Ex. 10 km" required />
        </FormField>
      </div>
      <div className="w-24 shrink-0">
        <FormField label="Distance (km)">
          <Input name="distanceKm" type="number" step="0.1" min={0} required />
        </FormField>
      </div>
      <Button
        type="submit"
        disabled={pending}
        aria-label="Ajouter la course"
        className="shrink-0 px-3"
      >
        {pending ? "..." : <Plus size={16} />}
      </Button>
      {state.error ? <p className="w-full text-body text-ember">{state.error}</p> : null}
    </form>
  );
}
