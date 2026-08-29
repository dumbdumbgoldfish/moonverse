import type { ReviewListItem } from "@/types/review";

interface ReviewsJsonLdProps {
  reviews: ReviewListItem[];
  pageUrl: string;
}

export function ReviewsJsonLd({ reviews, pageUrl }: ReviewsJsonLdProps) {
  const itemListElement = reviews.slice(0, 10).map((review, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `/reviews/${review.id}`,
    name: `${review.novelTitle} review by ${review.reviewerName}`,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "MoonVerse Discover",
    description:
      "Discover community reviews: trending, highest-rated, and curated shelves from MoonVerse readers.",
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      itemListElement,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
