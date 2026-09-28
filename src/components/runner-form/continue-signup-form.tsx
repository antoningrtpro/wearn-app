"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminCard as Card } from "@/components/admin/admin-card";
import { FormField } from "@/components/brand-form/form-field";
import { Stepper } from "@/components/brand-form/stepper";
import { SIGNUP_STEPS } from "@/components/runner-form/signup-steps";
import { placementLabel } from "@/lib/utils/placement-labels";
import type { PublicEventWithRaces } from "@/lib/types/public";

const GENDER_LABELS = { homme: "Homme", femme: "Femme", autre: "Autre" } as const;

interface ExistingProfile {
  gender: "homme" | "femme" | "autre" | null;
  birthDate: string | null;
  acceptedPlacements: string[];
  instagramHandle: string | null;
  facebookHandle: string | null;
  tiktokHandle: string | null;
  participatingEventIds: string[];
  eventRaceSelections: Record<string, string>;
}

interface ContinueSignupFormProps {
  startUiStep: 1 | 2;
  existing: ExistingProfile;
  events: PublicEventWithRaces[];
  placements: string[];
}

export function ContinueSignupForm({ startUiStep, existing, events, placements }: ContinueSignupFormProps) {
  const router = useRouter();
  const [uiStep, setUiStep] = useState<1 | 2>(startUiStep);

  const [gender, setGender] = useState(existing.gender ?? "");
  const [birthDate, setBirthDate] = useState(existing.birthDate ?? "");
  const [selectedPlacements, setSelectedPlacements] = useState<Set<string>>(new Set(existing.acceptedPlacements));
  const [instagram, setInstagram] = useState(existing.instagramHandle ?? "");
  const [facebook, setFacebook] = useState(existing.facebookHandle ?? "");
  const [tiktok, setTiktok] = useState(existing.tiktokHandle ?? "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [underageError, setUnderageError] = useState(false);
  const [submittingProfile, setSubmittingProfile] = useState(false);

  const [participating, setParticipating] = useState<Set<string>>(
    new Set(existing.participatingEventIds)
  );
  const [raceByEvent, setRaceByEvent] = useState<Record<string, string>>(
    existing.eventRaceSelections
  );
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [submittingEvents, setSubmittingEvents] = useState(false);

  function togglePlacement(value: string) {
    setSelectedPlacements((prev) => {
      const copy = new Set(prev);
      if (copy.has(value)) copy.delete(value);
      else copy.add(value);
      return copy;
    });
  }

  async function submitProfile() {
    setProfileError(null);
    if (!gender) {
      setProfileError("Choisissez un genre.");
      return;
    }
    if (!birthDate) {
      setProfileError("Indiquez votre date de naissance.");
      return;
    }
    if (selectedPlacements.size === 0) {
      setProfileError("Choisissez au moins un emplacement.");
      return;
    }
    if (!instagram.trim() && !facebook.trim() && !tiktok.trim()) {
      setProfileError("Renseignez au moins un réseau social.");
      return;
    }

    setSubmittingProfile(true);
    try {
      const res = await fetch("/api/runners/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "profile",
          gender,
          birthDate,
          acceptedPlacements: [...selectedPlacements],
          instagramHandle: instagram.trim() || null,
          facebookHandle: facebook.trim() || null,
          tiktokHandle: tiktok.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === "underage") {
          setUnderageError(true);
          await auth.signOut();
          return;
        }
        setProfileError("Impossible d'enregistrer vos informations. Réessayez.");
        return;
      }

      setUiStep(2);
    } catch (err) {
      console.error("Signup step 2 error", err);
      setProfileError("Impossible d'enregistrer vos informations. Réessayez.");
    } finally {
      setSubmittingProfile(false);
    }
  }

  function toggleEvent(eventId: string, next: boolean, requiresRace: boolean) {
    if (next && requiresRace && !raceByEvent[eventId]) return;
    setParticipating((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(eventId);
      else copy.delete(eventId);
      return copy;
    });
    if (!next) {
      setRaceByEvent((prev) => {
        const copy = { ...prev };
        delete copy[eventId];
        return copy;
      });
    }
  }

  function selectRace(eventId: string, raceId: string) {
    setRaceByEvent((prev) => ({ ...prev, [eventId]: raceId }));
  }

  async function submitEvents() {
    setEventsError(null);
    const missingRace = events.some(
      (event) => participating.has(event.id) && event.races.length > 0 && !raceByEvent[event.id]
    );
    if (missingRace) {
      setEventsError("Choisissez une course pour chaque événement sélectionné.");
      return;
    }
    setSubmittingEvents(true);
    try {
      const res = await fetch("/api/runners/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "events",
          participatingEventIds: [...participating],
          eventRaceSelections: raceByEvent,
        }),
      });
      if (!res.ok) {
        setEventsError("Impossible d'enregistrer. Réessayez.");
        return;
      }
      router.push("/coureur");
      router.refresh();
    } catch (err) {
      console.error("Signup step 3 error", err);
      setEventsError("Impossible d'enregistrer. Réessayez.");
    } finally {
      setSubmittingEvents(false);
    }
  }

  if (underageError) {
    return (
      <Card className="flex flex-col gap-3 text-center">
        <h2 className="text-body-lg font-semibold text-ink">
          Inscription impossible
        </h2>
        <p className="text-body text-mid-gray">
          Wearn est réservé aux personnes majeures. Votre compte a été supprimé.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Stepper steps={SIGNUP_STEPS} currentIndex={uiStep} />

      {uiStep === 1 ? (
        <Card className="flex flex-col gap-6">
          <div>
            <h2 className="text-body-lg font-semibold text-ink">
              Informations personnelles
            </h2>
            <p className="mt-1 text-body text-mid-gray">
              Ces informations aident les marques à cibler leurs campagnes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Genre">
              <Select value={gender} onChange={(e) => setGender(e.target.value as typeof gender)}>
                <option value="" disabled>
                  Choisir
                </option>
                {Object.entries(GENDER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Date de naissance">
              <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </FormField>
          </div>

          <FormField label="Emplacements acceptés">
            <div className="flex flex-wrap gap-3">
              {placements.map((placement) => (
                <div
                  key={placement}
                  className="rounded-inputs border border-hairline bg-canvas px-3 py-2"
                >
                  <Checkbox
                    checked={selectedPlacements.has(placement)}
                    onChange={() => togglePlacement(placement)}
                    label={placementLabel(placement)}
                  />
                </div>
              ))}
            </div>
          </FormField>

          <FormField label="Réseaux sociaux (au moins un requis)">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                placeholder="Instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
              <Input
                placeholder="Facebook"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
              />
              <Input placeholder="TikTok" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
            </div>
          </FormField>

          {profileError ? <p className="text-body text-ember">{profileError}</p> : null}

          <div className="flex justify-end">
            <Button type="button" onClick={submitProfile} disabled={submittingProfile}>
              {submittingProfile ? "..." : "Continuer"}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col gap-6">
          <div>
            <h2 className="text-body-lg font-semibold text-ink">
              Vos événements
            </h2>
            <p className="mt-1 text-body text-mid-gray">
              Cochez les événements auxquels vous participez pour recevoir des propositions
              ciblées. Vous pourrez modifier ce choix plus tard depuis votre profil.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {events.map((event) => {
              const isChecked = participating.has(event.id);
              const requiresRace = event.races.length > 0;
              const hasRace = Boolean(raceByEvent[event.id]);
              return (
                <div
                  key={event.id}
                  className="flex flex-col gap-3 rounded-nested border border-hairline bg-admin-canvas px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-body-lg font-medium text-ink">{event.name}</p>
                      <p className="text-body text-mid-gray">
                        {event.city} · {new Date(event.date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Checkbox
                      label="Je participe"
                      checked={isChecked}
                      disabled={!isChecked && requiresRace && !hasRace}
                      onChange={(e) => toggleEvent(event.id, e.target.checked, requiresRace)}
                    />
                  </div>
                  {requiresRace ? (
                    <Select
                      value={raceByEvent[event.id] ?? ""}
                      onChange={(e) => selectRace(event.id, e.target.value)}
                      className="w-64"
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
                  ) : null}
                </div>
              );
            })}
            {events.length === 0 ? (
              <p className="text-body text-mid-gray">Aucun événement disponible pour le moment.</p>
            ) : null}
          </div>

          {eventsError ? <p className="text-body text-ember">{eventsError}</p> : null}

          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={() => setUiStep(1)}>
              Retour
            </Button>
            <Button type="button" onClick={submitEvents} disabled={submittingEvents}>
              {submittingEvents ? "..." : "Terminer l'inscription"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
