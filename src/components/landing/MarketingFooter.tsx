"use client";

import Link from "next/link";
import {
  Code2,
  Heart,
  LifeBuoy,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { BackToTopButton } from "@/components/layout/BackToTopButton";
import { genreBrowseHref } from "@/lib/genres";
import { getSiteSocialLinks, type SocialLink } from "@/lib/site-social";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";

const LINK_GROUPS: {
  title: string;
  links: { href: string; label: string }[];
}[] = [
  {
    title: "Discover",
    links: [
      { href: genreBrowseHref("romance"), label: "Browse genres" },
      { href: "/discover", label: "Trending" },
      { href: "/discover?sort=highest-rated", label: "Highest rated" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/about", label: "About" },
      { href: "/content-guidelines", label: "Community Guidelines" },
      { href: "/code-of-conduct", label: "Code of Conduct" },
      { href: "/write", label: "Write a Review" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/accessibility", label: "Accessibility" },
      { href: "/reporting-abuse", label: "Reporting Abuse" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/cookies", label: "Cookies" },
      { href: "/copyright", label: "Copyright" },
    ],
  },
];

function SocialIcon({ link }: { link: SocialLink }) {
  const iconClass = "size-3.5";
  let icon = <Mail className={iconClass} aria-hidden />;
  if (link.id === "discord") icon = <MessageCircle className={iconClass} aria-hidden />;
  if (link.id === "github") icon = <Code2 className={iconClass} aria-hidden />;
  if (link.id === "twitter") icon = <span className="text-[11px] font-black">𝕏</span>;
  if (link.id === "bluesky") icon = <Sparkles className={iconClass} aria-hidden />;
  if (link.id === "reddit") icon = <LifeBuoy className={iconClass} aria-hidden />;

  return (
    <a
      href={link.href}
      target={link.id === "email" ? undefined : "_blank"}
      rel={link.id === "email" ? undefined : "noopener noreferrer"}
      aria-label={link.label}
      className="inline-flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cf7]"
    >
      {icon}
    </a>
  );
}

export function MarketingFooter() {
  const socialLinks = getSiteSocialLinks();
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 bg-[#0b1024] text-white">
      <div
        className="pointer-events-none absolute right-6 top-8 size-16 rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle at 68% 32%, transparent 0 56%, #F6C85F 57% 100%)",
        }}
        aria-hidden
      />

      <div className={cn(SITE_SHELL_CLASS, "relative py-10 lg:py-12")}>
        <div className="flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-12">
          <div className="max-w-sm shrink-0">
            <BrandLogo
              href="/"
              size="md"
              mark="none"
              showWordmark
              showTagline
              variant="inverse"
            />
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Discover web novels through community reviews and Moonie recommendations.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              MoonVerse does not host novel text.
            </p>
            {socialLinks.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {socialLinks.map((link) => (
                  <SocialIcon key={link.id} link={link} />
                ))}
              </div>
            ) : null}
          </div>

          <nav
            aria-label="Footer"
            className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4"
          >
            {LINK_GROUPS.map((group) => (
              <div key={group.title}>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#F6C85F]/85">
                  {group.title}
                </h3>
                <ul className="mt-2.5 space-y-1.5">
                  {group.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        className="text-[13px] text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cf7]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-5 text-center sm:flex-row sm:text-left">
          <p className="inline-flex items-center gap-1.5 text-xs text-white/50">
            Made with
            <Heart className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
            for web novel readers
          </p>
          <p className="text-xs text-white/40" suppressHydrationWarning>
            © {year} MoonVerse
          </p>
        </div>
      </div>

      <BackToTopButton />
    </footer>
  );
}
