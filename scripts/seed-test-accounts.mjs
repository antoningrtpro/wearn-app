#!/usr/bin/env node
/**
 * Creates one test account per role (admin, brand, runner) directly against
 * the Firebase Emulator Suite, for local login testing. Safe to re-run —
 * existing accounts just have their password reset instead of failing.
 *
 * Usage (emulators must already be running — `npm run emulators`):
 *   node --env-file=.env.development.local scripts/seed-test-accounts.mjs
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error(
    "This script only runs against the Firebase Emulator Suite. Run it with --env-file=.env.development.local, with `npm run emulators` already running."
  );
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID ?? "wearn-dev";
initializeApp({ projectId });

const auth = getAuth();
const db = getFirestore();

const PASSWORD = "test1234";

async function upsertUser({ email, displayName }) {
  const existing = await auth.getUserByEmail(email).catch(() => null);
  if (existing) {
    await auth.updateUser(existing.uid, { password: PASSWORD });
    return existing;
  }
  return auth.createUser({ email, password: PASSWORD, displayName });
}

// --- Admin -----------------------------------------------------------------
const adminEmail = "admin@test.wearn";
const adminUser = await upsertUser({ email: adminEmail, displayName: "Admin Test" });
await auth.setCustomUserClaims(adminUser.uid, { role: "admin" });
await db.collection("admins").doc(adminUser.uid).set(
  {
    id: adminUser.uid,
    authUid: adminUser.uid,
    firstName: "Admin",
    lastName: "Test",
    email: adminEmail,
    createdAt: FieldValue.serverTimestamp(),
  },
  { merge: true }
);

// --- Brand + collaborator ---------------------------------------------------
const brandEmail = "marque@test.wearn";
const brandUser = await upsertUser({ email: brandEmail, displayName: "Marque Test" });

const existingCollaborator = await db.collection("collaborators").doc(brandUser.uid).get();
const brandId = existingCollaborator.exists ? existingCollaborator.data().brandId : db.collection("brands").doc().id;

await auth.setCustomUserClaims(brandUser.uid, { role: "brand", brandId });
await db.collection("brands").doc(brandId).set(
  {
    id: brandId,
    companyName: "Marque Test",
    siret: "12345678900012",
    contactName: "Marque Test",
    contactEmail: brandEmail,
    contactPhone: "0600000000",
    createdAt: FieldValue.serverTimestamp(),
  },
  { merge: true }
);
await db.collection("collaborators").doc(brandUser.uid).set(
  {
    id: brandUser.uid,
    authUid: brandUser.uid,
    brandId,
    firstName: "Marque",
    lastName: "Test",
    email: brandEmail,
    phone: "0600000000",
    createdAt: FieldValue.serverTimestamp(),
  },
  { merge: true }
);

// --- Runner ------------------------------------------------------------------
const runnerEmail = "coureur@test.wearn";
const runnerUser = await upsertUser({ email: runnerEmail, displayName: "Coureur Test" });
await auth.setCustomUserClaims(runnerUser.uid, { role: "runner" });
await db.collection("runners").doc(runnerUser.uid).set(
  {
    id: runnerUser.uid,
    authUid: runnerUser.uid,
    firstName: "Coureur",
    lastName: "Test",
    email: runnerEmail,
    phone: "0600000000",
    gender: "homme",
    birthDate: "1995-05-20",
    city: "Paris",
    clothingSize: "M",
    profilePhotoUrl: null,
    acceptedPlacements: [],
    ibanOrPaymentRef: null,
    taxStatus: null,
    instagramHandle: "coureur.test",
    facebookHandle: null,
    tiktokHandle: null,
    participatingEventIds: [],
    eventRaceSelections: {},
    signupStep: 3,
    signupCompleted: true,
    createdAt: FieldValue.serverTimestamp(),
  },
  { merge: true }
);

console.log(`
Comptes de test prêts (mot de passe pour tous : ${PASSWORD})

  admin   ${adminEmail}
  marque  ${brandEmail}
  coureur ${runnerEmail}
`);
