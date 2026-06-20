import { Suspense } from "react";
import { AdminNovelsManager } from "@/components/admin/AdminNovelsManager";
import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { getAdminGenres, getAdminNovels, getAdminTags } from "@/services/admin/catalog.service";

export const metadata = { title: "Admin Novels — MoonVerse" };

interface AdminNovelsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminNovelsPage({ searchParams }: AdminNovelsPageProps) {
  const { q } = await searchParams;

  const [novels, genres, tags] = await Promise.all([
    getAdminNovels(q),
    getAdminGenres(),
    getAdminTags(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Novels"
        description="Manage the novel catalog, genres, and tags."
      />
      <Suspense fallback={null}>
        <div className="mb-6">
          <AdminSearchBar placeholder="Search title or author" />
        </div>
      </Suspense>
      <AdminNovelsManager
        novels={novels}
        genres={genres.map((g) => ({ id: g.id, name: g.name }))}
        tags={tags.map((t) => ({ id: t.id, name: t.name }))}
      />
    </>
  );
}
