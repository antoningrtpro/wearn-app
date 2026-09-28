/**
 * Firestore schema types. Mirrors the collection layout enforced by firestore.rules.
 * Timestamps are stored as Firestore Timestamps server-side; these types describe the
 * shape after `.data()` in Node/Admin context. Client-side reads should convert via
 * the converters in `src/lib/firebase/converters.ts`.
 */
import type { Timestamp } from "firebase/firestore";

export type ClothingSize = "XS" | "S" | "M" | "L" | "XL" | "XXL";

/**
 * Was a fixed union ("dos" | "manche" | "short" | "dossard") — now a plain
 * string because admins can add/remove placements at runtime (see
 * /admin/parametres-globaux). The four original codes still work exactly as
 * before via the PLACEMENT_LABELS maps sprinkled through the UI.
 */
export type Placement = string;

export type Gender = "homme" | "femme" | "autre";

export type CampaignStatus =
  | "draft"
  | "quoted"
  | "validated"
  | "in_progress"
  | "completed"
  | "cancelled";

export type CampaignStep = "info" | "event" | "targeting" | "submitted";

export type AssignmentStatus =
  | "proposed"
  | "validated_by_brand"
  | "refused_by_brand"
  | "validated_by_runner"
  | "declined_by_runner"
  | "sticker_confirmed"
  | "proof_submitted"
  | "proof_approved"
  | "paid"
  | "no_show";

export interface Runner {
  id: string;
  authUid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Collected at signup step 2 — null between step 1 (account creation) and step 2. */
  gender: Gender | null;
  /** Collected at signup step 2 — null between step 1 (account creation) and step 2. */
  birthDate: string | null; // ISO date (YYYY-MM-DD)
  /** No longer collected at self-signup — only set when an admin fills it
   * in manually. Null until then. */
  city: string | null;
  /** No longer collected at self-signup (see `city`). */
  clothingSize: ClothingSize | null;
  profilePhotoUrl: string;
  acceptedPlacements: Placement[];
  /** Payout details — no longer collected at self-signup (see `city`). */
  ibanOrPaymentRef: string | null;
  taxStatus: string | null;
  /** Event ids the runner has checked "je participe" for on their profile —
   * lets admin quickly pull up the participant list for a given event. */
  participatingEventIds: string[];
  /**
   * For events that have sub-races defined, the specific race the runner
   * selected, keyed by eventId. Absent for an eventId means the runner
   * participates in the event without specifying which race ("peu importe
   * la course"). Only meaningful alongside participatingEventIds — an entry
   * here for an event the runner isn't participating in is inert.
   */
  eventRaceSelections: Record<string, string>;
  /** At least one required, collected at signup step 2 — null when not provided. */
  instagramHandle: string | null;
  facebookHandle: string | null;
  tiktokHandle: string | null;
  /**
   * Signup is now spread across 3 steps, with the account (Auth + this doc)
   * created right after step 1. `signupStep` tracks how far they got so a
   * later login can resume exactly where they left off; `signupCompleted`
   * is the fast-path check everywhere else (e.g. routing after login).
   */
  signupStep: 1 | 2 | 3;
  signupCompleted: boolean;
  createdAt: Timestamp;
}

/** Fields of Runner that are safe to expose to the brand validation view. */
export const RUNNER_BRAND_SAFE_FIELDS = [
  "profilePhotoUrl",
  "gender",
  "birthDate",
  "city",
] as const;

/** One doc per admin account, keyed by Firebase Auth uid — just the display
 * profile (name); email/password stay in Firebase Auth. */
export interface AdminProfile {
  id: string;
  authUid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  createdAt: Timestamp;
}

export interface Brand {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  siret: string;
  createdAt: Timestamp;
}

/**
 * An individual person with login access to one brand's space
 * (`/marque/*`), keyed by Firebase Auth uid like `Runner`. A brand can have
 * several — created only by an admin (see /admin/marques), never self-signup.
 * The custom claim `{ role: "brand", brandId }` is what actually gates
 * access; this doc is the profile + the read path for "who is this person".
 */
export interface Collaborator {
  id: string;
  authUid: string;
  brandId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: Timestamp;
}

export interface Event {
  id: string;
  name: string;
  date: string; // ISO date
  city: string;
  /** Optional — some events (multi-race weekends like Saintélyon) don't have
   * a single meaningful distance; use the sub-events (races) instead. */
  distanceKm: number | null;
  estimatedParticipants: number;
  /** Cover image shown on runner/brand event cards — a URL the admin pastes
   * in when creating the event. Null when none was provided. */
  imageUrl: string | null;
  createdAt: Timestamp;
}

/**
 * A specific race within an event (e.g. "10 km", "Semi-marathon"), stored as
 * a subcollection at events/{eventId}/races/{raceId}. Optional — an event
 * with no races behaves exactly as before (a single implicit race described
 * by the event's own distanceKm). When races exist, runners and brands can
 * pick one specifically, or none ("peu importe la course").
 */
