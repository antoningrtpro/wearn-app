"use server";

import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import { resolveEventRace, createCampaignWithSegments } from "@/lib/server/campaigns";
import { segmentsStepSchema } from "@/lib/validation/campaign";

export interface CreateCampaignForBrandState {
  error?: string;
}

export async function createCampaignForBrand(
  _prevState: CreateCampaignForBrandState,
  formData: FormData
): Promise<CreateCampaignForBrandState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const rawBrandId = formData.get("brandId");
  if (typeof rawBrandId !== "string" || rawBrandId.trim() === "") {
    return { error: "Sélectionnez une marque." };
  }
  const brandSnap = await adminDb.collection("brands").doc(rawBrandId).get();
  if (!brandSnap.exists) {
    return { error: "Marque introuvable." };
  }
  const brandId = rawBrandId;

  const rawEventId = formData.get("eventId");
  const eventId = typeof rawEventId === "string" && rawEventId.trim() !== "" ? rawEventId : null;
  const rawCustomEventName = formData.get("customEventName");
  const customEventName =
    typeof rawCustomEventName === "string" && rawCustomEventName.trim() !== ""
      ? rawCustomEventName.trim()
      : null;

  if (!eventId && !customEventName) {
    return { error: "Choisissez un événement ou saisissez son nom." };
  }

  const resolved = await resolveEventRace(eventId, formData.get("raceId"));
  if ("error" in resolved) {
    return { error: resolved.error };
  }

  const segmentsJson = formData.get("segmentsJson");
  let segmentsRaw: unknown;
  try {
    segmentsRaw = JSON.parse(typeof segmentsJson === "string" ? segmentsJson : "[]");
  } catch {
    return { error: "Ciblages invalides." };
  }
  const parsedSegments = segmentsStepSchema.safeParse({ segments: segmentsRaw });
  if (!parsedSegments.success) {
    return { error: parsedSegments.error.issues[0]?.message ?? "Ciblages invalides." };
  }

  await createCampaignWithSegments({
    brandId,
    collaboratorId: null,
    eventId: resolved.eventId,
    customEventName,
    raceId: resolved.raceId,
    segments: parsedSegments.data.segments,
  });

  redirect("/admin/campagnes");
}
