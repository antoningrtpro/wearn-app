"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Search } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { AdminCard as Card } from "@/components/admin/admin-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EventCard } from "@/components/shared/event-card";
import { ViewToggle } from "@/components/shared/view-toggle";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { cn } from "@/lib/cn";
import type { PublicEventWithRaces } from "@/lib/types/public";

export interface RunnerAssignmentRef {
  assignmentId: string;
  status: string;
}

interface MyEventsProps {
  runnerId: string;
  runnerName: string;
  events: PublicEventWithRaces[];
  participatingEventIds: string[];
  eventRaceSelections: Record<string, string>;
  /** The runner's own assignment (if any) for each event, keyed by eventId —
   * used to decide what happens when they un-participate from an event
   * they've already been validated for. */
  assignmentsByEvent: Record<string, RunnerAssignmentRef>;
  /** Forces the compact list rows and hides the card/list toggle — used for
   * the dashboard's "Événements à venir" preview, where a full card grid
   * would be too heavy. */
  compact?: boolean;
  /** Overrides the empty-state message — the dashboard preview only ever
   * shows upcoming events, so "no events available" would be misleading. */
  emptyMessage?: string;
}

const VALIDATED_STATUSES = new Set(["validated_by_runner", "sticker_confirmed"]);

/**
 * Writes go directly to the runner's own Firestore doc — already permitted
 * by firestore.rules (owner update, any field except authUid/createdAt), no
 * new rule needed.
 *
 * When an event has sub-events (races), picking one is mandatory to
 * participate — there is no "peu importe la course" escape hatch here like
 * on the brand's campaign form, since a brand may genuinely not care which
 * race it targets, but a runner is physically running one specific race.
 */
