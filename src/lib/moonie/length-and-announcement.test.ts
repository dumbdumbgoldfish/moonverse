import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  effectiveNovelLengthBand,
  inferLengthBandFromChapterCount,
  novelMatchesHardConstraints,
} from "@/lib/moonie/hard-constraints";
import {
  isPlatformAnnouncementMessage,
  parsePlatformAnnouncementMessage,
  PLATFORM_ANNOUNCEMENT_HEADLINE,
} from "@/lib/notifications/platform-announcement";

describe("novel length from chapterCount", () => {
  it("infers short length from chapter counts when lengthBand is missing", () => {
    assert.equal(inferLengthBandFromChapterCount(42), "short");
    assert.equal(
      effectiveNovelLengthBand({ lengthBand: null, chapterCount: 42 }),
      "short"
    );
    assert.equal(
      novelMatchesHardConstraints(
        {
          genres: ["Fantasy"],
          publicationStatus: "Completed",
          lengthBand: null,
          chapterCount: 42,
        },
        {
          genres: [],
          tags: [],
          inclusionMatch: "all",
          genreMatch: "all",
          status: "completed",
          language: null,
          length: "short",
        }
      ),
      true
    );
  });

  it("does not treat unknown length as short", () => {
    assert.equal(
      novelMatchesHardConstraints(
        {
          genres: ["Fantasy"],
          publicationStatus: "Completed",
          lengthBand: null,
          chapterCount: null,
        },
        {
          genres: [],
          tags: [],
          inclusionMatch: "all",
          genreMatch: "all",
          status: "completed",
          language: null,
          length: "short",
        }
      ),
      false
    );
  });
});

describe("platform announcements", () => {
  it("parses broadcast prefix and headline", () => {
    assert.equal(isPlatformAnnouncementMessage("[Platform] hi"), true);
    assert.equal(parsePlatformAnnouncementMessage("[Platform] hi"), "hi");
    assert.equal(PLATFORM_ANNOUNCEMENT_HEADLINE, "MoonVerse · System announcement");
    assert.equal(isPlatformAnnouncementMessage("Weekly digest"), false);
  });
});
