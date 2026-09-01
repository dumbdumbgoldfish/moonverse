import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyMoonieIntents,
  extractExplicitNovelLookupFragment,
  extractNovelQuery,
  extractReviewNovelQuery,
  isExplicitUnresolvableNovelLookup,
  isGenericNovelPlaceholderTitle,
  isNovelReviewRequest,
  isReviewFollowUpMessage,
  primaryRetrievalIntent,
  resolveBareReviewRequest,
  resolveEmbeddedNovelFactualQuestion,
  resolveNovelFactualFieldQuestion,
  unresolvableNovelLookupReply,
} from "@/lib/moonie/intent";
import { resolveNovelScopedReviewRequest } from "@/lib/moonie/novel-review-intent";
import {
  buildTypedConversationContext,
  isNovelLookupContextSuppressed,
  isNovelOrdinalFollowUpMessage,
  isReviewAuthorFollowUpMessage,
  resolveRecommendationOrdinalNovel,
  resolveNovelAuthorFromRecentRecommendations,
  resolveReviewAuthorFromTypedContext,
  reviewAuthorFollowUpClarification,
  reviewAuthorFollowUpSupersededByRecommendations,
} from "@/lib/moonie/follow-up-context";
import {
  isWhoWroteReviewQuestion,
  messageReferencesDisplayedReview,
  resolveDisplayedRankedReview,
} from "@/lib/moonie/ranked-review-context";
import {
  extractAtUsernameQuery,
  extractNamedReviewerQuery,
  isReviewerOverviewMessage,
  messageReferencesActiveReviewer,
} from "@/lib/moonie/reviewer-intent";
import { parseSimilarityRequest } from "@/lib/moonie/similarity-request";
import { buildConversationContext } from "@/lib/moonie/conversation-context";
import type { MoonieRankedReview } from "@/types/moonie";

function sampleRankedReviews(): MoonieRankedReview[] {
  return [
    {
      id: "rev-1",
      title: "First take",
      rating: 5,
      excerpt: "Great read.",
      novelId: "novel-1",
      novelTitle: "The Hidden Oracle",
      reviewerName: "Alice",
      reviewerUsername: "alice",
      likeCount: 2,
      commentCount: 0,
      containsSpoilers: false,
    },
    {
      id: "rev-2",
      title: "Second take",
      rating: 4,
      excerpt: "Solid.",
      novelId: "novel-1",
      novelTitle: "The Hidden Oracle",
      reviewerName: "Bob",
      reviewerUsername: "bob",
      likeCount: 1,
      commentCount: 0,
      containsSpoilers: false,
    },
  ];
}

describe("moonie QA regression — intent extraction", () => {
  it("preserves leading article in tell-me-about title extraction", () => {
    const title = extractNovelQuery("Tell me about The Hidden Oracle");
    assert.ok(title);
    assert.match(title!, /hidden oracle/i);
    assert.doesNotMatch(title!, /^hidden oracle$/i);
  });

  it("routes embedded genre questions as novel overview, not recommendations", () => {
    const message = "What genre is The Hidden Oracle?";
    const embedded = resolveEmbeddedNovelFactualQuestion(message);
    assert.equal(embedded?.field, "genre");
    assert.match(embedded?.title ?? "", /hidden oracle/i);

    const intents = classifyMoonieIntents(message);
    assert.ok(
      intents.includes("NOVEL_OVERVIEW") || intents.includes("FIND_NOVEL")
    );
    assert.equal(intents.includes("RECOMMEND"), false);
    assert.notEqual(primaryRetrievalIntent(intents), "RECOMMEND");
  });

  it("parses counted review requests for a titled novel", () => {
    const two = resolveNovelScopedReviewRequest(
      "Give me two reviews of The Hidden Oracle"
    );
    assert.equal(two?.kind, "list");
    assert.equal(two?.count, 2);
    assert.match(two?.novelQuery ?? "", /hidden oracle/i);

    const one = resolveNovelScopedReviewRequest(
      "Give me 1 review of The Hidden Oracle"
    );
    assert.equal(one?.count, 1);

    const five = resolveNovelScopedReviewRequest(
      "Give me 5 reviews of The Hidden Oracle"
    );
    assert.equal(five?.count, 5);
  });

  it("parses singular and plural review-link intents", () => {
    const singular = resolveNovelScopedReviewRequest(
      "Give me the review link for The Hidden Oracle"
    );
    assert.equal(singular?.kind, "review_link");
    assert.match(singular?.novelQuery ?? "", /hidden oracle/i);

    const plural = resolveNovelScopedReviewRequest(
      "Give me review links for The Hidden Oracle"
    );
    assert.equal(plural?.kind, "review_links");
  });

  it("extracts explicit @username on reviews-by phrasing", () => {
    assert.equal(
      extractAtUsernameQuery("Show me reviews by @yuexian"),
      "yuexian"
    );
  });
});

