const state = {
  dates: [],
  latest: "",
  date: "",
  snapshot: null,
  query: "",
};

const dateSelect = document.getElementById("dateSelect");
const searchInput = document.getElementById("searchInput");
const snapshotDate = document.getElementById("snapshotDate");
const statusGrid = document.getElementById("statusGrid");
const limitations = document.getElementById("limitations");
const potentialCount = document.getElementById("potentialCount");
const potentialList = document.getElementById("potentialList");
const top10List = document.getElementById("top10List");
const downloadGrowthList = document.getElementById("downloadGrowthList");
const starGrowthList = document.getElementById("starGrowthList");
const newList = document.getElementById("newList");
const droppedList = document.getElementById("droppedList");
const tableWrap = document.getElementById("tableWrap");
const resultCount = document.getElementById("resultCount");

function fmtNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "n/a";
  return new Intl.NumberFormat("zh-CN").format(Number(value));
}

function fmtDelta(value) {
  if (value === null || value === undefined) return "n/a";
  return value > 0 ? `+${fmtNumber(value)}` : fmtNumber(value);
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function rankText(item) {
  if (item.prev_rank === null || item.prev_rank === undefined) return "历史缺失";
  if (item.rank_change === 0) return "持平";
  if (item.rank_change > 0) return `上升 ${item.rank_change}`;
  return `下降 ${Math.abs(item.rank_change)}`;
}

function metric(label, value, cls = "") {
  return `<span class="metric ${esc(cls)}">${esc(label)}: ${esc(value)}</span>`;
}

function potentialItems(items) {
  const hasHistory = items.some((item) => item.download_delta !== null || item.star_delta !== null || item.prev_rank !== null);
  if (!hasHistory) return [];

  const byDownload = [...items]
    .filter((item) => Number.isFinite(item.download_delta))
    .sort((a, b) => b.download_delta - a.download_delta || a.rank - b.rank)
    .slice(0, 20);
  const byStar = [...items]
    .filter((item) => Number.isFinite(item.star_delta))
    .sort((a, b) => b.star_delta - a.star_delta || a.rank - b.rank)
    .slice(0, 30);
  const downloadKeys = new Set(byDownload.map((item) => item.compare_key));
  const starKeys = new Set(byStar.map((item) => item.compare_key));

  return items
    .map((item) => {
      const reasons = [];
      if (item.prev_rank === null && hasHistory) reasons.push("新进 Top100");
      if (downloadKeys.has(item.compare_key) && starKeys.has(item.compare_key)) reasons.push("下载 Top20 + 星标 Top30");
      if (item.rank_change >= 8) reasons.push("排名上升 >= 8");
      return { ...item, potential_reasons: reasons };
    })
    .filter((item) => item.potential_reasons.length)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 10);
}

function advice(item) {
  if (item.potential_reasons?.includes("新进 Top100")) return "新进榜，先看 README 和权限范围，别急着装。";
  if ((item.download_delta || 0) > 0 && (item.star_delta || 0) > 0) return "下载和星标一起涨，值得跟踪新版和用户反馈。";
  if ((item.rank_change || 0) >= 8) return "排名突然上升，看看是不是踩中了新场景。";
  return "先放进观察名单，看增长能不能连续两天。";
}

