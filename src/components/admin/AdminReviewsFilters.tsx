"use client";

import { AdminCollapsibleSection } from "@/components/admin/AdminLayoutPrimitives";
import { AdminFilterChips, AdminSection } from "@/components/admin/AdminUi";

interface AdminReviewsFiltersProps {
  ratingItems: Array<{ href: string; label: string; active: boolean }>;
  statusItems: Array<{ href: string; label: string; active: boolean }>;
}

export function AdminReviewsFilters({
  ratingItems,
  statusItems,
}: AdminReviewsFiltersProps) {
  return (
    <AdminCollapsibleSection
      title="Filters"
      description="Rating and moderation status"
      defaultOpen={false}
    >
      <div className="space-y-4">
        <AdminSection title="Rating">
          <AdminFilterChips items={ratingItems} />
        </AdminSection>
        <AdminSection title="Moderation status">
          <AdminFilterChips items={statusItems} />
        </AdminSection>
      </div>
    </AdminCollapsibleSection>
  );
}
