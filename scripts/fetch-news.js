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
const DASHBOARD_MAX_ITEMS = Number(process.env.DASHBOARD_MAX_ITEMS || 100);
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.5";
const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 15000);
const USER_AGENT = "Mozilla/5.0 (compatible; HanwhaVietnamNewsletterBot/1.0; +https://github.com/)";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const NAM_A_PROMOTION_KEYWORDS = [
  "discount", "discounts", "promotion", "promotions", "promotional", "promo",
  "offer", "offers", "preferential", "incentive", "voucher", "coupon",
  "cashback", "immediate discount", "cardholder", "credit card", "debit card",
  "international credit card", "jcb", "visa", "mastercard", "napas",
  "restaurant", "restaurants", "dining", "food", "hotel", "hotels", "resort",
  "travel", "tourism", "shopping", "cellphone", "cellphones", "cellphone s",
  "golden gate", "costamigo", "phan thiet",
  "ưu đãi", "khuyến mãi", "khuyến mại", "giảm giá", "hoàn tiền", "voucher",
  "mã giảm giá", "chủ thẻ", "thẻ tín dụng", "thẻ quốc tế", "thẻ jcb",
  "thẻ visa", "thẻ mastercard", "nhà hàng", "khách sạn", "ẩm thực",
  "mua sắm", "du lịch", "nghỉ dưỡng", "quà tặng", "cellphones", "golden gate",
  "costamigo", "phan thiết"
];

const NAM_A_PROMOTION_MERCHANT_KEYWORDS = [
  "cellphone s", "cellphones", "golden gate", "costamigo", "phan thiet", "phan thiết",
  "restaurant", "restaurants", "hotel", "hotels", "food", "dining", "shopping"
];

const NAM_A_PROMOTION_KEEP_KEYWORDS = [
  "financial statement", "audited financial", "annual report", "semi annual report",
  "quarterly report", "profit", "loss", "revenue", "earnings", "bad debt", "npl",
  "capital adequacy", "charter capital", "capital increase", "liquidity", "asset quality",
  "bond", "bonds", "principal repayment", "interest payment", "debt restructuring",
  "rating", "credit rating", "shareholder", "shareholders", "board of directors",
  "director", "resignation", "appointment", "governance", "audit", "disclosure",
  "violation", "sanction", "warning", "trading suspension", "special monitoring",
  "state bank", "sbv", "state securities", "ssc", "hose", "hnx", "upcom",
  "báo cáo tài chính", "báo cáo kiểm toán", "lợi nhuận", "doanh thu", "nợ xấu",
  "tăng vốn", "thanh khoản", "trái phiếu", "trả gốc", "trả lãi", "tái cơ cấu nợ",
  "xếp hạng tín nhiệm", "cổ đông", "hội đồng quản trị", "bổ nhiệm", "từ nhiệm",
  "công bố thông tin", "vi phạm", "xử phạt", "ngân hàng nhà nước", "ủy ban chứng khoán"
];

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
function isNamABankSource(source = {}) {
  return /nam\s*a\s*bank|namabank/i.test(`${source.id || ""} ${source.name || ""} ${source.source_id || ""} ${source.source_name || ""}`);
}

function hasNamABankMention(text = "", source = {}) {
  const n = normalizeText(text);
  return isNamABankSource(source) || /\bnam\s*a\s*bank\b|\bnamabank\b|ngan hang nam a/.test(n);
}

function getNamABankPromotionExclusionReason(text = "", source = {}) {
  if (!hasNamABankMention(text, source)) return "";
  const n = normalizeText(text);
  const hasPromotionSignal = NAM_A_PROMOTION_KEYWORDS.some((k) => n.includes(normalizeText(k)))
    || NAM_A_PROMOTION_MERCHANT_KEYWORDS.some((k) => n.includes(normalizeText(k)));
  if (!hasPromotionSignal) return "";

  const hasMaterialRiskSignal = NAM_A_PROMOTION_KEEP_KEYWORDS.some((k) => n.includes(normalizeText(k)));
  if (hasMaterialRiskSignal) return "";

  return "Nam A Bank consumer discount/promotion press release excluded";
}

function shouldExcludeItem(item = {}, source = {}) {
  const joined = `${item.title_original || item.title || ""} ${item.source_excerpt || ""} ${item.url || ""}`;
  return getNamABankPromotionExclusionReason(joined, { ...source, ...item });
}

