import fs from "node:fs";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { nanoid } from "nanoid";

initializeApp({ projectId: "wearn-dev", storageBucket: "wearn-dev.appspot.com" });
const auth = getAuth();
const db = getFirestore();

// platformConfig
await db.collection("platformConfig").doc("config").set({
  defaultCommissionRate: 0.4,
  updatedAt: FieldValue.serverTimestamp(),
  updatedBy: "seed-script",
});
console.log("platformConfig ok");

// admin
try {
  await auth.getUserByEmail("admin@wearn.test");
} catch {
  const u = await auth.createUser({ email: "admin@wearn.test", password: "password123" });
  await auth.setCustomUserClaims(u.uid, { role: "admin" });
}
console.log("admin ok");

// brand + campaign + segment
const brandRef = db.collection("brands").doc();
await brandRef.set({
  id: brandRef.id,
  companyName: "Acme Running Co",
  contactName: "Jane Doe",
  contactEmail: "jane@acme-running.com",
  contactPhone: "0612345678",
  sector: "Sport",
  createdAt: FieldValue.serverTimestamp(),
});

const eventsSnap = await db.collection("events").limit(1).get();
const eventId = eventsSnap.docs[0].id;

const validationToken = nanoid(32);
const campaignRef = db.collection("campaigns").doc();
await campaignRef.set({
  id: campaignRef.id,
  brandId: brandRef.id,
  eventId,
  status: "quoted",
  currentStep: "submitted",
  pdfQuoteUrl: `/api/admin/campaigns/${campaignRef.id}/quote-pdf`,
  quoteSentAt: FieldValue.serverTimestamp(),
  quoteValidatedAt: null,
  validationToken,
  commissionRateOverride: null,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
});

const segmentRef = campaignRef.collection("campaignSegments").doc();
await segmentRef.set({
  id: segmentRef.id,
  campaignId: campaignRef.id,
  targetGender: "tous",
  targetAgeMin: 18,
  targetAgeMax: 45,
  targetCity: null,
  placement: "dos",
  requestedRunnerCount: 5,
  unitPriceBrand: 100,
  notes: null,
  createdAt: FieldValue.serverTimestamp(),
});

console.log("campaign ok:", campaignRef.id, "segment:", segmentRef.id);

// runner via the signup API (for real Storage upload + claim)
const form = new FormData();
form.append("firstName", "Valentine");
form.append("lastName", "Roche");
form.append("email", "valentine.roche@example.com");
form.append("password", "password1234");
form.append("confirmPassword", "password1234");
form.append("phone", "0600000000");
form.append("gender", "femme");
form.append("birthDate", "1995-05-05");
form.append("city", "Paris");
form.append("clothingSize", "M");
form.append("acceptedPlacements", JSON.stringify(["dos"]));
form.append("ibanOrPaymentRef", "FR7630006000011234567890189");
form.append("taxStatus", "particulier");
form.append("profilePhoto", new Blob([fs.readFileSync("/tmp/valrunner.jpg")], { type: "image/jpeg" }), "profile.jpg");
const res = await fetch("http://localhost:3512/api/runners", { method: "POST", body: form });
console.log("runner signup:", res.status, await res.text());

const runnerUser = await auth.getUserByEmail("valentine.roche@example.com");

// assignment: proposed
const assignmentRef = db.collection("assignments").doc(`${segmentRef.id}_${runnerUser.uid}`);
await assignmentRef.set({
  id: assignmentRef.id,
  campaignSegmentId: segmentRef.id,
  runnerId: runnerUser.uid,
  status: "proposed",
  runnerPayoutAmount: null,
  proofPhotoUrl: null,
  proofSubmittedAt: null,
  brandValidatedAt: null,
  runnerValidatedAt: null,
  stickerConfirmedAt: null,
  createdAt: FieldValue.serverTimestamp(),
});

console.log("VALIDATION_URL:", `http://localhost:3512/validation/${campaignRef.id}?token=${validationToken}`);
process.exit(0);
