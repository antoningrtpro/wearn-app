"use client";

import { Modal } from "@/components/admin/modal";
import { AdminButton as Button } from "@/components/admin/admin-button";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Hides the cancel button — for a plain informational modal with just "OK". */
  infoOnly?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  infoOnly,
  pending,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} className="max-w-sm">
      <p className="text-body text-mid-gray">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        {infoOnly ? null : (
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button type="button" onClick={onConfirm} disabled={pending}>
          {pending ? "..." : infoOnly ? "Compris" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
