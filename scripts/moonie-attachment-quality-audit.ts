/**
 * Moonie attachment capability quality audit (real catalogue cases).
 * Run: npx tsx --env-file=.env scripts/moonie-attachment-quality-audit.ts
 */
import { Buffer } from "node:buffer";
import { PrismaClient } from "@prisma/client";
import { parseNovelTitlesFromFileContent } from "@/lib/moonie/file-attachment";
import { handleMoonieRequest } from "@/services/moonie-response.service";
import {
  extractNovelCandidatesFromImage,
  verifyVisionCandidates,
} from "@/services/moonie-vision.service";
import { identifyNovels } from "@/services/moonie-identification.service";

const db = new PrismaClient();

type ImageOutcome =
  | "exact_identified"
  | "clarification_needed"
  | "wrong_match"
  | "no_result";

const IMAGE_NOVELS = [
  "Lord of the Mysteries",
  "Coiling Dragon",
  "A Will Eternal",
  "Heavenly Jewel Change",
  "Reverend Insanity",
  "Martial World",
  "Shadow Slave",
  "Mother of Learning",
  "Dungeon Crawler Carl",
  "Beware of Chicken",
  "The Primal Hunter",
  "Cradle",
];

async function fetchCoverBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "MoonVerse-Moonie-Audit/1.0" },
    });
    if (!response.ok) return null;
    const mimeType = response.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 500) return null;
    return { base64: buffer.toString("base64"), mimeType };
  } catch {
    return null;
  }
}

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function titlesMatch(a: string, b: string): boolean {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}

function classifyImageE2E(
  expectedTitle: string,
  result: Awaited<ReturnType<typeof handleMoonieRequest>>
): ImageOutcome {
  const reply = result.reply.toLowerCase();
  if (
    reply.includes("could not identify") ||
    reply.includes("not configured") ||
    result.state === "no_results" && !result.lookupSession?.candidates.length
  ) {
    if (result.lookupSession?.candidates?.length) return "clarification_needed";
    if ((result.recommendations?.length ?? 0) === 0 && !result.novelOverview) {
      return "no_result";
    }
  }

  const recTitle =
    result.novelOverview?.title ??
    result.recommendations?.[0]?.title ??
    result.lookupSession?.candidates?.[0]?.title;

  if (recTitle && titlesMatch(recTitle, expectedTitle)) {
    if (
      reply.includes("which one") ||
      result.lookupSession?.mode === "clarification" ||
      (result.lookupSession?.candidates?.length ?? 0) > 1
    ) {
      return "clarification_needed";
    }
    if (reply.includes("verified from your screenshot") || result.novelOverview) {
      return "exact_identified";
    }
    return "clarification_needed";
  }

  if (recTitle && !titlesMatch(recTitle, expectedTitle)) {
    return "wrong_match";
  }

  if (
    result.lookupSession?.candidates?.length ||
    reply.includes("closest catalogue") ||
    reply.includes("which one")
  ) {
    return "clarification_needed";
  }

  return "no_result";
}

async function auditImages() {
  console.log("\n=== IMAGE AUDIT (real catalogue covers) ===\n");
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  if (!hasKey) {
    console.log("SKIP: OPENAI_API_KEY not configured");
    return;
  }

  const rows: Array<{
    title: string;
    coverFetched: boolean;
    extractedTitles: string[];
    extractionConfidence: string[];
    verifiedTopTitle: string | null;
    verified: boolean;
    e2e: ImageOutcome;
    notes: string;
  }> = [];

  for (const title of IMAGE_NOVELS) {
    const novel = await db.novel.findFirst({
      where: { title: { equals: title, mode: "insensitive" } },
      select: { id: true, title: true, author: true, coverUrl: true },
    });

    if (!novel?.coverUrl) {
      rows.push({
        title,
        coverFetched: false,
        extractedTitles: [],
        extractionConfidence: [],
        verifiedTopTitle: null,
        verified: false,
        e2e: "no_result",
        notes: "No cover URL in catalogue",
      });
      continue;
    }

    const image = await fetchCoverBase64(novel.coverUrl);
    if (!image) {
      rows.push({
        title,
        coverFetched: false,
        extractedTitles: [],
        extractionConfidence: [],
        verifiedTopTitle: null,
        verified: false,
        e2e: "no_result",
        notes: `Cover fetch failed: ${novel.coverUrl}`,
      });
      continue;
    }

    const extraction = await extractNovelCandidatesFromImage({
      base64: image.base64,
      mimeType: image.mimeType,
      userMessage: "Find this novel",
    });

    const verified = await verifyVisionCandidates({
      candidates: extraction.candidates,
      spoilerMode: "none",
    });

    const e2e = await handleMoonieRequest({
      message: "Find this novel from the screenshot",
      messages: [],
      isLoggedIn: true,
      excludeNovelIds: [],
      spoilerMode: "none",
      attachmentType: "image",
      imageData: image.base64,
      imageMimeType: image.mimeType,
    });

    const outcome = classifyImageE2E(novel.title, e2e);
    const topVerified = verified.find((v) => v.verified);

    rows.push({
      title: novel.title,
      coverFetched: true,
      extractedTitles: extraction.candidates.map((c) => c.title),
      extractionConfidence: extraction.candidates.map((c) => c.confidence),
      verifiedTopTitle: topVerified?.recommendation?.title ?? verified[0]?.recommendation?.title ?? null,
      verified: Boolean(topVerified),
      e2e: outcome,
      notes:
        extraction.candidates.length === 0
          ? `Vision empty (${extraction.error ?? "no candidates"})`
          : topVerified
            ? "Vision+verify path confirmed"
            : verified.length
              ? "Extracted but verify threshold failed"
              : "Extraction only",
    });

    console.log(
      `[${outcome}] ${novel.title}\n` +
        `  extracted: ${extraction.candidates.map((c) => `${c.title} (${c.confidence})`).join(" | ") || "none"}\n` +
        `  verified: ${topVerified?.recommendation?.title ?? "none"}\n` +
        `  e2e reply: ${e2e.reply.slice(0, 120).replace(/\n/g, " ")}...`
    );

    await new Promise((r) => setTimeout(r, 400));
  }

  const tested = rows.filter((r) => r.coverFetched);
  const counts = {
    exact_identified: tested.filter((r) => r.e2e === "exact_identified").length,
    clarification_needed: tested.filter((r) => r.e2e === "clarification_needed").length,
    wrong_match: tested.filter((r) => r.e2e === "wrong_match").length,
    no_result: tested.filter((r) => r.e2e === "no_result").length,
  };
  const successRate =
    tested.length > 0
      ? Math.round((counts.exact_identified / tested.length) * 100)
      : 0;

  console.log("\nImage summary:");
  console.log(JSON.stringify({ tested: tested.length, counts, successRate: `${successRate}%` }, null, 2));
  return { rows, successRate, counts };
}

