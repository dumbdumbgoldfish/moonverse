/** Site-wide primary CTA — deep purple gradient pill (mv-nav-signup). */
export const MV_PRIMARY_BTN =
  "mv-nav-signup inline-flex items-center justify-center gap-1.5 rounded-full border-0 font-semibold text-white";

/** @deprecated Use MV_PRIMARY_BTN — kept for existing imports. */
export const MV_PRIMARY_BTN_ROUNDED = MV_PRIMARY_BTN;

/** Active filter / tab / toggle pill. */
export const MV_FILTER_ACTIVE =
  "mv-nav-signup rounded-full border-0 font-semibold text-white";

export const MV_FILTER_ACTIVE_RING =
  "mv-nav-signup rounded-full border-0 font-semibold text-white ring-2 ring-[#6E46C7]/20";

/** Circular icon FAB (scroll-to-top, etc.). */
export const MV_FLOAT_BTN =
  "mv-nav-signup inline-flex items-center justify-center rounded-full border-0 text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C36A] focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Ask Moonie brand CTA — matches navbar (`mv-nav-moonie`):
 * white pill with violet → gold → lilac gradient ring.
 */
export const MV_MOONIE_BTN =
  "mv-nav-moonie inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-transparent font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6246ea] focus-visible:ring-offset-2";

export const MV_MOONIE_ICON = "size-3.5 shrink-0 text-[#6246ea]";

/** Ask Moonie on dark salon / gradient panels — gold accent, no white pill. */
export const MV_MOONIE_BTN_ON_DARK =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#E8C36A]/50 bg-[#E8C36A]/14 font-semibold text-white shadow-[0_4px_18px_-10px_rgba(200,155,74,0.4)] transition hover:border-[#E8C36A]/70 hover:bg-[#E8C36A]/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C36A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1224]";

export const MV_MOONIE_ICON_ON_DARK = "size-3.5 shrink-0 text-[#E8C36A]";

/** Unified with solid — one Ask Moonie look sitewide. */
export const MV_MOONIE_BTN_SOFT = MV_MOONIE_BTN;

export const MV_MOONIE_SIZE = {
  xs: "h-8 min-h-8 px-3 text-xs",
  sm: "h-9 min-h-9 px-3 text-xs",
  md: "h-11 min-h-11 px-3.5 text-sm",
  lg: "h-12 min-h-12 px-5 text-sm",
} as const;
