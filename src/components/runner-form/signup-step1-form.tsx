"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Camera } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import {
  runnerSignupStep1Schema,
  type RunnerSignupStep1Input,
  ACCEPTED_PHOTO_TYPES,
  MAX_PROFILE_PHOTO_BYTES,
} from "@/lib/validation/runner";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { AdminCard as Card } from "@/components/admin/admin-card";
import { FormField } from "@/components/brand-form/form-field";
import { Stepper } from "@/components/brand-form/stepper";
import { SIGNUP_STEPS } from "@/components/runner-form/signup-steps";

export function SignupStep1Form() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RunnerSignupStep1Input>({
    resolver: zodResolver(runnerSignupStep1Schema),
  });

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoError(null);
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Format accepté : JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setPhotoError("Photo trop lourde (5 Mo max).");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function onSubmit(data: RunnerSignupStep1Input) {
    setSubmitError(null);
    if (!photoFile) {
      setPhotoError("Photo de profil requise.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);
      formData.append("phone", data.phone);
      formData.append("profilePhoto", photoFile);

      const res = await fetch("/api/runners", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === "email_taken") {
          setSubmitError("Un compte existe déjà avec cet email.");
        } else {
          setSubmitError("Inscription impossible. Réessayez.");
        }
        return;
      }

      const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const idToken = await credential.user.getIdToken();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      router.push("/inscription-coureur/continuer");
      router.refresh();
    } catch (err) {
      console.error("Runner signup error", err);
      setSubmitError("Inscription impossible. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Stepper steps={SIGNUP_STEPS} currentIndex={0} />

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div>
            <h2 className="text-body-lg font-semibold text-ink">Votre profil</h2>
            <p className="mt-1 text-body text-mid-gray">
              Ces informations créent votre compte — vous pourrez compléter le reste juste
              après.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-admin-accent/20 bg-admin-canvas text-admin-accent"
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Aperçu photo de profil" className="h-full w-full object-cover" />
              ) : (
                <Camera size={24} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-caption text-admin-accent underline"
            >
              Photo de profil (obligatoire)
            </button>
            {photoError ? <span className="text-caption text-ember">{photoError}</span> : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Prénom" error={errors.firstName?.message}>
              <Input {...register("firstName")} autoComplete="given-name" />
            </FormField>
            <FormField label="Nom" error={errors.lastName?.message}>
              <Input {...register("lastName")} autoComplete="family-name" />
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              <Input type="email" {...register("email")} autoComplete="email" />
            </FormField>
            <FormField label="Téléphone" error={errors.phone?.message}>
              <Input type="tel" {...register("phone")} autoComplete="tel" />
            </FormField>
            <FormField label="Mot de passe" error={errors.password?.message}>
              <PasswordInput {...register("password")} autoComplete="new-password" />
            </FormField>
            <FormField label="Confirmer le mot de passe" error={errors.confirmPassword?.message}>
              <PasswordInput {...register("confirmPassword")} autoComplete="new-password" />
            </FormField>
          </div>

          {submitError ? <p className="text-body text-ember">{submitError}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "..." : "Continuer"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
