import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-caption tracking-caption uppercase text-mid-gray">{label}</span>
      {children}
      {error ? <span className="text-caption text-ember">{error}</span> : null}
    </label>
  );
}
