"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createEvent, type CreateEventState } from "@/app/admin/evenements/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/admin/modal";
import { FormField } from "@/components/brand-form/form-field";

const initialState: CreateEventState = {};

interface QuickRace {
  name: string;
  distanceKm: string;
}

function CreateEventModalContent({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createEvent, initialState);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState(false);
  const [races, setRaces] = useState<QuickRace[]>([]);

  function updateRace(index: number, patch: Partial<QuickRace>) {
    setRaces((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  if (state.success) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink">Événement créé.</p>
        <Button type="button" variant="outline" className="self-start" onClick={onClose}>
          Fermer
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input
        type="hidden"
        name="quickRacesJson"
        value={JSON.stringify(races.filter((r) => r.name.trim() && r.distanceKm))}
        readOnly
      />

      <div className="grid grid-cols-1 gap-4 rounded-nested bg-admin-canvas p-4 [&_input]:bg-paper sm:grid-cols-2">
        <FormField label="Nom">
          <Input name="name" required />
        </FormField>
        <FormField label="Ville">
          <Input name="city" required />
        </FormField>
        <FormField label="Date">
          <Input name="date" type="date" required />
        </FormField>
        <FormField label="Distance (km, optionnel)">
          <Input name="distanceKm" type="number" step="0.1" min={0} placeholder="Ex. 10" />
        </FormField>
        <FormField label="Participants estimés">
          <Input name="estimatedParticipants" type="number" min={1} required />
        </FormField>
        <FormField label="Image (URL, optionnel)">
          <Input
            name="imageUrl"
            type="url"
            placeholder="https://..."
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setImageError(false);
            }}
          />
        </FormField>
        {imageUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Aperçu"
            onError={() => setImageError(true)}
            className="col-span-full h-24 w-full rounded-nested object-cover"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-nested bg-admin-canvas p-4 [&_input]:bg-paper">
        <div>
          <span className="text-caption tracking-caption uppercase text-mid-gray">
            Sous-événements (optionnel)
          </span>
          <p className="mt-1 text-caption text-mid-gray">
            Pour un événement qui regroupe plusieurs courses (ex. Saintélyon).
          </p>
        </div>
        {races.map((race, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <FormField label="Nom">
                <Input
                  placeholder="Ex. 10 km"
                  value={race.name}
                  onChange={(e) => updateRace(index, { name: e.target.value })}
                />
              </FormField>
            </div>
            <div className="w-24 shrink-0">
              <FormField label="Distance (km)">
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  value={race.distanceKm}
                  onChange={(e) => updateRace(index, { distanceKm: e.target.value })}
                />
              </FormField>
            </div>
            <button
              type="button"
              onClick={() => setRaces((prev) => prev.filter((_, i) => i !== index))}
              className="flex h-10 w-10 shrink-0 items-center justify-center text-mid-gray hover:text-ember"
              aria-label="Supprimer ce sous-événement"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => setRaces((prev) => [...prev, { name: "", distanceKm: "" }])}
        >
          <Plus size={16} />
          Ajouter un sous-événement
        </Button>
      </div>

      {state.error ? <p className="text-body text-ember">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "..." : "Créer l'événement"}
      </Button>
    </form>
  );
}

export function CreateEventForm() {
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setInstanceKey((k) => k + 1);
          setOpen(true);
        }}
      >
        Créer un événement
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvel événement" className="max-w-xl">
        <CreateEventModalContent key={instanceKey} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
