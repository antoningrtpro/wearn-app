"use client";

import { useActionState, useState } from "react";
import { addCollaborator, type AddCollaboratorState } from "@/app/admin/marques/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/admin/modal";
import { FormField } from "@/components/brand-form/form-field";

const initialState: AddCollaboratorState = {};

function AddCollaboratorModalContent({
  brandId,
  onClose,
  onSuccess,
}: {
  brandId: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const boundAction = addCollaborator.bind(null, brandId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink">Collaborateur créé.</p>
        {state.resetLink ? (
          <div>
            <p className="text-caption tracking-caption uppercase text-mid-gray">
              Lien pour définir son mot de passe (à envoyer manuellement)
            </p>
            <p className="mt-1 break-all text-body text-ink">{state.resetLink}</p>
          </div>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => {
            onSuccess?.();
            onClose();
          }}
        >
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
          <Input type="tel" name="phone" required />
        </FormField>
      </div>
      {state.error ? <p className="text-body text-ember">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "..." : "Créer le collaborateur"}
      </Button>
    </form>
  );
}

export function AddCollaboratorForm({
  brandId,
  onSuccess,
}: {
  brandId: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setInstanceKey((k) => k + 1);
          setOpen(true);
        }}
      >
        Ajouter un collaborateur
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau collaborateur">
        <AddCollaboratorModalContent
          key={instanceKey}
          brandId={brandId}
          onClose={() => setOpen(false)}
          onSuccess={onSuccess}
        />
      </Modal>
    </>
  );
}