describe("moonie QA regression — ranked review context", () => {
  const session = {
    novelId: "novel-1",
    novelTitle: "The Hidden Oracle",
    reviews: sampleRankedReviews(),
  };

  it("does not treat this review as a catalogue title", () => {
    assert.equal(extractNovelQuery("Who wrote this review?"), null);
    assert.equal(isWhoWroteReviewQuestion("Who wrote this review?"), true);
    assert.equal(messageReferencesDisplayedReview("Who wrote this review?"), true);
  });

  it("resolves ordinal and pronoun review references from prior cards", () => {
    const first = resolveDisplayedRankedReview({
      message: "Who wrote the first review?",
      session,
    });
    assert.equal(first.review?.reviewerName, "Alice");
    assert.equal(first.ambiguous, false);

    const second = resolveDisplayedRankedReview({
      message: "Who wrote the second review?",
      session,
    });
    assert.equal(second.review?.reviewerName, "Bob");

    const single = resolveDisplayedRankedReview({
      message: "Who wrote this review?",
      session: { ...session, reviews: [session.reviews[0]!] },
    });
    assert.equal(single.review?.reviewerName, "Alice");
    assert.equal(single.ambiguous, false);
  });

  it("promotes single displayed review author for tell me about the reviewer", () => {
    const review = session.reviews[0]!;
    const ctx = buildConversationContext(
      [
        { role: "user", content: "Give me 1 review of The Hidden Oracle" },
        {
          role: "assistant",
          content: "Here is one review.",
          meta: { rankedReviews: [review] },
        },
      ],
      { currentMessage: "Tell me about the reviewer" }
    );
    assert.equal(ctx.activeReviewerUsername, review.reviewerUsername);
    assert.equal(ctx.activeReviewerDisplayName, review.reviewerName);
  });

  it("marks ambiguous this-review when multiple cards are shown", () => {
    const ambiguous = resolveDisplayedRankedReview({
      message: "Who wrote this review?",
      session,
    });
    assert.equal(ambiguous.ambiguous, true);
    assert.equal(ambiguous.review, null);
  });

  it("does not route tell me about random text to reviewer lookup", () => {
    assert.equal(extractNamedReviewerQuery("Tell me about asdfghjkl"), null);
    assert.equal(isReviewerOverviewMessage("Tell me about asdfghjkl"), false);
    const intents = classifyMoonieIntents("Tell me about asdfghjkl");
    assert.equal(intents.includes("REVIEWER_OVERVIEW"), false);
    assert.equal(intents.includes("FIND_REVIEWERS"), false);
  });

  it("still routes tell me about reviewer @foo correctly", () => {
    assert.equal(
      extractAtUsernameQuery("Tell me about reviewer @fixtureuser"),
      "fixtureuser"
    );
    const intents = classifyMoonieIntents("Tell me about reviewer @fixtureuser");
    assert.ok(intents.includes("REVIEWER_OVERVIEW"));
    const authored = classifyMoonieIntents("Show me reviews by @fixtureuser");
    assert.ok(
      authored.includes("REVIEWER_OVERVIEW") || authored.includes("FIND_REVIEWERS")
    );
  });

  it("rejects generic unknown-novel placeholder titles", () => {
    assert.equal(
      isGenericNovelPlaceholderTitle("a novel that does not exist"),
      true
    );
    assert.equal(
      isGenericNovelPlaceholderTitle("that does not exist"),
      true
    );
    assert.equal(
      extractReviewNovelQuery("Give me reviews for a novel that does not exist"),
      null
    );
  });

  it("resolves who wrote the first one only from a recent review list", () => {
    const typed = buildTypedConversationContext([
      {
        role: "assistant",
        content: "Old recommendations",
        meta: {
          recommendations: [
            {
              novelId: "old-novel",
              title: "Stale Recommendation",
              matchPercent: 80,
            },
          ],
        },
      },
      {
        role: "user",
        content: "reviews for Fixture Novel",
      },
      {
        role: "assistant",
        content: "Here are reviews",
        meta: {
          rankedReviews: sampleRankedReviews(),
        },
      },
    ]);
    assert.equal(isReviewAuthorFollowUpMessage("Who wrote the first one?"), true);
    const resolved = resolveReviewAuthorFromTypedContext({
      message: "Who wrote the first one?",
      typed,
    });
    assert.equal(resolved.missingContext, false);
    assert.equal(resolved.review?.reviewerName, "Alice");
  });

  it("does not resolve who wrote the first one from stale recommendations", () => {
    const typed = buildTypedConversationContext([
      {
        role: "assistant",
        content: "Recommendations",
        meta: {
          recommendations: [
            {
              novelId: "old-novel",
              title: "The Things We Leave Unfinished",
              matchPercent: 80,
            },
          ],
        },
      },
      {
        role: "user",
        content: "Tell me about The Hidden Oracle",
      },
      {
        role: "assistant",
        content: "I couldn't verify that title.",
      },
      {
        role: "user",
        content: "Give me two reviews",
      },
      {
        role: "assistant",
        content: "Which novel?",
      },
    ]);
    const resolved = resolveReviewAuthorFromTypedContext({
      message: "Who wrote the first one?",
      typed,
    });
    assert.equal(resolved.missingContext, true);
    assert.match(reviewAuthorFollowUpClarification(), /review list/i);
  });

  it("parses counted similar-to requests with explicit seed title", () => {
    const parsed = parseSimilarityRequest(
      "Give me three novels similar to The Hidden Oracle"
    );
    assert.ok(parsed);
    assert.match(parsed?.seedTitle ?? "", /hidden oracle/i);
  });

  it("parses natural-language similar-to variants as explicit similarity", () => {
    const variants = [
      "Recommend me something similar to The Hidden Oracle",
      "Recommend something similar to The Hidden Oracle",
      "Give me something similar to The Hidden Oracle",
      "Find me something like The Hidden Oracle",
      "Recommend me a novel like The Hidden Oracle",
    ];
    for (const message of variants) {
      const parsed = parseSimilarityRequest(message);
      assert.ok(parsed, message);
      assert.match(parsed?.seedTitle ?? "", /hidden oracle/i, message);
      const intents = classifyMoonieIntents(message);
      assert.equal(primaryRetrievalIntent(intents), "MORE_LIKE_THIS", message);
    }
  });
});

