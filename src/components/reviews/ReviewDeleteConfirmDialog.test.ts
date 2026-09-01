import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REVIEW_DELETE_DIALOG_DESCRIPTION,
  REVIEW_DELETE_DIALOG_TITLE,
} from "@/components/reviews/ReviewDeleteConfirmDialog";

describe("ReviewDeleteConfirmDialog copy", () => {
  it("uses the expected title and body text", () => {
    assert.equal(REVIEW_DELETE_DIALOG_TITLE, "Delete review?");
    assert.equal(
      REVIEW_DELETE_DIALOG_DESCRIPTION,
      "This action cannot be undone. This review will be permanently removed."
    );
  });
});
