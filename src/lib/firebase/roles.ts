import "server-only";

import { adminAuth } from "@/lib/firebase/admin";

export type UserRole = "admin" | "runner" | "brand";

export interface WearnClaims {
  role: UserRole;
  /** Only set (and only meaningful) when role === "brand". */
  brandId?: string;
}

function isUserRole(value: unknown): value is UserRole {
  return value === "admin" || value === "runner" || value === "brand";
}

/**
 * Sets the role custom claim on a Firebase Auth user. This is the ONLY source of
 * truth for role-based access — Firestore security rules read
 * `request.auth.token.role`, not a Firestore document field, because custom claims
 * cannot be forged client-side the way a document field could be.
 *
 * Must run in a trusted server context (Admin SDK). Never expose this as a
 * client-callable endpoint without its own authorization check.
 */
export async function setUserRole(uid: string, role: UserRole, brandId?: string): Promise<void> {
  const claims: WearnClaims = role === "brand" ? { role, brandId } : { role };
  await adminAuth.setCustomUserClaims(uid, claims);
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  const user = await adminAuth.getUser(uid);
  const role = user.customClaims?.role;
  return isUserRole(role) ? role : null;
}

/** Verifies a session/ID token and returns the decoded claims, or null if invalid. */
export async function verifyToken(idToken: string) {
  try {
    return await adminAuth.verifyIdToken(idToken);
  } catch (err) {
    console.error("[auth] verifyIdToken failed:", err);
    return null;
  }
}
