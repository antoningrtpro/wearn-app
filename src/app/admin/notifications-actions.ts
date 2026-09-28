"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { getSession } from "@/lib/firebase/session";

export interface MarkNotificationReadState {
  error?: string;
  success?: boolean;
}

export async function markNotificationRead(
  notificationId: string,
  _prevState: MarkNotificationReadState,
  _formData: FormData
): Promise<MarkNotificationReadState> {
  void _formData;
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Non autorisé." };
  }

  await adminDb.collection("adminNotifications").doc(notificationId).update({ read: true });

  revalidatePath("/admin");
  return { success: true };
}
