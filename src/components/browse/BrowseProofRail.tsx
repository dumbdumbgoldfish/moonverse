import Link from "next/link";
import { CoverImage } from "@/components/ui/CoverImage";
import { cn } from "@/lib/utils";
import type { BrowseWorkItem } from "@/types/browse";

interface BrowseProofRailProps {
  works: BrowseWorkItem[];
  className?: string;
}

/** Horizontal evidence strip of community-strength covers. */
export function BrowseProofRail({ works, className }: BrowseProofRailProps) {
  if (works.length === 0) return null;

  return (
    <section
      className={cn("mt-8", className)}
      aria-labelledby="browse-proof-heading"
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b4bb5]">
          Catalogue evidence
        </p>
        <h2
          id="browse-proof-heading"
          className="mt-1 font-heading text-lg font-semibold text-[#1a1033]"
        >
          Strong across the stacks
        </h2>
      </div>
      <ul className="mt-4 flex gap-3.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {works.map((work, index) => (
          <li key={work.novelId} className="shrink-0">
            <Link
              href={work.href}
              className={cn(
                "group relative block w-[6rem] overflow-hidden rounded-xl bg-[#efe8f5] ring-1 ring-[#1a1033]/8",
                "transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b4bb5]",
                "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
              )}
              aria-label={`${work.title} by ${work.author}`}
            >
              <span className="relative block aspect-[2/3] w-full">
                <CoverImage
                  src={work.coverUrl}
                  alt=""
                  title={work.title}
                  author={work.author}
                  themeSeed={work.novelId}
                  sizes="96px"
                  priority={index < 4}
                  compactFallback
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
