import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CoverImage } from "@/components/ui/CoverImage";
import { Lock } from "lucide-react";
import { getInitials } from "@/lib/review-utils";
import type { ReadingListPreview } from "@/types/discovery";

interface ReadingListCardProps {
  list: ReadingListPreview;
}

export function ReadingListCard({ list }: ReadingListCardProps) {
  const covers = list.coverUrls.slice(0, 3);
  const [primary, ...secondary] = covers;

  return (
    <Link
      href={`/folders/${list.id}`}
      className="block shrink-0 snap-start w-[220px]"
    >
      <div className="flex h-[120px] gap-1 overflow-hidden rounded-xl bg-muted/40">
        {primary ? (
          <>
            <div className="relative h-full w-[72px] shrink-0 overflow-hidden rounded-l-xl">
              <CoverImage
                src={primary}
                alt=""
                title={list.name}
                sizes="72px"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1 py-1 pr-1">
              {secondary.length > 0 ? (
                secondary.map((url, i) => (
                  <div
                    key={`${list.id}-cover-${i}`}
                    className="relative min-h-0 flex-1 overflow-hidden rounded-md"
                  >
                    <CoverImage
                      src={url}
                      alt=""
                      title={list.name}
                      sizes="80px"
                    />
                  </div>
                ))
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-md bg-muted text-[10px] text-muted-foreground">
                  +{Math.max(0, list.reviewCount - 1)} more
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Empty list
          </div>
        )}
      </div>

      <p className="mt-2 line-clamp-2 text-sm font-bold leading-snug">{list.name}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <Avatar size="sm">
          <AvatarFallback className="bg-muted text-[9px]">
            {getInitials(list.ownerUsername)}
          </AvatarFallback>
        </Avatar>
        <span className="line-clamp-1 text-xs text-muted-foreground">
          @{list.ownerUsername}
        </span>
        {!list.isPublic && (
          <Lock className="size-3 shrink-0 text-muted-foreground" aria-label="Private list" />
        )}
      </div>
    </Link>
  );
}
