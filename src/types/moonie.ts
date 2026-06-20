export type MoonieConfidence = "high" | "medium" | "low";

export interface MoonieRecommendation {
  title: string;
  author?: string;
  reason: string;
  genres: string[];
  tags?: string[];
  confidence: MoonieConfidence;
  reviewId?: string;
  novelId?: string;
}

export interface MoonieChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  recommendations?: MoonieRecommendation[];
  isError?: boolean;
}

export interface MoonieRecommendResponse {
  reply: string;
  recommendations: MoonieRecommendation[];
}

export interface MoonieRecommendErrorResponse {
  error: string;
  rateLimited?: boolean;
}
