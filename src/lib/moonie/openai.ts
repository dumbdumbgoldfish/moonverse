export const OPENAI_CHAT_COMPLETIONS_URL =
  "https://api.openai.com/v1/chat/completions";

/** Cost-efficient default for structured Moonie text tasks. */
export const MOONIE_OPENAI_TEXT_MODEL_DEFAULT = "gpt-5.6-luna";

/** Balanced default for screenshot / cover vision extraction. */
export const MOONIE_OPENAI_VISION_MODEL_DEFAULT = "gpt-5.6-terra";

export function hasOpenAiApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function resolveOpenAiTextModel(): string {
  return process.env.OPENAI_MODEL?.trim() || MOONIE_OPENAI_TEXT_MODEL_DEFAULT;
}

export function resolveOpenAiVisionModel(): string {
  return (
    process.env.OPENAI_VISION_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    MOONIE_OPENAI_VISION_MODEL_DEFAULT
  );
}

/** gpt-5.6-* models only accept the API default temperature (1). */
export function supportsCustomTemperature(model: string): boolean {
  return !/^gpt-5\.6-/i.test(model.trim());
}

export type OpenAiChatMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | {
            type: "image_url";
            image_url: { url: string; detail?: "high" | "low" | "auto" };
          }
      >;
    };

export interface OpenAiChatCompletionRequest {
  model?: string;
  temperature?: number;
  response_format?: { type: "json_object" };
  messages: OpenAiChatMessage[];
}

export interface OpenAiChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export async function createOpenAiChatCompletion(
  request: OpenAiChatCompletionRequest & { modelKind?: "text" | "vision" }
): Promise<
  | { ok: true; content: string; raw: OpenAiChatCompletionResponse }
  | { ok: false; status: number; body: string }
> {
  if (!hasOpenAiApiKey()) {
    return { ok: false, status: 0, body: "no_api" };
  }

  const { modelKind, temperature, ...payload } = request;
  const model =
    payload.model ??
    (modelKind === "vision"
      ? resolveOpenAiVisionModel()
      : resolveOpenAiTextModel());

  const body: OpenAiChatCompletionRequest & { model: string } = {
    ...payload,
    model,
  };
  if (temperature !== undefined && supportsCustomTemperature(model)) {
    body.temperature = temperature;
  }

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return { ok: false, status: response.status, body };
  }

  const raw = (await response.json()) as OpenAiChatCompletionResponse;
  const content = raw.choices?.[0]?.message?.content;
  if (!content) {
    return { ok: false, status: response.status, body: "empty_content" };
  }

  return { ok: true, content, raw };
}
