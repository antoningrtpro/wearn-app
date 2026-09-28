import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { SignupStep1Form } from "@/components/runner-form/signup-step1-form";

export default async function InscriptionCoureurPage() {
  const session = await getSession();
  if (session?.role === "runner") {
    const runnerSnap = await adminDb.collection("runners").doc(session.uid).get();
    if (runnerSnap.data()?.signupCompleted === true) redirect("/coureur");
    redirect("/inscription-coureur/continuer");
  }

  return (
    <main className="min-h-svh bg-admin-canvas px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-small bg-admin-accent text-body-lg font-bold text-white">
            W
          </span>
          <span className="text-body-lg font-bold tracking-heading-sm text-ink">Wearn</span>
        </Link>

        <div className="mb-10 mt-8">
          <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">
            Devenir coureur partenaire
          </h1>
          <p className="mt-2 text-body-lg text-mid-gray">
            Créez votre profil pour recevoir des propositions de campagnes lors de vos
            courses.
          </p>
        </div>

        <SignupStep1Form />
      </div>
    </main>
  );
}
