"use client";

import { useEffect, useState } from "react";
import { SidePanel } from "@/components/admin/side-panel";
import { AdminCard } from "@/components/admin/admin-card";
import { EditBrandForm } from "@/components/admin/edit-brand-form";
import { AddCollaboratorForm } from "@/components/admin/add-collaborator-form";
import { EditCollaboratorForm } from "@/components/admin/edit-collaborator-form";
import { AdminCampaignForm } from "@/components/admin/admin-campaign-form";
import { CampaignDetailPanel } from "@/components/admin/campaign-detail-panel";
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_DOT_CLASS } from "@/lib/utils/campaign-status";
import { cn } from "@/lib/cn";
import type { PublicEventWithRaces } from "@/lib/types/public";

interface BrandDetailData {
  brand: { id: string; companyName: string; siret: string; contactEmail: string; contactPhone: string };
  collaborators: { id: string; firstName: string; lastName: string; email: string; phone: string }[];
  campaigns: { id: string; statusKey: string; eventName: string; createdAt: string | null }[];
  events: PublicEventWithRaces[];
  placements: string[];
}

interface BrandDetailPanelProps {
  brandId: string | null;
  onClose: () => void;
}

export function BrandDetailPanel({ brandId, onClose }: BrandDetailPanelProps) {
  const [data, setData] = useState<BrandDetailData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [openCampaignId, setOpenCampaignId] = useState<string | null>(null);
  const loading = brandId !== null && data?.brand.id !== brandId;

  useEffect(() => {
    if (!brandId) return;
    fetch(`/api/admin/marques/${brandId}`)
      .then((res) => res.json())
      .then((json) => setData(json));
  }, [brandId, refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <SidePanel
      open={brandId !== null}
      onClose={onClose}
      title={data?.brand.companyName ?? "Marque"}
      subtitle={data ? `SIRET ${data.brand.siret}` : undefined}
      headerActions={
        data ? (
          <EditBrandForm
            brandId={data.brand.id}
            companyName={data.brand.companyName}
            siret={data.brand.siret}
            onSuccess={refresh}
          />
        ) : null
      }
    >
      {loading || !data ? (
        <p className="text-body text-mid-gray">Chargement…</p>
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-body-lg font-semibold text-ink">
                Collaborateurs ({data.collaborators.length})
              </h3>
              <AddCollaboratorForm brandId={data.brand.id} onSuccess={refresh} />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {data.collaborators.map((c) => (
                <AdminCard key={c.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-body font-medium text-ink">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="truncate text-caption text-mid-gray">
                      {c.email} · {c.phone}
                    </p>
                  </div>
                  <EditCollaboratorForm
                    collaboratorId={c.id}
                    firstName={c.firstName}
                    lastName={c.lastName}
                    email={c.email}
                    phone={c.phone}
                    onSuccess={refresh}
                  />
                </AdminCard>
              ))}
              {data.collaborators.length === 0 ? (
                <p className="text-body text-mid-gray">Aucun collaborateur.</p>
              ) : null}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-body-lg font-semibold text-ink">
                Campagnes ({data.campaigns.length})
              </h3>
              <AdminCampaignForm
                brands={[{ id: data.brand.id, companyName: data.brand.companyName }]}
                events={data.events}
                placements={data.placements}
              />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {data.campaigns.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setOpenCampaignId(c.id)}
                  className="text-left"
                >
                  <AdminCard className="flex items-center justify-between transition-colors hover:border-admin-accent/70">
                    <span className="flex items-center gap-2 text-body text-ink">
                      <span className={cn("h-2 w-2 rounded-full", CAMPAIGN_STATUS_DOT_CLASS[c.statusKey])} />
                      {c.eventName}
                    </span>
                    <span className="text-caption text-mid-gray">
                      {CAMPAIGN_STATUS_LABELS[c.statusKey]}
                    </span>
                  </AdminCard>
                </button>
              ))}
              {data.campaigns.length === 0 ? (
                <p className="text-body text-mid-gray">Aucune campagne.</p>
              ) : null}
            </div>
          </div>
        </div>
      )}
      <CampaignDetailPanel campaignId={openCampaignId} onClose={() => setOpenCampaignId(null)} />
    </SidePanel>
  );
}
