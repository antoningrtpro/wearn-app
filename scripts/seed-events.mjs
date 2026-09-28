#!/usr/bin/env node
/**
 * Seeds a couple of sample events into Firestore — handy for local dev
 * against the emulator, where the admin dashboard doesn't exist yet to
 * create them by hand.
 *
 * Usage (emulator): node --env-file=.env.development.local scripts/seed-events.mjs
 */
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("FIRESTORE_EMULATOR_HOST is not set — refusing to seed a real project.");
  process.exit(1);
}

initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID ?? "wearn-dev" });
const db = getFirestore();

const events = [
  {
    name: "Marathon de Paris",
    date: "2026-04-12",
    city: "Paris",
    distanceKm: 42.2,
    estimatedParticipants: 45000,
  },
  {
    name: "10km de Lyon",
    date: "2026-05-03",
    city: "Lyon",
    distanceKm: 10,
    estimatedParticipants: 8000,
  },
];

for (const event of events) {
  const ref = db.collection("events").doc();
  await ref.set({ id: ref.id, ...event, createdAt: new Date() });
  console.log(`✓ Seeded event ${event.name} (${ref.id})`);
}

process.exit(0);
