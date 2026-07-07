import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import OpenAI from "openai";
import { SOURCES, GENERAL_KEYWORDS, BCG_KEYWORDS, RISK_KEYWORDS } from "./sources.js";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "news.json");
const LOG_FILE = path.join(DATA_DIR, "fetch-log.json");
const LOOKBACK_HOURS = Number(process.env.LOOKBACK_HOURS || 48);
const MAX_ITEMS_TO_SUMMARIZE = Number(process.env.MAX_ITEMS_TO_SUMMARIZE || 80);
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.5";
const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 15000);
const USER_AGENT = "Mozilla/5.0 (compatible; HanwhaVietnamNewsletterBot/1.0; +https://github.com/)";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function nowKstIso() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().replace("Z", "+09:00");
}

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}

function stripVietnameseAccents(text = "") {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

function normalizeText(text = "") {
  return stripVietnameseAccents(text)
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9가-힣\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(text = "") {
  return text.replace(/\s+/g, " ").replace(/&nbsp;/g, " ").trim();
}

function canonicalUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach((p) => u.searchParams.delete(p));
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return rawUrl;
  }
}

function containsAny(text, keywords) {
  const n = normalizeText(text);
  return keywords.some((k) => n.includes(normalizeText(k)));
}

function extractTags(text, keywords) {
  const n = normalizeText(text);
  return keywords.filter((k) => n.includes(normalizeText(k))).slice(0, 12);
}

function titleSimilarity(a, b) {
  const ta = new Set(normalizeText(a).split(" ").filter((x) => x.length > 2));
  const tb = new Set(normalizeText(b).split(" ").filter((x) => x.length > 2));
  if (!ta.size || !tb.size) return 0;
  const inter = [...ta].filter((x) => tb.has(x)).length;
  const union = new Set([...ta, ...tb]).size;
  return inter / union;
}

function classifyPriority(riskScore, credibilityScore, companyTags) {
  if (riskScore >= 90 && credibilityScore >= 90) return "CRITICAL";
  if (riskScore >= 80 || (companyTags.length && credibilityScore >= 90)) return "HIGH";
  if (riskScore >= 60 || credibilityScore >= 90) return "MEDIUM";
  return "LOW";
}

function getRiskScore(text, source) {
  const riskTags = extractTags(text, RISK_KEYWORDS);
  let score = riskTags.length ? 70 : 30;
  const n = normalizeText(text);
  if (/trading suspension|suspended|đình chỉ|tạm ngừng|delisting|hủy niêm yết|investigation|khởi tố|điều tra|bankruptcy|phá sản/.test(n)) score = 100;
  else if (/late financial|chậm công bố|qualified opinion|adverse opinion|disclaimer opinion|interest payment delay|bond coupon/.test(n)) score = 90;
  else if (/board resignation|resignation|asset disposal|collateral|pledge|mortgage|debt restructuring|tái cơ cấu/.test(n)) score = 80;
  if (source.category === "BCG_GROUP_WATCH" && extractTags(text, BCG_KEYWORDS).length) score = Math.max(score, 70);
  return { riskScore: score, riskTags };
}

function hanwhaImpact(text, companyTags, riskTags) {
  if (!companyTags.length) return "일반 베트남 경제·정책 모니터링 대상";
  const joined = normalizeText([...riskTags, text].join(" "));
  if (/suspension|suspended|đình chỉ|tạm ngừng|bond|trái phiếu|investigation|khởi tố|điều tra|late financial|chậm công bố|resignation|asset disposal|collateral|pledge|receivables/.test(joined)) {
    return "BCG 그룹 유동성, 공시 신뢰도 또는 채권회수 가능성에 영향 가능성이 있어 우선 확인 필요";
  }
  return "BCG 그룹 관련 일반 동향으로 회수 리스크와의 직접 관련성은 추가 확인 필요";
}

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ updated_at: nowKstIso(), items: [] }, null, 2));
  }
}

async function loadExisting() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function resolveUrl(href, baseUrl) {
  try { return new URL(href, baseUrl).toString(); } catch { return null; }
}

function shouldKeepLink(title, url, source) {
  const joined = `${title} ${url}`;
  if (!title || cleanText(title).length < 8) return false;
  if (/login|sign in|register|javascript:|mailto:|tel:|facebook|twitter|linkedin|youtube|zalo/i.test(url)) return false;
  if (/\.(jpg|jpeg|png|gif|webp|svg|css|js|ico|zip|rar)$/i.test(url)) return false;

  if (source.keywordMode === "bcg_or_all_ir") {
    return containsAny(joined, [...BCG_KEYWORDS, "disclosure", "financial", "annual", "report", "bond", "investor", "công bố", "báo cáo", "trái phiếu"]);
  }
  if (source.keywordMode === "general_or_bcg") {
    return containsAny(joined, [...GENERAL_KEYWORDS, ...BCG_KEYWORDS]);
  }
  return containsAny(joined, GENERAL_KEYWORDS);
}