function renderStatus(snapshot) {
  const items = snapshot.items || [];
  const top = items[0];
  const basis = snapshot.comparison_basis || {};
  const cards = [
    ["快照", snapshot.snapshot_date || state.date],
    ["Top100", `${fmtNumber(items.length)} 条`],
    ["第一名", top ? top.name : "n/a"],
    ["历史对比", basis.strict_daily ? "严格日环比" : "非严格"],
    ["分页", `${snapshot.source?.pages_succeeded || 0}/${snapshot.source?.pages_requested || 4}`],
  ];
  statusGrid.innerHTML = cards.map(([label, value]) => `<div class="status-card"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join("");
}

function renderLimitations(snapshot) {
  const list = snapshot.limitations || [];
  const basis = snapshot.comparison_basis?.note;
  const lines = [...list];
  if (basis && !lines.includes(basis)) lines.unshift(basis);
  limitations.innerHTML = lines.length
    ? lines.map((line) => `<div>${esc(line)}</div>`).join("")
    : "<div>暂无已知限制。</div>";
}

function skillCard(item, withAdvice = false) {
  const deltaCls = (item.rank_change || 0) >= 0 ? "up" : "down";
  return `
    <article class="skill-card">
      <div class="skill-title">
        <span class="rank">#${esc(item.rank)}</span>
        <strong>${esc(item.name)}</strong>
        <span class="slug">${esc(item.author)} / ${esc(item.slug || item.compare_key)}</span>
      </div>
      <div class="metrics">
        ${metric("下载", fmtNumber(item.downloads))}
        ${metric("星标", fmtNumber(item.stars))}
        ${metric("下载增量", fmtDelta(item.download_delta), "up")}
        ${metric("星标增量", fmtDelta(item.star_delta), "up")}
        ${metric("排名", rankText(item), deltaCls)}
      </div>
      ${item.potential_reasons?.length ? `<p class="summary">命中：${esc(item.potential_reasons.join("；"))}</p>` : ""}
      ${withAdvice ? `<p class="summary">建议：${esc(advice(item))}</p>` : ""}
      ${item.summary ? `<p class="summary">${esc(item.summary)}</p>` : ""}
    </article>
  `;
}

function rankRow(item, value) {
  return `
    <div class="rank-row">
      <span class="rank">#${esc(item.rank)}</span>
      <span class="name">
        <strong>${esc(item.name)}</strong>
        <small>${esc(item.author)} / ${esc(item.slug || item.compare_key)}</small>
      </span>
      <span class="value">${esc(value)}</span>
    </div>
  `;
}

function renderRankList(el, items, valueFn, emptyText) {
  el.innerHTML = items.length
    ? items.map((item) => rankRow(item, valueFn(item))).join("")
    : `<div class="empty">${emptyText}</div>`;
}

function growthItems(items, field) {
  return [...items]
    .filter((item) => Number.isFinite(item[field]))
    .sort((a, b) => b[field] - a[field] || a.rank - b.rank)
    .slice(0, 10);
}

function filteredItems(items) {
  const q = state.query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => `${item.name} ${item.author} ${item.slug} ${item.summary || ""}`.toLowerCase().includes(q));
}

function renderTable(items) {
  const visible = filteredItems(items);
  resultCount.textContent = `${fmtNumber(visible.length)} 条`;
  const rows = visible.map((item) => `
    <tr>
      <td class="num">#${esc(item.rank)}</td>
      <td><strong>${esc(item.name)}</strong><br><small>${esc(item.author)} / ${esc(item.slug || item.compare_key)}</small></td>
      <td class="num">${esc(fmtNumber(item.downloads))}</td>
      <td class="num">${esc(fmtNumber(item.stars))}</td>
      <td class="num">${esc(fmtDelta(item.download_delta))}</td>
      <td class="num">${esc(fmtDelta(item.star_delta))}</td>
      <td>${esc(rankText(item))}</td>
    </tr>
  `).join("");

  tableWrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>排名</th>
          <th>Skill</th>
          <th>下载</th>
          <th>星标</th>
          <th>下载增量</th>
          <th>星标增量</th>
          <th>排名变化</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="7">没有匹配结果。</td></tr>`}</tbody>
    </table>
  `;
}

function droppedItems(snapshot) {
  return snapshot.dropped_items || [];
}

function render(snapshot) {
  const items = snapshot.items || [];
  const potentials = potentialItems(items);
  snapshotDate.textContent = snapshot.snapshot_date || state.date;
  renderStatus(snapshot);
  renderLimitations(snapshot);

  potentialCount.textContent = potentials.length ? `${potentials.length} 个` : "今日无新增潜力skill";
  potentialList.innerHTML = potentials.length
    ? potentials.map((item) => skillCard(item, true)).join("")
    : `<div class="empty">今日无新增潜力skill</div>`;

  top10List.innerHTML = items.slice(0, 10).map((item) => skillCard(item)).join("");
  renderRankList(downloadGrowthList, growthItems(items, "download_delta"), (item) => fmtDelta(item.download_delta), "缺少历史切片，无法计算下载增速。");
  renderRankList(starGrowthList, growthItems(items, "star_delta"), (item) => fmtDelta(item.star_delta), "缺少历史切片，无法计算星标增速。");
  const hasHistory = items.some((item) => item.prev_rank !== null);
  renderRankList(newList, items.filter((item) => item.prev_rank === null && hasHistory).slice(0, 20), () => "新进", hasHistory ? "今日无新进榜。" : "无，或因缺少历史切片无法判断。");
  renderRankList(droppedList, droppedItems(snapshot), (item) => `原 #${item.rank}`, hasHistory ? "今日无掉榜。" : "无，或因缺少历史切片无法判断。");
  renderTable(items);
}

async function loadJson(path) {
  const res = await fetch(`${path}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

async function init() {
  const dates = await loadJson("./data/dates.json");
  state.dates = dates.dates || [];
  state.latest = dates.latest || state.dates[0];

  const url = new URL(window.location.href);
  const requested = url.searchParams.get("date");
  state.date = state.dates.includes(requested) ? requested : state.latest;

  dateSelect.innerHTML = state.dates.map((date) => `<option value="${esc(date)}">${esc(date)}</option>`).join("");
  dateSelect.value = state.date;

  const snapshot = await loadJson(`./data/snapshots/${state.date}.json`);
  state.snapshot = snapshot;
  render(snapshot);
}

dateSelect.addEventListener("change", () => {
  const url = new URL(window.location.href);
  url.searchParams.set("date", dateSelect.value);
  window.location.href = url.toString();
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  if (state.snapshot) renderTable(state.snapshot.items || []);
});

init().catch((error) => {
  document.body.innerHTML = `<main class="shell"><section class="panel"><div class="empty">加载失败：${esc(error.message)}</div></section></main>`;
});
