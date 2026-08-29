import Link from "next/link";
import { Lock } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import type { ReadingListPreview } from "@/types/discovery";

interface LibraryListCardProps {
  list: ReadingListPreview;
}

export function LibraryListCard({ list }: LibraryListCardProps) {
  const covers = list.coverUrls.slice(0, 4);
  const [primary, ...secondary] = covers;

  return (
    <Link
      href={`/folders/${list.id}`}
      className="group block overflow-hidden rounded-[1.25rem] border border-[#1A1224]/8 bg-white transition hover:border-[#6E46C7]/25 hover:shadow-[0_16px_40px_-24px_rgba(110,70,199,0.4)]"
    >
      <div className="flex h-[132px] gap-1.5 bg-[#FBF7F1]/80 p-2">
        {primary ? (
          <>
            <div className="relative h-full w-[84px] shrink-0 overflow-hidden rounded-lg ring-1 ring-[#1A1224]/10">
              <CoverImage
                src={primary}
                alt=""
                title={list.name}
                sizes="84px"
                className="object-cover transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
              />
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-2 grid-rows-2 gap-1.5">
              {secondary.length > 0
                ? secondary.map((url, index) => (
                    <div
                      key={`${list.id}-cover-${index}`}
                      className="relative overflow-hidden rounded-md ring-1 ring-[#1A1224]/10"
                    >
                      <CoverImage
                        src={url}
                        alt=""
                        title={list.name}
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  ))
                : null}
              {secondary.length < 3 ? (
                <div className="flex items-center justify-center rounded-md bg-[#1A1224]/5 text-[11px] font-medium text-[#1A1224]/45">
                  {list.reviewCount > 1
                    ? `+${Math.max(0, list.reviewCount - covers.length)} more`
                    : "1 story"}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[13px] text-[#1A1224]/45">
            Empty list
          </div>
        )}
      </div>

      <div className="border-t border-[#1A1224]/6 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 font-serif text-[15px] font-medium leading-snug text-[#1A1224] group-hover:text-[#6E46C7]">
            {list.name}
          </p>
          {!list.isPublic ? (
            <Lock
              className="mt-0.5 size-3.5 shrink-0 text-[#1A1224]/40"
              aria-label="Private list"
            />
          ) : null}
        </div>
        <p className="mt-1 text-[12px] text-[#1A1224]/50">
          {list.reviewCount} {list.reviewCount === 1 ? "story" : "stories"}
        </p>
      </div>
    </Link>
  );
}
