import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isExplicitTitleLookup } from "@/lib/moonie/lookup-exclusions";
import {
  classifyMoonieIntents,
  extractNovelQuery,
  isBareCatalogueTitleQuery,
  isHardConstraintFollowUpMessage,
  isNonTitleLookupPhrase,
  isRecommendationDiscoveryMessage,
  primaryRetrievalIntent,
  resolveLookupTitleQuery,
} from "@/lib/moonie/intent";
import {
  EMPTY_INTERPRETED_PREFERENCES,
  buildFollowUpQuestion,
  extractPreferencesFromMessage,
  mergeConversationPreferences,
} from "@/lib/moonie/preferences";
import {
  isActionableMoonieFollowUp,
  resolveMoonieQuickPrompts,
} from "@/lib/moonie/presentation";
import {
  buildCurrentTurnHardConstraints,
  buildHardConstraintFollowUp,
  buildHardConstraintMatchCopy,
  buildHardConstraintNoResultsCopy,
  buildHardConstraintUnknownStatusCopy,
  buildHardConstraintExhaustionCopy,
  EMPTY_HARD_CONSTRAINTS,
  filterNovelsByHardConstraints,
  novelMatchesHardConstraints,
  hasHardInclusionConstraints,
  parseRequestedRecommendationCount,
  polishFollowUpRespectsHardConstraints,
  polishSummaryMakesCatalogueAbsenceClaim,
  resolveGenreMatchMode,
  retrievalPrefsForHardConstraints,
  shouldKeepGroundedReplyAfterPolish,
  shouldRelaxRestrictiveRetrieval,
} from "@/lib/moonie/hard-constraints";

const FANTASY_PROMPT = "Recommend me three fantasy novels with details";

