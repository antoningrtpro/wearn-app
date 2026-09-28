import { redirect } from "next/navigation";
import { getSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { AdminCard } from "@/components/admin/admin-card";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { UpdateCollaboratorProfileForm } from "@/components/marque/update-collaborator-profile-form";

export default async function MarqueProfilPage() {
  const session = await getSession();
  if (!session || session.role !== "brand" || !session.brandId) redirect("/");

  const [collaboratorSnap, brandSnap] = await Promise.all([
    adminDb.collection("collaborators").doc(session.uid).get(),
    adminDb.collection("brands").doc(session.brandId).get(),
  ]);
  const collaborator = collaboratorSnap.data();
  const brand = brandSnap.data();

  return (
    <main className="mx-auto max-w-2xl px-8 py-8">
      <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">Mon profil</h1>
      <p className="mt-1 text-body text-mid-gray">
        {collaborator?.email}
        {brand?.companyName ? ` · ${brand.companyName}` : ""}
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <AdminCard>
          <h2 className="text-body-lg font-semibold text-ink">Profil</h2>
          <div className="mt-4">
            <UpdateCollaboratorProfileForm
              firstName={collaborator?.firstName ?? ""}
              lastName={collaborator?.lastName ?? ""}
              phone={collaborator?.phone ?? ""}
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
