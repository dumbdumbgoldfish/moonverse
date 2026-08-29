"use client";

import {
  Bookmark,
  Clock,
  Flame,
  Gem,
  Heart,
  Hourglass,
  MessageCircle,
  Share2,
  Sparkles,
  Star,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { CoverCarousel } from "@/components/discovery/CoverCarousel";
import type { SalonShelfIconName } from "@/lib/salon-shelf-icons";
import type { ReviewListItem } from "@/types/review";
import { ReviewsSalonShelfCard } from "./ReviewsSalonShelfCard";

const SALON_SHELF_ICONS: Record<SalonShelfIconName, LucideIcon> = {
  trending: Flame,
  star: Star,
  gem: Gem,
  sparkles: Sparkles,
  "user-plus": UserPlus,
  clock: Clock,
  messages: MessageCircle,
  bookmark: Bookmark,
  share: Share2,
  heart: Heart,
  users: Users,
  hourglass: Hourglass,
};

interface ReviewsSalonShelfProps {
  id: string;
  title: string;
  subtitle?: string;
  iconName?: SalonShelfIconName;
  accentClass?: string;
  reviews: ReviewListItem[];
  className?: string;
  /** How many carousel covers load eagerly (above-the-fold only). */
  eagerImageCount?: number;
}

export function ReviewsSalonShelf({
  title,
  subtitle,
  iconName,
  accentClass = "text-[#6E46C7]",
  reviews,
  className,
  eagerImageCount = 0,
}: ReviewsSalonShelfProps) {
  if (reviews.length === 0) return null;

  const icon = iconName ? SALON_SHELF_ICONS[iconName] : undefined;

  return (
    <CoverCarousel
      title={title}
      subtitle={subtitle}
      icon={icon}
      accentClass={accentClass}
      className={className}
    >
      {reviews.map((review, index) => (
        <ReviewsSalonShelfCard
          key={review.id}
          review={review}
          priority={index < eagerImageCount}
        />
      ))}
    </CoverCarousel>
  );
}
