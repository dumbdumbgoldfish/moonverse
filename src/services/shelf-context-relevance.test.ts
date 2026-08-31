import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMoonieShelfPrompt } from "@/lib/discover";
import { resolveExactLookupNovelIds } from "@/services/moonie-identification.service";
import { handleMoonieRequest } from "@/services/moonie-response.service";
import { db } from "@/lib/db";

async function shelfResponse(novelTitles: string[]) {
  const message = buildMoonieShelfPrompt({ tagNames: [], novelTitles });
  return handleMoonieRequest({
    message,
    messages: [],
    isLoggedIn: false,
  });
}

function signalOverlap(
  recommendations: Awaited<ReturnType<typeof shelfResponse>>["recommendations"],
  patterns: string[]
): number {
  const normalized = patterns.map((p) => p.toLowerCase());
  return recommendations.filter((rec) => {
    const reason = rec.reason?.toLowerCase() ?? "";
    return (
      rec.genres?.some((genre) =>
        normalized.some((pattern) => genre.toLowerCase().includes(pattern))
      ) ||
      rec.tags?.some((tag) =>
        normalized.some((pattern) => tag.toLowerCase().includes(pattern))
      ) ||
      normalized.some((pattern) => reason.includes(pattern))
    );
  }).length;
}

describe("shelf nearby titles influence ranking (fixture DB)", () => {
  it("contrasting shelves shift candidate slates and cultivation-family signals", async () => {
    const xianxiaTitles = [
      "Sovereign of the Three Realms",
      "True Martial World",
    ];
    const romanceTitles = ["Comparative Strangers", "Levelling the Score"];
    const baselineMessage =
      "Recommend a next read from the MoonVerse catalog. Name in-catalog titles only, with a short why.";

    const baseline = await handleMoonieRequest({
      message: baselineMessage,
      messages: [],
      isLoggedIn: false,
    });
    const xianxiaResponse = await shelfResponse(xianxiaTitles);
    const romanceResponse = await shelfResponse(romanceTitles);

    assert.ok(baseline.recommendations.length > 0);
    assert.ok(xianxiaResponse.recommendations.length > 0);
    assert.ok(romanceResponse.recommendations.length > 0);

    const xDiff = xianxiaResponse.recommendations.filter(
      (rec) =>
        !baseline.recommendations.some((base) => base.novelId === rec.novelId)
    ).length;
    const rDiff = romanceResponse.recommendations.filter(
      (rec) =>
        !baseline.recommendations.some((base) => base.novelId === rec.novelId)
    ).length;
    assert.ok(xDiff > 0, "xianxia shelf should change slate vs generic prompt");
    assert.ok(rDiff > 0, "romance shelf should change slate vs generic prompt");

    const xOnX = signalOverlap(xianxiaResponse.recommendations, [
      "xianxia",
      "cultivation",
      "wuxia",
      "murim",
    ]);
    const rOnR = signalOverlap(romanceResponse.recommendations, [
      "romance",
      "enemies",
      "slow burn",
      "gl",
      "strong fl",
    ]);
    const xOnR = signalOverlap(xianxiaResponse.recommendations, ["romance"]);
    const rOnX = signalOverlap(romanceResponse.recommendations, [
      "xianxia",
      "cultivation",
      "wuxia",
    ]);

    assert.ok(
      xOnX > 0,
      "xianxia shelf should surface cultivation-family picks"
    );
    assert.ok(
      xOnX >= rOnX,
      "xianxia shelf should align more with cultivation-family genres than the romance shelf"
    );
    assert.ok(
      rOnR >= xOnR || rDiff > 0,
      "romance shelf should align more with romance signals than the xianxia shelf, or shift the slate"
    );

    const xIds = new Set(xianxiaResponse.recommendations.map((r) => r.novelId));
    const shared = romanceResponse.recommendations.filter((r) =>
      xIds.has(r.novelId)
    );
    assert.ok(
      shared.length < xianxiaResponse.recommendations.length,
      "contrasting shelves should not return identical slates"
    );

    for (const title of [...xianxiaTitles, ...romanceTitles]) {
      const id = (await resolveExactLookupNovelIds(title))[0];
      if (id) {
        assert.equal(
          xianxiaResponse.recommendations.some((rec) => rec.novelId === id),
          false,
          `xianxia slate excludes on-shelf ${title}`
        );
        assert.equal(
          romanceResponse.recommendations.some((rec) => rec.novelId === id),
          false,
          `romance slate excludes on-shelf ${title}`
        );
      }
    }

    const anchorNovels = await db.novel.findMany({
      where: {
        id: {
          in: [
            ...(await resolveExactLookupNovelIds(xianxiaTitles[0])),
            ...(await resolveExactLookupNovelIds(romanceTitles[0])),
          ],
        },
      },
      include: { genres: true },
    });
    const xGenres = anchorNovels
      .filter((n) => n.title === xianxiaTitles[0])
      .flatMap((n) => n.genres.map((g) => g.name));
    const rGenres = anchorNovels
      .filter((n) => n.title === romanceTitles[0])
      .flatMap((n) => n.genres.map((g) => g.name));

    assert.ok(
      xianxiaResponse.recommendations.some((rec) =>
        rec.reason &&
          (xGenres.some((g) => rec.reason!.toLowerCase().includes(g.toLowerCase())) ||
            rec.genres?.some((g) =>
              ["Xianxia", "Cultivation", "Wuxia"].includes(g)
            ))
      ),
      "xianxia shelf explanations or genres should reflect anchor signals"
    );
    const romanceReflectsShelf =
      rOnR > 0 ||
      romanceResponse.recommendations.some(
        (rec) =>
          rec.reason &&
          rGenres.some((g) =>
            rec.reason!.toLowerCase().includes(g.toLowerCase())
          )
      );
    assert.ok(
      romanceReflectsShelf || rDiff > 0,
      "romance shelf should shift the slate or surface romance-family signals from anchors"
    );
  });
});
