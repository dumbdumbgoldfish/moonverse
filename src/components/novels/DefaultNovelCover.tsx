import {
  BookOpen,
  Feather,
  Languages,
  MessageCircle,
  MoonStar,
  Sparkles,
  Star,
} from "lucide-react";
import { formatCompactCount } from "@/lib/format-utils";
import { cn } from "@/lib/utils";

export interface DefaultNovelCoverProps {
  title: string;
  author?: string | null;
  genres?: string[];
  language?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  /** Deterministic seed (novel id preferred). */
  themeSeed?: string;
  className?: string;
  /** Force denser layout for tiny thumbnails. */
  compact?: boolean;
}

type CoverTheme = {
  id: string;
  edition: string;
  from: string;
  via: string;
  to: string;
  accent: string;
  glow: string;
  star: string;
  ink: string;
};

type CoverLayout = "moon" | "book" | "constellation" | "minimal" | "manuscript";

const THEMES: CoverTheme[] = [
  {
    id: "deep-moon",
    edition: "Midnight Library",
    from: "#120b22",
    via: "#2a1854",
    to: "#0b1024",
    accent: "#F6C85F",
    glow: "rgba(98,70,234,0.45)",
    star: "#F6C85F",
    ink: "#ffffff",
  },
  {
    id: "purple-nebula",
    edition: "Celestial Archive",
    from: "#1a1033",
    via: "#4c2fd6",
    to: "#24104a",
    accent: "#E8DEFF",
    glow: "rgba(167,139,250,0.5)",
    star: "#c4b5fd",
    ink: "#ffffff",
  },
  {
    id: "royal-blue",
    edition: "Royal Collection",
    from: "#0b1a33",
    via: "#1e3a6e",
    to: "#0f172a",
    accent: "#F6C85F",
    glow: "rgba(59,130,246,0.4)",
    star: "#93c5fd",
    ink: "#ffffff",
  },
  {
    id: "golden-moon",
    edition: "Golden Moon Edition",
    from: "#1a1408",
    via: "#5c3d12",
    to: "#2a1c0a",
    accent: "#F6C85F",
    glow: "rgba(246,200,95,0.4)",
    star: "#ffe29a",
    ink: "#fff8e8",
  },
  {
    id: "emerald-night",
    edition: "Jade Chronicle",
    from: "#071612",
    via: "#0f3d32",
    to: "#0a1f1a",
    accent: "#86efac",
    glow: "rgba(16,185,129,0.35)",
    star: "#a7f3d0",
    ink: "#ecfdf5",
  },
  {
    id: "rose-twilight",
    edition: "Rose Twilight",
    from: "#1a0c16",
    via: "#6b2148",
    to: "#2a1020",
    accent: "#F6C85F",
    glow: "rgba(244,114,182,0.35)",
    star: "#fbcfe8",
    ink: "#fff1f7",
  },
  {
    id: "ancient-scroll",
    edition: "Ancient Manuscript",
    from: "#2a1c10",
    via: "#6b4a24",
    to: "#1f160c",
    accent: "#F6C85F",
    glow: "rgba(180,130,60,0.35)",
    star: "#fde68a",
    ink: "#fff7e8",
  },
  {
    id: "silver-galaxy",
    edition: "Cosmic Edition",
    from: "#0f141c",
    via: "#334155",
    to: "#111827",
    accent: "#e2e8f0",
    glow: "rgba(148,163,184,0.35)",
    star: "#f8fafc",
    ink: "#f8fafc",
  },
  {
    id: "midnight-library",
    edition: "Scholar's Edition",
    from: "#0c1020",
    via: "#312e81",
    to: "#15122e",
    accent: "#F6C85F",
    glow: "rgba(99,102,241,0.4)",
    star: "#a5b4fc",
    ink: "#eef2ff",
  },
  {
    id: "arcane",
    edition: "Arcane Collection",
    from: "#160a24",
    via: "#5b21b6",
    to: "#1e1035",
    accent: "#F6C85F",
    glow: "rgba(168,85,247,0.42)",
    star: "#e9d5ff",
    ink: "#faf5ff",
  },
];

