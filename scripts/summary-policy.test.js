import assert from "node:assert/strict";
import test from "node:test";
import { isOpenAiSummaryCandidate } from "./summary-policy.js";

test("uses OpenAI only for material new records", () => {
  assert.equal(isOpenAiSummaryCandidate({ source_type: "COMPANY_IR", risk_score: 10 }), true);
  assert.equal(isOpenAiSummaryCandidate({ category: "BCG_GROUP_WATCH", risk_score: 10 }), true);
  assert.equal(isOpenAiSummaryCandidate({ priority: "HIGH", risk_score: 10 }), true);
  assert.equal(isOpenAiSummaryCandidate({ risk_score: 80 }), true);
  assert.equal(isOpenAiSummaryCandidate({ category: "VIETNAM_ECONOMIC_NEWS", priority: "MEDIUM", risk_score: 70 }), false);
});

test("supports a configurable risk threshold", () => {
  assert.equal(isOpenAiSummaryCandidate({ risk_score: 70 }, 70), true);
  assert.equal(isOpenAiSummaryCandidate({ risk_score: 69 }, 70), false);
});
