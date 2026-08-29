import Link from "next/link";
import { CoverImage } from "@/components/ui/CoverImage";
import { cn } from "@/lib/utils";
import type { SearchListHit } from "@/types/search";

interface ListResultCardProps {
  list: SearchListHit;
  className?: string;
}

export function ListResultCard({ list, className }: ListResultCardProps) {
  return (
    <Link
      href={`/folders/${list.id}`}
      className={cn(
        "group flex min-w-[260px] max-w-full flex-col gap-3 rounded-2xl border border-primary/10 bg-white p-4 shadow-[0_8px_24px_-12px_rgba(98,70,234,0.22)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_40px_-16px_rgba(98,70,234,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-w-0",
        className,
      )}
    >
      <div className="flex items-end gap-1 pl-1">
        {list.coverUrls.slice(0, 4).map((url, index) => (
          <div
            key={`${list.id}-${index}`}
            className={cn(
              "relative overflow-hidden rounded-lg bg-muted shadow-md ring-2 ring-white",
              index === 0
                ? "z-30 h-[88px] w-[62px]"
                : index === 1
                  ? "z-20 -ml-6 h-[76px] w-[54px]"
                  : index === 2
                    ? "z-10 -ml-6 h-[68px] w-[48px]"
                    : "-ml-6 h-[60px] w-[42px] opacity-90",
            )}
          >
            <CoverImage
              src={url}
              alt=""
              title={list.novelTitles[index]}
              sizes="62px"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <div className="min-w-0">
        <p className="line-clamp-1 font-serif text-[15px] font-semibold text-[#1A1224] group-hover:text-primary">
          {list.name}
        </p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {list.ownerName} · {list.reviewCount} works
        </p>
        {list.description ? (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-foreground/70">
            {list.description}
          </p>
        ) : null}
        <p className="mt-2 text-[11px] font-medium text-[#6E46C7]">
          {list.matchReason}
        </p>
      </div>
    </Link>
  );
}
