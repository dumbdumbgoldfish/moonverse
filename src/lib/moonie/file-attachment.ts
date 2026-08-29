export const FILE_ATTACHMENT_MAX_BYTES = 64 * 1024;
export const FILE_ATTACHMENT_MAX_TITLES = 12;

const ALLOWED_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/csv",
]);

const ALLOWED_EXTENSIONS = new Set([".txt", ".md", ".csv"]);

export function isAllowedFileAttachment(fileName: string, mimeType?: string): boolean {
  const lower = fileName.trim().toLowerCase();
  const ext = lower.includes(".") ? lower.slice(lower.lastIndexOf(".")) : "";
  if (ext && ALLOWED_EXTENSIONS.has(ext)) return true;
  if (mimeType && ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) return true;
  return false;
}

export type FileParseFailureCode =
  | "empty"
  | "too_large"
  | "no_titles"
  | "too_many_titles";

export type FileParseResult =
  | { ok: true; titles: string[] }
  | { ok: false; code: FileParseFailureCode; reason: string };

export const FILE_UNSUPPORTED_TYPE_MESSAGE =
  "Unsupported file type. Only .txt, .md, and .csv files are supported.";

export function fileParseFailureMessage(
  code: FileParseFailureCode,
  fileName: string,
  options?: { titleCount?: number }
): string {
  switch (code) {
    case "empty":
      return "That file is empty. Add at least one novel title before uploading.";
    case "too_large":
      return `File is too large. Maximum size is ${Math.round(FILE_ATTACHMENT_MAX_BYTES / 1024)}KB.`;
    case "no_titles":
      if (fileName.toLowerCase().endsWith(".csv")) {
        return 'I opened the file, but couldn\'t find any novel titles. For CSV, include a column named "title" (or novel, name, book) with one title per row.';
      }
      return 'I opened the file, but couldn\'t find any novel titles. For TXT/MD, put one title on each line.';
    case "too_many_titles":
      return `That file has ${options?.titleCount ?? FILE_ATTACHMENT_MAX_TITLES + 1} titles. Moonie can process up to ${FILE_ATTACHMENT_MAX_TITLES} at once.`;
    default:
      return 'I opened the file, but couldn\'t find any novel titles. For TXT/MD, put one title on each line. For CSV, include a column named "title".';
  }
}

export function parseNovelTitlesFromFileContent(
  content: string,
  fileName: string
): FileParseResult {
  const trimmed = content.replace(/^\uFEFF/, "").trim();
  if (!trimmed) {
    return {
      ok: false,
      code: "empty",
      reason: fileParseFailureMessage("empty", fileName),
    };
  }

  if (trimmed.length > FILE_ATTACHMENT_MAX_BYTES) {
    return {
      ok: false,
      code: "too_large",
      reason: fileParseFailureMessage("too_large", fileName),
    };
  }

  const lowerName = fileName.toLowerCase();
  let titles: string[];

  if (lowerName.endsWith(".csv")) {
    titles = parseCsvTitleColumn(trimmed);
  } else {
    titles = extractTitlesFromTxtOrMd(trimmed);
  }

  titles = dedupeTitles(titles);

  if (titles.length === 0) {
    return {
      ok: false,
      code: "no_titles",
      reason: fileParseFailureMessage("no_titles", fileName),
    };
  }

  if (titles.length > FILE_ATTACHMENT_MAX_TITLES) {
    return {
      ok: false,
      code: "too_many_titles",
      reason: fileParseFailureMessage("too_many_titles", fileName, {
        titleCount: titles.length,
      }),
    };
  }

  return { ok: true, titles };
}

/** Parse TXT/MD uploads — one title per line, up to the file attachment limit. */
export function extractTitlesFromTxtOrMd(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s\-*•\d.]+/, "").trim())
    .filter((line) => line.length >= 2 && !/^compare\b/i.test(line));
}

function dedupeTitles(titles: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const title of titles) {
    const key = title.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(title.trim());
  }
  return out;
}

function parseCsvTitleColumn(content: string): string[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headerCells = splitCsvLine(lines[0]!);
  const titleIndex = headerCells.findIndex((cell) =>
    /^(title|novel|name|book)$/i.test(cell.trim())
  );

  if (titleIndex < 0 && lines.length === 1) {
    return [];
  }

  const startRow = titleIndex >= 0 ? 1 : 1;
  const column = titleIndex >= 0 ? titleIndex : 0;
  const titles: string[] = [];

  for (let i = startRow; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]!);
    const value = (cells[column] ?? cells[0] ?? "").trim();
    if (value.length >= 2) titles.push(value);
  }

  return titles;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]!;
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export async function readTextFileAsBase64(file: File): Promise<{
  data: string;
  fileName: string;
  mimeType: string;
}> {
  if (!isAllowedFileAttachment(file.name, file.type)) {
    throw new Error(FILE_UNSUPPORTED_TYPE_MESSAGE);
  }
  if (file.size > FILE_ATTACHMENT_MAX_BYTES) {
    throw new Error(fileParseFailureMessage("too_large", file.name));
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }

  return {
    data: btoa(binary),
    fileName: file.name,
    mimeType: file.type || "text/plain",
  };
}

export function decodeBase64Text(data: string): string {
  return Buffer.from(data, "base64").toString("utf-8");
}
