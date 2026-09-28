"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";

export interface MarginOverrideState {
  error?: string;
  success?: boolean;
}

export interface AssociateEventState {
  error?: string;
  success?: boolean;
}

export interface QuoteState {
  error?: string;
  success?: boolean;
}

export interface SegmentPayoutState {
  error?: string;
  success?: boolean;
}

/**
 * Links a campaign that came in with a hand-typed "Autre" event name to a
 * real event once the admin has figured out which one it actually is.
 * customEventName is kept as-is afterward, purely as a record of what the
 * brand originally wrote.
 */
export async function associateEvent(
  campaignId: string,
  _prevState: AssociateEventState,
  formData: FormData
): Promise<AssociateEventState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const eventId = formData.get("eventId");
  if (typeof eventId !== "string" || eventId.trim() === "") {
    return { error: "Sélectionnez un événement." };
  }

  const eventSnap = await adminDb.collection("events").doc(eventId).get();
  if (!eventSnap.exists) {
    return { error: "Événement introuvable." };
  }

  await adminDb.collection("campaigns").doc(campaignId).update({
    eventId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/admin/campagnes/${campaignId}`);
  return { success: true };
}

/**
 * Sets or clears a campaign's commissionRateOverride. Admin-only — re-checked
 * here via the session cookie even though the page itself is already
 * guarded, since server actions are directly callable endpoints.
 *
 * An empty value clears the override so platformConfig.defaultCommissionRate
 * applies again. This never returns the effective rate or the platform
 * default to the client — only success/error.
 */
export async function updateCommissionOverride(
  campaignId: string,
  _prevState: MarginOverrideState,
  formData: FormData
): Promise<MarginOverrideState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const raw = formData.get("commissionRateOverride");
  const rawStr = typeof raw === "string" ? raw.trim() : "";

  let value: number | null = null;
  if (rawStr !== "") {
    const parsed = Number(rawStr);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
      return { error: "Le taux doit être un nombre entre 0 et 1 (ex. 0.25 pour 25%)." };
    }
    value = parsed;
  }

  await adminDb.collection("campaigns").doc(campaignId).update({
    commissionRateOverride: value,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/admin/campagnes/${campaignId}`);
  return { success: true };
}

/**
 * Saves the devis (quote) the admin generated externally: the PDF file
 * (optional — keeps the existing one if none is uploaded) and the total
 * amount. No in-app PDF generation — the admin just uploads what they made.
 */
export async function saveQuote(
  campaignId: string,
  _prevState: QuoteState,
  formData: FormData
): Promise<QuoteState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const amountRaw = formData.get("quoteAmount");
  const amountStr = typeof amountRaw === "string" ? amountRaw.trim() : "";
  let quoteAmount: number | null = null;
  if (amountStr !== "") {
    const parsed = Number(amountStr);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { error: "Montant invalide." };
    }
    quoteAmount = parsed;
  }

  const update: Record<string, unknown> = {
    quoteAmount,
    updatedAt: FieldValue.serverTimestamp(),
  };

  const file = formData.get("pdfFile");
  if (file instanceof File && file.size > 0) {
    if (file.type !== "application/pdf") {
      return { error: "Le fichier doit être un PDF." };
    }
    const bucket = adminStorage.bucket();
    const filePath = `quotePdfs/${campaignId}/devis.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await bucket.file(filePath).save(buffer, { metadata: { contentType: "application/pdf" } });
    update.pdfQuoteUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;
  }

  await adminDb.collection("campaigns").doc(campaignId).update(update);

  revalidatePath(`/admin/campagnes/${campaignId}`);
  return { success: true };
}

/** Toggles the "envoyé" (sent) marker for the devis — admin marks this
 * manually once they've actually sent it to the brand. */
export async function setQuoteSent(
  campaignId: string,
  sent: boolean,
  _prevState: QuoteState,
  _formData: FormData
): Promise<QuoteState> {
  void _formData;
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  await adminDb.collection("campaigns").doc(campaignId).update({
    quoteSentAt: sent ? FieldValue.serverTimestamp() : null,
    status: sent ? "quoted" : "draft",
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/admin/campagnes/${campaignId}`);
  return { success: true };
}

/**
 * Sets what each runner shortlisted on this segment gets paid. Required
 * before the admin can propose runners on it (see proposeRunners) — this
 * is now a direct admin decision rather than derived from a brand price.
 */
export async function updateSegmentPayout(
  campaignId: string,
  segmentId: string,
  _prevState: SegmentPayoutState,
  formData: FormData
): Promise<SegmentPayoutState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const raw = formData.get("runnerPayoutAmount");
  const rawStr = typeof raw === "string" ? raw.trim() : "";
  const amount = Number(rawStr);
  if (rawStr === "" || !Number.isFinite(amount) || amount < 0) {
    return { error: "Montant invalide." };
  }

  await adminDb
    .collection("campaigns")
    .doc(campaignId)
    .collection("campaignSegments")
    .doc(segmentId)
    .update({ runnerPayoutAmount: amount });

  revalidatePath(`/admin/campagnes/${campaignId}`);
  return { success: true };
}

/** Toggles the "signé" (validated) marker for the devis. */
export async function setQuoteValidated(
  campaignId: string,
  validated: boolean,
  _prevState: QuoteState,
  _formData: FormData
): Promise<QuoteState> {
  void _formData;
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  await adminDb.collection("campaigns").doc(campaignId).update({
    quoteValidatedAt: validated ? FieldValue.serverTimestamp() : null,
    status: validated ? "validated" : "quoted",
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/admin/campagnes/${campaignId}`);
  return { success: true };
}
