import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("route loading presentation", () => {
  it("keeps community loading copy in sr-only status", () => {
    const community = source("../../app/community/loading.tsx");
    assert.match(community, /sr-only/);
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
    assert.doesNotMatch(mooniePage, /text-(?:lg|xl|2xl).{0,80}Restoring this conversation…/);
  });

  it("keeps Browse behind a catalogue loading shell", () => {
    const browse = source("../../app/browse/loading.tsx");
    const genre = source("../../app/browse/[genre]/loading.tsx");
    assert.match(browse, /Loading the catalogue/);
    assert.match(browse, /Open the stacks/);
    assert.match(genre, /Loading this genre shelf/);
  });

  it("keeps Search behind the same page shell instead of empty fallback copy", () => {
    const searchPage = source("../../app/search/page.tsx");
    const searchLoading = source("../../app/search/loading.tsx");
    assert.match(searchPage, /PageRouteLoading/);
    assert.match(searchLoading, /PageRouteLoading/);
    assert.doesNotMatch(searchPage, /Loading the stacks/);
  });

  it("keeps Discover behind PageRouteLoading in page and loading routes", () => {
    const discoverPage = source("../../app/discover/page.tsx");
    const discoverLoading = source("../../app/discover/loading.tsx");
    assert.match(discoverPage, /PageRouteLoading/);
    assert.match(discoverLoading, /PageRouteLoading/);
    assert.doesNotMatch(discoverPage, /Loading Discover…/);
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
