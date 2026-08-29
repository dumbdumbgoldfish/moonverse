import type { CSSProperties } from "react";

/**
 * Literary-salon page scope. Tokens live on :root in globals.css; this object
 * keeps the warm page wash when applied to the community shell.
 */
export const LITERARY_SALON_STYLE = {
  ["--mv-bg-wash" as string]:
    "linear-gradient(165deg, #ffffff 0%, #fdfbfe 42%, #f8f1fa 72%, #f4ecf8 100%)",
} as CSSProperties;

/** Page shell: warm ivory fading into a whisper of pink-purple. */
export const LITERARY_PAGE_BG =
  "bg-[linear-gradient(165deg,var(--mv-bg)_0%,#fdfbf7_38%,var(--mv-bg-soft)_72%,#f4ecf8_100%)]";
