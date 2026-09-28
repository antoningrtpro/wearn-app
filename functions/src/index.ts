import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

initializeApp();
const db = getFirestore();

interface AssignmentDecisionInput {
  validationToken: string;
  assignmentId: string;
}

/**
 * Loads the campaign that owns `assignmentId` via its segment, and verifies
 * `validationToken` matches — this is the brand's only form of "auth" since
 * brands have no Firebase Auth account in V1. Throws if anything doesn't line
 * up, so a guessed assignmentId with the wrong token is rejected.
 */
async function loadAssignmentForToken(assignmentId: string, validationToken: string) {
  const assignmentRef = db.collection("assignments").doc(assignmentId);
  const assignmentSnap = await assignmentRef.get();
  if (!assignmentSnap.exists) {
    throw new HttpsError("not-found", "Assignment introuvable.");
  }
  const assignment = assignmentSnap.data()!;

  const segmentRef = db
    .collectionGroup("campaignSegments")
    .where("id", "==", assignment.campaignSegmentId)
    .limit(1);
  const segmentQuery = await segmentRef.get();
  if (segmentQuery.empty) {
    throw new HttpsError("not-found", "Segment introuvable.");
  }
  const segmentDoc = segmentQuery.docs[0];
  const segment = segmentDoc.data();

  const campaignRef = db.collection("campaigns").doc(segment.campaignId);
  const campaignSnap = await campaignRef.get();
  if (!campaignSnap.exists) {
    throw new HttpsError("not-found", "Campagne introuvable.");
  }
  const campaign = campaignSnap.data()!;

  if (!campaign.validationToken || campaign.validationToken !== validationToken) {
    throw new HttpsError("permission-denied", "Lien de validation invalide.");
  }

  return { assignmentRef, assignment, segmentDoc, segment, campaignRef, campaign };
}

/**
 * Brand validates a proposed runner profile on the tokenized page.
 *
 * This is the ONLY place runnerPayoutAmount is computed. It reads
 * unitPriceBrand (segment) and the effective commission rate — the parent
 * campaign's commissionRateOverride if set, else platformConfig's
 * defaultCommissionRate — server-side, writes the result onto the
 * assignment, and returns nothing but a success flag. The client never
 * receives unitPriceBrand, commissionRateOverride, or defaultCommissionRate.
 */
export const onBrandValidateProfile = onCall<AssignmentDecisionInput>(
  { region: "europe-west1" },
  async (request) => {
    const { validationToken, assignmentId } = request.data;
    if (!validationToken || !assignmentId) {
      throw new HttpsError("invalid-argument", "Paramètres manquants.");
    }

    const { assignmentRef, assignment, segment, campaign } = await loadAssignmentForToken(
      assignmentId,
      validationToken
    );

    if (assignment.status !== "proposed") {
      throw new HttpsError(
        "failed-precondition",
        "Ce profil n'est plus en attente de validation."
      );
    }

    const unitPriceBrand = segment.unitPriceBrand;
    if (typeof unitPriceBrand !== "number") {
      throw new HttpsError("failed-precondition", "Prix marque non défini pour ce segment.");
    }

    // Per-campaign override prevails over the platform default when set.
    let effectiveCommissionRate: number | undefined = campaign.commissionRateOverride ?? undefined;
    if (typeof effectiveCommissionRate !== "number") {
      const configSnap = await db.collection("platformConfig").doc("config").get();
      effectiveCommissionRate = configSnap.data()?.defaultCommissionRate;
    }
    if (typeof effectiveCommissionRate !== "number") {
      throw new HttpsError("internal", "Configuration de commission manquante.");
    }

    const runnerPayoutAmount =
      Math.round(unitPriceBrand * (1 - effectiveCommissionRate) * 100) / 100;

    await assignmentRef.update({
      status: "validated_by_brand",
      runnerPayoutAmount,
      brandValidatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("Assignment validated by brand", { assignmentId });

    // Runner notification (no amount included — they see it once logged in).
    // TODO: wire to Resend once runner email templates are finalized.

    return { success: true };
  }
);

/** Brand refuses a proposed runner profile. No notification is sent (per spec). */
export const onBrandRefuseProfile = onCall<AssignmentDecisionInput>(
  { region: "europe-west1" },
  async (request) => {
    const { validationToken, assignmentId } = request.data;
    if (!validationToken || !assignmentId) {
      throw new HttpsError("invalid-argument", "Paramètres manquants.");
    }

    const { assignmentRef, assignment } = await loadAssignmentForToken(
      assignmentId,
      validationToken
    );

    if (assignment.status !== "proposed") {
      throw new HttpsError(
        "failed-precondition",
        "Ce profil n'est plus en attente de validation."
      );
    }

    await assignmentRef.update({
      status: "refused_by_brand",
      brandValidatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("Assignment refused by brand", { assignmentId });

    return { success: true };
  }
);
