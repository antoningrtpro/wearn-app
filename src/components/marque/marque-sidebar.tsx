"use client";

import { Calendar, Megaphone } from "lucide-react";
import { AppSidebar } from "@/components/shared/app-sidebar";

const MARQUE_NAV_ITEMS = [
  { href: "/marque", label: "Campagnes", icon: Megaphone, exact: true },
  { href: "/marque/evenements", label: "Événements", icon: Calendar, exact: false },
] as const;

export function MarqueSidebar({ accountLabel }: { accountLabel: string }) {
  return <AppSidebar navItems={MARQUE_NAV_ITEMS} accountLabel={accountLabel} accountHref="/marque/profil" />;
}
