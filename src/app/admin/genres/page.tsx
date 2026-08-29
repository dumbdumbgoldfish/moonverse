import { AdminGenresManager } from "@/components/admin/AdminGenresManager";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/AdminUi";
import { getAdminGenres } from "@/services/admin/catalog.service";

export const metadata = { title: "Admin Genres · MoonVerse" };

export default async function AdminGenresPage() {
  const genres = await getAdminGenres();

  return (
    <>
      <AdminPageHeader title="Genres" description="Manage genre taxonomy." />
      {genres.length === 0 ? (
        <AdminEmptyState title="No genres yet" description="Create your first genre below." />
      ) : null}
      <AdminGenresManager genres={genres} />
    </>
  );
}
