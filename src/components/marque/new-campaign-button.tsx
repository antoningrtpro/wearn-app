"use client";

import { useState } from "react";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Modal } from "@/components/admin/modal";
import { BrandCampaignForm } from "@/components/marque/brand-campaign-form";
import type { PublicEventWithRaces } from "@/lib/types/public";

interface NewCampaignButtonProps {
  events: PublicEventWithRaces[];
  placements: string[];
}

export function NewCampaignButton({ events, placements }: NewCampaignButtonProps) {
  const [open, setOpen] = useState(false);
  const [instanceKey, setInstanceKey] = useState(0);

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setInstanceKey((k) => k + 1);
          setOpen(true);
        }}
      >
        Nouvelle campagne
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle campagne" className="max-w-2xl">
        <BrandCampaignForm
          key={instanceKey}
          events={events}
          placements={placements}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
