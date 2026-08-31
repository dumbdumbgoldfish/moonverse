import {
  BookOpen,
  Building2,
  Database,
  ExternalLink,
  Languages,
  Link2Off,
  ShieldCheck,
} from "lucide-react";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import {
  EDITION_PANEL,
  EDITION_PANEL_BODY,
  EDITION_PANEL_EYEBROW,
  EDITION_PANEL_TITLE,
} from "@/components/novels/edition-panel";
import { groupReadingLinks } from "@/lib/reading-links";
import { cn } from "@/lib/utils";
import type {
  ReadingLinkCategory,
  ReadingLinkItem,
} from "@/types/reading-link";

interface ReadingSourcesProps {
  links: ReadingLinkItem[];
  className?: string;
  showEmptyState?: boolean;
  compact?: boolean;
}

const GROUP_META: Record<
  ReadingLinkCategory,
  { title: string; description: string; Icon: typeof BookOpen }
> = {
  OFFICIAL: {
    title: "Official publishers",
    description: "Verified places where chapters are officially available.",
    Icon: Building2,
  },
  COMMUNITY: {
    title: "Community directories",
    description: "Directory listings; availability may vary by region.",
    Icon: Database,
  },
  FAN_TRANSLATION: {
    title: "Verified fan translations",
    description: "Community translations reviewed against MoonVerse policy.",
    Icon: Languages,
  },
};

export function ReadingSources({
  links,
  className,
  showEmptyState = true,
  compact = false,
}: ReadingSourcesProps) {
  const groups = groupReadingLinks(links);
  if (groups.length === 0 && !showEmptyState) return null;

  return (
    <section
      id="where-to-read"
      aria-labelledby="reading-sources-heading"
      className={cn(EDITION_PANEL, "scroll-mt-28", className)}
    >
      <div className="flex items-start gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F4ECF8] text-[#6E46C7] ring-1 ring-[#6E46C7]/12">
          <ShieldCheck className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className={EDITION_PANEL_EYEBROW}>Availability</p>
          <h2 id="reading-sources-heading" className={cn(EDITION_PANEL_TITLE, "mt-0.5")}>
            Where to read
          </h2>
          <p className={cn(EDITION_PANEL_BODY, "mt-0.5")}>
            {compact
              ? "Verified publishers only."
              : "Verified publishers and directories only."}
          </p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="mt-2.5 flex flex-1 flex-col justify-between gap-2.5 rounded-xl border border-dashed border-[#6E46C7]/20 bg-[#F8F4FC]/60 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <Link2Off
              className="mt-0.5 size-4 shrink-0 text-[#6E46C7]"
              aria-hidden
            />
            <div>
              <p className="text-[13px] font-semibold leading-snug text-[#1a1033]">
                No verified reading source yet
              </p>
              <p className={cn(EDITION_PANEL_BODY, "mt-0.5")}>
                {compact
                  ? "Sources appear after they have been checked."
                  : "Sources appear here after policy review."}
              </p>
            </div>
          </div>
          <AskMoonieLink
            size="sm"
            className="w-full text-[11px] font-bold"
          />
        </div>
      ) : (
        <div
          className={cn(
            "mt-3 flex-1 space-y-3",
            !compact && "lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0"
          )}
        >
          {groups.map((group) => {
            const meta = GROUP_META[group.category];
            const Icon = meta.Icon;
            return (
              <div key={group.category}>
                <div className="mb-1.5">
                  <h3 className="flex items-center gap-1.5 text-[12px] font-bold text-[#1a1033]">
                    <Icon className="size-3.5 text-[#6E46C7]" aria-hidden />
                    {meta.title}
                  </h3>
                  <p
                    className={cn(
                      EDITION_PANEL_BODY,
                      "mt-0.5",
                      compact && "hidden"
                    )}
                  >
                    {meta.description}
                  </p>
                </div>
                <ul className="overflow-hidden rounded-lg border border-[#6E46C7]/10 bg-white">
                  {group.links.map((link, index) => (
                    <li
                      key={link.id}
                      className={cn(index > 0 && "border-t border-[#6E46C7]/8")}
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex min-h-10 items-center gap-2.5 px-3 py-2 hover:bg-[#F4ECF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6E46C7]"
                        aria-label={`${link.label}, opens externally`}
                      >
                        <BookOpen
                          className="size-3.5 shrink-0 text-[#6E46C7]"
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-bold text-[#1a1033] group-hover:text-[#6E46C7]">
                            {link.label}
                          </span>
                          <span className="block text-[10px] text-[#5c5670]">
                            {link.language
                              ? link.language.toUpperCase()
                              : group.category === "COMMUNITY"
                                ? "Directory"
                                : "Verified"}
                          </span>
                        </span>
                        <ExternalLink
                          className="size-3.5 shrink-0 text-[#5c5670] group-hover:text-[#6E46C7]"
                          aria-hidden
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
