import { getSession } from "@/lib/firebase/session";
import { getAllCampaignsForRunner } from "@/lib/server/runner-assignments";
import { RunnerCampaignsView } from "@/components/runner/runner-campaigns-view";

const ACTIVE_STATUSES = new Set([
  "validated_by_runner",
  "sticker_confirmed",
  "proof_submitted",
  "proof_approved",
  "paid",
]);
const HISTORY_STATUSES = new Set(["refused_by_brand", "declined_by_runner", "no_show"]);

export default async function CoureurCampagnesPage() {
  const session = await getSession();
  const rows = session ? await getAllCampaignsForRunner(session.uid) : [];

  const pendingReview = rows.filter((r) => r.status === "validated_by_brand");
  const active = rows.filter((r) => ACTIVE_STATUSES.has(r.status));
  const history = rows.filter((r) => HISTORY_STATUSES.has(r.status));

  return (
    <main className="mx-auto max-w-(--page-max-width) px-8 py-8">
      <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">
        Mes campagnes
      </h1>
      <p className="mt-1 text-body text-mid-gray">
        Vos demandes, acceptations et refus — cliquez sur une campagne pour voir tous les
        détails.
      </p>
      <div className="mt-6">
        <RunnerCampaignsView pendingReview={pendingReview} active={active} history={history} />
      </div>
    </main>
  );
}
