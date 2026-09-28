"use client";

import { useActionState } from "react";
import { Bell, X } from "lucide-react";
import { markNotificationRead, type MarkNotificationReadState } from "@/app/admin/notifications-actions";
import { AdminCard } from "@/components/admin/admin-card";
import type { AdminNotificationRow } from "@/lib/server/admin-notifications";

const initialState: MarkNotificationReadState = {};

function NotificationRow({ notification }: { notification: AdminNotificationRow }) {
  const boundAction = markNotificationRead.bind(null, notification.id);
  const [, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <AdminCard className="flex items-start justify-between gap-3 border-l-4 border-l-ember bg-ember/5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ember/10 text-ember">
          <Bell size={15} />
        </span>
        <div>
          <p className="text-body text-ink">{notification.message}</p>
          {notification.createdAt ? (
            <p className="mt-0.5 text-caption text-mid-gray">
              {new Date(notification.createdAt).toLocaleString("fr-FR")}
            </p>
          ) : null}
        </div>
      </div>
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          aria-label="Marquer comme lu"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-mid-gray hover:bg-ink/5 hover:text-ink disabled:opacity-50"
        >
          <X size={16} />
        </button>
      </form>
    </AdminCard>
  );
}

export function AdminNotificationsList({ notifications }: { notifications: AdminNotificationRow[] }) {
  if (notifications.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-body-lg font-semibold text-ink">Alertes</h2>
      {notifications.map((n) => (
        <NotificationRow key={n.id} notification={n} />
      ))}
    </div>
  );
}
