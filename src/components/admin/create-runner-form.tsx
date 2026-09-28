"use client";

import { useActionState, useState } from "react";
import { createRunnerManually, type CreateRunnerState } from "@/app/admin/coureurs/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/admin/modal";
import { FormField } from "@/components/brand-form/form-field";
import { MultiSelectDropdown } from "@/components/admin/multi-select-dropdown";
import { placementLabel } from "@/lib/utils/placement-labels";

const GENDER_LABELS = { homme: "Homme", femme: "Femme", autre: "Autre" } as const;
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

const initialState: CreateRunnerState = {};

function CreateRunnerModalContent({
  placements,
  onClose,
}: {
  placements: string[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(createRunnerManually, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body text-ink">Coureur créé.</p>
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
    <form action={formAction} className="flex flex-col gap-6">
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
        <FormField label="Genre">
          <Select name="gender" defaultValue="">
            <option value="" disabled>
              Choisir
            </option>
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Date de naissance">
          <Input type="date" name="birthDate" required />
        </FormField>
        <FormField label="Taille de vêtements">
          <Select name="clothingSize" defaultValue="">
            <option value="" disabled>
              Choisir
            </option>
            {CLOTHING_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="IBAN ou référence de paiement">
          <Input name="ibanOrPaymentRef" required />
        </FormField>
        <FormField label="Statut fiscal">
          <Input name="taxStatus" placeholder="Ex. particulier, auto-entrepreneur..." required />
        </FormField>
        <FormField label="Photo de profil">
          <Input type="file" name="profilePhoto" accept="image/jpeg,image/png,image/webp" required />
        </FormField>
      </div>

      <MultiSelectDropdown
        label="Emplacements acceptés"
        name="acceptedPlacements"
        options={placements.map((p) => ({ value: p, label: placementLabel(p) }))}
        defaultSelected={[]}
        buttonClassName="w-full"
      />

      {state.error ? <p className="text-body text-ember">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "..." : "Créer le coureur"}
      </Button>
    </form>
  );
}

export function CreateRunnerForm({ placements }: { placements: string[] }) {
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
        Ajouter un coureur
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un coureur manuellement">
        <CreateRunnerModalContent key={instanceKey} placements={placements} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
