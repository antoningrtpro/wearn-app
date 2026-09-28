"use client";

import { LayoutDashboard, Calendar, Megaphone } from "lucide-react";
import { AppSidebar } from "@/components/shared/app-sidebar";

const COUREUR_NAV_ITEMS = [
  { href: "/coureur", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/coureur/evenements", label: "Événements", icon: Calendar, exact: false },
  { href: "/coureur/campagnes", label: "Mes campagnes", icon: Megaphone, exact: false },
] as const;

export function CoureurSidebar({ name }: { name: string }) {
  return <AppSidebar navItems={COUREUR_NAV_ITEMS} accountLabel={name} accountHref="/coureur/profil" />;
}
