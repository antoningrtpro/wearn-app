import { adminDb } from "@/lib/firebase/admin";
import { CreateBrandForm } from "@/components/admin/create-brand-form";
import { AdminMarquesView } from "@/components/admin/admin-marques-view";
import { DebouncedSearchInput } from "@/components/admin/debounced-search-input";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminBrandsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";

  const [brandsSnap, collaboratorsSnap, campaignsSnap] = await Promise.all([
    adminDb.collection("brands").orderBy("companyName", "asc").get(),
    adminDb.collection("collaborators").get(),
    adminDb.collection("campaigns").get(),
  ]);

  const collaboratorCountByBrand = new Map<string, number>();
  for (const doc of collaboratorsSnap.docs) {
    const brandId = doc.data().brandId as string;
    collaboratorCountByBrand.set(brandId, (collaboratorCountByBrand.get(brandId) ?? 0) + 1);
  }
  const campaignCountByBrand = new Map<string, number>();
  for (const doc of campaignsSnap.docs) {
    const brandId = doc.data().brandId as string | null;
    if (!brandId) continue;
    campaignCountByBrand.set(brandId, (campaignCountByBrand.get(brandId) ?? 0) + 1);
  }

  const brands = brandsSnap.docs
    .filter((doc) => {
      if (!query) return true;
      const b = doc.data();
      return (
        (b.companyName as string)?.toLowerCase().includes(query) ||
        (b.siret as string)?.toLowerCase().includes(query) ||
        (b.contactEmail as string)?.toLowerCase().includes(query)
      );
    })
    .map((doc) => {
      const b = doc.data();
      return {
        id: doc.id,
        companyName: b.companyName as string,
        siret: b.siret as string,
        contactEmail: b.contactEmail as string,
        collaboratorCount: collaboratorCountByBrand.get(doc.id) ?? 0,
        campaignCount: campaignCountByBrand.get(doc.id) ?? 0,
      };
    });

  return (
    <main className="mx-auto max-w-(--page-max-width) px-8 py-8">
      <div>
        <h1 className="text-heading-lg font-bold tracking-heading-lg text-ink">Marques</h1>
        <p className="mt-1 text-body text-mid-gray">{brandsSnap.size} marque(s) au total.</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <form method="get" className="max-w-sm flex-1">
          <DebouncedSearchInput name="q" defaultValue={q ?? ""} placeholder="Rechercher une marque..." />
        </form>
        <CreateBrandForm />
      </div>

      <div className="mt-6">
        <AdminMarquesView brands={brands} />
      </div>
    </main>
  );
}
