import type {
  MooniePersistedUserAttachment,
  MoonieUserAttachmentDisplay,
} from "@/types/moonie";

export function normalizeDictationText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function mergeDictationIntoComposerText(
  existing: string,
  transcript: string
): string {
  const trimmedTranscript = normalizeDictationText(transcript);
  if (!trimmedTranscript) return existing;
  const trimmedExisting = existing.trimEnd();
  if (!trimmedExisting) return trimmedTranscript;
  return `${trimmedExisting} ${trimmedTranscript}`;
}

export function fileAttachmentExtension(fileName?: string): string | null {
  if (!fileName) return null;
  const dot = fileName.lastIndexOf(".");
  if (dot < 0) return null;
  return fileName.slice(dot + 1).toUpperCase();
}

export function buildUserAttachmentDisplay(options: {
  attachmentType?: "image" | "file" | null;
  imagePreview?: {
    previewUrl: string;
    fileName: string;
    mimeType: string;
  } | null;
  fileName?: string | null;
  fileMimeType?: string | null;
}): MoonieUserAttachmentDisplay | undefined {
  if (options.attachmentType === "image") {
    return {
      type: "image",
      name: options.imagePreview?.fileName ?? "screenshot",
      mimeType: options.imagePreview?.mimeType,
      imagePreviewUrl: options.imagePreview?.previewUrl,
    };
  }

  if (options.attachmentType === "file" && options.fileName) {
    return {
      type: "file",
      name: options.fileName,
      mimeType: options.fileMimeType ?? undefined,
    };
  }

  return undefined;
}

export function toPersistedUserAttachment(
  display: MoonieUserAttachmentDisplay | undefined
): MooniePersistedUserAttachment | undefined {
  if (!display) return undefined;
  return {
    type: display.type,
    name: display.name,
    mimeType: display.mimeType,
  };
}

export function userAttachmentFromPersisted(
  persisted: unknown
): MoonieUserAttachmentDisplay | undefined {
  if (!persisted || typeof persisted !== "object") return undefined;
  const value = persisted as Record<string, unknown>;
  const type = value.type;
  if (type !== "image" && type !== "file" && type !== "voice") {
    return undefined;
  }
  return {
    type,
    name: typeof value.name === "string" ? value.name : undefined,
    mimeType: typeof value.mimeType === "string" ? value.mimeType : undefined,
  };
}
