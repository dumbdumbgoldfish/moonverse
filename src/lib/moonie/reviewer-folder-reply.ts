export interface MoonieReviewerFolderRow {
  id: string;
  name: string;
  isPublic: boolean;
  reviewCount: number;
}

export interface MoonieReviewerFolderOverview {
  id: string;
  username: string;
  displayName: string;
}

export function buildMoonieReviewerFolderReply(input: {
  folders: MoonieReviewerFolderRow[];
  overview: MoonieReviewerFolderOverview;
  viewerId?: string;
}): { reply: string } {
  const { folders, overview, viewerId } = input;
  const isOwner = viewerId === overview.id;
  const publicFolders = folders.filter((folder) => folder.isPublic);
  const visibleFolders = isOwner ? folders : publicFolders;

  if (!isOwner && folders.length > 0 && publicFolders.length === 0) {
    return {
      reply: `@${overview.username}'s saved folders on MoonVerse are private. I can only show public folders that reviewers choose to share.`,
    };
  }

  if (visibleFolders.length === 0) {
    return {
      reply: `${overview.displayName} has no public saved folders on MoonVerse yet.`,
    };
  }

  const folderLines = visibleFolders
    .slice(0, 10)
    .map(
      (folder) =>
        `- **${folder.name}** (${folder.reviewCount} reviews) — [Open folder](/folders/${folder.id})`
    );
  const folderReply =
    visibleFolders.length > 10
      ? `Here are the first 10 public folders from @${overview.username} (${visibleFolders.length} public total).`
      : `Here are ${visibleFolders.length} public folder${
          visibleFolders.length === 1 ? "" : "s"
        } from @${overview.username}.`;

  return {
    reply: [folderReply, folderLines.join("\n")].join("\n\n"),
  };
}
