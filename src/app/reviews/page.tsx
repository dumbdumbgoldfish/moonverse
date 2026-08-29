import { redirect } from "next/navigation";
import { DISCOVER_PATH } from "@/lib/home-view";

interface ReviewsIndexRedirectProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Legacy `/reviews` listing URLs forward to Discover. Individual reviews stay at `/reviews/[id]`. */
export default async function ReviewsIndexRedirect({
  searchParams,
}: ReviewsIndexRedirectProps) {
  const params = await searchParams;
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      qs.set(key, value);
    } else if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry) qs.append(key, entry);
      }
    }
  }

  const suffix = qs.toString();
  redirect(suffix ? `${DISCOVER_PATH}?${suffix}` : DISCOVER_PATH);
}
