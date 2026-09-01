import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  applyResetPasswordSuccess,
  buildResetPasswordLoginRedirect,
} from "@/lib/reset-password-success";

describe("buildResetPasswordLoginRedirect", () => {
  it("redirects to login with reset=1 and encoded email when email is available", () => {
    assert.equal(
      buildResetPasswordLoginRedirect("Reader@Example.com"),
      "/login?reset=1&email=reader%40example.com"
    );
  });

  it("redirects to login with reset=1 when email is unavailable", () => {
    assert.equal(buildResetPasswordLoginRedirect(), "/login?reset=1");
    assert.equal(buildResetPasswordLoginRedirect(""), "/login?reset=1");
  });
});

describe("applyResetPasswordSuccess", () => {
  it("does not sign in; remembers email, closes panel, and navigates to login", () => {
    let remembered: string | null = null;
    let panelClosed = false;
    let navigatedTo: string | null = null;

    applyResetPasswordSuccess("reader@example.com", {
      rememberEmail: (email) => {
        remembered = email;
      },
      closePanel: () => {
        panelClosed = true;
      },
      navigate: (path) => {
        navigatedTo = path;
      },
    });

    assert.equal(remembered, "reader@example.com");
    assert.equal(panelClosed, true);
    assert.equal(
      navigatedTo,
      "/login?reset=1&email=reader%40example.com"
    );
  });

  it("navigates without email param when response omits email", () => {
    let navigatedTo: string | null = null;
    let remembered = false;

    applyResetPasswordSuccess(undefined, {
      rememberEmail: () => {
        remembered = true;
      },
      closePanel: () => {},
      navigate: (path) => {
        navigatedTo = path;
      },
    });

    assert.equal(remembered, false);
    assert.equal(navigatedTo, "/login?reset=1");
  });
});

describe("ResetPasswordForm", () => {
  it("does not auto-login via credentials signIn after a successful reset", () => {
    const formPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../components/auth/ResetPasswordForm.tsx"
    );
    const source = readFileSync(formPath, "utf8");

    assert.doesNotMatch(source, /from "next-auth\/react"/);
    assert.doesNotMatch(source, /\bsignIn\s*\(/);
    assert.match(source, /applyResetPasswordSuccess/);
  });
});
