import fs from "node:fs/promises";
import path from "node:path";
import OpenAI from "openai";
import {
  FACEBOOK_PAGES,
  RISK_TERMS,
  SNS_QUERIES,
  YOUTUBE_EXCLUDED_CHANNELS,
  YOUTUBE_EXCLUDED_TITLE_PATTERNS
} from "./sns-sources.js";

const OUTPUT = path.resolve("data/sns.json");
function cleanSecret(value = "") {
  return String(value).trim().replace(/^['"]+|['"]+$/g, "").trim();
}

const YOUTUBE_API_KEY = cleanSecret(process.env.YOUTUBE_API_KEY);
const FACEBOOK_ACCESS_TOKEN = cleanSecret(process.env.FACEBOOK_ACCESS_TOKEN);
const OPENAI_API_KEY = cleanSecret(process.env.OPENAI_API_KEY);
const OPENAI_MODEL = cleanSecret(process.env.OPENAI_MODEL) || "gpt-4.1-mini";
const LOOKBACK_DAYS = Math.max(1, Number(process.env.SNS_LOOKBACK_DAYS || 30));
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
function normalizeYouTubeText(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const excludedYouTubeChannels = new Set(YOUTUBE_EXCLUDED_CHANNELS.map(normalizeYouTubeText));

function safeJson(value, fallback) {
  try { return JSON.parse(value); } catch { return fallback; }
}

const configuredFacebookPages = (() => {
  const fromSecret = safeJson(process.env.FACEBOOK_PAGES_JSON || "", []);
  return Array.isArray(fromSecret) && fromSecret.length ? fromSecret : FACEBOOK_PAGES;
})();

function riskInfo(text = "") {
  const normalized = String(text).toLowerCase();
  const matched = RISK_TERMS.filter((term) => normalized.includes(term.toLowerCase()));
  return {
    risk_score: Math.min(100, matched.length * 18 + (matched.length ? 25 : 0)),
    risk_tags: matched.slice(0, 6)
  };
}

function isExcludedYouTubeVideo(channelTitle = "", title = "", description = "") {
  if (excludedYouTubeChannels.has(normalizeYouTubeText(channelTitle))) return true;
  const metadata = `${title} ${description}`;
  return YOUTUBE_EXCLUDED_TITLE_PATTERNS.some((pattern) => pattern.test(metadata));
}

function maskSecrets(text, secrets = []) {
  return secrets.filter(Boolean).reduce((result, secret) => result.replaceAll(secret, "[REDACTED]"), String(text || ""));
}

function koreanFallback(item, reason) {
  return {
    ...item,
    title_ko: /[가-힣]/.test(item.title || "") ? item.title : "YouTube 영상 한글 번역 대기",
    summary_ko: "YouTube에서 수집된 영상입니다. 제목과 설명의 한글 번역·요약을 생성하지 못해 원문 영상 확인이 필요합니다.",
    impact_ko: "SNS 조기경보 자료이므로 회사 공시·거래소·감독기관·언론 보도와 교차 확인해야 합니다.",
    summary_method: "youtube-metadata-fallback",
    translation_status: openai ? "error" : "not_configured",
    translation_error: maskSecrets(reason, [OPENAI_API_KEY]).replace(/\s+/g, " ").trim().slice(0, 500)
  };
}

async function translateYouTubeItem(item) {
  if (!openai) return koreanFallback(item, "OPENAI_API_KEY 미설정");
  const prompt = `
베트남 사업 리스크를 모니터링하는 한국어 대시보드용 자료입니다.
아래 YouTube 메타데이터에 명시된 사실만 사용하고 추측하지 마세요.
엄격한 JSON 객체로 title_ko, summary_ko, impact_ko 키만 반환하세요.
- title_ko: 원제의 의미와 회사명·수치·고유명사를 보존한 자연스러운 한국어 제목(80자 이내)
- summary_ko: 제목과 영상 설명의 핵심 사실을 한국어 2문장으로 요약. 설명이 부족하면 정보가 제한적임을 명시
- impact_ko: King Crown·BCG 또는 베트남 사업 리스크 관점의 확인 사항 1문장. 관련성이 불명확하면 추가 확인 필요라고 명시
- 실제 영상 내용이나 음성을 확인한 것처럼 작성하지 말 것

채널: ${item.author}
검색어: ${item.query}
원제: ${item.title}
영상 설명: ${item.summary || "설명 없음"}
`;
  try {
    const response = await openai.responses.create({
      model: OPENAI_MODEL,
      input: prompt,
      text: { format: { type: "json_object" } }
    });
    const parsed = JSON.parse(response.output_text);
    if (!/[가-힣]/.test(`${parsed.title_ko || ""} ${parsed.summary_ko || ""}`)) {
      throw new Error("OpenAI 응답에 한글 번역·요약이 없습니다.");
    }
    return {
      ...item,
      title_ko: String(parsed.title_ko || "").trim(),
      summary_ko: String(parsed.summary_ko || "").trim(),
      impact_ko: String(parsed.impact_ko || "추가 확인이 필요합니다.").trim(),
      summary_method: `openai:${OPENAI_MODEL}:youtube-metadata`,
      translation_status: "translated"
    };
  } catch (error) {
    return koreanFallback(item, error.message);
  }
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function apiErrorDetail(response, data, rawText, secrets = []) {
  const errors = Array.isArray(data?.error?.errors) ? data.error.errors : [];
  const reasons = [...new Set(errors.map((item) => item?.reason).filter(Boolean))];
  const message = data?.error?.message || rawText || response.statusText || "Unknown API error";
  const reasonPart = reasons.length ? ` [${reasons.join(", ")}]` : "";
  return maskSecrets(`${response.status} ${response.statusText}${reasonPart}: ${message}`, secrets)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);
}

async function getJson(url, { secrets = [] } = {}) {
  const response = await fetch(url, { headers: { "User-Agent": "Vietnam-BCG-Risk-Monitor/1.0" } });
  const rawText = await response.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }
  if (!response.ok) throw new Error(apiErrorDetail(response, data, rawText, secrets));
  if (data === null) throw new Error(`${response.status} ${response.statusText}: 응답이 올바른 JSON 형식이 아닙니다.`);
  return data;
}

async function fetchYouTube() {
  if (!YOUTUBE_API_KEY) {
    return { status: "not_configured", message: "YOUTUBE_API_KEY 미설정", items: [] };
  }

  const publishedAfter = new Date(Date.now() - LOOKBACK_DAYS * 864e5).toISOString().replace(/\.\d{3}Z$/, "Z");
  const found = [];
  const errors = [];
  let excludedCount = 0;

  for (const query of SNS_QUERIES) {
    try {
      const params = new URLSearchParams({
        part: "snippet",
        type: "video",
        order: "date",
        maxResults: "10",
        q: query,
        publishedAfter,
        regionCode: "VN",
        relevanceLanguage: "vi",
        key: YOUTUBE_API_KEY
      });
      const data = await getJson(`https://www.googleapis.com/youtube/v3/search?${params}`, { secrets: [YOUTUBE_API_KEY] });
      for (const row of data.items || []) {
        const videoId = row?.id?.videoId;
        if (!videoId) continue;
        const author = row.snippet?.channelTitle || "채널 미상";
        const title = row.snippet?.title || "제목 없음";
        const description = row.snippet?.description || "";
        if (isExcludedYouTubeVideo(author, title, description)) {
          excludedCount += 1;
          continue;
        }
        found.push({
          id: `youtube:${videoId}`,
          platform: "YOUTUBE",
          query,
          title,
          summary: description,
          author,
          published_at: row.snippet?.publishedAt || null,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail: row.snippet?.thumbnails?.medium?.url || row.snippet?.thumbnails?.default?.url || "",
          ...riskInfo(`${title} ${description}`)
        });
      }
    } catch (error) {
      errors.push(`${query}: ${error.message}`);
    }
  }

  const unique = [...new Map(found.map((item) => [item.id, item])).values()]
    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))
    .slice(0, 50);
  const translated = await mapWithConcurrency(unique, 3, translateYouTubeItem);
  const translatedCount = translated.filter((item) => item.translation_status === "translated").length;
  const translationFailures = translated.length - translatedCount;

  const uniqueErrors = [...new Set(errors.map((entry) => entry.replace(/^[^:]+:\s*/, "")))];
  const errorSummary = uniqueErrors.length
    ? `${errors.length}/${SNS_QUERIES.length}개 검색 실패 · ${uniqueErrors.slice(0, 2).join(" | ")}`
    : "";

  return {
    status: errors.length === SNS_QUERIES.length ? "error" : errors.length ? "partial" : "active",
    message: [
      errors.length ? errorSummary : `${unique.length}개 영상 수집`,
      `${translatedCount}개 한글 번역·요약`,
      excludedCount ? `${excludedCount}개 제외 채널 영상 차단` : "",
      translationFailures ? `${translationFailures}개 번역 대기` : ""
    ].filter(Boolean).join(" · "),
    items: translated
  };
}

