"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { updateEventImage, type UpdateEventImageState } from "@/app/admin/evenements/actions";

const initialState: UpdateEventImageState = {};

interface EventImageFormProps {
  eventId: string;
  imageUrl: string | null;
  onSuccess?: (imageUrl: string) => void;
}

/** Autosaves on file pick — click the cover, choose an image, it uploads and
 * saves immediately, same interaction as the runner profile photo. */
export function EventImageForm({ eventId, imageUrl, onSuccess }: EventImageFormProps) {
  const boundAction = updateEventImage.bind(null, eventId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (state.imageUrl) onSuccess?.(state.imageUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.imageUrl]);

  const displayUrl = preview ?? imageUrl;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex h-40 w-full items-center justify-center overflow-hidden rounded-admin-card bg-admin-canvas text-mid-gray"
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Camera size={24} />
        )}
        <span className="absolute inset-0 flex items-center justify-center gap-2 bg-ink/40 text-caption font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
          {pending ? "Envoi…" : "Changer l'image"}
        </span>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        name="imageFile"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          if (!file) return;
          setPreview(URL.createObjectURL(file));
          formRef.current?.requestSubmit();
        }}
      />
      {state.error ? <p className="text-caption text-ember">{state.error}</p> : null}
    </form>
  );
}
