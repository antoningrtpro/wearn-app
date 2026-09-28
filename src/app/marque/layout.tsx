import { redirect } from "next/navigation";
import { getSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { MarqueSidebar } from "@/components/marque/marque-sidebar";

export default async function MarqueLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/");
  if (session.role !== "brand" || !session.brandId) redirect("/");

  const collaboratorSnap = await adminDb.collection("collaborators").doc(session.uid).get();
  const collaborator = collaboratorSnap.data();
  const name = collaborator
    ? `${collaborator.firstName} ${collaborator.lastName}`.trim()
    : (session.email ?? "Mon compte");

  return (
    <div className="flex h-svh bg-admin-canvas">
      <MarqueSidebar accountLabel={name} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
