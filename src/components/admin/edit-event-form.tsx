"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { updateEvent, type UpdateEventState } from "@/app/admin/evenements/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/admin/modal";
import { FormField } from "@/components/brand-form/form-field";
import type { PublicEvent } from "@/lib/types/public";

interface EditEventFormProps {
  event: PublicEvent;
  onSuccess?: () => void;
}

const initialState: UpdateEventState = {};

function EditEventModalContent({
  event,
  onClose,
}: Omit<EditEventFormProps, "onSuccess"> & { onClose: () => void }) {
  const boundAction = updateEvent.bind(null, event.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink">Événement modifié.</p>
        <Button type="button" variant="outline" className="self-start" onClick={onClose}>
          Fermer
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 rounded-nested bg-admin-canvas p-4 [&_input]:bg-paper sm:grid-cols-2">
      <FormField label="Nom">
        <Input name="name" defaultValue={event.name} required />
      </FormField>
      <FormField label="Ville">
        <Input name="city" defaultValue={event.city} required />
      </FormField>
      <FormField label="Date">
        <Input name="date" type="date" defaultValue={event.date} required />
      </FormField>
      <FormField label="Distance (km, optionnel)">
        <Input name="distanceKm" type="number" step="0.1" min={0} defaultValue={event.distanceKm ?? ""} />
      </FormField>
      <FormField label="Participants estimés">
        <Input
          name="estimatedParticipants"
          type="number"
          min={1}
          defaultValue={event.estimatedParticipants}
          required
        />
      </FormField>
      {state.error ? <p className="text-body text-ember sm:col-span-2">{state.error}</p> : null}
      <div className="flex items-end sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

export function EditEventForm({ event, onSuccess }: EditEventFormProps) {
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setInstanceKey((k) => k + 1);
          setOpen(true);
        }}
      >
        <Pencil size={14} />
        Modifier
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Modifier l'événement" className="max-w-xl">
        <EditEventModalContent
          key={instanceKey}
          event={event}
          onClose={() => {
            onSuccess?.();
            setOpen(false);
          }}
        />
      </Modal>
    </>
  );
}
