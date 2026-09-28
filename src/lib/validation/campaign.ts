import { z } from "zod";

// Placements are admin-configurable (see /admin/parametres-globaux), so this
// can't be a fixed enum anymore — just require a non-empty value.
export const placementSchema = z.string().trim().min(1, "Emplacement requis");
export const targetGenderSchema = z.enum(["homme", "femme", "autre", "tous"]);

export const segmentSchema = z
  .object({
    targetGender: targetGenderSchema,
    targetAgeMin: z.number().int().min(16).max(99),
    targetAgeMax: z.number().int().min(16).max(99),
    placement: placementSchema,
    requestedRunnerCountMin: z.number().int().min(1).max(100000),
    requestedRunnerCountMax: z.number().int().min(1).max(100000),
    notes: z.string().trim().optional().nullable(),
  })
  .refine((data) => data.targetAgeMin <= data.targetAgeMax, {
    message: "L'âge min doit être inférieur ou égal à l'âge max",
    path: ["targetAgeMax"],
  })
  .refine((data) => data.requestedRunnerCountMin <= data.requestedRunnerCountMax, {
    message: "Le minimum doit être inférieur ou égal au maximum",
    path: ["requestedRunnerCountMax"],
  });
export type SegmentInput = z.infer<typeof segmentSchema>;

export const segmentsStepSchema = z.object({
  segments: z.array(segmentSchema).min(1, "Ajoutez au moins un ciblage"),
});
