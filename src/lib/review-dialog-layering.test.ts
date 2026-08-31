import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFile } from "node:fs/promises";

describe("nested dialog layering", () => {
  it("elevates folder and sign-in dialogs above the review overlay", async () => {
    const dialog = await readFile(
      new URL("../components/ui/dialog.tsx", import.meta.url),
      "utf8"
    );
    const folder = await readFile(
      new URL("../components/folders/FolderFormDialog.tsx", import.meta.url),
      "utf8"
    );
    assert.match(dialog, /NESTED_DIALOG_Z_CLASS = "z-\[100\]"/);
    assert.match(folder, /NESTED_DIALOG_Z_CLASS/);
    assert.match(folder, /overlayClassName={NESTED_DIALOG_Z_CLASS}/);
  });
});
