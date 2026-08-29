import { Suspense } from "react";
import { AdminNovelsManager } from "@/components/admin/AdminNovelsManager";
import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import { AdminPageHeader, AdminPagination } from "@/components/admin/AdminUi";
import { getAdminGenres, getAdminNovels, getAdminTags } from "@/services/admin/catalog.service";

export const metadata = { title: "Admin Novels · MoonVerse" };

interface AdminNovelsPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminNovelsPage({ searchParams }: AdminNovelsPageProps) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [novels, genres, tags] = await Promise.all([
    getAdminNovels(q, page),
    getAdminGenres(),
    getAdminTags(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Novels"
        description={`Manage the novel catalogue, genres and tags. ${novels.total.toLocaleString()} titles in database.`}
      />
      <Suspense fallback={null}>
        <div className="mb-6">
          <AdminSearchBar placeholder="Search title or author" />
        </div>
      </Suspense>
      <AdminNovelsManager
        novels={novels.items}
        genres={genres.map((g) => ({ id: g.id, name: g.name }))}
        tags={tags.map((t) => ({ id: t.id, name: t.name }))}
      />
      <AdminPagination
        page={novels.page}
        totalPages={novels.totalPages}
        total={novels.total}
        basePath="/admin/novels"
        params={{ q }}
      />
    </>
  );
}
