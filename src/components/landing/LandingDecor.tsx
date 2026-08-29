import { cn } from "@/lib/utils";

/**
 * MoonVerse landing-page decorative primitives.
 * Shape language: curved seams, two-tone fields, moons and stars.
 * Avoid straight horizontal rules and boxy section walls.
 */

export type SectionTransitionVariant = "ripple" | "swoop" | "orbit" | "crest";

const SECTION_TRANSITION_PATHS: Record<SectionTransitionVariant, string> = {
  ripple:
    "M0,72 C180,18 320,20 480,58 C660,102 820,96 980,42 C1140,-8 1300,14 1440,64 L1440,120 L0,120 Z",
  swoop:
    "M0,88 C260,110 420,18 720,36 C1000,54 1180,108 1440,44 L1440,120 L0,120 Z",
  orbit:
    "M0,58 C200,98 380,96 560,48 C760,-8 960,12 1140,58 C1280,96 1360,84 1440,52 L1440,120 L0,120 Z",
  crest:
    "M0,78 C240,10 420,110 720,52 C980,4 1180,96 1440,40 L1440,120 L0,120 Z",
};

const SECTION_TRANSITION_EDGES: Record<SectionTransitionVariant, string> = {
  ripple:
    "M0,72 C180,18 320,20 480,58 C660,102 820,96 980,42 C1140,-8 1300,14 1440,64",
  swoop: "M0,88 C260,110 420,18 720,36 C1000,54 1180,108 1440,44",
  orbit:
    "M0,58 C200,98 380,96 560,48 C760,-8 960,12 1140,58 C1280,96 1360,84 1440,52",
  crest: "M0,78 C240,10 420,110 720,52 C980,4 1180,96 1440,40",
};

interface SectionTransitionProps {
  color: string;
  variant?: SectionTransitionVariant;
  accent?: string;
}

/** Tall curved seam between landing-page sections (never a straight edge). */
export function SectionTransition({
  color,
  variant = "ripple",
  accent = "#8b7cf7",
}: SectionTransitionProps) {
  return (
    <div aria-hidden className="pointer-events-none relative z-[3] h-0">
      <div className="absolute inset-x-0 bottom-0 h-14 overflow-hidden sm:h-16 lg:h-[4.5rem]">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={SECTION_TRANSITION_PATHS[variant]} fill={color} />
          <path
            d={SECTION_TRANSITION_EDGES[variant]}
            fill="none"
            stroke={accent}
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.42"
          />
        </svg>
        <span
          className="absolute left-[16%] top-[36%] size-2 rounded-full shadow-[0_0_12px_currentColor]"
          style={{ color: accent, backgroundColor: accent }}
        />
        <span
          className="absolute right-[12%] top-[28%] size-1.5 rounded-full shadow-[0_0_10px_currentColor]"
          style={{ color: accent, backgroundColor: accent }}
        />
      </div>
    </div>
  );
}

export type TwoTonePair =
  | "night-gold"
  | "night-purple"
  | "cream-gold"
  | "lavender-purple"
  | "paper-violet"
  | "dawn-cream";

const TWO_TONE: Record<TwoTonePair, { base: string; accent: string }> = {
  "night-gold": { base: "#0b1024", accent: "#1c1630" },
  "night-purple": { base: "#12102a", accent: "#241a4a" },
  "cream-gold": { base: "#fff8f1", accent: "#ffe9c2" },
  "lavender-purple": { base: "#f4f0ff", accent: "#e4dbff" },
  "paper-violet": { base: "#faf7ff", accent: "#efe6ff" },
  "dawn-cream": { base: "#fffdfb", accent: "#fff1e4" },
};

type CurveShape = "wave" | "scoop" | "swell" | "slash";

/** Accent lobe + its curved seam (never a straight split). */
const ACCENT_OVERLAY: Record<CurveShape, { fill: string; edge: string }> = {
  wave: {
    fill: "M680,0 C820,90 940,50 1080,140 C1220,230 1320,180 1440,280 L1440,900 L680,900 Z",
    edge: "M680,0 C820,90 940,50 1080,140 C1220,230 1320,180 1440,280",
  },
  scoop: {
    fill: "M420,0 C560,160 720,100 900,220 C1080,340 1220,280 1440,400 L1440,900 L420,900 Z",
    edge: "M420,0 C560,160 720,100 900,220 C1080,340 1220,280 1440,400",
  },
  swell: {
    fill: "M520,0 C680,150 820,70 980,210 C1160,360 1280,280 1440,400 L1440,900 L520,900 Z",
    edge: "M520,0 C680,150 820,70 980,210 C1160,360 1280,280 1440,400",
  },
  slash: {
    fill: "M760,0 C880,140 980,220 1100,380 C1220,540 1320,680 1440,820 L1440,900 L760,900 Z",
    edge: "M760,0 C880,140 980,220 1100,380 C1220,540 1320,680 1440,820",
  },
};

interface TwoToneCurveProps {
  pair: TwoTonePair;
  shape?: CurveShape;
  flip?: boolean;
  className?: string;
  /** Soft gold or purple wash on the accent lobe. */
  glow?: "gold" | "purple" | "none";
}

