import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function loadingRemoved(relativePath: string): void {
  assert.equal(
    existsSync(new URL(relativePath, import.meta.url)),
    false,
    `expected ${relativePath} to be removed`
  );
}

describe("route loading presentation", () => {
  it("keeps community loading copy in sr-only status", () => {
    const community = source("../../app/community/loading.tsx");
    const literaryFallback = source("./LiteraryStreamingFallback.tsx");
    assert.match(community, /LiteraryStreamingFallback/);
    assert.match(literaryFallback, /sr-only/);
    assert.match(community, /Loading the community feed/);
    assert.doesNotMatch(
      community,
      /text-(?:lg|xl|2xl|3xl).{0,40}Loading the community feed/
    );
  });

  it("uses a dark compact Moonie fallback instead of a white headline", () => {
    const mooniePage = source("../../app/moonie/page.tsx");
    const moonieLoading = source("../../app/moonie/loading.tsx");
    const deskLoading = source("./PageRouteLoading.tsx");
    assert.match(moonieLoading, /tone="moonie"/);
    assert.match(moonieLoading, /variant="desk"/);
    assert.match(mooniePage, /MoonieDeskRoute/);
    assert.match(mooniePage, /serverRoute/);
    assert.match(deskLoading, /min-h-\[calc\(100dvh/);
    assert.doesNotMatch(mooniePage, /loadLatestMoonieConversationAction/);
    assert.doesNotMatch(
      mooniePage,
      /text-(?:lg|xl|2xl).{0,80}Restoring this conversation…/
    );
  });

  it("removes disruptive browse hub and genre route loading screens", () => {
    loadingRemoved("../../app/browse/loading.tsx");
    loadingRemoved("../../app/browse/[genre]/loading.tsx");
    const browsePage = source("../../app/browse/page.tsx");
    const genrePage = source("../../app/browse/[genre]/page.tsx");
    assert.doesNotMatch(browsePage, /PageRouteLoading/);
    assert.doesNotMatch(browsePage, /Open the stacks/);
    assert.doesNotMatch(genrePage, /PageRouteLoading/);
    assert.doesNotMatch(genrePage, /Loading browse…/);
    assert.match(genrePage, /LiteraryStreamingFallback/);
  });

  it("keeps search streaming on inline skeleton without headline flash", () => {
    loadingRemoved("../../app/search/loading.tsx");
    const searchPage = source("../../app/search/page.tsx");
    assert.doesNotMatch(searchPage, /PageRouteLoading/);
    assert.match(searchPage, /SearchStreamingFallback/);
    assert.doesNotMatch(searchPage, /title="Search"/);
  });

  it("keeps Discover streaming without full-page headline flash", () => {
    loadingRemoved("../../app/discover/loading.tsx");
    const discoverPage = source("../../app/discover/page.tsx");
    assert.doesNotMatch(discoverPage, /PageRouteLoading/);
    assert.doesNotMatch(discoverPage, /Discover reads worth finishing/);
    assert.match(discoverPage, /LiteraryStreamingFallback/);
    assert.match(discoverPage, /ReviewsSalonShelvesSkeleton/);
  });

  it("removes home, folders, and search route loading screens", () => {
    loadingRemoved("../../app/home/loading.tsx");
    loadingRemoved("../../app/folders/loading.tsx");
    loadingRemoved("../../app/search/loading.tsx");
  });

  it("keeps review detail and reviews index on inline skeletons", () => {
    const reviewsLoading = source("../../app/reviews/loading.tsx");
    const reviewDetailLoading = source("../../app/reviews/[id]/loading.tsx");
    assert.match(reviewsLoading, /LiteraryStreamingFallback/);
    assert.doesNotMatch(reviewsLoading, /PageHeader/);
    assert.match(reviewDetailLoading, /sr-only/);
    assert.doesNotMatch(reviewDetailLoading, /PageRouteLoading/);
  });

  it("keeps admin and settings on inline skeleton shells", () => {
    const adminLoading = source("../../app/admin/loading.tsx");
    const settingsLoading = source("../../app/settings/loading.tsx");
    assert.match(adminLoading, /sr-only/);
    assert.doesNotMatch(adminLoading, /PageRouteLoading/);
    assert.match(settingsLoading, /sr-only/);
    assert.doesNotMatch(settingsLoading, /PageRouteLoading/);
  });

  it("keeps nav search interactive without useSearchParams", () => {
    const search = source("../landing/NavInlineSearch.tsx");
    assert.doesNotMatch(search, /useSearchParams/);
    assert.match(search, /window\.location\.search/);
    assert.match(search, /event\.key === "Enter"/);
    assert.match(search, /submitSearch\(\)/);
  });

  it("keeps AppClientChrome as a dynamic layout boundary", () => {
    const chrome = source("./AppClientChrome.tsx");
    assert.match(chrome, /dynamic\(\(\) =>/);
    assert.match(chrome, /AppChrome/);
  });
});
