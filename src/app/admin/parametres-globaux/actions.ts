"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";
import { DEFAULT_PLACEMENTS } from "@/lib/server/platform-config";

export interface PlatformConfigState {
  error?: string;
  success?: boolean;
}

/** Sets platformConfig.defaultCommissionRate — admin-only, both to call this
 * action and to read the document it writes (firestore.rules). Never read
 * back by the client beyond success/error. */
export async function updateDefaultCommissionRate(
  _prevState: PlatformConfigState,
  formData: FormData
): Promise<PlatformConfigState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const raw = formData.get("defaultCommissionRate");
  const rawStr = typeof raw === "string" ? raw.trim() : "";
  const value = Number(rawStr);
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    return { error: "Le taux doit être un nombre entre 0 et 1 (ex. 0.4 pour 40%)." };
  }

  await adminDb.collection("platformConfig").doc("config").set(
    {
      defaultCommissionRate: value,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: session.uid,
    },
    { merge: true }
  );

  revalidatePath("/admin/parametres-globaux");
  return { success: true };
}

export interface PlacementsState {
  error?: string;
  success?: boolean;
}

export async function addPlacement(
  _prevState: PlacementsState,
  formData: FormData
): Promise<PlacementsState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const raw = formData.get("placement");
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    return { error: "Nom de l'emplacement requis." };
  }

  const configRef = adminDb.collection("platformConfig").doc("config");
  const snap = await configRef.get();
  const current: string[] = Array.isArray(snap.data()?.placements) ? snap.data()!.placements : DEFAULT_PLACEMENTS;
  if (current.includes(value)) {
    return { error: "Cet emplacement existe déjà." };
  }

  await configRef.set(
    {
      placements: [...current, value],
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: session.uid,
    },
    { merge: true }
  );

  revalidatePath("/admin/parametres-globaux");
  return { success: true };
}

export async function removePlacement(placement: string): Promise<PlacementsState> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  const configRef = adminDb.collection("platformConfig").doc("config");
  const snap = await configRef.get();
  const current: string[] = Array.isArray(snap.data()?.placements) ? snap.data()!.placements : DEFAULT_PLACEMENTS;
  const next = current.filter((p) => p !== placement);
  if (next.length === 0) {
    return { error: "Au moins un emplacement doit rester disponible." };
  }

  await configRef.set(
    {
      placements: next,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: session.uid,
    },
    { merge: true }
  );

  revalidatePath("/admin/parametres-globaux");
  return { success: true };
}
