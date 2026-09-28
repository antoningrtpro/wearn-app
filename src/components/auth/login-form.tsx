"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import type { UserRole } from "@/lib/firebase/roles";

type Mode = "login" | "reset";

/**
 * One login page/form for every role — admin, brand collaborator, runner.
 * The account's own custom claim decides where it lands; nothing about the
 * page itself is role-specific.
 */
export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === "no_role_assigned") {
          setError("Ce compte n'a pas encore de rôle assigné.");
        } else {
          setError("Connexion impossible.");
        }
        await auth.signOut();
        return;
      }

      const { role, signupCompleted } = (await res.json()) as {
        role: UserRole;
        signupCompleted?: boolean;
      };

      const destination =
        role === "admin"
          ? "/admin"
          : role === "brand"
            ? "/marque"
            : signupCompleted
              ? "/coureur"
              : "/inscription-coureur/continuer";

      router.push(destination);
      router.refresh();
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Email ou mot de passe incorrect.");
      } else if (code === "auth/too-many-requests") {
        setError("Trop de tentatives. Réessayez plus tard.");
      } else {
        console.error("Login error", err);
        setError("Connexion impossible. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      // auth/user-not-found is deliberately treated as success below — the
      // confirmation message must be identical either way, otherwise this
      // form becomes a way to check which emails have an account.
      if (code === "auth/invalid-email") {
        setError("Email invalide.");
        setLoading(false);
        return;
      }
      if (code !== "auth/user-not-found") {
        console.error("Password reset error", err);
      }
    }
    setResetSent(true);
    setLoading(false);
  }

  function backToLogin() {
    setMode("login");
    setError(null);
    setResetSent(false);
  }

  if (mode === "reset") {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-heading-sm font-bold tracking-heading-sm text-ink">Mot de passe oublié</h2>
          <p className="mt-1 text-body text-mid-gray">
            Indiquez votre email, nous vous envoyons un lien pour définir un nouveau mot de
            passe.
          </p>
        </div>

        {resetSent ? (
          <p className="rounded-inputs bg-canvas p-3 text-body text-ink">
            Si un compte existe avec cette adresse, un email de réinitialisation vient d&apos;être
            envoyé.
          </p>
        ) : (
          <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-caption tracking-caption uppercase text-mid-gray">
                Email
              </span>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>

            {error ? <p className="-my-2 text-body text-ember">{error}</p> : null}

            <Button type="submit" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
            </Button>
          </form>
        )}

        <button
          type="button"
          onClick={backToLogin}
          className="self-start text-body text-ink underline"
        >
          Retour à la connexion
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-heading-sm font-bold tracking-heading-sm text-ink">Se connecter</h2>
        <p className="mt-1 text-body text-mid-gray">Accédez à votre espace Wearn.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-caption tracking-caption uppercase text-mid-gray">
              Email
            </span>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-caption tracking-caption uppercase text-mid-gray">
              Mot de passe
            </span>
            <PasswordInput
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
        </div>

        {error ? <p className="-my-2 text-body text-ember">{error}</p> : null}

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setMode("reset");
              setError(null);
            }}
            className="self-start text-body text-mid-gray underline"
          >
            Mot de passe oublié ?
          </button>
        </div>
      </form>
    </div>
  );
}
