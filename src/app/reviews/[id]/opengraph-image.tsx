import { ImageResponse } from "next/og";
import { getReviewById, getNovelReviewStats } from "@/services/review.service";
import { reviewVerdict } from "@/lib/review-verdict";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = await getReviewById(id);

  if (!review) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FBF7F1",
            color: "#1A1033",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          Review not found
        </div>
      ),
      size,
    );
  }

  const stats = await getNovelReviewStats(review.novelId);
  const verdict = reviewVerdict(review.rating);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #FBF7F1 0%, #FFFFFF 45%, #F4ECF8 100%)",
          padding: 56,
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            border: "1px solid rgba(26,16,51,0.12)",
            borderRadius: 32,
            overflow: "hidden",
            background: "rgba(255,255,255,0.82)",
          }}
        >
          <div
            style={{
              width: 280,
              background: "#F4ECF8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            {review.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={review.coverUrl}
                alt=""
                width={200}
                height={300}
                style={{
                  objectFit: "cover",
                  borderRadius: 16,
                  border: "3px solid white",
                  boxShadow: "0 16px 40px rgba(26,16,51,0.25)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 200,
                  height: 300,
                  borderRadius: 16,
                  background: "#E8DFF2",
                }}
              />
            )}
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "40px 48px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 18,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#C89B4A",
                  fontWeight: 700,
                }}
              >
                MoonVerse review
              </div>
              <div
                style={{
                  marginTop: 16,
                  fontSize: 52,
                  lineHeight: 1.05,
                  fontWeight: 700,
                  color: "#1A1033",
                }}
              >
                {review.novelTitle}
              </div>
              <div
                style={{
                  marginTop: 12,
                  fontSize: 28,
                  fontStyle: "italic",
                  color: "#5A4D72",
                  lineHeight: 1.25,
                }}
              >
                {review.title.length > 90
                  ? `${review.title.slice(0, 90)}…`
                  : review.title}
              </div>
              <div style={{ marginTop: 8, fontSize: 22, color: "#5A4D72" }}>
                by {review.novelAuthor}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 20px",
                  borderRadius: 20,
                  border: "1px solid rgba(26,16,51,0.1)",
                  background: "#FAF8FF",
                }}
              >
                <div style={{ fontSize: 42, fontWeight: 800, color: "#1A1033" }}>
                  {review.rating}/5
                </div>
                <div style={{ fontSize: 20, color: "#5A4D72" }}>{verdict.label}</div>
              </div>
              {stats.total > 0 ? (
                <div style={{ fontSize: 22, color: "#5A4D72" }}>
                  {stats.average.toFixed(1)}★ community · {stats.total} reviews
                </div>
              ) : null}
              <div style={{ marginLeft: "auto", fontSize: 20, color: "#6B4BB5" }}>
                @{review.reviewerUsername}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