describe("current-turn hard recommendation constraints", () => {
  it("extracts RECOMMEND, hard fantasy, and requested count 3", () => {
    const intents = classifyMoonieIntents(FANTASY_PROMPT, {});
    assert.deepEqual(intents, ["RECOMMEND"]);
    assert.equal(primaryRetrievalIntent(intents), "RECOMMEND");
    assert.equal(isRecommendationDiscoveryMessage(FANTASY_PROMPT), true);

    const hard = buildCurrentTurnHardConstraints(FANTASY_PROMPT);
    assert.deepEqual(hard.genres, ["fantasy"]);
    assert.equal(hard.genreMatch, "all");
    assert.equal(parseRequestedRecommendationCount(FANTASY_PROMPT), 3);
  });

  it("keeps retrieval hard genres Fantasy-only when Comedy is saved or prior", () => {
    const prior = mergeConversationPreferences([
      { role: "user", content: "I want comedy" },
      { role: "user", content: FANTASY_PROMPT },
    ]);
    assert.ok(prior.genres.includes("comedy"));
    assert.ok(prior.genres.includes("fantasy"));

    const hard = buildCurrentTurnHardConstraints(FANTASY_PROMPT);
    const ranking = {
      ...EMPTY_INTERPRETED_PREFERENCES,
      genres: [...new Set([...prior.genres, "Comedy"])],
    };
    assert.deepEqual(hard.genres, ["fantasy"]);
    assert.ok(ranking.genres.some((genre) => /comedy/i.test(genre)));
    const retrieval = retrievalPrefsForHardConstraints(ranking, hard);
    assert.deepEqual(retrieval.genres, ["fantasy"]);
    assert.equal(
      retrieval.genres.some((genre) => /comedy/i.test(genre)),
      false
    );
    const kept = filterNovelsByHardConstraints(
      [
        { genres: ["Comedy"] },
        { genres: ["Fantasy"] },
        { genres: ["Fantasy", "Comedy"] },
        { genres: ranking.genres },
      ],
      hard
    );
    assert.deepEqual(
      kept.map((novel) => novel.genres),
      [["Fantasy"], ["Fantasy", "Comedy"], ranking.genres]
    );
  });

  it("drops Comedy-only novels from the final hard-constraint gate", () => {
    const hard = buildCurrentTurnHardConstraints(FANTASY_PROMPT);
    const kept = filterNovelsByHardConstraints(
      [
        { genres: ["Comedy"] },
        { genres: ["Fantasy"] },
        { genres: ["Adventure", "Sports"] },
        { genres: ["Family", "Comedy"] },
        { genres: ["Fantasy", "Romance"] },
      ],
      hard
    );
    assert.deepEqual(
      kept.map((novel) => novel.genres),
      [["Fantasy"], ["Fantasy", "Romance"]]
    );
  });

  it("does not relax unfiltered fallback when an explicit genre is present", () => {
    const hard = buildCurrentTurnHardConstraints(FANTASY_PROMPT);
    assert.equal(shouldRelaxRestrictiveRetrieval(hard), false);
    assert.equal(shouldRelaxRestrictiveRetrieval(null), true);
    assert.equal(
      shouldRelaxRestrictiveRetrieval({
        ...EMPTY_HARD_CONSTRAINTS,
        status: "completed",
      }),
      false
    );
  });

  it("returns only verified matches when fewer than requested exist", () => {
    const hard = buildCurrentTurnHardConstraints(FANTASY_PROMPT);
    const requested = parseRequestedRecommendationCount(FANTASY_PROMPT) ?? 5;
    const matches = filterNovelsByHardConstraints(
      [
        { genres: ["Fantasy"], title: "A" },
        { genres: ["Comedy"], title: "B" },
        { genres: ["Fantasy"], title: "C" },
        { genres: ["Sports"], title: "D" },
      ],
      hard
    );
    assert.equal(matches.length < requested, true);
    assert.deepEqual(
      matches.map((novel) => (novel as { title: string }).title),
      ["A", "C"]
    );
  });

  it("requires every explicitly requested genre unless or is stated", () => {
    const andMessage = "Recommend fantasy romance novels";
    const andHard = buildCurrentTurnHardConstraints(andMessage);
    assert.ok(andHard.genres.includes("fantasy"));
    assert.ok(andHard.genres.includes("romance"));
    assert.equal(resolveGenreMatchMode(andMessage, andHard.genres), "all");
    assert.equal(
      filterNovelsByHardConstraints(
        [{ genres: ["Fantasy"] }, { genres: ["Fantasy", "Romance"] }],
        andHard
      ).length,
      1
    );

    const orMessage = "Recommend fantasy or romance novels";
    const orHard = buildCurrentTurnHardConstraints(orMessage);
    assert.equal(resolveGenreMatchMode(orMessage, orHard.genres), "any");
    assert.equal(
      filterNovelsByHardConstraints(
        [{ genres: ["Fantasy"] }, { genres: ["Romance"] }, { genres: ["Comedy"] }],
        orHard
      ).length,
      2
    );
  });

  it("parses completed AND (found-family OR slice-of-life) without requiring both themes", () => {
    const message = "Show me completed found family or slice-of-life novels";
    const hard = buildCurrentTurnHardConstraints(message);
    assert.deepEqual(hard.tags, ["found family", "slice-of-life"]);
    assert.equal(hard.status, "completed");
    assert.equal(hard.inclusionMatch, "any");
    assert.equal(
      novelMatchesHardConstraints(
        {
          genres: ["Romance"],
          tags: ["found family"],
          publicationStatus: "Completed",
        },
        hard
      ),
      true
    );
    assert.equal(
      novelMatchesHardConstraints(
        {
          genres: ["Slice of Life"],
          tags: [],
          publicationStatus: "Completed",
        },
        hard
      ),
      true
    );
    assert.equal(
      novelMatchesHardConstraints(
        {
          genres: ["Romance"],
          tags: ["found family"],
          publicationStatus: "Ongoing",
        },
        hard
      ),
      false
    );
    assert.equal(
      novelMatchesHardConstraints(
        {
          genres: ["Fantasy"],
          tags: ["cultivation"],
          publicationStatus: "Completed",
        },
        hard
      ),
      false
    );
  });

  it("preserves found-family OR slice-of-life as canonical current-turn criteria", () => {
    const message =
      "A comforting found-family or slice-of-life story with a hopeful ending.";
    const prefs = extractPreferencesFromMessage(message);
    const hard = buildCurrentTurnHardConstraints(message);

    assert.deepEqual(prefs.tags, ["found family", "slice-of-life"]);
    assert.deepEqual(hard.tags, ["found family", "slice-of-life"]);
    assert.equal(hard.inclusionMatch, "any");
    assert.deepEqual(
      filterNovelsByHardConstraints(
        [
          { genres: ["Romance"], tags: ["found family"] },
          { genres: ["Slice of Life"], tags: [] },
          { genres: ["Fantasy"], tags: ["slice-of-life"] },
          { genres: ["Fantasy"], tags: ["cultivation"] },
        ],
        hard
      ).map((novel) => [novel.genres, novel.tags]),
      [
        [["Romance"], ["found family"]],
        [["Slice of Life"], []],
        [["Fantasy"], ["slice-of-life"]],
      ]
    );
  });

  it("keeps completed AND slice-of-life hard on repeated explicit follow-ups", () => {
    const message = "Show me completed slice-of-life novels";
    const hard = buildCurrentTurnHardConstraints(message);

    assert.deepEqual(hard.tags, ["slice-of-life"]);
    assert.equal(hard.inclusionMatch, "all");
    assert.equal(hard.status, "completed");
    assert.deepEqual(
      filterNovelsByHardConstraints(
        [
          {
            genres: ["Romance"],
            tags: ["slice-of-life"],
            publicationStatus: "Completed",
          },
          {
            genres: ["Slice of Life"],
            tags: [],
            publicationStatus: "Completed",
          },
          {
            genres: ["Romance"],
            tags: ["slice-of-life"],
            publicationStatus: "Ongoing",
          },
          {
            genres: ["Romance"],
            tags: ["found family"],
            publicationStatus: "Completed",
          },
        ],
        hard
      ).length,
      2
    );
  });

  it("leaves vague surprise-me requests without current-turn hard genres", () => {
    const message = "surprise me";
    assert.equal(isRecommendationDiscoveryMessage(message), true);
    const hard = buildCurrentTurnHardConstraints(message);
    assert.equal(hasHardInclusionConstraints(hard), false);
    assert.deepEqual(extractPreferencesFromMessage(message).genres, []);
    assert.equal(shouldRelaxRestrictiveRetrieval(hard), true);
  });

  it("does not reroute lookup, reviews, reviewers, or more-like as recommend", () => {
    assert.equal(
      primaryRetrievalIntent(
        classifyMoonieIntents("find Cultivation Chat Group", {})
      ),
      "FIND_NOVEL"
    );
    assert.equal(
      primaryRetrievalIntent(
        classifyMoonieIntents("show me reviews for Cultivation Chat Group", {})
      ),
      "NOVEL_REVIEWS"
    );
    assert.equal(
      classifyMoonieIntents("all information about top 3 reviewer", {
        hasPriorReviewerResults: true,
      }).includes("FIND_REVIEWERS") ||
        classifyMoonieIntents("all information about top 3 reviewer", {
          hasPriorReviewerResults: true,
        }).includes("REVIEWER_OVERVIEW"),
      true
    );
    assert.equal(
      primaryRetrievalIntent(
        classifyMoonieIntents("more like this", { hasActiveNovel: true })
      ),
      "MORE_LIKE_THIS"
    );
    assert.equal(
      buildCurrentTurnHardConstraints("find Cultivation Chat Group").genres
        .includes("fantasy"),
      false
    );
  });

  it("does not let negated wording or OpenAI extract make Fantasy hard", () => {
    const extracted = {
      genres: ["fantasy"],
      status: null,
      language: null,
      length: null,
    };
    for (const message of [
      "Recommend anything but fantasy",
      "I don't want fantasy",
      "I don’t want fantasy",
      "Avoid fantasy",
      "Recommend novels, not fantasy",
      "Exclude fantasy",
      "I hate fantasy",
      "No more fantasy",
    ]) {
      const hard = buildCurrentTurnHardConstraints(message, extracted);
      assert.equal(
        hard.genres.some((genre) => /fantasy/i.test(genre)),
        false,
        message
      );
    }

    const positive = buildCurrentTurnHardConstraints(
      "Recommend fantasy",
      extracted
    );
    assert.deepEqual(positive.genres, ["fantasy"]);

    assert.equal(
      buildCurrentTurnHardConstraints("Avoid completed novels", {
        genres: [],
        status: "completed",
        language: null,
        length: null,
      }).status,
      null
    );
    assert.equal(
      buildCurrentTurnHardConstraints("Recommend completed novels", {
        genres: [],
        status: "completed",
        language: null,
        length: null,
      }).status,
      "completed"
    );

    assert.equal(
      buildCurrentTurnHardConstraints("I don't want English novels", {
        genres: [],
        status: null,
        language: "en",
        length: null,
      }).language,
      null
    );
    assert.equal(
      buildCurrentTurnHardConstraints("Recommend English novels", {
        genres: [],
        status: null,
        language: "en",
        length: null,
      }).language,
      "en"
    );

    assert.equal(
      buildCurrentTurnHardConstraints("No more short novels", {
        genres: [],
        status: null,
        language: null,
        length: "short",
      }).length,
      null
    );
    assert.equal(
      buildCurrentTurnHardConstraints("Recommend short novels", {
        genres: [],
        status: null,
        language: null,
        length: "short",
      }).length,
      "short"
    );
  });

  it("does not let unverified OpenAI extraction add hard inclusions", () => {
    const hard = buildCurrentTurnHardConstraints(FANTASY_PROMPT, {
      genres: ["fantasy", "comedy"],
      status: "completed",
      language: "en",
      length: "short",
    });
    assert.deepEqual(hard.genres, ["fantasy"]);
    assert.equal(hard.status, null);
    assert.equal(hard.language, null);
    assert.equal(hard.length, null);

    const statusOnly = buildCurrentTurnHardConstraints(FANTASY_PROMPT, {
      genres: [],
      status: "ongoing",
      language: null,
      length: null,
    });
    assert.equal(statusOnly.status, null);
    assert.deepEqual(statusOnly.genres, ["fantasy"]);

    const languageOnly = buildCurrentTurnHardConstraints(FANTASY_PROMPT, {
      genres: [],
      status: null,
      language: "zh",
      length: null,
    });
    assert.equal(languageOnly.language, null);
    assert.deepEqual(languageOnly.genres, ["fantasy"]);
  });

  it("keeps a verified extracted label that the current message actually states", () => {
    const message = "Recommend litrpg fantasy novels";
    const hard = buildCurrentTurnHardConstraints(message, {
      genres: ["litrpg"],
      status: null,
      language: null,
      length: null,
    });
    assert.ok(hard.genres.includes("fantasy"));
    assert.ok(hard.genres.includes("litrpg"));
  });

  it("always keeps grounded reply and summary while hard constraints are active", () => {
    const hard = buildCurrentTurnHardConstraints(FANTASY_PROMPT);
    assert.equal(shouldKeepGroundedReplyAfterPolish(hard), true);
    assert.equal(shouldKeepGroundedReplyAfterPolish(null), false);
    assert.equal(
      shouldKeepGroundedReplyAfterPolish({
        ...EMPTY_HARD_CONSTRAINTS,
      }),
      false
    );
    assert.equal(
      polishSummaryMakesCatalogueAbsenceClaim(
        "No candidates are tagged as fantasy, so I fell back to your comedy preferences."
      ),
      true
    );
    const misleading =
      "These picks lean on your usual comedy taste because fantasy is thin here.";
    assert.equal(polishSummaryMakesCatalogueAbsenceClaim(misleading), false);
    assert.equal(shouldKeepGroundedReplyAfterPolish(hard), true);
    assert.equal(
      polishFollowUpRespectsHardConstraints(
        "Want me to switch over to comedy instead?",
        hard
      ),
      false
    );
    assert.equal(
      polishFollowUpRespectsHardConstraints(
        "Want more like the top pick, or a different Fantasy angle?",
        hard
      ),
      true
    );
    const zero = buildHardConstraintNoResultsCopy(hard);
    assert.match(zero.reply, /Fantasy/i);
    assert.match(zero.reply, /will not fill/i);
    const unknown = buildHardConstraintUnknownStatusCopy({
      ...hard,
      status: "completed",
    });
    assert.match(unknown.reply, /don't list a clear completed status|do not list a reliable completed status/i);
    const exhaustion = buildHardConstraintExhaustionCopy({
      hard: { ...hard, status: "completed" },
      seekingUnseen: false,
      hasExplicitExclusions: false,
      hasPreviouslyShownMatches: false,
      unverifiedStatusMatches: 12,
    });
    assert.match(exhaustion.reply, /don't list a clear completed status|do not list a reliable completed status/i);
  });

  it("keeps a Fantasy-aware follow-up that never mentions saved Comedy", () => {
    const hard = buildCurrentTurnHardConstraints(FANTASY_PROMPT);
    const ranking = {
      ...EMPTY_INTERPRETED_PREFERENCES,
      genres: ["comedy", "fantasy"],
    };
    assert.ok(ranking.genres.includes("comedy"));
    const followUp = buildHardConstraintFollowUp(hard);
    const mergedFollowUp = buildFollowUpQuestion(ranking);
    assert.ok(followUp);
    assert.equal(followUp, "Show me completed fantasy novels");
    assert.match(followUp ?? "", /fantasy/i);
    assert.equal(/comedy/i.test(followUp ?? ""), false);
    assert.equal(/romance|cultivation/i.test(followUp ?? ""), false);
    assert.equal(/comedy/i.test(mergedFollowUp ?? ""), false);
    assert.equal(/fantasy/i.test(mergedFollowUp ?? ""), false);
    assert.equal(
      polishFollowUpRespectsHardConstraints(followUp ?? "", hard),
      true
    );
  });

  it("routes hard-constraint follow-ups as recommendation commands, not title lookup", () => {
    const fantasy = buildCurrentTurnHardConstraints(FANTASY_PROMPT);
    const completed = buildCurrentTurnHardConstraints(
      "Recommend completed fantasy novels"
    );
    const shortCompleted = buildCurrentTurnHardConstraints(
      "Recommend short completed fantasy novels"
    );
    const followUps = [
      buildHardConstraintFollowUp(fantasy),
      buildHardConstraintFollowUp(completed),
      buildHardConstraintFollowUp(shortCompleted),
    ];
    assert.deepEqual(followUps, [
      "Show me completed fantasy novels",
      "Show me short completed fantasy novels",
      "Show me more fantasy novels",
    ]);

    const lookupContext = {
      hasPriorRecommendations: true,
      hasActiveNovel: true,
      hasConversationPrefs: true,
    };
    for (const followUp of followUps) {
      assert.ok(followUp);
      assert.equal(isHardConstraintFollowUpMessage(followUp ?? ""), true);
      assert.equal(isNonTitleLookupPhrase(followUp ?? ""), true);
      assert.equal(extractNovelQuery(followUp ?? ""), null);
      assert.equal(isBareCatalogueTitleQuery(followUp ?? ""), false);
      const intents = classifyMoonieIntents(followUp ?? "", lookupContext);
      const primary = primaryRetrievalIntent(intents);
      assert.ok(
        primary === "RECOMMEND" || primary === "REFINE",
        followUp ?? ""
      );
      assert.equal(intents.includes("FIND_NOVEL"), false, followUp ?? "");
      assert.equal(
        resolveLookupTitleQuery(followUp ?? "", intents),
        null,
        followUp ?? ""
      );
      assert.equal(
        isExplicitTitleLookup(followUp ?? "", intents),
        false,
        followUp ?? ""
      );
    }

    const newCommand = "Show me completed fantasy novels";
    const newHard = buildCurrentTurnHardConstraints(newCommand);
    assert.deepEqual(newHard.genres, ["fantasy"]);
    assert.equal(newHard.status, "completed");

    const legacy = "Want completed fantasy only, or are ongoing stories fine?";
    assert.equal(isHardConstraintFollowUpMessage(legacy), true);
    assert.equal(isNonTitleLookupPhrase(legacy), true);
    assert.equal(extractNovelQuery(legacy), null);
    assert.equal(isBareCatalogueTitleQuery(legacy), false);
    const legacyIntents = classifyMoonieIntents(legacy, lookupContext);
    const legacyPrimary = primaryRetrievalIntent(legacyIntents);
    assert.ok(legacyPrimary === "RECOMMEND" || legacyPrimary === "REFINE");
    assert.equal(legacyIntents.includes("FIND_NOVEL"), false);
    assert.equal(resolveLookupTitleQuery(legacy, legacyIntents), null);
    assert.equal(isExplicitTitleLookup(legacy, legacyIntents), false);
    const legacyHard = buildCurrentTurnHardConstraints(legacy);
    assert.deepEqual(legacyHard.genres, ["fantasy"]);
    assert.equal(legacyHard.status, null);
  });

  it("keeps assistant questions as text and user-action follow-ups clickable", () => {
    assert.equal(
      isActionableMoonieFollowUp("Show me completed fantasy novels"),
      true
    );
    assert.equal(isActionableMoonieFollowUp("Compare these."), true);
    assert.equal(
      isActionableMoonieFollowUp("This one — Cultivation Chat Group"),
      true
    );
    assert.equal(
      isActionableMoonieFollowUp(
        "Want completed fantasy only, or are ongoing stories fine?"
      ),
      false
    );
    assert.equal(
      isActionableMoonieFollowUp(
        "Can you share another clue — author, genre, or title fragment?"
      ),
      false
    );
    assert.equal(
      isActionableMoonieFollowUp(
        "Try the full title, an alternate spelling, or browse the catalogue."
      ),
      false
    );
    assert.equal(
      isActionableMoonieFollowUp("Try: Find Cultivation Chat Group"),
      true
    );
    assert.deepEqual(
      resolveMoonieQuickPrompts({
        id: "assistant-quick-starts",
        role: "assistant",
        content: "Try one of these.",
        followUpQuestion: "Quick starts: Completed fantasy, Short fantasy",
      }),
      ["Completed fantasy", "Short fantasy"]
    );
  });

  it("mentions an explicit requested count but not the internal default take", () => {
    const hard = buildCurrentTurnHardConstraints(FANTASY_PROMPT);
    const explicitShortfall = buildHardConstraintMatchCopy({
      matchCount: 2,
      take: 3,
      explicitCount: 3,
      hard,
    });
    assert.match(explicitShortfall.reply, /You asked for 3/);
    assert.equal(/You asked for 5/.test(explicitShortfall.reply), false);

    const defaultShortfall = buildHardConstraintMatchCopy({
      matchCount: 2,
      take: 5,
      explicitCount: null,
      hard,
    });
    assert.match(defaultShortfall.reply, /I found 2 MoonVerse novels/);
    assert.equal(/You asked for 5/.test(defaultShortfall.reply), false);
    assert.equal(/You asked for/.test(defaultShortfall.reply), false);
  });

  it("ignores years and star ratings when parsing recommendation counts", () => {
    assert.equal(
      parseRequestedRecommendationCount("Recommend fantasy novels from 2024"),
      null
    );
    assert.equal(
      parseRequestedRecommendationCount("Recommend 5 star fantasy novels"),
      null
    );
  });
});
