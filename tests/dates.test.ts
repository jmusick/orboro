import assert from "node:assert/strict";
import { test } from "node:test";
import { formatPageUpdatedAt } from "../src/lib/dates.ts";

const now = Date.UTC(2026, 8, 30);

test("page update dates preserve the recorded UTC day", () => {
  assert.equal(formatPageUpdatedAt(1786305397000, now), "August 9, 2026");
  assert.equal(formatPageUpdatedAt(Date.UTC(2026, 7, 9, 0, 1), now), "August 9, 2026");
});

test("bad timestamp units and implausible dates never reach the page", () => {
  for (const timestamp of [1786305397, 0, -1, NaN, Infinity, 1786305397000.5, Date.UTC(1999, 11, 31), now + 2 * 86_400_000]) {
    assert.equal(formatPageUpdatedAt(timestamp, now), null);
  }
});
