import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { FolderDetailView } from "@/components/folders/FolderDetailView";
import { getFolderById } from "@/services/folder.service";

export const dynamic = "force-dynamic";

interface FolderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: FolderDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  const folder = session?.user?.id
    ? await getFolderById(id, session.user.id)
    : null;

  if (!folder) {
    return { title: "Folder not found — MoonVerse" };
  }

  return {
    title: `${folder.name} — MoonVerse`,
    description: folder.description ?? `Saved reviews in ${folder.name}`,
  };
}

export default async function FolderDetailPage({ params }: FolderDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const folder = await getFolderById(id, session.user.id);

  if (!folder) {
    notFound();
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href="/folders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Back to folders
        </Link>
      </div>
      <FolderDetailView folder={folder} />
    </>
  );
}
