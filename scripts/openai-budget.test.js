import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("scheduled collection is limited to one news batch and zero SNS OpenAI calls", () => {
  const workflow = fs.readFileSync(path.join(ROOT, ".github", "workflows", "update-news.yml"), "utf8");
  assert.match(workflow, /OPENAI_NEWS_BATCH_ITEMS:\s*"3"/);
  assert.match(workflow, /SNS_MAX_OPENAI_REQUESTS:\s*"0"/);

  const snsStepStart = workflow.indexOf("Collect YouTube and approved Facebook data without OpenAI");
  assert.notEqual(snsStepStart, -1);
  const snsStepEnd = workflow.indexOf("\n      - name:", snsStepStart + 1);
  const snsStep = workflow.slice(snsStepStart, snsStepEnd);
  assert.doesNotMatch(snsStep, /OPENAI_API_KEY/);

  const newsScript = fs.readFileSync(path.join(ROOT, "scripts", "fetch-news.js"), "utf8");
  assert.equal((newsScript.match(/openai\.responses\.create/g) || []).length, 1);
  assert.match(newsScript, /openaiRequestCount = openai && pendingItems\.length \? 1 : 0/);
});


