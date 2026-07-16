const SNS_REPORTS_KEY = "vietnam-bcg-zalo-reports-v1";

const snsById = (id) => document.getElementById(id);

function snsEscape(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function snsFormatDate(value) {
  if (!value) return "일자 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function snsStatusLabel(status) {
  return ({ active: "자동수집", partial: "일부수집", error: "오류", not_configured: "설정 필요", links_only: "지정 페이지", search_links: "검색형", local_reports: "현지 제보" })[status] || status || "확인 필요";
}

function renderSnsStatus(channels = {}) {
  const target = snsById("snsStatusGrid");
  if (!target) return;
  const configs = [
    ["youtube", "YouTube", channels.youtube],
    ["facebook", "Facebook", channels.facebook],
    ["tiktok", "TikTok", channels.tiktok],
    ["zalo", "Zalo", channels.zalo]
  ];
  target.innerHTML = configs.map(([key, name, info = {}]) => `
    <article class="sns-status ${snsEscape(info.status || "unknown")}">
      <span>${snsEscape(name)}</span>
      <strong>${snsEscape(snsStatusLabel(info.status))}</strong>
      <small>${snsEscape(info.message || "상태 정보 없음")}${Number.isFinite(info.count) ? ` · ${info.count}건` : ""}</small>
    </article>
  `).join("");
}

function renderFacebookPages(pages = []) {
  const target = snsById("facebookPageList");
  if (!target) return;
  target.innerHTML = pages.length ? pages.map((page) => `
    <a href="${snsEscape(page.url || "https://www.facebook.com/")}" target="_blank" rel="noopener noreferrer">${snsEscape(page.name || "Facebook Page")}</a>
  `).join("") : `<span>지정 페이지 정보는 다음 자동수집 후 표시됩니다.</span>`;
}

function renderAutoItems(items = []) {
  const target = snsById("snsAutoList");
  if (!target) return;
  if (!items.length) {
    target.innerHTML = `<div class="sns-empty"><strong>수집된 SNS 게시물이 없습니다.</strong><span>YouTube API 키 또는 Facebook 승인 설정을 확인하세요. 검색·제보 기능은 계속 사용할 수 있습니다.</span></div>`;
    return;
  }
  target.innerHTML = items.slice(0, 50).map((item) => `
    <article class="sns-feed-card ${snsEscape(String(item.platform || "").toLowerCase())}">
      ${item.thumbnail ? `<img src="${snsEscape(item.thumbnail)}" alt="" loading="lazy" />` : ""}
      <div>
        <div class="sns-feed-meta"><span>${snsEscape(item.platform || "SNS")}</span><span>${snsEscape(item.author || "작성자 미상")}</span><span>${snsFormatDate(item.published_at)}</span></div>
        <h4><a href="${snsEscape(item.url || "#")}" target="_blank" rel="noopener noreferrer">${snsEscape(item.title || "제목 없음")}</a></h4>
        <p>${snsEscape(item.summary || "요약 없음")}</p>
        <div class="sns-feed-tags"><span>리스크 ${Number(item.risk_score || 0)}</span>${(item.risk_tags || []).slice(0, 4).map((tag) => `<span>${snsEscape(tag)}</span>`).join("")}</div>
      </div>
    </article>
  `).join("");
}

async function loadSnsData() {
  try {
    const response = await fetch(`data/sns.json?ts=${Date.now()}`);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const data = await response.json();
    const updated = snsById("snsUpdatedAt");
    if (updated) updated.textContent = data.updated_at ? `최근 수집 ${snsFormatDate(data.updated_at)}` : "자동수집 전";
    renderSnsStatus(data.channels || {});
    renderFacebookPages(data.channels?.facebook?.pages || []);
    renderAutoItems(Array.isArray(data.items) ? data.items : []);
  } catch (error) {
    renderAutoItems([]);
    const updated = snsById("snsUpdatedAt");
    if (updated) updated.textContent = `SNS 데이터 로드 실패: ${error.message}`;
  }
}

function loadReports() {
  try {
    const value = JSON.parse(localStorage.getItem(SNS_REPORTS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

function saveReports(reports) {
  localStorage.setItem(SNS_REPORTS_KEY, JSON.stringify(reports));
}

function renderReports() {
  const target = snsById("zaloReportList");
  if (!target) return;
  const reports = loadReports();
  if (!reports.length) {
    target.innerHTML = `<div class="sns-empty"><strong>등록된 현지 제보가 없습니다.</strong><span>같은 브라우저에만 저장되므로 정기적으로 JSON을 내보내 백업하세요.</span></div>`;
    return;
  }
  target.innerHTML = reports.map((report) => `
    <article class="zalo-report-card">
      <div><strong>${snsEscape(report.title)}</strong><span>${snsEscape(report.reporter || "제보자 미상")} · ${snsFormatDate(report.observed_at)}</span></div>
      <p>${snsEscape(report.summary)}</p>
      <div class="sns-feed-tags"><span>${snsEscape(report.risk_type)}</span><span>${snsEscape(report.verification)}</span></div>
      ${report.url ? `<a href="${snsEscape(report.url)}" target="_blank" rel="noopener noreferrer">원문 열기</a>` : ""}
      <button type="button" data-delete-report="${snsEscape(report.id)}">삭제</button>
    </article>
  `).join("");
}

function initZaloReports() {
  const form = snsById("zaloReportForm");
  if (form) form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const report = {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}`,
      platform: "ZALO",
      title: String(formData.get("title") || "").trim(),
      summary: String(formData.get("summary") || "").trim(),
      reporter: String(formData.get("reporter") || "").trim(),
      observed_at: String(formData.get("observed_at") || new Date().toISOString()),
      risk_type: String(formData.get("risk_type") || "기타"),
      verification: String(formData.get("verification") || "미확인"),
      url: String(formData.get("url") || "").trim(),
      saved_at: new Date().toISOString()
    };
    if (!report.title || !report.summary) return;
    const reports = loadReports();
    reports.unshift(report);
    saveReports(reports.slice(0, 100));
    form.reset();
    const dateInput = form.querySelector('[name="observed_at"]');
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 16);
    renderReports();
  });

  snsById("zaloReportList")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-delete-report]");
    if (!button) return;
    saveReports(loadReports().filter((report) => report.id !== button.dataset.deleteReport));
    renderReports();
  });

  snsById("exportZaloReports")?.addEventListener("click", () => {
    const blob = new Blob([`${JSON.stringify(loadReports(), null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zalo-local-reports-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  const dateInput = form?.querySelector('[name="observed_at"]');
  if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 16);
  renderReports();
}

document.addEventListener("DOMContentLoaded", () => {
  loadSnsData();
  initZaloReports();
});
