import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getMoonieRecommendationsFromOpenAI,
  getOffTopicMoonieResponse,
} from "@/lib/moonie/client";
import {
  isValidUserMessage,
  looksOffTopic,
  sanitizeUserMessage,
} from "@/lib/moonie/guardrails";
import { validateMoonieMessage } from "@/lib/validation";
import {
  checkMoonieRateLimit,
  MOONIE_DAILY_LIMIT,
  recordMoonieRequest,
} from "@/lib/moonie/rate-limit";
import {
  buildRecommendationContext,
  getMockRecommendations,
} from "@/services/recommendation.service";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to ask Moonie for recommendations." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { message?: string };
    const message = sanitizeUserMessage(body.message ?? "");

    const messageError = validateMoonieMessage(message);
    if (messageError) {
      return NextResponse.json({ error: messageError }, { status: 400 });
    }

    if (!isValidUserMessage(message)) {
      return NextResponse.json(
        { error: "Please describe what kind of web novel you're looking for." },
        { status: 400 }
      );
    }

    const rateLimit = checkMoonieRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `You've reached Moonie's daily limit of ${MOONIE_DAILY_LIMIT} requests. Come back tomorrow for more recommendations!`,
          rateLimited: true,
        },
        { status: 429 }
      );
    }

    if (looksOffTopic(message)) {
      return NextResponse.json(getOffTopicMoonieResponse());
    }

    const context = await buildRecommendationContext(session.user.id, message);

    let result;
    if (process.env.OPENAI_API_KEY) {
      result = await getMoonieRecommendationsFromOpenAI(message, context);
    } else {
      result = getMockRecommendations(message, context);
    }

    recordMoonieRequest(session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[moonie/recommend]", error);
    return NextResponse.json(
      {
        error:
          "Moonie couldn't fetch recommendations right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
