import { z } from "zod";

export const genderSchema = z.enum(["homme", "femme", "autre"]);
export const clothingSizeSchema = z.enum(["XS", "S", "M", "L", "XL", "XXL"]);
// Placements are admin-configurable (see /admin/parametres-globaux), so this
// can't be a fixed enum anymore — just require a non-empty value.
export const placementSchema = z.string().trim().min(1, "Emplacement requis");

/** Legal majority (France) — anyone under 18 is rejected, see signup step 2. */
export function isAdult(birthDate: string): boolean {
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return false;
  const age = (Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return age >= 18 && age <= 99;
}

function isValidDateString(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

/** Signup step 1 — creates the account. Everything else is collected after. */
export const runnerSignupStep1Schema = z
  .object({
    firstName: z.string().trim().min(1, "Prénom requis"),
    lastName: z.string().trim().min(1, "Nom requis"),
    email: z.string().trim().email("Email invalide"),
    password: z.string().min(8, "8 caractères minimum"),
    confirmPassword: z.string(),
    phone: z.string().trim().min(6, "Téléphone invalide"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });
export type RunnerSignupStep1Input = z.infer<typeof runnerSignupStep1Schema>;

/** Signup step 2 — requires an already-authenticated runner session. */
export const runnerSignupStep2Schema = z
  .object({
    gender: genderSchema,
    // Majority is checked separately server-side (see /api/runners/me),
    // because failing it deletes the account rather than just erroring.
    birthDate: z.string().refine(isValidDateString, "Date de naissance invalide"),
    acceptedPlacements: z.array(placementSchema).min(1, "Choisissez au moins un emplacement"),
    instagramHandle: z.string().trim().optional().nullable(),
    facebookHandle: z.string().trim().optional().nullable(),
    tiktokHandle: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) => Boolean(data.instagramHandle || data.facebookHandle || data.tiktokHandle),
    { message: "Renseignez au moins un réseau social", path: ["instagramHandle"] }
  );
export type RunnerSignupStep2Input = z.infer<typeof runnerSignupStep2Schema>;

/** Signup step 3 — event participation, same trust level as the runner
 * toggling "je participe" directly later (see /api/runners/me). */
export const runnerSignupStep3Schema = z.object({
  participatingEventIds: z.array(z.string()),
  eventRaceSelections: z.record(z.string(), z.string()),
});
export type RunnerSignupStep3Input = z.infer<typeof runnerSignupStep3Schema>;

/**
 * Full profile in one shot — used only by the admin's manual runner
 * creation, which isn't split into steps (see /admin/coureurs actions).
 */
export const adminCreateRunnerSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().trim().min(6, "Téléphone invalide"),
  gender: genderSchema,
  birthDate: z.string().refine(isAdult, "Doit être majeur"),
  clothingSize: clothingSizeSchema,
  acceptedPlacements: z.array(placementSchema).min(1, "Choisissez au moins un emplacement"),
  ibanOrPaymentRef: z.string().trim().min(4, "IBAN ou référence de paiement requis"),
  taxStatus: z.string().trim().min(1, "Statut requis"),
  instagramHandle: z.string().trim().optional().nullable(),
  facebookHandle: z.string().trim().optional().nullable(),
  tiktokHandle: z.string().trim().optional().nullable(),
});
export type AdminCreateRunnerInput = z.infer<typeof adminCreateRunnerSchema>;

export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Identity block on /coureur/profil — name + phone, autosaved on blur.
 * Split from email (see runnerEmailUpdateSchema) because email changes also
 * touch the Firebase Auth account and need the Admin SDK. */
export const runnerIdentityUpdateSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis"),
  lastName: z.string().trim().min(1, "Nom requis"),
  phone: z.string().trim().min(6, "Téléphone invalide"),
});
export type RunnerIdentityUpdateInput = z.infer<typeof runnerIdentityUpdateSchema>;

export const runnerEmailUpdateSchema = z.object({
  email: z.string().trim().email("Email invalide"),
});
export type RunnerEmailUpdateInput = z.infer<typeof runnerEmailUpdateSchema>;