const LAYOUTS: CoverLayout[] = [
  "moon",
  "book",
  "constellation",
  "minimal",
  "manuscript",
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function themeForGenre(genre?: string): CoverTheme | null {
  const g = (genre ?? "").toLowerCase();
  if (!g) return null;
  // Romance: rose-plum
  if (/(^|[^a-z])romance/.test(g) || /romantic/.test(g))
    return THEMES.find((t) => t.id === "rose-twilight") ?? null;
  // GL/BL: soft jewel tones
  if (/\b(gl|bl|yaoi|yuri|boys'? love|girls'? love|lgbtq)\b/.test(g))
    return THEMES.find((t) => t.id === "arcane") ?? null;
  // Fantasy: deep violet
  if (/(fantasy|isekai|xianxia|cultivation|villainess)/.test(g))
    return THEMES.find((t) => t.id === "purple-nebula") ?? null;
  // Horror: charcoal-wine
  if (/(horror|thriller|psychological|gothic|crime)/.test(g))
    return THEMES.find((t) => t.id === "silver-galaxy") ?? null;
  // Historical: parchment-gold
  if (/(historical|wuxia|murim|period)/.test(g))
    return THEMES.find((t) => t.id === "ancient-scroll") ?? null;
  // Science Fiction: midnight-blue
  if (/(sci-?fi|science fiction|cyberpunk|system|gaming|space)/.test(g))
    return THEMES.find((t) => t.id === "royal-blue") ?? null;
  // General: plum-indigo
  return THEMES.find((t) => t.id === "deep-moon") ?? null;
}

function pickTheme(seed: string, genres: string[] = []): CoverTheme {
  return themeForGenre(genres[0]) ?? THEMES[hashSeed(seed) % THEMES.length];
}

function pickLayout(seed: string): CoverLayout {
  return LAYOUTS[hashSeed(`${seed}:layout`) % LAYOUTS.length];
}

function StarField({ color }: { color: string }) {
  const dots = [
    ["12%", "18%"],
    ["28%", "42%"],
    ["46%", "14%"],
    ["62%", "36%"],
    ["78%", "22%"],
    ["88%", "48%"],
    ["18%", "68%"],
    ["54%", "72%"],
    ["72%", "62%"],
    ["38%", "56%"],
  ] as const;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {dots.map(([left, top], i) => (
        <span
          key={i}
          className="absolute rounded-full opacity-70"
          style={{
            left,
            top,
            width: i % 3 === 0 ? 2.5 : 1.5,
            height: i % 3 === 0 ? 2.5 : 1.5,
            backgroundColor: color,
            boxShadow: i % 4 === 0 ? `0 0 6px ${color}` : undefined,
          }}
        />
      ))}
    </div>
  );
}

function ConstellationLines({ color }: { color: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 120"
      className="pointer-events-none absolute inset-x-[8%] top-[28%] h-[30%] w-[84%] opacity-50"
      fill="none"
    >
      <path
        d="M20,70 C50,20 90,90 120,40 C145,10 170,60 190,35"
        stroke={color}
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      <circle cx="20" cy="70" r="2" fill={color} />
      <circle cx="80" cy="55" r="1.5" fill={color} />
      <circle cx="120" cy="40" r="2" fill={color} />
      <circle cx="190" cy="35" r="1.5" fill={color} />
    </svg>
  );
}

