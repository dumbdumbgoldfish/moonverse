export type ReadingLinkCategory = "OFFICIAL" | "COMMUNITY" | "FAN_TRANSLATION";

export interface ReadingLinkItem {
  id: string;
  platform: string;
  label: string;
  url: string;
  category: ReadingLinkCategory;
  country?: string | null;
  language?: string | null;
  active?: boolean;
}

export interface ReadingLinkGroup {
  category: ReadingLinkCategory;
  title: string;
  links: ReadingLinkItem[];
}
