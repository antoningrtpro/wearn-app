/**
 * Preset choices for "how many runners" on a campaign segment — replaces
 * free-typed min/max numbers (which could trip validation, e.g. a value
 * over the 1000 cap) with a fixed set of brackets. The admin still assigns
 * the actual final headcount per runner during shortlisting; this is just
 * the brand/admin's rough request.
 */
export const RUNNER_COUNT_BRACKETS = [
  { label: "1 à 100 coureurs", min: 1, max: 100 },
  { label: "100 à 300 coureurs", min: 100, max: 300 },
  { label: "300 à 500 coureurs", min: 300, max: 500 },
  { label: "500 à 1 000 coureurs", min: 500, max: 1000 },
  { label: "1 000 à 3 000 coureurs", min: 1000, max: 3000 },
  { label: "3 000 à 10 000 coureurs", min: 3000, max: 10000 },
  { label: "10 000 coureurs et plus", min: 10000, max: 100000 },
] as const;

export function bracketKey(min: number, max: number): string {
  return `${min}-${max}`;
}

export function bracketLabel(min: number, max: number): string {
  const match = RUNNER_COUNT_BRACKETS.find((b) => b.min === min && b.max === max);
  return match?.label ?? `${min}–${max} coureurs`;
}