describe("moonie QA regression — M-13–M-16 context", () => {
  it("M-13: promotes ordinal-resolved review for this-review follow-up", () => {
    const reviews = sampleRankedReviews();
    const typed = buildTypedConversationContext([
      {
        role: "assistant",
        content: "Here are reviews",
        meta: { rankedReviews: reviews },
      },
      {
        role: "user",
        content: "Who wrote the first one?",
      },
      {
        role: "assistant",
        content: "Alice wrote it",
        meta: { rankedReviews: [reviews[0]!] },
      },
    ]);
    const resolved = resolveReviewAuthorFromTypedContext({
      message: "Who wrote this review?",
      typed,
    });
    assert.equal(resolved.missingContext, false);
    assert.equal(resolved.ambiguous, false);
    assert.equal(resolved.review?.reviewerName, "Alice");
  });

  it("M-14: flags placeholder tell-me-about phrases as unresolvable", () => {
    const phrases = [
      "Tell me about a novel that does not exist",
      "Tell me about some unknown novel",
      "Tell me about a book that isn't there",
    ];
    for (const phrase of phrases) {
      assert.equal(isExplicitUnresolvableNovelLookup(phrase), true);
      assert.equal(extractNovelQuery(phrase), null);
      assert.match(unresolvableNovelLookupReply(), /couldn't identify/i);
    }
  });

  it("M-15: bare counted review requests keep review intent without a title", () => {
    assert.ok(resolveBareReviewRequest("Give me two reviews"));
    assert.equal(isNovelReviewRequest("Give me two reviews"), true);
    const scoped = resolveNovelScopedReviewRequest("Give me two reviews");
    assert.equal(scoped?.kind, "list");
    assert.equal(scoped?.count, 2);
    assert.equal(scoped?.usesActiveNovelContext, true);
    const intents = classifyMoonieIntents("Give me two reviews");
    assert.ok(intents.includes("NOVEL_REVIEWS"));
    assert.equal(primaryRetrievalIntent(intents), "NOVEL_REVIEWS");
  });

  it("M-15: suppressed lookup context blocks stale active novel reuse", () => {
    const messages = [
      {
        role: "assistant",
        content: "Overview",
        meta: {
          novelOverview: { novelId: "novel-1", title: "The Hidden Oracle" },
        },
      },
      {
        role: "user",
        content: "Tell me about a novel that does not exist",
      },
      {
        role: "assistant",
        content: unresolvableNovelLookupReply(),
        meta: { lookupContextSuppressed: true },
      },
    ];
    assert.equal(isNovelLookupContextSuppressed(messages), true);
    const scoped = resolveNovelScopedReviewRequest("Give me two reviews");
    assert.equal(scoped?.count, 2);
  });

  it("M-16: recommendation list supersedes stale review list for who wrote ordinals", () => {
    const reviews = sampleRankedReviews();
    const typed = buildTypedConversationContext([
      {
        role: "assistant",
        content: "Here are reviews",
        meta: { rankedReviews: reviews },
      },
      {
        role: "user",
        content: "Who wrote the first one?",
      },
      {
        role: "assistant",
        content: "Alice",
        meta: { rankedReviews: [reviews[0]!] },
      },
      {
        role: "user",
        content: "Give me three novels similar to The Hidden Oracle",
      },
      {
        role: "assistant",
        content: "Here are picks",
        meta: {
          recommendations: [
            {
              novelId: "rec-1",
              title: "Novel A",
              author: "Author A",
              matchPercent: 90,
            },
            {
              novelId: "rec-2",
              title: "Novel B",
              author: "Author B",
              matchPercent: 85,
            },
            {
              novelId: "rec-3",
              title: "Novel C",
              author: "Author C",
              matchPercent: 80,
            },
          ],
        },
      },
    ]);
    assert.equal(
      reviewAuthorFollowUpSupersededByRecommendations(
        "Who wrote the second one?",
        typed
      ),
      true
    );
    const reviewResolved = resolveReviewAuthorFromTypedContext({
      message: "Who wrote the second one?",
      typed,
    });
    assert.equal(reviewResolved.missingContext, true);
    assert.notEqual(reviewResolved.review?.reviewerName, "Bob");

    const novelAuthor = resolveNovelAuthorFromRecentRecommendations({
      message: "Who wrote the second one?",
      typed,
    });
    assert.equal(novelAuthor.author, "Author B");
    assert.equal(novelAuthor.title, "Novel B");
  });

  describe("M-17–M-24 regressions", () => {
    it("M-17: novel author questions route to catalogue lookup, not reviewer", () => {
      const msg = "Who is the author of The Hidden Oracle?";
      assert.equal(resolveEmbeddedNovelFactualQuestion(msg)?.field, "author");
      assert.equal(
        resolveEmbeddedNovelFactualQuestion(msg)?.title,
        "The Hidden Oracle"
      );
      assert.equal(isReviewerOverviewMessage(msg), false);
      const intents = classifyMoonieIntents(msg);
      assert.equal(intents.includes("REVIEWER_OVERVIEW"), false);
      assert.equal(
        primaryRetrievalIntent(intents),
        "NOVEL_OVERVIEW"
      );
    });

    it("M-17: who wrote variant extracts title only", () => {
      const msg = "Who wrote The Hidden Oracle?";
      assert.equal(resolveEmbeddedNovelFactualQuestion(msg)?.title, "The Hidden Oracle");
    });

    it("M-18: average rating extracts novel title only", () => {
      const msg = "What is the average rating for The Hidden Oracle?";
      const embedded = resolveEmbeddedNovelFactualQuestion(msg);
      assert.equal(embedded?.field, "rating");
      assert.equal(embedded?.title, "The Hidden Oracle");
      assert.equal(extractNovelQuery(msg), null);
    });

    it("M-19: public review count routes as review_count factual", () => {
      const variants = [
        "How many public reviews does The Hidden Oracle have?",
        "How many reviews does The Hidden Oracle have?",
        "How many public reviews are there for The Hidden Oracle?",
      ];
      for (const msg of variants) {
        const embedded = resolveEmbeddedNovelFactualQuestion(msg);
        assert.equal(embedded?.field, "review_count");
        assert.equal(embedded?.title, "The Hidden Oracle");
      }
    });

    it("M-20: counted review requests are explicit count scoped", () => {
      const one = resolveNovelScopedReviewRequest(
        "Give me one review of The Hidden Oracle"
      );
      assert.equal(one?.explicitCountRequest, true);
      assert.equal(one?.count, 1);
      const three = resolveNovelScopedReviewRequest(
        "Give me three reviews of The Hidden Oracle"
      );
      assert.equal(three?.explicitCountRequest, true);
      assert.equal(three?.count, 3);
    });

    it("M-21: oldest review intent resolves with oldest metric", () => {
      const scoped = resolveNovelScopedReviewRequest(
        "Show me the oldest review for The Hidden Oracle"
      );
      assert.equal(scoped?.kind, "ranked");
      assert.equal(scoped?.metric, "review_oldest");
      assert.equal(scoped?.novelQuery, "The Hidden Oracle");
    });

    it("M-21: highest-rated single review is ranked without aggregate", () => {
      const scoped = resolveNovelScopedReviewRequest(
        "Show me the highest rated review for The Hidden Oracle"
      );
      assert.equal(scoped?.kind, "ranked");
      assert.equal(scoped?.metric, "review_rating");
      assert.equal(scoped?.count, 1);
    });

    it("M-22: who reviewed does not match reviewer overview", () => {
      const msg = "Who reviewed The Hidden Oracle?";
      assert.equal(isReviewerOverviewMessage(msg), false);
      const scoped = resolveNovelScopedReviewRequest(msg);
      assert.equal(scoped?.kind, "who_reviewed");
    });

    it("M-23: explicit @username does not reference stale active reviewer", () => {
      const msg = "Show me reviews by @thisuserdoesnotexist";
      assert.equal(extractAtUsernameQuery(msg), "thisuserdoesnotexist");
      assert.equal(messageReferencesActiveReviewer(msg), false);
    });

    it("M-24: recommendation ordinal tell-me-about is not unresolvable", () => {
      const msg = "Tell me about the second one";
      assert.equal(isExplicitUnresolvableNovelLookup(msg), false);
      assert.equal(isNovelOrdinalFollowUpMessage(msg), true);
    });

    it("M-24: full recommendation chain context resolution", () => {
      const typed = buildTypedConversationContext([
        { role: "user", content: "Recommend me three fantasy novels" },
        {
          role: "assistant",
          content: "Here are picks.",
          meta: {
            recommendations: [
              { novelId: "n1", title: "Novel A", author: "Author A", matchPercent: 90 },
              { novelId: "n2", title: "Novel B", author: "Author B", matchPercent: 85 },
              { novelId: "n3", title: "Novel C", author: "Author C", matchPercent: 80 },
            ],
          },
        },
        { role: "user", content: "Tell me about the second one" },
        {
          role: "assistant",
          content: "Overview.",
          meta: {
            novelOverview: { novelId: "n2", title: "Novel B" },
          },
        },
      ]);
      const ordinalNovel = resolveRecommendationOrdinalNovel({
        message: "Tell me about the second one",
        typed,
      });
      assert.equal(ordinalNovel?.novelId, "n2");
      assert.equal(ordinalNovel?.title, "Novel B");

      const typedAfterOverview = buildTypedConversationContext([
        { role: "user", content: "Recommend me three fantasy novels" },
        {
          role: "assistant",
          content: "Here are picks.",
          meta: {
            recommendations: [
              { novelId: "n1", title: "Novel A", author: "Author A", matchPercent: 90 },
              { novelId: "n2", title: "Novel B", author: "Author B", matchPercent: 85 },
              { novelId: "n3", title: "Novel C", author: "Author C", matchPercent: 80 },
            ],
          },
        },
        { role: "user", content: "Tell me about the second one" },
        {
          role: "assistant",
          content: "Overview.",
          meta: {
            novelOverview: { novelId: "n2", title: "Novel B" },
          },
        },
      ]);
      const authorFromRec = resolveNovelAuthorFromRecentRecommendations({
        message: "Who wrote it?",
        typed: typedAfterOverview,
      });
      assert.equal(authorFromRec.missingContext, true);

      const activeFactual = resolveNovelFactualFieldQuestion("Who wrote it?");
      assert.equal(activeFactual, "author");

      const reviewFollowUp = isReviewFollowUpMessage("Give me reviews for it");
      assert.equal(reviewFollowUp, true);
    });
  });
});
