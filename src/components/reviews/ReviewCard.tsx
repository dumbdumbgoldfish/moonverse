import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StarRating } from "@/components/reviews/StarRating";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

interface ReviewCardProps {
  review: ReviewListItem;
  layout?: "carousel" | "grid";
}

export function ReviewCard({ review, layout = "carousel" }: ReviewCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border-border/60 bg-white shadow-sm transition-shadow hover:shadow-md",
        layout === "grid" ? "w-full" : "w-[280px] shrink-0 sm:w-[300px]"
      )}
    >
      <CardHeader className="flex-row gap-3 space-y-0 pb-0">
        <div className="relative h-[100px] w-[72px] shrink-0 overflow-hidden rounded-lg shadow-sm">
          <Image
            src={review.coverUrl}
            alt={`Cover of ${review.novelTitle}`}
            fill
            className="object-cover"
            sizes="72px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted-foreground">{review.novelTitle}</p>
          <p className="truncate text-xs text-muted-foreground/70">by {review.novelAuthor}</p>
          <div className="mt-1.5">
            <StarRating rating={review.rating} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <CardTitle className="line-clamp-2 text-sm leading-snug">
          <Link
            href={`/reviews/${review.id}`}
            className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {review.title}
          </Link>
        </CardTitle>
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {review.excerpt}
        </p>
        <div className="mt-3 flex flex-wrap gap-1">
          {review.genres.map((genre) => (
            <Badge key={genre} variant="secondary" className="rounded-full text-[10px]">
              {genre}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="justify-between border-t border-border/50 bg-transparent">
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback className="bg-primary/15 text-[10px] text-primary">
              {review.reviewerAvatar}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{review.reviewerName}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Heart size={12} className="text-primary" aria-hidden="true" />
          <span>{review.likeCount}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
