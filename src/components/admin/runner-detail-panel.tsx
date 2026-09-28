"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { KeyRound } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { SidePanel } from "@/components/admin/side-panel";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Badge } from "@/components/ui/badge";
import { EditRunnerForm } from "@/components/admin/edit-runner-form";
import { placementLabel } from "@/lib/utils/placement-labels";
import type { RunnerRow } from "@/lib/server/runners";

const GENDER_LABELS: Record<string, string> = { homme: "Homme", femme: "Femme", autre: "Autre" };

interface RunnerDetailPanelProps {
  runner: RunnerRow | null;
  placements: string[];
  onClose: () => void;
}

/**
 * Same reset flow the runner's own "Mot de passe oublié ?" link uses
 * (sendPasswordResetEmail doesn't care who's currently signed in — it just
 * emails a reset link to the address given), so no new server action or
 * Admin SDK privilege is needed here.
 */
function SendPasswordResetButton({ email }: { email: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleClick() {
    setStatus("sending");
    try {
      await sendPasswordResetEmail(auth, email);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" onClick={handleClick} disabled={status === "sending"} className="self-start">
        <KeyRound size={14} />
        {status === "sending" ? "Envoi…" : "Envoyer un lien de réinitialisation"}
      </Button>
      {status === "sent" ? (
        <p className="text-caption text-admin-positive">Email envoyé à {email}.</p>
      ) : null}
      {status === "error" ? <p className="text-caption text-ember">Impossible d&apos;envoyer l&apos;email.</p> : null}
    </div>
  );
}

export function RunnerDetailPanel({ runner, placements, onClose }: RunnerDetailPanelProps) {
  const router = useRouter();

  return (
    <SidePanel
      open={runner !== null}
      onClose={onClose}
      title={runner ? `${runner.firstName} ${runner.lastName}` : "Coureur"}
      subtitle={runner?.email}
      headerActions={
        runner ? (
          <EditRunnerForm
            runnerId={runner.id}
            firstName={runner.firstName}
            lastName={runner.lastName}
            phone={runner.phone}
            gender={runner.gender}
            birthDate={runner.birthDate}
            clothingSize={runner.clothingSize}
            acceptedPlacements={runner.acceptedPlacements}
            placements={placements}
            onSuccess={() => router.refresh()}
          />
        ) : null
      }
    >
      {runner ? (
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={runner.profilePhotoUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-body-lg font-medium text-ink">
                {runner.firstName} {runner.lastName}
              </p>
              <p className="truncate text-body text-mid-gray">{runner.phone}</p>
            </div>
          </div>

          <div>
            <h3 className="text-body-lg font-semibold text-ink">Profil</h3>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <span className="text-caption tracking-caption uppercase text-mid-gray">Genre</span>
                <p className="text-body text-ink">{GENDER_LABELS[runner.gender] ?? runner.gender ?? "—"}</p>
              </div>
              <div>
                <span className="text-caption tracking-caption uppercase text-mid-gray">Âge</span>
                <p className="text-body text-ink">{runner.age != null ? `${runner.age} ans` : "—"}</p>
              </div>
              <div>
                <span className="text-caption tracking-caption uppercase text-mid-gray">Ville</span>
                <p className="text-body text-ink">{runner.city ?? "—"}</p>
              </div>
              <div>
                <span className="text-caption tracking-caption uppercase text-mid-gray">Taille</span>
                <p className="text-body text-ink">{runner.clothingSize ?? "—"}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-body-lg font-semibold text-ink">Emplacements acceptés</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {runner.acceptedPlacements.map((p) => (
                <Badge key={p} variant="solid">
                  {placementLabel(p)}
                </Badge>
              ))}
              {runner.acceptedPlacements.length === 0 ? (
                <p className="text-body text-mid-gray">Aucun emplacement accepté.</p>
              ) : null}
            </div>
          </div>

          <div>
            <h3 className="text-body-lg font-semibold text-ink">Compte</h3>
            <div className="mt-3">
              <SendPasswordResetButton email={runner.email} />
            </div>
          </div>
        </div>
      ) : null}
    </SidePanel>
  );
}
