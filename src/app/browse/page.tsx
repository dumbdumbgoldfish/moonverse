import { BrowseFeaturedStacks } from "@/components/browse/BrowseFeaturedStacks";
import { BrowseFullIndex } from "@/components/browse/BrowseFullIndex";
import { BrowseHubHero } from "@/components/browse/BrowseHubHero";
import { BrowseLabPresets } from "@/components/browse/BrowseLabPresets";
import { BrowseMoodStrip } from "@/components/browse/BrowseMoodStrip";
import { BrowseProofRail } from "@/components/browse/BrowseProofRail";
import { BrowseRankingExplainer } from "@/components/browse/BrowseRankingExplainer";
import { WEB_NOVEL_GENRES } from "@/lib/genres";
import { LITERARY_PAGE_BG } from "@/lib/literary-salon";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { getBrowseHubPayload } from "@/services/browse-hub.service";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Browse · MoonVerse",
  description:
    "Open the MoonVerse catalogue by genre shelves, transparent ranking, official links, and Ask Moonie when mood beats filters.",
};

export const dynamic = "force-dynamic";

const LAB_PRESETS = [
  {
    id: "romance-etl",
    title: "Romance · enemies to lovers",
    blurb: "Works mode with community-strength ranking.",
    href: "/browse/romance?tags=enemies-to-lovers&sort=community-strength",
  },
  {
    id: "fantasy-official",
    title: "Fantasy · official link",
    blurb: "Catalogue confidence bias toward verified reading links.",
    href: "/browse/fantasy?link=official&sort=catalogue-confidence",
  },
  {
    id: "litrpg-fresh",
    title: "LitRPG · fresh discussion",
    blurb: "Reviews-first shelf sorted by recent community activity.",
    href: "/browse/litrpg?mode=reviews&sort=new",
  },
] as const;

export default async function BrowseHubPage() {
  const { shelves, proofRail } = await getBrowseHubPayload(
    WEB_NOVEL_GENRES.map((genre) => ({ slug: genre.slug, name: genre.name })),
  );

  return (
    <main
      className={cn(
        LITERARY_PAGE_BG,
        SITE_SHELL_CLASS,
        "safe-bottom-pad relative py-8 text-night-blue sm:py-10",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,_rgba(200,155,74,0.12),_transparent_55%)]"
      />

      <BrowseHubHero />

      <BrowseProofRail works={proofRail} />

      <div className="mt-10 space-y-10">
        <BrowseFeaturedStacks shelves={shelves} />

        <BrowseLabPresets presets={[...LAB_PRESETS]} />

        <BrowseRankingExplainer />

        <BrowseFullIndex genres={WEB_NOVEL_GENRES} />

        <BrowseMoodStrip />
      </div>
    </main>
  );
}
