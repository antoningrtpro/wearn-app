"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Camera } from "lucide-react";
import { db, storage } from "@/lib/firebase/client";
import { AdminCard as Card } from "@/components/admin/admin-card";
import { Badge } from "@/components/ui/badge";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Stepper } from "@/components/brand-form/stepper";
import { RUNNER_PROGRESS_STEPS, runnerProgressIndex } from "@/lib/utils/assignment-progress";
import { ACCEPTED_PHOTO_TYPES, MAX_PROFILE_PHOTO_BYTES } from "@/lib/validation/runner";
import type { ActiveAssignmentView } from "@/lib/types/runner-view";

const PLACEMENT_LABELS: Record<string, string> = {
  dos: "Dos (t-shirt)",
  manche: "Manche",
  short: "Short",
  dossard: "Dossard",
};

const STATUS_NOTES: Record<string, string> = {
  proof_submitted: "Preuve envoyée — en attente de validation par Wearn.",
  proof_approved: "Preuve validée — paiement à venir.",
  paid: "Payé. Merci !",
};

interface ActiveAssignmentsProps {
  assignments: ActiveAssignmentView[];
  onDetails?: (assignment: ActiveAssignmentView) => void;
}

export function ActiveAssignments({ assignments, onDetails }: ActiveAssignmentsProps) {
  if (assignments.length === 0) {
    return <p className="text-body text-mid-gray">Aucune campagne en cours pour le moment.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {assignments.map((a) => (
        <AssignmentCard key={a.assignmentId} assignment={a} onDetails={onDetails} />
      ))}
    </div>
  );
}

function AssignmentCard({
  assignment,
  onDetails,
}: {
  assignment: ActiveAssignmentView;
  onDetails?: (assignment: ActiveAssignmentView) => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setError(null);
    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!ACCEPTED_PHOTO_TYPES.includes(selected.type)) {
      setError("Format accepté : JPEG, PNG ou WebP.");
      return;
    }
    if (selected.size > MAX_PROFILE_PHOTO_BYTES) {
      setError("Photo trop lourde (5 Mo max).");
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  /**
   * Confirms sticker receipt — direct Firestore write, matching the exact
   * transition firestore.rules carves out for the owning runner
   * (validated_by_runner -> sticker_confirmed, status + stickerConfirmedAt only).
   */
  async function confirmSticker() {
    setError(null);
    setPending(true);
    try {
      await updateDoc(doc(db, "assignments", assignment.assignmentId), {
        status: "sticker_confirmed",
        stickerConfirmedAt: serverTimestamp(),
      });
      router.refresh();
    } catch {
      setError("Impossible de confirmer. Réessayez.");
    } finally {
      setPending(false);
    }
  }

  /**
   * Uploads the proof photo, then flips the assignment to proof_submitted.
   * Order matters: storage.rules only allows this Storage write while the
   * assignment is still "sticker_confirmed" (checked via a Firestore lookup
   * from the Storage rule itself), so the upload must happen BEFORE the
   * Firestore status transition, never after.
   */
  async function submitProof() {
    if (!file) {
      setError("Choisissez une photo.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const path = `proofPhotos/${assignment.assignmentId}/${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "assignments", assignment.assignmentId), {
        status: "proof_submitted",
        proofPhotoUrl: url,
        proofSubmittedAt: serverTimestamp(),
      });
      router.refresh();
    } catch {
      setError("Envoi impossible. Réessayez.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-body-lg font-medium text-ink">{assignment.eventName}</p>
          <p className="text-body text-mid-gray">
            {assignment.eventCity}
            {assignment.eventDate
              ? ` · ${new Date(assignment.eventDate).toLocaleDateString("fr-FR")}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="solid">{PLACEMENT_LABELS[assignment.placement] ?? assignment.placement}</Badge>
          <Badge variant="soft">
            {assignment.runnerPayoutAmount != null ? `${assignment.runnerPayoutAmount.toFixed(2)} €` : "—"}
          </Badge>
          {onDetails ? (
            <button
              type="button"
              onClick={() => onDetails(assignment)}
              className="text-body text-mid-gray underline"
            >
              Détails
            </button>
          ) : null}
        </div>
      </div>

      <Stepper steps={[...RUNNER_PROGRESS_STEPS]} currentIndex={runnerProgressIndex(assignment.status)} />

      {error ? <p className="text-body text-ember">{error}</p> : null}

      {assignment.status === "validated_by_runner" ? (
        <Button onClick={confirmSticker} disabled={pending} className="self-start">
          {pending ? "..." : "Confirmer la réception du sticker"}
        </Button>
      ) : null}

      {assignment.status === "sticker_confirmed" ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-nested border border-hairline bg-canvas text-mid-gray"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Aperçu de la preuve" className="h-full w-full object-cover" />
            ) : (
              <Camera size={20} />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()}>
            {file ? "Changer la photo" : "Choisir une photo"}
          </Button>
          <Button onClick={submitProof} disabled={pending || !file}>
            {pending ? "Envoi..." : "Envoyer la photo de preuve"}
          </Button>
        </div>
      ) : null}

      {STATUS_NOTES[assignment.status] ? (
        <p className="text-body text-mid-gray">{STATUS_NOTES[assignment.status]}</p>
      ) : null}
    </Card>
  );
}
