import { Suspense } from "react";
import Link from "next/link";
import { AdminReviewsTable } from "@/components/admin/AdminReviewsTable";
import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/AdminUi";
import { getAdminReviews } from "@/services/admin/reviews.service";

export const metadata = { title: "Admin Reviews — MoonVerse" };

interface AdminReviewsPageProps {
  searchParams: Promise<{ q?: string; rating?: string }>;
}

export default async function AdminReviewsPage({
  searchParams,
}: AdminReviewsPageProps) {
  const { q, rating } = await searchParams;
  const ratingNum = rating ? Number(rating) : undefined;

  const reviews = await getAdminReviews({
    query: q,
    rating: ratingNum && ratingNum >= 1 && ratingNum <= 5 ? ratingNum : undefined,
  });

  return (
    <>
      <AdminPageHeader
        title="Reviews"
        description="Search and remove inappropriate reviews."
      />
      <Suspense fallback={null}>
        <div className="mb-4">
          <AdminSearchBar placeholder="Search title, novel, or username" />
        </div>
      </Suspense>
      <div className="mb-6 flex flex-wrap gap-2">
        {[undefined, 1, 2, 3, 4, 5].map((value) => (
          <Link
            key={value ?? "all"}
            href={value ? `?rating=${value}${q ? `&q=${encodeURIComponent(q)}` : ""}` : q ? `?q=${encodeURIComponent(q)}` : "/admin/reviews"}
            className={`rounded-full border px-3 py-1 text-xs ${
              (value ?? "all") === (ratingNum ?? "all")
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {value ? `${value} stars` : "All ratings"}
          </Link>
        ))}
      </div>
      {reviews.length === 0 ? (
        <AdminEmptyState title="No reviews found" description="Try another search or filter." />
      ) : (
        <AdminReviewsTable reviews={reviews} />
      )}
    </>
  );
}
