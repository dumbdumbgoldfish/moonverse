import type { ReadingLinkCategory, ReadingLinkGroup, ReadingLinkItem } from "@/types/reading-link";
import {
  buildReadingLinksFromExternalUrl,
  buildReadingLinksFromUrls,
  getPlatformLabel,
  inferPlatformFromUrl,
  pickPrimaryReadingLink,
  READING_LINK_GROUP_LABELS,
} from "@/lib/reading-platforms";

const GROUP_ORDER: ReadingLinkCategory[] = [
  "OFFICIAL",
  "COMMUNITY",
  "FAN_TRANSLATION",
];

export function mapDbReadingLink(link: {
  id: string;
  platform: string;
  url: string;
  category: ReadingLinkCategory;
  country: string | null;
  language: string | null;
  label?: string | null;
  active?: boolean;
  moderationStatus?: string;
}): ReadingLinkItem | null {
  if (link.active === false) return null;
  if (link.moderationStatus && link.moderationStatus !== "APPROVED") return null;

  const inferred = inferPlatformFromUrl(link.url);
  if (!inferred) return null;

  return {
    id: link.id,
    platform: link.platform,
    label: link.label || getPlatformLabel(link.platform) || inferred.label,
    url: link.url,
    category: inferred.category,
    country: link.country,
    language: link.language,
    active: true,
  };
}

/** Fallback when a novel only has the legacy externalLink field. */
export function readingLinkFromExternalUrl(
  externalLink: string,
  novelId: string
): ReadingLinkItem | null {
  const inferred = inferPlatformFromUrl(externalLink);
  if (!inferred) return null;

  return {
    id: `${novelId}-${inferred.platform}`,
    platform: inferred.platform,
    label: inferred.label,
    url: externalLink,
    category: inferred.category,
    active: true,
  };
}

/**
 * Resolve public reading links for a novel.
 * Only approved database rows are included. The legacy externalLink field is
 * metadata and is not exposed as a public source.
 */
export function resolveNovelReadingLinks(
  novelId: string,
  dbLinks: ReadingLinkItem[],
  externalLink: string | null
): ReadingLinkItem[] {
  void novelId;
  void externalLink;
  const byUrl = new Map<string, ReadingLinkItem>();
  for (const link of dbLinks) {
    if (!byUrl.has(link.url)) byUrl.set(link.url, link);
  }
  return Array.from(byUrl.values());
}

export function groupReadingLinks(links: ReadingLinkItem[]): ReadingLinkGroup[] {
  return GROUP_ORDER.map((category) => ({
    category,
    title: READING_LINK_GROUP_LABELS[category],
    links: links.filter((link) => link.category === category),
  })).filter((group) => group.links.length > 0);
}

export {
  buildReadingLinksFromExternalUrl,
  buildReadingLinksFromUrls,
  pickPrimaryReadingLink,
};
