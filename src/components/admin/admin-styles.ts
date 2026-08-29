/**
 * MoonVerse Admin Control Centre — premium design tokens.
 * Pure white panels · dark MoonVerse ink · gold luxury accents.
 */

export const ADMIN_INK = "#14111f";
export const ADMIN_PLUM = "#241630";
export const ADMIN_DEEP_PLUM = "#4c2a67";
export const ADMIN_VIOLET = "#6e46c7";
export const ADMIN_WHITE = "#ffffff";
export const ADMIN_GOLD = "#f9db7e";
export const ADMIN_MUTED = "#7a7284";
export const ADMIN_CANVAS = "#14111f";

export const ADMIN_ROOT_CLASS =
  "mv-admin-root flex h-[100dvh] overflow-hidden bg-[#14111f] text-white";

export const ADMIN_SIDEBAR_CLASS =
  "flex w-[15.5rem] shrink-0 flex-col border-r border-[#f9db7e]/15 bg-[#14111f] text-white";

export const ADMIN_MAIN_CLASS = "flex min-h-0 min-w-0 flex-1 flex-col bg-[#14111f]";

export const ADMIN_CHROME_HEADER_CLASS =
  "flex h-14 shrink-0 items-center border-b border-white/[0.06] border-t border-t-[#f9db7e]/70 bg-[#14111f]";

export const ADMIN_TOPBAR_CLASS =
  "flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] border-t border-t-[#f9db7e]/70 bg-[#14111f] px-4 text-white sm:px-5";

export const ADMIN_SCROLL_CLASS = "min-h-0 flex-1 overflow-hidden";

export const ADMIN_PAGE_CLASS =
  "mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col overflow-hidden p-4 sm:p-5 lg:p-6";

export const ADMIN_PAGE_BODY_CLASS = "min-h-0 flex-1 overflow-y-auto";

/** Chip rows need inner padding — parent overflow clips rings/shadows on pill edges. */
export const ADMIN_FILTER_CHIP_ROW_CLASS = "flex flex-wrap gap-1.5 p-1";

export const ADMIN_FILTER_CHIP_BASE =
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold transition duration-150 box-border";

export const ADMIN_SURFACE_CLASS = "text-white";

export const ADMIN_SURFACE_MUTED = "text-[#e9d5ff]";

export const ADMIN_SURFACE_LABEL =
  "text-[10px] font-bold uppercase tracking-[0.12em] text-[#fde68a]";

export const ADMIN_CARD_CLASS =
  "relative overflow-hidden rounded-[1rem] border border-[#f9db7e]/20 bg-[#1f1a2e] text-white shadow-[0_18px_44px_-32px_rgba(0,0,0,0.45)]";

export const ADMIN_CARD_GLOW_CLASS =
  "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-[#a78bfa]/40 before:via-[#f9db7e]/80 before:to-[#38bdf8]/40";

export const ADMIN_TABLE_SHELL_CLASS =
  "relative overflow-hidden overflow-x-auto rounded-[1rem] border border-white/10 bg-[#1c1729] text-white";

export const ADMIN_TABLE_ACCENT_CLASS =
  "after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-0.5 after:bg-gradient-to-r after:from-[#6e46c7]/70 after:via-[#f9db7e]/70 after:to-[#6e46c7]/70";

export const ADMIN_TABLE_HEAD_ROW_CLASS =
  "border-b border-white/10 bg-white/[0.04]";

export const ADMIN_TABLE_HEAD_CELL_CLASS =
  "px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-white/92";

export const ADMIN_TABLE_BODY_ROW_CLASS =
  "border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.04]";

export const ADMIN_TABLE_CELL_CLASS = "px-3.5 py-2.5 align-top text-sm text-white";

export const ADMIN_FORM_CARD_CLASS =
  "relative space-y-3.5 overflow-hidden rounded-[1rem] border border-white/10 bg-[#1c1729] p-4 text-white shadow-[0_14px_36px_-28px_rgba(0,0,0,0.4)] sm:p-5";

export const ADMIN_SIDEBAR_PANEL_CLASS = ADMIN_SIDEBAR_CLASS;

export const ADMIN_CONTENT_PANEL_CLASS = "";

