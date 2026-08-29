export type ReviewBodyBlockKind =
  | "lead"
  | "section"
  | "paragraph"
  | "list"
  | "quote"
  | "callout";

export interface ReviewBodyBlock {
  id: string;
  kind: ReviewBodyBlockKind;
  title: string | null;
  lines: string[];
}

export interface ReviewBodyTocItem {
  id: string;
  label: string;
}

const SECTION_HEADING =
  /^(what worked|what dragged|reading difficulty|overall|verdict|summary|highlights|lowlights|the good|the bad|my take)/i;

function blockId(hint: string, index: number): string {
  const slug = hint
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug ? `section-${slug}-${index}` : `section-${index}`;
}

function isSectionHeading(block: string): boolean {
  const singleLine = !block.includes("\n");
  if (!singleLine || block.length > 72) return false;
  if (block.endsWith(":")) return true;
  return SECTION_HEADING.test(block.replace(/:$/, "").trim());
}

function normalizeHeading(block: string): string {
  return block.replace(/:$/, "").trim();
}

function isListBlock(block: string): boolean {
  return /^[-•*]\s/m.test(block);
}

function listItems(block: string): string[] {
  return block
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s+/, "").trim())
    .filter(Boolean);
}

/** Parse review prose into scannable editorial sections. */
export function parseReviewBody(body: string): ReviewBodyBlock[] {
  const rawBlocks = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const blocks: ReviewBodyBlock[] = [];
  let sectionIndex = 0;
  let leadAssigned = false;
  let pendingSectionTitle: string | null = null;

  const flushPendingSection = () => {
    if (!pendingSectionTitle) return;
    sectionIndex += 1;
    blocks.push({
      id: blockId(pendingSectionTitle, sectionIndex),
      kind: "section",
      title: pendingSectionTitle,
      lines: [],
    });
    pendingSectionTitle = null;
  };

  for (const block of rawBlocks) {
    if (block.startsWith("> ")) {
      flushPendingSection();
      blocks.push({
        id: blockId("quote", blocks.length),
        kind: "quote",
        title: null,
        lines: [block.replace(/^>\s?/gm, "").trim()],
      });
      continue;
    }

    if (isSectionHeading(block)) {
      flushPendingSection();
      pendingSectionTitle = normalizeHeading(block);
      continue;
    }

    if (isListBlock(block)) {
      const items = listItems(block);
      if (pendingSectionTitle) {
        sectionIndex += 1;
        blocks.push({
          id: blockId(pendingSectionTitle, sectionIndex),
          kind: "list",
          title: pendingSectionTitle,
          lines: items,
        });
        pendingSectionTitle = null;
      } else {
        blocks.push({
          id: blockId("list", blocks.length),
          kind: "list",
          title: null,
          lines: items,
        });
      }
      continue;
    }

    flushPendingSection();

    if (!leadAssigned) {
      leadAssigned = true;
      blocks.push({
        id: "lead",
        kind: "lead",
        title: null,
        lines: [block],
      });
      continue;
    }

    if (/^reading difficulty:/i.test(block)) {
      blocks.push({
        id: blockId("reading-difficulty", blocks.length),
        kind: "callout",
        title: "Reading difficulty",
        lines: [block.replace(/^reading difficulty:\s*/i, "")],
      });
      continue;
    }

    blocks.push({
      id: blockId("paragraph", blocks.length),
      kind: "paragraph",
      title: null,
      lines: [block],
    });
  }

  flushPendingSection();
  return blocks;
}

export function reviewBodyToc(blocks: ReviewBodyBlock[]): ReviewBodyTocItem[] {
  return blocks
    .filter(
      (block) =>
        block.title &&
        (block.kind === "section" || block.kind === "list" || block.kind === "callout"),
    )
    .map((block) => ({
      id: block.id,
      label: block.title as string,
    }));
}

export function reviewWordCount(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length;
}

/** Only collapse very long reviews (~2+ min read). */
export function shouldCollapseReviewBody(body: string): boolean {
  return reviewWordCount(body) > 450;
}

export const GUEST_REVIEW_BODY_LIMIT = 480;

/** Server-side preview cap for signed-out readers. */
export function truncateReviewBodyForGuest(
  body: string,
  limit = GUEST_REVIEW_BODY_LIMIT
): string {
  if (body.length <= limit) return body;
  return `${body.slice(0, limit).trimEnd()}…`;
}
