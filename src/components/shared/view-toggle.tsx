"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/cn";

interface ViewToggleProps {
  view: "card" | "list";
  onChange: (view: "card" | "list") => void;
  className?: string;
}

/** Shared card/list view switch — one definition so it looks and behaves
 * identically everywhere it's used (runner catalog, events, shortlisting). */
export function ViewToggle({ view, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn("flex gap-1 rounded-full border border-hairline bg-paper p-1", className)}>
      <button
        type="button"
        onClick={() => onChange("card")}
        aria-label="Vue cartes"
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          view === "card" ? "bg-admin-canvas text-ink" : "text-mid-gray hover:text-ink"
        )}
      >
        <LayoutGrid size={16} />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-label="Vue liste"
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
          view === "list" ? "bg-admin-canvas text-ink" : "text-mid-gray hover:text-ink"
        )}
      >
        <List size={16} />
      </button>
    </div>
  );
}
