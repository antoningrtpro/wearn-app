import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { getPublicEventsWithRaces } from "@/lib/server/events";
import { getPlatformConfig } from "@/lib/server/platform-config";
import { ContinueSignupForm } from "@/components/runner-form/continue-signup-form";
import Logo from "@/components/shared/logo";

// Events are read from Firestore — without this the list would be frozen at
// build time and never notice events an admin adds afterwards.
export const dynamic = "force-dynamic";

export default async function ContinueSignupPage() {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "runner") redirect("/");

  const [runnerSnap, events, config] = await Promise.all([
    adminDb.collection("runners").doc(session.uid).get(),
    getPublicEventsWithRaces(),
    getPlatformConfig(),
  ]);

  if (!runnerSnap.exists) redirect("/");
  const runner = runnerSnap.data()!;
  if (runner.signupCompleted === true) redirect("/coureur");

  const startUiStep = runner.signupStep >= 2 ? 2 : 1;

  return (
    <main className="min-h-svh bg-admin-canvas px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="text-body-lg font-bold tracking-heading-sm text-ink" />
        </Link>

        <div className="mb-10 mt-8">
          <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">
            Terminons votre inscription
          </h1>
          <p className="mt-2 text-body-lg text-mid-gray">
            Encore {startUiStep === 1 ? "deux" : "une"} étape{startUiStep === 1 ? "s" : ""} avant
            d&apos;accéder à votre espace coureur.
          </p>
        </div>

        <ContinueSignupForm
          startUiStep={startUiStep}
          events={events}
          placements={config.placements}
          existing={{
            gender: runner.gender ?? null,
            birthDate: runner.birthDate ?? null,
            acceptedPlacements: runner.acceptedPlacements ?? [],
            instagramHandle: runner.instagramHandle ?? null,
            facebookHandle: runner.facebookHandle ?? null,
            tiktokHandle: runner.tiktokHandle ?? null,
            participatingEventIds: runner.participatingEventIds ?? [],
            eventRaceSelections: runner.eventRaceSelections ?? {},
          }}
        />
      </div>
    </main>
  );
}
