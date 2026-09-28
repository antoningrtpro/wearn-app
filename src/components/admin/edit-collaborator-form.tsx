"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { updateCollaborator, type UpdateCollaboratorState } from "@/app/admin/marques/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/admin/modal";
import { FormField } from "@/components/brand-form/form-field";

interface EditCollaboratorFormProps {
  collaboratorId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  onSuccess?: () => void;
}

const initialState: UpdateCollaboratorState = {};

function EditCollaboratorModalContent({
  collaboratorId,
  firstName,
  lastName,
  email,
  phone,
  onClose,
  onSuccess,
}: EditCollaboratorFormProps & { onClose: () => void }) {
  const boundAction = updateCollaborator.bind(null, collaboratorId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink">Collaborateur modifié.</p>
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
          <Input name="firstName" defaultValue={firstName} required />
        </FormField>
        <FormField label="Nom">
          <Input name="lastName" defaultValue={lastName} required />
        </FormField>
        <FormField label="Email">
          <Input type="email" value={email} disabled />
        </FormField>
        <FormField label="Téléphone">
          <Input type="tel" name="phone" defaultValue={phone} required />
        </FormField>
      </div>
      {state.error ? <p className="text-body text-ember">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "..." : "Enregistrer"}
      </Button>
    </form>
  );
}

export function EditCollaboratorForm({
  collaboratorId,
  firstName,
  lastName,
  email,
  phone,
  onSuccess,
}: EditCollaboratorFormProps) {
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setInstanceKey((k) => k + 1);
          setOpen(true);
        }}
        aria-label="Modifier ce collaborateur"
        className="flex h-8 w-8 items-center justify-center rounded-full text-mid-gray hover:bg-ink/5 hover:text-ink"
      >
        <Pencil size={14} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Modifier le collaborateur">
        <EditCollaboratorModalContent
          key={instanceKey}
          collaboratorId={collaboratorId}
          firstName={firstName}
          lastName={lastName}
          email={email}
          phone={phone}
          onClose={() => setOpen(false)}
          onSuccess={onSuccess}
        />
      </Modal>
    </>
  );
}
