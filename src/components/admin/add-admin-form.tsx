"use client";

import { useActionState, useState } from "react";
import { inviteAdmin, type InviteAdminState } from "@/app/admin/admins/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/admin/modal";
import { FormField } from "@/components/brand-form/form-field";

const initialState: InviteAdminState = {};

function AddAdminModalContent({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(inviteAdmin, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink">Administrateur créé.</p>
        {state.resetLink ? (
          <div>
            <p className="text-caption tracking-caption uppercase text-mid-gray">
              Lien pour définir son mot de passe (à envoyer manuellement)
            </p>
            <p className="mt-1 break-all text-body text-ink">{state.resetLink}</p>
          </div>
        ) : null}
        <Button type="button" variant="outline" className="self-start" onClick={onClose}>
          Fermer
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-nested bg-admin-canvas p-4 [&_input]:bg-paper">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Prénom">
          <Input name="firstName" required />
        </FormField>
        <FormField label="Nom">
          <Input name="lastName" required />
        </FormField>
        <FormField label="Email">
          <Input type="email" name="email" required />
        </FormField>
        <FormField label="Téléphone">
          <Input type="tel" name="phone" />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Poste">
            <Input name="jobTitle" placeholder="Ex. Responsable partenariats" />
          </FormField>
        </div>
      </div>
      {state.error ? <p className="text-body text-ember">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="self-center">
        {pending ? "..." : "Envoyer l'invitation"}
      </Button>
    </form>
  );
}

export function AddAdminForm() {
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setInstanceKey((k) => k + 1);
          setOpen(true);
        }}
      >
        Ajouter un administrateur
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvel administrateur" className="max-w-xl">
        <AddAdminModalContent key={instanceKey} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
