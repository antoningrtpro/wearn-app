"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import {
  createCampaignAsCollaborator,
  type CreateCampaignState,
} from "@/app/marque/nouvelle/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/brand-form/form-field";
import { Stepper, type StepDefinition } from "@/components/brand-form/stepper";
import {
  CampaignSegmentFields,
  createEmptySegment,
  type SegmentFields,
} from "@/components/shared/campaign-segment-fields";
import { cn } from "@/lib/cn";
import type { PublicEventWithRaces } from "@/lib/types/public";

interface BrandCampaignFormProps {
  events: PublicEventWithRaces[];
  placements: string[];
  /** Pre-selects this event (skips straight to a filled-in step 1) — used
   * when the brand clicks "Créer une campagne" from an event card. */
  initialEventId?: string;
  /** Lets the surrounding modal close itself without submitting. */
  onCancel?: () => void;
}

const AUTRE_EVENT = "__autre__";
const NO_RACE = "";

const CAMPAIGN_STEPS: StepDefinition[] = [
  { key: "info", label: "Informations" },
  { key: "targeting", label: "Ciblage" },
];

const initialState: CreateCampaignState = {};

export function BrandCampaignForm({ events, placements, initialEventId, onCancel }: BrandCampaignFormProps) {
  const [state, formAction, pending] = useActionState(createCampaignAsCollaborator, initialState);

  const emptySegment = createEmptySegment(placements);

  const [step, setStep] = useState<0 | 1>(0);
  const [eventChoice, setEventChoice] = useState<string>(initialEventId ?? events[0]?.id ?? AUTRE_EVENT);
  const [raceId, setRaceId] = useState<string>(NO_RACE);
  const [customEventName, setCustomEventName] = useState("");
  const [segments, setSegments] = useState<SegmentFields[]>([emptySegment]);
  const [stepError, setStepError] = useState<string | null>(null);

  const selectedEvent = events.find((e) => e.id === eventChoice) ?? null;

  function updateSegment(index: number, patch: Partial<SegmentFields>) {
    setSegments((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function goToTargeting() {
    if (!selectedEvent && !customEventName.trim()) {
      setStepError("Choisissez un événement ou saisissez son nom.");
      return;
    }
    setStepError(null);
    setStep(1);
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Stepper steps={CAMPAIGN_STEPS} currentIndex={step} />

      <input type="hidden" name="segmentsJson" value={JSON.stringify(segments)} readOnly />

      <div className={cn("flex flex-col gap-4", step !== 0 && "hidden")}>
        <div className="flex flex-col gap-4 rounded-nested bg-admin-canvas p-4 [&_input]:bg-paper [&_select]:bg-paper">
          <FormField label="Événement">
            <Select
              value={eventChoice}
              onChange={(e) => {
                setEventChoice(e.target.value);
                setRaceId(NO_RACE);
              }}
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} — {event.city} — {new Date(event.date).toLocaleDateString("fr-FR")}
                </option>
              ))}
              <option value={AUTRE_EVENT}>Autre (saisir un nom)</option>
            </Select>
          </FormField>

          {selectedEvent ? (
            <>
              <input type="hidden" name="eventId" value={selectedEvent.id} />
              {selectedEvent.races.length > 0 ? (
                <FormField label="Course">
                  <Select name="raceId" value={raceId} onChange={(e) => setRaceId(e.target.value)}>
                    <option value={NO_RACE}>Peu importe la course</option>
                    {selectedEvent.races.map((race) => (
                      <option key={race.id} value={race.id}>
                        {race.name} ({race.distanceKm} km)
                      </option>
                    ))}
                  </Select>
                </FormField>
              ) : null}
            </>
          ) : (
            <FormField label="Nom de l'événement">
              <Input
                name="customEventName"
                placeholder="Ex. Trail de la Vallée Verte"
                value={customEventName}
                onChange={(e) => setCustomEventName(e.target.value)}
              />
            </FormField>
          )}
        </div>

        {stepError ? <p className="text-body text-ember">{stepError}</p> : null}

        <div className="flex justify-end gap-3">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          ) : null}
          <Button type="button" onClick={goToTargeting}>
            Suivant
          </Button>
        </div>
      </div>

      <div className={cn("flex flex-col gap-4", step !== 1 && "hidden")}>
        {segments.map((segment, index) => (
          <CampaignSegmentFields
            key={index}
            segment={segment}
            index={index}
            placements={placements}
            onChange={(patch) => updateSegment(index, patch)}
            onRemove={segments.length > 1 ? () => setSegments((prev) => prev.filter((_, i) => i !== index)) : undefined}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => setSegments((prev) => [...prev, emptySegment])}
        >
          <Plus size={16} />
          Ajouter un ciblage
        </Button>

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => setStep(0)}>
            Précédent
          </Button>
          <div className="flex items-center gap-3">
            {state.error ? <span className="text-body text-ember">{state.error}</span> : null}
            <Button type="submit" disabled={pending}>
              {pending ? "..." : "Envoyer la demande"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
