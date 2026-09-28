"use client";

import { useActionState } from "react";
import { updateAdminProfile, type UpdateAdminProfileState } from "@/app/admin/parametres/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/brand-form/form-field";

interface UpdateAdminProfileFormProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
}

const initialState: UpdateAdminProfileState = {};

export function UpdateAdminProfileForm({
  firstName,
  lastName,
  email,
  phone,
  jobTitle,
}: UpdateAdminProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateAdminProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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
        <div className="sm:col-span-2">
          <FormField label="Poste">
            <Input name="jobTitle" placeholder="Ex. Responsable partenariats" defaultValue={jobTitle} />
          </FormField>
        </div>
      </div>
      {state.error ? <p className="text-body text-ember">{state.error}</p> : null}
      {state.success ? <p className="text-body text-admin-positive">Enregistré.</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "..." : "Enregistrer"}
      </Button>
    </form>
  );
}
