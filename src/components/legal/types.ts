import type { LucideIcon } from "lucide-react";

export type PolicyTheme = "community" | "safety" | "legal";

export interface PolicySectionMeta {
  id: string;
  title: string;
}

export interface PolicyRelatedLink {
  href: string;
  label: string;
  description?: string;
}

export interface PolicyCalloutData {
  type: "info" | "important" | "safety" | "practice" | "moonie";
  title?: string;
  children: React.ReactNode;
}

export interface PolicyPageConfig {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  theme: PolicyTheme;
  lastUpdated?: string;
  readingMinutes?: number;
  sections: PolicySectionMeta[];
  relatedLinks?: PolicyRelatedLink[];
  backHref?: string;
  backLabel?: string;
  showMoonieHelp?: boolean;
  formal?: boolean;
}

export const POLICY_LAST_UPDATED = "15 July 2026";
