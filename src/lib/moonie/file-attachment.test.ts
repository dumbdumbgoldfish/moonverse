import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FILE_UNSUPPORTED_TYPE_MESSAGE,
  isAllowedFileAttachment,
  parseNovelTitlesFromFileContent,
} from "./file-attachment";

describe("moonie file attachment", () => {
  it("accepts txt with one title per line", () => {
    const result = parseNovelTitlesFromFileContent(
      "Lord of the Mysteries\nA Will Eternal",
      "list.txt"
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.titles, [
        "Lord of the Mysteries",
        "A Will Eternal",
      ]);
    }
  });

  it("accepts md with one title per line", () => {
    const result = parseNovelTitlesFromFileContent(
      "Coiling Dragon\nHeavenly Jewel Change",
      "list.md"
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.titles.length, 2);
    }
  });

  it("accepts csv with title column", () => {
    const result = parseNovelTitlesFromFileContent(
      "title,author\nLord of the Mysteries,CUTIELEMON\nA Will Eternal,Er Gen",
      "list.csv"
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.titles, [
        "Lord of the Mysteries",
        "A Will Eternal",
      ]);
    }
  });

  it("rejects empty file", () => {
    const result = parseNovelTitlesFromFileContent("   \n  ", "list.txt");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "empty");
      assert.match(result.reason, /empty/i);
    }
  });

  it("rejects malformed csv without parseable titles", () => {
    const result = parseNovelTitlesFromFileContent(
      "rating,score\n1,1\n2,2",
      "list.csv"
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "no_titles");
      assert.match(result.reason, /CSV/i);
      assert.match(result.reason, /title/i);
    }
  });

  it("rejects valid file with no titles", () => {
    const result = parseNovelTitlesFromFileContent(
      "x\ny",
      "list.txt"
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "no_titles");
      assert.match(result.reason, /TXT\/MD/i);
    }
  });

  it("rejects unsupported pdf extension", () => {
    assert.equal(isAllowedFileAttachment("reading-list.pdf", "application/pdf"), false);
    assert.match(FILE_UNSUPPORTED_TYPE_MESSAGE, /Unsupported file type/i);
  });

  it("parses five titles from txt", () => {
    const titles = [
      "Lord of the Mysteries",
      "A Will Eternal",
      "Coiling Dragon",
      "Heavenly Jewel Change",
      "Reverend Insanity",
    ];
    const result = parseNovelTitlesFromFileContent(titles.join("\n"), "list.txt");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.titles.length, 5);
    }
  });

  it("parses five titles from md", () => {
    const titles = [
      "Lord of the Mysteries",
      "A Will Eternal",
      "Coiling Dragon",
      "Heavenly Jewel Change",
      "Reverend Insanity",
    ];
    const result = parseNovelTitlesFromFileContent(titles.join("\n"), "list.md");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.titles.length, 5);
    }
  });

  it("parses five titles from csv", () => {
    const result = parseNovelTitlesFromFileContent(
      "title\nLord of the Mysteries\nA Will Eternal\nCoiling Dragon\nHeavenly Jewel Change\nReverend Insanity",
      "list.csv"
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.titles.length, 5);
    }
  });

  it("accepts up to twelve titles", () => {
    const titles = Array.from({ length: 12 }, (_, index) => `Novel ${index + 1}`);
    const result = parseNovelTitlesFromFileContent(titles.join("\n"), "list.txt");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.titles.length, 12);
    }
  });

  it("rejects more than twelve titles with explicit guidance", () => {
    const titles = Array.from({ length: 13 }, (_, index) => `Novel ${index + 1}`);
    const result = parseNovelTitlesFromFileContent(titles.join("\n"), "list.txt");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "too_many_titles");
      assert.match(result.reason, /up to 12/i);
    }
  });
});
