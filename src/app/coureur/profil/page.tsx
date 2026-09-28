import { redirect } from "next/navigation";
import { getSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { getPlatformConfig } from "@/lib/server/platform-config";
import { AdminCard } from "@/components/admin/admin-card";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { UpdateRunnerProfileForm } from "@/components/runner/update-runner-profile-form";
import { EditableProfileHeader } from "@/components/runner/editable-profile-header";

export default async function CoureurProfilPage() {
  const session = await getSession();
  if (!session || session.role !== "runner") redirect("/");

  const [runnerSnap, config] = await Promise.all([
    adminDb.collection("runners").doc(session.uid).get(),
    getPlatformConfig(),
  ]);
  const runner = runnerSnap.data();

  return (
    <main className="mx-auto max-w-2xl px-8 py-8">
      <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">Mon profil</h1>
      <p className="mt-1 text-body text-mid-gray">Gérez vos informations personnelles.</p>

      <div className="mt-8 flex flex-col gap-6">
        <EditableProfileHeader
          runnerId={session.uid}
          firstName={runner?.firstName ?? ""}
          lastName={runner?.lastName ?? ""}
          email={runner?.email ?? ""}
          phone={runner?.phone ?? ""}
          profilePhotoUrl={runner?.profilePhotoUrl ?? ""}
        />

        <AdminCard>
          <h2 className="text-body-lg font-semibold text-ink">Informations personnelles</h2>
          <div className="mt-4">
            <UpdateRunnerProfileForm
              placements={config.placements}
              gender={runner?.gender ?? null}
              birthDate={runner?.birthDate ?? null}
              acceptedPlacements={runner?.acceptedPlacements ?? []}
              instagramHandle={runner?.instagramHandle ?? null}
              facebookHandle={runner?.facebookHandle ?? null}
              tiktokHandle={runner?.tiktokHandle ?? null}
            />
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-body-lg font-semibold text-ink">Mot de passe</h2>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </AdminCard>
      </div>
    </main>
  );
}
