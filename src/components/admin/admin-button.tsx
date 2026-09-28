import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type Variant = "filled" | "ghost" | "outline";

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/** Admin-section button: the default (filled) variant uses the indigo accent
 * instead of ink black. Ghost/outline stay neutral, matching the reference
 * dashboard's convention of coloring only primary actions. */
export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ className, variant = "filled", ...props }, ref) => (
    <Button
      ref={ref}
      variant={variant}
      className={cn(
        variant === "filled" && "bg-admin-accent text-white hover:bg-admin-accent-hover",
        className
      )}
      {...props}
    />
  )
);
AdminButton.displayName = "AdminButton";
