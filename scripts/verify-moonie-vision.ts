/**
 * Vision flow verification (handler-level).
 * Run: npx tsx --env-file=.env scripts/verify-moonie-vision.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { handleMoonieRequest } from "@/services/moonie-response.service";
import {
  classifyOpenAiVisionHttpError,
  visionExtractionUserMessage,
} from "@/services/moonie-vision.service";

type MoonieResult = Awaited<ReturnType<typeof handleMoonieRequest>>;

function imageBase64(fileName: string): string {
  return readFileSync(join(process.cwd(), "public", fileName)).toString("base64");
}

type Scenario = {
  id: string;
  request: Parameters<typeof handleMoonieRequest>[0];
  expect: (result: MoonieResult) => boolean;
  detail: (result: MoonieResult) => string;
};

const baseRequest = {
  messages: [] as import("@/services/moonie-response.service").MoonieRequestContext["messages"],
  isLoggedIn: true,
  excludeNovelIds: [] as string[],
  spoilerMode: "none" as const,
};

async function runScenario(scenario: Scenario): Promise<boolean> {
  const result = await handleMoonieRequest(scenario.request);
  const ok = scenario.expect(result);
  console.log(`[${ok ? "PASS" : "FAIL"}] ${scenario.id}: ${scenario.detail(result)}`);
  return ok;
}

async function main() {
  const quotaBody = JSON.stringify({
    error: { code: "insufficient_quota", message: "You exceeded your quota" },
  });
  const quotaMapped =
    classifyOpenAiVisionHttpError(429, quotaBody) === "insufficient_quota" &&
    visionExtractionUserMessage("insufficient_quota").includes("quota has been reached");
  console.log(
    `[${quotaMapped ? "PASS" : "FAIL"}] quota-error-mapping: insufficient_quota user copy`
  );

  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  console.log(`OPENAI_API_KEY configured: ${hasKey}`);

  if (!hasKey) {
    const fallback = await handleMoonieRequest({
      ...baseRequest,
      message: "Find this novel",
      attachmentType: "image",
      imageData: imageBase64("moonverse-logo.png"),
      imageMimeType: "image/png",
    });
    const ok =
      fallback.consumesQuota === false &&
      fallback.reply.includes("not configured");
    console.log(
      `[${ok ? "PASS" : "FAIL"}] no-key-honest-fallback: ${fallback.reply.slice(0, 90)}`
    );
    console.log("[SKIP] Vision API tests — OPENAI_API_KEY not set");
    process.exitCode = quotaMapped && ok ? 0 : 1;
    return;
  }

  const scenarios: Scenario[] = [
    {
      id: "vision-pipeline-runs",
      request: {
        ...baseRequest,
        message: "Find this novel",
        attachmentType: "image",
        imageData: imageBase64("moonverse-logo.png"),
        imageMimeType: "image/png",
      },
      expect: (r) =>
        !r.reply.includes("not configured") &&
        (r.responseKind === "novel_bundle" ||
          r.responseKind === "chat" ||
          Boolean(r.novelOverview) ||
          (r.responseKind === "error" &&
            (/quota has been reached/i.test(r.reply) ||
              /temporarily unavailable/i.test(r.reply)))),
      detail: (r) =>
        `kind=${r.responseKind} verified=${Boolean(r.novelOverview)} state=${r.state ?? "n/a"}`,
    },
    {
      id: "attach-prompt-without-image",
      request: {
        ...baseRequest,
        message: "Find this novel from my screenshot",
        attachmentType: "image",
        imageData: null,
        imageMimeType: null,
      },
      expect: (r) =>
        r.consumesQuota === false &&
        r.responseKind === "chat" &&
        r.reply.includes("Attach a cover"),
      detail: (r) => r.reply.slice(0, 90),
    },
  ];

  let passed = quotaMapped ? 1 : 0;
  for (const scenario of scenarios) {
    if (await runScenario(scenario)) passed += 1;
  }

  console.log(`\n${passed}/${scenarios.length + 1} vision checks passed`);
  if (passed < scenarios.length + 1) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
