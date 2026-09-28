import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Server-only Firebase Admin SDK. Never import this from a client component —
 * the `server-only` guard throws a build error if it leaks into client bundles.
 *
 * Requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * (service account credentials) as server-side env vars. See .env.example.
 */

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;

  // Against the Local Emulator Suite, the SDKs auto-detect the *_EMULATOR_HOST
  // env vars and skip credential checks — a projectId is enough.
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({
      projectId: projectId ?? "wearn-dev",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const app = getAdminApp();

export const adminAuth: Auth = getAuth(app);
export const adminDb: Firestore = getFirestore(app);
export const adminStorage: Storage = getStorage(app);
