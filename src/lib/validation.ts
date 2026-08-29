import { isAvatarDataUrl } from "@/lib/avatar-upload";
import { isProfileBackgroundDataUrl } from "@/lib/profile-background-upload";

export const LIMITS = {
  displayName: { min: 1, max: 80 },
  bio: { max: 500 },
  avatarUrl: { max: 2048 },
  profileBackgroundUrl: { max: 2048 },
  username: { min: 3, max: 30 },
  password: { min: 8, max: 128 },
  email: { max: 254 },
  reviewTitle: { min: 8, max: 200 },
  /** Recommended display length for review titles (UI guidance). */
  reviewTitleRecommended: { max: 160 },
  reviewBody: { min: 100, max: 20000 },
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

/** Strict HTTPS URL for covers and reading sources (blocks javascript:/data:). */
export function isSafeHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return false;
    if (!url.hostname || url.hostname.includes(" ")) return false;
    return true;
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
  if (isAvatarDataUrl(trimmed)) {
    if (trimmed.length > 220_000) {
      return "Profile image is too large.";
    }
    return null;
  }
  if (trimmed.length > LIMITS.avatarUrl.max) {
    return "Avatar URL is too long.";
  }
  if (!isValidUrl(trimmed)) {
    return "Avatar must be an uploaded image or a valid http or https link.";
  }
  return null;
}

export function validateProfileBackgroundUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isProfileBackgroundDataUrl(trimmed)) {
    if (trimmed.length > 450_000) {
      return "Profile background image is too large.";
    }
    return null;
  }
  if (trimmed.length > LIMITS.profileBackgroundUrl.max) {
    return "Profile background URL is too long.";
  }
  if (!isValidUrl(trimmed)) {
    return "Background must be an uploaded image or a valid http or https link.";
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

import { isAllowedShortMoonieMessage } from "@/lib/moonie/intent";

export function validateMoonieMessage(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Please enter a message.";
  }
  if (!isAllowedShortMoonieMessage(trimmed)) {
    return "Please describe what kind of web novel you're looking for.";
  }
  if (trimmed.length > LIMITS.moonieMessage.max) {
    return `Message must be ${LIMITS.moonieMessage.max} characters or fewer.`;
  }
  return null;
}
