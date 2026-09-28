#!/usr/bin/env node
/**
 * One-off bootstrap script: grants the `admin` custom claim to a Firebase
 * Auth user by email. There is no in-app UI for this on purpose — the very
 * first admin can't grant themselves the role, and further admins should be
 * promoted by an existing admin via a dedicated server-side action, not this
 * script.
 *
 * Usage:
 *   node --env-file=.env.production.local scripts/set-admin-claim.mjs someone@wearn.app
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node --env-file=.env.production.local scripts/set-admin-claim.mjs <email>");
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in the environment."
  );
  process.exit(1);
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

const auth = getAuth();
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { role: "admin" });

console.log(`✓ ${email} (${user.uid}) is now an admin. They must sign out and back in.`);
