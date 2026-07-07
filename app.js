const state = {
  items: [],
  filters: {
    q: "",
    category: "ALL",
    priority: "ALL",
    sourceType: "ALL"
  }
};

const $ = (id) => document.getElementById(id);

const CATEGORY_LABELS_KO = {
  ALL: "전체",
  BCG_GROUP_WATCH: "BCG 그룹 모니터링",
  FINANCIAL_MARKET: "금융시장",
  GOVERNMENT_POLICY: "정부정책",
  VIETNAM_ECONOMIC_NEWS: "베트남 경제뉴스"
};

const PRIORITY_LABELS_KO = {
  CRITICAL: "긴급",
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음"
};

const SOURCE_TYPE_LABELS_KO = {
  ALL: "전체 출처",
  GOVERNMENT: "정부기관",
  REGULATOR: "감독기관",
  STOCK_EXCHANGE: "거래소",
  COMPANY_IR: "회사공시/IR",
  MEDIA: "경제언론"
};

const RISK_TAG_LABELS_KO = new Map([
  ["investigation", "수사"],
  ["ministry of public security", "공안부"],
  ["suspended", "거래정지"],
  ["suspension", "거래정지"],
  ["control", "관리종목"],
  ["bond", "채권"],
  ["bonds", "채권"],
  ["disclosure", "공시"],
  ["late financial", "재무제표 지연"],
  ["resignation", "임원 사임"],
  ["collateral", "담보"],
  ["pledge", "질권"],
  ["receivables", "수익권/채권"],
  ["tax", "세금"],
  ["interest rate", "금리"],
  ["exchange rate", "환율"]
]);

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "일자 없음";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function label(value = "") {
  const raw = String(value);
  return CATEGORY_LABELS_KO[raw] || SOURCE_TYPE_LABELS_KO[raw] || PRIORITY_LABELS_KO[raw] || raw.replaceAll("_", " ");
}

function isKoreanText(text = "") {
  return /[가-힣]/.test(String(text));
}

function normalizePlain(text = "") {
  return String(text).toLowerCase().replace(/\s+/g, " ").trim();
}

function translateTitleFallback(item) {
  const title = item.title_original || "";
  const t = normalizePlain(title);

  if (/vietnam.*economy.*(grew|growth|expanded)|gdp|economic growth/.test(t)) {
    const pct = title.match(/\d+(\.\d+)?\s*(per cent|percent|%)/i)?.[0]?.replace(/per cent/i, "%").replace(/percent/i, "%") || "";
    const quarter = /second quarter|q2/i.test(title) ? "2분기" : /first quarter|q1/i.test(title) ? "1분기" : /third quarter|q3/i.test(title) ? "3분기" : /fourth quarter|q4/i.test(title) ? "4분기" : "";
    return `베트남 경제 ${quarter ? quarter + " " : ""}${pct ? pct + " " : ""}성장 관련 동향`;
  }
  if (/prime minister|\bpm\b|deputy prime minister/.test(t)) return "베트남 총리·정부 지시 관련 정책 동향";
  if (/state bank|sbv|interest rate|exchange rate|credit|banking|monetary/.test(t)) return "베트남 금리·환율·은행권 금융시장 동향";
  if (/ministry of finance|tax|budget|fiscal|customs|fee|vat/.test(t)) return "베트남 재정·세무정책 관련 동향";
  if (/securities|stock|shares|listed|hose|hnx|upcom|trading/.test(t)) return "베트남 증권시장·상장사 공시 관련 동향";
  if (/bond|coupon|maturity|principal|debt|restructuring/.test(t)) return "베트남 회사채·채무상환 관련 공시 동향";
  if (/bcg|bamboo capital|bcg land|bcg energy|tracodi|aaa insurance|nam a bank|sssg|king crown/.test(t)) return "BCG 그룹 및 관련사 공시·리스크 동향";
  if (/real estate|property|construction|infrastructure|project/.test(t)) return "베트남 부동산·건설시장 관련 동향";

  if (item.category === "GOVERNMENT_POLICY") return "베트남 정부정책 관련 주요 공지";
  if (item.category === "FINANCIAL_MARKET") return "베트남 금융시장 관련 주요 공지";
  if (item.category === "BCG_GROUP_WATCH") return "BCG 그룹 관련 공시·경제뉴스";
  if (item.category === "VIETNAM_ECONOMIC_NEWS") return "베트남 경제뉴스 주요 동향";
  return "베트남 경제·정책 관련 수집 기사";
}

