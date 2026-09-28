"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { AdminCard } from "@/components/admin/admin-card";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-modal-backdrop fixed inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <AdminCard
        className={cn(
          "animate-modal-card relative z-10 max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-[28px] shadow-[0_24px_60px_-12px_rgba(16,24,40,0.35),0_0_0_1px_rgba(16,24,40,0.04)]",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <h2 className="text-heading-sm font-semibold tracking-heading-sm text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mid-gray transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <div className="pt-5">{children}</div>
      </AdminCard>
    </div>
  );
}
