import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MoonieRecommendation } from "@/types/moonie";

interface MoonieRecommendationCardProps {
  recommendation: MoonieRecommendation;
}

const confidenceLabels = {
  high: "High match",
  medium: "Good match",
  low: "Worth a look",
} as const;

export function MoonieRecommendationCard({
  recommendation,
}: MoonieRecommendationCardProps) {
  const titleContent = recommendation.reviewId ? (
    <Link
      href={`/reviews/${recommendation.reviewId}`}
      className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
    >
      {recommendation.title}
    </Link>
  ) : recommendation.novelId ? (
    <Link
      href={`/novels/${recommendation.novelId}`}
      className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
    >
      {recommendation.title}
    </Link>
  ) : (
    recommendation.title
  );

  return (
    <Card className="bg-background/80 ring-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base leading-snug">{titleContent}</CardTitle>
            {recommendation.author && (
              <CardDescription>by {recommendation.author}</CardDescription>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {confidenceLabels[recommendation.confidence]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {recommendation.reason}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {recommendation.genres.map((genre) => (
            <Badge key={genre} variant="outline" className="text-[10px]">
              {genre}
            </Badge>
          ))}
          {recommendation.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
