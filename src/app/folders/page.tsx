import { auth } from "@/lib/auth";
import { getFoldersByUser } from "@/services/folder.service";
import { FoldersList } from "@/components/folders/FoldersList";

export const metadata = {
  title: "My Folders — MoonVerse",
  description: "Organise your favourite web novel reviews into personal collections.",
};

export const dynamic = "force-dynamic";

export default async function FoldersPage() {
  const session = await auth();
  const folders = session?.user?.id
    ? await getFoldersByUser(session.user.id)
    : [];

  return <FoldersList folders={folders} />;
}
