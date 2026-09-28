import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import { getAllRunners } from "@/lib/server/runners";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const eventRef = adminDb.collection("events").doc(id);
  const [eventSnap, racesSnap, allRunners] = await Promise.all([
    eventRef.get(),
    eventRef.collection("races").orderBy("distanceKm", "asc").get(),
    getAllRunners(),
  ]);
  if (!eventSnap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const event = eventSnap.data()!;
  const races = racesSnap.docs.map((doc) => {
    const r = doc.data();
    return { id: doc.id, name: r.name as string, distanceKm: r.distanceKm as number };
  });
  const raceNameById = new Map(races.map((r) => [r.id, r.name]));

  const participants = allRunners
    .filter((r) => r.participatingEventIds.includes(id))
    .map((r) => {
      const raceId = r.eventRaceSelections[id];
      return {
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        phone: r.phone,
        profilePhotoUrl: r.profilePhotoUrl,
        raceLabel: raceId ? (raceNameById.get(raceId) ?? "Course inconnue") : "Peu importe la course",
      };
    });

  return NextResponse.json({
    event: {
      id,
      name: event.name as string,
      city: event.city as string,
      date: event.date as string,
      distanceKm: (event.distanceKm as number | undefined) ?? null,
      estimatedParticipants: event.estimatedParticipants as number,
      imageUrl: (event.imageUrl as string | undefined) ?? null,
    },
    races,
    participants,
  });
}
