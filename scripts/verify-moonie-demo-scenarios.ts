/**
 * Live demo scenario smoke test for Phase 6.
 * Run: npx tsx scripts/verify-moonie-demo-scenarios.ts
 */
import { buildConversationContext } from "@/lib/moonie/conversation-context";
import { resolveMoonieChatHeaderStatus } from "@/lib/moonie/chat-phases";
import {
  buildMoonieRateLimitApiError,
  buildMoonieRateLimitBody,
  formatDiscoveryQuotaUsed,
} from "@/lib/moonie/quota-copy";
import { MOONIE_DAILY_DISCOVERY_LIMIT } from "@/lib/moonie/constants";
import { handleMoonieRequest } from "@/services/moonie-response.service";
import type { MoonieChatMessage } from "@/types/moonie";

type Scenario = {
  id: string;
  run: () => Promise<{ pass: boolean; detail: string }>;
};

type Turn = { role: "user" | "assistant"; content: string; meta?: unknown };

function assistantMetaFromResult(
  result: Awaited<ReturnType<typeof handleMoonieRequest>>
): unknown {
  return {
    reviewerResults: result.reviewerResults,
    reviewerSession: result.reviewerSession,
    reviewerOverview: result.reviewerOverview,
    reviewerGroupOverview: result.reviewerGroupOverview,
    reviewerReviewSession: result.reviewerReviewSession,
    recommendations: result.recommendations,
    novelOverview: result.novelOverview,
    lookupSession: result.lookupSession,
  };
}

async function runConversationSequence(messages: string[]) {
  const history: Turn[] = [];
  const results: Array<Awaited<ReturnType<typeof handleMoonieRequest>>> = [];

  for (const message of messages) {
    const result = await handleMoonieRequest({
      message,
      messages: history,
      isLoggedIn: true,
      excludeNovelIds: [],
      spoilerMode: "none",
    });
    results.push(result);
    history.push({ role: "user", content: message });
    history.push({
      role: "assistant",
      content: result.reply,
      meta: assistantMetaFromResult(result),
    });
  }

  return { history, results };
}

function uniqueReplyCount(replies: string[]): number {
  return new Set(replies.map((reply) => reply.trim())).size;
}

