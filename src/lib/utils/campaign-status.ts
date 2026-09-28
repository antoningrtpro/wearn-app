export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  none: "Brouillon non soumis",
  draft: "Brouillon",
  quoted: "Devis envoyé",
  validated: "Validée",
  in_progress: "En cours",
  completed: "Terminée",
  cancelled: "Annulée",
};

export const CAMPAIGN_STATUS_DOT_CLASS: Record<string, string> = {
  none: "bg-mid-gray",
  draft: "bg-admin-status-draft",
  quoted: "bg-admin-status-quoted",
  validated: "bg-admin-status-validated",
  in_progress: "bg-admin-status-progress",
  completed: "bg-admin-status-done",
  cancelled: "bg-admin-status-cancelled",
};

export function campaignStatusKey(status: string | null): string {
  return status ?? "none";
}
