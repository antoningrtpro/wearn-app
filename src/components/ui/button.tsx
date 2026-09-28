import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "filled" | "ghost" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  filled: "bg-ink text-surface-alt hover:bg-ink-soft",
  ghost: "bg-canvas text-ink hover:bg-hairline",
  outline: "bg-transparent text-ink border border-hairline hover:bg-canvas",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "filled", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-buttons px-4 text-body font-medium transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
