/**
 * Moonie technical evaluation runner (FPR evidence).
 *
 * Compares the same keyword/facet search users get (`runSearch` works tab)
 * against the grounded Moonie pipeline. Measures relevance, unsupported-title
 * rate, consistency, diversity, explanation grounding, latency, and an
 * embeddings-on vs embeddings-off ablation.
 *
 * Usage:
 *   npm run moonie:eval
 *   npm run moonie:eval -- --consistency 3
 *   npm run moonie:eval -- --scenario S01
 *
 * Requires DATABASE_URL and a seeded catalogue.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  diversityRatio,
  explanationGroundingRate,
  filterToAllowlist,
  meanConsistency,
  meanRelevance,
  roundMetric,
  topOneConcentration,
  unsupportedTitleRate,
} from "../src/lib/moonie/eval-metrics";
import {
  isValidUserMessage,
  looksOffTopic,
  sanitizeUserMessage,
} from "../src/lib/moonie/guardrails";
import { extractPreferencesFromMessage } from "../src/lib/moonie/preferences";
import { buildGroundedRecommendations } from "../src/services/moonie-pipeline.service";
import { runSearch } from "../src/services/search.service";

type Scenario = {
  id: string;
  category: string;
  prompt: string;
  expectedGenres: string[];
  expectedTags: string[];
  expectOffTopic: boolean;
};

type ScenarioFile = {
  version: number;
  consistencyRuns: number;
  scenarios: Scenario[];
};

type ScenarioResult = {
  id: string;
  category: string;
  prompt: string;
  offTopicExpected: boolean;
  offTopicDetected: boolean;
  offTopicCorrect: boolean;
  recommendationCount: number;
  relevance: number;
  unsupportedTitleRate: number;
  consistency: number;
  explanationGrounding: number;
  latencyMs: number;
  ablationRelevanceOff: number;
  novelIds: string[];
  titles: string[];
  baselineCount: number;
  baselineOverlapWithMoonie: number;
  baselineLatencyMs: number;
  interpretedPreferences: ReturnType<typeof extractPreferencesFromMessage>;
};

const root = process.cwd();
const scenariosPath = path.join(root, "data/moonie-eval-scenarios.json");
const outDir = path.join(root, "docs/eval");

function parseArgs(argv: string[]) {
  let consistency: number | null = null;
  let scenarioId: string | null = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--consistency" && argv[i + 1]) {
      consistency = Number(argv[i + 1]);
      i += 1;
    } else if (argv[i] === "--scenario" && argv[i + 1]) {
      scenarioId = argv[i + 1];
      i += 1;
    }
  }
  return { consistency, scenarioId };
}

async function baselineKeywordSearch(prompt: string, take = 5): Promise<{
  ids: string[];
  latencyMs: number;
}> {
  const started = Date.now();
  const result = await runSearch({
    query: prompt,
    type: "works",
    sort: "relevance",
    limit: take,
  });
  return {
    ids: result.works.slice(0, take).map((work) => work.id),
    latencyMs: Date.now() - started,
  };
}

function overlapRate(a: string[], b: string[]): number {
  if (a.length === 0) return 0;
  const setB = new Set(b);
  const hits = a.filter((id) => setB.has(id)).length;
  return hits / a.length;
}

async function evaluateScenario(
  scenario: Scenario,
  catalogueIds: Set<string>,
  consistencyRuns: number
): Promise<ScenarioResult> {
  const prompt = sanitizeUserMessage(scenario.prompt);
  const offTopicDetected =
    !isValidUserMessage(prompt) || looksOffTopic(prompt);
  const offTopicCorrect = offTopicDetected === scenario.expectOffTopic;

  if (scenario.expectOffTopic || offTopicDetected) {
    return {
      id: scenario.id,
      category: scenario.category,
      prompt: scenario.prompt,
      offTopicExpected: scenario.expectOffTopic,
      offTopicDetected,
      offTopicCorrect,
      recommendationCount: 0,
      relevance: 0,
      unsupportedTitleRate: 0,
      consistency: 1,
      explanationGrounding: 1,
      latencyMs: 0,
      ablationRelevanceOff: 0,
      novelIds: [],
      titles: [],
      baselineCount: 0,
      baselineOverlapWithMoonie: 0,
      baselineLatencyMs: 0,
      interpretedPreferences: extractPreferencesFromMessage(prompt),
    };
  }

  const prefs = extractPreferencesFromMessage(prompt);
  const runs: string[][] = [];
  const started = Date.now();
  let primary = await buildGroundedRecommendations({
    prefs,
    queryText: prompt,
    take: 5,
  });
  const latencyMs = Date.now() - started;

  for (let i = 0; i < consistencyRuns; i += 1) {
    const grounded = await buildGroundedRecommendations({
      prefs,
      queryText: prompt,
      take: 5,
    });
    const filtered = filterToAllowlist(grounded.recommendations, catalogueIds);
    runs.push(filtered.map((r) => r.novelId));
    if (i === 0) {
      primary = { ...grounded, recommendations: filtered };
    }
  }

  const ablation = await buildGroundedRecommendations({
    prefs,
    queryText: prompt,
    take: 5,
    disableSemantic: true,
  });

  const unsupported = unsupportedTitleRate(
    primary.recommendations,
    catalogueIds
  );
  const relevance = meanRelevance(primary.recommendations, prefs);
  const consistency = meanConsistency(runs);
  const explanationGrounding = explanationGroundingRate(
    primary.recommendations
  );
  const ablationRelevanceOff = meanRelevance(
    filterToAllowlist(ablation.recommendations, catalogueIds),
    prefs
  );

  const baseline = await baselineKeywordSearch(prompt, 5);
  const moonieIds = primary.recommendations.map((r) => r.novelId);

  return {
    id: scenario.id,
    category: scenario.category,
    prompt: scenario.prompt,
    offTopicExpected: scenario.expectOffTopic,
    offTopicDetected,
    offTopicCorrect,
    recommendationCount: primary.recommendations.length,
    relevance: roundMetric(relevance),
    unsupportedTitleRate: roundMetric(unsupported),
    consistency: roundMetric(consistency),
    explanationGrounding: roundMetric(explanationGrounding),
    latencyMs,
    ablationRelevanceOff: roundMetric(ablationRelevanceOff),
    novelIds: moonieIds,
    titles: primary.recommendations.map((r) => r.title),
    baselineCount: baseline.ids.length,
    baselineOverlapWithMoonie: roundMetric(overlapRate(moonieIds, baseline.ids)),
    baselineLatencyMs: baseline.latencyMs,
    interpretedPreferences: prefs,
  };
}

function toCsv(results: ScenarioResult[]): string {
  const header = [
    "id",
    "category",
    "off_topic_correct",
    "recommendation_count",
    "relevance",
    "unsupported_title_rate",
    "consistency",
    "explanation_grounding",
    "latency_ms",
    "ablation_relevance_off",
    "baseline_overlap",
    "baseline_latency_ms",
    "titles",
  ].join(",");
  const rows = results.map((r) =>
    [
      r.id,
      r.category,
      r.offTopicCorrect ? "1" : "0",
      r.recommendationCount,
      r.relevance,
      r.unsupportedTitleRate,
      r.consistency,
      r.explanationGrounding,
      r.latencyMs,
      r.ablationRelevanceOff,
      r.baselineOverlapWithMoonie,
      r.baselineLatencyMs,
      `"${r.titles.join(" | ").replace(/"/g, "'")}"`,
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

function toMarkdown(
  results: ScenarioResult[],
  summary: Record<string, number | string | boolean>
): string {
  const lines: string[] = [
    "# Moonie technical evaluation results",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    "## Aggregate metrics",
    "",
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Scenarios run | ${summary.scenarioCount} |`,
    `| Off-topic accuracy | ${summary.offTopicAccuracy} |`,
    `| Mean top-5 relevance (Moonie) | ${summary.meanRelevance} |`,
    `| Mean unsupported-title rate | ${summary.meanUnsupportedTitleRate} |`,
    `| Mean consistency | ${summary.meanConsistency} |`,
    `| Mean explanation grounding | ${summary.meanExplanationGrounding} |`,
    `| Diversity (unique/total IDs) | ${summary.diversity} |`,
    `| Top-1 concentration | ${summary.topOneConcentration} |`,
    `| Mean overlap vs keyword/facet search | ${summary.meanBaselineOverlap} |`,
    `| Mean Moonie latency (ms) | ${summary.meanLatencyMs} |`,
    `| Mean search baseline latency (ms) | ${summary.meanBaselineLatencyMs} |`,
    `| Mean relevance with embeddings off | ${summary.meanAblationRelevanceOff} |`,
    `| OpenAI enabled | ${summary.openaiEnabled} |`,
    "",
    "## Per-scenario results",
    "",
    "| ID | Category | Off-topic OK | #Recs | Relevance | Unsupported | Grounding | Latency ms | Baseline overlap |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];

  for (const r of results) {
    lines.push(
      `| ${r.id} | ${r.category} | ${r.offTopicCorrect ? "yes" : "no"} | ${r.recommendationCount} | ${r.relevance} | ${r.unsupportedTitleRate} | ${r.explanationGrounding} | ${r.latencyMs} | ${r.baselineOverlapWithMoonie} |`
    );
  }

  lines.push(
    "",
    "## Notes for the Final Project Report",
    "",
    "- Metrics measure **technical effectiveness** of database-grounded Moonie, not participant satisfaction or SUS.",
    "- Unsupported-title rate should be **0** when allowlisting is applied against the live catalogue.",
    "- The baseline is the same keyword/facet **works** search users get (`runSearch`), not a private genre SQL query.",
    "- Ablation compares ranking with embeddings disabled versus the default hybrid ranker.",
    "- Injection and fabricated-title scenarios must still return only catalogue IDs.",
    ""
  );

  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = JSON.parse(
    readFileSync(scenariosPath, "utf8")
  ) as ScenarioFile;

  const consistencyRuns = Math.max(
    1,
    args.consistency ?? file.consistencyRuns ?? 3
  );

  let scenarios = file.scenarios;
  if (args.scenarioId) {
    scenarios = scenarios.filter((s) => s.id === args.scenarioId);
    if (scenarios.length === 0) {
      throw new Error(`Unknown scenario id: ${args.scenarioId}`);
    }
  }

  const db = new PrismaClient();
  try {
    const catalogue = await db.novel.findMany({ select: { id: true } });
    const catalogueIds = new Set(catalogue.map((n) => n.id));
    if (catalogueIds.size === 0) {
      throw new Error(
        "No novels in the database. Seed the catalogue before running moonie:eval."
      );
    }

    console.log(
      `Moonie eval: ${scenarios.length} scenarios, catalogue=${catalogueIds.size}, consistencyRuns=${consistencyRuns}`
    );

    const results: ScenarioResult[] = [];
    for (const scenario of scenarios) {
      process.stdout.write(`  ${scenario.id} (${scenario.category})… `);
      const result = await evaluateScenario(
        scenario,
        catalogueIds,
        consistencyRuns
      );
      results.push(result);
      console.log(
        result.offTopicExpected
          ? `off-topic ${result.offTopicCorrect ? "OK" : "FAIL"}`
          : `recs=${result.recommendationCount} rel=${result.relevance} unsup=${result.unsupportedTitleRate} ground=${result.explanationGrounding} ${result.latencyMs}ms`
      );
    }

    const inDomain = results.filter((r) => !r.offTopicExpected);
    const mean = (values: number[]) =>
      values.length === 0
        ? 0
        : roundMetric(values.reduce((a, b) => a + b, 0) / values.length);

    const allIds = inDomain.flatMap((r) => r.novelIds);
    const topIds = inDomain
      .map((r) => r.novelIds[0])
      .filter((id): id is string => Boolean(id));

    const summary = {
      generatedAt: new Date().toISOString(),
      scenarioCount: results.length,
      catalogueSize: catalogueIds.size,
      openaiEnabled: Boolean(process.env.OPENAI_API_KEY),
      offTopicAccuracy: roundMetric(
        results.filter((r) => r.offTopicCorrect).length / results.length
      ),
      meanRelevance: mean(inDomain.map((r) => r.relevance)),
      meanUnsupportedTitleRate: mean(
        inDomain.map((r) => r.unsupportedTitleRate)
      ),
      meanConsistency: mean(inDomain.map((r) => r.consistency)),
      meanExplanationGrounding: mean(
        inDomain.map((r) => r.explanationGrounding)
      ),
      diversity: roundMetric(diversityRatio(allIds)),
      topOneConcentration: roundMetric(topOneConcentration(topIds)),
      meanBaselineOverlap: mean(
        inDomain.map((r) => r.baselineOverlapWithMoonie)
      ),
      meanLatencyMs: mean(inDomain.map((r) => r.latencyMs)),
      meanBaselineLatencyMs: mean(inDomain.map((r) => r.baselineLatencyMs)),
      meanAblationRelevanceOff: mean(
        inDomain.map((r) => r.ablationRelevanceOff)
      ),
    };

    mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10);
    const jsonPath = path.join(outDir, `moonie-eval-results-${stamp}.json`);
    const csvPath = path.join(outDir, `moonie-eval-results-${stamp}.csv`);
    const mdPath = path.join(outDir, `moonie-eval-results-${stamp}.md`);
    const latestJson = path.join(outDir, "moonie-eval-results-latest.json");
    const latestMd = path.join(outDir, "moonie-eval-results-latest.md");

    const payload = { summary, results };
    writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
    writeFileSync(latestJson, JSON.stringify(payload, null, 2));
    writeFileSync(csvPath, toCsv(results));
    writeFileSync(mdPath, toMarkdown(results, summary));
    writeFileSync(latestMd, toMarkdown(results, summary));

    console.log("\nAggregate:");
    console.log(summary);
    console.log(`\nWrote:\n  ${latestMd}\n  ${latestJson}\n  ${csvPath}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
