import "server-only";

import { adminDb } from "@/lib/firebase/admin";

export interface AdminNotificationRow {
  id: string;
  message: string;
  eventName: string;
  runnerName: string;
  createdAt: string | null;
}

export async function getUnreadAdminNotifications(): Promise<AdminNotificationRow[]> {
  const snap = await adminDb
    .collection("adminNotifications")
    .where("read", "==", false)
    .orderBy("createdAt", "desc")
    .limit(10)
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      message: d.message as string,
      eventName: d.eventName as string,
      runnerName: d.runnerName as string,
      createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
    };
  });
}
