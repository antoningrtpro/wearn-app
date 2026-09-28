import { redirect } from "next/navigation";
import { getSession } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { CoureurSidebar } from "@/components/runner/coureur-sidebar";

export default async function CoureurLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) redirect("/");
  if (session.role !== "runner") redirect("/");

  const runnerSnap = await adminDb.collection("runners").doc(session.uid).get();
  const runner = runnerSnap.data();
  if (runner?.signupCompleted !== true) {
    redirect("/inscription-coureur/continuer");
  }
  const name = `${runner?.firstName ?? ""} ${runner?.lastName ?? ""}`.trim() || session.email || "Mon compte";

  return (
    <div className="flex h-svh bg-admin-canvas">
      <CoureurSidebar name={name} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
