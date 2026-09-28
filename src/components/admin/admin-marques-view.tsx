"use client";

import { useState } from "react";
import { AdminCard } from "@/components/admin/admin-card";
import { BrandDetailPanel } from "@/components/admin/brand-detail-panel";

interface BrandRow {
  id: string;
  companyName: string;
  siret: string;
  contactEmail: string;
  collaboratorCount: number;
  campaignCount: number;
}

export function AdminMarquesView({ brands }: { brands: BrandRow[] }) {
  const [openBrandId, setOpenBrandId] = useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col gap-3">
        {brands.map((brand) => (
          <button key={brand.id} type="button" onClick={() => setOpenBrandId(brand.id)} className="text-left">
            <AdminCard className="flex items-center justify-between transition-colors hover:border-admin-accent/70">
              <div>
                <p className="text-body-lg font-medium text-ink">{brand.companyName}</p>
                <p className="text-body text-mid-gray">
                  SIRET {brand.siret} · {brand.contactEmail}
                </p>
              </div>
              <div className="flex items-center gap-4 text-body text-mid-gray">
                <span>{brand.collaboratorCount} collaborateur(s)</span>
                <span>{brand.campaignCount} campagne(s)</span>
              </div>
            </AdminCard>
          </button>
        ))}
        {brands.length === 0 ? <p className="text-body text-mid-gray">Aucune marque.</p> : null}
      </div>

      <BrandDetailPanel brandId={openBrandId} onClose={() => setOpenBrandId(null)} />
    </>
  );
}
