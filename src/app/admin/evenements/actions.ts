"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import { eventSchema } from "@/lib/validation/event";
import { eventRaceSchema } from "@/lib/validation/event-race";
import { ACCEPTED_PHOTO_TYPES, MAX_PROFILE_PHOTO_BYTES } from "@/lib/validation/runner";

export interface CreateEventState {
  error?: string;
  success?: boolean;
}

export async function createEvent(
  _prevState: CreateEventState,
  formData: FormData
): Promise<CreateEventState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const parsed = eventSchema.safeParse({
    name: formData.get("name"),
    date: formData.get("date"),
    city: formData.get("city"),
    distanceKm: formData.get("distanceKm"),
    estimatedParticipants: formData.get("estimatedParticipants"),
    imageUrl: formData.get("imageUrl"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  let quickRaces: { name: string; distanceKm: number }[] = [];
  const quickRacesJson = formData.get("quickRacesJson");
  if (typeof quickRacesJson === "string" && quickRacesJson.trim() !== "") {
    let raw: unknown;
    try {
      raw = JSON.parse(quickRacesJson);
    } catch {
      return { error: "Sous-événements invalides." };
    }
    const parsedRaces = eventRaceSchema.array().safeParse(raw);
    if (!parsedRaces.success) {
      return { error: parsedRaces.error.issues[0]?.message ?? "Sous-événements invalides." };
    }
    quickRaces = parsedRaces.data;
  }

  const eventRef = adminDb.collection("events").doc();
  const batch = adminDb.batch();
  batch.set(eventRef, {
    id: eventRef.id,
    ...parsed.data,
    imageUrl: parsed.data.imageUrl || null,
    createdAt: FieldValue.serverTimestamp(),
  });
  for (const race of quickRaces) {
    const raceRef = eventRef.collection("races").doc();
    batch.set(raceRef, {
      id: raceRef.id,
      name: race.name,
      distanceKm: race.distanceKm,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  revalidatePath("/admin/evenements");
  revalidatePath("/demande");
  return { success: true };
}

export interface UpdateEventState {
  error?: string;
  success?: boolean;
}

export async function updateEvent(
  eventId: string,
  _prevState: UpdateEventState,
  formData: FormData
): Promise<UpdateEventState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  // imageUrl is managed separately (see updateEventImage) — not part of this
  // form, so it's left out of both the parse and the update entirely rather
  // than risk overwriting it with null.
  const parsed = eventSchema.omit({ imageUrl: true }).safeParse({
    name: formData.get("name"),
    date: formData.get("date"),
    city: formData.get("city"),
    distanceKm: formData.get("distanceKm"),
    estimatedParticipants: formData.get("estimatedParticipants"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const eventRef = adminDb.collection("events").doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) {
    return { error: "Événement introuvable." };
  }

  await eventRef.update(parsed.data);

  revalidatePath("/admin/evenements");
  revalidatePath(`/admin/evenements/${eventId}`);
  revalidatePath("/demande");
  return { success: true };
}

export interface UpdateEventImageState {
  error?: string;
  imageUrl?: string;
}

export async function updateEventImage(
  eventId: string,
  _prevState: UpdateEventImageState,
  formData: FormData
): Promise<UpdateEventImageState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const photo = formData.get("imageFile");
  if (!(photo instanceof File) || photo.size === 0) {
    return { error: "Choisissez une image." };
  }
  if (!ACCEPTED_PHOTO_TYPES.includes(photo.type)) {
    return { error: "Format invalide (JPEG, PNG ou WebP)." };
  }
  if (photo.size > MAX_PROFILE_PHOTO_BYTES) {
    return { error: "Image trop volumineuse (5 Mo max)." };
  }

  const eventRef = adminDb.collection("events").doc(eventId);
  const eventSnap = await eventRef.get();
  if (!eventSnap.exists) {
    return { error: "Événement introuvable." };
  }

  const bucket = adminStorage.bucket();
  const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
  const filePath = `eventImages/${eventId}/cover.${extension}`;
  const file = bucket.file(filePath);
  const buffer = Buffer.from(await photo.arrayBuffer());
  await file.save(buffer, { metadata: { contentType: photo.type } });
  const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;

  await eventRef.update({ imageUrl });

  revalidatePath("/admin/evenements");
  revalidatePath(`/admin/evenements/${eventId}`);
  revalidatePath("/demande");
  return { imageUrl };
}
