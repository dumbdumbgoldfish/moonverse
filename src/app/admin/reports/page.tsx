import { ReportStatus, ReportTargetType } from "@prisma/client";
import { AdminReportsTable } from "@/components/admin/AdminReportsTable";
import {
  AdminEmptyState,
  AdminFilterChips,
  AdminPageHeader,
  AdminSection,
} from "@/components/admin/AdminUi";
import { listReports } from "@/services/report.service";

export const metadata = { title: "Admin Reports · MoonVerse" };
export const dynamic = "force-dynamic";

const statuses = Object.values(ReportStatus);
const targetTypes = Object.values(ReportTargetType);

interface AdminReportsPageProps {
  searchParams: Promise<{ status?: string; type?: string }>;
}

export default async function AdminReportsPage({
  searchParams,
}: AdminReportsPageProps) {
  const { status, type } = await searchParams;
  const filterStatus = statuses.includes(status as ReportStatus)
    ? (status as ReportStatus)
    : "OPEN";
  const filterType = targetTypes.includes(type as ReportTargetType)
    ? (type as ReportTargetType)
    : undefined;

  const reports = await listReports({
    status: filterStatus,
    targetType: filterType ?? "ALL",
  });

  function buildHref(nextStatus?: string, nextType?: string) {
    const params = new URLSearchParams();
    if (nextStatus) params.set("status", nextStatus);
    if (nextType) params.set("type", nextType);
    const qs = params.toString();
    return qs ? `?${qs}` : "/admin/reports";
  }

  return (
    <>
      <AdminPageHeader
        title="Reports"
        description="Browse and filter abuse reports. Use the moderation queue for day-to-day triage."
      />
      <AdminSection title="Status" className="mb-4">
        <AdminFilterChips
          items={statuses.map((value) => ({
            href: buildHref(value, filterType),
            label: value,
            active: value === filterStatus,
          }))}
        />
      </AdminSection>
      <AdminSection title="Target type" className="mb-6">
        <AdminFilterChips
          items={[undefined, ...targetTypes].map((value) => ({
            href: buildHref(filterStatus, value),
            label: value ?? "All types",
            active: (value ?? "all") === (filterType ?? "all"),
          }))}
        />
      </AdminSection>
      {reports.length === 0 ? (
        <AdminEmptyState
          title="No reports"
          description="Nothing matches this filter right now."
        />
      ) : (
        <AdminReportsTable reports={reports} />
      )}
    </>
  );
}
