import { REVIEW_SECTION_TEMPLATES } from "@/lib/review-sections";

export type WritingStudioCommandGroup =
  | "Insert"
  | "Writing"
  | "Studio"
  | "Publish";

export interface WritingStudioCommand {
  id: string;
  label: string;
  hint?: string;
  keywords?: string[];
  group: WritingStudioCommandGroup;
  disabled?: boolean;
  onSelect: () => void;
}

export const SLASH_MENU_ITEMS = [
  {
    id: "quote",
    label: "Quote",
    insert: "> Your quote here\n\n",
    keywords: ["quote", "blockquote"],
  },
  ...REVIEW_SECTION_TEMPLATES.map((section) => ({
    id: section.id,
    label: section.label,
    insert: section.insert,
    keywords: [section.label.toLowerCase(), section.id],
  })),
] as const;

export function filterSlashMenuItems(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [...SLASH_MENU_ITEMS];
  return SLASH_MENU_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.id.includes(q) ||
      item.keywords.some((keyword) => keyword.includes(q))
  );
}
