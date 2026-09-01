import type { InboxItemKind } from "@/services/admin/inbox.service";
import type { AdminTagSummary } from "@/types/admin";

export const INBOX_TAG_MAP_ACTION_ID = "map_tag";

export interface CanonicalTagOption {
  id: string;
  name: string;
  slug: string;
  kind: string;
}

export function inboxItemShowsTagSuggestionMap(kind: InboxItemKind): boolean {
  return kind === "tag_suggestion";
}

export function filterCanonicalTagsForMap(
  tags: CanonicalTagOption[],
  query: string
): CanonicalTagOption[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return tags;
  }
  return tags.filter(
    (tag) =>
      tag.name.toLowerCase().includes(trimmed) ||
      tag.slug.toLowerCase().includes(trimmed)
  );
}

export function canSubmitTagSuggestionMap(
  selectedTagId: string | null | undefined,
  itemBusy: boolean
): boolean {
  return Boolean(selectedTagId) && !itemBusy;
}

export function toCanonicalTagOptions(
  tags: AdminTagSummary[]
): CanonicalTagOption[] {
  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    kind: tag.kind,
  }));
}

export function buildMapTagSuggestionPayload(
  suggestionId: string,
  tagId: string
): { suggestionId: string; tagId: string } {
  return { suggestionId, tagId };
}
