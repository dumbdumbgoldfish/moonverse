import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Inbox,
  ScrollText,
  Users,
} from "lucide-react";
import {
  AdminActivityTrendChart,
  AdminChartPanel,
  AdminDonutChart,
} from "@/components/admin/AdminCharts";
import {
  AdminAttentionBanner,
  AdminAttentionLink,
  AdminPageHeader,
  AdminQuickAction,
  AdminStatCard,
} from "@/components/admin/AdminUi";
import { ADMIN_BTN_GOLD } from "@/components/admin/admin-styles";
import { getAdminDashboardAttention } from "@/services/admin/dashboard.service";
import {
  getAdminAnalyticsSnapshot,
  getAdminDailySeries,
  getModerationQueueBreakdown,
} from "@/services/admin/analytics.service";

export const metadata = {
  title: "Admin Dashboard · MoonVerse",
};

export default async function AdminDashboardPage() {
  const [snapshot, attention, dailySeries, queueBreakdown] = await Promise.all([
    getAdminAnalyticsSnapshot(),
    getAdminDashboardAttention(),
    getAdminDailySeries(14),
    getModerationQueueBreakdown(),
  ]);

  const queueTotal =
    attention.openReports +
    attention.pendingReadingLinks +
    attention.pendingTagSuggestions +
    attention.autoFlaggedReviews +
    attention.autoFlaggedComments;

  const attentionItems = [
    { href: "/admin/inbox", label: "Queue items", value: queueTotal },
    { href: "/admin/reports", label: "Open reports", value: attention.openReports },
    {
      href: "/admin/reading-links",
      label: "Pending links",
      value: attention.pendingReadingLinks,
    },
    {
      href: "/admin/reviews?status=AUTO_FLAGGED",
      label: "Flagged reviews",
      value: attention.autoFlaggedReviews,
    },
    {
      href: "/admin/comments?status=AUTO_FLAGGED",
      label: "Flagged comments",
      value: attention.autoFlaggedComments,
    },
  ].filter((item) => item.value > 0);

  const hasActivity = dailySeries.some(
    (point) => point.users > 0 || point.reviews > 0 || point.comments > 0
  );

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <AdminPageHeader
        title="Control centre"
        description="Live platform health, moderation workload, and growth trends from MoonVerse data."
      >
        <Link href="/admin/analytics" className={ADMIN_BTN_GOLD}>
          Full analytics
        </Link>
      </AdminPageHeader>

      {queueTotal > 0 ? (
        <AdminAttentionBanner title="Needs attention">
          <ul className="flex flex-wrap gap-2">
            {attentionItems.map((item) => (
              <li key={item.href}>
                <AdminAttentionLink
                  href={item.href}
                  count={item.value}
                  label={item.label}
                />
              </li>
            ))}
          </ul>
        </AdminAttentionBanner>
      ) : null}

      <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AdminStatCard
          label="Users"
          value={snapshot.totalUsers}
          hint={`+${snapshot.newUsers7d} last 7 days`}
          icon={Users}
          tone="plum"
        />
        <AdminStatCard
          label="Reviews"
          value={snapshot.totalReviews}
          hint={`+${snapshot.newReviews7d} last 7 days`}
          icon={BookOpen}
          tone="gold"
        />
        <AdminStatCard
          label="Novels"
          value={snapshot.totalNovels}
          icon={BookOpen}
          tone="violet"
        />
        <AdminStatCard
          label="Queue"
          value={queueTotal}
          hint={queueTotal > 0 ? "Requires triage" : "All clear"}
          icon={Inbox}
          tone={queueTotal > 0 ? "rose" : "emerald"}
        />
        <AdminStatCard
          label="Open reports"
          value={snapshot.openReports}
          icon={AlertTriangle}
          tone="rose"
        />
        <AdminStatCard
          label="Moonie (7d)"
          value={snapshot.moonieConversations7d}
          hint={`${snapshot.moonieMessages7d} messages`}
          icon={Activity}
          tone="sky"
        />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
        <AdminChartPanel
          title="Platform activity"
          subtitle="New users, reviews, and comments — last 14 days"
          height={200}
        >
          {hasActivity ? (
            <AdminActivityTrendChart data={dailySeries} />
          ) : (
            <p className="flex h-full items-center justify-center text-xs text-white">
              No sign-ups or content activity in the last 14 days.
            </p>
          )}
        </AdminChartPanel>

        <AdminChartPanel
          title="Moderation queue"
          subtitle="Open workload by category"
          height={200}
        >
          {queueBreakdown.length > 0 ? (
            <AdminDonutChart
              data={queueBreakdown.map((item) => ({
                label: item.label,
                count: item.count,
              }))}
            />
          ) : (
            <p className="flex h-full items-center justify-center text-xs text-white">
              No items awaiting moderation.
            </p>
          )}
        </AdminChartPanel>
      </div>

      <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminQuickAction
          href="/admin/inbox"
          label="Moderation queue"
          description="Triage reports, flags, links, and tag suggestions."
          icon={Inbox}
          accentIndex={0}
        />
        <AdminQuickAction
          href="/admin/users"
          label="User management"
          description="Roles, suspensions, and account oversight."
          icon={Users}
          accentIndex={1}
        />
        <AdminQuickAction
          href="/admin/novels"
          label="Novel catalogue"
          description="Titles, metadata, merges, and taxonomy."
          icon={BookOpen}
          accentIndex={2}
        />
        <AdminQuickAction
          href="/admin/audit"
          label="Audit log"
          description="Searchable record of admin actions."
          icon={ScrollText}
          accentIndex={3}
        />
      </div>
    </div>
  );
}
