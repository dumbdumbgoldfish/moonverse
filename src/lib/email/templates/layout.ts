export type EmailInlinePart =
  | { kind: "text"; value: string }
  | { kind: "emphasis"; value: string };

export type EmailBodyBlock =
  | { kind: "paragraph"; parts: EmailInlinePart[] }
  | { kind: "list"; items: string[] }
  | { kind: "quote"; text: string };

export interface EmailTemplateContent {
  preheader: string;
  title: string;
  greeting?: string;
  bodyBlocks: EmailBodyBlock[];
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function text(value: string): EmailInlinePart {
  return { kind: "text", value };
}

export function strong(value: string): EmailInlinePart {
  return { kind: "emphasis", value };
}

function renderInlineHtml(parts: EmailInlinePart[]): string {
  return parts
    .map((part) =>
      part.kind === "emphasis"
        ? `<strong style="color:#F8F4FF;">${escapeHtml(part.value)}</strong>`
        : escapeHtml(part.value)
    )
    .join("");
}

function renderInlineText(parts: EmailInlinePart[]): string {
  return parts.map((part) => part.value).join("");
}

function renderBodyBlocks(blocks: EmailBodyBlock[]): {
  html: string;
  text: string;
} {
  const htmlChunks: string[] = [];
  const textChunks: string[] = [];

  for (const block of blocks) {
    switch (block.kind) {
      case "paragraph":
        htmlChunks.push(
          `<p style="margin:0 0 14px;">${renderInlineHtml(block.parts)}</p>`
        );
        textChunks.push(renderInlineText(block.parts));
        break;
      case "list":
        htmlChunks.push(
          `<ul style="margin:0 0 16px;padding-left:20px;color:#D8CCEB;font-size:15px;line-height:1.7;">${block.items
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul>`
        );
        textChunks.push(block.items.map((item) => `• ${item}`).join("\n"));
        break;
      case "quote":
        htmlChunks.push(
          `<blockquote style="margin:16px 0;padding:14px 16px;border-left:3px solid #6E46C7;background:#241833;border-radius:12px;color:#E8E0F4;font-size:14px;line-height:1.6;">${escapeHtml(block.text)}</blockquote>`
        );
        textChunks.push(`"${block.text}"`);
        break;
    }
  }

  return { html: htmlChunks.join(""), text: textChunks.join("\n\n") };
}

export function renderEmailTemplate(content: EmailTemplateContent): {
  html: string;
  text: string;
} {
  const body = renderBodyBlocks(content.bodyBlocks);
  const greeting = content.greeting
    ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#E8E0F4;">${escapeHtml(content.greeting)}</p>`
    : "";

  const ctaUrl = content.ctaUrl ?? "";
  const cta =
    content.ctaLabel && content.ctaUrl
      ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 8px;">
  <tr>
    <td align="center" bgcolor="#6E46C7" style="border-radius:999px;">
      <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:999px;">${escapeHtml(content.ctaLabel)}</a>
    </td>
  </tr>
</table>
<p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:#9B91AE;word-break:break-all;">${escapeHtml(ctaUrl)}</p>`
      : "";

  const footerNote = content.footerNote
    ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#9B91AE;">${escapeHtml(content.footerNote)}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${escapeHtml(content.title)}</title>
</head>
<body style="margin:0;padding:0;background:#120B18;font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#120B18;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#1A1224;border:1px solid #2E2440;border-radius:20px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 12px;text-align:center;background:linear-gradient(180deg,#241833 0%,#1A1224 100%);">
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#B8A6D9;">MoonVerse</p>
              <h1 style="margin:0;font-size:28px;line-height:1.25;color:#F8F4FF;font-weight:700;">${escapeHtml(content.title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 32px;font-family:Arial,Helvetica,sans-serif;">
              ${greeting}
              <div style="font-size:15px;line-height:1.7;color:#D8CCEB;">${body.html}</div>
              ${cta}
              ${footerNote}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#7D7390;text-align:center;">
                You are receiving this email because you have a MoonVerse account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textParts = [
    content.title,
    content.greeting ?? "",
    body.text,
    content.ctaLabel && content.ctaUrl
      ? `${content.ctaLabel}: ${content.ctaUrl}`
      : "",
    content.footerNote ?? "",
  ].filter(Boolean);

  return { html, text: textParts.join("\n\n") };
}
