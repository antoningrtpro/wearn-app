"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { updateRunnerManually, type UpdateRunnerState } from "@/app/admin/coureurs/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/admin/modal";
import { FormField } from "@/components/brand-form/form-field";
import { MultiSelectDropdown } from "@/components/admin/multi-select-dropdown";
import { placementLabel } from "@/lib/utils/placement-labels";

const GENDER_LABELS = { homme: "Homme", femme: "Femme", autre: "Autre" } as const;
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

interface EditRunnerFormProps {
  runnerId: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  birthDate: string | null;
  clothingSize: string | null;
  acceptedPlacements: string[];
  placements: string[];
}

const initialState: UpdateRunnerState = {};

function EditRunnerModalContent({
  runnerId,
  firstName,
  lastName,
  phone,
  gender,
  birthDate,
  clothingSize,
  acceptedPlacements,
  placements,
  onClose,
}: EditRunnerFormProps & { onClose: () => void }) {
  const boundAction = updateRunnerManually.bind(null, runnerId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink">Coureur modifié.</p>
        <Button type="button" variant="outline" className="self-start" onClick={onClose}>
          Fermer
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Prénom">
          <Input name="firstName" defaultValue={firstName} required />
        </FormField>
        <FormField label="Nom">
          <Input name="lastName" defaultValue={lastName} required />
        </FormField>
        <FormField label="Téléphone">
          <Input type="tel" name="phone" defaultValue={phone} required />
        </FormField>
        <FormField label="Genre">
          <Select name="gender" defaultValue={gender}>
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Date de naissance">
          <Input type="date" name="birthDate" defaultValue={birthDate ?? ""} required />
        </FormField>
        <FormField label="Taille de vêtements">
          <Select name="clothingSize" defaultValue={clothingSize ?? ""}>
            <option value="">Non renseignée</option>
            {CLOTHING_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <MultiSelectDropdown
        label="Emplacements acceptés"
        name="acceptedPlacements"
        options={placements.map((p) => ({ value: p, label: placementLabel(p) }))}
        defaultSelected={acceptedPlacements}
        buttonClassName="w-full"
      />

      {state.error ? <p className="text-body text-ember">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "..." : "Enregistrer"}
      </Button>
    </form>
  );
}

interface EditRunnerFormWrapperProps extends EditRunnerFormProps {
  onSuccess?: () => void;
}

export function EditRunnerForm({ onSuccess, ...props }: EditRunnerFormWrapperProps) {
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

      <Modal open={open} onClose={() => setOpen(false)} title="Modifier le coureur">
        <EditRunnerModalContent
          key={instanceKey}
          {...props}
          onClose={() => {
            onSuccess?.();
            setOpen(false);
          }}
        />
      </Modal>
    </>
  );
}
