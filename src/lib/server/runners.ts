import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { computeAge } from "@/lib/utils/age";

export interface RunnerFilters {
  gender?: string;
  ageMin?: string;
  ageMax?: string;
  city?: string;
  size?: string;
  placements?: string[];
  /** Campaign's event/race, used only when participatesOnly is true. */
  eventId?: string | null;
  raceId?: string | null;
  /**
   * When true and eventId is set, only keeps runners who checked "je
   * participe" for that event. If raceId is also set, a runner who picked a
   * *different* specific race is excluded, but one who left "peu importe la
   * course" still matches (they haven't ruled themselves out).
   */
  participatesOnly?: boolean;
}

export interface RunnerRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  city: string | null;
  clothingSize: string | null;
  acceptedPlacements: string[];
  profilePhotoUrl: string;
  age: number | null;
  birthDate: string | null;
  participatingEventIds: string[];
  eventRaceSelections: Record<string, string>;
}

/**
 * V1 scale: fetches the whole catalogue in one go; filtering happens in
 * memory (see `filterRunners`) rather than via composite Firestore indexes
 * for every filter combination.
 */
export async function getAllRunners(): Promise<RunnerRow[]> {
  const snap = await adminDb.collection("runners").orderBy("createdAt", "desc").get();

  // Accounts mid-signup (created at step 1, abandoned before step 2/3) have
  // no gender/placements/etc. yet — nothing to shortlist or filter on, so
  // they're excluded here rather than showing up as blank rows everywhere.
  return snap.docs
    .filter((doc) => doc.data().signupCompleted === true)
    .map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phone: d.phone,
        gender: d.gender,
        city: d.city ?? null,
        clothingSize: d.clothingSize ?? null,
        acceptedPlacements: d.acceptedPlacements ?? [],
        profilePhotoUrl: d.profilePhotoUrl,
        age: computeAge(d.birthDate),
        birthDate: d.birthDate ?? null,
        participatingEventIds: d.participatingEventIds ?? [],
        eventRaceSelections: d.eventRaceSelections ?? {},
      };
    });
}

export function filterRunners(runners: RunnerRow[], filters: RunnerFilters): RunnerRow[] {
  const ageMin = filters.ageMin ? Number(filters.ageMin) : null;
  const ageMax = filters.ageMax ? Number(filters.ageMax) : null;
  const cityFilter = filters.city?.trim().toLowerCase();
  const placements = filters.placements ?? [];

  return runners.filter((r) => {
    if (filters.gender && r.gender !== filters.gender) return false;
    if (ageMin != null && (r.age == null || r.age < ageMin)) return false;
    if (ageMax != null && (r.age == null || r.age > ageMax)) return false;
    if (cityFilter && !(r.city?.toLowerCase().includes(cityFilter) ?? false)) return false;
    if (filters.size && r.clothingSize !== filters.size) return false;
    if (placements.length > 0 && !placements.some((p) => r.acceptedPlacements.includes(p))) {
      return false;
    }
    if (filters.participatesOnly && filters.eventId) {
      if (!r.participatingEventIds.includes(filters.eventId)) return false;
      if (filters.raceId) {
        const selectedRace = r.eventRaceSelections[filters.eventId];
        if (selectedRace && selectedRace !== filters.raceId) return false;
      }
    }
    return true;
  });
}
