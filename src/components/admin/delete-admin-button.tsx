"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAdminAccount, type DeleteAdminState } from "@/app/admin/admins/actions";

const initialState: DeleteAdminState = {};

export function DeleteAdminButton({ adminId, name }: { adminId: string; name: string }) {
  const boundAction = deleteAdminAccount.bind(null, adminId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(`Supprimer le compte de ${name} ? Cette action est irréversible.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={pending}
        aria-label="Supprimer cet administrateur"
        className="flex h-8 w-8 items-center justify-center rounded-full text-mid-gray hover:bg-admin-negative-soft hover:text-admin-negative disabled:opacity-50"
      >
        <Trash2 size={14} />
      </button>
      {state.error ? <p className="mt-1 text-caption text-ember">{state.error}</p> : null}
    </form>
  );
}
