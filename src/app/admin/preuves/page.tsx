import { getAssignmentsForReview } from "@/lib/server/admin-assignments";
import { ProofReviewList } from "@/components/admin/proof-review-list";

export default async function ProofReviewPage() {
  const rows = await getAssignmentsForReview(["proof_submitted", "proof_approved"]);
  const toApprove = rows.filter((r) => r.status === "proof_submitted");
  const toPay = rows.filter((r) => r.status === "proof_approved");

  return (
    <main className="mx-auto max-w-(--page-max-width) px-8 py-8">
      <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">
        Preuves et paiements
      </h1>
      <p className="mt-1 text-body text-mid-gray">
        Statut &laquo;&nbsp;payé&nbsp;&raquo; coché manuellement une fois le virement effectué —
        aucune automatisation de paiement en V1.
      </p>

      <div className="mt-8">
        <ProofReviewList toApprove={toApprove} toPay={toPay} />
      </div>
    </main>
  );
}
