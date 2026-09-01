import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { buildResetPasswordTemplate } from "./templates/auth";
import { appBaseUrl } from "./app-url";

const ENV_KEYS = [
  "NODE_ENV",
  "AUTH_URL",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "VERCEL_URL",
] as const;

function snapshotEnv(): Record<string, string | undefined> {
  return Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
}

function setNodeEnv(value: string) {
  (process.env as { NODE_ENV?: string }).NODE_ENV = value;
}

function restoreEnv(snapshot: Record<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    const value = snapshot[key];
    if (key === "NODE_ENV") {
      if (value !== undefined) setNodeEnv(value);
      continue;
    }
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("appBaseUrl", () => {
  const envSnapshot = snapshotEnv();

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  it("prefers the request origin on a non-default local port in development", async () => {
    setNodeEnv("development");
    process.env.AUTH_URL = "http://localhost:3000";
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;

    const origin = await appBaseUrl({
      requestUrl: "http://localhost:3003/api/auth/forgot-password",
    });
    assert.equal(origin, "http://localhost:3003");
    assert.notEqual(origin, "http://localhost:3000");
  });

  it("prefers 127.0.0.1 request origin over stale localhost AUTH_URL in development", async () => {
    setNodeEnv("development");
    process.env.AUTH_URL = "http://localhost:3000";
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;

    const origin = await appBaseUrl({
      requestUrl: "http://127.0.0.1:3012/api/auth/forgot-password",
    });
    assert.equal(origin, "http://127.0.0.1:3012");
    assert.doesNotMatch(origin, /localhost:3000/);
  });

  it("prefers localhost:3007 request origin over stale localhost:3000 AUTH_URL", async () => {
    setNodeEnv("development");
    process.env.AUTH_URL = "http://localhost:3000";
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;

    const origin = await appBaseUrl({
      requestUrl: "http://localhost:3007/api/auth/forgot-password",
    });
    assert.equal(origin, "http://localhost:3007");
    assert.doesNotMatch(origin, /localhost:3000/);
  });

  it("prefers request origin in prod-verify when AUTH_URL is stale localhost", async () => {
    setNodeEnv("production");
    process.env.AUTH_URL = "http://localhost:3000";
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.VERCEL_URL;

    const origin = await appBaseUrl({
      requestUrl: "http://127.0.0.1:3012/api/auth/forgot-password",
    });
    assert.equal(origin, "http://127.0.0.1:3012");
    assert.doesNotMatch(origin, /localhost:3000/);
  });

  it("keeps configured production canonical origin over request origin", async () => {
    setNodeEnv("production");
    process.env.AUTH_URL = "https://moonverse.example.com";
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.VERCEL_URL;

    const origin = await appBaseUrl({
      requestUrl: "http://localhost:3003/api/auth/forgot-password",
    });
    assert.equal(origin, "https://moonverse.example.com");
  });
});

describe("buildResetPasswordTemplate", () => {
  const envSnapshot = snapshotEnv();

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  it("preserves reset path and token query on the resolved origin", async () => {
    setNodeEnv("development");
    process.env.AUTH_URL = "http://localhost:3000";
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;

    const template = await buildResetPasswordTemplate({
      displayName: "Reader",
      token: "reset-token-abc",
      requestUrl: "http://localhost:3003/forgot-password",
    });

    assert.match(
      template.text,
      /http:\/\/localhost:3003\/reset-password\?token=reset-token-abc/
    );
    assert.doesNotMatch(template.text, /localhost:3000/);
  });

  it("uses prod-verify request port when NODE_ENV is production and AUTH_URL is stale", async () => {
    setNodeEnv("production");
    process.env.AUTH_URL = "http://localhost:3000";
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXTAUTH_URL;
    delete process.env.VERCEL_URL;

    const template = await buildResetPasswordTemplate({
      displayName: "Reader",
      token: "reset-token-abc",
      requestUrl: "http://127.0.0.1:3012/api/auth/forgot-password",
    });

    assert.match(
      template.text,
      /http:\/\/127\.0\.0\.1:3012\/reset-password\?token=reset-token-abc/
    );
    assert.doesNotMatch(template.text, /localhost:3000/);
  });
});