async function collectLinks(source) {
  const links = [];
  const errors = [];
  for (const startUrl of source.startUrls) {
    try {
      const html = await fetchText(startUrl);
      const $ = cheerio.load(html);
      $("a").each((_, a) => {
        const title = cleanText($(a).text());
        const href = $(a).attr("href");
        const url = href ? canonicalUrl(resolveUrl(href, startUrl)) : null;
        if (!url || !url.startsWith("http")) return;
        if (shouldKeepLink(title, url, source)) {
          links.push({ title, url, sourceId: source.id });
        }
      });
    } catch (err) {
      errors.push({ source: source.id, url: startUrl, error: err.message });
    }
  }
  const dedup = new Map();
  for (const l of links) {
    if (!dedup.has(l.url)) dedup.set(l.url, l);
  }
  return { links: [...dedup.values()].slice(0, source.maxLinks || 20), errors };
}

function parseDateFromHtml($, text = "") {
  const metaSelectors = [
    'meta[property="article:published_time"]', 'meta[name="pubdate"]', 'meta[name="publishdate"]',
    'meta[name="date"]', 'meta[itemprop="datePublished"]', 'time[datetime]'
  ];
  for (const sel of metaSelectors) {
    const val = sel.startsWith("time") ? $(sel).first().attr("datetime") : $(sel).first().attr("content");
    if (val) {
      const d = new Date(val);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }
  const patterns = [
    /(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/,
    /(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})/,
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(20\d{2})/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      let d;
      if (p === patterns[0]) d = new Date(`${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}T00:00:00Z`);
      else if (p === patterns[1]) d = new Date(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}T00:00:00Z`);
      else d = new Date(`${m[2]} ${m[1]}, ${m[3]} 00:00:00 UTC`);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }
  return null;
}

async function readArticle(link, source) {
  const html = await fetchText(link.url);
  const $ = cheerio.load(html);
  const metaTitle = cleanText($("meta[property='og:title']").attr("content") || $("title").text() || link.title);
  const metaDesc = cleanText($("meta[name='description']").attr("content") || $("meta[property='og:description']").attr("content") || "");
  let content = "";
  try {
    const dom = new JSDOM(html, { url: link.url });
    const article = new Readability(dom.window.document).parse();
    content = cleanText(article?.textContent || "");
  } catch {
    content = cleanText($("body").text());
  }
  const title = metaTitle || link.title;
  const bodyText = content.slice(0, 5000);
  const publishedAt = parseDateFromHtml($, `${title} ${bodyText}`);
  const companyTags = extractTags(`${title} ${bodyText}`, BCG_KEYWORDS);
  const { riskScore, riskTags } = getRiskScore(`${title} ${bodyText}`, source);
  const id = `${source.id}-${sha256(canonicalUrl(link.url) + normalizeText(title))}`;

  return {
    id,
    category: source.category,
    source_type: source.sourceType,
    source_name: source.name,
    source_id: source.id,
    title_original: title,
    title_ko: "",
    summary_ko: "",
    impact_ko: hanwhaImpact(`${title} ${bodyText}`, companyTags, riskTags),
    url: canonicalUrl(link.url),
    published_at: publishedAt,
    collected_at: nowKstIso(),
    credibility_score: source.reliability,
    risk_score: riskScore,
    priority: classifyPriority(riskScore, source.reliability, companyTags),
    company_tags: companyTags,
    risk_tags: riskTags,
    verified_by_official_source: ["GOVERNMENT", "REGULATOR", "STOCK_EXCHANGE", "COMPANY_IR"].includes(source.sourceType),
    source_excerpt: cleanText(`${metaDesc} ${bodyText}`).slice(0, 1000)
  };
}

function fallbackSummary(item) {
  const short = item.source_excerpt ? `${item.source_excerpt.slice(0, 220)}${item.source_excerpt.length > 220 ? "…" : ""}` : item.title_original;
  return {
    ...item,
    title_ko: item.title_original,
    summary_ko: short,
    summary_method: "fallback_keyword"
  };
}

async function summarizeItem(item) {
  if (!openai) return fallbackSummary(item);
  const input = `
You are preparing a Korean business-risk newsletter for Hanwha Corporation.
Summarize ONLY the facts present in the source text. Do not speculate.
Return strict JSON with keys: title_ko, summary_ko, impact_ko.
- title_ko: Korean title within 80 Korean characters.
- summary_ko: 2 concise Korean bullet-style sentences, no markdown.
- impact_ko: one sentence on relevance to Vietnam economy or BCG/Hanwha recovery risk. If unclear, say 추가 확인 필요.

Source name: ${item.source_name}
Category: ${item.category}
Original title: ${item.title_original}
Company tags: ${item.company_tags.join(", ")}
Risk tags: ${item.risk_tags.join(", ")}
Source excerpt:
${item.source_excerpt}
`;
  try {
    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      input,
      text: { format: { type: "json_object" } }
    });
    const parsed = JSON.parse(response.output_text);
    return {
      ...item,
      title_ko: parsed.title_ko || item.title_original,
      summary_ko: parsed.summary_ko || item.source_excerpt.slice(0, 240),
      impact_ko: parsed.impact_ko || item.impact_ko,
      summary_method: `openai:${OPENAI_MODEL}`
    };
  } catch (err) {
    return { ...fallbackSummary(item), summary_error: err.message };
  }
}

function isRecentEnough(item) {
  if (!item.published_at) return true;
  const cutoff = Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000;
  return new Date(item.published_at).getTime() >= cutoff;
}

function dedupeItems(items) {
  const kept = [];
  const urlMap = new Map();
  for (const item of items) {
    const urlKey = canonicalUrl(item.url || "");
    if (urlKey && urlMap.has(urlKey)) {
      const idx = urlMap.get(urlKey);
      if (item.credibility_score > kept[idx].credibility_score || item.risk_score > kept[idx].risk_score) kept[idx] = item;
      continue;
    }
    let similarIdx = -1;
    for (let i = 0; i < kept.length; i++) {
      if (titleSimilarity(item.title_original, kept[i].title_original) > 0.88) {
        similarIdx = i; break;
      }
    }
    if (similarIdx >= 0) {
      if (item.credibility_score + item.risk_score > kept[similarIdx].credibility_score + kept[similarIdx].risk_score) kept[similarIdx] = item;
    } else {
      urlMap.set(urlKey, kept.length);
      kept.push(item);
    }
  }
  return kept;
}

function sortItems(items) {
  const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  return items.sort((a, b) => {
    const p = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    if (p) return p;
    const s = (b.credibility_score + b.risk_score) - (a.credibility_score + a.risk_score);
    if (s) return s;
    return new Date(b.published_at || b.collected_at).getTime() - new Date(a.published_at || a.collected_at).getTime();
  });
}

async function main() {
  const logs = [];
  const existing = await loadExisting();
  const newItems = [];

  for (const source of SOURCES) {
    const sourceLog = { source_id: source.id, source_name: source.name, started_at: nowKstIso(), links: 0, items: 0, errors: [] };
    try {
      const { links, errors } = await collectLinks(source);
      sourceLog.links = links.length;
      sourceLog.errors.push(...errors);
      for (const link of links) {
        try {
          const item = await readArticle(link, source);
          if (isRecentEnough(item)) {
            newItems.push(item);
            sourceLog.items += 1;
          }
        } catch (err) {
          sourceLog.errors.push({ url: link.url, error: err.message });
        }
      }
    } catch (err) {
      sourceLog.errors.push({ error: err.message });
    }
    sourceLog.finished_at = nowKstIso();
    logs.push(sourceLog);
    console.log(`[${source.id}] links=${sourceLog.links} items=${sourceLog.items} errors=${sourceLog.errors.length}`);
  }

  const merged = dedupeItems([...newItems, ...existing]);
  const selected = sortItems(merged).slice(0, 300);
  const summarized = [];
  for (const item of selected) {
    const needsSummary = !item.summary_ko || item.summary_method === "fallback_keyword";
    if (needsSummary && summarized.length < MAX_ITEMS_TO_SUMMARIZE) {
      summarized.push(await summarizeItem(item));
    } else {
      summarized.push(item.summary_ko ? item : fallbackSummary(item));
    }
  }

  const payload = {
    updated_at: nowKstIso(),
    timezone: "Asia/Seoul",
    lookback_hours: LOOKBACK_HOURS,
    openai_summary_enabled: Boolean(openai),
    item_count: summarized.length,
    items: sortItems(summarized)
  };
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2));
  await fs.writeFile(LOG_FILE, JSON.stringify({ updated_at: nowKstIso(), logs }, null, 2));
  console.log(`Saved ${summarized.length} items to ${DATA_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
