import { cn } from "@/lib/cn";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface InitialsAvatarProps {
  name: string;
  className?: string;
}

export function InitialsAvatar({ name, className }: InitialsAvatarProps) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-caption font-semibold text-ink-soft",
        className
      )}
    >
      {getInitials(name)}
    </span>
  );
}
