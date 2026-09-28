"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AdminCard as Card } from "@/components/admin/admin-card";
import { Badge } from "@/components/ui/badge";
import { AdminButton as Button } from "@/components/admin/admin-button";
import type { ProposalForRunner } from "@/lib/types/runner-view";

const PLACEMENT_LABELS: Record<string, string> = {
  dos: "Dos (t-shirt)",
  manche: "Manche",
  short: "Short",
  dossard: "Dossard",
};

interface MyProposalsProps {
  proposals: ProposalForRunner[];
  onDetails?: (proposal: ProposalForRunner) => void;
}

/**
 * Accept/decline writes directly to Firestore from the client — this is
 * exactly the transition firestore.rules carves out for the owning runner
 * (validated_by_brand -> validated_by_runner | declined_by_runner, touching
 * only status + runnerValidatedAt, runnerPayoutAmount left untouched).
 */
export function MyProposals({ proposals, onDetails }: MyProposalsProps) {
  const router = useRouter();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [decided, setDecided] = useState<Set<string>>(new Set());

  function setPending(id: string, value: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function decide(assignmentId: string, status: "validated_by_runner" | "declined_by_runner") {
    setError(null);
    setPending(assignmentId, true);
    try {
      await updateDoc(doc(db, "assignments", assignmentId), {
        status,
        runnerValidatedAt: serverTimestamp(),
      });
      setDecided((prev) => new Set(prev).add(assignmentId));
      router.refresh();
    } catch {
      setError("Impossible d'enregistrer votre choix. Réessayez.");
    } finally {
      setPending(assignmentId, false);
    }
  }

  const visible = proposals.filter((p) => !decided.has(p.assignmentId));

  if (visible.length === 0) {
    return <p className="text-body text-mid-gray">Aucune proposition en attente pour le moment.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <p className="text-body text-ember">{error}</p> : null}
      {visible.map((proposal) => {
        const isPending = pendingIds.has(proposal.assignmentId);
        return (
          <Card key={proposal.assignmentId} className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-body-lg font-medium text-ink">{proposal.eventName}</p>
              <p className="text-body text-mid-gray">
                {proposal.eventCity}
                {proposal.eventDate ? ` · ${new Date(proposal.eventDate).toLocaleDateString("fr-FR")}` : ""}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="solid">
                  {PLACEMENT_LABELS[proposal.placement] ?? proposal.placement}
                </Badge>
                <Badge variant="soft">
                  {proposal.runnerPayoutAmount != null ? `${proposal.runnerPayoutAmount.toFixed(2)} €` : "—"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onDetails ? (
                <button
                  type="button"
                  onClick={() => onDetails(proposal)}
                  className="text-body text-mid-gray underline"
                >
                  Détails
                </button>
              ) : null}
              <Button
                variant="ghost"
                disabled={isPending}
                onClick={() => decide(proposal.assignmentId, "declined_by_runner")}
              >
                Décliner
              </Button>
              <Button disabled={isPending} onClick={() => decide(proposal.assignmentId, "validated_by_runner")}>
                {isPending ? "..." : "Accepter"}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