function koreanSummaryFallback(item) {
  const source = item.source_name || "해당 출처";
  const category = label(item.category || "");
  const official = item.verified_by_official_source ? "공식 출처" : "경제언론";
  const riskTags = (item.risk_tags || []).map((t) => RISK_TAG_LABELS_KO.get(String(t).toLowerCase()) || t).slice(0, 4);
  const tagPart = riskTags.length ? ` 주요 감지 키워드는 ${riskTags.join(", ")}입니다.` : "";

  if (item.category === "BCG_GROUP_WATCH" || (item.company_tags || []).length) {
    const companies = (item.company_tags || []).slice(0, 5).join(", ") || "BCG 관련사";
    return `${source}에서 확인된 ${companies} 관련 동향입니다. Hanwha 채권 회수 가능성, 공시 신뢰도, 유동성 영향 여부를 원문 기준으로 추가 확인해야 합니다.${tagPart}`;
  }

  return `${source}에서 수집된 ${category} 항목입니다. ${official} 기반의 베트남 경제·정책 모니터링 자료이며, 최종 보고 전 원문과 세부 수치를 확인해야 합니다.${tagPart}`;
}

function displayTitle(item) {
  const titleKo = item.title_ko || "";
  if (isKoreanText(titleKo) && titleKo !== item.title_original) return titleKo;
  return translateTitleFallback(item);
}

function displaySummary(item) {
  const summaryKo = item.summary_ko || "";
  if (isKoreanText(summaryKo) && summaryKo !== item.source_excerpt && summaryKo !== item.title_original) return summaryKo;
  return koreanSummaryFallback(item);
}

function displayImpact(item) {
  if (isKoreanText(item.impact_ko || "")) return item.impact_ko;
  return item.category === "BCG_GROUP_WATCH" || (item.company_tags || []).length
    ? "BCG 그룹 유동성, 공시 신뢰도 또는 Hanwha 회수 리스크와의 관련성을 우선 확인해야 합니다."
    : "일반 베트남 경제·정책 모니터링 대상입니다.";
}

function populateFilters() {
  const categories = unique(state.items.map((i) => i.category));
  const sourceTypes = unique(state.items.map((i) => i.source_type));

  const categoryButtons = $("categoryButtons");
  categoryButtons.innerHTML = `
    <button class="filter-chip active" type="button" data-category="ALL" aria-pressed="true">전체</button>
  `;

  for (const c of categories) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "filter-chip";
    btn.dataset.category = c;
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = label(c);
    categoryButtons.appendChild(btn);
  }

  const sourceTypeFilter = $("sourceTypeFilter");
  sourceTypeFilter.innerHTML = `<option value="ALL">전체 출처</option>`;
  for (const s of sourceTypes) {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = label(s);
    sourceTypeFilter.appendChild(opt);
  }
}

function setActiveCategory(category) {
  state.filters.category = category;
  document.querySelectorAll("#categoryButtons .filter-chip").forEach((btn) => {
    const isActive = btn.dataset.category === category;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });
}

function applyFilters() {
  const q = state.filters.q.toLowerCase().trim();
  return state.items.filter((item) => {
    const text = [
      item.title_original,
      displayTitle(item),
      displaySummary(item),
      displayImpact(item),
      item.source_name,
      item.category,
      item.source_type,
      ...(item.company_tags || []),
      ...(item.risk_tags || [])
    ].join(" ").toLowerCase();

    if (q && !text.includes(q)) return false;
    if (state.filters.category !== "ALL" && item.category !== state.filters.category) return false;
    if (state.filters.priority !== "ALL" && item.priority !== state.filters.priority) return false;
    if (state.filters.sourceType !== "ALL" && item.source_type !== state.filters.sourceType) return false;
    return true;
  });
}

