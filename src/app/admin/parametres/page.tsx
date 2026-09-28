import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import { AdminCard } from "@/components/admin/admin-card";
import { UpdateAdminProfileForm } from "@/components/admin/update-admin-profile-form";
import { ChangePasswordForm } from "@/components/admin/change-password-form";

export default async function AdminAccountSettingsPage() {
  const session = await getSession();
  const profileSnap = session ? await adminDb.collection("admins").doc(session.uid).get() : null;
  const profile = profileSnap?.data();

  return (
    <main className="mx-auto max-w-2xl px-8 py-8">
      <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">Paramètres du compte</h1>
      <p className="mt-1 text-body text-mid-gray">{session?.email}</p>

      <div className="mt-8 flex flex-col gap-6">
        <AdminCard>
          <h2 className="text-body-lg font-semibold text-ink">Profil</h2>
          <div className="mt-4">
            <UpdateAdminProfileForm
              firstName={profile?.firstName ?? ""}
              lastName={profile?.lastName ?? ""}
              email={profile?.email || session?.email || ""}
              phone={profile?.phone ?? ""}
              jobTitle={profile?.jobTitle ?? ""}
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
