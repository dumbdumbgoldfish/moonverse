import { AdminTagsManager } from "@/components/admin/AdminTagsManager";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/AdminUi";
import { getAdminTags } from "@/services/admin/catalog.service";

export const metadata = { title: "Admin Tags — MoonVerse" };

export default async function AdminTagsPage() {
  const tags = await getAdminTags();

  return (
    <>
      <AdminPageHeader title="Tags" description="Manage tag taxonomy." />
      {tags.length === 0 ? (
        <AdminEmptyState title="No tags yet" description="Create your first tag below." />
      ) : null}
      <AdminTagsManager tags={tags} />
    </>
  );
}
