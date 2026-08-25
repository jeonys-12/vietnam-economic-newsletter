import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("automatic collection has zero OpenAI budget and manual runs can opt in once", () => {
  const workflow = fs.readFileSync(path.join(ROOT, ".github", "workflows", "update-news.yml"), "utf8");
  assert.match(workflow, /use_openai:[\s\S]*default:\s*false/);
  assert.match(workflow, /OPENAI_NEWS_BATCH_ITEMS:\s*\$\{\{ inputs\.use_openai && '1' \|\| '0' \}\}/);
  assert.match(workflow, /OPENAI_NEWS_MIN_RISK_SCORE:\s*"80"/);
  assert.match(workflow, /SOURCE_CONCURRENCY:\s*"3"/);
  assert.match(workflow, /SNS_MAX_OPENAI_REQUESTS:\s*"0"/);
  assert.match(workflow, /OPENAI_MODEL:\s*"gpt-4o-mini"/);

  const newsStepStart = workflow.indexOf("Collect, deduplicate, and summarize data");
  assert.notEqual(newsStepStart, -1);
  const newsStepEnd = workflow.indexOf("\n      - name:", newsStepStart + 1);
  const newsStep = workflow.slice(newsStepStart, newsStepEnd);
  assert.match(newsStep, /OPENAI_API_KEY:\s*\$\{\{ inputs\.use_openai && secrets\.OPENAI_API_KEY \|\| '' \}\}/);

  const snsStepStart = workflow.indexOf("Collect YouTube and approved Facebook data without OpenAI");
  assert.notEqual(snsStepStart, -1);
  const snsStepEnd = workflow.indexOf("\n      - name:", snsStepStart + 1);
  const snsStep = workflow.slice(snsStepStart, snsStepEnd);
  assert.doesNotMatch(snsStep, /OPENAI_API_KEY/);

  const newsScript = fs.readFileSync(path.join(ROOT, "scripts", "fetch-news.js"), "utf8");
  assert.equal((newsScript.match(/client\.responses\.create/g) || []).length, 1);
  assert.match(newsScript, /await import\("openai"\)/);
  assert.match(newsScript, /openaiRequestCount = OPENAI_API_KEY && pendingItems\.length \? 1 : 0/);
  assert.match(newsScript, /max_output_tokens:\s*500/);
  assert.match(newsScript, /store:\s*false/);
  assert.match(newsScript, /openai_total_tokens:/);
  assert.match(newsScript, /process\.env\.OPENAI_MODEL \|\| "gpt-4o-mini"/);
  assert.match(newsScript, /isOpenAiSummaryCandidate\(item, OPENAI_NEWS_MIN_RISK_SCORE\)/);
  assert.match(newsScript, /openai_skipped_low_value_count:/);
  assert.match(newsScript, /openai_deferred_count:/);
  assert.match(newsScript, /reused_article_page_count:/);
  assert.match(newsScript, /existingByUrl\.get/);
});

