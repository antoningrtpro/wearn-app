import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "solid" | "soft" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  solid: "bg-ink-soft text-surface-alt",
  soft: "bg-canvas text-ink-soft",
  outline: "bg-transparent text-ink border border-hairline",
};

export function Badge({ className, variant = "soft", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-badges px-2 py-0.5 text-caption font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