function CenterMotif({
  layout,
  accent,
  glow,
}: {
  layout: CoverLayout;
  accent: string;
  glow: string;
}) {
  if (layout === "book") {
    return (
      <div className="relative mx-auto flex size-[38%] max-h-28 min-h-12 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full blur-xl"
          style={{ background: glow }}
          aria-hidden
        />
        <BookOpen
          className="relative size-[55%] drop-shadow-lg"
          style={{ color: accent }}
          aria-hidden
        />
      </div>
    );
  }

  if (layout === "manuscript") {
    return (
      <div className="relative mx-auto flex size-[38%] max-h-28 min-h-12 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full blur-xl"
          style={{ background: glow }}
          aria-hidden
        />
        <Feather
          className="relative size-[55%] drop-shadow-lg"
          style={{ color: accent }}
          aria-hidden
        />
      </div>
    );
  }

  if (layout === "minimal") {
    return (
      <div className="relative mx-auto flex size-[32%] max-h-24 min-h-10 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full blur-lg"
          style={{ background: glow }}
          aria-hidden
        />
        <Sparkles
          className="relative size-[48%]"
          style={{ color: accent }}
          aria-hidden
        />
      </div>
    );
  }

  // moon + constellation share moon motif
  return (
    <div className="relative mx-auto flex size-[42%] max-h-32 min-h-14 items-center justify-center">
      <span
        className="absolute inset-[-10%] rounded-full blur-xl"
        style={{ background: glow }}
        aria-hidden
      />
      <span
        className="absolute inset-[12%] rounded-full opacity-90"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${accent} 0%, transparent 55%), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.15), transparent 50%)`,
          boxShadow: `inset -10px -8px 24px rgba(0,0,0,0.45), 0 0 28px ${glow}`,
        }}
        aria-hidden
      />
      <MoonStar
        className="relative size-[42%] drop-shadow"
        style={{ color: accent }}
        aria-hidden
      />
    </div>
  );
}

function RatingRow({
  rating,
  reviewCount,
  accent,
}: {
  rating?: number | null;
  reviewCount?: number | null;
  accent: string;
}) {
  if (rating == null && (reviewCount == null || reviewCount <= 0)) return null;

  const filled = rating != null ? Math.round(Math.min(5, Math.max(0, rating))) : 0;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-semibold sm:text-[10px]">
      {rating != null ? (
        <span className="inline-flex items-center gap-0.5" style={{ color: accent }}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                "size-2.5 sm:size-3",
                i < filled ? "fill-current" : "opacity-30"
              )}
              aria-hidden
            />
          ))}
          <span className="ml-0.5 text-white/90">{rating.toFixed(1)}</span>
        </span>
      ) : null}
      {reviewCount != null && reviewCount > 0 ? (
        <span className="inline-flex items-center gap-1 text-white/70">
          <MessageCircle className="size-2.5 sm:size-3" aria-hidden />
          {formatCompactCount(reviewCount)} reviews
        </span>
      ) : null}
    </div>
  );
}

/**
 * Premium branded MoonVerse edition cover used when a novel has no real artwork.
 * Theme + layout are deterministic from themeSeed so thousands of novels stay varied.
 */
export function DefaultNovelCover({
  title,
  author,
  genres = [],
  language,
  rating,
  reviewCount,
  themeSeed,
  className,
  compact = false,
}: DefaultNovelCoverProps) {
  const seed = themeSeed || `${title}|${author ?? ""}`;
  const primaryGenres = genres.filter(Boolean).slice(0, 2);
  const theme = {
    ...pickTheme(seed, primaryGenres),
    edition: "Community Archive",
  };
  const layout = pickLayout(seed);

  return (
    <div
      className={cn(
        "@container relative flex h-full w-full flex-col overflow-hidden text-white",
        className
      )}
      style={{
        background: `linear-gradient(155deg, ${theme.from} 0%, ${theme.via} 48%, ${theme.to} 100%)`,
        color: theme.ink,
      }}
      role="img"
      aria-label={`${title}${author ? ` by ${author}` : ""}. MoonVerse edition cover.`}
    >
      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(90% 70% at 20% 15%, ${theme.glow}, transparent 55%), radial-gradient(70% 50% at 90% 85%, rgba(246,200,95,0.12), transparent 50%)`,
        }}
        aria-hidden
      />
      <StarField color={theme.star} />
      {(layout === "constellation" || layout === "moon") && (
        <ConstellationLines color={theme.accent} />
      )}
      {/* Subtle grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />
      {/* Glass edge */}
      <div
        className="pointer-events-none absolute inset-[1px] rounded-[inherit] border border-white/15"
        aria-hidden
      />

      {/* Top brand lockup — hidden on compact thumbnails (shelf tiles use their own overlays). */}
      {!compact ? (
        <div className="relative z-[1] flex items-start justify-between gap-2 px-[8%] pt-[7%]">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="inline-flex size-4 shrink-0 items-center justify-center rounded-full sm:size-5"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: theme.accent,
                }}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="size-[62%]" fill="currentColor">
                  <path d="M14.2 3.1A8.8 8.8 0 1 0 20.9 14 7.2 7.2 0 0 1 14.2 3.1Z" />
                </svg>
              </span>
              <p className="truncate font-serif text-[10px] font-black tracking-tight sm:text-xs">
                Moon<span style={{ color: theme.accent }}>Verse</span>
              </p>
            </div>
            <p
              className={cn(
                "mt-0.5 text-[6px] font-bold uppercase tracking-[0.16em] text-white/50",
                "hidden @[9rem]:block sm:text-[7px]"
              )}
            >
              Read · Review · Discover
            </p>
          </div>
          <Sparkles
            className="size-3 shrink-0 opacity-70 sm:size-3.5"
            style={{ color: theme.accent }}
            aria-hidden
          />
        </div>
      ) : null}

      {/* Center motif + title */}
      {!compact ? (
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-center px-[8%] py-[4%]">
          <div className="hidden @[8.5rem]:block">
            <CenterMotif
              layout={layout}
              accent={theme.accent}
              glow={theme.glow}
            />
          </div>

          <div className="@[8.5rem]:mt-2">
            <p
              className={cn(
                "line-clamp-3 font-serif font-bold leading-[1.1] tracking-tight drop-shadow",
                "text-[clamp(0.7rem,12cqw,1.35rem)]"
              )}
            >
              {title}
            </p>
            {author ? (
              <p className="mt-1 line-clamp-1 text-[clamp(0.55rem,7cqw,0.75rem)] font-medium text-white/70">
                {author}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="relative z-[1] flex min-h-0 flex-1 items-center justify-center px-[10%]">
          <CenterMotif layout="minimal" accent={theme.accent} glow={theme.glow} />
        </div>
      )}

      {/* Bottom meta */}
      <div
        className={cn(
          "relative z-[1] mt-auto space-y-1.5 border-t border-white/10 bg-black/20 px-[8%] py-[6%] backdrop-blur-[2px]",
          compact && "hidden"
        )}
      >
        <div className="hidden flex-wrap gap-1 @[10rem]:flex">
          {primaryGenres.map((genre) => (
            <span
              key={genre}
              className="rounded-full border border-white/15 bg-white/10 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-white/85 sm:text-[8px]"
            >
              {genre}
            </span>
          ))}
          {language ? (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-white/15 bg-white/10 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-white/85 sm:text-[8px]">
              <Languages className="size-2.5" aria-hidden />
              {language}
            </span>
          ) : null}
        </div>

        <div className="hidden @[9rem]:block">
          <RatingRow
            rating={rating}
            reviewCount={reviewCount}
            accent={theme.accent}
          />
        </div>

        <p
          className="text-[7px] font-bold uppercase tracking-[0.14em] sm:text-[8px]"
          style={{ color: theme.accent }}
        >
          {theme.edition} · MoonVerse
        </p>
      </div>
    </div>
  );
}
