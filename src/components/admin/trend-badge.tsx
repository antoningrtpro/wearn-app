import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-0.5 rounded-badges px-2 py-0.5 text-caption font-medium",
        positive ? "bg-admin-positive-soft text-admin-positive" : "bg-admin-negative-soft text-admin-negative"
      )}
    >
      {positive ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
      {positive ? "+" : ""}
      {value}%
    </span>
  );
}
