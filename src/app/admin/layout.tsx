import { redirect } from "next/navigation";
import { getSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) redirect("/");
  if (session.role !== "admin") redirect("/");

  const profileSnap = await adminDb.collection("admins").doc(session.uid).get();
  const profile = profileSnap.data();
  const adminName =
    profile?.firstName || profile?.lastName
      ? `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim()
      : (session.email ?? "Admin");

  return (
    <div className="flex h-svh bg-admin-canvas">
      <AdminSidebar adminName={adminName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