const scenarios: Scenario[] = [
  {
    id: "Demo A — Natural conversation",
    run: async () => {
      const result = await handleMoonieRequest({
        message: "Hi",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
      });
      return {
        pass:
          result.responseKind === "chat" &&
          result.consumesQuota === false &&
          result.recommendations.length === 0,
        detail: `kind=${result.responseKind} quota=${result.consumesQuota}`,
      };
    },
  },
  {
    id: "Demo B — Recommendation",
    run: async () => {
      const result = await handleMoonieRequest({
        message:
          "I want psychological fantasy with a strong female lead and low romance",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
      });
      return {
        pass:
          result.responseKind === "recommendations" &&
          result.recommendations.length >= 1,
        detail: `count=${result.recommendations.length} intent=${result.analyticsIntent}`,
      };
    },
  },
  {
    id: "Demo C — Follow-up context",
    run: async () => {
      const recResult = await handleMoonieRequest({
        message:
          "Recommend 3 psychological fantasy novels with a strong female lead",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
      });
      const messages = [
        {
          role: "user",
          content:
            "Recommend 3 psychological fantasy novels with a strong female lead",
        },
        {
          role: "assistant",
          content: recResult.reply,
          meta: { recommendations: recResult.recommendations },
        },
        { role: "user", content: "The second one looks good." },
      ];
      const ctx = buildConversationContext(messages, {
        currentMessage: "Where can I read it?",
      });
      const result = await handleMoonieRequest({
        message: "Where can I read it?",
        messages,
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
      });
      const sameNovel =
        result.novelOverview?.novelId === ctx.activeNovelId ||
        result.recommendations[0]?.novelId === ctx.activeNovelId;
      return {
        pass:
          ctx.activeNovelId === recResult.recommendations[1]?.novelId &&
          (result.responseKind === "novel_bundle" || Boolean(result.novelOverview)) &&
          sameNovel,
        detail: `active=${ctx.activeNovelTitle} bundle=${result.novelOverview?.title ?? result.recommendations[0]?.title}`,
      };
    },
  },
  {
    id: "Demo E — Compare",
    run: async () => {
      const result = await handleMoonieRequest({
        message: "Compare Lord of the Mysteries and Reverend Insanity",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
      });
      return {
        pass: result.responseKind === "compare" && Boolean(result.compare?.rows?.length),
        detail: `rows=${result.compare?.rows?.length ?? 0}`,
      };
    },
  },
  {
    id: "Demo G — File compare titles",
    run: async () => {
      const content = Buffer.from(
        "Lord of the Mysteries\nReverend Insanity\n",
        "utf8"
      ).toString("base64");
      const result = await handleMoonieRequest({
        message: "Compare these",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
        attachmentType: "file",
        fileData: content,
        fileName: "list.txt",
        fileMimeType: "text/plain",
      });
      return {
        pass:
          result.responseKind === "compare" &&
          (result.compare?.rows?.length ?? 0) >= 2,
        detail: `rows=${result.compare?.rows?.length ?? 0}`,
      };
    },
  },
  {
    id: "Demo H — Identity chat",
    run: async () => {
      const cases: Array<{
        message: string;
        expect: (reply: string) => boolean;
        label: string;
      }> = [
        {
          message: "What's your name?",
          label: "ascii apostrophe",
          expect: (r) => /i'm moonie/i.test(r),
        },
        {
          message: "What\u2019s your name?",
          label: "curly apostrophe",
          expect: (r) => /i'm moonie/i.test(r),
        },
        {
          message: "who are you",
          label: "who are you",
          expect: (r) => /moonie/i.test(r),
        },
        {
          message: "are you Moonie",
          label: "are you moonie",
          expect: (r) => /moonie/i.test(r),
        },
        {
          message: "moonie",
          label: "bare moonie",
          expect: (r) => /yep|that's me|moonie here|i'm moonie/i.test(r),
        },
        {
          message: "Moonie?",
          label: "moonie question",
          expect: (r) => /yep|that's me|moonie here|i'm moonie/i.test(r),
        },
        {
          message: "hey Moonie",
          label: "hey moonie",
          expect: (r) => /yep|that's me|moonie here|i'm moonie/i.test(r),
        },
        {
          message: "what can you do",
          label: "capability",
          expect: (r) => /recommend|reading link|compare/i.test(r),
        },
      ];

      const failures: string[] = [];
      for (const { message, expect, label } of cases) {
        const result = await handleMoonieRequest({
          message,
          messages: [],
          isLoggedIn: true,
          excludeNovelIds: [],
          spoilerMode: "none",
        });
        const ok =
          result.responseKind === "chat" &&
          result.consumesQuota === false &&
          result.recommendations.length === 0 &&
          expect(result.reply) &&
          !/i am here for novel discovery/i.test(result.reply);
        if (!ok) {
          failures.push(
            `${label}: kind=${result.responseKind} quota=${result.consumesQuota} cards=${result.recommendations.length} reply=${result.reply.slice(0, 60)}`
          );
        }
      }

      const thanks = await handleMoonieRequest({
        message: "thanks",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
      });
      if (
        thanks.responseKind !== "chat" ||
        thanks.consumesQuota ||
        /i am here for novel discovery/i.test(thanks.reply)
      ) {
        failures.push(`thanks regression: ${thanks.reply.slice(0, 60)}`);
      }

      return {
        pass: failures.length === 0,
        detail:
          failures.length === 0
            ? `${cases.length} identity/capability cases + thanks ok`
            : failures.join("; "),
      };
    },
  },
  {
    id: "Demo I — Small talk",
    run: async () => {
      const smallTalkCases: Array<{
        message: string;
        label: string;
        expect: (reply: string) => boolean;
      }> = [
        {
          message: "how are you",
          label: "how are you",
          expect: (r) => /doing well|doing great|all good/i.test(r),
        },
        {
          message: "nice to meet you",
          label: "nice to meet you",
          expect: (r) => /nice to meet you|likewise|great to meet/i.test(r),
        },
        {
          message: "good morning",
          label: "good morning",
          expect: (r) => /good morning|mood/i.test(r),
        },
        {
          message: "you're cute",
          label: "compliment",
          expect: (r) => /sweet|kind|thank/i.test(r),
        },
      ];

      const routingCases: Array<{
        message: string;
        label: string;
        expect: (result: Awaited<ReturnType<typeof handleMoonieRequest>>) => boolean;
      }> = [
        {
          message: "what's your name",
          label: "identity routing",
          expect: (r) =>
            /i'm moonie/i.test(r.reply) &&
            r.consumesQuota === false &&
            r.recommendations.length === 0,
        },
        {
          message: "what can you do",
          label: "help routing",
          expect: (r) =>
            /recommend|reading link/i.test(r.reply) &&
            r.consumesQuota === false,
        },
        {
          message: "Recommend something dark",
          label: "recommend routing",
          expect: (r) =>
            r.responseKind === "recommendations" &&
            r.recommendations.length >= 1,
        },
      ];

      const failures: string[] = [];

      for (const { message, label, expect } of smallTalkCases) {
        const result = await handleMoonieRequest({
          message,
          messages: [],
          isLoggedIn: true,
          excludeNovelIds: [],
          spoilerMode: "none",
        });
        const ok =
          result.responseKind === "chat" &&
          result.consumesQuota === false &&
          result.recommendations.length === 0 &&
          expect(result.reply) &&
          !/i am here for novel discovery/i.test(result.reply) &&
          !/i can recommend catalogue novels/i.test(result.reply);
        if (!ok) {
          failures.push(
            `${label}: quota=${result.consumesQuota} reply=${result.reply.slice(0, 60)}`
          );
        }
      }

      for (const { message, label, expect } of routingCases) {
        const result = await handleMoonieRequest({
          message,
          messages: [],
          isLoggedIn: true,
          excludeNovelIds: [],
          spoilerMode: "none",
        });
        if (!expect(result)) {
          failures.push(
            `${label}: kind=${result.responseKind} quota=${result.consumesQuota} reply=${result.reply.slice(0, 60)}`
          );
        }
      }

      return {
        pass: failures.length === 0,
        detail:
          failures.length === 0
            ? `${smallTalkCases.length} small-talk + ${routingCases.length} routing cases ok`
            : failures.join("; "),
      };
    },
  },
  {
    id: "Demo J — Quota state",
    run: async () => {
      const failures: string[] = [];

      const quotaFree = [
        "hi",
        "thanks",
        "how are you",
        "what's your name",
        "what can you do",
      ];
      for (const message of quotaFree) {
        const result = await handleMoonieRequest({
          message,
          messages: [],
          isLoggedIn: true,
          excludeNovelIds: [],
          spoilerMode: "none",
        });
        if (result.consumesQuota !== false) {
          failures.push(`${message} consumed quota`);
        }
      }

      const recommend = await handleMoonieRequest({
        message: "Recommend something dark",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
      });
      if (recommend.consumesQuota === false) {
        failures.push("recommend did not mark consumesQuota");
      }

      const rateLimitMessage: MoonieChatMessage = {
        id: "rate-limit",
        role: "assistant",
        content: buildMoonieRateLimitApiError(),
        isError: true,
        state: "rate_limit",
      };
      const headerAtLimit = resolveMoonieChatHeaderStatus({
        messages: [rateLimitMessage],
        isLoading: false,
        isListening: false,
      });
      if (headerAtLimit.status === "Something went wrong") {
        failures.push("rate-limit header used generic error");
      }
      if (headerAtLimit.hasError) {
        failures.push("rate-limit header flagged hasError");
      }
      if (!headerAtLimit.isRateLimited) {
        failures.push("rate-limit header missing isRateLimited");
      }

      const recoveryMessage: MoonieChatMessage = {
        id: "small-talk",
        role: "assistant",
        content: "I'm doing well, thanks for asking.",
        responseKind: "chat",
      };
      const headerAfterRecovery = resolveMoonieChatHeaderStatus({
        messages: [rateLimitMessage, recoveryMessage],
        isLoading: false,
        isListening: false,
      });
      if (headerAfterRecovery.isRateLimited || headerAfterRecovery.hasError) {
        failures.push("header did not recover after quota-free reply");
      }

      const body = buildMoonieRateLimitBody();
      if (/moonie messages/i.test(body)) {
        failures.push("rate-limit body still says messages");
      }
      if (
        !/discovery requests/i.test(
          formatDiscoveryQuotaUsed(
            MOONIE_DAILY_DISCOVERY_LIMIT,
            MOONIE_DAILY_DISCOVERY_LIMIT
          )
        )
      ) {
        failures.push("quota-used label missing discovery requests");
      }

      return {
        pass: failures.length === 0,
        detail:
          failures.length === 0
            ? `${quotaFree.length} quota-free + recommend + header/copy checks ok`
            : failures.join("; "),
      };
    },
  },
  {
    id: "Demo K — Conversational sequences",
    run: async () => {
      const failures: string[] = [];

      const seqA = await runConversationSequence(["hi", "hi", "hi"]);
      const greetings = seqA.results.map((result) => result.reply);
      if (uniqueReplyCount(greetings) < 2) {
        failures.push(`sequence A repeated greetings: ${greetings.join(" | ")}`);
      }
      if (seqA.results.some((result) => result.consumesQuota)) {
        failures.push("sequence A consumed quota");
      }

      const seqB = await runConversationSequence([
        "what's your name",
        "Moonie",
      ]);
      if (!/i'm moonie|moonie/i.test(seqB.results[0]!.reply)) {
        failures.push("sequence B first identity failed");
      }
      if (!/still moonie|still me|reporting for duty|that's me/i.test(seqB.results[1]!.reply)) {
        failures.push(`sequence B follow-up moonie: ${seqB.results[1]!.reply}`);
      }
      if (seqB.results[0]!.reply === seqB.results[1]!.reply) {
        failures.push("sequence B repeated identical identity replies");
      }

      const seqC = await runConversationSequence(["how are you", "good", "nice"]);
      if (!/doing well|doing great|all good/i.test(seqC.results[0]!.reply)) {
        failures.push("sequence C wellness failed");
      }
      if (!/glad to hear|good to know|nice/i.test(seqC.results[1]!.reply)) {
        failures.push(`sequence C affirmation: ${seqC.results[1]!.reply}`);
      }
      if (seqC.results[2]!.responseKind !== "chat" || seqC.results[2]!.consumesQuota) {
        failures.push("sequence C third turn should stay casual chat");
      }

      const seqD = await runConversationSequence(["you're cute", "really"]);
      if (!/sweet|thank you|kind/i.test(seqD.results[0]!.reply)) {
        failures.push("sequence D compliment failed");
      }
      if (!/appreciate|mean it|brighter/i.test(seqD.results[1]!.reply)) {
        failures.push(`sequence D really follow-up: ${seqD.results[1]!.reply}`);
      }
      if (/i am here for novel discovery/i.test(seqD.results[1]!.reply)) {
        failures.push("sequence D fell back to generic chat");
      }

      const seqE = await runConversationSequence([
        "hi",
        "Recommend something dark",
      ]);
      if (seqE.results[0]!.consumesQuota !== false) {
        failures.push("sequence E greeting consumed quota");
      }
      if (
        seqE.results[1]!.responseKind !== "recommendations" ||
        seqE.results[1]!.recommendations.length < 1
      ) {
        failures.push("sequence E recommend failed");
      }

      const seqF = await runConversationSequence([
        "hi",
        "what is the weather today",
      ]);
      if (seqF.results[1]!.consumesQuota !== false) {
        failures.push("sequence F weather consumed quota");
      }
      if (!/weather|moonverse|novel/i.test(seqF.results[1]!.reply)) {
        failures.push(`sequence F guardrail: ${seqF.results[1]!.reply}`);
      }

      return {
        pass: failures.length === 0,
        detail:
          failures.length === 0
            ? "sequences A-F conversational flow ok"
            : failures.join("; "),
      };
    },
  },
  {
    id: "Demo L — Reviewer queries",
    run: async () => {
      const priorRecMessages = [
        { role: "user", content: "recommend me BL novels" },
        {
          role: "assistant",
          content: "Here are picks.",
          meta: { recommendations: [{ novelId: "x", title: "Test" }] },
        },
      ];
      const failures: string[] = [];

      const afterRec = await handleMoonieRequest({
        message: "give me top 10 reviewer",
        messages: priorRecMessages,
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
      });
      if (afterRec.analyticsIntent !== "find_reviewers") {
        failures.push(`after-rec intent=${afterRec.analyticsIntent}`);
      }
      if ((afterRec.lookupSession?.candidates?.length ?? 0) > 0) {
        failures.push("after-rec opened novel clarification");
      }
      if (!/ranked by published review count/i.test(afterRec.reply)) {
        failures.push("after-rec missing reviewer ranking copy");
      }

      const ranked = await handleMoonieRequest({
        message: "most followed reviewers",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
      });
      if (ranked.analyticsIntent !== "find_reviewers") {
        failures.push(`ranked intent=${ranked.analyticsIntent}`);
      }
      if (!/follower count/i.test(ranked.reply)) {
        failures.push("ranked missing follower metric");
      }

      const profile = await handleMoonieRequest({
        message: "find reviewer Yue Xian",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
      });
      if (profile.analyticsIntent !== "reviewer_overview") {
        failures.push(`profile intent=${profile.analyticsIntent}`);
      }
      if (!profile.reviewerOverview?.displayName) {
        failures.push("profile lookup returned no reviewer overview");
      }

      const novel = await handleMoonieRequest({
        message: "find Lord of the Mysteries",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
      });
      if (novel.analyticsIntent !== "find_novel") {
        failures.push(`novel intent=${novel.analyticsIntent}`);
      }

      return {
        pass: failures.length === 0,
        detail:
          failures.length === 0
            ? "reviewer ranking + lookup + novel control ok"
            : failures.join("; "),
      };
    },
  },
  {
    id: "Demo M — Reviewer follow-ups",
    run: async () => {
      const failures: string[] = [];

      const seqA = await runConversationSequence([
        "give me top 10 reviewer",
        "all information about top 1 reviewer",
      ]);
      if (seqA.results[0]!.analyticsIntent !== "find_reviewers") {
        failures.push(`A step1 intent=${seqA.results[0]!.analyticsIntent}`);
      }
      if ((seqA.results[0]!.reviewerResults?.length ?? 0) < 2) {
        failures.push("A step1 missing reviewer ranking list");
      }
      const topOne = seqA.results[0]!.reviewerResults?.[0];
      if (seqA.results[1]!.analyticsIntent !== "reviewer_overview") {
        failures.push(`A step2 intent=${seqA.results[1]!.analyticsIntent}`);
      }
      if (!seqA.results[1]!.reviewerOverview) {
        failures.push("A step2 missing reviewer overview");
      } else if (topOne && seqA.results[1]!.reviewerOverview!.id !== topOne.id) {
        failures.push(
          `A step2 wrong reviewer: expected ${topOne.displayName}, got ${seqA.results[1]!.reviewerOverview!.displayName}`
        );
      }
      if (/ranked by published review count/i.test(seqA.results[1]!.reply)) {
        failures.push("A step2 reran ranking instead of details");
      }

      const seqB = await runConversationSequence([
        "give me top 10 reviewer",
        "tell me about the second reviewer",
      ]);
      const second = seqB.results[0]!.reviewerResults?.[1];
      if (seqB.results[1]!.analyticsIntent !== "reviewer_overview") {
        failures.push(`B intent=${seqB.results[1]!.analyticsIntent}`);
      }
      if (
        second &&
        seqB.results[1]!.reviewerOverview?.id !== second.id
      ) {
        failures.push(
          `B wrong reviewer: expected ${second.displayName}, got ${seqB.results[1]!.reviewerOverview?.displayName ?? "none"}`
        );
      }

      const seqC = await handleMoonieRequest({
        message: "tell me about Haruto Park",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
      });
      if (seqC.analyticsIntent !== "reviewer_overview") {
        failures.push(`C intent=${seqC.analyticsIntent}`);
      }
      if (!/haruto/i.test(seqC.reviewerOverview?.displayName ?? "")) {
        failures.push(`C missing Haruto Park overview`);
      }

      const seqD = await handleMoonieRequest({
        message: "find reviewer Yue Xian",
        messages: [],
        isLoggedIn: true,
        excludeNovelIds: [],
        spoilerMode: "none",
      });
      if (seqD.analyticsIntent !== "reviewer_overview") {
        failures.push(`D intent=${seqD.analyticsIntent}`);
      }
      if (!seqD.reviewerOverview?.username) {
        failures.push("D missing reviewer profile");
      }

      const seqE = await runConversationSequence([
        "give me top 10 reviewer",
        "all information about top 1 reviewer",
        "show me their reviews",
      ]);
      if (seqE.results[2]!.analyticsIntent !== "reviewer_overview") {
        failures.push(`E step3 intent=${seqE.results[2]!.analyticsIntent}`);
      }
      if (!seqE.results[2]!.reviewerOverview?.emphasizeAuthoredReviews) {
        failures.push("E step3 missing authored-reviews emphasis");
      }
      if ((seqE.results[2]!.reviewerOverview?.recentReviews.length ?? 0) < 1) {
        failures.push("E step3 missing recent reviews");
      }

      return {
        pass: failures.length === 0,
        detail:
          failures.length === 0
            ? "reviewer follow-up sequences A-E ok"
            : failures.join("; "),
      };
    },
  },
  {
    id: "Demo N — Reviewer reviews → novel handoff",
    run: async () => {
      const failures: string[] = [];

      const base = await runConversationSequence([
        "top 5 reviewers",
        "tell me about second reviewer",
        "show me their reviews",
      ]);
      const reviewSession = base.results[2]!.reviewerReviewSession;
      const firstReview = reviewSession?.reviews[0];
      const secondReview = reviewSession?.reviews[1];

      if (!reviewSession?.reviews.length) {
        failures.push("base missing reviewerReviewSession");
      }
      if (!firstReview?.novelId) {
        failures.push("base missing first review novelId");
      }

      const seqA = await runConversationSequence([
        "top 5 reviewers",
        "tell me about second reviewer",
        "show me their reviews",
        "tell me more about the first novel they reviewed",
      ]);
      const stepA = seqA.results[3]!;
      if (stepA.responseKind !== "novel_bundle") {
        failures.push(`A kind=${stepA.responseKind}`);
      }
      if (firstReview && stepA.novelOverview?.novelId !== firstReview.novelId) {
        failures.push(
          `A wrong novel: expected ${firstReview.novelTitle}, got ${stepA.novelOverview?.title ?? "none"}`
        );
      }
      if (stepA.lookupSession?.candidates[0]?.confidence === "low") {
        failures.push("A used low-confidence fuzzy match");
      }
      if (/heavenly jewel change/i.test(stepA.reply)) {
        failures.push("A fuzzy drift to unrelated title");
      }

      const seqB = await runConversationSequence([
        "top 5 reviewers",
        "tell me about second reviewer",
        "show me their reviews",
        "where can I read the second novel they reviewed",
      ]);
      const stepB = seqB.results[3]!;
      if (stepB.analyticsIntent !== "reading_source") {
        failures.push(`B intent=${stepB.analyticsIntent}`);
      }
      if (secondReview && stepB.novelOverview?.novelId !== secondReview.novelId) {
        failures.push(
          `B wrong novel: expected ${secondReview.novelTitle}, got ${stepB.novelOverview?.title ?? "none"}`
        );
      }

      const seqC = await runConversationSequence([
        "top 5 reviewers",
        "tell me about second reviewer",
        "show me their reviews",
        "show me the first review",
      ]);
      const stepC = seqC.results[3]!;
      if (stepC.responseKind !== "chat") {
        failures.push(`C kind=${stepC.responseKind}`);
      }
      if (stepC.novelOverview) {
        failures.push("C returned novel overview instead of review detail");
      }
      if (firstReview && !stepC.reply.includes(firstReview.reviewTitle)) {
        failures.push("C missing first review title in reply");
      }

      const seqD = await runConversationSequence([
        "top 5 reviewers",
        "tell me about second reviewer",
        "show me their reviews",
        "show me reviews for the first novel they reviewed",
      ]);
      const stepD = seqD.results[3]!;
      if (stepD.analyticsIntent !== "novel_reviews") {
        failures.push(`D intent=${stepD.analyticsIntent}`);
      }
      if (firstReview && stepD.novelOverview?.novelId !== firstReview.novelId) {
        failures.push(
          `D wrong novel: expected ${firstReview.novelTitle}, got ${stepD.novelOverview?.title ?? "none"}`
        );
      }

      return {
        pass: failures.length === 0,
        detail:
          failures.length === 0
            ? "reviewer→reviews→novel sequences A-D ok"
            : failures.join("; "),
      };
    },
  },
  {
    id: "Demo O — Reviewer group pronouns",
    run: async () => {
      const failures: string[] = [];

      const group = await runConversationSequence([
        "show me top 3 reviewer",
        "show me their information",
      ]);
      const step1 = group.results[0]!;
      const step2 = group.results[1]!;

      if ((step1.reviewerResults?.length ?? 0) < 3) {
        failures.push("step1 missing top 3 reviewer ranking");
      }
      if (step2.analyticsIntent !== "reviewer_overview") {
        failures.push(`group info intent=${step2.analyticsIntent}`);
      }
      if (!step2.reviewerGroupOverview?.reviewers.length) {
        failures.push("group info missing reviewerGroupOverview");
      }
      if ((step2.reviewerGroupOverview?.reviewers.length ?? 0) !== 3) {
        failures.push(
          `group info count=${step2.reviewerGroupOverview?.reviewers.length ?? 0}`
        );
      }
      if (/which reviewer do you mean/i.test(step2.reply)) {
        failures.push("group info triggered single-reviewer clarification");
      }

      const single = await runConversationSequence([
        "show me top 3 reviewer",
        "tell me about the second reviewer",
      ]);
      if (single.results[1]!.analyticsIntent !== "reviewer_overview") {
        failures.push(`single intent=${single.results[1]!.analyticsIntent}`);
      }
      if (!single.results[1]!.reviewerOverview) {
        failures.push("single missing reviewerOverview");
      }
      if (single.results[1]!.reviewerGroupOverview) {
        failures.push("single incorrectly returned group overview");
      }
      const second = single.results[0]!.reviewerResults?.[1];
      if (
        second &&
        single.results[1]!.reviewerOverview?.id !== second.id
      ) {
        failures.push(
          `single wrong reviewer: expected ${second.displayName}`
        );
      }

      return {
        pass: failures.length === 0,
        detail:
          failures.length === 0
            ? "group pronoun + single ordinal flows ok"
            : failures.join("; "),
      };
    },
  },
];

async function main() {
  console.log("Moonie demo scenario smoke test\n");
  let passed = 0;

  for (const scenario of scenarios) {
    try {
      const { pass, detail } = await scenario.run();
      console.log(`[${pass ? "PASS" : "FAIL"}] ${scenario.id}: ${detail}`);
      if (pass) passed += 1;
    } catch (error) {
      console.log(
        `[FAIL] ${scenario.id}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  console.log(`\n${passed}/${scenarios.length} demo scenarios passed`);
  if (passed < scenarios.length) process.exitCode = 1;
}

main();
