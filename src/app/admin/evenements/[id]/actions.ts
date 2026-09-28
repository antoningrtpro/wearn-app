"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import { eventRaceSchema } from "@/lib/validation/event-race";

export interface CreateRaceState {
  error?: string;
  success?: boolean;
}

export async function createRace(
  eventId: string,
  _prevState: CreateRaceState,
  formData: FormData
): Promise<CreateRaceState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const parsed = eventRaceSchema.safeParse({
    name: formData.get("name"),
    distanceKm: formData.get("distanceKm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const eventRef = adminDb.collection("events").doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) {
    return { error: "Événement introuvable." };
  }

  const raceRef = eventRef.collection("races").doc();
  await raceRef.set({
    id: raceRef.id,
    ...parsed.data,
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/admin/evenements/${eventId}`);
  revalidatePath("/demande");
  return { success: true };
}

export interface DeleteRaceState {
  error?: string;
  success?: boolean;
}

export async function deleteRace(
  eventId: string,
  raceId: string,
  _prevState: DeleteRaceState,
  _formData: FormData
): Promise<DeleteRaceState> {
  void _formData;
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  await adminDb.collection("events").doc(eventId).collection("races").doc(raceId).delete();

  revalidatePath(`/admin/evenements/${eventId}`);
  revalidatePath("/demande");
  return { success: true };
}
