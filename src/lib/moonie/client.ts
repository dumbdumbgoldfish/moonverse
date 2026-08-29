import { offTopicRedirectReply } from "@/lib/moonie/guardrails";
import type { MoonieRecommendResponse } from "@/types/moonie";

export function getOffTopicMoonieResponse(): MoonieRecommendResponse {
  return {
    reply: offTopicRedirectReply(),
    recommendations: [],
    state: "off_topic",
  };
}
