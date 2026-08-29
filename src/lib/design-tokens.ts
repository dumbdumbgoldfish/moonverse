/**
 * MoonVerse design tokens. WCAG AA compliant, color-blind friendly palette.
 * CSS variables in globals.css are the source of truth for styling.
 */
export const colors = {
  bg: "#0F172A",
  bgElevated: "#1E293B",
  textPrimary: "#F1F5F9",
  textSecondary: "#94A3B8",
  primary: "#3B82F6",
  primaryHover: "#2563EB",
  accent: "#FBBF24",
  accentSoft: "#FDE68A",
  border: "#334155",
  success: "#38BDF8",
  error: "#F87171",
  focusRing: "#FBBF24",
} as const;

export const typography = {
  sans: "var(--font-inter)",
  serif: "var(--font-source-serif)",
} as const;

export const radii = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
} as const;
