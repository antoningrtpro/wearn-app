"use client";

import { useActionState, useEffect } from "react";
import { deleteRace, type DeleteRaceState } from "@/app/admin/evenements/[id]/actions";

const initialState: DeleteRaceState = {};

export function DeleteRaceButton({
  eventId,
  raceId,
  onSuccess,
}: {
  eventId: string;
  raceId: string;
  onSuccess?: () => void;
}) {
  const boundAction = deleteRace.bind(null, eventId, raceId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction}>
      <button type="submit" disabled={pending} className="text-body text-mid-gray hover:text-ember">
        {pending ? "..." : "Supprimer"}
      </button>
    </form>
  );
}
