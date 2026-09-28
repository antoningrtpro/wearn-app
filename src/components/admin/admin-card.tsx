import type { HTMLAttributes } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

/**
 * Admin-section card: rounder corners + a soft shadow instead of a hairline
 * border, matching the admin dashboard's own design language (distinct from
 * the flatter, bordered cards used on brand/coureur-facing pages).
 */
export function AdminCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <Card
      className={cn("rounded-admin-card border-transparent shadow-admin-card", className)}
      {...props}
    />
  );
}
