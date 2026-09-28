/** Safe, client-facing shapes returned by public/server API routes. */

export interface PublicEvent {
  id: string;
  name: string;
  date: string;
  city: string;
  distanceKm: number | null;
  estimatedParticipants: number;
  imageUrl: string | null;
}

export interface PublicEventRace {
  id: string;
  name: string;
  distanceKm: number;
}

export interface PublicEventWithRaces extends PublicEvent {
  races: PublicEventRace[];
}
