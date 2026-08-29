import Link from "next/link";
import {
  Bookmark,
  ExternalLink,
  Layers,
  ShieldCheck,
  Star,
} from "lucide-react";
import { NightAtmosphere } from "@/components/landing/LandingDecor";
import { CoverImage } from "@/components/ui/CoverImage";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { cn } from "@/lib/utils";
import type { ReadingListPreview } from "@/types/discovery";

interface LandingShelvesShowcaseProps {
  lists: ReadingListPreview[];
}

const TRUST = [
  {
    icon: Star,
    title: "Reviews before you commit",
    copy: "Skim pacing, tropes and endings before you invest a weekend.",
  },
  {
    icon: ExternalLink,
    title: "Paths to read the story",
    copy: "When available, follow moderated reading sources from the novel page.",
  },
  {
    icon: ShieldCheck,
    title: "Taste you can trust",
    copy: "Recommendations grow from real reader activity, not anonymous noise.",
  },
] as const;

function ShelfCard({ list }: { list: ReadingListPreview }) {
  const covers = list.coverUrls.slice(0, 3);
  const href = list.href ?? `/folders/${list.id}`;

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-xl border border-white/12 bg-white/[0.06] p-3 backdrop-blur-sm",
        "shadow-[0_20px_48px_-28px_rgba(0,0,0,0.8)] transition",
        "hover:border-[#F6C85F]/35 hover:bg-white/[0.1]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C85F]",
        "motion-reduce:transition-none"
      )}
    >
      <div className="relative mx-auto h-24 w-full max-w-[170px]">
        {(covers.length > 0 ? covers : ["", "", ""]).slice(0, 3).map((url, i) => (
          <div
            key={`${list.id}-${i}`}
            className="absolute top-0 aspect-[2/3] w-[58px] overflow-hidden rounded-md border-2 border-white/20 shadow-lg transition duration-300 group-hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none sm:w-[64px]"
            style={{
              left: `calc(50% + ${(i - 1) * 22}px)`,
              transform: `translateX(-50%) rotate(${(i - 1) * 6}deg)`,
              zIndex: i + 1,
            }}
          >
            <CoverImage
              src={url}
              alt=""
              title={list.novelTitles?.[i] ?? list.name}
              themeSeed={`${list.id}-${i}`}
              sizes="84px"
              compactFallback
            />
          </div>
        ))}
      </div>

      <div className="mt-3 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#F6C85F]/85">
          {list.curatorLabel ?? `@${list.ownerUsername}`}
        </p>
        <h3 className="mt-1 line-clamp-2 text-base font-bold text-white group-hover:text-[#F6C85F]">
          {list.name}
        </h3>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-white/55">
          <Layers className="size-3.5" aria-hidden />
          {list.reviewCount} {list.reviewCount === 1 ? "story" : "stories"}
        </p>
      </div>
    </Link>
  );
}

export function LandingShelvesShowcase({ lists }: LandingShelvesShowcaseProps) {
  const shelves = lists.slice(0, 3);

  return (
    <section id="library" className="mv-land text-white">
      <NightAtmosphere intensity="soft" />

      <div className="mv-land-shell">
        <div className="grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#F6C85F]/90">
              <Bookmark className="size-3.5" aria-hidden />
              Your moonlit shelves
            </p>
            <h2 className="mv-land-title text-white">
              Keep the stories you want to return to.
            </h2>
            <p className="mv-land-copy text-white/65">
              Build public or private shelves, follow curators you trust and keep
              your next binge one tap away.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <CatalogLink href="/lists" tone="night" size="compact">
                Browse shelves
              </CatalogLink>
              <CatalogLink href="/register" tone="night" size="compact">
                Start your own
              </CatalogLink>
            </div>
          </div>

          {shelves.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {shelves.map((list) => (
                <ShelfCard key={list.id} list={list} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.04] p-5">
              <p className="font-serif text-base font-bold text-white">
                Public shelves will appear here
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                When readers share a shelf, it shows up on this desk. Start one of
                your own, or browse whatever is already public.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CatalogLink href="/lists" tone="night" size="compact">
                  Browse shelves
                </CatalogLink>
                <CatalogLink href="/register" tone="night" size="compact">
                  Start your own
                </CatalogLink>
              </div>
            </div>
          )}
        </div>

        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {TRUST.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.title}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm"
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#F6C85F]/15 text-[#F6C85F]">
                  <Icon className="size-4" aria-hidden />
                </span>
                <h3 className="mt-2 text-sm font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-white/55">
                  {item.copy}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
