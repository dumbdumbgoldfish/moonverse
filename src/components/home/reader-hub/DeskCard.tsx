import Link from "next/link";
import { CoverImage } from "@/components/ui/CoverImage";
import { HOME_REASON_CHIP } from "@/lib/home-atelier";
import { cn } from "@/lib/utils";

interface DeskCardProps {
  href: string;
  coverUrl: string;
  title: string;
  subtitle?: string;
  reason?: string;
  meta?: string;
  className?: string;
  priority?: boolean;
}

export function DeskCard({
  href,
  coverUrl,
  title,
  subtitle,
  reason,
  meta,
  className,
  priority = false,
}: DeskCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-w-0 flex-col gap-2.5 transition duration-200",
        className
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-[14px] bg-[#1A1224]/5 ring-1 ring-[#1A1224]/8 transition duration-200 group-hover:ring-[#6E46C7]/25 group-hover:shadow-[0_16px_40px_-24px_rgba(110,70,199,0.35)]">
        <CoverImage
          src={coverUrl}
          alt=""
          title={title}
          sizes="160px"
          priority={priority}
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="line-clamp-2 font-serif text-[15px] font-medium leading-snug text-[#1A1224] group-hover:text-[#6E46C7]">
          {title}
        </p>
        {subtitle ? (
          <p className="truncate text-[12px] text-[#1A1224]/50">{subtitle}</p>
        ) : null}
        {reason ? <span className={HOME_REASON_CHIP}>{reason}</span> : null}
        {meta ? (
          <p className="text-[11px] text-[#1A1224]/45">{meta}</p>
        ) : null}
      </div>
    </Link>
  );
}
