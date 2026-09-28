export const RUNNER_PROGRESS_STEPS = [
  { key: "proposed", label: "Proposé" },
  { key: "validated_by_runner", label: "Accepté" },
  { key: "sticker_confirmed", label: "Sticker reçu" },
  { key: "proof_submitted", label: "Preuve envoyée" },
  { key: "paid", label: "Payé" },
] as const;

/** Maps a raw assignment status onto the 5-step runner-facing progress bar. */
export function runnerProgressIndex(status: string): number {
  switch (status) {
    case "proposed":
    case "validated_by_brand":
      return 0;
    case "validated_by_runner":
      return 1;
    case "sticker_confirmed":
      return 2;
    case "proof_submitted":
    case "proof_approved":
      return 3;
    case "paid":
      return 4;
    default:
      return 0;
  }
}
