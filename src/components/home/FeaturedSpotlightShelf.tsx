import Link from "next/link";
import { Sparkles } from "lucide-react";
import { CoverCarousel } from "@/components/discovery/CoverCarousel";
import { CoverImage } from "@/components/ui/CoverImage";
import type { FeaturedNovelItem } from "@/services/featured.service";

interface FeaturedSpotlightShelfProps {
  novels: FeaturedNovelItem[];
}

export function FeaturedSpotlightShelf({ novels }: FeaturedSpotlightShelfProps) {
  if (novels.length === 0) return null;

  return (
    <CoverCarousel
      title="MoonVerse spotlight"
      subtitle="Hand-picked by the MoonVerse team"
      icon={Sparkles}
      accentClass="text-primary"
    >
      {novels.map((novel, index) => (
        <Link
          key={novel.id}
          href={`/novels/${novel.novelId}`}
          className="group block w-[148px] shrink-0 snap-start"
        >
          <div className="relative h-[208px] w-[148px] overflow-hidden rounded-xl bg-slate-100 shadow-sm ring-1 ring-black/5 transition duration-200 ease-out group-hover:shadow-md group-hover:ring-black/10">
            <CoverImage
              src={novel.coverUrl}
              alt={`Cover of ${novel.novelTitle}`}
              title={novel.novelTitle}
              sizes="148px"
              priority={index === 0}
              className="transition duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-primary shadow-sm">
              <Sparkles className="size-3" aria-hidden />
              Featured
            </span>
          </div>
          <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-5 text-[#1a1233]">
            {novel.novelTitle}
          </p>
          {novel.novelAuthor && (
            <p className="truncate text-[11px] text-slate-500">by {novel.novelAuthor}</p>
          )}
        </Link>
      ))}
    </CoverCarousel>
  );
}
