"use client";

import {
  AdminActivityTrendChart,
  AdminBarCountChart,
  AdminChartPanel,
  AdminDonutChart,
  AdminGroupedBarChart,
} from "@/components/admin/AdminCharts";
import { AdminTabs } from "@/components/admin/AdminLayoutPrimitives";
import { AdminPanel, AdminStatCard } from "@/components/admin/AdminUi";
import type { AdminAnalyticsSnapshot, DailySeriesPoint, LabelCount, QueueBreakdownItem } from "@/services/admin/analytics.service";
import type { MoonieAdminMetrics } from "@/services/admin/moonie-analytics.service";

interface AdminAnalyticsViewProps {
  snapshot: AdminAnalyticsSnapshot;
  dailySeries: DailySeriesPoint[];
  queueBreakdown: QueueBreakdownItem[];
  reportReasons: LabelCount[];
  auditActions: LabelCount[];
  moonieMetrics: MoonieAdminMetrics;
  systemInfo: {
    appName: string;
    environment: string;
    databaseStatus: "connected" | "error";
    moonieMode: string;
  };
}

export function AdminAnalyticsView({
  snapshot,
  dailySeries,
  queueBreakdown,
  reportReasons,
  auditActions,
  moonieMetrics,
  systemInfo,
}: AdminAnalyticsViewProps) {
  const contentVolume7d = [
    { label: "Users", count: snapshot.newUsers7d },
    { label: "Reviews", count: snapshot.newReviews7d },
    { label: "Comments", count: snapshot.newComments7d },
  ].filter((item) => item.count > 0);

  const moonieRequestTypes = [
    { label: "Recommend", count: moonieMetrics.recommendRequests7d },
    { label: "Lookup", count: moonieMetrics.lookupRequests7d },
    { label: "Compare", count: moonieMetrics.compareRequests7d },
    { label: "Image", count: moonieMetrics.imageRequests7d },
  ].filter((item) => item.count > 0);

  const moonieHealth = [
    { label: "Clarifications", count: moonieMetrics.clarificationEvents7d },
    { label: "No results", count: moonieMetrics.noResultEvents7d },
    { label: "Rate limits", count: moonieMetrics.rateLimitEvents7d },
    { label: "Helpful", count: moonieMetrics.helpfulFeedback7d },
    { label: "Not helpful", count: moonieMetrics.notHelpfulFeedback7d },
  ].filter((item) => item.count > 0);

  const hasActivity = dailySeries.some(
    (point) => point.users > 0 || point.reviews > 0 || point.comments > 0
  );

  const overview = (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="New users (7d)" value={snapshot.newUsers7d} hint={`${snapshot.totalUsers.toLocaleString()} total`} tone="plum" />
        <AdminStatCard label="New reviews (7d)" value={snapshot.newReviews7d} hint={`${snapshot.totalReviews.toLocaleString()} total`} tone="gold" />
        <AdminStatCard label="New comments (7d)" value={snapshot.newComments7d} tone="violet" />
        <AdminStatCard label="Moonie events (7d)" value={moonieMetrics.totalEvents7d} hint={`${snapshot.moonieConversations7d} conversations`} tone="sky" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminChartPanel title="Growth trend" subtitle="Daily sign-ups and published content">
          {hasActivity ? (
            <AdminActivityTrendChart data={dailySeries} />
          ) : (
            <p className="flex h-full items-center justify-center text-xs text-white/70">No platform activity in the last 14 days.</p>
          )}
        </AdminChartPanel>
        <AdminChartPanel title="Content volume (7d)" subtitle="New records by type">
          {contentVolume7d.length > 0 ? (
            <AdminGroupedBarChart data={contentVolume7d} />
          ) : (
            <p className="flex h-full items-center justify-center text-xs text-white/70">No new content in the last 7 days.</p>
          )}
        </AdminChartPanel>
      </div>
    </div>
  );

  const moderation = (
    <div className="grid gap-4 lg:grid-cols-2">
      <AdminChartPanel title="Moderation workload" subtitle="Current open queue distribution">
        {queueBreakdown.length > 0 ? (
          <AdminDonutChart data={queueBreakdown.map((item) => ({ label: item.label, count: item.count }))} />
        ) : (
          <p className="flex h-full items-center justify-center text-xs text-white/70">Moderation queue is empty.</p>
        )}
      </AdminChartPanel>
      <AdminChartPanel title="Open reports by reason" subtitle="Grouped from live report records">
        {reportReasons.length > 0 ? (
          <AdminBarCountChart data={reportReasons} />
        ) : (
          <p className="flex h-full items-center justify-center text-xs text-white/70">No open reports.</p>
        )}
      </AdminChartPanel>
      {auditActions.length > 0 ? (
        <AdminChartPanel title="Admin actions (7d)" subtitle="From moderation audit log" className="lg:col-span-2">
          <AdminBarCountChart data={auditActions} />
        </AdminChartPanel>
      ) : null}
    </div>
  );

  const moonie = (
    <div className="grid gap-4 lg:grid-cols-2">
      {moonieRequestTypes.length > 0 ? (
        <AdminChartPanel title="Moonie request types (7d)" subtitle="From recommendation event log">
          <AdminGroupedBarChart data={moonieRequestTypes} />
        </AdminChartPanel>
      ) : (
        <AdminPanel>
          <p className="text-sm text-white/70">No Moonie recommendation events recorded in the last 7 days.</p>
        </AdminPanel>
      )}
      {moonieMetrics.intentDistribution.length > 0 ? (
        <AdminChartPanel title="Intent distribution (7d)" subtitle="Top detected recommendation intents">
          <AdminDonutChart
            data={moonieMetrics.intentDistribution.map((item) => ({
              label: item.intent,
              count: item.count,
            }))}
          />
        </AdminChartPanel>
      ) : null}
      {moonieHealth.length > 0 ? (
        <AdminChartPanel title="Operational signals (7d)" subtitle="Clarifications, limits, and feedback" className="lg:col-span-2">
          <AdminBarCountChart data={moonieHealth} />
        </AdminChartPanel>
      ) : null}
    </div>
  );

  const system = (
    <AdminPanel>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">Database</p>
          <p className={systemInfo.databaseStatus === "connected" ? "mt-1 text-sm font-medium text-[#256B53]" : "mt-1 text-sm font-medium text-[#BE4F7D]"}>
            {systemInfo.databaseStatus === "connected" ? "Connected" : "Error"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">Environment</p>
          <p className="mt-1 text-sm font-medium text-white">{systemInfo.environment}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/70">Moonie mode</p>
          <p className="mt-1 text-sm font-medium text-white">{systemInfo.moonieMode}</p>
        </div>
      </div>
      {moonieMetrics.avgResultCount7d !== null ? (
        <p className="mt-3 text-xs text-white/70">
          Avg. Moonie results per recommend request (7d):{" "}
          <span className="font-medium text-white">{moonieMetrics.avgResultCount7d.toFixed(1)}</span>
        </p>
      ) : null}
    </AdminPanel>
  );

  return (
    <AdminTabs
      defaultId="overview"
      tabs={[
        { id: "overview", label: "Overview", content: overview },
        { id: "moderation", label: "Moderation", badge: queueBreakdown.reduce((s, i) => s + i.count, 0), content: moderation },
        { id: "moonie", label: "Moonie", badge: moonieMetrics.totalEvents7d, content: moonie },
        { id: "system", label: "System", content: system },
      ]}
    />
  );
}
