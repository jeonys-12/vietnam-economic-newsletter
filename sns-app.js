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
  return ({ active: "자동수집", partial: "일부수집", error: "오류", not_configured: "설정 필요", links_only: "지정 페이지", search_links: "검색형" })[status] || status || "확인 필요";
}

function renderSnsStatus(channels = {}) {
  const target = snsById("snsStatusGrid");
  if (!target) return;
  const configs = [
    ["youtube", "YouTube", channels.youtube],
    ["facebook", "Facebook", channels.facebook],
    ["tiktok", "TikTok", channels.tiktok],
    ["x", "X", channels.x]
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
    target.innerHTML = `<div class="sns-empty"><strong>자동수집된 SNS 게시물이 없습니다.</strong><span>YouTube API 키 또는 Facebook 승인 설정을 확인하세요. TikTok과 X 공개 검색 기능은 계속 사용할 수 있습니다.</span></div>`;
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

document.addEventListener("DOMContentLoaded", () => {
  loadSnsData();
});
