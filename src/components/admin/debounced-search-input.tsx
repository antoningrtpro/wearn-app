"use client";

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

interface DebouncedSearchInputProps {
  name: string;
  defaultValue: string;
  placeholder: string;
  className?: string;
}

/**
 * A search input that submits its parent <form method="get"> on its own,
 * debounced — no "Rechercher" button to click. Kept as a plain uncontrolled
 * input (not React state) so typing never stutters waiting on a re-render.
 */
export function DebouncedSearchInput({ name, defaultValue, placeholder, className }: DebouncedSearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className={className ?? "relative max-w-sm flex-1"}>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mid-gray" />
      <input
        ref={inputRef}
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChange={(e) => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          const form = e.currentTarget.form;
          timeoutRef.current = setTimeout(() => form?.requestSubmit(), 400);
        }}
        className="h-10 w-full rounded-inputs border border-hairline bg-paper pl-9 pr-3 text-body text-ink outline-none focus:border-ink"
      />
    </div>
  );
}
