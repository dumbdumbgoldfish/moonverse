/**
 * One-shot live OpenAI probe for Moonie.
 * Run: npx tsx --env-file=.env scripts/verify-openai-live-probe.ts
 */
import {
  createOpenAiChatCompletion,
  hasOpenAiApiKey,
  resolveOpenAiTextModel,
} from "@/lib/moonie/openai";

function maskKey(raw: string | undefined): string {
  const key = raw?.trim() ?? "";
  if (!key) return "(not set)";
  if (key.length <= 12) return `${key.slice(0, 4)}…`;
  return `${key.slice(0, 12)}…`;
}

async function main() {
  const key = process.env.OPENAI_API_KEY?.trim() ?? "";
  const model = resolveOpenAiTextModel();
  const project = process.env.OPENAI_PROJECT?.trim();

  console.log("=== Moonie OpenAI live probe ===");
  console.log(`createOpenAiChatCompletion invoked: yes`);
  console.log(`OPENAI_API_KEY configured: ${hasOpenAiApiKey()}`);
  console.log(`API key prefix: ${maskKey(key)}`);
  if (project) {
    console.log(`OPENAI_PROJECT: ${project.slice(0, 8)}…`);
  } else {
    console.log("OPENAI_PROJECT: (not set)");
  }
  console.log(`Selected text model: ${model}`);

  const started = Date.now();
  const result = await createOpenAiChatCompletion({
    modelKind: "text",
    messages: [
      {
        role: "system",
        content:
          "You are a connectivity probe. Reply with exactly the token MOONIE_LIVE_OK and nothing else.",
      },
      { role: "user", content: "ping" },
    ],
  });
  const elapsedMs = Date.now() - started;

  if (!hasOpenAiApiKey()) {
    console.log("HTTP status from OpenAI: (not called — no API key)");
    console.log("Response source: local gate (no_api)");
    console.log(`Elapsed: ${elapsedMs}ms`);
    process.exitCode = 1;
    return;
  }

  if (result.ok) {
    console.log("HTTP status from OpenAI: 200");
    console.log("Response source: live OpenAI");
    console.log(`Content preview: ${result.content.trim().slice(0, 120)}`);
    console.log(`Elapsed: ${elapsedMs}ms`);
    return;
  }

  console.log(`HTTP status from OpenAI: ${result.status || "(no response)"}`);
  console.log(
    `Response source: ${
      result.body === "no_api"
        ? "local gate (no_api)"
        : result.body === "empty_content"
          ? "openai_empty_content"
          : "openai_error"
    }`
  );
  console.log(`Error body preview: ${result.body.slice(0, 240)}`);
  console.log(`Elapsed: ${elapsedMs}ms`);
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
