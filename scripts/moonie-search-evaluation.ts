#!/usr/bin/env node
/**
 * Bounded Search vs Moonie evaluation harness for acceptance evidence.
 * Run: node --import tsx scripts/moonie-search-evaluation.ts
 */
import { labelsMatch } from "../src/lib/moonie/label-match";
import { runSearch } from "../src/services/search.service";
import { handleMoonieRequest } from "../src/services/moonie-response.service";

type Task = {
  id: string;
  moonieMessage: string;
  searchQuery: string;
  searchType: "works" | "reviews" | "people" | "all";
  searchGenre?: string;
  expectGenre?: string;
  expectConstraint?: RegExp;
};

const TASKS: Task[] = [
  {
    id: "fantasy-top3",
    moonieMessage: "Recommend me three fantasy novels with details",
    searchQuery: "fantasy",
    searchType: "works",
    searchGenre: "fantasy",
    expectGenre: "fantasy",
  },
  {
    id: "slice-life-completed",
    moonieMessage: "Show me completed slice-of-life novels",
    searchQuery: "slice of life",
    searchType: "works",
    expectConstraint: /slice|life/i,
  },
  {
    id: "reviewer-ezraink76",
    moonieMessage: "show me ezraink76 reviews",
    searchQuery: "ezraink76",
    searchType: "people",
  },
  {
    id: "novel-culpa-paraphrase",
    moonieMessage: "tell me about Culpa Tuya",
    searchQuery: "culpa tuya",
    searchType: "works",
    expectConstraint: /culpa/i,
  },
  {
    id: "found-family-paraphrase",
    moonieMessage:
      "A comforting found-family or slice-of-life story with a hopeful ending.",
    searchQuery: "found family",
    searchType: "works",
    expectConstraint: /found|family|slice/i,
  },
];

async function evaluateMoonie(task: Task) {
  const response = await handleMoonieRequest({
    message: task.moonieMessage,
    messages: [],
    isLoggedIn: false,
  });
  const recs = response.recommendations;
  let relevant = 0;
  for (const rec of recs) {
    const genreOk =
      !task.expectGenre ||
      rec.genres.some((g) => labelsMatch(g, task.expectGenre!));
    const constraintOk =
      !task.expectConstraint ||
      task.expectConstraint.test(rec.title) ||
      rec.genres.some((g) => task.expectConstraint!.test(g)) ||
      (rec.tags ?? []).some((t) => task.expectConstraint!.test(t)) ||
      task.expectConstraint.test(response.reply);
    if (genreOk && constraintOk) relevant += 1;
  }
  const titleOk =
    task.expectConstraint?.test(response.reply) ||
    response.novelOverview?.title &&
      task.expectConstraint?.test(response.novelOverview.title);
  const reviewerOk =
    task.searchType === "people" && response.reviewerOverview?.username;
  return {
    replySnippet: response.reply.slice(0, 160),
    recCount: recs.length,
    relevantRecs: relevant,
    precision:
      recs.length > 0 ? relevant / recs.length : reviewerOk || titleOk ? 1 : 0,
    unsupportedTitleRate:
      /could not find|couldn't verify|couldn't find/i.test(response.reply)
        ? 1
        : 0,
    novelOverview: response.novelOverview?.title,
    reviewer: response.reviewerOverview?.username,
    ids: recs.map((r) => r.novelId),
  };
}

async function evaluateSearch(task: Task) {
  const result = await runSearch({
    query: task.searchQuery,
    type: task.searchType,
    genreSlug: task.searchGenre,
    limit: 8,
  });
  const works = result.works;
  let relevant = 0;
  for (const work of works) {
    const genreOk =
      !task.expectGenre ||
      work.genres.some((g) => labelsMatch(g, task.expectGenre!));
    const constraintOk =
      !task.expectConstraint ||
      task.expectConstraint.test(work.title) ||
      work.genres.some((g) => task.expectConstraint!.test(g));
    if (genreOk && constraintOk) relevant += 1;
  }
  const peopleOk =
    task.searchType === "people" &&
    result.people.some((p) => /ezraink76/i.test(p.username));
  return {
    totals: result.totals,
    hitCount:
      task.searchType === "people"
        ? result.people.length
        : works.length,
    relevantHits: task.searchType === "people" ? (peopleOk ? 1 : 0) : relevant,
    precision:
      task.searchType === "people"
        ? peopleOk
          ? 1
          : 0
        : works.length > 0
          ? relevant / works.length
          : 0,
    topTitles:
      task.searchType === "people"
        ? result.people.slice(0, 3).map((p) => p.username)
        : works.slice(0, 3).map((w) => w.title),
  };
}

async function main() {
  const results = [];
  for (const task of TASKS) {
    const moonie = await evaluateMoonie(task);
    const search = await evaluateSearch(task);
    results.push({ task, moonie, search });
  }

  console.log(
    JSON.stringify({ evaluatedAt: new Date().toISOString(), results }, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