async function fetchFacebook() {
  const pages = configuredFacebookPages.map((page) => ({
    name: String(page.name || page.pageId || "Facebook Page"),
    url: String(page.url || (page.pageId ? `https://www.facebook.com/${page.pageId}` : "https://www.facebook.com/")),
    pageId: String(page.pageId || "")
  }));

  const approvedPages = pages.filter((page) => page.pageId);
  if (!FACEBOOK_ACCESS_TOKEN || !approvedPages.length) {
    return {
      status: "links_only",
      message: !FACEBOOK_ACCESS_TOKEN ? "승인 토큰 미설정: 지정 페이지 바로가기만 제공" : "승인 Page ID 미설정",
      pages,
      items: []
    };
  }

  const found = [];
  const errors = [];
  for (const page of approvedPages) {
    try {
      const params = new URLSearchParams({
        fields: "id,message,created_time,permalink_url,full_picture,shares",
        limit: "25",
        access_token: FACEBOOK_ACCESS_TOKEN
      });
      const data = await getJson(`https://graph.facebook.com/v25.0/${encodeURIComponent(page.pageId)}/posts?${params}`, { secrets: [FACEBOOK_ACCESS_TOKEN] });
      for (const row of data.data || []) {
        const message = row.message || "Facebook 게시물";
        found.push({
          id: `facebook:${row.id}`,
          platform: "FACEBOOK",
          query: page.name,
          title: message.length > 110 ? `${message.slice(0, 110)}…` : message,
          summary: message,
          author: page.name,
          published_at: row.created_time || null,
          url: row.permalink_url || page.url,
          thumbnail: row.full_picture || "",
          ...riskInfo(message)
        });
      }
    } catch (error) {
      errors.push(`${page.name}: ${error.message}`);
    }
  }

  return {
    status: errors.length === approvedPages.length ? "error" : errors.length ? "partial" : "active",
    message: errors.length ? errors.slice(0, 3).join(" | ") : `${found.length}개 게시물 수집`,
    pages,
    items: found
  };
}

