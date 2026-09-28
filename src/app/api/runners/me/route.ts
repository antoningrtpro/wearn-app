import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import {
  runnerSignupStep2Schema,
  runnerSignupStep3Schema,
  runnerIdentityUpdateSchema,
  runnerEmailUpdateSchema,
  isAdult,
} from "@/lib/validation/runner";

/** Resume support: the signup wizard's own current state, for the runner to
 * pick back up at whatever step they left off on. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "runner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const snap = await adminDb.collection("runners").doc(session.uid).get();
  if (!snap.exists) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const data = snap.data()!;

  return NextResponse.json({
    signupStep: data.signupStep ?? 1,
    signupCompleted: data.signupCompleted === true,
    gender: data.gender ?? null,
    birthDate: data.birthDate ?? null,
    acceptedPlacements: data.acceptedPlacements ?? [],
    instagramHandle: data.instagramHandle ?? null,
    facebookHandle: data.facebookHandle ?? null,
    tiktokHandle: data.tiktokHandle ?? null,
    participatingEventIds: data.participatingEventIds ?? [],
    eventRaceSelections: data.eventRaceSelections ?? {},
  });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "runner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (body?.step === "profile") {
    const parsed = runnerSignupStep2Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
    }

    // Under 18 — no account is left lying around, not even an incomplete
    // one. Delete Firestore doc + Auth user outright and clear the session,
    // rather than just failing validation and leaving the account to rot.
    if (!isAdult(parsed.data.birthDate)) {
      await adminDb.collection("runners").doc(session.uid).delete();
      await adminAuth.deleteUser(session.uid).catch(() => {});
      const response = NextResponse.json({ error: "underage" }, { status: 403 });
      response.cookies.delete("__wearn_session");
      return response;
    }

    await adminDb.collection("runners").doc(session.uid).update({
      gender: parsed.data.gender,
      birthDate: parsed.data.birthDate,
      acceptedPlacements: parsed.data.acceptedPlacements,
      instagramHandle: parsed.data.instagramHandle || null,
      facebookHandle: parsed.data.facebookHandle || null,
      tiktokHandle: parsed.data.tiktokHandle || null,
      signupStep: 2,
    });
    return NextResponse.json({ ok: true });
  }

  if (body?.step === "identity") {
    const parsed = runnerIdentityUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
    }
    await adminDb.collection("runners").doc(session.uid).update({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
    });
    return NextResponse.json({ ok: true });
  }

  if (body?.step === "email") {
    const parsed = runnerEmailUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
    }
    try {
      await adminAuth.updateUser(session.uid, { email: parsed.data.email });
    } catch (err) {
      if ((err as { code?: string }).code === "auth/email-already-exists") {
        return NextResponse.json({ error: "email_taken" }, { status: 409 });
      }
      console.error("[runners/me] email update failed:", err);
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }
    await adminDb.collection("runners").doc(session.uid).update({ email: parsed.data.email });

    // Changing the Auth email invalidates the runner's existing session
    // cookie (checkRevoked in getSession() starts failing it) — mint a
    // custom token so the client can silently re-establish a fresh session
    // via /api/auth/session, the same exchange the login form itself uses.
    const customToken = await adminAuth.createCustomToken(session.uid);
    return NextResponse.json({ ok: true, customToken });
  }

  if (body?.step === "events") {
    const parsed = runnerSignupStep3Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
    }

    await adminDb.collection("runners").doc(session.uid).update({
      participatingEventIds: parsed.data.participatingEventIds,
      eventRaceSelections: parsed.data.eventRaceSelections,
      signupStep: 3,
      signupCompleted: true,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown_step" }, { status: 400 });
}
