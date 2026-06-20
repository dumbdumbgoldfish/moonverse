export const LIMITS = {
  displayName: { min: 1, max: 80 },
  bio: { max: 500 },
  avatarUrl: { max: 2048 },
  username: { min: 3, max: 30 },
  password: { min: 8, max: 128 },
  email: { max: 254 },
  reviewTitle: { min: 3, max: 200 },
  reviewBody: { min: 20, max: 20000 },
  commentBody: { min: 1, max: 2000 },
  folderName: { min: 1, max: 100 },
  folderDescription: { max: 500 },
  moonieMessage: { min: 3, max: 500 },
} as const;

export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= LIMITS.email.max;
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateDisplayName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < LIMITS.displayName.min) {
    return "Display name is required.";
  }
  if (trimmed.length > LIMITS.displayName.max) {
    return `Display name must be ${LIMITS.displayName.max} characters or fewer.`;
  }
  return null;
}

export function validateBio(value: string): string | null {
  if (value.trim().length > LIMITS.bio.max) {
    return `Bio must be ${LIMITS.bio.max} characters or fewer.`;
  }
  return null;
}

export function validateAvatarUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > LIMITS.avatarUrl.max) {
    return "Avatar URL is too long.";
  }
  if (!isValidUrl(trimmed)) {
    return "Avatar URL must be a valid http or https link.";
  }
  return null;
}

export function validateReviewTitle(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < LIMITS.reviewTitle.min) {
    return `Review title must be at least ${LIMITS.reviewTitle.min} characters.`;
  }
  if (trimmed.length > LIMITS.reviewTitle.max) {
    return `Review title must be ${LIMITS.reviewTitle.max} characters or fewer.`;
  }
  return null;
}

export function validateReviewBody(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < LIMITS.reviewBody.min) {
    return `Review body must be at least ${LIMITS.reviewBody.min} characters.`;
  }
  if (trimmed.length > LIMITS.reviewBody.max) {
    return `Review body must be ${LIMITS.reviewBody.max} characters or fewer.`;
  }
  return null;
}

export function validateCommentBody(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < LIMITS.commentBody.min) {
    return "Comment cannot be empty.";
  }
  if (trimmed.length > LIMITS.commentBody.max) {
    return `Comment must be ${LIMITS.commentBody.max} characters or fewer.`;
  }
  return null;
}

export function validateFolderName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < LIMITS.folderName.min) {
    return "Folder name is required.";
  }
  if (trimmed.length > LIMITS.folderName.max) {
    return `Folder name must be ${LIMITS.folderName.max} characters or fewer.`;
  }
  return null;
}

export function validateMoonieMessage(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < LIMITS.moonieMessage.min) {
    return "Please describe what kind of web novel you're looking for.";
  }
  if (trimmed.length > LIMITS.moonieMessage.max) {
    return `Message must be ${LIMITS.moonieMessage.max} characters or fewer.`;
  }
  return null;
}
