"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { updateBrand, type UpdateBrandState } from "@/app/admin/marques/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/admin/modal";
import { FormField } from "@/components/brand-form/form-field";

interface EditBrandFormProps {
  brandId: string;
  companyName: string;
  siret: string;
  onSuccess?: () => void;
}

const initialState: UpdateBrandState = {};

function EditBrandModalContent({
  brandId,
  companyName,
  siret,
  onClose,
  onSuccess,
}: EditBrandFormProps & { onClose: () => void }) {
  const boundAction = updateBrand.bind(null, brandId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink">Marque modifiée.</p>
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
        <FormField label="Nom de l'entreprise">
          <Input name="companyName" defaultValue={companyName} required />
        </FormField>
        <FormField label="SIRET">
          <Input name="siret" defaultValue={siret} placeholder="14 chiffres" inputMode="numeric" required />
        </FormField>
      </div>
      {state.error ? <p className="text-body text-ember">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "..." : "Enregistrer"}
      </Button>
    </form>
  );
}

export function EditBrandForm({ brandId, companyName, siret, onSuccess }: EditBrandFormProps) {
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
        <Pencil size={14} />
        Modifier
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Modifier la marque">
        <EditBrandModalContent
          key={instanceKey}
          brandId={brandId}
          companyName={companyName}
          siret={siret}
          onClose={() => setOpen(false)}
          onSuccess={onSuccess}
        />
      </Modal>
    </>
  );
}
