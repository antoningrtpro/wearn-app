"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { updateAdminAccount, type UpdateAdminState } from "@/app/admin/admins/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/admin/modal";
import { FormField } from "@/components/brand-form/form-field";

interface EditAdminFormProps {
  adminId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
}

const initialState: UpdateAdminState = {};

function EditAdminModalContent({
  adminId,
  firstName,
  lastName,
  email,
  phone,
  jobTitle,
  onClose,
}: EditAdminFormProps & { onClose: () => void }) {
  const boundAction = updateAdminAccount.bind(null, adminId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink">Administrateur modifié.</p>
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
          <Input name="firstName" defaultValue={firstName} required />
        </FormField>
        <FormField label="Nom">
          <Input name="lastName" defaultValue={lastName} required />
        </FormField>
        <FormField label="Email">
          <Input type="email" value={email} disabled />
        </FormField>
        <FormField label="Téléphone">
          <Input type="tel" name="phone" defaultValue={phone} />
        </FormField>
        <FormField label="Poste">
          <Input name="jobTitle" defaultValue={jobTitle} placeholder="Ex. Responsable partenariats" />
        </FormField>
      </div>
      {state.error ? <p className="text-body text-ember">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "..." : "Enregistrer"}
      </Button>
    </form>
  );
}

export function EditAdminForm(props: EditAdminFormProps) {
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
        aria-label="Modifier cet administrateur"
        className="flex h-8 w-8 items-center justify-center rounded-full text-mid-gray hover:bg-ink/5 hover:text-ink"
      >
        <Pencil size={14} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Modifier l'administrateur">
        <EditAdminModalContent key={instanceKey} {...props} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
