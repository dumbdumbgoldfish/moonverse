"use client";

import { formatDate } from "@/lib/date-utils";
import type { AuditLogEntry } from "@/services/audit.service";
import {
  AdminTableCell,
  AdminTableHead,
  AdminTableRow,
  AdminTableShell,
  AdminTableTh,
} from "@/components/admin/AdminUi";

interface AdminAuditLogTableProps {
  logs: AuditLogEntry[];
}

export function AdminAuditLogTable({ logs }: AdminAuditLogTableProps) {
  return (
    <AdminTableShell minWidth="900px">
      <AdminTableHead>
        <tr>
          <AdminTableTh>When</AdminTableTh>
          <AdminTableTh>Actor</AdminTableTh>
          <AdminTableTh>Action</AdminTableTh>
          <AdminTableTh>Entity</AdminTableTh>
          <AdminTableTh>Details</AdminTableTh>
        </tr>
      </AdminTableHead>
      <tbody>
        {logs.map((log) => (
          <AdminTableRow key={log.id}>
            <AdminTableCell className="text-xs text-white/70">
              {formatDate(log.createdAt)}
            </AdminTableCell>
            <AdminTableCell>@{log.actorUsername}</AdminTableCell>
            <AdminTableCell className="font-semibold">{log.action}</AdminTableCell>
            <AdminTableCell className="text-white/65">
              {log.entityType}
              <span className="mt-0.5 block font-mono text-[11px] text-white/70">
                {log.entityId}
              </span>
            </AdminTableCell>
            <AdminTableCell className="max-w-xs">
              {log.meta ? (
                <pre className="line-clamp-3 whitespace-pre-wrap break-all text-[11px] text-white/70">
                  {JSON.stringify(log.meta, null, 0)}
                </pre>
              ) : (
                <span className="text-white/35">—</span>
              )}
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </tbody>
    </AdminTableShell>
  );
}
