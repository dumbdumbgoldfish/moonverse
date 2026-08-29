import Link from "next/link";
import { ADMIN_BTN_GOLD } from "@/components/admin/admin-styles";
import { AdminAnalyticsView } from "@/components/admin/AdminAnalyticsView";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import {
  getAdminAnalyticsSnapshot,
  getAdminDailySeries,
  getAuditActionBreakdown,
  getModerationQueueBreakdown,
  getOpenReportReasonBreakdown,
} from "@/services/admin/analytics.service";
import { getMoonieAdminMetrics } from "@/services/admin/moonie-analytics.service";
import { getSystemInfo } from "@/services/admin/dashboard.service";

export const metadata = {
  title: "Admin Analytics · MoonVerse",
};

export default async function AdminAnalyticsPage() {
  const [
    snapshot,
    dailySeries,
    queueBreakdown,
    reportReasons,
    auditActions,
    moonieMetrics,
    systemInfo,
  ] = await Promise.all([
    getAdminAnalyticsSnapshot(),
    getAdminDailySeries(14),
    getModerationQueueBreakdown(),
    getOpenReportReasonBreakdown(),
    getAuditActionBreakdown(7),
    getMoonieAdminMetrics(),
    getSystemInfo(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Analytics & reporting"
        description="Operational metrics from live MoonVerse database records."
      >
        <Link
          href="/admin"
          className={ADMIN_BTN_GOLD}
        >
          Dashboard
        </Link>
      </AdminPageHeader>
      <AdminAnalyticsView
        snapshot={snapshot}
        dailySeries={dailySeries}
        queueBreakdown={queueBreakdown}
        reportReasons={reportReasons}
        auditActions={auditActions}
        moonieMetrics={moonieMetrics}
        systemInfo={systemInfo}
      />
    </>
  );
}