export const ADMIN_NAV_LINK_ACTIVE =
  "bg-white/[0.08] text-white ring-1 ring-[#f9db7e]/35 shadow-[inset_3px_0_0_#f9db7e]";

export const ADMIN_NAV_LINK_IDLE =
  "text-white/92 hover:bg-white/[0.05] hover:text-white";

export const ADMIN_FILTER_CHIP_ACTIVE =
  "border-[#fce9a8] bg-[#f9db7e] text-[#14111f]";

export const ADMIN_FILTER_CHIP_IDLE =
  "border-[#f9db7e]/30 bg-[#f9db7e]/10 text-[#fde68a] hover:border-[#f9db7e]/45 hover:bg-[#f9db7e]/18 hover:text-[#fef08a]";

/** Default page size for admin tables (users, reviews, comments, novels). */
export const ADMIN_LIST_PAGE_SIZE = 50;

export const ADMIN_BTN_SECONDARY =
  "inline-flex items-center rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white/95 transition hover:border-[#f9db7e]/35 hover:bg-white/[0.1] hover:text-white";

export const ADMIN_BTN_GOLD =
  "inline-flex items-center rounded-lg border border-[#f9db7e]/40 bg-[#f9db7e]/12 px-3 py-1.5 text-xs font-semibold text-[#fde68a] transition hover:bg-[#f9db7e]/20";

export const ADMIN_BTN_DELETE =
  "border-red-500/45 bg-red-500/12 text-[#ff4444] hover:border-red-400/60 hover:bg-red-500/22 hover:text-[#ff5555] [&_svg]:text-[#ff4444] hover:[&_svg]:text-[#ff5555]";

export type AdminStatTone = "plum" | "gold" | "violet" | "rose" | "sky" | "emerald";

export const ADMIN_STAT_TONE_STYLES: Record<
  AdminStatTone,
  { shell: string; icon: string; value: string }
> = {
  plum: {
    shell: "from-[#a78bfa]/45 via-[#1f1a2e] to-[#1f1a2e] ring-[#a78bfa]/35",
    icon: "bg-[#a78bfa]/30 text-[#ede9fe] ring-[#c4b5fd]/50",
    value: "text-[#ede9fe]",
  },
  gold: {
    shell: "from-[#f9db7e]/40 via-[#1f1a2e] to-[#1f1a2e] ring-[#f9db7e]/35",
    icon: "bg-[#f9db7e]/25 text-[#fefce8] ring-[#fde047]/50",
    value: "text-[#fef08a]",
  },
  violet: {
    shell: "from-[#c084fc]/40 via-[#1f1a2e] to-[#1f1a2e] ring-[#c084fc]/35",
    icon: "bg-[#c084fc]/28 text-[#faf5ff] ring-[#f3e8ff]/45",
    value: "text-[#f3e8ff]",
  },
  rose: {
    shell: "from-[#fb7185]/38 via-[#1f1a2e] to-[#1f1a2e] ring-[#fb7185]/35",
    icon: "bg-[#fb7185]/28 text-[#fff1f2] ring-[#fda4af]/45",
    value: "text-[#fecdd3]",
  },
  sky: {
    shell: "from-[#38bdf8]/38 via-[#1f1a2e] to-[#1f1a2e] ring-[#38bdf8]/35",
    icon: "bg-[#38bdf8]/28 text-[#f0f9ff] ring-[#bae6fd]/45",
    value: "text-[#bae6fd]",
  },
  emerald: {
    shell: "from-[#4ade80]/38 via-[#1f1a2e] to-[#1f1a2e] ring-[#4ade80]/35",
    icon: "bg-[#4ade80]/28 text-[#f0fdf4] ring-[#bbf7d0]/45",
    value: "text-[#bbf7d0]",
  },
};

/** High-saturation palette for charts on dark admin panels. */
export const ADMIN_CHART_COLORS = [
  "#A78BFA",
  "#F9DB7E",
  "#38BDF8",
  "#4ADE80",
  "#FB7185",
  "#E879F9",
  "#FB923C",
  "#C4B5FD",
] as const;

export const ADMIN_CHART_LINE_COLORS = {
  users: "#A78BFA",
  reviews: "#F9DB7E",
  comments: "#4ADE80",
} as const;
