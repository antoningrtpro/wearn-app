"use client";

import { useActionState, useState } from "react";
import { createBrandWithCollaborator, type CreateBrandState } from "@/app/admin/marques/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/admin/modal";
import { FormField } from "@/components/brand-form/form-field";

const initialState: CreateBrandState = {};

function CreateBrandModalContent({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createBrandWithCollaborator, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink">Marque créée.</p>
        {state.resetLink ? (
          <div>
            <p className="text-caption tracking-caption uppercase text-mid-gray">
              Lien pour définir le mot de passe du premier collaborateur (à envoyer manuellement)
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
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-nested bg-admin-canvas p-4 [&_input]:bg-paper">
        <span className="text-caption tracking-caption uppercase text-mid-gray">Marque</span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Nom de l'entreprise">
            <Input name="companyName" required />
          </FormField>
          <FormField label="SIRET">
            <Input name="siret" placeholder="14 chiffres" inputMode="numeric" required />
          </FormField>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-nested bg-admin-canvas p-4 [&_input]:bg-paper">
        <div>
          <span className="text-caption tracking-caption uppercase text-mid-gray">
            Premier collaborateur
          </span>
          <p className="mt-1 text-body text-mid-gray">
            Il recevra un lien pour définir son mot de passe et activer son compte.
          </p>
        </div>
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
            <Input type="tel" name="phone" required />
          </FormField>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "..." : "Créer la marque"}
        </Button>
        {state.error ? <span className="text-body text-ember">{state.error}</span> : null}
      </div>
    </form>
  );
}

export function CreateBrandForm() {
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
        Créer une marque
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle marque" className="max-w-xl">
        <CreateBrandModalContent key={instanceKey} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
