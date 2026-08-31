import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HomeShelvesFetchError,
  fetchHomeForYouShelves,
  resolveForYouShelvesLoadState,
} from "./home-for-you-shelves-fetch";

describe("resolveForYouShelvesLoadState", () => {
  it("distinguishes loading, error, empty, and success", () => {
    assert.equal(
      resolveForYouShelvesLoadState({
        loading: true,
        error: false,
        shelves: null,
      }),
      "loading"
    );
    assert.equal(
      resolveForYouShelvesLoadState({
        loading: false,
        error: true,
        shelves: null,
      }),
      "error"
    );
    assert.equal(
      resolveForYouShelvesLoadState({
        loading: false,
        error: false,
        shelves: [],
      }),
      "empty"
    );
    assert.equal(
      resolveForYouShelvesLoadState({
        loading: false,
        error: false,
        shelves: [{ id: "trending", reviews: [{ novelId: "novel-1" }] } as never],
      }),
      "success"
    );
  });

  it("does not treat a failed load as an empty shelf", () => {
    assert.notEqual(
      resolveForYouShelvesLoadState({
        loading: false,
        error: true,
        shelves: [],
      }),
      "empty"
    );
  });
});

describe("fetchHomeForYouShelves", () => {
  it("returns shelves on a successful JSON array response", async () => {
    const shelves = [
      {
        id: "latest",
        title: "Latest",
        subtitle: "Fresh",
        iconName: "clock",
        accentClass: "text-[#6E46C7]",
        reviews: [],
      },
    ];

    const payload = await fetchHomeForYouShelves(async () => ({
      ok: true,
      json: async () => shelves,
    } as Response));

    assert.deepEqual(payload, shelves);
  });

  it("throws HomeShelvesFetchError when the API responds with an error status", async () => {
    await assert.rejects(
      () =>
        fetchHomeForYouShelves(async () => ({
          ok: false,
          status: 503,
          json: async () => ({ error: "shelf_load_failed" }),
        } as Response)),
      (error: unknown) => {
        assert.ok(error instanceof HomeShelvesFetchError);
        assert.equal(error.status, 503);
        return true;
      }
    );
  });

  it("throws when the API returns a non-array payload", async () => {
    await assert.rejects(
      () =>
        fetchHomeForYouShelves(async () => ({
          ok: true,
          json: async () => ({ error: "shelf_load_failed" }),
        } as Response)),
      (error: unknown) => {
        assert.ok(error instanceof HomeShelvesFetchError);
        assert.equal(error.status, 502);
        return true;
      }
    );
  });

  it("surfaces network failures from fetch without coercing to empty shelves", async () => {
    await assert.rejects(
      () =>
        fetchHomeForYouShelves(async () => {
          throw new TypeError("Failed to fetch");
        }),
      (error: unknown) => {
        assert.ok(error instanceof TypeError);
        return true;
      }
    );
  });
});
