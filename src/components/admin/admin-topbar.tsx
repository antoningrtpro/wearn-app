"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS, isNavItemActive } from "@/components/admin/admin-sidebar";

export function AdminTopbar() {
  const pathname = usePathname();
  const current = ADMIN_NAV_ITEMS.find((item) => isNavItemActive(pathname, item.href, item.exact));
  const isAccountSettings = pathname.startsWith("/admin/parametres") && pathname !== "/admin/parametres-globaux";

  const currentLabel = isAccountSettings ? "Paramètres du compte" : (current?.label ?? "Tableau de bord");
  const currentHref = isAccountSettings ? "/admin/parametres" : (current?.href ?? "/admin");
  const isDeeperPage = pathname !== currentHref;

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-hairline px-8">
      <div className="flex items-center gap-1.5 text-body text-mid-gray">
        <Link href="/admin" className="hover:text-ink hover:underline">
          Wearn
        </Link>
        <span>/</span>
        {isDeeperPage ? (
          <Link href={currentHref} className="hover:text-ink hover:underline">
            {currentLabel}
          </Link>
        ) : (
          <span className="font-medium text-ink">{currentLabel}</span>
        )}
      </div>
    </header>
  );
}
