import Link from "next/link";
import { FolderOpen, TrendingUp, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoonieHomePrompt } from "@/components/moonie/MoonieHomePrompt";
import type { FeaturedReviewer } from "@/services/community.service";
import type { FolderListItem } from "@/types/folder";

interface FeedSidebarProps {
  folders?: FolderListItem[];
  featuredReviewers?: FeaturedReviewer[];
  isLoggedIn?: boolean;
}

export function FeedSidebar({
  folders = [],
  featuredReviewers = [],
  isLoggedIn = false,
}: FeedSidebarProps) {
  return (
    <>
      <MoonieHomePrompt variant="sidebar" />

      <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-primary">
          <Users className="size-4" aria-hidden="true" />
          <h2 className="text-sm font-semibold">Trending reviewers</h2>
        </div>
        <ul className="mt-3 space-y-3">
          {featuredReviewers.map((reviewer) => (
            <li key={reviewer.username}>
              <Link
                href={`/users/${reviewer.username}`}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
                    {reviewer.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{reviewer.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {reviewer.reviewCount} reviews
                  </p>
                </div>
                <TrendingUp className="size-4 shrink-0 text-accent" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {isLoggedIn && folders.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <FolderOpen className="size-4" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Your folders</h2>
          </div>
          <ul className="mt-3 space-y-2">
            {folders.slice(0, 4).map((folder) => (
              <li key={folder.id}>
                <Link
                  href={`/folders/${folder.id}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-medium">{folder.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {folder.reviewCount}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/folders"
            className="mt-3 block text-center text-xs font-medium text-primary hover:underline"
          >
            View all folders
          </Link>
        </div>
      )}

      {!isLoggedIn && (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-moon-purple-soft/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>{" "}
            to save reviews to folders.
          </p>
        </div>
      )}
    </>
  );
}