async function auditFiles() {
  console.log("\n=== FILE AUDIT (parse vs match) ===\n");

  const existing = await db.novel.findMany({
    where: {
      title: {
        in: [
          "Lord of the Mysteries",
          "Coiling Dragon",
          "A Will Eternal",
          "Heavenly Jewel Change",
          "Reverend Insanity",
          "Martial World",
          "Shadow Slave",
          "Mother of Learning",
          "Dungeon Crawler Carl",
          "Beware of Chicken",
        ],
        mode: "insensitive",
      },
    },
    select: { title: true },
    orderBy: { title: "asc" },
  });

  const five = existing.slice(0, 5).map((n) => n.title);
  const mixed = [
    ...five.slice(0, 3),
    "Omniscient Reader's Viewpoint",
    "Solo Leveling",
    five[3]!,
    five[4]!,
  ];

  const cases = [
    { id: "txt-5-existing", content: five.join("\n"), fileName: "list.txt" },
    { id: "md-5-existing", content: five.map((t) => `- ${t}`).join("\n"), fileName: "list.md" },
    {
      id: "csv-title-column",
      content: `title,author\n${five.map((t) => `${t},Author`).join("\n")}`,
      fileName: "list.csv",
    },
    { id: "mixed-existing-missing", content: mixed.join("\n"), fileName: "mixed.txt" },
  ];

  for (const testCase of cases) {
    const parsed = parseNovelTitlesFromFileContent(testCase.content, testCase.fileName);
    console.log(`\n--- ${testCase.id} ---`);
    if (!parsed.ok) {
      console.log(`PARSE FAIL: ${parsed.reason}`);
      continue;
    }

    const parseResults: Array<{ title: string; matched: boolean; mode: string; top?: string }> = [];
    for (const title of parsed.titles) {
      const id = await identifyNovels({ query: title, spoilerMode: "none" });
      const top = id.session.candidates[0]?.title ?? id.overview?.title;
      const matched = top ? titlesMatch(top, title) : false;
      parseResults.push({ title, matched, mode: id.mode, top });
    }

    const e2e = await handleMoonieRequest({
      message: "Compare these.",
      messages: [],
      isLoggedIn: true,
      excludeNovelIds: [],
      spoilerMode: "none",
      attachmentType: "file",
      fileData: Buffer.from(testCase.content, "utf-8").toString("base64"),
      fileName: testCase.fileName,
      fileMimeType: testCase.fileName.endsWith(".csv") ? "text/csv" : "text/plain",
    });

    console.log(
      JSON.stringify(
        {
          parsedTitles: parsed.titles,
          matchResults: parseResults,
          e2eKind: e2e.responseKind,
          e2eReply: e2e.reply.slice(0, 160),
          parseAccuracy: `${parseResults.filter((r) => r.matched).length}/${parseResults.length}`,
        },
        null,
        2
      )
    );
  }
}

async function auditVoice() {
  console.log("\n=== VOICE AUDIT (pipeline inspection) ===\n");
  console.log(
    JSON.stringify(
      {
        implementation: "Browser Web Speech API only (MoonieVoiceInput.tsx)",
        serverTranscription: false,
        audioPersisted: false,
        routing: "onTranscript -> handleSubmit(text, { inputSource: 'voice' }) — same as typed text",
        browserAutomation: "Not run in this audit (requires live mic + Chrome/Safari)",
        manualPhrasesRecommended: [
          "Recommend something cozy and funny",
          "Find Lord of the Mysteries",
          "Compare Coiling Dragon and Martial World",
          "Where can I read Shadow Slave",
          "Slow burn romance fantasy",
        ],
        reliabilityNotes: [
          "Depends on browser SpeechRecognition support (Chrome/Edge best; Safari partial)",
          "No server-side validation or Moonie-specific vocabulary biasing",
          "Transcript errors flow into same intent/routing as typed input",
          "Widget inline mode drafts to textarea; desk mode shows preview before send",
        ],
      },
      null,
      2
    )
  );
}

async function main() {
  try {
    await auditImages();
    await auditFiles();
    await auditVoice();
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
