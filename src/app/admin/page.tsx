import Link from "next/link";
import {
  getAdminDashboardStats,
  getAdminLatestReviews,
  getAdminLatestUsers,
} from "@/services/admin/dashboard.service";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/AdminUi";
import { formatDate } from "@/lib/date-utils";

export const metadata = {
  title: "Admin Dashboard — MoonVerse",
};

export default async function AdminDashboardPage() {
  const [stats, latestReviews, latestUsers] = await Promise.all([
    getAdminDashboardStats(),
    getAdminLatestReviews(5),
    getAdminLatestUsers(5),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of MoonVerse platform activity."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard label="Users" value={stats.users} />
        <AdminStatCard label="Reviews" value={stats.reviews} />
        <AdminStatCard label="Novels" value={stats.novels} />
        <AdminStatCard label="Comments" value={stats.comments} />
        <AdminStatCard label="Likes" value={stats.likes} />
        <AdminStatCard label="Folders" value={stats.folders} />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {[
          ["/admin/users", "Manage users"],
          ["/admin/reviews", "Manage reviews"],
          ["/admin/comments", "Manage comments"],
          ["/admin/novels", "Manage novels"],
          ["/admin/notifications", "View notifications"],
        ].map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border border-border/60 bg-bg-elevated px-3 py-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Latest reviews</h2>
          <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-bg-elevated">
            {latestReviews.map((review) => (
              <li key={review.id} className="px-4 py-3">
                <Link
                  href={`/reviews/${review.id}`}
                  className="font-medium hover:text-primary"
                >
                  {review.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {review.novelTitle} · @{review.reviewerUsername} ·{" "}
                  {formatDate(review.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Latest users</h2>
          <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-bg-elevated">
            {latestUsers.map((user) => (
              <li key={user.id} className="px-4 py-3">
                <Link
                  href={`/users/${user.username}`}
                  className="font-medium hover:text-primary"
                >
                  {user.displayName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  @{user.username} · {user.role} · {formatDate(user.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
