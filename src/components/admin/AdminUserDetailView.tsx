"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminScrollPanel, AdminTabs } from "@/components/admin/AdminLayoutPrimitives";
import {
  AdminPanel,
  AdminSection,
  AdminStatCard,
  AdminTableCell,
  AdminTableHead,
  AdminTableRow,
  AdminTableShell,
  AdminTableTh,
} from "@/components/admin/AdminUi";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";
import type { AdminUserDetail } from "@/services/admin/user-detail.service";

export function AdminUserDetailView({ user }: { user: AdminUserDetail }) {
  const [activeTab, setActiveTab] = useState("overview");

  const overview = (
    <div className="grid gap-4 lg:grid-cols-2">
      <AdminPanel>
        <AdminSection title="Trust & safety">
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-white">Reports filed</dt>
              <dd className="font-semibold">{user.reportsFiled}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white">Reports against user</dt>
              <dd className="font-semibold">{user.reportsAgainst}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white">Email</dt>
              <dd className="truncate font-medium">{user.email}</dd>
            </div>
          </dl>
        </AdminSection>
      </AdminPanel>
      <AdminPanel>
        <AdminSection title="Admin actions">
          <AdminUserActions userId={user.id} role={user.role} isSuspended={user.isSuspended} />
        </AdminSection>
      </AdminPanel>
    </div>
  );

  const reviewsPanel = (
    <AdminScrollPanel maxHeight="calc(100dvh - 16rem)">
      {user.recentReviews.length === 0 ? (
        <p className="p-4 text-sm text-white">No reviews yet.</p>
      ) : (
        <AdminTableShell minWidth="600px" scrollable={false}>
          <AdminTableHead>
            <tr>
              <AdminTableTh>Title</AdminTableTh>
              <AdminTableTh>Status</AdminTableTh>
              <AdminTableTh>Date</AdminTableTh>
            </tr>
          </AdminTableHead>
          <tbody>
            {user.recentReviews.map((review) => (
              <AdminTableRow key={review.id}>
                <AdminTableCell>
                  <Link href={`/reviews/${review.id}`} className="font-medium text-[#fcd34d] hover:underline">
                    {review.title}
                  </Link>
                </AdminTableCell>
                <AdminTableCell>
                  <Badge variant="outline">{review.moderationStatus}</Badge>
                </AdminTableCell>
                <AdminTableCell className="text-xs text-white">
                  {formatDate(review.createdAt)}
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </tbody>
        </AdminTableShell>
      )}
    </AdminScrollPanel>
  );

  const auditPanel = (
    <AdminScrollPanel maxHeight="calc(100dvh - 16rem)">
      {user.recentAudit.length === 0 ? (
        <p className="p-4 text-sm text-white">No related audit events.</p>
      ) : (
        <AdminTableShell minWidth="700px" scrollable={false}>
          <AdminTableHead>
            <tr>
              <AdminTableTh>When</AdminTableTh>
              <AdminTableTh>Actor</AdminTableTh>
              <AdminTableTh>Action</AdminTableTh>
            </tr>
          </AdminTableHead>
          <tbody>
            {user.recentAudit.map((log) => (
              <AdminTableRow key={log.id}>
                <AdminTableCell className="text-xs text-white">
                  {formatDate(log.createdAt)}
                </AdminTableCell>
                <AdminTableCell>@{log.actorUsername}</AdminTableCell>
                <AdminTableCell className="font-semibold">{log.action}</AdminTableCell>
              </AdminTableRow>
            ))}
          </tbody>
        </AdminTableShell>
      )}
    </AdminScrollPanel>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>{user.role}</Badge>
        {user.isSuspended ? <Badge variant="destructive">Suspended</Badge> : null}
        <Badge variant={user.emailVerified ? "secondary" : "outline"}>
          {user.emailVerified ? "Email verified" : "Unverified email"}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Reviews" value={user.reviewCount} tone="plum" />
        <AdminStatCard label="Comments" value={user.commentCount} tone="violet" />
        <AdminStatCard label="Followers" value={user.followerCount} tone="gold" />
        <AdminStatCard label="Moonie chats" value={user.moonieConversationCount} tone="sky" />
      </div>

      <AdminTabs
        activeId={activeTab}
        onActiveChange={setActiveTab}
        tabs={[
          { id: "overview", label: "Overview", content: overview },
          { id: "reviews", label: "Reviews", badge: user.recentReviews.length, content: reviewsPanel },
          { id: "audit", label: "Audit", badge: user.recentAudit.length, content: auditPanel },
        ]}
      />
    </div>
  );
}