const STATIC_SECTION_TITLES = new Set([
  "investor relations",
  "media news",
  "news",
  "disclosure",
  "investor affairs",
  "financial statements",
  "annual reports",
  "annual report",
  "annual general meetings",
  "shareholders meeting",
  "shareholders' meeting",
  "corporate governance",
  "governance reports",
  "policies"
]);

function isCompanyOfficialSource(source = {}) {
  return source.sourceType === "COMPANY_IR" || source.category === "BCG_GROUP_WATCH";
}

function isBcgLandOfficialSource(source = {}) {
  return /^bcgland-/i.test(source.id || "") || /bcg\s*land/i.test(`${source.name || ""} ${source.sourceSection || ""}`);
}

function isStaticSectionLink(title = "", url = "", source = {}) {
  if (!isCompanyOfficialSource(source)) return false;
  const normalizedTitle = normalizeText(title);
  if (!STATIC_SECTION_TITLES.has(normalizedTitle)) return false;

  try {
    const linkPath = new URL(url).pathname.replace(/\/$/, "");
    const startPaths = (source.startUrls || []).map((startUrl) => new URL(startUrl).pathname.replace(/\/$/, ""));
    // Exclude category/landing links such as ANNUAL REPORTS or CORPORATE GOVERNANCE.
    // These pages are not individual disclosures and usually do not have a publication date.
    return startPaths.some((startPath) => linkPath === startPath || linkPath.startsWith(`${startPath}/`));
  } catch {
    return true;
  }
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

function isWithinAllowedPath(url, source) {
  if (!source.allowedPathPrefixes?.length) return true;
  try {
    const u = new URL(url);
    return source.allowedPathPrefixes.some((prefix) => u.pathname.startsWith(prefix));
  } catch {
    return false;
  }
}

function shouldKeepLink(title, url, source) {
  const joined = `${title} ${url}`;
  if (getNamABankPromotionExclusionReason(joined, source)) return false;
  if (!title || cleanText(title).length < 8) return false;
  if (isStaticSectionLink(title, url, source)) return false;
  if (/login|sign in|register|javascript:|mailto:|tel:|facebook|twitter|linkedin|youtube|zalo/i.test(url)) return false;
  if (/\.(jpg|jpeg|png|gif|webp|svg|css|js|ico|zip|rar)$/i.test(url)) return false;

  if (source.keywordMode === "official_section_all") {
    return isWithinAllowedPath(url, source);
  }

  if (source.keywordMode === "bcg_or_all_ir") {
    return containsAny(joined, [...BCG_KEYWORDS, "disclosure", "financial", "annual", "report", "bond", "investor", "công bố", "báo cáo", "trái phiếu"]);
  }
  if (source.keywordMode === "general_or_bcg") {
    return containsAny(joined, [...GENERAL_KEYWORDS, ...BCG_KEYWORDS]);
  }
  return containsAny(joined, GENERAL_KEYWORDS);
}

function expandStartUrlsForSource(source) {
  const urls = new Set(source.startUrls || []);

  // Bamboo Capital official IR list pages are served under a year suffix.
  // Example: /en-US/investor-relations/disclosure/2026-1.
  // The plain page (/disclosure) may redirect in browser or return 404 in GitHub Actions,
  // so Actions must explicitly fetch the current and previous-year list pages.
  // Previous year is included to avoid missing items around New Year when a 7-day window
  // can cross the calendar year boundary.
  const isBambooCapitalIr = /^bcg-ir-/i.test(source.id || "");
  if (isBambooCapitalIr) {
    const currentYear = new Date().getUTCFullYear();
    for (const startUrl of source.startUrls || []) {
      const cleanStart = startUrl.replace(/\/$/, "");
      for (const year of [currentYear, currentYear - 1]) {
        urls.add(`${cleanStart}/${year}-1`);
      }
    }
  }

  const isBcgLandOfficial = isBcgLandOfficialSource(source);
  if (isBcgLandOfficial) {
    for (const startUrl of source.startUrls || []) {
      urls.add(startUrl.replace("https://bcgland.com.vn", "https://www.bcgland.com.vn"));
      urls.add(startUrl.replace("https://www.bcgland.com.vn", "https://bcgland.com.vn"));
    }
  }

  return [...urls];
}

function isSourceListUrl(url = "", source = {}) {
  try {
    const linkPath = new URL(url).pathname.replace(/\/$/, "");
    const startPaths = expandStartUrlsForSource(source).map((startUrl) => new URL(startUrl).pathname.replace(/\/$/, ""));
    return startPaths.includes(linkPath);
  } catch {
    return false;
  }
}


function trimListRecordTitle(title = "") {
  return cleanText(title)
    .replace(/^(read more|more details|download|pdf)[:\s-]*/i, "")
    .replace(/\b(read more|download|pdf)\b$/i, "")
    .replace(/\s*[·•|]+\s*$/g, "")
    .trim();
}

function findMatchingLinkForTitle($, title = "", baseUrl = "") {
  const target = normalizeText(title);
  if (!target || target.length < 8) return null;
  let best = null;
  let bestScore = 0;
  $("a").each((_, a) => {
    const text = normalizeText($(a).text());
    const href = $(a).attr("href");
    if (!href || !text) return;
    const targetWords = target.split(" ").filter((x) => x.length > 2);
    const textWords = new Set(text.split(" ").filter((x) => x.length > 2));
    if (!targetWords.length || !textWords.size) return;
    const score = targetWords.filter((w) => textWords.has(w)).length / targetWords.length;
    if (score > bestScore) {
      bestScore = score;
      best = resolveUrl(href, baseUrl);
    }
  });
  return bestScore >= 0.55 ? best : null;
}

function officialDateRegexForSource(source = {}) {
  if (source.dateFormat === "MM_DD_YYYY") {
    return /\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/g;
  }
  if (source.dateFormat === "DD_MM_DASH_YYYY") {
    return /\b(\d{1,2})\s+(\d{1,2})\s*[-–]\s*(20\d{2})\b/g;
  }
  if (source.dateFormat === "DD_MM_YYYY") {
    return /\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/g;
  }
  return null;
}

function isoFromOfficialDateMatch(match, source = {}) {
  if (!match) return null;
  if (source.dateFormat === "MM_DD_YYYY") return makeUtcIsoDate(match[3], match[1], match[2]);
  if (source.dateFormat === "DD_MM_DASH_YYYY") return makeUtcIsoDate(match[3], match[2], match[1]);
  if (source.dateFormat === "DD_MM_YYYY") return makeUtcIsoDate(match[3], match[2], match[1]);
  return null;
}

function extractOfficialListRecords($, source = {}, startUrl = "") {
  if (source.keywordMode !== "official_section_all") return [];
  const dateRegex = officialDateRegexForSource(source);
  if (!dateRegex) return [];

  const pageText = cleanText($("body").text());
  const matches = [...pageText.matchAll(dateRegex)];
  if (!matches.length) return [];

  const records = [];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const dateIso = isoFromOfficialDateMatch(match, source);
    if (!dateIso) continue;

    const titleStart = match.index + match[0].length;
    const titleEnd = i + 1 < matches.length ? matches[i + 1].index : Math.min(pageText.length, titleStart + 260);
    let title = trimListRecordTitle(pageText.slice(titleStart, titleEnd));

    // Remove common surrounding navigation/footer words that can appear when dynamic IR pages
    // expose only flattened text to non-browser fetchers.
    title = title
      .replace(/^(\.|·|•|-|–|\s)+/g, "")
      .replace(/\s*(BCGLand|Investor relations|DISCLOSURE|INVESTOR AFFAIRS|FINANCIAL STATEMENTS|SHAREHOLDERS'? MEETING|CORPORATE GOVERNANCE|ANNUAL REPORTS).*$/i, "")
      .trim();

    if (!title || title.length < 8) continue;
    if (isStaticSectionLink(title, startUrl, source)) continue;
    if (STATIC_SECTION_TITLES.has(normalizeText(title))) continue;

    const matchedUrl = findMatchingLinkForTitle($, title, startUrl);
    const url = canonicalUrl(matchedUrl || `${startUrl}#${sha256(`${source.id}-${dateIso}-${title}`)}`);
    const context = `${match[0]} ${title}`;
    if (shouldExcludeItem({ title_original: title, source_excerpt: context, url }, source)) continue;

    records.push({
      title,
      url,
      sourceId: source.id,
      date_hint: dateIso,
      date_hint_text: context,
      direct_record: true
    });
  }

  const dedup = new Map();
  for (const r of records) {
    const key = `${r.date_hint}|${normalizeText(r.title).slice(0, 120)}`;
    if (!dedup.has(key)) dedup.set(key, r);
  }
  return [...dedup.values()];
}

async function collectLinks(source) {
  const links = [];
  const errors = [];
  const startUrls = expandStartUrlsForSource(source);

  for (const startUrl of startUrls) {
    try {
      const html = await fetchText(startUrl);
      const $ = cheerio.load(html);

      // BCG Land IR pages can expose disclosure records as flattened text with a separate
      // date block such as "08 07 - 2026". In that case the closest <a> text may not
      // contain the date, so we create dated records directly from the list page text.
      links.push(...extractOfficialListRecords($, source, startUrl));

      $("a").each((_, a) => {
        const title = cleanText($(a).text());
        const href = $(a).attr("href");
        const url = href ? canonicalUrl(resolveUrl(href, startUrl)) : null;
        if (!url || !url.startsWith("http")) return;
        if (isSourceListUrl(url, source)) return;

        if (shouldKeepLink(title, url, source)) {
          const context = cleanText($(a).closest("article, li, tr, .item, .news-item, .post, .post-item, .card, .row, div").text()).slice(0, 800);
          const dateHint = parseDateBySourceFormat(context, source);

          // For official BCG/BCG Land sources, do not enqueue links from list pages unless
          // their row/list context contains a parseable disclosure date. This prevents old
          // menu/category links from being fetched, while keeping current items such as
          // BCG Disclosure entries dated 07/10/2026, 07/09/2026, etc.
          if (source.keywordMode === "official_section_all" && !dateHint) return;

          links.push({
            title,
            url,
            sourceId: source.id,
            date_hint: dateHint,
            date_hint_text: context
          });
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

function makeUtcIsoDate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function parseDateBySourceFormat(text = "", source = {}) {
  const raw = String(text).replace(/\s+/g, " ").trim();
  if (!raw) return null;

  if (source.dateFormat === "MM_DD_YYYY") {
    // BCG homepage: 07/10/2026 = July 10, 2026.
    const m = raw.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
    if (m) return makeUtcIsoDate(m[3], m[1], m[2]);
  }

  if (source.dateFormat === "DD_MM_DASH_YYYY") {
    // BCG Land IR: 08 07 - 2026 = July 8, 2026.
    const m = raw.match(/\b(\d{1,2})\s+(\d{1,2})\s*[-–]\s*(20\d{2})\b/);
    if (m) return makeUtcIsoDate(m[3], m[2], m[1]);
  }

  if (source.dateFormat === "DD_MM_YYYY") {
    // BCG Land News: 27/02/2025 = February 27, 2025.
    const m = raw.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/);
    if (m) return makeUtcIsoDate(m[3], m[2], m[1]);
  }

  return null;
}

function parseDateFromHtml($, text = "", source = {}) {
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

  const sourceSpecific = parseDateBySourceFormat(text, source);
  if (sourceSpecific) return sourceSpecific;

  const patterns = [
    /(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/,
    /(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})/,
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(20\d{2})/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      let iso;
      if (p === patterns[0]) iso = makeUtcIsoDate(m[1], m[2], m[3]);
      else if (p === patterns[1]) iso = makeUtcIsoDate(m[3], m[2], m[1]);
      else {
        const d = new Date(`${m[2]} ${m[1]}, ${m[3]} 00:00:00 UTC`);
        iso = Number.isNaN(d.getTime()) ? null : d.toISOString();
      }
      if (iso) return iso;
    }
  }
  return null;
}

async function readArticle(link, source) {
  if (link.direct_record) {
    const title = cleanText(link.title);
    const bodyText = cleanText(link.date_hint_text || title);
    const companyTags = extractTags(`${title} ${bodyText}`, BCG_KEYWORDS);
    const { riskScore, riskTags } = getRiskScore(`${title} ${bodyText}`, source);
    const id = `${source.id}-${sha256(canonicalUrl(link.url) + normalizeText(title) + (link.date_hint || ""))}`;
    return {
      id,
      category: source.category,
      source_type: source.sourceType,
      source_name: source.name,
      source_id: source.id,
      source_section: source.sourceSection || source.name,
      monitored_url: source.startUrls?.[0] || source.baseUrl,
      date_format: source.dateFormat || "AUTO",
      title_original: title,
      title_ko: "",
      summary_ko: "",
      impact_ko: hanwhaImpact(`${title} ${bodyText}`, companyTags, riskTags),
      url: canonicalUrl(link.url),
      published_at: link.date_hint,
      collected_at: nowKstIso(),
      credibility_score: source.reliability,
      risk_score: riskScore,
      priority: classifyPriority(riskScore, source.reliability, companyTags),
      company_tags: companyTags,
      risk_tags: riskTags,
      verified_by_official_source: ["GOVERNMENT", "REGULATOR", "STOCK_EXCHANGE", "COMPANY_IR"].includes(source.sourceType),
      source_excerpt: bodyText.slice(0, 1000)
    };
  }

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
  const publishedAt = parseDateFromHtml($, `${title} ${link.date_hint_text || ""} ${bodyText}`, source) || link.date_hint;
  const companyTags = extractTags(`${title} ${bodyText}`, BCG_KEYWORDS);
  const { riskScore, riskTags } = getRiskScore(`${title} ${bodyText}`, source);
  const id = `${source.id}-${sha256(canonicalUrl(link.url) + normalizeText(title))}`;

  return {
    id,
    category: source.category,
    source_type: source.sourceType,
    source_name: source.name,
    source_id: source.id,
    source_section: source.sourceSection || source.name,
    monitored_url: source.startUrls?.[0] || source.baseUrl,
    date_format: source.dateFormat || "AUTO",
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


function isKoreanText(text = "") {
  return /[가-힣]/.test(String(text));
}

function koreanSourceLabel(sourceName = "") {
  return sourceName || "해당 출처";
}

function koreanizeTitleFallback(item) {
  const title = item.title_original || "";
  const t = normalizeText(title);
  if (/vietnam.*economy.*(grew|growth|expanded)|gdp|economic growth/.test(t)) {
    const pct = title.match(/\d+(\.\d+)?\s*(per cent|percent|%)/i)?.[0]?.replace(/per cent/i, "%").replace(/percent/i, "%") || "";
    const quarter = /second quarter|q2/i.test(title) ? "2분기" : /first quarter|q1/i.test(title) ? "1분기" : /third quarter|q3/i.test(title) ? "3분기" : /fourth quarter|q4/i.test(title) ? "4분기" : "";
    return `베트남 경제 ${quarter ? quarter + " " : ""}${pct ? pct + " " : ""}성장 관련 동향`;
  }
  if (/prime minister|\bpm\b|deputy prime minister|government news/.test(t)) return "베트남 총리·정부 지시 관련 정책 동향";
  if (/state bank|sbv|interest rate|exchange rate|credit|banking|monetary|foreign exchange/.test(t)) return "베트남 금리·환율·은행권 금융시장 동향";
  if (/ministry of finance|tax|budget|fiscal|customs|fee|vat|public finance/.test(t)) return "베트남 재정·세무정책 관련 동향";
  if (/state securities|securities|stock|shares|listed|hose|hnx|upcom|trading|disclosure/.test(t)) return "베트남 증권시장·상장사 공시 관련 동향";
  if (/bond|coupon|maturity|principal|debt|restructuring|issuer/.test(t)) return "베트남 회사채·채무상환 관련 공시 동향";
  if (/bcg|bamboo capital|bcg land|bcg energy|tracodi|aaa insurance|nam a bank|sssg|king crown/.test(t)) return "BCG 그룹 및 관련사 공시·리스크 동향";
  if (/real estate|property|construction|infrastructure|project|land/.test(t)) return "베트남 부동산·건설시장 관련 동향";
  if (item.category === "GOVERNMENT_POLICY") return "베트남 정부정책 관련 주요 공지";
  if (item.category === "FINANCIAL_MARKET") return "베트남 금융시장 관련 주요 공지";
  if (item.category === "BCG_GROUP_WATCH") return "BCG 그룹 관련 공시·경제뉴스";
  if (item.category === "VIETNAM_ECONOMIC_NEWS") return "베트남 경제뉴스 주요 동향";
  return "베트남 경제·정책 관련 수집 기사";
}

function koreanizeSummaryFallback(item) {
  const source = koreanSourceLabel(item.source_name);
  const categoryLabel = String(item.category || "").replaceAll("_", " ");
  const riskTags = (item.risk_tags || []).slice(0, 5).join(", ");
  const tagPart = riskTags ? ` 감지된 주요 리스크 키워드는 ${riskTags}입니다.` : "";

  if ((item.company_tags || []).length || item.category === "BCG_GROUP_WATCH") {
    const companies = (item.company_tags || []).slice(0, 5).join(", ") || "BCG 관련사";
    return `${source}에서 수집된 ${companies} 관련 항목입니다. Hanwha 회수 리스크, BCG 그룹 유동성, 공시 신뢰도와의 관련성을 원문 기준으로 확인해야 합니다.${tagPart}`;
  }

  if (item.verified_by_official_source) {
    return `${source}에서 수집된 공식 ${categoryLabel} 항목입니다. 베트남 정책·금융시장·증권공시 모니터링 자료로 활용하되, 최종 보고 전 원문과 세부 수치를 확인해야 합니다.${tagPart}`;
  }

  return `${source}에서 수집된 베트남 경제뉴스 항목입니다. 시장 반응과 경제 동향 파악용 보조 자료이며, 최종 판단은 정부기관·거래소·회사공시 원문으로 재검증해야 합니다.${tagPart}`;
}

function fallbackSummary(item) {
  return {
    ...item,
    title_ko: isKoreanText(item.title_ko || "") ? item.title_ko : koreanizeTitleFallback(item),
    summary_ko: isKoreanText(item.summary_ko || "") ? item.summary_ko : koreanizeSummaryFallback(item),
    impact_ko: isKoreanText(item.impact_ko || "") ? item.impact_ko : hanwhaImpact(`${item.title_original} ${item.source_excerpt}`, item.company_tags || [], item.risk_tags || []),
    summary_method: "fallback_korean"
  };
}

async function summarizeItem(item) {
  if (!openai) return fallbackSummary(item);
  const input = `
You are preparing a Korean business-risk newsletter for Hanwha Corporation.
Translate and summarize ONLY the facts present in the source text. Do not speculate.
Return strict JSON with keys: title_ko, summary_ko, impact_ko.
- title_ko: Translate the original title into natural Korean within 80 Korean characters. Do NOT copy the English/Vietnamese title.
- summary_ko: Write 2 concise Korean sentences. Translate the key facts into Korean. No markdown.
- impact_ko: Write one Korean sentence on relevance to Vietnam economy or BCG/Hanwha recovery risk. If unclear, say 추가 확인 필요.

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
  // Accuracy rule: Daily/Weekly Best must be based on actual publication/disclosure date.
  // Never treat collected_at as publication date. If the publication date is missing or invalid,
  // exclude the item from the best lists and data file.
  if (!item.published_at) return false;
  const publishedTime = new Date(item.published_at).getTime();
  if (Number.isNaN(publishedTime)) return false;
  const cutoff = Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000;
  return publishedTime >= cutoff;
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
    const sourceLog = { source_id: source.id, source_name: source.name, started_at: nowKstIso(), links: 0, items: 0, excluded: 0, excluded_reasons: [], errors: [] };
    try {
      const { links, errors } = await collectLinks(source);
      sourceLog.links = links.length;
      sourceLog.errors.push(...errors);
      for (const link of links) {
        try {
          const item = await readArticle(link, source);
          const exclusionReason = shouldExcludeItem(item, source);
          if (exclusionReason) {
            sourceLog.excluded += 1;
            sourceLog.excluded_reasons.push({ url: item.url, title: item.title_original, reason: exclusionReason });
            continue;
          }
          if (!item.published_at) {
            sourceLog.excluded += 1;
            sourceLog.excluded_reasons.push({
              url: item.url,
              title: item.title_original,
              reason: "Missing publication/disclosure date; excluded from Daily/Weekly Best"
            });
            continue;
          }
          if (isRecentEnough(item)) {
            newItems.push(item);
            sourceLog.items += 1;
          } else {
            sourceLog.excluded += 1;
            sourceLog.excluded_reasons.push({
              url: item.url,
              title: item.title_original,
              published_at: item.published_at,
              reason: `Older than lookback window (${LOOKBACK_HOURS} hours); excluded from Daily/Weekly Best`
            });
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

  const merged = dedupeItems([...newItems, ...existing].filter((item) => !shouldExcludeItem(item))).filter(isRecentEnough);
  const selected = sortItems(merged).slice(0, DASHBOARD_MAX_ITEMS);
  const summarized = [];
  for (const item of selected) {
    const needsSummary = !isKoreanText(item.title_ko || "") || !isKoreanText(item.summary_ko || "") || item.summary_method === "fallback_keyword" || item.summary_method === "fallback_korean";
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
    max_items: DASHBOARD_MAX_ITEMS,
    items: sortItems(summarized).slice(0, DASHBOARD_MAX_ITEMS)
  };
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2));
  await fs.writeFile(LOG_FILE, JSON.stringify({ updated_at: nowKstIso(), logs }, null, 2));
  console.log(`Saved ${summarized.length} items to ${DATA_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
