import type { LucideIcon } from "lucide-react";
import {
  Atom,
  Brain,
  Castle,
  Crown,
  Flame,
  Gamepad2,
  Ghost,
  Globe,
  GraduationCap,
  Heart,
  Laugh,
  Leaf,
  Moon,
  Mountain,
  Rocket,
  Scroll,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Telescope,
  Timer,
  Users,
  Wand2,
  Zap,
  Bug,
  Building2,
  Eye,
  Gem,
  HandMetal,
  Landmark,
  Layers,
  Orbit,
  Palette,
  Radio,
  RefreshCw,
  RotateCcw,
  Scale,
  Ship,
  Skull as DemonIcon,
  Star,
  Sword,
  Target,
  Tent,
  Trophy,
  UserRound,
  Wind,
} from "lucide-react";

export interface WebNovelGenre {
  name: string;
  slug: string;
  icon: LucideIcon;
  gradient: string;
}

/** Web novel genres shown in Browse, landing page and search */
export const WEB_NOVEL_GENRES: WebNovelGenre[] = [
  { name: "Romance", slug: "romance", icon: Heart, gradient: "from-pink-400 to-rose-500" },
  { name: "Fantasy", slug: "fantasy", icon: Sparkles, gradient: "from-violet-500 to-purple-600" },
  { name: "Action", slug: "action", icon: Swords, gradient: "from-red-500 to-orange-600" },
  { name: "Adventure", slug: "adventure", icon: Flame, gradient: "from-orange-400 to-red-500" },
  { name: "Mystery", slug: "mystery", icon: Telescope, gradient: "from-cyan-500 to-blue-600" },
  { name: "Thriller", slug: "thriller", icon: Zap, gradient: "from-red-600 to-rose-700" },
  { name: "Horror", slug: "horror", icon: Ghost, gradient: "from-slate-600 to-slate-900" },
  { name: "Comedy", slug: "comedy", icon: Laugh, gradient: "from-amber-400 to-yellow-500" },
  { name: "Slice of Life", slug: "slice-of-life", icon: Leaf, gradient: "from-lime-400 to-green-500" },
  { name: "Historical", slug: "historical", icon: Landmark, gradient: "from-amber-600 to-yellow-700" },
  { name: "Science Fiction", slug: "sci-fi", icon: Rocket, gradient: "from-emerald-400 to-teal-600" },
  { name: "Xianxia", slug: "xianxia", icon: Scroll, gradient: "from-amber-500 to-orange-600" },
  { name: "Wuxia", slug: "wuxia", icon: Sword, gradient: "from-stone-500 to-stone-700" },
  { name: "Murim", slug: "murim", icon: HandMetal, gradient: "from-stone-600 to-amber-800" },
  { name: "Cultivation", slug: "cultivation", icon: Crown, gradient: "from-yellow-500 to-amber-600" },
  { name: "Apocalypse", slug: "apocalypse", icon: Skull, gradient: "from-gray-600 to-red-900" },
  { name: "System", slug: "system", icon: Layers, gradient: "from-blue-500 to-indigo-600" },
  { name: "Reincarnation", slug: "reincarnation", icon: RefreshCw, gradient: "from-indigo-400 to-violet-600" },
  { name: "Transmigration", slug: "transmigration", icon: Globe, gradient: "from-teal-400 to-cyan-600" },
  { name: "Regression", slug: "regression", icon: RotateCcw, gradient: "from-purple-500 to-fuchsia-600" },
  { name: "Villainess", slug: "villainess", icon: Gem, gradient: "from-rose-400 to-pink-600" },
  { name: "BL", slug: "bl", icon: Heart, gradient: "from-sky-400 to-indigo-500" },
  { name: "GL", slug: "gl", icon: Heart, gradient: "from-fuchsia-400 to-pink-500" },
  { name: "LGBTQ+", slug: "lgbtq", icon: Palette, gradient: "from-pink-500 via-purple-500 to-blue-500" },
  { name: "School Life", slug: "school-life", icon: GraduationCap, gradient: "from-blue-400 to-cyan-500" },
  { name: "Supernatural", slug: "supernatural", icon: Moon, gradient: "from-indigo-500 to-purple-700" },
  { name: "Urban", slug: "urban", icon: Building2, gradient: "from-slate-500 to-slate-700" },
  { name: "Military", slug: "military", icon: Shield, gradient: "from-green-600 to-emerald-800" },
  { name: "Crime", slug: "crime", icon: Target, gradient: "from-neutral-600 to-neutral-900" },
  { name: "Psychological", slug: "psychological", icon: Brain, gradient: "from-violet-600 to-purple-800" },
  { name: "Drama", slug: "drama", icon: Eye, gradient: "from-rose-400 to-pink-600" },
  { name: "Family", slug: "family", icon: Users, gradient: "from-orange-300 to-amber-500" },
  { name: "Sports", slug: "sports", icon: Trophy, gradient: "from-green-400 to-teal-500" },
  { name: "Gaming", slug: "gaming", icon: Gamepad2, gradient: "from-purple-500 to-violet-700" },
  { name: "Virtual Reality", slug: "virtual-reality", icon: Orbit, gradient: "from-cyan-400 to-blue-600" },
  { name: "Time Travel", slug: "time-travel", icon: Timer, gradient: "from-blue-500 to-indigo-700" },
  { name: "Isekai", slug: "isekai", icon: Wand2, gradient: "from-fuchsia-500 to-violet-600" },
  { name: "Steampunk", slug: "steampunk", icon: Ship, gradient: "from-amber-500 to-orange-700" },
  { name: "Cyberpunk", slug: "cyberpunk", icon: Radio, gradient: "from-cyan-400 to-fuchsia-600" },
  { name: "Survival", slug: "survival", icon: Tent, gradient: "from-stone-500 to-amber-700" },
  { name: "Kingdom Building", slug: "kingdom-building", icon: Castle, gradient: "from-yellow-500 to-orange-600" },
  { name: "Politics", slug: "politics", icon: Scale, gradient: "from-slate-600 to-slate-800" },
  { name: "Magic", slug: "magic", icon: Wand2, gradient: "from-violet-400 to-purple-600" },
  { name: "Martial Arts", slug: "martial-arts", icon: HandMetal, gradient: "from-orange-500 to-amber-700" },
  { name: "Mecha", slug: "mecha", icon: Atom, gradient: "from-slate-500 to-blue-700" },
  { name: "Monsters", slug: "monsters", icon: Bug, gradient: "from-lime-600 to-green-800" },
  { name: "Vampire", slug: "vampire", icon: Moon, gradient: "from-red-800 to-purple-900" },
  { name: "Werewolf", slug: "werewolf", icon: Wind, gradient: "from-gray-600 to-slate-800" },
  { name: "Demons", slug: "demons", icon: DemonIcon, gradient: "from-red-700 to-black" },
  { name: "Angels", slug: "angels", icon: Star, gradient: "from-sky-300 to-indigo-400" },
  { name: "Mythology", slug: "mythology", icon: Mountain, gradient: "from-amber-500 to-yellow-600" },
  { name: "LitRPG", slug: "litrpg", icon: Gamepad2, gradient: "from-blue-500 to-indigo-600" },
  { name: "Paranormal", slug: "paranormal", icon: Ghost, gradient: "from-purple-600 to-violet-800" },
  { name: "Dystopian", slug: "dystopian", icon: Shield, gradient: "from-gray-500 to-gray-800" },
  { name: "YA", slug: "ya", icon: UserRound, gradient: "from-lime-400 to-green-500" },
];

export const GENRE_SEED_DATA = WEB_NOVEL_GENRES.map(({ name, slug }) => ({ name, slug }));

export function genreBrowseHref(slug: string): string {
  return `/browse/${encodeURIComponent(slug)}`;
}

export function genreLabel(slug: string): string {
  return (
    WEB_NOVEL_GENRES.find((g) => g.slug === slug)?.name ??
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
