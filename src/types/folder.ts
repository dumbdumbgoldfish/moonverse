import type { ReviewListItem } from "@/types/review";

export interface FolderListItem {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  reviewCount: number;
  createdAt: string;
}

export interface FolderDetail extends FolderListItem {
  userId: string;
  canManage: boolean;
  reviews: ReviewListItem[];
}

export interface CreateFolderInput {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateFolderInput {
  name?: string;
  description?: string | null;
  isPublic?: boolean;
}
