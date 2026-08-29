import Link from "next/link";
import { cn } from "@/lib/utils";

interface HomeModuleHeaderProps {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  className?: string;
}

export function HomeModuleHeader({
  title,
  subtitle,
  action,
  className,
}: HomeModuleHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="font-serif text-xl font-medium tracking-tight text-[#1A1224] sm:text-[1.35rem]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-[#1A1224]/55">{subtitle}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="shrink-0 text-[13px] font-semibold text-[#6E46C7] underline-offset-2 transition hover:underline"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
