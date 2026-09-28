/** Safe, runner-facing shapes. runnerPayoutAmount is pre-computed server-side
 * (see functions/src/index.ts) — never unitPriceBrand or commissionRate. */

export interface RunnerCampaignRow {
  assignmentId: string;
  campaignId: string;
  eventId: string | null;
  eventName: string;
  eventDate: string;
  eventCity: string;
  /** The specific race within the event this campaign's segment targets —
   * null when the brand didn't care which one ("peu importe la course"). */
  raceName: string | null;
  placement: string;
  targetGender: string;
  targetAgeMin: number;
  targetAgeMax: number;
  status: string;
  runnerPayoutAmount: number;
  proofPhotoUrl: string | null;
}

/** Kept as aliases — my-proposals.tsx and active-assignments.tsx only ever
 * destructure a subset of RunnerCampaignRow's fields, so no change needed
 * there when both are now fed from the same richer row shape. */
export type ProposalForRunner = RunnerCampaignRow;
export type ActiveAssignmentView = RunnerCampaignRow;
