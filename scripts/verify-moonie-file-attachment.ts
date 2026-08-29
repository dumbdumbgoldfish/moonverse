/**
 * Moonie file attachment parse + handler verification.
 * Run: npx tsx scripts/verify-moonie-file-attachment.ts
 */
import { Buffer } from "node:buffer";
import {
  FILE_UNSUPPORTED_TYPE_MESSAGE,
  isAllowedFileAttachment,
  parseNovelTitlesFromFileContent,
} from "@/lib/moonie/file-attachment";
import { handleMoonieRequest } from "@/services/moonie-response.service";

function encode(content: string): string {
  return Buffer.from(content, "utf-8").toString("base64");
}

type Scenario = {
  id: string;
  run: () => Promise<boolean> | boolean;
  detail: () => string;
};

const scenarios: Scenario[] = [
  {
    id: "txt-one-title-per-line",
    run: () => {
      const parsed = parseNovelTitlesFromFileContent(
        "Lord of the Mysteries\nA Will Eternal",
        "list.txt"
      );
      return parsed.ok && parsed.titles.length === 2;
    },
    detail: () => "2 titles from .txt",
  },
  {
    id: "md-one-title-per-line",
    run: () => {
      const parsed = parseNovelTitlesFromFileContent(
        "Coiling Dragon\nHeavenly Jewel Change",
        "list.md"
      );
      return parsed.ok && parsed.titles.length === 2;
    },
    detail: () => "2 titles from .md",
  },
  {
    id: "csv-title-column",
    run: () => {
      const parsed = parseNovelTitlesFromFileContent(
        "title,author\nLord of the Mysteries,CUTIELEMON",
        "list.csv"
      );
      return parsed.ok && parsed.titles[0] === "Lord of the Mysteries";
    },
    detail: () => "title column parsed",
  },
  {
    id: "empty-file",
    run: () => {
      const parsed = parseNovelTitlesFromFileContent("", "list.txt");
      return !parsed.ok && parsed.code === "empty";
    },
    detail: () => "empty code",
  },
  {
    id: "malformed-csv",
    run: () => {
      const parsed = parseNovelTitlesFromFileContent(
        "rating,score\n1,1\n2,2",
        "list.csv"
      );
      return !parsed.ok && parsed.code === "no_titles" && /CSV/i.test(parsed.reason);
    },
    detail: () => "csv-specific no-titles message",
  },
  {
    id: "valid-file-no-titles",
    run: () => {
      const parsed = parseNovelTitlesFromFileContent("x\ny", "list.txt");
      return !parsed.ok && parsed.code === "no_titles" && /TXT\/MD/i.test(parsed.reason);
    },
    detail: () => "txt-specific no-titles message",
  },
  {
    id: "unsupported-pdf",
    run: () => !isAllowedFileAttachment("list.pdf", "application/pdf"),
    detail: () => FILE_UNSUPPORTED_TYPE_MESSAGE,
  },
  {
    id: "handler-no-titles-reply",
    run: async () => {
      const result = await handleMoonieRequest({
        message: "Compare these.",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
        attachmentType: "file",
        fileData: encode("rating,score\n1,1\n2,2"),
        fileName: "list.csv",
        fileMimeType: "text/csv",
      });
      return (
        result.responseKind === "error" &&
        result.reply.includes("couldn't find any novel titles")
      );
    },
    detail: () => "handler surfaces parse error without stack trace",
  },
  {
    id: "handler-unsupported-type",
    run: async () => {
      const result = await handleMoonieRequest({
        message: "Compare these.",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
        attachmentType: "file",
        fileData: encode("%PDF-1.4"),
        fileName: "list.pdf",
        fileMimeType: "application/pdf",
      });
      return result.reply === FILE_UNSUPPORTED_TYPE_MESSAGE;
    },
    detail: () => "unsupported type message",
  },
  {
    id: "txt-five-titles",
    run: () => {
      const parsed = parseNovelTitlesFromFileContent(
        "Lord of the Mysteries\nA Will Eternal\nCoiling Dragon\nHeavenly Jewel Change\nReverend Insanity",
        "list.txt"
      );
      return parsed.ok && parsed.titles.length === 5;
    },
    detail: () => "5 titles from .txt",
  },
  {
    id: "md-five-titles",
    run: () => {
      const parsed = parseNovelTitlesFromFileContent(
        "Lord of the Mysteries\nA Will Eternal\nCoiling Dragon\nHeavenly Jewel Change\nReverend Insanity",
        "list.md"
      );
      return parsed.ok && parsed.titles.length === 5;
    },
    detail: () => "5 titles from .md",
  },
  {
    id: "csv-five-titles",
    run: () => {
      const parsed = parseNovelTitlesFromFileContent(
        "title\nLord of the Mysteries\nA Will Eternal\nCoiling Dragon\nHeavenly Jewel Change\nReverend Insanity",
        "list.csv"
      );
      return parsed.ok && parsed.titles.length === 5;
    },
    detail: () => "5 titles from .csv",
  },
  {
    id: "twelve-titles-accepted",
    run: () => {
      const titles = Array.from({ length: 12 }, (_, index) => `Novel ${index + 1}`);
      const parsed = parseNovelTitlesFromFileContent(titles.join("\n"), "list.txt");
      return parsed.ok && parsed.titles.length === 12;
    },
    detail: () => "12-title limit accepted",
  },
  {
    id: "thirteen-titles-rejected",
    run: () => {
      const titles = Array.from({ length: 13 }, (_, index) => `Novel ${index + 1}`);
      const parsed = parseNovelTitlesFromFileContent(titles.join("\n"), "list.txt");
      return !parsed.ok && parsed.code === "too_many_titles";
    },
    detail: () => "13-title limit rejected",
  },
  {
    id: "compare-mixed-known-unknown",
    run: async () => {
      const result = await handleMoonieRequest({
        message: "Compare these.",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
        attachmentType: "file",
        fileData: encode("Lord of the Mysteries\nFake Novel XYZ"),
        fileName: "list.txt",
        fileMimeType: "text/plain",
      });
      return (
        result.responseKind === "compare" &&
        result.state === "no_results" &&
        result.reply.includes("could only verify 1") &&
        result.reply.includes("Fake Novel XYZ")
      );
    },
    detail: () => "mixed file compare stays honest",
  },
  {
    id: "compare-only-unknown-no-false-positive",
    run: async () => {
      const result = await handleMoonieRequest({
        message: "Compare these.",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
        attachmentType: "file",
        fileData: encode("Solo Leveling\nFake Novel XYZ"),
        fileName: "list.txt",
        fileMimeType: "text/plain",
      });
      const rowTitles = result.compare?.rows.map((row) => row.title) ?? [];
      return (
        result.responseKind === "compare" &&
        result.state === "no_results" &&
        rowTitles.length < 2 &&
        !rowTitles.some((title) => /threads of fate/i.test(title))
      );
    },
    detail: () => "unknown titles do not substitute unrelated novels",
  },
];

async function main() {
  let passed = 0;
  for (const scenario of scenarios) {
    const ok = await scenario.run();
    console.log(`[${ok ? "PASS" : "FAIL"}] ${scenario.id}: ${scenario.detail()}`);
    if (ok) passed += 1;
  }
  console.log(`\n${passed}/${scenarios.length} file attachment checks passed`);
  if (passed < scenarios.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
