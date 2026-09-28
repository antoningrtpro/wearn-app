"use client";

import { useActionState } from "react";
import {
  updateOwnCollaboratorProfile,
  type UpdateCollaboratorProfileState,
} from "@/app/marque/profil/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/brand-form/form-field";

interface UpdateCollaboratorProfileFormProps {
  firstName: string;
  lastName: string;
  phone: string;
}

const initialState: UpdateCollaboratorProfileState = {};

export function UpdateCollaboratorProfileForm({
  firstName,
  lastName,
  phone,
}: UpdateCollaboratorProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateOwnCollaboratorProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Prénom">
          <Input name="firstName" defaultValue={firstName} required />
        </FormField>
        <FormField label="Nom">
          <Input name="lastName" defaultValue={lastName} required />
        </FormField>
        <FormField label="Téléphone">
          <Input name="phone" defaultValue={phone} required />
        </FormField>
      </div>
      {state.error ? <p className="text-body text-ember">{state.error}</p> : null}
      {state.success ? <p className="text-body text-admin-positive">Enregistré.</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "..." : "Enregistrer"}
      </Button>
    </form>
  );
}