/** Full-bleed two-color field divided by a curved seam (never a straight split). */
export function TwoToneCurve({
  pair,
  shape = "wave",
  flip = false,
  className,
  glow = "none",
}: TwoToneCurveProps) {
  const colors = TWO_TONE[pair];
  const overlay = ACCENT_OVERLAY[shape];
  const stroke =
    glow === "gold"
      ? "#F6C85F"
      : glow === "purple"
        ? "#8b7cf7"
        : "rgba(255,255,255,0.14)";

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className={cn("absolute inset-0 h-full w-full", flip && "-scale-x-100")}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="1440" height="900" fill={colors.base} />
        <path d={overlay.fill} fill={colors.accent} />
        <path
          d={overlay.edge}
          fill="none"
          stroke={stroke}
          strokeWidth="3"
          opacity="0.4"
        />
      </svg>
      {glow === "gold" ? (
        <div className="absolute -right-16 top-1/4 size-[22rem] rounded-full bg-[#F6C85F]/12 blur-3xl" />
      ) : null}
      {glow === "purple" ? (
        <div className="absolute -left-20 bottom-0 size-[24rem] rounded-full bg-[#6246ea]/18 blur-3xl" />
      ) : null}
    </div>
  );
}

interface StarfieldProps {
  className?: string;
  accents?: number;
}

const ACCENT_STARS = [
  { left: "8%", top: "22%", size: 10, delay: "0s", color: "#F6C85F" },
  { left: "22%", top: "64%", size: 6, delay: "1.1s", color: "#ffffff" },
  { left: "38%", top: "16%", size: 8, delay: "0.5s", color: "#D6CBFF" },
  { left: "54%", top: "48%", size: 5, delay: "1.6s", color: "#ffffff" },
  { left: "68%", top: "24%", size: 12, delay: "0.3s", color: "#F6C85F" },
  { left: "82%", top: "60%", size: 6, delay: "2s", color: "#ffffff" },
  { left: "90%", top: "32%", size: 7, delay: "0.9s", color: "#D6CBFF" },
  { left: "46%", top: "78%", size: 6, delay: "1.4s", color: "#ffffff" },
];

export function Starfield({ className, accents = 8 }: StarfieldProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="mv-starfield mv-twinkle-slow absolute inset-0" />
      {ACCENT_STARS.slice(0, accents).map((star, i) => (
        <span
          key={i}
          className="mv-twinkle absolute"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            color: star.color,
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full drop-shadow">
            <path d="M12 0l2.6 8.2L23 9.6l-6.7 5 2.4 8.4L12 18.3 5.3 23l2.4-8.4-6.7-5 8.4-1.4z" />
          </svg>
        </span>
      ))}
    </div>
  );
}

interface FloatingMoonProps {
  className?: string;
  size?: number;
  shape?: "full" | "crescent";
  color?: string;
  float?: "slow" | "slower" | "none";
}

export function FloatingMoon({
  className,
  size = 120,
  shape = "full",
  color = "#F6C85F",
  float = "slow",
}: FloatingMoonProps) {
  const floatClass =
    float === "slow" ? "mv-float-slow" : float === "slower" ? "mv-float-slower" : "";

  if (shape === "crescent") {
    return (
      <span
        aria-hidden
        className={cn("mv-crescent pointer-events-none block", floatClass, className)}
        style={{ width: size, height: size, color }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn("mv-moon-shape pointer-events-none block", floatClass, className)}
      style={{ width: size, height: size }}
    />
  );
}

interface ConstellationProps {
  className?: string;
  color?: string;
}

export function Constellation({ className, color = "#6c4dff" }: ConstellationProps) {
  const points = [
    [40, 60],
    [140, 30],
    [230, 90],
    [330, 40],
    [420, 110],
  ];
  return (
    <svg
      aria-hidden
      viewBox="0 0 460 140"
      className={cn("pointer-events-none absolute", className)}
      fill="none"
    >
      <path
        d={`M${points.map((p) => p.join(",")).join(" L")}`}
        stroke={color}
        strokeWidth="1.5"
        strokeDasharray="3 5"
        opacity="0.4"
        fill="none"
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 === 0 ? 3 : 2} fill={color} opacity="0.55" />
      ))}
    </svg>
  );
}

type NightAtmosphereProps = {
  className?: string;
  /** Stronger gold wash for closing chapters. */
  intensity?: "soft" | "rich";
  showStars?: boolean;
};

/** Shared moonlit-library backdrop for night landing chapters. */
export function NightAtmosphere({
  className,
  intensity = "soft",
  showStars = true,
}: NightAtmosphereProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute inset-0 bg-[#0b1024]" />
      <div
        className={cn(
          "absolute inset-0",
          intensity === "rich"
            ? "bg-[radial-gradient(70%_65%_at_18%_40%,rgba(98,70,234,0.38),transparent_58%),radial-gradient(55%_50%_at_88%_18%,rgba(246,200,95,0.16),transparent_52%)]"
            : "bg-[radial-gradient(65%_60%_at_82%_22%,rgba(98,70,234,0.32),transparent_55%),radial-gradient(45%_40%_at_12%_70%,rgba(246,200,95,0.08),transparent_50%)]"
        )}
      />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_120%,rgba(0,0,0,0.45),transparent_55%)]" />
      {showStars ? <Starfield accents={6} className="opacity-70" /> : null}
      <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay [background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%222%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.55%22/></svg>')]" />
    </div>
  );
}

type PaperAtmosphereProps = {
  className?: string;
  tone?: "cream" | "lavender";
};

/** Soft paper chapter between night sections. */
export function PaperAtmosphere({
  className,
  tone = "cream",
}: PaperAtmosphereProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className={cn(
          "absolute inset-0",
          tone === "lavender" ? "bg-[#f4f0ff]" : "bg-[#fffdf9]"
        )}
      />
      <div className="absolute -left-24 top-0 size-72 rounded-full bg-[#6246ea]/10 blur-3xl" />
      <div className="absolute -right-16 bottom-0 size-80 rounded-full bg-[#F6C85F]/12 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/80 to-transparent" />
    </div>
  );
}
