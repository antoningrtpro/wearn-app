import { getPlatformConfig } from "@/lib/server/platform-config";
import { AdminCard } from "@/components/admin/admin-card";
import { PlatformConfigForm } from "@/components/admin/platform-config-form";
import { PlacementsManager } from "@/components/admin/placements-manager";

export default async function AdminGlobalSettingsPage() {
  const config = await getPlatformConfig();

  return (
    <main className="mx-auto max-w-(--page-max-width) px-8 py-8">
      <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">
        Paramètres globaux
      </h1>
      <p className="mt-1 text-body text-mid-gray">
        Configuration de la plateforme, visible uniquement dans cet espace admin.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <PlatformConfigForm currentRate={config.defaultCommissionRate} />

        <AdminCard>
          <h2 className="text-body-lg font-semibold text-ink">Emplacements</h2>
          <p className="mt-1 text-body text-mid-gray">
            Les emplacements disponibles pour les coureurs et les ciblages de campagne.
          </p>
          <div className="mt-4">
            <PlacementsManager placements={config.placements} />
          </div>
        </AdminCard>
      </div>
    </main>
  );
}