async function main() {
  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  const [youtube, facebook] = await Promise.all([fetchYouTube(), fetchFacebook()]);
  const items = [...youtube.items, ...facebook.items]
    .sort((a, b) => (b.risk_score - a.risk_score) || (new Date(b.published_at || 0) - new Date(a.published_at || 0)));

  const output = {
    schema_version: 1,
    updated_at: new Date().toISOString(),
    lookback_days: LOOKBACK_DAYS,
    queries: SNS_QUERIES,
    channels: {
      youtube: { status: youtube.status, message: youtube.message, count: youtube.items.length },
      facebook: { status: facebook.status, message: facebook.message, count: facebook.items.length, pages: facebook.pages },
      tiktok: { status: "search_links", message: "키워드 검색 바로가기" },
      x: { status: "search_links", message: "무료 공개 검색 바로가기 · API 자동수집 미사용" }
    },
    items
  };
  await fs.writeFile(OUTPUT, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`SNS data saved: ${OUTPUT} (${items.length} items)`);
}

main().catch(async (error) => {
  const fallback = {
    schema_version: 1,
    updated_at: new Date().toISOString(),
    channels: { collector: { status: "error", message: error.message } },
    items: []
  };
  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, `${JSON.stringify(fallback, null, 2)}\n`, "utf8");
  console.error(error);
});
