"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/firebase/session";
import { resolveEventRace, createCampaignWithSegments } from "@/lib/server/campaigns";
import { segmentsStepSchema } from "@/lib/validation/campaign";

export interface CreateCampaignState {
  error?: string;
}

export async function createCampaignAsCollaborator(
  _prevState: CreateCampaignState,
  formData: FormData
): Promise<CreateCampaignState> {
  const session = await getSession();
  if (!session || session.role !== "brand" || !session.brandId) {
    return { error: "Non autorisé." };
  }

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
    brandId: session.brandId,
    collaboratorId: session.uid,
    eventId: resolved.eventId,
    customEventName,
    raceId: resolved.raceId,
    segments: parsedSegments.data.segments,
  });

  redirect("/marque");
}
