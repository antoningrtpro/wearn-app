import { getAllRunners, filterRunners } from "@/lib/server/runners";
import { getPlatformConfig } from "@/lib/server/platform-config";
import { CreateRunnerForm } from "@/components/admin/create-runner-form";
import { AdminCoureursView } from "@/components/admin/admin-coureurs-view";

interface SearchParams {
  gender?: string;
  ageMin?: string;
  ageMax?: string;
  size?: string;
  placements?: string | string[];
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function RunnersCataloguePage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const selectedPlacements = Array.isArray(filters.placements)
    ? filters.placements
    : filters.placements
      ? [filters.placements]
      : [];

  const [allRunners, config] = await Promise.all([getAllRunners(), getPlatformConfig()]);
  const filtered = filterRunners(allRunners, { ...filters, placements: selectedPlacements });

  return (
    <main className="mx-auto max-w-(--page-max-width) px-8 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">
            Catalogue coureurs
          </h1>
          <p className="mt-1 text-body text-mid-gray">
            {filtered.length} / {allRunners.length} coureur(s)
          </p>
        </div>
        <CreateRunnerForm placements={config.placements} />
      </div>

      <div className="mt-6">
        <AdminCoureursView
          runners={filtered}
          placements={config.placements}
          filterAction="/admin/coureurs"
          filterResetHref="/admin/coureurs"
          filterDefaultValues={{ ...filters, placements: selectedPlacements, participatesOnly: false }}
        />
      </div>
    </main>
  );
}
