"use client";

import { useActionState } from "react";
import { associateEvent, type AssociateEventState } from "@/app/admin/campagnes/[id]/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Select } from "@/components/ui/select";
import { AdminCard as Card } from "@/components/admin/admin-card";
import type { PublicEvent } from "@/lib/types/public";

interface EventAssociationFormProps {
  campaignId: string;
  customEventName: string;
  events: PublicEvent[];
}

const initialState: AssociateEventState = {};

export function EventAssociationForm({ campaignId, customEventName, events }: EventAssociationFormProps) {
  const boundAction = associateEvent.bind(null, campaignId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <Card className="flex flex-col gap-3">
      <span className="text-caption tracking-caption uppercase text-mid-gray">
        Événement à associer
      </span>
      <p className="text-body-lg font-medium text-ink">{customEventName}</p>
      <p className="text-body text-mid-gray">
        La marque a saisi ce nom à la main. Associez-le à un événement existant pour retrouver
        les coureurs participants.
      </p>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <Select name="eventId" className="w-64" defaultValue="">
          <option value="" disabled>
            Choisir un événement
          </option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} — {event.city} — {new Date(event.date).toLocaleDateString("fr-FR")}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "..." : "Associer"}
        </Button>
      </form>
      {state.error ? <p className="text-body text-ember">{state.error}</p> : null}
      {state.success ? <p className="text-body text-mid-gray">Événement associé.</p> : null}
    </Card>
  );
}
