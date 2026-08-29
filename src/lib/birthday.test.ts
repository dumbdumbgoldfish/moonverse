import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ageFromIso,
  birthdayGateError,
  daysInMonth,
  isoFromParts,
} from "./birthday";

describe("birthday helpers", () => {
  it("counts days in leap Februaries", () => {
    assert.equal(daysInMonth(2000, 2), 29);
    assert.equal(daysInMonth(1999, 2), 28);
  });

  it("builds a valid ISO date", () => {
    assert.equal(isoFromParts({ year: "1999", month: "9", day: "17" }), "1999-09-17");
    assert.equal(isoFromParts({ year: "1999", month: "2", day: "31" }), null);
  });

  it("computes age and the 13+ gate", () => {
    const today = new Date("2026-08-17T00:00:00");
    assert.equal(ageFromIso("2013-08-17", today), 13);
    assert.equal(ageFromIso("2013-08-18", today), 12);
    assert.equal(
      birthdayGateError("2013-08-18", today),
      "You must be at least 13 to join MoonVerse."
    );
  });
});
