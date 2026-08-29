import {
  AVATAR_ACCEPT,
  AVATAR_MAX_BYTES,
  AVATAR_MAX_DIMENSION,
  finalizeAvatarDataUrl,
} from "@/lib/avatar-upload";
import {
  IMAGE_SOURCE_MAX_BYTES,
  imageSourceTooLargeMessage,
} from "@/lib/image-upload-limits";
import {
  NOVEL_COVER_ACCEPT,
  NOVEL_COVER_MAX_BYTES,
  NOVEL_COVER_MAX_DIMENSION,
  finalizeNovelCoverDataUrl,
} from "@/lib/novel-cover";
import {
  PROFILE_BACKGROUND_ACCEPT,
  PROFILE_BACKGROUND_HEIGHT,
  PROFILE_BACKGROUND_MAX_BYTES,
  PROFILE_BACKGROUND_WIDTH,
  finalizeProfileBackgroundDataUrl,
} from "@/lib/profile-background-upload";

export type ImageCropPresetId = "avatar" | "novelCover" | "profileBanner";

export interface ImageCropPreset {
  id: ImageCropPresetId;
  aspect: number;
  title: string;
  description: string;
  outputWidth: number;
  outputHeight: number;
  maxBytes: number;
  accept: string;
  /** Max raw file size before cropping. */
  maxSourceBytes: number;
  invalidTypeMessage: string;
  tooLargeMessage: string;
  confirmLabel: string;
}

export const IMAGE_CROP_PRESETS: Record<ImageCropPresetId, ImageCropPreset> = {
  avatar: {
    id: "avatar",
    aspect: 1,
    title: "Crop profile photo",
    description: "Drag to reposition and zoom. Your photo will appear as a square.",
    outputWidth: AVATAR_MAX_DIMENSION,
    outputHeight: AVATAR_MAX_DIMENSION,
    maxBytes: AVATAR_MAX_BYTES,
    accept: AVATAR_ACCEPT,
    maxSourceBytes: IMAGE_SOURCE_MAX_BYTES,
    invalidTypeMessage: "Profile image must be a JPEG, PNG, or WebP file.",
    tooLargeMessage: imageSourceTooLargeMessage("Profile image"),
    confirmLabel: "Use photo",
  },
  novelCover: {
    id: "novelCover",
    aspect: 2 / 3,
    title: "Crop cover image",
    description:
      "Drag to reposition and zoom. Covers use a portrait book ratio (2:3).",
    outputWidth: Math.round((NOVEL_COVER_MAX_DIMENSION * 2) / 3),
    outputHeight: NOVEL_COVER_MAX_DIMENSION,
    maxBytes: NOVEL_COVER_MAX_BYTES,
    accept: NOVEL_COVER_ACCEPT,
    maxSourceBytes: IMAGE_SOURCE_MAX_BYTES,
    invalidTypeMessage: "Cover must be a JPEG, PNG, or WebP image.",
    tooLargeMessage: imageSourceTooLargeMessage("Cover image"),
    confirmLabel: "Use cover",
  },
  profileBanner: {
    id: "profileBanner",
    aspect: PROFILE_BACKGROUND_WIDTH / PROFILE_BACKGROUND_HEIGHT,
    title: "Crop profile background",
    description:
      "Drag to reposition and zoom. The banner uses a wide 3:1 landscape ratio.",
    outputWidth: PROFILE_BACKGROUND_WIDTH,
    outputHeight: PROFILE_BACKGROUND_HEIGHT,
    maxBytes: PROFILE_BACKGROUND_MAX_BYTES,
    accept: PROFILE_BACKGROUND_ACCEPT,
    maxSourceBytes: IMAGE_SOURCE_MAX_BYTES,
    invalidTypeMessage: "Background image must be a JPEG, PNG, or WebP file.",
    tooLargeMessage: imageSourceTooLargeMessage("Background image"),
    confirmLabel: "Use background",
  },
};

export async function finalizeCroppedDataUrl(
  presetId: ImageCropPresetId,
  dataUrl: string,
): Promise<string> {
  switch (presetId) {
    case "avatar":
      return finalizeAvatarDataUrl(dataUrl);
    case "novelCover":
      return finalizeNovelCoverDataUrl(dataUrl);
    case "profileBanner":
      return finalizeProfileBackgroundDataUrl(dataUrl);
    default: {
      const exhaustive: never = presetId;
      return exhaustive;
    }
  }
}
