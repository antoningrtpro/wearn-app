"use client";

import { useState } from "react";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Modal } from "@/components/admin/modal";
import { EventCard } from "@/components/shared/event-card";
import { BrandCampaignForm } from "@/components/marque/brand-campaign-form";
import type { PublicEventWithRaces } from "@/lib/types/public";

interface MarqueEventsViewProps {
  events: PublicEventWithRaces[];
  placements: string[];
}

export function MarqueEventsView({ events, placements }: MarqueEventsViewProps) {
  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const [instanceKey, setInstanceKey] = useState(0);

  function openFor(eventId: string) {
    setInstanceKey((k) => k + 1);
    setOpenEventId(eventId);
  }

  if (events.length === 0) {
    return <p className="text-body text-mid-gray">Aucun événement disponible pour le moment.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event}>
            <Button type="button" className="w-full" onClick={() => openFor(event.id)}>
              Créer une campagne
            </Button>
          </EventCard>
        ))}
      </div>

      <Modal
        open={openEventId !== null}
        onClose={() => setOpenEventId(null)}
        title="Nouvelle campagne"
        className="max-w-2xl"
      >
        <BrandCampaignForm
          key={instanceKey}
          events={events}
          placements={placements}
          initialEventId={openEventId ?? undefined}
          onCancel={() => setOpenEventId(null)}
        />
      </Modal>
    </>
  );
}
