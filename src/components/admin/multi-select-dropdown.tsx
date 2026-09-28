"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label: string;
  name: string;
  options: MultiSelectOption[];
  defaultSelected: string[];
  className?: string;
  /** Overrides the trigger button's width (defaults to a fixed w-44, used
   * by inline filter bars) — pass "w-full" when this is its own full row. */
  buttonClassName?: string;
  /** Fired after a checkbox toggles — used to auto-submit a filter form. */
  onChange?: () => void;
}

/**
 * The checkbox panel is rendered through a portal into document.body and
 * positioned with `fixed` coordinates computed from the trigger button —
 * this lets it escape any ancestor's `overflow: hidden/auto` (e.g. a Modal's
 * scrollable card), which previously clipped it and made the options
 * unreadable when opened near the bottom of a form.
 *
 * Because the portal moves the checkboxes outside the enclosing <form> in
 * the real DOM, they can no longer double as the form's own submittable
 * fields (native form serialization only walks descendants). Selection is
 * instead mirrored into plain `<input type="hidden">` elements that stay
 * right where the component is rendered, inside the form — the portaled
 * checkboxes are purely the visual/interactive control.
 */
export function MultiSelectDropdown({
  label,
  name,
  options,
  defaultSelected,
  className,
  buttonClassName,
  onChange,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected));
  const [panelRect, setPanelRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    function updatePosition() {
      const rect = buttonRef.current!.getBoundingClientRect();
      setPanelRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  function toggle(value: string) {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (copy.has(value)) copy.delete(value);
      else copy.add(value);
      return copy;
    });
    onChange?.();
  }

  const summary = selected.size === 0 ? "Tous" : `${selected.size} sélectionné(s)`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)} ref={wrapperRef}>
      <span className="text-caption tracking-caption uppercase text-mid-gray">{label}</span>
      {[...selected].map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-44 items-center justify-between rounded-inputs border border-hairline bg-paper px-3 text-body text-ink",
          buttonClassName
        )}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 text-mid-gray transition-transform", open && "rotate-180")}
        />
      </button>

      {open && panelRect && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              style={{
                position: "fixed",
                top: panelRect.top,
                left: panelRect.left,
                width: Math.max(panelRect.width, 220),
              }}
              className="z-[60] max-h-64 overflow-y-auto rounded-admin-card border border-hairline bg-paper p-2 shadow-admin-card"
            >
              {options.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-nested px-2 py-1.5 text-body text-ink hover:bg-ink/5"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(option.value)}
                    onChange={() => toggle(option.value)}
                    className="h-4 w-4 rounded border-hairline"
                  />
                  {option.label}
                </label>
              ))}
              {options.length === 0 ? (
                <p className="px-2 py-1.5 text-body text-mid-gray">Aucune option.</p>
              ) : null}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
