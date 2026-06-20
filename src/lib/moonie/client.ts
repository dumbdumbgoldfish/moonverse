import {
  offTopicRedirectReply,
  parseRecommendationsPayload,
} from "@/lib/moonie/guardrails";
import {
  buildUserPrompt,
  MOONIE_SYSTEM_PROMPT,
} from "@/lib/moonie/prompts";
import type { RecommendationContext } from "@/services/recommendation.service";
import type { MoonieRecommendResponse } from "@/types/moonie";

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export async function getMoonieRecommendationsFromOpenAI(
  message: string,
  context: RecommendationContext
): Promise<MoonieRecommendResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: MOONIE_SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(message, context) },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as OpenAIChatResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Moonie received an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Moonie could not parse the recommendation response.");
  }

  const result = parseRecommendationsPayload(parsed);
  if (!result) {
    return {
      reply:
        "I found some ideas, but had trouble formatting them. Could you describe your preferences another way?",
      recommendations: [],
    };
  }

  return result;
}

export function getOffTopicMoonieResponse(): MoonieRecommendResponse {
  return {
    reply: offTopicRedirectReply(),
    recommendations: [],
  };
}
