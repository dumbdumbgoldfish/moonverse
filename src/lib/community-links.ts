export interface CommunityLink {
  label: string;
  href: string;
  description: string;
}

export const COMMUNITY_LINKS: CommunityLink[] = [
  {
    label: "Community Guidelines",
    href: "/content-guidelines",
    description: "What belongs on MoonVerse",
  },
  {
    label: "Community Standards",
    href: "/community-standards",
    description: "What good participation looks like",
  },
  {
    label: "Code of Conduct",
    href: "/code-of-conduct",
    description: "How we treat each other",
  },
  {
    label: "Code of Ethics",
    href: "/code-of-ethics",
    description: "Principles behind our decisions",
  },
  {
    label: "Terms of Service",
    href: "/terms",
    description: "Rules for using MoonVerse",
  },
  {
    label: "Privacy Policy",
    href: "/privacy",
    description: "How we handle your data",
  },
  {
    label: "Cookie Policy",
    href: "/cookies",
    description: "How we use cookies",
  },
  {
    label: "Accessibility",
    href: "/accessibility",
    description: "Making MoonVerse usable for everyone",
  },
  {
    label: "Copyright Policy",
    href: "/copyright",
    description: "Respecting creative work",
  },
  {
    label: "DMCA Policy",
    href: "/dmca",
    description: "Copyright takedown requests",
  },
  {
    label: "Intellectual Property",
    href: "/intellectual-property",
    description: "Rights and ownership on MoonVerse",
  },
  {
    label: "Reporting Abuse",
    href: "/reporting-abuse",
    description: "How to report harmful content",
  },
  {
    label: "Safety Centre",
    href: "/safety",
    description: "Staying safe on MoonVerse",
  },
  {
    label: "Trust and Safety",
    href: "/trust-and-safety",
    description: "How we protect the community",
  },
  {
    label: "Contact Us",
    href: "/contact",
    description: "Get in touch with the team",
  },
  {
    label: "Help Centre",
    href: "/help",
    description: "Guides and support articles",
  },
  {
    label: "Moderation Guidelines",
    href: "/moderation-guidelines",
    description: "How MoonVerse moderates content",
  },
  {
    label: "Age and Content Policy",
    href: "/age-and-content-policy",
    description: "Age ratings and mature content",
  },
  {
    label: "FAQ",
    href: "/faq",
    description: "Frequently asked questions",
  },
];

/** Routes that use the guest marketing shell (fixed navbar, no app nav) */
export const GUEST_STANDALONE_ROUTES = [
  "/search",
  "/write",
  "/ask-moonie",
  "/terms",
  "/privacy",
  "/cookies",
  "/copyright",
  "/dmca",
  "/intellectual-property",
  "/reporting-abuse",
  "/safety",
  "/trust-and-safety",
  "/contact",
  "/help",
  "/faq",
  "/code-of-conduct",
  "/community-standards",
  "/content-guidelines",
  "/accessibility",
  "/code-of-ethics",
  "/moderation-guidelines",
  "/age-and-content-policy",
];

export function isGuestStandaloneRoute(pathname: string): boolean {
  return (
    GUEST_STANDALONE_ROUTES.includes(pathname) || pathname.startsWith("/browse/")
  );
}