export interface EventRace {
  id: string;
  name: string;
  distanceKm: number;
  createdAt: Timestamp;
}

export interface Campaign {
  id: string;
  brandId: string | null;
  /**
   * The collaborator (brands/{brandId} team member) who created this
   * campaign from their own space, if any — null when an admin created it
   * directly on the brand's behalf. Every collaborator of the same brand
   * can still see and manage the campaign regardless of who created it;
   * this is purely an attribution record ("qui a fait la demande").
   */
  collaboratorId: string | null;
  eventId: string | null;
  /**
   * Free-text event name the brand typed when they picked "Autre" at step 2
   * instead of a real event from the list. Set alongside eventId == null;
   * an admin later associates a real event manually (see
   * /admin/campagnes/[id] "Événement à associer"), which sets eventId and
   * leaves this as a reference of what the brand originally wrote.
   */
  customEventName: string | null;
  /**
   * Specific race (events/{eventId}/races/{raceId}) the brand picked within
   * eventId, or null for "peu importe la course" (any race of that event).
   * Always null when eventId is null.
   */
  raceId: string | null;
  status: CampaignStatus | null; // null until final submission ("draft" onward)
  currentStep: CampaignStep;
  /** Devis PDF the admin generates externally and uploads here — no
   * in-app quote generation. */
  pdfQuoteUrl: string | null;
  /** Total quote amount, entered manually by the admin alongside the PDF. */
  quoteAmount: number | null;
  quoteSentAt: Timestamp | null;
  quoteValidatedAt: Timestamp | null;
  /**
   * Admin-only, per-campaign commission override (e.g. a reduced margin for a
   * large recurring client). Nullable — when null, platformConfig's
   * defaultCommissionRate applies to every segment of this campaign instead.
   * Never exposed to the brand or the runner: it lives on `campaigns`, which
   * is admin-only for both read and write in firestore.rules, same
   * protection level as defaultCommissionRate. Set from the campaign detail
   * view in the admin dashboard.
   */
  commissionRateOverride: number | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CampaignSegment {
  id: string;
  campaignId: string;
  targetGender: Gender | "tous";
  targetAgeMin: number;
  targetAgeMax: number;
  placement: Placement;
  /**
   * Requested runner count as a range (picked from a fixed bracket list in
   * the UI — see RUNNER_COUNT_BRACKETS) rather than a free-typed figure —
   * the brand/admin states roughly how many they want, and the admin picks
   * the actual final number per runner during shortlisting.
   */
  requestedRunnerCountMin: number;
  requestedRunnerCountMax: number;
  /**
   * What each runner shortlisted on this segment gets paid — set directly by
   * the admin (no more derivation from a brand unit price minus commission,
   * since per-segment brand pricing was removed). Must be set before the
   * admin can propose runners on this segment (see proposeRunners).
   */
  runnerPayoutAmount: number | null;
  notes: string | null;
  createdAt: Timestamp;
}

export interface Assignment {
  id: string;
  campaignSegmentId: string;
  runnerId: string;
  status: AssignmentStatus;
  runnerPayoutAmount: number | null; // computed server-side only, never derivable client-side
  proofPhotoUrl: string | null;
  proofSubmittedAt: Timestamp | null;
  brandValidatedAt: Timestamp | null;
  runnerValidatedAt: Timestamp | null;
  stickerConfirmedAt: Timestamp | null;
  /** Set when a runner backs out after already validating/confirming (see
   * firestore.rules) — distinguishes a late withdrawal from a same-batch
   * decline at proposal time (runnerValidatedAt only). */
  withdrawnAt: Timestamp | null;
  createdAt: Timestamp;
}

/** Lightweight admin-facing alert (e.g. a runner withdrawing from a
 * confirmed campaign) — surfaced on the admin dashboard. */
export interface AdminNotification {
  id: string;
  type: "runner_withdrew";
  message: string;
  runnerId: string;
  runnerName: string;
  eventId: string | null;
  eventName: string;
  assignmentId: string;
  read: boolean;
  createdAt: Timestamp;
}

/**
 * Singleton document at platformConfig/config. The document itself is
 * admin-only to read/write per firestore.rules, but `placements` still
 * reaches public/runner/brand pages — always through a server component
 * using the Admin SDK (see getPlatformConfig), never a direct client read.
 */
export interface PlatformConfig {
  /** Default rate applied when a campaign has no commissionRateOverride. E.g. 0.4 for 40%. */
  defaultCommissionRate: number;
  /**
   * The full set of garment placements admin/brands/runners can pick from
   * (e.g. "dos", "manche", or any label an admin adds later — new entries
   * have no dedicated i18n label, they're just displayed as typed).
   */
  placements: string[];
  updatedAt: Timestamp;
  updatedBy: string; // admin authUid
}

export const ASSIGNMENT_PROGRESS_ORDER: AssignmentStatus[] = [
  "proposed",
  "validated_by_brand",
  "validated_by_runner",
  "sticker_confirmed",
  "proof_submitted",
  "proof_approved",
  "paid",
];
