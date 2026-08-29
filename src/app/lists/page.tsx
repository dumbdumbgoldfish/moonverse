import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getFeaturedFolders } from "@/services/folder.service";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Featured Reading Lists · MoonVerse",
  description: "Discover public reading lists curated by the MoonVerse community.",
};

export const dynamic = "force-dynamic";

export default async function FeaturedListsPage() {
  const folders = await getFeaturedFolders();

  return (
    <div className={cn(SITE_SHELL_CLASS, "py-10")}>
      <PageHeader
        title="Featured reading lists"
        description="Public lists highlighted by MoonVerse readers and moderators."
      />

      {folders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-white px-6 py-16 text-center">
          <Sparkles className="mx-auto size-8 text-primary" aria-hidden />
          <p className="mt-3 text-sm text-muted-foreground">
            No featured lists yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <Link
              key={folder.id}
              href={`/folders/${folder.id}`}
              className="group rounded-2xl border border-border/60 bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
                <Sparkles className="size-3.5" aria-hidden />
                Featured
              </div>
              <h2 className="mt-2 text-lg font-bold text-foreground group-hover:text-primary">
                {folder.name}
              </h2>
              {folder.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {folder.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <BookOpen className="size-3.5" aria-hidden />
                {folder.reviewCount} stories · by @{folder.ownerUsername}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
