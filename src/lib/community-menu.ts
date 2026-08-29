import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  BookOpenCheck,
  Cookie,
  Copyright,
  FileText,
  Flag,
  Handshake,
  HelpCircle,
  LockKeyhole,
  MessagesSquare,
  Scale,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";

export interface CommunityMenuItem {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export interface CommunityMenuGroup {
  id: string;
  label: string;
  sectionIcon: LucideIcon;
  items: CommunityMenuItem[];
}

export const COMMUNITY_MENU_GROUPS: CommunityMenuGroup[] = [
  {
    id: "community",
    label: "Community",
    sectionIcon: Users,
    items: [
      {
        label: "Community Guidelines",
        href: "/content-guidelines",
        description: "What belongs on MoonVerse",
        icon: MessagesSquare,
      },
      {
        label: "Community Standards",
        href: "/community-standards",
        description: "What good participation looks like",
        icon: ShieldCheck,
      },
      {
        label: "Code of Conduct",
        href: "/code-of-conduct",
        description: "How we treat each other",
        icon: Handshake,
      },
      {
        label: "Code of Ethics",
        href: "/code-of-ethics",
        description: "Principles behind our decisions",
        icon: Scale,
      },
      {
        label: "Moderation Guidelines",
        href: "/moderation-guidelines",
        description: "How MoonVerse moderates content",
        icon: ShieldCheck,
      },
      {
        label: "Trust and Safety",
        href: "/trust-and-safety",
        description: "How we protect the community",
        icon: Shield,
      },
    ],
  },
  {
    id: "safety-legal",
    label: "Safety and Legal",
    sectionIcon: Shield,
    items: [
      {
        label: "Terms of Service",
        href: "/terms",
        description: "Rules for using MoonVerse",
        icon: FileText,
      },
      {
        label: "Privacy Policy",
        href: "/privacy",
        description: "How we handle your data",
        icon: LockKeyhole,
      },
      {
        label: "Cookie Policy",
        href: "/cookies",
        description: "How we use cookies",
        icon: Cookie,
      },
      {
        label: "Accessibility",
        href: "/accessibility",
        description: "Making MoonVerse usable for everyone",
        icon: Accessibility,
      },
      {
        label: "Copyright Policy",
        href: "/copyright",
        description: "Respecting creative work",
        icon: Copyright,
      },
      {
        label: "Safety Centre",
        href: "/safety",
        description: "Staying safe on MoonVerse",
        icon: Shield,
      },
      {
        label: "Reporting Abuse",
        href: "/reporting-abuse",
        description: "How to report harmful content",
        icon: Flag,
      },
    ],
  },
];

/** Extra policy links shown below the main grid */
export const COMMUNITY_MENU_EXTRA: CommunityMenuItem[] = [
  {
    label: "DMCA Policy",
    href: "/dmca",
    description: "Copyright takedown requests",
    icon: FileText,
  },
  {
    label: "Intellectual Property",
    href: "/intellectual-property",
    description: "Rights and ownership on MoonVerse",
    icon: Copyright,
  },
  {
    label: "Age and Content Policy",
    href: "/age-and-content-policy",
    description: "Age ratings and mature content",
    icon: BookOpenCheck,
  },
  {
    label: "Contact Us",
    href: "/contact",
    description: "Get in touch with the team",
    icon: MessagesSquare,
  },
  {
    label: "FAQ",
    href: "/faq",
    description: "Frequently asked questions",
    icon: HelpCircle,
  },
];

export const COMMUNITY_MENU_HELP = {
  helpHref: "/help",
  reportHref: "/reporting-abuse",
} as const;

/** All community menu hrefs for parity checks */
export function getAllCommunityMenuHrefs(): string[] {
  const fromGroups = COMMUNITY_MENU_GROUPS.flatMap((group) =>
    group.items.map((item) => item.href)
  );
  const fromExtra = COMMUNITY_MENU_EXTRA.map((item) => item.href);
  return [...new Set([...fromGroups, ...fromExtra, COMMUNITY_MENU_HELP.helpHref])];
}
