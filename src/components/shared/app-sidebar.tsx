"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { auth } from "@/lib/firebase/client";
import Logo, { LogoMark } from "@/components/shared/logo";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
}

export function isNavItemActive(pathname: string, href: string, exact: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

interface AppSidebarProps {
  navItems: readonly SidebarNavItem[];
  /** Bottom-of-sidebar account entry. Rendered as a link when `href` is set,
   * plain text otherwise (e.g. spaces with no account-settings page yet). */
  accountLabel: string;
  accountHref?: string;
}

/**
 * Single sidebar shell shared by every authenticated space (admin, coureur,
 * marque) so a visual change here — logo, colors, spacing, the account/
 * logout footer — applies everywhere at once instead of being copy-pasted
 * per space.
 */
export function AppSidebar({ navItems, accountLabel, accountHref }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/session", { method: "DELETE" });
    await auth.signOut();
    router.push("/");
    router.refresh();
  }

  const accountActive = accountHref ? isNavItemActive(pathname, accountHref, false) : false;
  const accountClassName = cn(
    "min-w-0 flex-1 truncate rounded-nested px-3 py-2 text-body transition-colors",
    collapsed && "text-center",
    accountActive ? "bg-canvas text-ink font-medium" : "text-mid-gray"
  );

  return (
    <aside
      className={cn(
        "relative flex h-full shrink-0 flex-col justify-between bg-paper py-6 transition-[width]",
        collapsed ? "w-20 px-2" : "w-64 px-4"
      )}
    >
      <div>
        <div className={cn("flex items-center gap-2 px-2", collapsed && "justify-center")}>
          {collapsed ? (
            <LogoMark className="text-heading-sm font-bold" />
          ) : (
            <Logo className="text-body-lg font-bold tracking-heading-sm text-ink" />
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
          className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-hairline bg-paper text-mid-gray shadow-subtle hover:text-ink"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        <nav className="mt-8 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = isNavItemActive(pathname, item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-nested px-3 py-2 text-body transition-colors",
                  collapsed && "justify-center",
                  isActive ? "bg-canvas text-ink font-medium" : "text-mid-gray hover:bg-canvas hover:text-ink"
                )}
              >
                <Icon size={18} strokeWidth={1.75} />
                {!collapsed ? item.label : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-hairline pt-4">
        {accountHref ? (
          <Link href={accountHref} title={collapsed ? accountLabel : undefined} className={cn(accountClassName, "hover:bg-canvas hover:text-ink")}>
            {!collapsed ? accountLabel : accountLabel.slice(0, 1)}
          </Link>
        ) : (
          <span className={accountClassName} title={collapsed ? accountLabel : undefined}>
            {!collapsed ? accountLabel : accountLabel.slice(0, 1)}
          </span>
        )}
        {!collapsed ? (
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Déconnexion"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mid-gray hover:bg-canvas hover:text-ink"
          >
            <LogOut size={16} strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
    </aside>
  );
}
