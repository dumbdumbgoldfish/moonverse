import Link from "next/link";
import { genreBrowseHref } from "@/lib/genres";
import { genreSlugFromName } from "@/lib/genre-slug";
import { cn } from "@/lib/utils";

interface ReviewBreadcrumbsProps {
  novelTitle: string;
  novelId: string;
  primaryGenre?: string;
  reviewTitle: string;
  className?: string;
}

const linkClass =
  "truncate font-medium text-[#7a7284] transition-colors hover:text-[#6E46C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7] focus-visible:ring-offset-2 rounded-sm";

function CrumbSeparator() {
  return (
    <span
      aria-hidden
      className="shrink-0 select-none text-[11px] font-light text-[#c5bed4]"
    >
      /
    </span>
  );
}

export function ReviewBreadcrumbs({
  novelTitle,
  novelId,
  primaryGenre,
  reviewTitle,
  className,
}: ReviewBreadcrumbsProps) {
  const genreSlug = primaryGenre ? genreSlugFromName(primaryGenre) : null;

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <p className="sr-only">
        {reviewTitle
          ? `Review: ${reviewTitle}`
          : `Review of ${novelTitle}`}
      </p>
      <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-none sm:text-[13px]">
        <li className="flex min-w-0 items-center gap-2">
          <Link href="/discover" className={linkClass}>
            Discover
          </Link>
        </li>

        {genreSlug && primaryGenre ? (
          <>
            <CrumbSeparator />
            <li className="flex min-w-0 max-w-[8rem] items-center sm:max-w-[10rem]">
              <Link href={genreBrowseHref(genreSlug)} className={linkClass}>
                {primaryGenre}
              </Link>
            </li>
          </>
        ) : null}

        <CrumbSeparator />
        <li
          className="min-w-0 max-w-[12rem] truncate font-semibold text-[#1a1033] sm:max-w-md"
          aria-current="page"
        >
          <Link
            href={`/novels/${novelId}`}
            className="truncate text-[#1a1033] transition-colors hover:text-[#6E46C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7] focus-visible:ring-offset-2 rounded-sm"
          >
            {novelTitle}
          </Link>
        </li>
      </ol>
    </nav>
  );
}
