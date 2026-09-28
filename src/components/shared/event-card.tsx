import type { ReactNode } from "react";
import { ImageOff } from "lucide-react";
import { AdminCard as Card } from "@/components/admin/admin-card";
import type { PublicEventWithRaces } from "@/lib/types/public";

interface EventCardProps {
  event: PublicEventWithRaces;
  /** Rendered below the event info — the space-specific action (a runner's
   * "Je participe" toggle, a brand's "Créer une campagne" button, etc). */
  children?: ReactNode;
}

/**
 * The image + info shell shared by every event card across spaces (coureur,
 * marque) — a visual change here (image ratio, info layout) applies
 * everywhere at once instead of being duplicated per space.
 */
export function EventCard({ event, children }: EventCardProps) {
  return (
    <Card className="flex flex-col gap-0 overflow-hidden p-0">
      <div className="flex h-28 w-full items-center justify-center bg-admin-canvas">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt={event.name} className="h-full w-full object-cover" />
        ) : (
          <ImageOff size={24} strokeWidth={1.5} className="text-mid-gray" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <p className="text-body-lg font-semibold text-ink">{event.name}</p>
          <p className="mt-1 text-body text-mid-gray">
            {event.city} · {new Date(event.date).toLocaleDateString("fr-FR")}
            {event.distanceKm ? ` · ${event.distanceKm} km` : ""}
          </p>
        </div>
        {children}
      </div>
    </Card>
  );
}
