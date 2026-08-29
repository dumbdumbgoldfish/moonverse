import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";

export const SETTINGS_SCROLL_PANEL_CLASS =
  "min-h-0 overflow-y-auto overscroll-contain rounded-[1.25rem] border border-[#1A1224]/8 bg-white shadow-[0_20px_48px_-36px_rgba(26,18,36,0.12)]";

export const SETTINGS_SECTION_CARD_CLASS =
  "rounded-[1.25rem] border border-[#1A1224]/8 bg-white shadow-[0_20px_48px_-36px_rgba(26,18,36,0.12)]";

const NAV_ITEMS = [
  { href: "/settings", label: "Profile", segment: "profile" },
  { href: "/settings/preferences", label: "Reading taste", segment: "preferences" },
  { href: "/settings/notifications", label: "Notifications", segment: "notifications" },
] as const;

export type SettingsSegment = (typeof NAV_ITEMS)[number]["segment"];

interface SettingsShellProps {
  active: SettingsSegment;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsShell({
  active,
  title,
  description,
  children,
}: SettingsShellProps) {
  return (
    <div className={cn(SITE_SHELL_CLASS, "py-8 pb-24 lg:py-10 lg:pb-10")}>
      <div className="mb-6 lg:mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E46C7]">
          Account
        </p>
        <h1 className="mt-1 font-serif text-2xl font-medium tracking-tight text-[#1A1224] sm:text-[1.75rem]">
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-[#1A1224]/55">
          Manage your profile, taste profile, and notifications.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:items-start">
        <nav
          aria-label="Settings sections"
          className="-mx-0.5 flex flex-wrap gap-2 px-0.5 py-1 lg:sticky lg:top-24 lg:flex-col lg:self-start"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.segment === active;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center rounded-xl px-3.5 py-2 text-[13px] font-semibold leading-none transition",
                  isActive
                    ? "bg-[#F4ECF8] text-[#6E46C7] ring-1 ring-[#6E46C7]/15"
                    : "text-[#1A1224]/70 hover:bg-[#F8F1FA] hover:text-[#1A1224]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <section className="min-w-0">
          <header className="mb-5">
            <h2 className="font-serif text-xl font-medium tracking-tight text-[#1A1224]">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[#1A1224]/55">
                {description}
              </p>
            ) : null}
          </header>
          {children}
        </section>
      </div>
    </div>
  );
}
