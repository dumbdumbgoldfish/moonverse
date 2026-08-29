import Link from "next/link";
import { CoverImage } from "@/components/ui/CoverImage";
import { cn } from "@/lib/utils";
import type { BrowseHubShelf } from "@/services/browse-hub.service";

interface BrowseFeaturedStacksProps {
  shelves: BrowseHubShelf[];
  className?: string;
}

export function BrowseFeaturedStacks({
  shelves,
  className,
}: BrowseFeaturedStacksProps) {
  if (shelves.length === 0) return null;

  return (
    <section
      className={cn(className)}
      aria-labelledby="browse-featured-heading"
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b4bb5]">
          Featured stacks
        </p>
        <h2
          id="browse-featured-heading"
          className="mt-1 font-heading text-xl font-semibold text-[#1a1033]"
        >
          Open a shelf
        </h2>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shelves.map((shelf) => {
          const officialPct =
            shelf.novelCount > 0
              ? Math.round((shelf.officialCount / shelf.novelCount) * 100)
              : 0;
          return (
            <li key={shelf.slug}>
              <Link
                href={shelf.href}
                className={cn(
                  "group flex h-full flex-col overflow-hidden rounded-2xl border border-[#1a1033]/10 bg-white",
                  "transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-[#6b4bb5]/35",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b4bb5]",
                  "motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                )}
              >
                <div className="grid grid-cols-4 gap-1 bg-[#f6f0fa] p-2">
                  {(shelf.covers.length > 0
                    ? shelf.covers
                    : [null, null, null, null]
                  )
                    .slice(0, 4)
                    .map((cover, index) => (
                      <div
                        key={cover?.novelId ?? `empty-${index}`}
                        className="relative aspect-[2/3] overflow-hidden rounded-lg bg-[#e8dff2]"
                      >
                        {cover ? (
                          <CoverImage
                            src={cover.coverUrl}
                            alt=""
                            title={cover.title}
                            author={cover.author}
                            themeSeed={cover.novelId}
                            sizes="96px"
                            compactFallback
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                          />
                        ) : null}
                      </div>
                    ))}
                </div>
                <div className="flex flex-1 flex-col gap-1 px-4 py-3">
                  <span className="font-heading text-lg font-semibold text-[#1a1033]">
                    {shelf.name}
                  </span>
                  <span className="text-xs font-medium text-[#7a7284]">
                    {shelf.novelCount.toLocaleString()} titles
                    {shelf.novelCount > 0
                      ? ` · ${officialPct}% official link`
                      : null}
                  </span>
                  <span className="mt-auto pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b4bb5]">
                    Community strength →
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
