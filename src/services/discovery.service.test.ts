import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  uniqueContinueReadingByNovelId,
  uniqueShelfCovers,
} from "@/services/discovery.service";

describe("uniqueShelfCovers", () => {
  it("does not let early missing covers hide later real artwork", () => {
    const result = uniqueShelfCovers(
      [
        { novelId: "missing-1", title: "Missing One", coverUrl: null },
        { novelId: "missing-2", title: "Missing Two", coverUrl: "" },
        {
          novelId: "real-1",
          title: "Real One",
          coverUrl: "https://covers.openlibrary.org/b/id/1-M.jpg",
        },
        {
          novelId: "real-2",
          title: "Real Two",
          coverUrl: "https://covers.openlibrary.org/b/id/2-M.jpg",
        },
      ],
      3
    );

    assert.deepEqual(result.coverUrls, [
      "https://covers.openlibrary.org/b/id/1-M.jpg",
      "https://covers.openlibrary.org/b/id/2-M.jpg",
    ]);
    assert.deepEqual(result.novelTitles, [
      "Missing One",
      "Missing Two",
      "Real One",
    ]);
  });
});

describe("uniqueContinueReadingByNovelId", () => {
  it("dedupes novel-cover rails by novelId without dropping distinct works", () => {
    const firstBeast = {
      id: "review-beast-1",
      novelId: "novel-beast",
      novelTitle: "The Number of the Beast",
      title: "First saved review",
    };
    const secondBeast = {
      id: "review-beast-2",
      novelId: "novel-beast",
      novelTitle: "The Number of the Beast",
      title: "Second saved review",
    };
    const other = {
      id: "review-other",
      novelId: "novel-other",
      novelTitle: "Other Work",
      title: "Other review",
    };

    const result = uniqueContinueReadingByNovelId([
      firstBeast,
      secondBeast,
      other,
    ] as never);

    assert.equal(result.length, 2);
    assert.equal(result[0]?.id, "review-beast-1");
    assert.equal(result[0]?.novelId, "novel-beast");
    assert.equal(result[1]?.novelId, "novel-other");
  });
});

describe("landing genre door covers", () => {
  it("keeps door preview selection in landing-door-covers helper", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(
        new URL("./discovery.service.ts", import.meta.url),
        "utf8"
      )
    );
    assert.match(source, /pickLandingDoorCovers/);
    assert.doesNotMatch(source, /const pool = withArt/);
  });
});
