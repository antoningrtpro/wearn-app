/**
 * Friendly labels for the four original placement codes. Any placement an
 * admin adds later (see /admin/parametres-globaux) has no entry here and is
 * just displayed as typed — this is a fallback map, not a source of truth.
 */
export const PLACEMENT_LABELS: Record<string, string> = {
  dos: "Dos (t-shirt)",
  manche: "Manche",
  short: "Short",
  dossard: "Dossard",
};

export function placementLabel(placement: string): string {
  return PLACEMENT_LABELS[placement] ?? placement;
}
