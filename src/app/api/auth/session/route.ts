import { NextResponse } from "next/server";
import { createSessionCookie, SESSION_COOKIE_NAME } from "@/lib/firebase/session";
import { verifyToken } from "@/lib/firebase/roles";
import { adminDb } from "@/lib/firebase/admin";

const SESSION_EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export async function POST(request: Request) {
  const { idToken } = (await request.json()) as { idToken?: string };
  if (!idToken) {
    return NextResponse.json({ error: "missing_id_token" }, { status: 400 });
  }

  const decoded = await verifyToken(idToken);
  if (!decoded) {
    return NextResponse.json({ error: "invalid_id_token" }, { status: 401 });
  }

  const role = decoded.role;
  if (role !== "admin" && role !== "runner" && role !== "brand") {
    return NextResponse.json({ error: "no_role_assigned" }, { status: 403 });
  }

  // The unified login page needs to know where to send a runner right after
  // sign-in: their own dashboard, or back into the multi-step signup they
  // left unfinished. That's the one piece of routing info a role alone
  // can't answer, so it's resolved here rather than duplicated client-side.
  let signupCompleted: boolean | undefined;
  if (role === "runner") {
    const runnerSnap = await adminDb.collection("runners").doc(decoded.uid).get();
    signupCompleted = runnerSnap.data()?.signupCompleted === true;
  }

  const sessionCookie = await createSessionCookie(idToken, SESSION_EXPIRES_IN_MS);

  const response = NextResponse.json({ role, signupCompleted });
  response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
    maxAge: SESSION_EXPIRES_IN_MS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
