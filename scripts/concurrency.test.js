import assert from "node:assert/strict";
import test from "node:test";
import { mapWithConcurrency } from "./concurrency.js";

test("maps concurrently while preserving source order and respecting the limit", async () => {
  let active = 0;
  let peak = 0;
  const result = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return value * 2;
  });

  assert.deepEqual(result, [2, 4, 6, 8, 10]);
  assert.equal(peak, 2);
});

test("falls back to one worker for invalid limits", async () => {
  const result = await mapWithConcurrency([1, 2], 0, async (value) => value);
  assert.deepEqual(result, [1, 2]);
});
