import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase/admin";
import { runnerSignupStep1Schema, ACCEPTED_PHOTO_TYPES, MAX_PROFILE_PHOTO_BYTES } from "@/lib/validation/runner";
import { setUserRole } from "@/lib/firebase/roles";

/**
 * Runner signup, step 1 only. Creates the Auth account, uploads the profile
 * photo, sets the `runner` custom claim, and writes a Firestore doc that's
 * intentionally incomplete (signupCompleted: false) — gender, birth date,
 * placements, socials and event participation are all collected afterward,
 * once the client is signed in (see /api/runners/me for steps 2 and 3).
 */
export async function POST(request: Request) {
  const formData = await request.formData();

  const parsed = runnerSignupStep1Schema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const photo = formData.get("profilePhoto");
  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "photo_required" }, { status: 400 });
  }
  if (!ACCEPTED_PHOTO_TYPES.includes(photo.type)) {
    return NextResponse.json({ error: "photo_invalid_type" }, { status: 400 });
  }
  if (photo.size > MAX_PROFILE_PHOTO_BYTES) {
    return NextResponse.json({ error: "photo_too_large" }, { status: 400 });
  }

  const existing = await adminAuth.getUserByEmail(data.email).catch(() => null);
  if (existing) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  let user;
  try {
    user = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: `${data.firstName} ${data.lastName}`,
    });
  } catch (err) {
    if ((err as { code?: string }).code === "auth/email-already-exists") {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    console.error("[runners] createUser failed:", err);
    return NextResponse.json({ error: "signup_failed" }, { status: 500 });
  }

  try {
    const bucket = adminStorage.bucket();
    const extension = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
    const filePath = `profilePhotos/${user.uid}/profile.${extension}`;
    const file = bucket.file(filePath);
    const buffer = Buffer.from(await photo.arrayBuffer());
    await file.save(buffer, { metadata: { contentType: photo.type } });

    const profilePhotoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;

    await setUserRole(user.uid, "runner");

    await adminDb.collection("runners").doc(user.uid).set({
      id: user.uid,
      authUid: user.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      gender: null,
      birthDate: null,
      city: null,
      clothingSize: null,
      profilePhotoUrl,
      acceptedPlacements: [],
      ibanOrPaymentRef: null,
      taxStatus: null,
      instagramHandle: null,
      facebookHandle: null,
      tiktokHandle: null,
      participatingEventIds: [],
      eventRaceSelections: {},
      signupStep: 1,
      signupCompleted: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    // Roll back the auth account if anything after it fails, so a half-created
    // signup never leaves a user who can't sign up again with the same email.
    await adminAuth.deleteUser(user.uid).catch(() => {});
    console.error("[runners] signup failed after auth creation:", err);
    return NextResponse.json({ error: "signup_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
