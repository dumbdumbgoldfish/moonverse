/**
 * Spoiler mode handler verification.
 * Run: npx tsx scripts/verify-moonie-spoiler.ts
 */
import { handleMoonieRequest } from "@/services/moonie-response.service";

const modes = ["none", "light", "full"] as const;

async function main() {
  let passed = 0;

  for (const spoilerMode of modes) {
    const lookup = await handleMoonieRequest({
      message: "Tell me about Lord of the Mysteries",
      messages: [],
      isLoggedIn: true,
      excludeNovelIds: [],
      spoilerMode,
    });
    const compare = await handleMoonieRequest({
      message: "Compare Lord of the Mysteries and Reverend Insanity",
      messages: [],
      isLoggedIn: true,
      excludeNovelIds: [],
      spoilerMode,
    });
    const recommend = await handleMoonieRequest({
      message: "Recommend dark psychological fantasy",
      messages: [],
      isLoggedIn: true,
      excludeNovelIds: [],
      spoilerMode,
    });

    const ok =
      lookup.spoilerMode === spoilerMode &&
      compare.spoilerMode === spoilerMode &&
      recommend.spoilerMode === spoilerMode;

    console.log(
      `[${ok ? "PASS" : "FAIL"}] spoiler=${spoilerMode} lookup=${lookup.responseKind} compare=${compare.responseKind} recs=${recommend.recommendations.length}`
    );
    if (ok) passed += 1;
  }

  console.log(`\n${passed}/${modes.length} spoiler mode checks passed`);
  if (passed < modes.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
