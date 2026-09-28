import { forwardRef, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label
        className={cn(
          "inline-flex cursor-pointer select-none items-center gap-2",
          props.disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-small border border-hairline bg-paper transition-colors",
            "peer-checked:border-ink peer-checked:bg-ink [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-hairline peer-focus-visible:ring-offset-1"
          )}
        >
          <Check size={13} strokeWidth={3} className="text-surface-alt transition-opacity" />
        </span>
        {label ? <span className="text-body text-ink">{label}</span> : null}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
