/**
 * Generates anime/manhwa-inspired demo profile SVG assets (original stylized art, not copyrighted scans).
 */

import { mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const DEMO_AVATAR_DIR = join(process.cwd(), "public/demo/avatars");
export const DEMO_BANNER_DIR = join(process.cwd(), "public/demo/banners");
export const DEMO_AVATAR_COUNT = 48;
export const DEMO_BANNER_COUNT = 48;

/** Series-inspired palette themes (original artwork only). */
const AVATAR_THEMES = [
  { name: "straw-sea", hair: "#1a2744", skin: "#f5d0b5", accent: "#e63946", eye: "#2ec4b6", outfit: "#ffd166" },
  { name: "devil-fruit", hair: "#4a1942", skin: "#e8c4a8", accent: "#9b5de5", eye: "#00bbf9", outfit: "#f15bb5" },
  { name: "grand-line", hair: "#0d3b66", skin: "#f4c095", accent: "#ee6c4d", eye: "#3d5a80", outfit: "#98c1d9" },
  { name: "noble-silver", hair: "#e8e8e8", skin: "#f0e6dc", accent: "#7b2cbf", eye: "#c77dff", outfit: "#240046" },
  { name: "clan-shadow", hair: "#1b1b2f", skin: "#dbcbbd", accent: "#e94560", eye: "#ff6b6b", outfit: "#16213e" },
  { name: "awakened-blood", hair: "#2d132c", skin: "#e8d5c4", accent: "#c9184a", eye: "#ff4d6d", outfit: "#590d22" },
  { name: "eleceed-lightning", hair: "#fef9ef", skin: "#f5e6d3", accent: "#ffc300", eye: "#4cc9f0", outfit: "#023047" },
  { name: "stray-cat", hair: "#6c584c", skin: "#f2e8cf", accent: "#ff9f1c", eye: "#80b918", outfit: "#495057" },
  { name: "hunter-guild", hair: "#14213d", skin: "#e5d4c0", accent: "#fca311", eye: "#00a896", outfit: "#005f73" },
  { name: "tower-climber", hair: "#5c4d7d", skin: "#eddcd2", accent: "#b56576", eye: "#6d597a", outfit: "#355070" },
  { name: "solo-player", hair: "#03045e", skin: "#e8d5b7", accent: "#00b4d8", eye: "#90e0ef", outfit: "#0077b6" },
  { name: "regressor", hair: "#3d405b", skin: "#f4f1de", accent: "#e07a5f", eye: "#81b29a", outfit: "#3d5a80" },
  { name: "villainess-tea", hair: "#5c0037", skin: "#f8e1e7", accent: "#c9184a", eye: "#ff758f", outfit: "#800f2f" },
  { name: "duke-garden", hair: "#2d6a4f", skin: "#f0ead2", accent: "#40916c", eye: "#52b788", outfit: "#1b4332" },
  { name: "murim-wind", hair: "#1b263b", skin: "#e9d8a6", accent: "#ee9b00", eye: "#ca6702", outfit: "#335c67" },
  { name: "sect-elder", hair: "#4a4e69", skin: "#e0d8c3", accent: "#9a8c98", eye: "#c9ada7", outfit: "#22223b" },
  { name: "spirit-beast", hair: "#588157", skin: "#f4e8c1", accent: "#a3b18a", eye: "#dad7cd", outfit: "#3a5a40" },
  { name: "dungeon-snack", hair: "#6a040f", skin: "#ffddd2", accent: "#dc2f02", eye: "#e85d04", outfit: "#370617" },
  { name: "isekai-commute", hair: "#4a5859", skin: "#f8edeb", accent: "#b5838d", eye: "#6d6875", outfit: "#e5989b" },
  { name: "romance-goblin", hair: "#ffafcc", skin: "#fff0f3", accent: "#ff4d6d", eye: "#c9184a", outfit: "#a4133c" },
  { name: "cosmic-horror", hair: "#10002b", skin: "#c8b6ff", accent: "#7b2cbf", eye: "#e0aaff", outfit: "#240046" },
  { name: "cyber-neon", hair: "#0a0a0a", skin: "#d4d4d4", accent: "#ff00ff", eye: "#00ffff", outfit: "#1a1a2e" },
  { name: "school-rooftop", hair: "#264653", skin: "#fefae0", accent: "#e9c46a", eye: "#2a9d8f", outfit: "#e76f51" },
  { name: "moonie-disciple", hair: "#2b2d42", skin: "#edf2f4", accent: "#ef233c", eye: "#8d99ae", outfit: "#d90429" },
] as const;

const BANNER_THEMES = [
  { sky: ["#1d3557", "#457b9d"], ground: "#1d3557", accent: "#e63946", motif: "waves" },
  { sky: ["#240046", "#7b2cbf"], ground: "#10002b", accent: "#e0aaff", motif: "castle" },
  { sky: ["#023047", "#00b4d8"], ground: "#03045e", accent: "#ffc300", motif: "lightning" },
  { sky: ["#1b4332", "#40916c"], ground: "#081c15", accent: "#95d5b2", motif: "mountains" },
  { sky: ["#370617", "#9d0208"], ground: "#6a040f", accent: "#ffba08", motif: "sunset" },
  { sky: ["#3d405b", "#81b29a"], ground: "#2b2d42", accent: "#f2cc8f", motif: "city" },
  { sky: ["#5c0037", "#c9184a"], ground: "#800f2f", accent: "#ffccd5", motif: "garden" },
  { sky: ["#0d1b2a", "#1b263b"], ground: "#415a77", accent: "#778da9", motif: "night" },
] as const;

function avatarSvg(index: number): string {
  const theme = AVATAR_THEMES[index % AVATAR_THEMES.length];
  const hairStyle = index % 4;
  const hairPath =
    hairStyle === 0
      ? `<path d="M40 95 Q100 20 160 95 L150 130 Q100 80 50 130 Z" fill="${theme.hair}"/>`
      : hairStyle === 1
        ? `<ellipse cx="100" cy="70" rx="62" ry="48" fill="${theme.hair}"/><rect x="38" y="70" width="124" height="40" fill="${theme.hair}"/>`
        : hairStyle === 2
          ? `<path d="M45 100 C55 30 145 30 155 100 L140 125 Q100 60 60 125 Z" fill="${theme.hair}"/>`
          : `<path d="M35 90 Q100 10 165 90 L155 135 Q100 75 45 135 Z" fill="${theme.hair}"/><circle cx="65" cy="55" r="18" fill="${theme.hair}"/><circle cx="135" cy="55" r="18" fill="${theme.hair}"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="Demo avatar ${String(index + 1).padStart(3, "0")}">
  <defs>
    <linearGradient id="bg-${index}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${theme.outfit}" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="24" fill="url(#bg-${index})"/>
  <circle cx="100" cy="108" r="52" fill="${theme.skin}"/>
  ${hairPath}
  <ellipse cx="82" cy="108" rx="8" ry="10" fill="${theme.eye}"/>
  <ellipse cx="118" cy="108" rx="8" ry="10" fill="${theme.eye}"/>
  <circle cx="84" cy="106" r="3" fill="#111"/>
  <circle cx="120" cy="106" r="3" fill="#111"/>
  <path d="M88 128 Q100 136 112 128" stroke="#b56576" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M55 165 Q100 145 145 165 L145 200 L55 200 Z" fill="${theme.outfit}"/>
  <circle cx="100" cy="158" r="6" fill="${theme.accent}" opacity="0.9"/>
</svg>`;
}

function bannerMotif(motif: string, accent: string): string {
  switch (motif) {
    case "waves":
      return `<path d="M0 260 Q120 220 240 260 T480 260 T720 260 T960 260 T1200 260 V400 H0Z" fill="${accent}" opacity="0.25"/>`;
    case "castle":
      return `<rect x="520" y="180" width="160" height="120" fill="${accent}" opacity="0.2"/><polygon points="520,180 600,120 680,180" fill="${accent}" opacity="0.3"/>`;
    case "lightning":
      return `<polygon points="600,80 560,200 610,200 570,320" fill="${accent}" opacity="0.35"/>`;
    case "mountains":
      return `<polygon points="0,280 300,120 600,280" fill="${accent}" opacity="0.2"/><polygon points="400,280 750,90 1200,280" fill="${accent}" opacity="0.15"/>`;
    case "sunset":
      return `<circle cx="900" cy="120" r="70" fill="${accent}" opacity="0.35"/>`;
    case "city":
      return `<rect x="80" y="200" width="50" height="100" fill="${accent}" opacity="0.2"/><rect x="160" y="160" width="70" height="140" fill="${accent}" opacity="0.25"/><rect x="280" y="190" width="60" height="110" fill="${accent}" opacity="0.2"/>`;
    case "garden":
      return `<circle cx="200" cy="250" r="40" fill="${accent}" opacity="0.2"/><circle cx="280" cy="240" r="30" fill="${accent}" opacity="0.25"/><circle cx="340" cy="255" r="35" fill="${accent}" opacity="0.2"/>`;
    default:
      return `<circle cx="200" cy="80" r="3" fill="white" opacity="0.8"/><circle cx="350" cy="60" r="2" fill="white" opacity="0.6"/><circle cx="500" cy="90" r="2.5" fill="white" opacity="0.7"/>`;
  }
}

function bannerSvg(index: number): string {
  const theme = BANNER_THEMES[index % BANNER_THEMES.length];
  const motif = bannerMotif(theme.motif, theme.accent);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" role="img" aria-label="Demo banner ${String(index + 1).padStart(3, "0")}">
  <defs>
    <linearGradient id="sky-${index}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${theme.sky[0]}"/>
      <stop offset="100%" stop-color="${theme.sky[1]}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="400" fill="url(#sky-${index})"/>
  ${motif}
  <rect y="300" width="1200" height="100" fill="${theme.ground}" opacity="0.55"/>
</svg>`;
}

const RASTER_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"] as const;
const ALL_IMAGE_EXTENSIONS = [...RASTER_EXTENSIONS, ".svg"] as const;

function isImageFile(name: string): boolean {
  const lower = name.toLowerCase();
  return ALL_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function extensionRank(name: string): number {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return 0;
  if (lower.endsWith(".webp")) return 1;
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return 2;
  return 3;
}

/** Lists local demo avatar URLs; prefers raster webtoon art over SVG fallbacks. */
export function listDemoAvatarPaths(): string[] {
  if (!existsSync(DEMO_AVATAR_DIR)) return [];
  const files = readdirSync(DEMO_AVATAR_DIR).filter(isImageFile);
  const raster = files.filter((f) =>
    RASTER_EXTENSIONS.some((ext) => f.toLowerCase().endsWith(ext))
  );
  const pool = raster.length > 0 ? raster : files.filter((f) => f.toLowerCase().endsWith(".svg"));
  return pool
    .sort((a, b) => extensionRank(a) - extensionRank(b) || a.localeCompare(b))
    .map((file) => `/demo/avatars/${file}`);
}

/** Lists local demo banner URLs; prefers raster webtoon art over SVG fallbacks. */
export function listDemoBannerPaths(): string[] {
  if (!existsSync(DEMO_BANNER_DIR)) return [];
  const files = readdirSync(DEMO_BANNER_DIR).filter(isImageFile);
  const raster = files.filter((f) =>
    RASTER_EXTENSIONS.some((ext) => f.toLowerCase().endsWith(ext))
  );
  const pool = raster.length > 0 ? raster : files.filter((f) => f.toLowerCase().endsWith(".svg"));
  return pool
    .sort((a, b) => extensionRank(a) - extensionRank(b) || a.localeCompare(b))
    .map((file) => `/demo/banners/${file}`);
}

/** Assign avatar/banner pairs; never repeats the exact pair on consecutive users. */
export function assignProfileAssetPairs(
  count: number,
  avatars: string[],
  banners: string[]
): Array<{ avatarUrl: string; profileBackgroundUrl: string }> {
  const avatarStep = 7;
  const bannerStep = 11;
  const pairs: Array<{ avatarUrl: string; profileBackgroundUrl: string }> = [];
  let prevKey = "";

  for (let i = 0; i < count; i++) {
    let avatarIdx = (i * avatarStep) % avatars.length;
    let bannerIdx = (i * bannerStep + Math.floor(i / avatars.length)) % banners.length;
    let key = `${avatarIdx}:${bannerIdx}`;

    let guard = 0;
    while ((key === prevKey || !avatars[avatarIdx] || !banners[bannerIdx]) && guard++ < banners.length * 2) {
      bannerIdx = (bannerIdx + 1) % banners.length;
      key = `${avatarIdx}:${bannerIdx}`;
    }
    if (key === prevKey) {
      avatarIdx = (avatarIdx + 1) % avatars.length;
      key = `${avatarIdx}:${bannerIdx}`;
    }

    prevKey = key;
    pairs.push({
      avatarUrl: avatars[avatarIdx],
      profileBackgroundUrl: banners[bannerIdx],
    });
  }

  return pairs;
}

export function ensureDemoProfileAssets(): { avatars: number; banners: number } {
  mkdirSync(DEMO_AVATAR_DIR, { recursive: true });
  mkdirSync(DEMO_BANNER_DIR, { recursive: true });

  const existingAvatars = listDemoAvatarPaths();
  const existingBanners = listDemoBannerPaths();
  if (existingAvatars.length > 0 && existingBanners.length > 0) {
    return { avatars: 0, banners: 0 };
  }

  let avatarsWritten = 0;
  let bannersWritten = 0;

  for (let i = 0; i < DEMO_AVATAR_COUNT; i++) {
    const filename = `avatar-${String(i + 1).padStart(3, "0")}.svg`;
    const filepath = join(DEMO_AVATAR_DIR, filename);
    if (!existsSync(filepath)) {
      writeFileSync(filepath, avatarSvg(i), "utf8");
      avatarsWritten++;
    }
  }

  for (let i = 0; i < DEMO_BANNER_COUNT; i++) {
    const filename = `banner-${String(i + 1).padStart(3, "0")}.svg`;
    const filepath = join(DEMO_BANNER_DIR, filename);
    if (!existsSync(filepath)) {
      writeFileSync(filepath, bannerSvg(i), "utf8");
      bannersWritten++;
    }
  }

  return { avatars: avatarsWritten, banners: bannersWritten };
}

export function countExistingDemoAssets(): { avatars: number; banners: number } {
  return {
    avatars: listDemoAvatarPaths().length,
    banners: listDemoBannerPaths().length,
  };
}
