"use client";

import { useEffect, useState } from "react";
import { SidePanel } from "@/components/admin/side-panel";
import { CampaignSegmentsView, type SegmentViewData } from "@/components/marque/campaign-segments-view";
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_DOT_CLASS } from "@/lib/utils/campaign-status";
import { cn } from "@/lib/cn";

interface CampaignDetailData {
  campaign: {
    id: string;
    statusKey: string;
    eventName: string | null;
    eventCity: string | null;
    eventDate: string | null;
    eventDistanceKm: number | null;
    raceName: string | null;
    raceDistanceKm: number | null;
    hasEvent: boolean;
    pdfQuoteUrl: string | null;
  };
  segments: SegmentViewData[];
}

interface CampaignDetailPanelProps {
  campaignId: string | null;
  onClose: () => void;
}

export function CampaignDetailPanel({ campaignId, onClose }: CampaignDetailPanelProps) {
  const [data, setData] = useState<CampaignDetailData | null>(null);
  const loading = campaignId !== null && data?.campaign.id !== campaignId;

  useEffect(() => {
    if (!campaignId) return;
    fetch(`/api/marque/campagnes/${campaignId}`)
      .then((res) => res.json())
      .then((json) => setData(json));
  }, [campaignId]);

  return (
    <SidePanel
      open={campaignId !== null}
      onClose={onClose}
      title={data?.campaign.eventName ?? "Campagne"}
      subtitle={data?.campaign.eventCity ?? undefined}
      headerActions={
        data ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-admin-canvas px-2.5 py-1.5 text-caption font-medium text-ink">
            <span className={cn("h-1.5 w-1.5 rounded-full", CAMPAIGN_STATUS_DOT_CLASS[data.campaign.statusKey])} />
            {CAMPAIGN_STATUS_LABELS[data.campaign.statusKey]}
          </span>
        ) : null
      }
    >
      {loading || !data ? (
        <p className="text-body text-mid-gray">Chargement…</p>
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="text-body-lg font-semibold text-ink">Événement</h3>
            <p className="mt-2 text-body text-ink">{data.campaign.eventName ?? "—"}</p>
            {data.campaign.hasEvent ? (
              <>
                <p className="text-body text-mid-gray">
                  {data.campaign.eventCity} · {data.campaign.eventDate}
                  {data.campaign.eventDistanceKm ? ` · ${data.campaign.eventDistanceKm} km` : ""}
                </p>
                <p className="text-body text-mid-gray">
                  Course :{" "}
                  {data.campaign.raceName
                    ? `${data.campaign.raceName} (${data.campaign.raceDistanceKm} km)`
                    : "Peu importe la course"}
                </p>
              </>
            ) : (
              <p className="text-body text-mid-gray">
                Événement hors liste — notre équipe l&apos;associera à un événement existant.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-body-lg font-semibold text-ink">Ciblage</h3>
            <div className="mt-3">
              <CampaignSegmentsView segments={data.segments} />
            </div>
          </div>

          {data.campaign.pdfQuoteUrl ? (
            <div>
              <h3 className="text-body-lg font-semibold text-ink">Devis</h3>
              <a
                href={data.campaign.pdfQuoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-body text-admin-accent underline"
              >
                Voir le PDF
              </a>
            </div>
          ) : null}
        </div>
      )}
    </SidePanel>
  );
}
