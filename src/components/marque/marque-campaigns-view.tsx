"use client";

import { useState } from "react";
import { AdminCard as Card } from "@/components/admin/admin-card";
import { Badge } from "@/components/ui/badge";
import { CampaignDetailPanel } from "@/components/marque/campaign-detail-panel";
import { CAMPAIGN_STATUS_LABELS, campaignStatusKey } from "@/lib/utils/campaign-status";

interface CampaignRow {
  id: string;
  status: string | null;
  eventName: string;
  createdAt: Date | null;
}

export function MarqueCampaignsView({ rows }: { rows: CampaignRow[] }) {
  const [openCampaignId, setOpenCampaignId] = useState<string | null>(null);

  return (
    <>
      <div className="mt-6 flex flex-col gap-3">
        {rows.map((row) => {
          const statusKey = campaignStatusKey(row.status);
          return (
            <button
              key={row.id}
              type="button"
              onClick={() => setOpenCampaignId(row.id)}
              className="w-full text-left"
            >
              <Card className="flex items-center justify-between transition-colors hover:border-admin-accent/70">
                <div>
                  <p className="text-body-lg font-medium text-ink">{row.eventName}</p>
                  <p className="text-body text-mid-gray">
                    {row.createdAt ? row.createdAt.toLocaleDateString("fr-FR") : "—"}
                  </p>
                </div>
                <Badge variant="soft">{CAMPAIGN_STATUS_LABELS[statusKey]}</Badge>
              </Card>
            </button>
          );
        })}
        {rows.length === 0 ? (
          <p className="text-body text-mid-gray">Aucune campagne pour le moment.</p>
        ) : null}
      </div>

      <CampaignDetailPanel campaignId={openCampaignId} onClose={() => setOpenCampaignId(null)} />
    </>
  );
}
