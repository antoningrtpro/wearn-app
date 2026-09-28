"use client";

import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/brand-form/form-field";
import { placementLabel } from "@/lib/utils/placement-labels";
import { RUNNER_COUNT_BRACKETS, bracketKey } from "@/lib/utils/runner-count-brackets";

export interface SegmentFields {
  targetGender: "tous" | "homme" | "femme" | "autre";
  targetAgeMin: number;
  targetAgeMax: number;
  placement: string;
  requestedRunnerCountMin: number;
  requestedRunnerCountMax: number;
  notes: string;
}

export const GENDER_LABELS: Record<SegmentFields["targetGender"], string> = {
  tous: "Tous genres",
  homme: "Hommes",
  femme: "Femmes",
  autre: "Autre",
};

export function createEmptySegment(placements: string[]): SegmentFields {
  return {
    targetGender: "tous",
    targetAgeMin: 18,
    targetAgeMax: 45,
    placement: placements[0] ?? "",
    requestedRunnerCountMin: RUNNER_COUNT_BRACKETS[1].min,
    requestedRunnerCountMax: RUNNER_COUNT_BRACKETS[1].max,
    notes: "",
  };
}

interface CampaignSegmentFieldsProps {
  segment: SegmentFields;
  index: number;
  placements: string[];
  onChange: (patch: Partial<SegmentFields>) => void;
  onRemove?: () => void;
}

/**
 * One "ciblage" block — shared by the admin and brand campaign-creation
 * forms (previously duplicated verbatim in both). A 2-column grid of 4
 * clearly-labeled fields (age min/max merged into one "Tranche d'âge"
 * control) reads far better than the old 5-field 3-column grid, which wrapped
 * unevenly and left the age fields looking like unrelated, disconnected
 * inputs.
 */
export function CampaignSegmentFields({ segment, index, placements, onChange, onRemove }: CampaignSegmentFieldsProps) {
  return (
    <div className="flex flex-col gap-4 rounded-nested bg-admin-canvas p-4 [&_input]:bg-paper [&_select]:bg-paper [&_textarea]:bg-paper">
      <div className="flex items-center justify-between">
        <span className="text-caption tracking-caption uppercase text-mid-gray">
          Ciblage {index + 1}
        </span>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-mid-gray hover:text-ember"
            aria-label="Supprimer ce ciblage"
          >
            <Trash2 size={16} />
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Genre ciblé">
          <Select
            value={segment.targetGender}
            onChange={(e) => onChange({ targetGender: e.target.value as SegmentFields["targetGender"] })}
          >
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Tranche d'âge">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={16}
              max={99}
              value={segment.targetAgeMin}
              onChange={(e) => onChange({ targetAgeMin: Number(e.target.value) })}
              className="w-full"
            />
            <span className="shrink-0 text-body text-mid-gray">à</span>
            <Input
              type="number"
              min={16}
              max={99}
              value={segment.targetAgeMax}
              onChange={(e) => onChange({ targetAgeMax: Number(e.target.value) })}
              className="w-full"
            />
            <span className="shrink-0 text-body text-mid-gray">ans</span>
          </div>
        </FormField>

        <FormField label="Emplacement">
          <Select value={segment.placement} onChange={(e) => onChange({ placement: e.target.value })}>
            {placements.map((placement) => (
              <option key={placement} value={placement}>
                {placementLabel(placement)}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Coureurs recherchés">
          <Select
            value={bracketKey(segment.requestedRunnerCountMin, segment.requestedRunnerCountMax)}
            onChange={(e) => {
              const bracket = RUNNER_COUNT_BRACKETS.find((b) => bracketKey(b.min, b.max) === e.target.value);
              if (bracket) {
                onChange({ requestedRunnerCountMin: bracket.min, requestedRunnerCountMax: bracket.max });
              }
            }}
          >
            {RUNNER_COUNT_BRACKETS.map((bracket) => (
              <option key={bracketKey(bracket.min, bracket.max)} value={bracketKey(bracket.min, bracket.max)}>
                {bracket.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Notes (optionnel)">
        <Textarea rows={2} value={segment.notes} onChange={(e) => onChange({ notes: e.target.value })} />
      </FormField>
    </div>
  );
}