function renderStats() {
  $("totalCount").textContent = state.items.length;
  $("criticalCount").textContent = state.items.filter((i) => i.priority === "CRITICAL").length;
  $("bcgCount").textContent = state.items.filter((i) =>
    i.category === "BCG_GROUP_WATCH" ||
    (i.company_tags || []).some((tag) => /BCG|Bamboo|SSSG|Nam A|TRACODI|AAA/i.test(tag))
  ).length;
  $("officialCount").textContent = state.items.filter((i) => i.verified_by_official_source).length;
}

function renderCards() {
  const cards = $("cards");
  const items = applyFilters();
  renderStats();

  if (!items.length) {
    cards.innerHTML = `<div class="empty">현재 필터 조건에 맞는 항목이 없습니다.</div>`;
    return;
  }

  cards.innerHTML = items.map((item) => {
    const priority = escapeHtml(item.priority || "LOW");
    const priorityKo = PRIORITY_LABELS_KO[item.priority] || priority;
    const tags = [
      `<span class="badge priority ${priority}">${escapeHtml(priorityKo)}</span>`,
      item.verified_by_official_source ? `<span class="badge official">공식</span>` : "",
      ...(item.company_tags || []).map((t) => `<span class="badge">${escapeHtml(t)}</span>`),
      ...(item.risk_tags || []).slice(0, 5).map((t) => `<span class="badge">${escapeHtml(RISK_TAG_LABELS_KO.get(String(t).toLowerCase()) || t)}</span>`)
    ].join("");

    const title = displayTitle(item);
    const summary = displaySummary(item);
    const impact = displayImpact(item);
    const showOriginal = item.title_original && item.title_original !== title;

    return `
      <article class="card ${priority}">
        <div class="card-top">
          <div>
            <div class="meta">
              <span>${escapeHtml(item.source_name || "출처 미상")}</span>
              <span>·</span>
              <span>${escapeHtml(label(item.category || "미분류"))}</span>
              <span>·</span>
              <span>${formatDate(item.published_at || item.collected_at)}</span>
            </div>
            <h3><a href="${escapeHtml(item.url || "#")}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></h3>
            ${showOriginal ? `<p class="original-title">원문 제목: ${escapeHtml(item.title_original)}</p>` : ""}
            <div class="badges">${tags}</div>
          </div>
          <div class="score">
            신뢰도 <strong>${Number(item.credibility_score || 0)}</strong>
            리스크 <strong>${Number(item.risk_score || 0)}</strong>
          </div>
        </div>
        <p class="summary"><strong>요약:</strong> ${escapeHtml(summary)}</p>
        <p class="impact"><strong>Hanwha / Vietnam 영향:</strong> ${escapeHtml(impact)}</p>
      </article>
    `;
  }).join("");
}

async function init() {
  try {
    const res = await fetch(`data/news.json?ts=${Date.now()}`);
    const data = await res.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    $("updatedAt").textContent = formatDate(data.updated_at);
    $("summaryMode").textContent = data.openai_summary_enabled ? "OpenAI 한국어 번역·요약 사용" : "한국어 대체 요약 모드";
    populateFilters();
    renderCards();
  } catch (err) {
    $("cards").innerHTML = `<div class="empty">data/news.json을 불러오지 못했습니다: ${escapeHtml(err.message)}</div>`;
  }

  $("searchInput").addEventListener("input", (e) => {
    state.filters.q = e.target.value;
    renderCards();
  });
  $("categoryButtons").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-category]");
    if (!btn) return;
    setActiveCategory(btn.dataset.category);
    renderCards();
  });
  $("priorityFilter").addEventListener("change", (e) => {
    state.filters.priority = e.target.value;
    renderCards();
  });
  $("sourceTypeFilter").addEventListener("change", (e) => {
    state.filters.sourceType = e.target.value;
    renderCards();
  });
  $("resetBtn").addEventListener("click", () => {
    state.filters = { q: "", category: "ALL", priority: "ALL", sourceType: "ALL" };
    $("searchInput").value = "";
    setActiveCategory("ALL");
    $("priorityFilter").value = "ALL";
    $("sourceTypeFilter").value = "ALL";
    renderCards();
  });
}

init();
