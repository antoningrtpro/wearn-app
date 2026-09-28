import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getAllRunners, filterRunners } from "@/lib/server/runners";
import { getPlatformConfig } from "@/lib/server/platform-config";
import { RunnerFilterForm } from "@/components/admin/runner-filter-form";
import { ShortlistForm } from "@/components/admin/shortlist-form";
import { AdminCard } from "@/components/admin/admin-card";
import { placementLabel } from "@/lib/utils/placement-labels";
import { bracketLabel } from "@/lib/utils/runner-count-brackets";

const GENDER_LABELS: Record<string, string> = {
  tous: "Tous genres",
  homme: "Hommes",
  femme: "Femmes",
  autre: "Autre",
};

interface SearchParams {
  gender?: string;
  ageMin?: string;
  ageMax?: string;
  size?: string;
  placements?: string | string[];
  participatesOnly?: string;
}

interface PageProps {
  params: Promise<{ id: string; segmentId: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function SegmentShortlistPage({ params, searchParams }: PageProps) {
  const { id: campaignId, segmentId } = await params;
  const rawFilters = await searchParams;

  const [campaignSnap, segmentSnap] = await Promise.all([
    adminDb.collection("campaigns").doc(campaignId).get(),
    adminDb.collection("campaigns").doc(campaignId).collection("campaignSegments").doc(segmentId).get(),
  ]);
  if (!segmentSnap.exists) notFound();
  const segment = segmentSnap.data()!;
  const eventId: string | null = campaignSnap.data()?.eventId ?? null;
  const raceId: string | null = campaignSnap.data()?.raceId ?? null;

  const assignmentsSnap = await adminDb
    .collection("assignments")
    .where("campaignSegmentId", "==", segmentId)
    .get();
  const alreadyProposedIds = new Set(assignmentsSnap.docs.map((doc) => doc.data().runnerId as string));

  // First visit (no query string at all): default the filters to the
  // segment's own targeting criteria, since that's almost always what the
  // admin wants to start from. Once they submit the form (even to clear
  // everything), the query string is present and we use exactly that.
  const hasAnyParam = Object.keys(rawFilters).length > 0;
  const selectedPlacements = Array.isArray(rawFilters.placements)
    ? rawFilters.placements
    : rawFilters.placements
      ? [rawFilters.placements]
      : [];

  // Same first-visit-vs-submitted distinction as the other fields: a
  // checkbox that's unchecked simply isn't present in the query string, so
  // we can't tell "never touched" from "explicitly turned off" without this.
  const participatesOnly = hasAnyParam ? rawFilters.participatesOnly === "1" : Boolean(eventId);

  const effectiveFilters = hasAnyParam
    ? { ...rawFilters, placements: selectedPlacements, participatesOnly }
    : {
        gender: segment.targetGender !== "tous" ? segment.targetGender : undefined,
        ageMin: String(segment.targetAgeMin),
        ageMax: String(segment.targetAgeMax),
        placements: [segment.placement],
        participatesOnly,
      };

  const [allRunners, config] = await Promise.all([getAllRunners(), getPlatformConfig()]);
  const filtered = filterRunners(allRunners, { ...effectiveFilters, eventId, raceId });

  return (
    <main className="mx-auto max-w-(--page-max-width) px-8 py-8">
      <Link href="/admin/campagnes" className="text-body text-mid-gray hover:text-ink">
        ← Campagnes
      </Link>

      <h1 className="mt-4 text-heading-lg font-bold tracking-heading-lg text-ink">Shortlisting</h1>

      <AdminCard className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-admin-accent-soft px-2.5 py-1 text-caption font-medium text-admin-accent">
            {placementLabel(segment.placement)}
          </span>
          <span className="text-body text-ink">
            {GENDER_LABELS[segment.targetGender] ?? segment.targetGender}
          </span>
          <span className="text-body text-mid-gray">
            · {segment.targetAgeMin}–{segment.targetAgeMax} ans
          </span>
        </div>
        <p className="text-body text-mid-gray">
          {alreadyProposedIds.size} déjà validé(s) sur l&apos;objectif{" "}
          {bracketLabel(segment.requestedRunnerCountMin, segment.requestedRunnerCountMax)}
        </p>
      </AdminCard>

      <p className="mt-2 text-caption text-mid-gray">
        {filtered.length} coureur(s) correspondent aux filtres actuels
        {eventId ? (participatesOnly ? " (dont participation à l'événement)" : " · participation ignorée") : ""}
      </p>

      <div className="mt-6">
        <RunnerFilterForm
          action={`/admin/campagnes/${campaignId}/segments/${segmentId}`}
          resetHref={`/admin/campagnes/${campaignId}/segments/${segmentId}`}
          defaultValues={effectiveFilters}
          hasEvent={Boolean(eventId)}
          placements={config.placements}
        />
      </div>

      <div className="mt-6">
        <ShortlistForm
          campaignId={campaignId}
          segmentId={segmentId}
          runners={filtered}
          alreadyProposedIds={alreadyProposedIds}
        />
      </div>
    </main>
  );
}
