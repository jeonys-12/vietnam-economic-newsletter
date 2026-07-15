const MAX_DISPLAY_ITEMS = 100;

const PERIODS = {
  DAILY: { label: "일간 베스트", subLabel: "24시간 이내", hours: 24 },
  WEEKLY: { label: "주간 베스트", subLabel: "일주일 이내", hours: 168 },
  MONTHLY: { label: "월간 추세", subLabel: "30일 이내", hours: 720 }
};

const state = {
  items: [],
  filters: {
    period: "DAILY",
    q: "",
    category: "ALL",
    priority: "ALL",
    sourceType: "ALL"
  }
};

const $ = (id) => document.getElementById(id);
const setText = (id, value) => {
  const el = $(id);
  if (el) el.textContent = value;
};
const setHtml = (id, value) => {
  const el = $(id);
  if (el) el.innerHTML = value;
};
const on = (id, eventName, handler) => {
  const el = $(id);
  if (el) el.addEventListener(eventName, handler);
};

const COMBINED_POLICY_MARKET_CATEGORY = "POLICY_FINANCIAL_MARKET";

const CATEGORY_LABELS_KO = {
  ALL: "전체",
  POLICY_FINANCIAL_MARKET: "정부정책·금융시장",
  BCG_GROUP_WATCH: "BCG 그룹 모니터링",
  SECURITIES_BONDS: "공시·채권",
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
  MEDIA: "경제언론",
  ECONOMIC_MEDIA: "경제언론",
  ECONOMIC_MEDIA_EN: "영문 경제언론"
};

