"use client";

import { useState } from "react";
import { AdminCard as Card } from "@/components/admin/admin-card";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "@/components/shared/event-card";
import { EventDetailPanel } from "@/components/admin/event-detail-panel";
import { CreateEventForm } from "@/components/admin/create-event-form";
import { ViewToggle } from "@/components/shared/view-toggle";
import type { PublicEventWithRaces } from "@/lib/types/public";

export function AdminEventsView({ events }: { events: PublicEventWithRaces[] }) {
  const [view, setView] = useState<"card" | "list">("card");
  const [openEventId, setOpenEventId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <CreateEventForm />
        <ViewToggle view={view} onChange={setView} />
      </div>

      {events.length === 0 ? (
        <p className="text-body text-mid-gray">Aucun événement.</p>
      ) : view === "card" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event}>
              <Button type="button" variant="outline" className="w-full" onClick={() => setOpenEventId(event.id)}>
                Voir
              </Button>
            </EventCard>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => setOpenEventId(event.id)} className="min-w-0 flex-1 text-left">
                <p className="text-body-lg font-medium text-ink">{event.name}</p>
                <p className="text-body text-mid-gray">
                  {event.city} · {new Date(event.date).toLocaleDateString("fr-FR")}
                  {event.distanceKm ? ` · ${event.distanceKm} km` : ""}
                </p>
              </button>
              <Badge variant="outline">{event.estimatedParticipants} participants estimés</Badge>
            </Card>
          ))}
        </div>
      )}

      <EventDetailPanel eventId={openEventId} onClose={() => setOpenEventId(null)} />
    </div>
  );
}
