import {
  MV_FILTER_ACTIVE,
  MV_MOONIE_BTN,
  MV_PRIMARY_BTN,
} from "@/lib/mv-buttons";

/** Shared dark salon surface tokens (reviews salon masthead parity). */
export const SALON_SURFACE =
  "relative isolate overflow-hidden rounded-[24px] bg-[#0B0818] text-[#F4F0FF] shadow-[0_28px_64px_-32px_rgba(8,6,24,0.85)]";

export const SALON_GLOW_PURPLE =
  "pointer-events-none absolute -left-24 top-[-80px] size-[320px] rounded-full bg-[#6E46C7]/25 blur-3xl";

export const SALON_GLOW_GOLD =
  "pointer-events-none absolute -right-16 bottom-[-90px] size-[280px] rounded-full bg-[#C89B4A]/12 blur-3xl";

export const SALON_EYEBROW =
  "inline-flex items-center gap-1.5 rounded-full border border-[#E8C36A]/55 bg-[#E8C36A]/8 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#E8C36A]";

export const SALON_CHIP =
  "rounded-full border border-white/12 bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-[#EDE8FF]";

export const SALON_CARD =
  "rounded-xl border border-[#E8C36A]/25 bg-white/[0.04] transition-colors duration-150 hover:border-[#E8C36A]/45 hover:bg-white/[0.07]";

export { MV_FILTER_ACTIVE, MV_MOONIE_BTN, MV_PRIMARY_BTN };

export const SALON_MOONIE_BTN = MV_MOONIE_BTN;

export const SALON_OUTLINE_BTN =
  "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/20 px-4 text-[13px] font-semibold text-white transition hover:border-white/40 hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C36A]";

export const SALON_GOLD_BTN =
  "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#E8C36A]/35 bg-[#E8C36A]/8 px-4 text-[13px] font-semibold text-[#EDE8FF] shadow-[0_0_16px_rgba(232,195,106,0.12)] transition hover:border-[#E8C36A]/55 hover:bg-[#E8C36A]/14 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C36A]";
