"use client";

import { useActionState } from "react";
import {
  approveProof,
  markPaid,
  type ReviewActionState,
} from "@/app/admin/preuves/actions";
import { AdminCard as Card } from "@/components/admin/admin-card";
import { Badge } from "@/components/ui/badge";
import { AdminButton as Button } from "@/components/admin/admin-button";
import type { AssignmentReviewRow } from "@/lib/server/admin-assignments";

const PLACEMENT_LABELS: Record<string, string> = {
  dos: "Dos (t-shirt)",
  manche: "Manche",
  short: "Short",
  dossard: "Dossard",
};

const initialState: ReviewActionState = {};

interface ReviewCardProps {
  row: AssignmentReviewRow;
}

function ProofSubmittedCard({ row }: ReviewCardProps) {
  const boundAction = approveProof.bind(null, row.assignmentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={row.proofPhotoUrl ?? row.runnerPhotoUrl}
          alt="Preuve"
          className="h-20 w-20 shrink-0 rounded-nested object-cover"
        />
        <div>
          <p className="text-body-lg font-medium text-ink">
            {row.runnerFirstName} {row.runnerLastName}
          </p>
          <p className="text-body text-mid-gray">
            {row.eventName}
            {row.eventDate ? ` · ${new Date(row.eventDate).toLocaleDateString("fr-FR")}` : ""}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="solid">{PLACEMENT_LABELS[row.placement] ?? row.placement}</Badge>
            <Badge variant="soft">{row.runnerPayoutAmount != null ? `${row.runnerPayoutAmount.toFixed(2)} €` : "—"}</Badge>
          </div>
        </div>
      </div>
      <form action={formAction} className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "..." : "Approuver la preuve"}
        </Button>
        {state.error ? <span className="text-body text-ember">{state.error}</span> : null}
      </form>
    </Card>
  );
}

function ProofApprovedCard({ row }: ReviewCardProps) {
  const boundAction = markPaid.bind(null, row.assignmentId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-body-lg font-medium text-ink">
          {row.runnerFirstName} {row.runnerLastName}
        </p>
        <p className="text-body text-mid-gray">
          {row.eventName}
          {row.eventDate ? ` · ${new Date(row.eventDate).toLocaleDateString("fr-FR")}` : ""}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="solid">{PLACEMENT_LABELS[row.placement] ?? row.placement}</Badge>
          <Badge variant="soft">{row.runnerPayoutAmount != null ? `${row.runnerPayoutAmount.toFixed(2)} €` : "—"}</Badge>
        </div>
      </div>
      <form action={formAction} className="flex items-center gap-2">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "..." : "Marquer comme payé"}
        </Button>
        {state.error ? <span className="text-body text-ember">{state.error}</span> : null}
      </form>
    </Card>
  );
}

interface ProofReviewListProps {
  toApprove: AssignmentReviewRow[];
  toPay: AssignmentReviewRow[];
}

export function ProofReviewList({ toApprove, toPay }: ProofReviewListProps) {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="text-body-lg font-medium text-ink">
          Preuves à valider ({toApprove.length})
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {toApprove.map((row) => (
            <ProofSubmittedCard key={row.assignmentId} row={row} />
          ))}
          {toApprove.length === 0 ? (
            <p className="text-body text-mid-gray">Rien à valider pour le moment.</p>
          ) : null}
        </div>
      </div>

      <div>
        <h2 className="text-body-lg font-medium text-ink">
          Paiements à effectuer ({toPay.length})
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          {toPay.map((row) => (
            <ProofApprovedCard key={row.assignmentId} row={row} />
          ))}
          {toPay.length === 0 ? (
            <p className="text-body text-mid-gray">Aucun paiement en attente.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
