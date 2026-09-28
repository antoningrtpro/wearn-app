import { z } from "zod";

export const eventSchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  date: z.string().trim().min(1, "Date requise"),
  city: z.string().trim().min(1, "Ville requise"),
  distanceKm: z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : null),
    z.number().positive("Doit être positif").nullable()
  ),
  estimatedParticipants: z.coerce.number().int().positive("Doit être positif"),
  imageUrl: z.string().trim().url("URL invalide").optional().or(z.literal("")).nullable(),
});
