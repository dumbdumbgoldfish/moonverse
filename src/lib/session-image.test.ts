import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isInlineSessionImage,
  parseInlineImageDataUrl,
  resolveSessionImageUrl,
  userAvatarApiPath,
} from "./session-image";

describe("session image helpers", () => {
  it("detects inline image data URLs", () => {
    assert.equal(
      isInlineSessionImage("data:image/jpeg;base64,abcd"),
      true,
    );
    assert.equal(
      isInlineSessionImage("https://example.com/avatar.jpg"),
      false,
    );
  });

  it("maps any stored avatar to the avatar API path for JWT cookies", () => {
    const userId = "user_123";
    assert.equal(
      resolveSessionImageUrl("data:image/jpeg;base64,abcd", userId),
      userAvatarApiPath(userId),
    );
    assert.equal(
      resolveSessionImageUrl("https://cdn.example.com/a.jpg", userId),
      userAvatarApiPath(userId),
    );
  });

  it("returns local public asset paths without the avatar API", () => {
    const userId = "user_123";
    assert.equal(
      resolveSessionImageUrl("/demo/avatars/avatar-webtoon-01.png", userId),
      "/demo/avatars/avatar-webtoon-01.png",
    );
  });

  it("parses inline image data URLs into buffers", () => {
    const parsed = parseInlineImageDataUrl("data:image/png;base64,YWJj");
    assert.ok(parsed);
    assert.equal(parsed.mime, "image/png");
    assert.equal(parsed.buffer.toString("utf8"), "abc");
  });
});
