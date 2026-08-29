"use client";

import { AdminFeaturedFoldersManager } from "@/components/admin/AdminFeaturedFoldersManager";
import { AdminFeaturedManager } from "@/components/admin/AdminFeaturedManager";
import { AdminTabs } from "@/components/admin/AdminLayoutPrimitives";
import type { AdminFeaturedNovelItem } from "@/services/featured.service";
import type { AdminFolderRow } from "@/services/folder.service";
import type { NovelSelectOption } from "@/services/novel.service";

interface AdminFeaturedTabsProps {
  featured: AdminFeaturedNovelItem[];
  novels: NovelSelectOption[];
  folders: AdminFolderRow[];
}

export function AdminFeaturedTabs({
  featured,
  novels,
  folders,
}: AdminFeaturedTabsProps) {
  return (
    <AdminTabs
      defaultId="novels"
      tabs={[
        {
          id: "novels",
          label: "Featured novels",
          badge: featured.length,
          content: <AdminFeaturedManager featured={featured} novels={novels} />,
        },
        {
          id: "lists",
          label: "Featured lists",
          badge: folders.length,
          content: <AdminFeaturedFoldersManager folders={folders} />,
        },
      ]}
    />
  );
}
