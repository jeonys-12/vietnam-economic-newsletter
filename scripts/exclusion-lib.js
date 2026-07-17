import fs from "node:fs/promises";
import path from "node:path";

export const EMPTY_EXCLUSIONS = { schema_version: 1, updated_at: null, rules: [] };

export function normalizeRuleValue(value = "") {
  return String(value).normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
}

export function canonicalUrl(rawUrl = "") {
  try {
    const url = new URL(rawUrl);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "si"].forEach((key) => url.searchParams.delete(key));
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return normalizeRuleValue(rawUrl);
  }
}

export function youtubeVideoId(item = {}) {
  if (String(item.id || "").startsWith("youtube:")) return String(item.id).slice(8);
  try {
    const url = new URL(item.url || "");
    if (url.hostname.includes("youtu.be")) return url.pathname.split("/").filter(Boolean)[0] || "";
    return url.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

export function normalizeRules(rules = []) {
  const allowed = new Set(["article_url", "youtube_video", "source", "youtube_channel", "keyword"]);
  const unique = new Map();
  for (const rule of Array.isArray(rules) ? rules : []) {
    const type = normalizeRuleValue(rule?.type).toLowerCase();
    let value = normalizeRuleValue(rule?.value);
    if (!allowed.has(type) || !value) continue;
    if (type === "article_url") value = canonicalUrl(value);
    const key = `${type}:${value.toLocaleLowerCase("en-US")}`;
    unique.set(key, { ...rule, type, value, id: rule.id || key });
  }
  return [...unique.values()];
}

export async function loadExclusions(file = path.resolve("data/exclusions.json")) {
  try {
    const parsed = JSON.parse(await fs.readFile(file, "utf8"));
    return { ...EMPTY_EXCLUSIONS, ...parsed, rules: normalizeRules(parsed.rules) };
  } catch {
    return EMPTY_EXCLUSIONS;
  }
}

export function matchesExclusion(item = {}, exclusions = EMPTY_EXCLUSIONS) {
  const url = canonicalUrl(item.url || "").toLocaleLowerCase("en-US");
  const videoId = youtubeVideoId(item).toLocaleLowerCase("en-US");
  const source = normalizeRuleValue(item.source_name || item.author || "").toLocaleLowerCase("en-US");
  const channel = normalizeRuleValue(item.author || item.source_name || "").toLocaleLowerCase("en-US");
  const text = normalizeRuleValue(`${item.title_original || item.title || ""} ${item.summary_ko || item.summary || item.source_excerpt || ""} ${source}`).toLocaleLowerCase("en-US");

  return normalizeRules(exclusions.rules).find((rule) => {
    const value = rule.value.toLocaleLowerCase("en-US");
    if (rule.type === "article_url") return url === canonicalUrl(rule.value).toLocaleLowerCase("en-US");
    if (rule.type === "youtube_video") return Boolean(videoId) && videoId === value;
    if (rule.type === "source") return source === value;
    if (rule.type === "youtube_channel") return channel === value;
    if (rule.type === "keyword") return text.includes(value);
    return false;
  }) || null;
}
