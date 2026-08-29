import { notFound, redirect } from "next/navigation";
import { FolderDetailView } from "@/components/folders/FolderDetailView";
import { auth } from "@/lib/auth";
import { getFolderById, getPublicFolderById } from "@/services/folder.service";

export const dynamic = "force-dynamic";

interface FolderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: FolderDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  const folder = session?.user?.id
    ? await getFolderById(id, session.user.id)
    : await getPublicFolderById(id);

  if (!folder) {
    return { title: "Folder not found · MoonVerse" };
  }

  return {
    title: `${folder.name} · MoonVerse`,
    description: folder.description ?? `Saved reviews in ${folder.name}`,
  };
}

export default async function FolderDetailPage({ params }: FolderDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  const folder = session?.user?.id
    ? await getFolderById(id, session.user.id)
    : await getPublicFolderById(id);

  if (!folder) {
    if (!session?.user?.id) {
      redirect(`/login?callbackUrl=${encodeURIComponent(`/folders/${id}`)}`);
    }
    notFound();
  }

  const backHref = session?.user?.id ? "/folders" : "/lists";

  return <FolderDetailView folder={folder} backHref={backHref} />;
}
