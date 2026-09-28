import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { PublicEventWithRaces } from "@/lib/types/public";

export async function getPublicEventsWithRaces(): Promise<PublicEventWithRaces[]> {
  const snap = await adminDb.collection("events").orderBy("date", "asc").get();

  return Promise.all(
    snap.docs.map(async (doc) => {
      const data = doc.data();
      const racesSnap = await doc.ref.collection("races").orderBy("distanceKm", "asc").get();

      return {
        id: doc.id,
        name: data.name,
        date: data.date,
        city: data.city,
        distanceKm: data.distanceKm ?? null,
        estimatedParticipants: data.estimatedParticipants,
        imageUrl: data.imageUrl ?? null,
        races: racesSnap.docs.map((r) => {
          const rd = r.data();
          return { id: r.id, name: rd.name as string, distanceKm: rd.distanceKm as number };
        }),
      };
    })
  );
}
