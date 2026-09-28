/** Shared labels/colors for an assignment's runner-facing status — one
 * definition reused by the dashboard, "Mes campagnes", and the campaign
 * detail panel, so they never drift out of sync with each other. */
export const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  /** Not a real AssignmentStatus — a plain "je participe" with no campaign
   * assignment yet (see getRunnerDashboardSummary). */
  participating: "Vous participez",
  validated_by_brand: "En attente de votre réponse",
  refused_by_brand: "Refusé par la marque",
  validated_by_runner: "Accepté",
  declined_by_runner: "Décliné",
  sticker_confirmed: "Sticker reçu",
  proof_submitted: "Preuve envoyée",
  proof_approved: "Preuve validée",
  paid: "Payé",
  no_show: "Absent",
};

export const ASSIGNMENT_STATUS_DOT_CLASS: Record<string, string> = {
  participating: "bg-admin-accent",
  validated_by_brand: "bg-admin-status-new",
  refused_by_brand: "bg-admin-negative",
  declined_by_runner: "bg-admin-negative",
  validated_by_runner: "bg-admin-status-quoted",
  sticker_confirmed: "bg-admin-status-progress",
  proof_submitted: "bg-admin-status-progress",
  proof_approved: "bg-admin-positive",
  paid: "bg-admin-positive",
  no_show: "bg-mid-gray",
};
