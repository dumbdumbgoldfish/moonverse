import { AdminFeaturedTabs } from "@/components/admin/AdminFeaturedTabs";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { getNovelsForSelect } from "@/services/novel.service";
import { getAllFeaturedNovels } from "@/services/featured.service";
import { listPublicFoldersForAdmin } from "@/services/folder.service";

export const metadata = { title: "Featured · MoonVerse Admin" };
export const dynamic = "force-dynamic";

export default async function AdminFeaturedPage() {
  const [featured, novels, folders] = await Promise.all([
    getAllFeaturedNovels(),
    getNovelsForSelect(),
    listPublicFoldersForAdmin(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Featured content"
        description="Curate spotlight novels on Home/Search and featured reading lists on /lists."
      />
      <AdminFeaturedTabs featured={featured} novels={novels} folders={folders} />
    </>
  );
}
