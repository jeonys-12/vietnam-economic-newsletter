import test from "node:test";
import assert from "node:assert/strict";
import { validateBcgLandMonitoring, validateNewsData } from "./output-validation.js";

function validItem(overrides = {}) {
  return {
    id: "item-1",
    source_id: "bcgland-ir-disclosure",
    source_type: "COMPANY_IR",
    title_original: "BCG Land disclosure",
    published_at: "2026-08-19T00:00:00.000Z",
    url: "https://bcgland.com.vn/disclosure.pdf",
    ...overrides
  };
}

function validData(items = [validItem()]) {
  return {
    updated_at: "2026-08-19T01:00:00.000Z",
    item_count: items.length,
    max_items: 100,
    items
  };
}

test("accepts a structurally valid news payload", () => {
  assert.deepEqual(validateNewsData(validData()), []);
});

test("rejects unsafe URLs, duplicate IDs, and inconsistent counts", () => {
  const items = [validItem({ url: "javascript:alert(1)" }), validItem()];
  const errors = validateNewsData({ ...validData(items), item_count: 1 });
  assert.ok(errors.some((error) => error.includes("item_count")));
  assert.ok(errors.some((error) => error.includes("not HTTP(S)")));
  assert.ok(errors.some((error) => error.includes("duplicated")));
});

test("requires BCG Land source discovery without requiring a new disclosure every month", () => {
  const noRecentItems = validData([]);
  const healthyLog = { logs: [{ source_id: "bcgland-ir-disclosure", links: 12, items: 0, errors: [] }] };
  assert.deepEqual(validateBcgLandMonitoring(noRecentItems, healthyLog), []);
});

test("detects a broken BCG Land source and loss after collection", () => {
  const noLinks = { logs: [{ source_id: "bcgland-ir-disclosure", links: 0, items: 0 }] };
  assert.ok(validateBcgLandMonitoring(validData([]), noLinks).some((error) => error.includes("no source links")));

  const lostItems = { logs: [{ source_id: "bcgland-ir-disclosure", links: 10, items: 2 }] };
  assert.ok(validateBcgLandMonitoring(validData([]), lostItems).some((error) => error.includes("none reached")));
});
