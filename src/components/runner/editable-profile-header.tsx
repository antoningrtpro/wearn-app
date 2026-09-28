"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { signInWithCustomToken } from "firebase/auth";
import { Camera, Check, Loader2 } from "lucide-react";
import { auth, db, storage } from "@/lib/firebase/client";
import { AdminCard } from "@/components/admin/admin-card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/brand-form/form-field";
import { ACCEPTED_PHOTO_TYPES, MAX_PROFILE_PHOTO_BYTES } from "@/lib/validation/runner";
import { cn } from "@/lib/cn";

interface EditableProfileHeaderProps {
  runnerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePhotoUrl: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Autosaves on blur — no "Enregistrer" button. Name/phone write straight to
 * the runner's own Firestore doc (already permitted by firestore.rules);
 * email goes through /api/runners/me because it also has to update the
 * Firebase Auth account (Admin SDK, can't be done client-side).
 */
export function EditableProfileHeader({
  runnerId,
  firstName: initialFirstName,
  lastName: initialLastName,
  email: initialEmail,
  phone: initialPhone,
  profilePhotoUrl: initialPhotoUrl,
}: EditableProfileHeaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const savedRef = useRef({ firstName: initialFirstName, lastName: initialLastName, phone: initialPhone, email: initialEmail });

  const [identityStatus, setIdentityStatus] = useState<SaveStatus>("idle");
  const [emailStatus, setEmailStatus] = useState<SaveStatus>("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<SaveStatus>("idle");

  async function saveIdentity() {
    const next = { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() };
    if (!next.firstName || !next.lastName || next.phone.length < 6) return;
    if (
      next.firstName === savedRef.current.firstName &&
      next.lastName === savedRef.current.lastName &&
      next.phone === savedRef.current.phone
    ) {
      return;
    }
    setIdentityStatus("saving");
    try {
      const res = await fetch("/api/runners/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "identity", ...next }),
      });
      if (!res.ok) throw new Error("save_failed");
      savedRef.current = { ...savedRef.current, ...next };
      setIdentityStatus("saved");
      router.refresh();
      setTimeout(() => setIdentityStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch {
      setIdentityStatus("error");
    }
  }

  async function saveEmail() {
    const next = email.trim();
    if (!next || next === savedRef.current.email) return;
    setEmailStatus("saving");
    setEmailError(null);
    try {
      const res = await fetch("/api/runners/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "email", email: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === "email_taken") {
          setEmailError("Cet email est déjà utilisé.");
        } else {
          setEmailError("Impossible d'enregistrer l'email.");
        }
        setEmail(savedRef.current.email);
        setEmailStatus("error");
        return;
      }
      savedRef.current = { ...savedRef.current, email: next };

      // The email change invalidated the current session cookie — silently
      // re-establish one with the custom token the server just minted,
      // rather than bouncing the runner to the login page mid-edit.
      const { customToken } = (await res.json().catch(() => ({}))) as { customToken?: string };
      if (customToken) {
        const credential = await signInWithCustomToken(auth, customToken);
        const idToken = await credential.user.getIdToken();
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
      }

      setEmailStatus("saved");
      router.refresh();
      setTimeout(() => setEmailStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch {
      setEmail(savedRef.current.email);
      setEmailError("Impossible d'enregistrer l'email.");
      setEmailStatus("error");
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setPhotoStatus("error");
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setPhotoStatus("error");
      return;
    }
    setPhotoStatus("saving");
    try {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const storageRef = ref(storage, `profilePhotos/${runnerId}/profile.${extension}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "runners", runnerId), { profilePhotoUrl: url });
      setPhotoUrl(url);
      setPhotoStatus("saved");
      router.refresh();
      setTimeout(() => setPhotoStatus((s) => (s === "saved" ? "idle" : s)), 2000);
    } catch {
      setPhotoStatus("error");
    }
  }

  return (
    <AdminCard className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-canvas text-mid-gray"
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Camera size={20} />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-ink/40 opacity-0 transition-opacity group-hover:opacity-100">
            {photoStatus === "saving" ? (
              <Loader2 size={18} className="animate-spin text-white" />
            ) : (
              <Camera size={18} className="text-white" />
            )}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handlePhotoChange}
          className="hidden"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-lg font-medium text-ink">
            {firstName} {lastName}
          </p>
          <p className="text-body text-mid-gray">Photo, nom et coordonnées — enregistrés automatiquement</p>
        </div>
        <SaveIndicator status={photoStatus === "error" ? "error" : "idle"} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Prénom">
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} onBlur={saveIdentity} />
        </FormField>
        <FormField label="Nom">
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} onBlur={saveIdentity} />
        </FormField>
        <FormField label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={saveEmail} />
        </FormField>
        <FormField label="Téléphone">
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={saveIdentity} />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SaveIndicator status={identityStatus} savedLabel="Coordonnées enregistrées" errorLabel="Impossible d'enregistrer" />
        <SaveIndicator status={emailStatus} savedLabel="Email enregistré" errorLabel={emailError ?? "Impossible d'enregistrer"} />
      </div>
    </AdminCard>
  );
}

function SaveIndicator({
  status,
  savedLabel = "Enregistré",
  errorLabel = "Erreur",
}: {
  status: SaveStatus;
  savedLabel?: string;
  errorLabel?: string;
}) {
  if (status === "idle") return null;
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-caption",
        status === "error" ? "text-ember" : "text-mid-gray"
      )}
    >
      {status === "saving" ? <Loader2 size={13} className="animate-spin" /> : null}
      {status === "saved" ? <Check size={13} className="text-admin-positive" /> : null}
      {status === "saving" ? "Enregistrement…" : status === "saved" ? savedLabel : errorLabel}
    </span>
  );
}
