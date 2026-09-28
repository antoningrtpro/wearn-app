"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/brand-form/form-field";
import { placementLabel } from "@/lib/utils/placement-labels";

const GENDER_LABELS = { homme: "Homme", femme: "Femme", autre: "Autre" } as const;
type Gender = "" | "homme" | "femme" | "autre";

interface UpdateRunnerProfileFormProps {
  placements: string[];
  gender: "homme" | "femme" | "autre" | null;
  birthDate: string | null;
  acceptedPlacements: string[];
  instagramHandle: string | null;
  facebookHandle: string | null;
  tiktokHandle: string | null;
}

export function UpdateRunnerProfileForm({
  placements,
  gender: initialGender,
  birthDate: initialBirthDate,
  acceptedPlacements,
  instagramHandle,
  facebookHandle,
  tiktokHandle,
}: UpdateRunnerProfileFormProps) {
  const router = useRouter();
  const [gender, setGender] = useState<Gender>(initialGender ?? "");
  const [birthDate, setBirthDate] = useState(initialBirthDate ?? "");
  const [selectedPlacements, setSelectedPlacements] = useState<Set<string>>(new Set(acceptedPlacements));
  const [instagram, setInstagram] = useState(instagramHandle ?? "");
  const [facebook, setFacebook] = useState(facebookHandle ?? "");
  const [tiktok, setTiktok] = useState(tiktokHandle ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  function togglePlacement(value: string) {
    setSelectedPlacements((prev) => {
      const copy = new Set(prev);
      if (copy.has(value)) copy.delete(value);
      else copy.add(value);
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!gender) {
      setError("Choisissez un genre.");
      return;
    }
    if (!birthDate) {
      setError("Indiquez votre date de naissance.");
      return;
    }
    if (selectedPlacements.size === 0) {
      setError("Choisissez au moins un emplacement.");
      return;
    }
    if (!instagram.trim() && !facebook.trim() && !tiktok.trim()) {
      setError("Renseignez au moins un réseau social.");
      return;
    }

    setPending(true);
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
          setError("Vous devez être majeur pour utiliser Wearn.");
          return;
        }
        setError("Impossible d'enregistrer. Réessayez.");
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Impossible d'enregistrer. Réessayez.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Genre">
          <Select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
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
            <div key={placement} className="rounded-inputs border border-hairline bg-admin-canvas px-3 py-2">
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
          <Input placeholder="Instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          <Input placeholder="Facebook" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
          <Input placeholder="TikTok" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
        </div>
      </FormField>

      {error ? <p className="text-body text-ember">{error}</p> : null}
      {success ? <p className="text-body text-admin-positive">Enregistré.</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "..." : "Enregistrer"}
      </Button>
    </form>
  );
}
