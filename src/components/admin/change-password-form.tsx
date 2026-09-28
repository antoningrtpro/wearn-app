"use client";

import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/brand-form/form-field";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError("Session invalide. Reconnectez-vous.");
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setError("Mot de passe actuel incorrect.");
      } else {
        console.error("Change password error", err);
        setError("Impossible de changer le mot de passe. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <FormField label="Mot de passe actuel">
          <PasswordInput
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </FormField>
        <FormField label="Nouveau mot de passe">
          <PasswordInput
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </FormField>
        <FormField label="Confirmer">
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </FormField>
      </div>
      {error ? <p className="text-body text-ember">{error}</p> : null}
      {success ? <p className="text-body text-admin-positive">Mot de passe modifié.</p> : null}
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? "..." : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
