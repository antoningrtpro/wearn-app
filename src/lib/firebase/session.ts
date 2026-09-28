import "server-only";

import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import type { UserRole } from "@/lib/firebase/roles";

export const SESSION_COOKIE_NAME = "__wearn_session";

export interface Session {
  uid: string;
  role: UserRole | null;
  /** Only set when role === "brand". */
  brandId: string | null;
  email: string | null;
}

const VALID_ROLES: UserRole[] = ["admin", "runner", "brand"];

/** Reads and verifies the session cookie in a server component / route handler. */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const role = VALID_ROLES.includes(decoded.role) ? (decoded.role as UserRole) : null;
    const brandId = role === "brand" && typeof decoded.brandId === "string" ? decoded.brandId : null;
    return { uid: decoded.uid, role, brandId, email: decoded.email ?? null };
  } catch {
    return null;
  }
}

/** Creates a Firebase session cookie from a freshly-minted client ID token. */
export async function createSessionCookie(idToken: string, expiresInMs: number) {
  return adminAuth.createSessionCookie(idToken, { expiresIn: expiresInMs });
}
