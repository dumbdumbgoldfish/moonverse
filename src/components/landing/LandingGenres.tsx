import { GenreCarousel } from "@/components/landing/GenreCarousel";
import type { LandingGenreDoor } from "@/types/discovery";

/** Landing “Browse by genre” section: editorial doors with live catalogue material. */
export function LandingGenres({ doors = [] }: { doors?: LandingGenreDoor[] }) {
  return <GenreCarousel doors={doors} />;
}
