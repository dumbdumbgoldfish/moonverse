/**
 * MoonVerse Admin Control Centre — premium design tokens.
 * Pure white panels · dark MoonVerse ink · gold luxury accents.
 */

export const ADMIN_INK = "#14111f";
export const ADMIN_PLUM = "#241630";
export const ADMIN_DEEP_PLUM = "#4c2a67";
export const ADMIN_VIOLET = "#6e46c7";
export const ADMIN_WHITE = "#ffffff";
export const ADMIN_GOLD = "#fcd34d";
export const ADMIN_GOLD_BRIGHT = "#fcd34d";
export const ADMIN_MUTED = "#7a7284";
export const ADMIN_CANVAS = "#14111f";

export const ADMIN_ROOT_CLASS =
  "mv-admin-root flex h-[100dvh] overflow-hidden bg-[#14111f] text-white";

export const ADMIN_SIDEBAR_CLASS =
  "flex w-[15.5rem] shrink-0 flex-col border-r border-[#c89b4a]/15 bg-[#14111f] text-white";

export const ADMIN_MAIN_CLASS = "flex min-h-0 min-w-0 flex-1 flex-col bg-[#14111f]";

export const ADMIN_CHROME_HEADER_CLASS =
  "flex h-14 shrink-0 items-center border-b border-white/[0.06] border-t border-t-[#c89b4a]/70 bg-[#14111f]";

export const ADMIN_TOPBAR_CLASS =
  "flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] border-t border-t-[#c89b4a]/70 bg-[#14111f] px-4 text-white sm:px-5";

export const ADMIN_SCROLL_CLASS = "min-h-0 flex-1 overflow-hidden";

export const ADMIN_PAGE_CLASS =
  "mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col overflow-hidden p-4 sm:p-5 lg:p-6";

export const ADMIN_PAGE_BODY_CLASS = "min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5";

export const ADMIN_SURFACE_CLASS = "text-[#ffffff]";

export const ADMIN_SURFACE_MUTED = "text-white/90";

export const ADMIN_SURFACE_LABEL =
  "text-[10px] font-bold uppercase tracking-[0.12em] text-[#fcd34d]";

export const ADMIN_TEXT_GOLD = "text-[#fcd34d]";

export const ADMIN_LINK_CLASS =
  "font-medium text-[#fcd34d] hover:underline";

export const ADMIN_CARD_CLASS =
  "relative overflow-hidden rounded-[1rem] border border-[#c89b4a]/20 bg-[#1f1a2e] text-white shadow-[0_18px_44px_-32px_rgba(0,0,0,0.45)]";

export const ADMIN_CARD_GLOW_CLASS =
  "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-[#a78bfa]/40 before:via-[#fcd34d]/80 before:to-[#38bdf8]/40";

export const ADMIN_TABLE_SHELL_CLASS =
  "relative overflow-hidden overflow-x-auto rounded-[1rem] border border-white/10 bg-[#1c1729] text-white";

export const ADMIN_TABLE_ACCENT_CLASS =
  "after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-0.5 after:bg-gradient-to-r after:from-[#6e46c7]/70 after:via-[#c89b4a]/70 after:to-[#6e46c7]/70";

export const ADMIN_TABLE_HEAD_ROW_CLASS =
  "border-b border-white/10 bg-white/[0.04]";

export const ADMIN_TABLE_HEAD_CELL_CLASS =
  "px-3.5 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-[#fcd34d]";

export const ADMIN_TABLE_BODY_ROW_CLASS =
  "border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.04]";

export const ADMIN_TABLE_CELL_CLASS = "px-3.5 py-2.5 align-top text-sm text-white";

export const ADMIN_FORM_CARD_CLASS =
  "relative space-y-3.5 overflow-hidden rounded-[1rem] border border-white/10 bg-[#1c1729] p-4 text-white shadow-[0_14px_36px_-28px_rgba(0,0,0,0.4)] sm:p-5";

export const ADMIN_SIDEBAR_PANEL_CLASS = ADMIN_SIDEBAR_CLASS;

