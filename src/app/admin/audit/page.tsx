import { ADMIN_FILTER_CHIP_IDLE } from "@/components/admin/admin-styles";
import { AdminAuditFilters } from "@/components/admin/AdminAuditFilters";
import { AdminAuditLogTable } from "@/components/admin/AdminAuditLogTable";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/AdminUi";
import {
  countAuditLogs,
  listAuditActionTypes,
  listAuditLogs,
} from "@/services/audit.service";

export const metadata = { title: "Audit Log · MoonVerse Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface AdminAuditPageProps {
  searchParams: Promise<{
    query?: string;
    action?: string;
    entityType?: string;
    actor?: string;
    page?: string;
  }>;
}

export default async function AdminAuditPage({
  searchParams,
}: AdminAuditPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const filterOptions = {
    query: params.query,
    action: params.action,
    entityType: params.entityType,
    actorUsername: params.actor,
  };

  const [logs, total, actions] = await Promise.all([
    listAuditLogs({ ...filterOptions, limit: PAGE_SIZE, offset }),
    countAuditLogs(filterOptions),
    listAuditActionTypes(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader
        title="Audit log"
        description="Searchable record of moderator and admin actions for accountability and compliance."
      />

      <AdminAuditFilters
        actions={actions}
        current={{
          query: params.query,
          action: params.action,
          entityType: params.entityType,
          actor: params.actor,
        }}
      />

      <p className="mb-4 text-xs text-white">
        Showing {logs.length} of {total.toLocaleString()} entries
        {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
      </p>

      {logs.length === 0 ? (
        <AdminEmptyState
          title="No matching audit entries"
          description="Try clearing filters or perform admin actions to populate the log."
        />
      ) : (
        <>
          <AdminAuditLogTable logs={logs} />
          {totalPages > 1 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {page > 1 ? (
                <a
                  href={`/admin/audit?${new URLSearchParams({
                    ...(params.query ? { query: params.query } : {}),
                    ...(params.action ? { action: params.action } : {}),
                    ...(params.entityType ? { entityType: params.entityType } : {}),
                    ...(params.actor ? { actor: params.actor } : {}),
                    page: String(page - 1),
                  }).toString()}`}
                  className={`inline-flex ${ADMIN_FILTER_CHIP_IDLE} px-3 py-1.5 text-xs font-semibold`}
                >
                  Previous
                </a>
              ) : null}
              {page < totalPages ? (
                <a
                  href={`/admin/audit?${new URLSearchParams({
                    ...(params.query ? { query: params.query } : {}),
                    ...(params.action ? { action: params.action } : {}),
                    ...(params.entityType ? { entityType: params.entityType } : {}),
                    ...(params.actor ? { actor: params.actor } : {}),
                    page: String(page + 1),
                  }).toString()}`}
                  className={`inline-flex ${ADMIN_FILTER_CHIP_IDLE} px-3 py-1.5 text-xs font-semibold`}
                >
                  Next
                </a>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
