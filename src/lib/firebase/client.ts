"use client";

import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, connectAuthEmulator, getAuth } from "firebase/auth";
import { type Firestore, connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { type FirebaseStorage, connectStorageEmulator, getStorage } from "firebase/storage";
import { type Functions, connectFunctionsEmulator, getFunctions } from "firebase/functions";

// Must match the `region` set on the Cloud Functions in functions/src/index.ts.
const FUNCTIONS_REGION = "europe-west1";

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

const firebaseConfig = useEmulator
  ? {
      apiKey: "demo-api-key",
      authDomain: "localhost",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "wearn-dev",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "wearn-dev.appspot.com",
    }
  : {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

export const firebaseApp: FirebaseApp =
  getApps()[0] ?? initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);
export const functions: Functions = getFunctions(firebaseApp, FUNCTIONS_REGION);

if (useEmulator && typeof window !== "undefined") {
  const g = globalThis as unknown as { __wearnEmulatorsConnected?: boolean };
  if (!g.__wearnEmulatorsConnected) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    g.__wearnEmulatorsConnected = true;
  }
}
