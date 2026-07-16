import fs from "node:fs/promises";
import path from "node:path";
import { FACEBOOK_PAGES, RISK_TERMS, SNS_QUERIES } from "./sns-sources.js";

const OUTPUT = path.resolve("data/sns.json");
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || "";
const LOOKBACK_DAYS = Math.max(1, Number(process.env.SNS_LOOKBACK_DAYS || 30));

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

async function getJson(url) {
  const response = await fetch(url, { headers: { "User-Agent": "Vietnam-BCG-Risk-Monitor/1.0" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

async function fetchYouTube() {
  if (!YOUTUBE_API_KEY) {
    return { status: "not_configured", message: "YOUTUBE_API_KEY 미설정", items: [] };
  }

  const publishedAfter = new Date(Date.now() - LOOKBACK_DAYS * 864e5).toISOString();
  const found = [];
  const errors = [];

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
      const data = await getJson(`https://www.googleapis.com/youtube/v3/search?${params}`);
      for (const row of data.items || []) {
        const videoId = row?.id?.videoId;
        if (!videoId) continue;
        const title = row.snippet?.title || "제목 없음";
        const description = row.snippet?.description || "";
        found.push({
          id: `youtube:${videoId}`,
          platform: "YOUTUBE",
          query,
          title,
          summary: description,
          author: row.snippet?.channelTitle || "채널 미상",
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

  return {
    status: errors.length === SNS_QUERIES.length ? "error" : errors.length ? "partial" : "active",
    message: errors.length ? errors.slice(0, 3).join(" | ") : `${unique.length}개 영상 수집`,
    items: unique
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
      const data = await getJson(`https://graph.facebook.com/v25.0/${encodeURIComponent(page.pageId)}/posts?${params}`);
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
      zalo: { status: "local_reports", message: "현지 제보 브라우저 저장" }
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
