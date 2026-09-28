"use client";

import { useState } from "react";
import { AdminCard } from "@/components/admin/admin-card";
import { CampaignDetailPanel } from "@/components/admin/campaign-detail-panel";
import { EventDetailPanel } from "@/components/admin/event-detail-panel";
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_DOT_CLASS, campaignStatusKey } from "@/lib/utils/campaign-status";
import { cn } from "@/lib/cn";
import type { RecentCampaignRow, UpcomingEventRow } from "@/lib/server/admin-dashboard";

interface AdminDashboardListsProps {
  recentCampaigns: RecentCampaignRow[];
  upcomingEvents: UpcomingEventRow[];
}

export function AdminDashboardLists({ recentCampaigns, upcomingEvents }: AdminDashboardListsProps) {
  const [openCampaignId, setOpenCampaignId] = useState<string | null>(null);
  const [openEventId, setOpenEventId] = useState<string | null>(null);

  return (
    <div className="mt-10 flex flex-col gap-8">
      <div>
        <h2 className="text-body-lg font-semibold text-ink">Dernières campagnes</h2>
        <div className="mt-4 flex flex-col gap-2">
          {recentCampaigns.map((campaign) => {
            const statusKey = campaignStatusKey(campaign.status);
            return (
              <button
                key={campaign.id}
                type="button"
                onClick={() => setOpenCampaignId(campaign.id)}
                className="text-left"
              >
                <AdminCard className="flex items-center justify-between gap-3 transition-colors hover:border-admin-accent/70">
                  <div className="min-w-0">
                    <p className="truncate text-body font-medium text-ink">{campaign.brandName}</p>
                    <p className="truncate text-caption text-mid-gray">{campaign.eventName}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-caption text-mid-gray">
                    <span className={cn("h-1.5 w-1.5 rounded-full", CAMPAIGN_STATUS_DOT_CLASS[statusKey])} />
                    {CAMPAIGN_STATUS_LABELS[statusKey]}
                  </span>
                </AdminCard>
              </button>
            );
          })}
          {recentCampaigns.length === 0 ? (
            <p className="text-body text-mid-gray">Aucune campagne pour le moment.</p>
          ) : null}
        </div>
      </div>

      <div>
        <h2 className="text-body-lg font-semibold text-ink">Événements à venir</h2>
        <div className="mt-4 flex flex-col gap-2">
          {upcomingEvents.map((event) => (
            <button key={event.id} type="button" onClick={() => setOpenEventId(event.id)} className="text-left">
              <AdminCard className="flex items-center justify-between gap-3 transition-colors hover:border-admin-accent/70">
                <p className="truncate text-body font-medium text-ink">{event.name}</p>
                <span className="shrink-0 text-caption text-mid-gray">
                  {event.city} · {new Date(event.date).toLocaleDateString("fr-FR")}
                </span>
              </AdminCard>
            </button>
          ))}
          {upcomingEvents.length === 0 ? (
            <p className="text-body text-mid-gray">Aucun événement à venir.</p>
          ) : null}
        </div>
      </div>

      <CampaignDetailPanel campaignId={openCampaignId} onClose={() => setOpenCampaignId(null)} />
      <EventDetailPanel eventId={openEventId} onClose={() => setOpenEventId(null)} />
    </div>
  );
}
