import { ReadingSources } from "@/components/novels/ReadingSources";
import type { ReadingLinkItem } from "@/types/reading-link";

interface ReadThisNovelProps {
  links: ReadingLinkItem[];
  className?: string;
  showEmptyState?: boolean;
}

/** Backward-compatible name used by review detail pages. */
export function ReadThisNovel(props: ReadThisNovelProps) {
  return <ReadingSources {...props} />;
}
