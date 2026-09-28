"use client";

import { useActionState, useEffect } from "react";
import { FileText } from "lucide-react";
import {
  saveQuote,
  setQuoteSent,
  setQuoteValidated,
  type QuoteState,
} from "@/app/admin/campagnes/[id]/actions";
import { AdminButton as Button } from "@/components/admin/admin-button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/brand-form/form-field";

interface QuoteFormProps {
  campaignId: string;
  pdfQuoteUrl: string | null;
  quoteAmount: number | null;
  quoteSent: boolean;
  quoteValidated: boolean;
  onSaved?: () => void;
}

const initialState: QuoteState = {};

function StatusToggle({
  campaignId,
  active,
  activeLabel,
  inactiveLabel,
  setStatus,
  onSaved,
}: {
  campaignId: string;
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  setStatus: (campaignId: string, next: boolean, prevState: QuoteState, formData: FormData) => Promise<QuoteState>;
  onSaved?: () => void;
}) {
  const boundAction = setStatus.bind(null, campaignId, !active);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) onSaved?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction}>
      <Button type="submit" variant={active ? "filled" : "outline"} disabled={pending}>
        {pending ? "..." : active ? activeLabel : inactiveLabel}
      </Button>
    </form>
  );
}

export function QuoteForm({
  campaignId,
  pdfQuoteUrl,
  quoteAmount,
  quoteSent,
  quoteValidated,
  onSaved,
}: QuoteFormProps) {
  const boundSave = saveQuote.bind(null, campaignId);
  const [state, formAction, pending] = useActionState(boundSave, initialState);

  useEffect(() => {
    if (state.success) onSaved?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4 rounded-nested bg-admin-canvas p-4 [&_input]:bg-paper">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Devis (PDF)">
            <Input name="pdfFile" type="file" accept="application/pdf" />
          </FormField>
          <FormField label="Montant (€)">
            <Input name="quoteAmount" type="number" step="0.01" min={0} defaultValue={quoteAmount ?? ""} />
          </FormField>
        </div>
        {pdfQuoteUrl ? (
          <a
            href={pdfQuoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 self-start text-body text-admin-accent hover:underline"
          >
            <FileText size={15} />
            Voir le PDF actuel
          </a>
        ) : null}
        {state.error ? <p className="text-body text-ember">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "..." : "Enregistrer le devis"}
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-caption tracking-caption uppercase text-mid-gray">Statut</span>
        <StatusToggle
          campaignId={campaignId}
          active={quoteSent}
          activeLabel="Envoyé ✓"
          inactiveLabel="Marquer comme envoyé"
          setStatus={setQuoteSent}
          onSaved={onSaved}
        />
        <StatusToggle
          campaignId={campaignId}
          active={quoteValidated}
          activeLabel="Signé ✓"
          inactiveLabel="Marquer comme signé"
          setStatus={setQuoteValidated}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}