export const ADMIN_CONTENT_PANEL_CLASS = "";

export const ADMIN_NAV_LINK_ACTIVE =
  "bg-white/[0.08] text-white ring-1 ring-[#c89b4a]/35 shadow-[inset_3px_0_0_#c89b4a]";

export const ADMIN_NAV_LINK_IDLE =
  "text-white hover:bg-white/[0.05]";

export const ADMIN_ICON_SHELL =
  "bg-gradient-to-br from-[#c4b5fd]/35 via-white/12 to-[#fde047]/30 ring-1 ring-[#fcd34d]/40";

export const ADMIN_FILTER_CHIP_ACTIVE =
  "admin-icon-on-gold bg-[#fcd34d] text-[#14111f] shadow-[0_8px_20px_-12px_rgba(252,211,77,0.5)] ring-1 ring-[#fde047]";

export const ADMIN_FILTER_CHIP_IDLE =
  "bg-[#fcd34d]/10 text-[#fcd34d] ring-1 ring-[#fcd34d]/28 hover:bg-[#fcd34d]/18 hover:ring-[#fcd34d]/40";

export const ADMIN_BTN_SECONDARY =
  "inline-flex items-center rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition hover:border-[#fcd34d]/35 hover:bg-white/[0.1]";

export const ADMIN_BTN_GOLD =
  "inline-flex items-center rounded-lg border border-[#fcd34d]/40 bg-[#fcd34d]/12 px-3 py-1.5 text-xs font-semibold text-[#fcd34d] transition hover:bg-[#fcd34d]/20";

export const ADMIN_BTN_DELETE =
  "admin-icon-destructive border-red-500/45 bg-red-500/12 text-[#ff5555] hover:border-red-400/60 hover:bg-red-500/22";

export type AdminStatTone = "plum" | "gold" | "violet" | "rose" | "sky" | "emerald";

export const ADMIN_STAT_TONE_STYLES: Record<
  AdminStatTone,
  { shell: string; icon: string; value: string }
> = {
  plum: {
    shell: "from-[#a78bfa]/45 via-[#1f1a2e] to-[#1f1a2e] ring-[#a78bfa]/35",
    icon: ADMIN_ICON_SHELL,
    value: "text-[#ede9fe]",
  },
  gold: {
    shell: "from-[#fcd34d]/40 via-[#1f1a2e] to-[#1f1a2e] ring-[#fcd34d]/35",
    icon: ADMIN_ICON_SHELL,
    value: "text-[#fcd34d]",
  },
  violet: {
    shell: "from-[#c084fc]/40 via-[#1f1a2e] to-[#1f1a2e] ring-[#c084fc]/35",
    icon: ADMIN_ICON_SHELL,
    value: "text-[#f3e8ff]",
  },
  rose: {
    shell: "from-[#fb7185]/38 via-[#1f1a2e] to-[#1f1a2e] ring-[#fb7185]/35",
    icon: ADMIN_ICON_SHELL,
    value: "text-[#fecdd3]",
  },
  sky: {
    shell: "from-[#38bdf8]/38 via-[#1f1a2e] to-[#1f1a2e] ring-[#38bdf8]/35",
    icon: ADMIN_ICON_SHELL,
    value: "text-[#bae6fd]",
  },
  emerald: {
    shell: "from-[#4ade80]/38 via-[#1f1a2e] to-[#1f1a2e] ring-[#4ade80]/35",
    icon: ADMIN_ICON_SHELL,
    value: "text-[#bbf7d0]",
  },
};

/** High-saturation palette for charts on dark admin panels. */
export const ADMIN_CHART_COLORS = [
  "#A78BFA",
  "#FCD34D",
  "#38BDF8",
  "#4ADE80",
  "#FB7185",
  "#E879F9",
  "#FB923C",
  "#C4B5FD",
] as const;

export const ADMIN_CHART_LINE_COLORS = {
  users: "#A78BFA",
  reviews: "#FCD34D",
  comments: "#4ADE80",
} as const;
