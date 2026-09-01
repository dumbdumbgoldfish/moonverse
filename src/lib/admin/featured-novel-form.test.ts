import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  datetimeLocalToIso,
  findNovelSelectOption,
  formatNovelSelectLabel,
  isValidDatetimeLocalValue,
} from "@/lib/admin/featured-novel-form";
import type { NovelSelectOption } from "@/services/novel.service";

const novelA: NovelSelectOption = {
  id: "novel-a",
  title: "Gravity's Rainbow",
  author: "Thomas Pynchon",
  genres: ["Literary"],
  reviewCount: 2,
  verifiedSourceCount: 1,
};

const novelB: NovelSelectOption = {
  id: "novel-b",
  title: "The Hidden Oracle",
  author: "Rick Riordan",
  genres: ["Fantasy"],
  reviewCount: 5,
  verifiedSourceCount: 0,
};

describe("formatNovelSelectLabel", () => {
  it("includes author when present", () => {
    assert.equal(
      formatNovelSelectLabel(novelA),
      "Gravity's Rainbow: Thomas Pynchon"
    );
  });
});

describe("findNovelSelectOption", () => {
  it("returns the novel matching the submitted id", () => {
    const found = findNovelSelectOption([novelA, novelB], "novel-a");
    assert.equal(found?.id, "novel-a");
    assert.equal(found?.title, novelA.title);
  });
});

describe("datetime-local featured end time", () => {
  it("accepts empty optional end date", () => {
    assert.equal(datetimeLocalToIso(""), undefined);
    assert.equal(datetimeLocalToIso("   "), undefined);
  });

  it("preserves entered local date/time for ISO persistence", () => {
    const iso = datetimeLocalToIso("2027-09-09T09:07");
    assert.ok(iso);
    const parsed = new Date(iso!);
    assert.equal(parsed.getFullYear(), 2027);
    assert.equal(parsed.getMonth(), 8);
    assert.equal(parsed.getDate(), 9);
    assert.equal(parsed.getHours(), 9);
    assert.equal(parsed.getMinutes(), 7);
  });

  it("rejects invalid datetime-local values clearly", () => {
    assert.equal(isValidDatetimeLocalValue("2027-09-09T09:07Z"), false);
    assert.equal(isValidDatetimeLocalValue("not-a-date"), false);
    assert.equal(datetimeLocalToIso("2027-13-40T09:07"), null);
  });

  it("does not treat ISO Z strings as valid datetime-local input", () => {
    assert.equal(isValidDatetimeLocalValue("2027-09-09T08:07:00.000Z"), false);
  });
});

describe("featured novel selection state", () => {
  it("keeps novel A selected after choosing novel A", () => {
    const novels = [novelA, novelB];
    let novelId = "";

    novelId = novelA.id;
    const selected = findNovelSelectOption(novels, novelId);

    assert.equal(novelId, "novel-a");
    assert.equal(selected?.id, "novel-a");
    assert.equal(formatNovelSelectLabel(selected!), formatNovelSelectLabel(novelA));
  });
});