const RISK_TAG_LABELS_KO = new Map([
  ["investigation", "수사"],
  ["ministry of public security", "공안부"],
  ["suspended", "거래정지"],
  ["suspension", "거래정지"],
  ["trading suspension", "거래정지"],
  ["delisting", "상장폐지"],
  ["control", "관리종목"],
  ["warning", "경고"],
  ["bond", "채권"],
  ["bonds", "채권"],
  ["disclosure", "공시"],
  ["late financial", "재무제표 지연"],
  ["late financial statements", "재무제표 지연"],
  ["resignation", "임원 사임"],
  ["board resignation", "이사회 사임"],
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

function formatDate(value, withTime = true) {
  if (!value) return "일자 없음";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {})
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

  if (/delisting|hủy niêm yết/.test(t)) return "상장폐지 관련 공식 공시";
  if (/bond|coupon|interest payment|principal|debt/.test(t)) return "채권 이자·원금 지급 관련 공시";
  if (/resignation|appointment|corporate governance|governance/.test(t)) return "지배구조·임원 변경 관련 공시";
  if (/financial statement|audited|semi annual|quarterly|annual report/.test(t)) return "재무제표·감사보고서 관련 공시";
  if (/disclosure|công bố/.test(t) && /bcg|bamboo|land/.test(t)) return "BCG 공식 공시 업데이트";
  if (/vietnam.*economy.*(grew|growth|expanded)|gdp|economic growth/.test(t)) {
    const pct = title.match(/\d+(\.\d+)?\s*(per cent|percent|%)/i)?.[0]?.replace(/per cent/i, "%").replace(/percent/i, "%") || "";
    const quarter = /second quarter|q2/i.test(title) ? "2분기" : /first quarter|q1/i.test(title) ? "1분기" : /third quarter|q3/i.test(title) ? "3분기" : /fourth quarter|q4/i.test(title) ? "4분기" : "";
    return `베트남 경제 ${quarter ? quarter + " " : ""}${pct ? pct + " " : ""}성장 관련 동향`;
  }
  if (/prime minister|\bpm\b|deputy prime minister/.test(t)) return "베트남 총리·정부 지시 관련 정책 동향";
  if (/state bank|sbv|interest rate|exchange rate|credit|banking|monetary/.test(t)) return "베트남 금리·환율·은행권 금융시장 동향";
  if (/ministry of finance|tax|budget|fiscal|customs|fee|vat/.test(t)) return "베트남 재정·세무정책 관련 동향";
  if (/securities|stock|shares|listed|hose|hnx|upcom|trading/.test(t)) return "베트남 증권시장·상장사 공시 관련 동향";
  if (/bcg|bamboo capital|bcg land|bcg energy|tracodi|aaa insurance|nam a bank|sssg|king crown/.test(t)) return "BCG 그룹 및 관련사 공시·리스크 동향";
  if (/real estate|property|construction|infrastructure|project/.test(t)) return "베트남 부동산·건설시장 관련 동향";

  if (item.category === "GOVERNMENT_POLICY") return "베트남 정부정책 관련 주요 공지";
  if (item.category === "FINANCIAL_MARKET") return "베트남 금융시장 관련 주요 공지";
  if (item.category === "SECURITIES_BONDS") return "베트남 공시·채권시장 주요 동향";
  if (item.category === "BCG_GROUP_WATCH") return "BCG 그룹 관련 공시·경제뉴스";
  if (item.category === "VIETNAM_ECONOMIC_NEWS") return "베트남 경제뉴스 주요 동향";
  return "베트남 경제·정책 관련 수집 기사";
}

function koreanSummaryFallback(item) {
  const source = item.source_section || item.source_name || "해당 출처";
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
  if (isBcgItem(item)) return "BCG 그룹 유동성, 공시 신뢰도 또는 Hanwha 회수 리스크와의 관련성을 우선 확인해야 합니다.";
  return "일반 베트남 경제·정책 모니터링 대상입니다.";
}

function getItemDate(item) {
  const raw = item.published_at;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isWithinHours(item, hours) {
  const d = getItemDate(item);
  if (!d) return false;
  return d.getTime() >= Date.now() - hours * 60 * 60 * 1000;
}

function periodItems(period = state.filters.period) {
  const hours = PERIODS[period]?.hours || PERIODS.WEEKLY.hours;
  return state.items.filter((item) => isWithinHours(item, hours));
}

function isBcgItem(item) {
  return item.category === "BCG_GROUP_WATCH" || (item.company_tags || []).some((tag) => /BCG|Bamboo|SSSG|Nam A|TRACODI|AAA|King Crown|BCR/i.test(tag));
}

function isBcgOfficial(item) {
  return isBcgItem(item) && (item.source_type === "COMPANY_IR" || /Official IR|Bamboo Capital|BCG Land/i.test(`${item.source_name || ""} ${item.source_section || ""}`));
}


function isRecoveryRiskSignal(item) {
  const text = [
    item.title_original,
    item.title_ko,
    item.summary_ko,
    item.source_excerpt,
    item.source_section,
    ...(item.risk_tags || [])
  ].join(" ").toLowerCase();
  return isBcgItem(item) && (
    item.priority === "CRITICAL" ||
    Number(item.risk_score || 0) >= 75 ||
    /delisting|suspend|suspension|bond|interest|principal|debt|overdue|default|late financial|financial statement|resignation|governance|investigation|police|ministry of public security|collateral|pledge|receivable|asset sale|bankruptcy|liquidation|restructuring/.test(text)
  );
}

function isOfficial(item) {
  return Boolean(item.verified_by_official_source) || ["GOVERNMENT", "REGULATOR", "STOCK_EXCHANGE", "COMPANY_IR"].includes(item.source_type);
}

function gradeFromPriority(priority) {
  return PRIORITY_LABELS_KO[priority] || "보통";
}

function riskGrade(score = 0) {
  if (score >= 90) return "긴급";
  if (score >= 75) return "주의";
  if (score >= 55) return "관찰";
  return "낮음";
}

function credibilityGrade(item) {
  if (item.source_type === "COMPANY_IR") return "회사공시";
  if (["GOVERNMENT", "REGULATOR", "STOCK_EXCHANGE"].includes(item.source_type)) return "공식자료";
  if ((item.credibility_score || 0) >= 80) return "주요언론";
  return "보조출처";
}

function bestScore(item) {
  const priorityWeight = { CRITICAL: 4000, HIGH: 3000, MEDIUM: 2000, LOW: 1000 }[item.priority] || 0;
  const officialBoost = isOfficial(item) ? 250 : 0;
  const bcgBoost = isBcgItem(item) ? 350 : 0;
  const officialBcgBoost = isBcgOfficial(item) ? 450 : 0;
  const risk = Number(item.risk_score || 0) * 4;
  const credibility = Number(item.credibility_score || 0) * 2;
  const d = getItemDate(item);
  const periodHours = PERIODS[state.filters.period]?.hours || 168;
  const recency = d ? Math.max(0, periodHours - ((Date.now() - d.getTime()) / 36e5)) : 0;
  return priorityWeight + officialBoost + bcgBoost + officialBcgBoost + risk + credibility + recency;
}

function sortBestItems(items) {
  return [...items].sort((a, b) => {
    const bcgGroupPriority = Number(b.category === "BCG_GROUP_WATCH") - Number(a.category === "BCG_GROUP_WATCH");
    if (bcgGroupPriority) return bcgGroupPriority;

    const scoreDiff = bestScore(b) - bestScore(a);
    if (scoreDiff) return scoreDiff;
    return (getItemDate(b)?.getTime() || 0) - (getItemDate(a)?.getTime() || 0);
  });
}

function categoryFilterKey(item) {
  const category = item?.category || "UNCATEGORIZED";
  if (["GOVERNMENT_POLICY", "FINANCIAL_MARKET"].includes(category)) {
    return COMBINED_POLICY_MARKET_CATEGORY;
  }
  return category;
}

function categoryMatches(item, selectedCategory) {
  if (!selectedCategory || selectedCategory === "ALL") return true;
  return categoryFilterKey(item) === selectedCategory;
}

function populatePeriodButtons() {
  const periodButtons = $("periodButtons");
  if (!periodButtons) return;

  const counts = Object.fromEntries(Object.entries(PERIODS).map(([key, value]) => [key, state.items.filter((i) => isWithinHours(i, value.hours)).length]));
  periodButtons.innerHTML = Object.entries(PERIODS).map(([key, value]) => `
    <button class="period-chip${state.filters.period === key ? " active" : ""}" type="button" data-period="${key}" aria-pressed="${state.filters.period === key}">
      <strong>${value.label}</strong><span>${value.subLabel} · ${counts[key]}건</span>
    </button>
  `).join("");
}

function populateCategoryButtons() {
  const categoryButtons = $("categoryButtons");
  if (!categoryButtons) return;

  const baseItems = periodItems();
  const categories = unique(baseItems.map(categoryFilterKey)).filter((category) => category && category !== "ALL");

  if (state.filters.category !== "ALL" && !categories.includes(state.filters.category)) {
    state.filters.category = "ALL";
  }

  categoryButtons.innerHTML = "";

  const addButton = (category, count) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `filter-chip${state.filters.category === category ? " active" : ""}`;
    btn.dataset.category = category;
    btn.setAttribute("aria-pressed", String(state.filters.category === category));
    btn.textContent = `${label(category)} ${count}`;
    categoryButtons.appendChild(btn);
  };

  for (const c of categories) {
    addButton(c, baseItems.filter((item) => categoryFilterKey(item) === c).length);
  }
}

function populateFilters() {
  populatePeriodButtons();
  populateCategoryButtons();

  const sourceTypeFilter = $("sourceTypeFilter");
  if (!sourceTypeFilter) return;

  const sourceTypes = unique(state.items.map((i) => i.source_type));
  sourceTypeFilter.innerHTML = `<option value="ALL">전체 출처</option>`;
  for (const s of sourceTypes) {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = label(s);
    sourceTypeFilter.appendChild(opt);
  }
}

function setActivePeriod(period) {
  state.filters.period = period;
  state.filters.category = "ALL";
  document.querySelectorAll("#periodButtons .period-chip").forEach((btn) => {
    const isActive = btn.dataset.period === period;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });
  populateCategoryButtons();
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
  return periodItems().filter((item) => {
    const text = [
      item.title_original,
      displayTitle(item),
      displaySummary(item),
      displayImpact(item),
      item.source_name,
      item.source_section,
      item.category,
      item.source_type,
      ...(item.company_tags || []),
      ...(item.risk_tags || [])
    ].join(" ").toLowerCase();

    if (q && !text.includes(q)) return false;
    if (!categoryMatches(item, state.filters.category)) return false;
    if (state.filters.priority !== "ALL" && item.priority !== state.filters.priority) return false;
    if (state.filters.sourceType !== "ALL" && item.source_type !== state.filters.sourceType) return false;
    return true;
  });
}

function renderStats() {
  const daily = state.items.filter((i) => isWithinHours(i, 24));
  const weekly = state.items.filter((i) => isWithinHours(i, 168));
  const monthly = state.items.filter((i) => isWithinHours(i, 720));
  const visible = applyFilters();

  setText("totalCount", state.items.length);
  setText("dailyCount", daily.length);
  setText("weeklyCount", weekly.length);
  setText("monthlyCount", monthly.length);
  setText("criticalCount", visible.filter((i) => i.priority === "CRITICAL").length);
  setText("bcgCount", visible.filter(isBcgItem).length);

  const period = PERIODS[state.filters.period];
  setText("activePeriodLabel", `${period.label} · ${period.subLabel}`);
  setText("resultCount", `${sortBestItems(visible).slice(0, MAX_DISPLAY_ITEMS).length}건 표시`);
}

function renderRiskAlerts() {
  const base = periodItems();
  const bcgItems = sortBestItems(base.filter((item) => isBcgOfficial(item) || isRecoveryRiskSignal(item)));
  const highRisk = bcgItems.filter((item) => isRecoveryRiskSignal(item)).slice(0, 4);
  const officialCount = bcgItems.filter(isBcgOfficial).length;
  const riskAlertList = $("riskAlertList");
  const riskAlertSummary = $("riskAlertSummary");
  if (!riskAlertList || !riskAlertSummary) return;

  const period = PERIODS[state.filters.period];
  riskAlertSummary.textContent = `${period.label} 기준 · BCG 공식공시 ${officialCount}건 · 회수 리스크 신호 ${highRisk.length}건`;

  if (!highRisk.length) {
    riskAlertList.innerHTML = `
      <article class="alert-empty">
        <strong>현재 선택 기간 내 고위험 BCG 회수 리스크 신호 없음</strong>
        <p>BCG 공식공시는 아래 목록에서 별도 강조 카드로 확인할 수 있습니다.</p>
      </article>`;
    return;
  }

  riskAlertList.innerHTML = highRisk.map((item) => `
    <article class="alert-item ${item.priority === "CRITICAL" ? "critical" : ""}">
      <div>
        <div class="meta-line">
          <span>${escapeHtml(item.source_section || item.source_name || "BCG 관련 출처")}</span>
          <span>·</span>
          <span>${item.published_at ? formatDate(item.published_at, false) : "공시일 확인 필요"}</span>
        </div>
        <h3>${escapeHtml(displayTitle(item))}</h3>
        <p>${escapeHtml(displayImpact(item))}</p>
      </div>
      <a href="${escapeHtml(item.url || "#")}" target="_blank" rel="noopener noreferrer">원문</a>
    </article>
  `).join("");
}

function renderCards() {
  const cards = $("cards");
  if (!cards) return;
  const items = sortBestItems(applyFilters()).slice(0, MAX_DISPLAY_ITEMS);
  renderStats();
  renderRiskAlerts();

  if (!items.length) {
    cards.innerHTML = `<div class="empty">현재 기간·카테고리 조건에 맞는 항목이 없습니다. 주간 또는 월간 필터를 선택해 확인하세요.</div>`;
    return;
  }

  cards.innerHTML = items.map((item, index) => {
    const priority = escapeHtml(item.priority || "LOW");
    const priorityKo = PRIORITY_LABELS_KO[item.priority] || priority;
    const title = displayTitle(item);
    const summary = displaySummary(item);
    const showOriginal = item.title_original && item.title_original !== title;
    const officialBcg = isBcgOfficial(item);
    const bcg = isBcgItem(item);
    const cardType = officialBcg ? "bcg-official-card" : bcg ? "bcg-related-card" : "general-card";
    const cardLabel = officialBcg ? "BCG 공식공시" : bcg ? "BCG 관련" : "일반 뉴스";
    const riskTags = (item.risk_tags || []).slice(0, 3).map((t) => `<span class="badge">${escapeHtml(RISK_TAG_LABELS_KO.get(String(t).toLowerCase()) || t)}</span>`).join("");
    const companyTags = (item.company_tags || []).slice(0, 3).map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join("");

    return `
      <article class="card ${cardType} ${priority}">
        <div class="card-head">
          <div>
            <div class="meta-line">
              <span>${cardLabel}</span>
              <span>·</span>
              <span>${escapeHtml(item.source_name || "출처 미상")}</span>
              ${item.source_section ? `<span>·</span><span>${escapeHtml(item.source_section)}</span>` : ""}
              <span>·</span>
              <span>${escapeHtml(label(item.category || "미분류"))}</span>
              <span>·</span>
              <span>${item.published_at ? formatDate(item.published_at, false) : "공시일 확인 필요"}</span>
            </div>
            <h3><a href="${escapeHtml(item.url || "#")}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a></h3>
            ${showOriginal ? `<p class="original-title">원문 제목: ${escapeHtml(item.title_original)}</p>` : ""}
          </div>
          <div class="card-grade" aria-label="Article grades">
            <span class="grade-pill">중요도 <strong>${escapeHtml(gradeFromPriority(item.priority))}</strong></span>
            <span class="grade-pill">출처 <strong>${escapeHtml(credibilityGrade(item))}</strong></span>
            <span class="grade-pill">리스크 <strong>${escapeHtml(riskGrade(Number(item.risk_score || 0)))}</strong></span>
          </div>
        </div>
        <div class="badges">
          <span class="badge rank">#${index + 1}</span>
          <span class="badge priority ${priority}">${escapeHtml(priorityKo)}</span>
          ${isOfficial(item) ? `<span class="badge official">${escapeHtml(credibilityGrade(item))}</span>` : `<span class="badge media">언론</span>`}
          ${companyTags}${riskTags}
        </div>
        <p class="summary"><strong>핵심 요약</strong>${escapeHtml(summary)}</p>
      </article>
    `;
  }).join("");
}

async function init() {
  try {
    const res = await fetch(`data/news.json?ts=${Date.now()}`);
    const data = await res.json();
    state.items = Array.isArray(data.items) ? data.items.slice(0, MAX_DISPLAY_ITEMS) : [];
    setText("updatedAt", formatDate(data.updated_at));
    setText("summaryMode", data.openai_summary_enabled ? "OpenAI 한국어 번역·요약 사용" : "한국어 대체 요약 모드");
    populateFilters();
    renderCards();
  } catch (err) {
    setHtml("cards", `<div class="empty">data/news.json을 불러오지 못했습니다: ${escapeHtml(err.message)}</div>`);
  }

  on("periodButtons", "click", (e) => {
    const btn = e.target.closest("button[data-period]");
    if (!btn) return;
    setActivePeriod(btn.dataset.period);
    renderCards();
  });
  on("searchInput", "input", (e) => {
    state.filters.q = e.target.value;
    renderCards();
  });
  on("categoryButtons", "click", (e) => {
    const btn = e.target.closest("button[data-category]");
    if (!btn) return;
    setActiveCategory(btn.dataset.category);
    renderCards();
  });
  on("priorityFilter", "change", (e) => {
    state.filters.priority = e.target.value;
    renderCards();
  });
  on("sourceTypeFilter", "change", (e) => {
    state.filters.sourceType = e.target.value;
    renderCards();
  });
  on("resetBtn", "click", () => {
    state.filters = { period: "DAILY", q: "", category: "ALL", priority: "ALL", sourceType: "ALL" };
    const searchInput = $("searchInput");
    const priorityFilter = $("priorityFilter");
    const sourceTypeFilter = $("sourceTypeFilter");
    if (searchInput) searchInput.value = "";
    if (priorityFilter) priorityFilter.value = "ALL";
    if (sourceTypeFilter) sourceTypeFilter.value = "ALL";
    setActivePeriod("DAILY");
    setActiveCategory("ALL");
    renderCards();
  });
}

init();
