"use client";

import {
  LayoutDashboard,
  Megaphone,
  Users,
  Building2,
  Calendar,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
} from "lucide-react";
import { AppSidebar, isNavItemActive } from "@/components/shared/app-sidebar";

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/admin/campagnes", label: "Campagnes", icon: Megaphone, exact: false },
  { href: "/admin/marques", label: "Marques", icon: Building2, exact: false },
  { href: "/admin/coureurs", label: "Catalogue coureurs", icon: Users, exact: false },
  { href: "/admin/evenements", label: "Événements", icon: Calendar, exact: false },
  { href: "/admin/preuves", label: "Preuves et paiements", icon: ShieldCheck, exact: false },
  { href: "/admin/admins", label: "Administrateurs", icon: UserCog, exact: false },
  { href: "/admin/parametres-globaux", label: "Paramètres globaux", icon: SlidersHorizontal, exact: false },
] as const;

export { isNavItemActive };

interface AdminSidebarProps {
  adminName: string;
}

export function AdminSidebar({ adminName }: AdminSidebarProps) {
  return <AppSidebar navItems={ADMIN_NAV_ITEMS} accountLabel={adminName} accountHref="/admin/parametres" />;
}
