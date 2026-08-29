"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { adminToggleFolderFeaturedAction } from "@/actions/admin.actions";
import {
  AdminSection,
  AdminTableCell,
  AdminTableHead,
  AdminTableRow,
  AdminTableShell,
  AdminTableTh,
} from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-utils";
import type { AdminFolderRow } from "@/services/folder.service";

interface AdminFeaturedFoldersManagerProps {
  folders: AdminFolderRow[];
}

function FeatureToggleButton({
  folderId,
  isFeatured,
}: {
  folderId: string;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="xs"
      variant={isFeatured ? "outline" : "default"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await adminToggleFolderFeaturedAction(folderId, !isFeatured);
          router.refresh();
        })
      }
    >
      {pending ? "…" : isFeatured ? "Unfeature" : "Feature on /lists"}
    </Button>
  );
}

export function AdminFeaturedFoldersManager({
  folders,
}: AdminFeaturedFoldersManagerProps) {
  return (
    <AdminSection
      title="Featured reading lists"
      description="Curate public folders shown on the community lists page."
    >
      <AdminTableShell minWidth="700px">
        <AdminTableHead>
          <tr>
            <AdminTableTh>List</AdminTableTh>
            <AdminTableTh>Owner</AdminTableTh>
            <AdminTableTh>Status</AdminTableTh>
            <AdminTableTh>Actions</AdminTableTh>
          </tr>
        </AdminTableHead>
        <tbody>
          {folders.map((folder) => (
            <AdminTableRow key={folder.id}>
              <AdminTableCell>
                <Link
                  href={`/folders/${folder.id}`}
                  className="font-medium text-[#fcd34d]"
                >
                  {folder.name}
                </Link>
                <p className="text-xs text-white">
                  {folder.reviewCount} reviews · updated{" "}
                  {formatDate(folder.updatedAt)}
                </p>
              </AdminTableCell>
              <AdminTableCell>
                <Link
                  href={`/users/${folder.ownerUsername}`}
                  className="text-[#fcd34d]"
                >
                  {folder.ownerDisplayName}
                </Link>
                <p className="text-xs text-white">
                  @{folder.ownerUsername}
                </p>
              </AdminTableCell>
              <AdminTableCell>
                {folder.isFeatured ? (
                  <Badge>Featured</Badge>
                ) : (
                  <Badge variant="outline">Public</Badge>
                )}
              </AdminTableCell>
              <AdminTableCell>
                <FeatureToggleButton
                  folderId={folder.id}
                  isFeatured={folder.isFeatured}
                />
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </tbody>
      </AdminTableShell>
    </AdminSection>
  );
}
