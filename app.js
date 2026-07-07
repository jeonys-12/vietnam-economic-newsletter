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

function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "date unavailable";
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
  return String(value).replaceAll("_", " ");
}

function populateFilters() {
  const categories = unique(state.items.map((i) => i.category));
  const sourceTypes = unique(state.items.map((i) => i.source_type));

  for (const c of categories) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = label(c);
    $("categoryFilter").appendChild(opt);
  }
  for (const s of sourceTypes) {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = label(s);
    $("sourceTypeFilter").appendChild(opt);
  }
}

function applyFilters() {
  const q = state.filters.q.toLowerCase().trim();
  return state.items.filter((item) => {
    const text = [
      item.title_original,
      item.title_ko,
      item.summary_ko,
      item.impact_ko,
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
    cards.innerHTML = `<div class="empty">No items match the current filters.</div>`;
    return;
  }

  cards.innerHTML = items.map((item) => {
    const priority = escapeHtml(item.priority || "LOW");
    const tags = [
      `<span class="badge priority ${priority}">${priority}</span>`,
      item.verified_by_official_source ? `<span class="badge official">OFFICIAL</span>` : "",
      ...(item.company_tags || []).map((t) => `<span class="badge">${escapeHtml(t)}</span>`),
      ...(item.risk_tags || []).slice(0, 5).map((t) => `<span class="badge">${escapeHtml(t)}</span>`)
    ].join("");

    return `
      <article class="card ${priority}">
        <div class="card-top">
          <div>
            <div class="meta">
              <span>${escapeHtml(item.source_name || "Unknown source")}</span>
              <span>·</span>
              <span>${escapeHtml(label(item.category || "UNCATEGORIZED"))}</span>
              <span>·</span>
              <span>${formatDate(item.published_at || item.collected_at)}</span>
            </div>
            <h3><a href="${escapeHtml(item.url || "#")}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title_ko || item.title_original || "Untitled")}</a></h3>
            <div class="badges">${tags}</div>
          </div>
          <div class="score">
            Credibility <strong>${Number(item.credibility_score || 0)}</strong>
            Risk <strong>${Number(item.risk_score || 0)}</strong>
          </div>
        </div>
        <p class="summary">${escapeHtml(item.summary_ko || item.source_excerpt || "No summary available.")}</p>
        <p class="impact"><strong>Hanwha / Vietnam impact:</strong> ${escapeHtml(item.impact_ko || "추가 확인 필요")}</p>
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
    $("summaryMode").textContent = data.openai_summary_enabled ? "OpenAI summary enabled" : "Fallback summary mode";
    populateFilters();
    renderCards();
  } catch (err) {
    $("cards").innerHTML = `<div class="empty">Failed to load data/news.json: ${escapeHtml(err.message)}</div>`;
  }

  $("searchInput").addEventListener("input", (e) => {
    state.filters.q = e.target.value;
    renderCards();
  });
  $("categoryFilter").addEventListener("change", (e) => {
    state.filters.category = e.target.value;
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
    $("categoryFilter").value = "ALL";
    $("priorityFilter").value = "ALL";
    $("sourceTypeFilter").value = "ALL";
    renderCards();
  });
}

init();
