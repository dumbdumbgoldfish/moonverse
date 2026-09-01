import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildGuestLoginHref,
  buildGuestRegisterHref,
  buildLoginRedirectUrl,
} from "@/lib/auth-login-redirect";

describe("buildLoginRedirectUrl", () => {
  it("preserves the request origin when AUTH_URL points at another port", () => {
    const loginUrl = buildLoginRedirectUrl(
      "http://localhost:3001/discover?q=test",
      "/reviews/new"
    );
    assert.equal(loginUrl.origin, "http://localhost:3001");
    assert.equal(loginUrl.pathname, "/login");
    assert.equal(loginUrl.searchParams.get("callbackUrl"), "/reviews/new");
    assert.equal(
      loginUrl.href,
      "http://localhost:3001/login?callbackUrl=%2Freviews%2Fnew"
    );
  });

  it("preserves folder callback paths on the current host", () => {
    const loginUrl = buildLoginRedirectUrl(
      "http://localhost:3001/folders/abc123",
      "/folders/abc123"
    );
    assert.equal(loginUrl.origin, "http://localhost:3001");
    assert.equal(
      loginUrl.href,
      "http://localhost:3001/login?callbackUrl=%2Ffolders%2Fabc123"
    );
  });

  it("uses the configured production origin from the incoming request URL", () => {
    const loginUrl = buildLoginRedirectUrl(
      "https://moonverse.example.com/home",
      "/folders"
    );
    assert.equal(loginUrl.origin, "https://moonverse.example.com");
    assert.equal(
      loginUrl.href,
      "https://moonverse.example.com/login?callbackUrl=%2Ffolders"
    );
  });
});

describe("buildGuestLoginHref", () => {
  it("builds a relative login href that preserves the shelves destination", () => {
    assert.equal(
      buildGuestLoginHref("/lists"),
      "/login?callbackUrl=%2Flists"
    );
  });
});

describe("buildGuestRegisterHref", () => {
  it("builds a relative sign-up href for browsing shelves", () => {
    assert.equal(
      buildGuestRegisterHref("/lists"),
      "/register?callbackUrl=%2Flists"
    );
  });

  it("builds a relative sign-up href for starting a shelf", () => {
    assert.equal(
      buildGuestRegisterHref("/folders"),
      "/register?callbackUrl=%2Ffolders"
    );
  });

  it("preserves an individual folder id in the callback", () => {
    assert.equal(
      buildGuestRegisterHref("/folders/abc123"),
      "/register?callbackUrl=%2Ffolders%2Fabc123"
    );
  });
});
