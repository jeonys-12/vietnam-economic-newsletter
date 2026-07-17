import fs from "node:fs/promises";
import path from "node:path";
import { EMPTY_EXCLUSIONS, normalizeRules } from "./exclusion-lib.js";

const OUTPUT = path.resolve("data/exclusions.json");
const MANUAL = path.resolve("data/exclusions.manual.json");
const repository = process.env.GITHUB_REPOSITORY || "";
const token = process.env.GITHUB_TOKEN || "";
const ISSUE_PREFIX = "[모니터링 제외]";

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; }
}

function parseIssueRule(issue) {
  if (!String(issue.title || "").startsWith(ISSUE_PREFIX) || issue.pull_request) return null;
  if (!["OWNER", "MEMBER", "COLLABORATOR"].includes(String(issue.author_association || "").toUpperCase())) return null;
  const body = String(issue.body || "");
  const marked = body.match(/<!--\s*monitor-exclusion:v1\s*-->[\s\S]*?```json\s*([\s\S]*?)```/i);
  if (!marked) return null;
  try {
    const parsed = JSON.parse(marked[1]);
    return {
      type: parsed.type,
      value: parsed.value,
      title: parsed.title || issue.title.slice(ISSUE_PREFIX.length).trim(),
      issue_number: issue.number,
      issue_url: issue.html_url,
      created_at: issue.created_at,
      source: "github_issue"
    };
  } catch {
    return null;
  }
}

async function fetchOpenIssues() {
  if (!repository || !token) return null;
  const collected = [];
  for (let page = 1; page <= 5; page += 1) {
    const response = await fetch(`https://api.github.com/repos/${repository}/issues?state=open&per_page=100&page=${page}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "vietnam-newsletter-exclusion-sync"
      }
    });
    if (!response.ok) throw new Error(`GitHub Issues ${response.status}: ${await response.text()}`);
    const pageItems = await response.json();
    collected.push(...pageItems);
    if (pageItems.length < 100) break;
  }
  return collected;
}

async function main() {
  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  const manual = await readJson(MANUAL, EMPTY_EXCLUSIONS);
  const previous = await readJson(OUTPUT, EMPTY_EXCLUSIONS);
  let issues = null;
  try {
    issues = await fetchOpenIssues();
  } catch (error) {
    console.warn(`Exclusion Issue sync failed; previous Issue rules retained: ${error.message}`);
  }
  const issueRules = issues === null
    ? (previous.rules || []).filter((rule) => rule.source === "github_issue")
    : issues.map(parseIssueRule).filter(Boolean);
  const rules = normalizeRules([...(manual.rules || []), ...issueRules]);
  const payload = {
    schema_version: 1,
    updated_at: new Date().toISOString(),
    repository: repository || null,
    manual_count: normalizeRules(manual.rules).length,
    github_issue_count: issueRules.length,
    rules
  };
  await fs.writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Exclusions synchronized: ${rules.length} rules (${issueRules.length} open GitHub Issues)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
