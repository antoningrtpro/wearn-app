"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Rendered in the header, between the title block and the close button
   * (e.g. an "Modifier" trigger). */
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Slide-over panel shared by every admin detail view (brand, event, …) — a
 * single visual definition so they all look and behave the same, and a
 * future style change applies everywhere at once.
 */
export function SidePanel({
  open,
  onClose,
  title,
  subtitle,
  headerActions,
  children,
  className,
}: SidePanelProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="animate-panel-backdrop fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "animate-panel-slide fixed inset-y-0 right-0 z-50 flex w-full flex-col overflow-y-auto bg-paper shadow-[0_24px_60px_-12px_rgba(16,24,40,0.25)] sm:w-[540px]",
          className
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-hairline bg-paper px-6 py-5">
          <div className="min-w-0">
            <h2 className="truncate text-heading-sm font-semibold tracking-heading-sm text-ink">{title}</h2>
            {subtitle ? <p className="mt-0.5 truncate text-body text-mid-gray">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mid-gray transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 px-6 py-6">{children}</div>
      </aside>
    </>
  );
}
