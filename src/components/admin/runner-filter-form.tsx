"use client";

import { useRef } from "react";
import { AdminCard as Card } from "@/components/admin/admin-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectDropdown } from "@/components/admin/multi-select-dropdown";
import { placementLabel } from "@/lib/utils/placement-labels";

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export interface RunnerFilterFormValues {
  gender?: string;
  ageMin?: string;
  ageMax?: string;
  size?: string;
  placements: string[];
  participatesOnly: boolean;
}

interface RunnerFilterFormProps {
  action: string;
  defaultValues: RunnerFilterFormValues;
  resetHref: string;
  /** Whether this campaign has a real event to filter participation against. */
  hasEvent: boolean;
  placements: string[];
  /** Rendered at the end of the filter bandeau (e.g. a card/list view toggle). */
  viewToggle?: React.ReactNode;
}

/** Filters apply themselves — every control submits the form on change, no
 * "Filtrer" button to click. Text/number fields debounce briefly so typing
 * doesn't fire a navigation per keystroke. */
export function RunnerFilterForm({
  action,
  defaultValues,
  resetHref,
  hasEvent,
  placements,
  viewToggle,
}: RunnerFilterFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function submitNow() {
    formRef.current?.requestSubmit();
  }

  function submitDebounced() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(submitNow, 400);
  }

  return (
    <Card>
      <form ref={formRef} method="get" action={action} className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-caption tracking-caption uppercase text-mid-gray">Genre</span>
          <Select name="gender" defaultValue={defaultValues.gender ?? ""} className="w-36" onChange={submitNow}>
            <option value="">Tous</option>
            <option value="homme">Homme</option>
            <option value="femme">Femme</option>
            <option value="autre">Autre</option>
          </Select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-caption tracking-caption uppercase text-mid-gray">Âge min</span>
          <Input
            name="ageMin"
            type="number"
            min={16}
            max={99}
            defaultValue={defaultValues.ageMin ?? ""}
            className="w-24"
            onChange={submitDebounced}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-caption tracking-caption uppercase text-mid-gray">Âge max</span>
          <Input
            name="ageMax"
            type="number"
            min={16}
            max={99}
            defaultValue={defaultValues.ageMax ?? ""}
            className="w-24"
            onChange={submitDebounced}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-caption tracking-caption uppercase text-mid-gray">Taille</span>
          <Select name="size" defaultValue={defaultValues.size ?? ""} className="w-28" onChange={submitNow}>
            <option value="">Toutes</option>
            {CLOTHING_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </label>

        <MultiSelectDropdown
          label="Emplacements"
          name="placements"
          options={placements.map((p) => ({ value: p, label: placementLabel(p) }))}
          defaultSelected={defaultValues.placements}
          onChange={submitNow}
        />

        {hasEvent ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-caption tracking-caption uppercase text-mid-gray">
              Participation
            </span>
            <div className="rounded-inputs border border-hairline bg-canvas px-2 py-2">
              <Checkbox
                name="participatesOnly"
                value="1"
                label="A coché « Je participe »"
                defaultChecked={defaultValues.participatesOnly}
                onChange={submitNow}
              />
            </div>
          </div>
        ) : null}

        <a
          href={resetHref}
          className="inline-flex h-10 items-center rounded-buttons border border-hairline px-4 text-body text-ink transition-colors hover:bg-ink/5"
        >
          Réinitialiser
        </a>

        {viewToggle ? <div className="ml-auto flex items-end">{viewToggle}</div> : null}
      </form>
    </Card>
  );
}
