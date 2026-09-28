"use client";

import { useEffect, useState } from "react";
import { SidePanel } from "@/components/admin/side-panel";
import { EventAssociationForm } from "@/components/admin/event-association-form";
import { CampaignSegmentsTabs } from "@/components/admin/campaign-segments-tabs";
import { MarginOverrideForm } from "@/components/admin/margin-override-form";
import { QuoteForm } from "@/components/admin/quote-form";
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_DOT_CLASS } from "@/lib/utils/campaign-status";
import { cn } from "@/lib/cn";
import type { PublicEvent } from "@/lib/types/public";

interface CampaignDetailData {
  campaign: {
    id: string;
    statusKey: string;
    brandId: string | null;
    brandName: string | null;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    eventName: string | null;
    eventCity: string | null;
    eventDate: string | null;
    eventDistanceKm: number | null;
    raceName: string | null;
    raceDistanceKm: number | null;
    hasEvent: boolean;
    customEventName: string | null;
    needsEventList: boolean;
    pdfQuoteUrl: string | null;
    quoteAmount: number | null;
    quoteSent: boolean;
    quoteValidated: boolean;
    commissionRateOverride: number | null;
  };
  segments: {
    id: string;
    placement: string;
    targetGender: string;
    targetAgeMin: number;
    targetAgeMax: number;
    requestedRunnerCountMin: number;
    requestedRunnerCountMax: number;
    runnerPayoutAmount: number | null;
    validatedCount: number;
  }[];
  allEvents: PublicEvent[];
  platformDefaultRate: number | null;
}

interface CampaignDetailPanelProps {
  campaignId: string | null;
  onClose: () => void;
}

const TABS = ["info", "targeting", "quote", "settings"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  info: "Informations",
  targeting: "Ciblage",
  quote: "Devis",
  settings: "Paramètres",
};

function CampaignDetailBody({ data, onSaved }: { data: CampaignDetailData; onSaved: () => void }) {
  const [tab, setTab] = useState<Tab>("info");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-1 self-start rounded-full border border-hairline bg-paper p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-3 py-1.5 text-body transition-colors",
              tab === t ? "bg-admin-accent text-white" : "text-mid-gray hover:text-ink"
            )}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "info" ? (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="text-body-lg font-semibold text-ink">Entreprise</h3>
            <p className="mt-2 text-body text-ink">{data.campaign.brandName ?? "—"}</p>
            <p className="text-body text-mid-gray">
              {data.campaign.contactName} · {data.campaign.contactEmail} · {data.campaign.contactPhone}
            </p>
          </div>

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
            ) : null}
          </div>

          {data.campaign.needsEventList ? (
            <EventAssociationForm
              campaignId={data.campaign.id}
              customEventName={data.campaign.customEventName ?? ""}
              events={data.allEvents}
            />
          ) : null}
        </div>
      ) : null}

      {tab === "targeting" ? (
        <CampaignSegmentsTabs campaignId={data.campaign.id} segments={data.segments} onSaved={onSaved} />
      ) : null}

      {tab === "quote" ? (
        <QuoteForm
          campaignId={data.campaign.id}
          pdfQuoteUrl={data.campaign.pdfQuoteUrl}
          quoteAmount={data.campaign.quoteAmount}
          quoteSent={data.campaign.quoteSent}
          quoteValidated={data.campaign.quoteValidated}
          onSaved={onSaved}
        />
      ) : null}

      {tab === "settings" ? (
        <div>
          <h3 className="text-body-lg font-semibold text-ink">Commission</h3>
          <div className="mt-3">
            <MarginOverrideForm
              campaignId={data.campaign.id}
              defaultValue={data.campaign.commissionRateOverride}
              platformDefaultRate={data.platformDefaultRate}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CampaignDetailPanel({ campaignId, onClose }: CampaignDetailPanelProps) {
  const [data, setData] = useState<CampaignDetailData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const loading = campaignId !== null && data?.campaign.id !== campaignId;

  useEffect(() => {
    if (!campaignId) return;
    fetch(`/api/admin/campagnes/${campaignId}`)
      .then((res) => res.json())
      .then((json) => setData(json));
  }, [campaignId, refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <SidePanel
      open={campaignId !== null}
      onClose={onClose}
      title={data?.campaign.brandName ?? "Campagne"}
      subtitle={data?.campaign.eventName ?? undefined}
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
        <CampaignDetailBody key={data.campaign.id} data={data} onSaved={refresh} />
      )}
    </SidePanel>
  );
}
