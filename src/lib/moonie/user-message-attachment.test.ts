import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildUserAttachmentDisplay,
  fileAttachmentExtension,
  mergeDictationIntoComposerText,
  toPersistedUserAttachment,
  userAttachmentFromPersisted,
} from "./user-message-attachment";

describe("moonie user message attachment", () => {
  it("builds image display metadata with preview url", () => {
    const display = buildUserAttachmentDisplay({
      attachmentType: "image",
      imagePreview: {
        previewUrl: "data:image/png;base64,abc",
        fileName: "cover.png",
        mimeType: "image/png",
      },
    });
    assert.equal(display?.type, "image");
    assert.equal(display?.imagePreviewUrl, "data:image/png;base64,abc");
  });

  it("builds file display metadata", () => {
    const display = buildUserAttachmentDisplay({
      attachmentType: "file",
      fileName: "novels.csv",
      fileMimeType: "text/csv",
    });
    assert.equal(display?.type, "file");
    assert.equal(display?.name, "novels.csv");
  });

  it("merges dictation into existing composer text", () => {
    assert.equal(
      mergeDictationIntoComposerText("Already here", "more words"),
      "Already here more words"
    );
    assert.equal(mergeDictationIntoComposerText("", "fresh dictation"), "fresh dictation");
    assert.equal(mergeDictationIntoComposerText("typed", ""), "typed");
    assert.equal(
      mergeDictationIntoComposerText("hello", "  world"),
      "hello world"
    );
    assert.equal(
      mergeDictationIntoComposerText("hello world", "again"),
      "hello world again"
    );
    assert.equal(
      mergeDictationIntoComposerText(
        mergeDictationIntoComposerText("", "first phrase"),
        "  second phrase"
      ),
      "first phrase second phrase"
    );
  });

  it("does not build voice attachment metadata from dictation", () => {
    const display = buildUserAttachmentDisplay({});
    assert.equal(display, undefined);
  });

  it("persists lightweight metadata without preview url", () => {
    const persisted = toPersistedUserAttachment({
      type: "image",
      name: "cover.png",
      mimeType: "image/png",
      imagePreviewUrl: "data:image/png;base64,abc",
    });
    assert.deepEqual(persisted, {
      type: "image",
      name: "cover.png",
      mimeType: "image/png",
    });
  });

  it("restores persisted attachment for resume", () => {
    const restored = userAttachmentFromPersisted({
      type: "file",
      name: "novels.csv",
      mimeType: "text/csv",
    });
    assert.equal(restored?.type, "file");
    assert.equal(restored?.name, "novels.csv");
    assert.equal(restored?.imagePreviewUrl, undefined);
  });

  it("formats file extension labels", () => {
    assert.equal(fileAttachmentExtension("novels.csv"), "CSV");
  });
});
