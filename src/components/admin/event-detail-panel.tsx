"use client";

import { useEffect, useState } from "react";
import { SidePanel } from "@/components/admin/side-panel";
import { AdminCard } from "@/components/admin/admin-card";
import { CreateRaceForm } from "@/components/admin/create-race-form";
import { DeleteRaceButton } from "@/components/admin/delete-race-button";
import { EditEventForm } from "@/components/admin/edit-event-form";
import { EventImageForm } from "@/components/admin/event-image-form";
import { cn } from "@/lib/cn";

interface EventDetailData {
  event: {
    id: string;
    name: string;
    city: string;
    date: string;
    distanceKm: number | null;
    estimatedParticipants: number;
    imageUrl: string | null;
  };
  races: { id: string; name: string; distanceKm: number }[];
  participants: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profilePhotoUrl: string;
    raceLabel: string;
  }[];
}

interface EventDetailPanelProps {
  eventId: string | null;
  onClose: () => void;
}

const TABS = ["details", "participants"] as const;
type Tab = (typeof TABS)[number];

function EventDetailBody({ data, onSaved }: { data: EventDetailData; onSaved: () => void }) {
  const [tab, setTab] = useState<Tab>("details");

  const tabLabels: Record<Tab, string> = {
    details: "Détails",
    participants: `Coureurs (${data.participants.length})`,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-1 self-start rounded-full border border-hairline bg-paper p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-3 py-1.5 text-body transition-colors",
              tab === t ? "bg-admin-accent text-white" : "text-mid-gray hover:text-ink"
            )}
          >
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {tab === "details" ? (
        <div className="flex flex-col gap-8">
          <EventImageForm eventId={data.event.id} imageUrl={data.event.imageUrl} onSuccess={onSaved} />

          <p className="text-body text-mid-gray">
            {data.event.estimatedParticipants} participants estimés
          </p>

          <div className="flex flex-col gap-4 rounded-admin-card bg-admin-canvas p-4 [&_input]:bg-paper">
            <div>
              <h3 className="text-body-lg font-semibold text-ink">
                Sous-événements / courses ({data.races.length})
              </h3>
              <p className="mt-1 text-caption text-mid-gray">
                Optionnel — utile pour un événement qui regroupe plusieurs courses sur un même
                weekend (ex. Saintélyon). Si vous en ajoutez, chaque coureur qui participe devra
                choisir la sienne ; une marque pourra cibler une course précise ou laisser &quot;peu
                importe la course&quot;.
              </p>
            </div>

            <CreateRaceForm eventId={data.event.id} onSuccess={onSaved} />

            <div className="flex flex-col gap-2">
              {data.races.map((race) => (
                <AdminCard key={race.id} className="flex items-center justify-between">
                  <p className="text-body font-medium text-ink">
                    {race.name} <span className="text-mid-gray">· {race.distanceKm} km</span>
                  </p>
                  <DeleteRaceButton eventId={data.event.id} raceId={race.id} onSuccess={onSaved} />
                </AdminCard>
              ))}
              {data.races.length === 0 ? (
                <p className="text-body text-mid-gray">Aucune course pour le moment.</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "participants" ? (
        <div className="flex flex-col gap-3">
          {data.participants.map((runner) => (
            <AdminCard key={runner.id} className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={runner.profilePhotoUrl}
                alt=""
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium text-ink">
                  {runner.firstName} {runner.lastName}
                </p>
                <p className="truncate text-caption text-mid-gray">
                  {runner.email} · {runner.phone}
                </p>
              </div>
              {data.races.length > 0 ? (
                <span className="shrink-0 text-caption text-mid-gray">{runner.raceLabel}</span>
              ) : null}
            </AdminCard>
          ))}
          {data.participants.length === 0 ? (
            <p className="text-body text-mid-gray">
              Aucun coureur n&apos;a encore indiqué participer à cet événement.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function EventDetailPanel({ eventId, onClose }: EventDetailPanelProps) {
  const [data, setData] = useState<EventDetailData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const loading = eventId !== null && data?.event.id !== eventId;

  useEffect(() => {
    if (!eventId) return;
    fetch(`/api/admin/evenements/${eventId}`)
      .then((res) => res.json())
      .then((json) => setData(json));
  }, [eventId, refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <SidePanel
      open={eventId !== null}
      onClose={onClose}
      title={data?.event.name ?? "Événement"}
      subtitle={
        data
          ? `${data.event.city} · ${new Date(data.event.date).toLocaleDateString("fr-FR")}${
              data.event.distanceKm ? ` · ${data.event.distanceKm} km` : ""
            }`
          : undefined
      }
      headerActions={data ? <EditEventForm event={data.event} onSuccess={refresh} /> : null}
    >
      {loading || !data ? (
        <p className="text-body text-mid-gray">Chargement…</p>
      ) : (
        <EventDetailBody key={data.event.id} data={data} onSaved={refresh} />
      )}
    </SidePanel>
  );
}
