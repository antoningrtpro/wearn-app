import { z } from "zod";

export const eventRaceSchema = z.object({
  name: z.string().trim().min(1, "Nom requis"),
  distanceKm: z.coerce.number().positive("Doit être positif"),
});

export type EventRaceInput = z.infer<typeof eventRaceSchema>;
