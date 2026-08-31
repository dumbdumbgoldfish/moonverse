import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  moonieLoggedInEntryHref,
  moonieEntryHref,
  openMoonie,
  openMoonieDeskFresh,
  setMoonieEntrySignedIn,
  setMoonieWidgetMounted,
} from "./open-moonie";

const originalWindow = globalThis.window;

afterEach(() => {
  setMoonieWidgetMounted(false);
  setMoonieEntrySignedIn(false);
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

function installWindowDouble(pathname = "/browse") {
  const assigned: string[] = [];
  const events: Event[] = [];
  let search = "";
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      dispatchEvent(event: Event) {
        events.push(event);
        return true;
      },
      history: {
        pushState(_state: unknown, _title: string, href: string) {
          const queryIndex = href.indexOf("?");
          search = queryIndex >= 0 ? href.slice(queryIndex) : "";
        },
      },
      location: {
        pathname,
        search,
        assign(href: string) {
          assigned.push(href);
        },
      },
    },
  });
  return { assigned, events, getSearch: () => search };
}

describe("moonieLoggedInEntryHref", () => {
  it("opens a fresh desk and never implies the latest conversation", () => {
    assert.equal(moonieLoggedInEntryHref(), "/moonie?new=1");
    assert.equal(moonieLoggedInEntryHref("slow burn romance"), "/moonie?new=1");
  });
});

describe("moonieEntryHref", () => {
  it("ignores prompts for guest entry", () => {
    assert.equal(moonieEntryHref(), "/ask-moonie");
    assert.equal(
      moonieEntryHref("Recommend completed fantasy novels"),
      "/ask-moonie"
    );
  });
});

describe("openMoonie", () => {
  it("opens an empty widget chat when the widget is mounted", () => {
    const observed = installWindowDouble();
    setMoonieWidgetMounted(true);

    openMoonie("Recommend completed fantasy novels");

    assert.equal(observed.assigned.length, 0);
    assert.equal(observed.events.length, 1);
    assert.deepEqual(
      (observed.events[0] as CustomEvent<{ prompt?: string }>).detail,
      {}
    );
  });

  it("routes guests without a mounted widget to ask-moonie", () => {
    const observed = installWindowDouble();
    openMoonie("Recommend completed fantasy novels");
    assert.deepEqual(observed.assigned, ["/ask-moonie"]);
    assert.equal(observed.events.length, 0);
  });

  it("opens an empty widget chat when mounted", () => {
    const observed = installWindowDouble();
    setMoonieWidgetMounted(true);
    openMoonie();
    assert.equal(observed.events.length, 1);
    assert.equal(observed.assigned.length, 0);
    assert.deepEqual(
      (observed.events[0] as CustomEvent<{ prompt?: string }>).detail,
      {}
    );

    openMoonie("Recommend fantasy novels");
    assert.equal(observed.events.length, 2);
    assert.deepEqual(
      (observed.events[1] as CustomEvent<{ prompt?: string }>).detail,
      {}
    );
  });

  it("sends signed-in fallback navigation to an explicit new desk", () => {
    const observed = installWindowDouble();
    setMoonieEntrySignedIn(true);
    openMoonie();
    assert.deepEqual(observed.assigned, ["/moonie?new=1"]);
    assert.equal(observed.events.length, 0);
  });

  it("openMoonieDeskFresh rewrites an on-desk conversation URL to ?new=1", () => {
    const observed = installWindowDouble("/moonie");
    openMoonieDeskFresh("user-fixture");
    assert.equal(observed.assigned.length, 0);
    assert.equal(observed.getSearch(), "?new=1");
    assert.equal(
      observed.events.some((event) => event.type === "moonverse:desk-url"),
      true
    );
    assert.equal(
      observed.events.some((event) => event.type === "moonverse:desk-fresh"),
      true
    );
  });
});
