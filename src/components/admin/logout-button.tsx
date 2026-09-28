"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { cn } from "@/lib/cn";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      await auth.signOut();
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 rounded-nested px-3 py-2 text-body text-mid-gray transition-colors hover:bg-canvas hover:text-ink disabled:opacity-50",
        className
      )}
    >
      <LogOut size={16} strokeWidth={2} />
      {loading ? "..." : "Déconnexion"}
    </button>
  );
}
