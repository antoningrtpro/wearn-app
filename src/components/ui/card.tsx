import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-cards border border-hairline bg-paper p-5 shadow-subtle",
        className
      )}
      {...props}
    />
  );
}
