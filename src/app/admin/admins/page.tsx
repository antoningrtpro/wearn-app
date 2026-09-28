import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import { AdminCard } from "@/components/admin/admin-card";
import { AddAdminForm } from "@/components/admin/add-admin-form";
import { EditAdminForm } from "@/components/admin/edit-admin-form";
import { DeleteAdminButton } from "@/components/admin/delete-admin-button";

export default async function AdminAdminsPage() {
  const session = await getSession();
  const snap = await adminDb.collection("admins").orderBy("createdAt", "asc").get();

  return (
    <main className="mx-auto max-w-(--page-max-width) px-8 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">
            Administrateurs
          </h1>
          <p className="mt-1 text-body text-mid-gray">{snap.size} administrateur(s).</p>
        </div>
        <AddAdminForm />
      </div>

      <AdminCard className="mt-6 overflow-hidden p-0">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-hairline text-caption tracking-caption uppercase text-mid-gray">
              <th className="px-5 py-3 font-medium">Nom</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Téléphone</th>
              <th className="px-5 py-3 font-medium">Poste</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {snap.docs.map((doc) => {
              const a = doc.data();
              const name = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || "—";
              return (
                <tr key={doc.id} className="border-b border-hairline last:border-0">
                  <td className="px-5 py-3 text-body font-medium text-ink">{name}</td>
                  <td className="px-5 py-3 text-body text-mid-gray">{a.email ?? "—"}</td>
                  <td className="px-5 py-3 text-body text-mid-gray">{a.phone ?? "—"}</td>
                  <td className="px-5 py-3 text-body text-mid-gray">{a.jobTitle ?? "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <EditAdminForm
                        adminId={doc.id}
                        firstName={a.firstName ?? ""}
                        lastName={a.lastName ?? ""}
                        email={a.email ?? ""}
                        phone={a.phone ?? ""}
                        jobTitle={a.jobTitle ?? ""}
                      />
                      {doc.id !== session?.uid ? (
                        <DeleteAdminButton adminId={doc.id} name={name} />
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {snap.empty ? <p className="p-5 text-body text-mid-gray">Aucun administrateur.</p> : null}
      </AdminCard>
    </main>
  );
}
