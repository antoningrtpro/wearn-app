import "server-only";

import { adminDb } from "@/lib/firebase/admin";

export const DEFAULT_PLACEMENTS = ["dos", "manche", "short", "dossard"];

export interface PlatformConfigSummary {
  defaultCommissionRate: number | null;
  placements: string[];
}

/**
 * Reads platformConfig/config with sane fallbacks — placements in
 * particular must never come back empty (it drives every placement
 * dropdown/checkbox group across the app), so an unset field falls back to
 * the four original codes rather than an empty array.
 */
export async function getPlatformConfig(): Promise<PlatformConfigSummary> {
  const snap = await adminDb.collection("platformConfig").doc("config").get();
  const data = snap.data();
  const placements = Array.isArray(data?.placements) && data.placements.length > 0
    ? (data.placements as string[])
    : DEFAULT_PLACEMENTS;

  return {
    defaultCommissionRate: typeof data?.defaultCommissionRate === "number" ? data.defaultCommissionRate : null,
    placements,
  };
}