export function MyEvents({
  runnerId,
  runnerName,
  events,
  participatingEventIds,
  eventRaceSelections,
  assignmentsByEvent,
  compact = false,
  emptyMessage,
}: MyEventsProps) {
  const router = useRouter();
  const [view, setView] = useState<"card" | "list">(compact ? "list" : "card");
  const [searchQuery, setSearchQuery] = useState("");
  const [checked, setChecked] = useState(new Set(participatingEventIds));
  const [raceByEvent, setRaceByEvent] = useState<Record<string, string>>(eventRaceSelections);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [infoModalEvent, setInfoModalEvent] = useState<PublicEventWithRaces | null>(null);
  const [confirmRemoveEvent, setConfirmRemoveEvent] = useState<PublicEventWithRaces | null>(null);
  const [withdrawAlertEvent, setWithdrawAlertEvent] = useState<PublicEventWithRaces | null>(null);

  function setPending(eventId: string, value: boolean) {
    setPendingIds((prev) => {
      const copy = new Set(prev);
      if (value) copy.add(eventId);
      else copy.delete(eventId);
      return copy;
    });
  }

  async function doParticipate(event: PublicEventWithRaces) {
    const eventId = event.id;
    const chosenRace = raceByEvent[eventId];
    setPending(eventId, true);
    setChecked((prev) => new Set(prev).add(eventId));
    try {
      await updateDoc(doc(db, "runners", runnerId), {
        participatingEventIds: arrayUnion(eventId),
        ...(chosenRace ? { [`eventRaceSelections.${eventId}`]: chosenRace } : {}),
      });
      // Other server-rendered sections (e.g. the dashboard's "Mes
      // participations") derive from this same runner doc — refresh so a
      // participate/withdraw toggled here shows up there immediately.
      router.refresh();
    } catch {
      setChecked((prev) => {
        const copy = new Set(prev);
        copy.delete(eventId);
        return copy;
      });
    } finally {
      setPending(eventId, false);
    }
  }

  async function doRemoveParticipation(event: PublicEventWithRaces) {
    const eventId = event.id;
    const prevRace = raceByEvent[eventId];
    setChecked((prev) => {
      const copy = new Set(prev);
      copy.delete(eventId);
      return copy;
    });
    setRaceByEvent((prev) => {
      const copy = { ...prev };
      delete copy[eventId];
      return copy;
    });
    try {
      await updateDoc(doc(db, "runners", runnerId), {
        participatingEventIds: arrayRemove(eventId),
        [`eventRaceSelections.${eventId}`]: deleteField(),
      });
      router.refresh();
    } catch {
      setChecked((prev) => new Set(prev).add(eventId));
      if (prevRace) setRaceByEvent((prev) => ({ ...prev, [eventId]: prevRace }));
    } finally {
      setPending(eventId, false);
    }
  }

  /** Silent auto-decline — the admin proposed/validated them but they
   * hadn't responded yet, so backing out doesn't need a heads-up. */
  async function autoDeclineAssignment(assignmentId: string) {
    try {
      await updateDoc(doc(db, "assignments", assignmentId), {
        status: "declined_by_runner",
        runnerValidatedAt: serverTimestamp(),
      });
    } catch {
      // Best-effort — the runner is still removed from the event either way.
    }
  }

  /** Backing out after already validating/confirming — notify the admin. */
  async function withdrawAssignment(event: PublicEventWithRaces, assignmentId: string) {
    try {
      await updateDoc(doc(db, "assignments", assignmentId), {
        status: "declined_by_runner",
        withdrawnAt: serverTimestamp(),
      });
      await addDoc(collection(db, "adminNotifications"), {
        type: "runner_withdrew",
        message: `${runnerName} a retiré sa participation à ${event.name} après avoir déjà validé sa campagne.`,
        runnerId,
        runnerName,
        eventId: event.id,
        eventName: event.name,
        assignmentId,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Best-effort — the runner is still removed from the event either way.
    }
  }

  function requestParticipate(event: PublicEventWithRaces) {
    if (pendingIds.has(event.id)) return;

    if (checked.has(event.id)) {
      setConfirmRemoveEvent(event);
      return;
    }

    const chosenRace = raceByEvent[event.id];
    if (event.races.length > 0 && !chosenRace) {
      setInfoModalEvent(event);
      return;
    }
    void doParticipate(event);
  }

  function handleConfirmRemove() {
    const event = confirmRemoveEvent;
    setConfirmRemoveEvent(null);
    if (!event) return;

    const assignment = assignmentsByEvent[event.id];
    if (assignment?.status === "validated_by_brand") {
      setPending(event.id, true);
      void autoDeclineAssignment(assignment.assignmentId).then(() => doRemoveParticipation(event));
      return;
    }
    if (assignment && VALIDATED_STATUSES.has(assignment.status)) {
      setWithdrawAlertEvent(event);
      return;
    }
    void doRemoveParticipation(event);
  }

  function handleConfirmWithdraw() {
    const event = withdrawAlertEvent;
    setWithdrawAlertEvent(null);
    if (!event) return;
    const assignment = assignmentsByEvent[event.id];
    setPending(event.id, true);
    void (assignment ? withdrawAssignment(event, assignment.assignmentId) : Promise.resolve()).then(() =>
      doRemoveParticipation(event)
    );
  }

  async function selectRace(eventId: string, raceId: string) {
    const prevRace = raceByEvent[eventId];
    setRaceByEvent((prev) => ({ ...prev, [eventId]: raceId }));
    if (!checked.has(eventId)) return;
    try {
      await updateDoc(doc(db, "runners", runnerId), {
        [`eventRaceSelections.${eventId}`]: raceId,
      });
    } catch {
      setRaceByEvent((prev) => ({ ...prev, [eventId]: prevRace }));
    }
  }

  if (events.length === 0) {
    return <p className="text-body text-mid-gray">{emptyMessage ?? "Aucun événement disponible pour le moment."}</p>;
  }

  const filteredEvents = searchQuery.trim()
    ? events.filter((event) => event.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : events;

  function RaceSelect({ event }: { event: PublicEventWithRaces }) {
    if (event.races.length === 0) return null;
    const value = raceByEvent[event.id] ?? "";
    return (
      <div className="relative">
        <Select
          value={value}
          onChange={(e) => selectRace(event.id, e.target.value)}
          className={cn(
            "min-w-48 border font-medium",
            value
              ? "border-admin-accent/30 bg-admin-accent-soft text-admin-accent"
              : "border-hairline bg-canvas text-mid-gray"
          )}
        >
          <option value="" disabled>
            Choisir une course
          </option>
          {event.races.map((race) => (
            <option key={race.id} value={race.id}>
              {race.name} ({race.distanceKm} km)
            </option>
          ))}
        </Select>
      </div>
    );
  }

  function ParticipateButton({ event }: { event: PublicEventWithRaces }) {
    const isChecked = checked.has(event.id);
    return (
      <Button
        type="button"
        variant={isChecked ? "filled" : "outline"}
        disabled={pendingIds.has(event.id)}
        onClick={() => requestParticipate(event)}
        className={cn(
          isChecked
            ? "border-admin-positive bg-admin-positive text-white hover:opacity-90"
            : "border-admin-positive text-admin-positive hover:bg-admin-positive-soft"
        )}
      >
        {pendingIds.has(event.id) ? "..." : "Je participe"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {!compact ? (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mid-gray" />
            <Input
              type="search"
              placeholder="Rechercher un événement…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>
      ) : null}

      {filteredEvents.length === 0 ? (
        <p className="text-body text-mid-gray">Aucun événement ne correspond à « {searchQuery} ».</p>
      ) : view === "card" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event}>
              <RaceSelect event={event} />
              <ParticipateButton event={event} />
            </EventCard>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-body-lg font-medium text-ink">{event.name}</p>
                <p className="text-body text-mid-gray">
                  {event.city} · {new Date(event.date).toLocaleDateString("fr-FR")}
                  {event.distanceKm ? ` · ${event.distanceKm} km` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <RaceSelect event={event} />
                <ParticipateButton event={event} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={infoModalEvent !== null}
        infoOnly
        title="Choisissez une course"
        message={`${infoModalEvent?.name ?? "Cet événement"} propose plusieurs courses — choisissez la vôtre avant de confirmer votre participation.`}
        onConfirm={() => setInfoModalEvent(null)}
        onCancel={() => setInfoModalEvent(null)}
      />

      <ConfirmModal
        open={confirmRemoveEvent !== null}
        title="Retirer votre participation ?"
        message={`Vous ne participerez plus à ${confirmRemoveEvent?.name ?? "cet événement"}. Vous pourrez cocher « Je participe » à nouveau plus tard.`}
        confirmLabel="Retirer ma participation"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmRemoveEvent(null)}
      />

      <ConfirmModal
        open={withdrawAlertEvent !== null}
        title="Vous avez déjà validé une campagne"
        message={`Vous avez déjà validé une campagne pour ${withdrawAlertEvent?.name ?? "cet événement"}. Si vous retirez votre participation, Wearn en sera notifié. Confirmer ?`}
        confirmLabel="Oui, retirer ma participation"
        onConfirm={handleConfirmWithdraw}
        onCancel={() => setWithdrawAlertEvent(null)}
      />
    </div>
  );
}
