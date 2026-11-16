#!/usr/bin/env node
/**
 * Static site builder — no dependencies.
 * Reads src/data/*.json + src/assets, writes plain HTML into dist/.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");

const readJson = (p) => JSON.parse(readFileSync(join(SRC, "data", p), "utf8"));
const site = readJson("site.json");
const photos = readJson("photos.json");
const journal = readJson("journal.json");
const about = readJson("about.json");

/* ------------------------------------------------------------------ helpers */
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const icon = (name, size = 16) => {
  const paths = {
    box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    notebook: '<path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4"/><path d="M2 6h4"/><path d="M2 10h4"/><path d="M2 14h4"/><path d="M2 18h4"/><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/>',
    user: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    arrowUpRight: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    menu: '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    timer: '<line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>',
    aperture: '<circle cx="12" cy="12" r="10"/><path d="m14.31 8 5.74 9.94"/><path d="M9.69 8h11.48"/><path d="m7.38 12 5.74-9.94"/><path d="M9.69 16 3.95 6.06"/><path d="M14.31 16H2.83"/><path d="m16.62 12-5.74 9.94"/>',
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    rss: '<path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    layout: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
    pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
};

const attr = (obj) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => (v === true ? k : `${k}="${esc(v)}"`))
    .join(" ");

/* ------------------------------------------------------------------- layout */
function head({ title, description, extraCss = [], bodyClass = "", preload = [] }) {
  const css = ["/assets/css/site.css", ...extraCss];
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#e9e8df" />
    <meta name="description" content="${esc(description)}" />
    <meta name="generator" content="static build" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:type" content="website" />
    <link rel="icon" type="image/svg+xml" href="/assets/img/favicon.svg" />
    ${preload.map((p) => `<link rel="preload" as="image" href="${esc(p)}" />`).join("\n    ")}
    ${css.map((c) => `<link rel="stylesheet" href="${esc(c)}" />`).join("\n    ")}
    <title>${esc(title)}</title>
  </head>
  <body${bodyClass ? ` class="${esc(bodyClass)}"` : ""}>
`;
}

const tail = (scripts = []) => `    ${scripts.map((s) => `<script src="${esc(s)}" defer></script>`).join("\n    ")}
  </body>
</html>
`;

function mobileNav(activeKey, items) {
  return `<div id="mobile-navigation" class="mobile-nav-overlay" role="dialog" aria-modal="true" aria-label="移动端导航菜单" aria-hidden="true">
      <div class="mobile-nav-content">
        <div class="mobile-nav-heading">
          <span>NAVIGATION</span>
          <button type="button" aria-label="关闭导航菜单" data-nav-close>${icon("x", 22)}</button>
        </div>
        <nav aria-label="移动端主导航">
          ${items
            .map(
              (it, i) =>
                `<a href="${it.href}"${it.key === activeKey ? ' aria-current="page"' : ""}><span>${String(i + 1).padStart(2, "0")}</span>${esc(it.text)}${icon("arrowUpRight", 15)}</a>`
            )
            .join("\n          ")}
        </nav>
      </div>
    </div>`;
}

function topbar(activeKey) {
  return `<header class="page-topbar" data-topbar>
      <a class="brand" href="/" aria-label="${esc(site.brand)} 首页">
        <img alt="" src="/assets/img/brand-logo.svg" />
        <span class="sr-only">${esc(site.brand)}</span>
      </a>
      <nav aria-label="主导航">
        ${site.nav
          .map(
            (it) =>
              `<a href="${it.href}"${it.key === activeKey ? ' class="is-active" aria-current="page"' : ""}>${esc(it.text)}</a>`
          )
          .join("\n        ")}
      </nav>
      <button type="button" class="mobile-nav-button" aria-label="打开导航菜单" aria-expanded="false" aria-controls="mobile-navigation" data-nav-open>${icon("menu", 22)}</button>
    </header>
    ${mobileNav(activeKey, site.nav)}`;
}

const headingBar = (title, total, unit) => `<section class="page-heading-bar" aria-label="${esc(title)}页面信息">
      <h1>${esc(title)}</h1>
      <span class="page-content-total" aria-live="polite"><strong>${total}</strong> ${esc(unit)}</span>
    </section>`;

/* -------------------------------------------------------------- home page */
function renderHome() {
  const recent = journal.posts.slice(0, 5);
  const stats = site.stats
    .map((s) => `<div><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`)
    .join("\n            ");

  const feed = recent
    .map((p, i) => {
      const idx = String(i + 1).padStart(2, "0");
      return `<a class="qc-feed-item" href="/journal/${esc(p.slug)}.html">
              <span class="qc-feed-index">${idx}</span>
              <span class="qc-feed-body">
                <span class="qc-feed-meta"><b>拾记</b>${esc(p.date.replaceAll("-", "."))}</span>
                <h3>${esc(p.title)}</h3>
                <p>${esc(p.summary)}</p>
              </span>
              <span class="qc-feed-thumb"><img src="${esc(p.cover)}" alt="" loading="lazy" width="54" height="42" /></span>
            </a>`;
    })
    .join("\n            ");

  const travelCards = site.travelStrip.items
    .map(
      (t) => `<a class="qc-travel-card" href="/moments.html">
              <img src="${esc(t.img)}" alt="" loading="lazy" />
              <span class="qc-travel-card-body">
                <strong>${esc(t.title)}</strong>
                <span>${esc(t.date)} · ${esc(t.place)}</span>
              </span>
            </a>`
    )
    .join("\n          ");

  const calendar = renderCalendar();

  return (
    head({
      title: site.title,
      description: site.description,
      preload: [site.heroPhoto.src],
    }) +
    `<main class="qc-page" data-home>
      <div class="qc-outside-label" aria-hidden="true">
        <span>${esc(site.brand)} — A PERSONAL COLLECTION</span>
        <span>TAKE A MOMENT. STAY A LITTLE.</span>
      </div>

      <article class="qc-board paper-grain">
        <header class="qc-header">
          <a class="qc-brand" href="/" aria-label="${esc(site.brand)} 首页">
            <img alt="" src="/assets/img/brand-logo.svg" />
            <span><strong>${esc(site.brand)}</strong><small>${esc(site.brandCn)}</small></span>
          </a>

          <div class="qc-navigation-fold">
            <nav aria-label="主导航">
              ${site.nav
                .map(
                  (it) =>
                    `<a href="${it.href}"${it.key === "home" ? ' class="is-active" aria-current="page"' : ""}>${icon(navIcon(it.key), 13)}${esc(it.text)}</a>`
                )
                .join("\n              ")}
            </nav>
          </div>

          <div class="qc-header-actions">
            <button class="qc-light-switch" type="button" aria-label="点亮暖光" aria-pressed="false" data-light>${icon("sun", 15)}</button>
            <details class="qc-more-nav">
              <summary aria-label="更多导航">${icon("menu", 15)}</summary>
              <nav aria-label="更多导航">
                ${site.nav.map((it) => `<a href="${it.href}">${esc(it.text)}</a>`).join("\n                ")}
              </nav>
            </details>
          </div>
        </header>

        <nav class="qc-mobile-tabs" aria-label="画布分区">
          <button type="button" aria-pressed="true" data-tab="canvas">画布</button>
          <button type="button" aria-pressed="false" data-tab="feed">新近文章</button>
          <button type="button" aria-pressed="false" data-tab="left">絮语</button>
          <a href="/moments.html">随影</a>
          <a href="/journal.html">拾记</a>
        </nav>

        <div class="qc-body">
          <aside class="qc-left">
            <nav class="qc-left-tabs" aria-label="站点概览分区">
              <button type="button" aria-pressed="false" data-panel-tab="notice">公告</button>
              <button type="button" aria-pressed="true" data-panel-tab="calendar">日历</button>
              <button type="button" aria-pressed="false" data-panel-tab="stats">统计</button>
            </nav>

            <section class="qc-notice" data-panel="notice">
              <span class="qc-notice-pin" aria-hidden="true"></span>
              <header><span>${esc(site.notice.label)}</span>${icon("sparkles", 13)}</header>
              <h2>${esc(site.notice.title)}</h2>
              <p>${esc(site.notice.text)}</p>
              <button type="button" data-notice-open>展开这张便签 ${icon("arrowUpRight", 12)}</button>
            </section>

            ${calendar}

            <div class="qc-stats" data-panel="stats" hidden>
              ${stats}
            </div>
          </aside>

          <section class="qc-center">
            <div>
              <p class="qc-eyebrow">${esc(site.eyebrow)}</p>
              <h1 class="qc-hero-title" data-headline>${esc(site.headlines[0])}</h1>
              <p class="qc-hero-sub">${esc(site.subline)}</p>
            </div>

            <div class="qc-stage">
              <figure class="qc-polaroid">
                <img src="${esc(site.heroPhoto.src)}" alt="${esc(site.heroPhoto.title)}" width="1400" height="1000" />
                <figcaption>
                  <span><span>${esc(site.heroPhoto.caption)}</span><strong>${esc(site.heroPhoto.title)}</strong></span>
                </figcaption>
              </figure>

              <a class="qc-whisper-note" href="/journal.html#whispers">
                <header><strong>${esc(site.recentNote.title)}</strong><span>${esc(site.recentNote.hint)}</span></header>
                <p>${esc(site.recentNote.text)}</p>
                <footer><span>${esc(site.recentNote.date.replaceAll("-", ""))}</span><span>读这一刻 ${icon("arrowUpRight", 11)}</span></footer>
              </a>

              <div class="qc-seal" aria-hidden="true">
                <div>${icon("box", 22)}<span>SLOW DAYS<br />GOOD THINGS</span></div>
              </div>
            </div>

            <div class="qc-pager">
              <button type="button" aria-label="上一句" data-pager="prev">${icon("arrowLeft", 14)}</button>
              <button type="button" aria-label="随机一句" data-pager="random">${icon("sparkles", 14)}</button>
              <button type="button" aria-label="下一句" data-pager="next">${icon("arrowRight", 14)}</button>
              <p data-pager-note>${esc(site.pager[0])}</p>
            </div>
          </section>

          <aside class="qc-right">
            <div class="qc-right-head">
              <div>
                <span>FRESH INK / RECENT STORIES</span>
                <h2>新近写下 ${icon("sparkles", 15)}</h2>
              </div>
              <span>${String(journal.posts.length).padStart(2, "0")}</span>
            </div>

            <div class="qc-feed">
              ${feed}
            </div>

            <div class="qc-feed-more">
              <span>还有很多故事，留给慢慢阅读</span>
              <a href="/journal.html">去拾记 ${icon("arrowUpRight", 12)}</a>
            </div>
          </aside>
        </div>

        <section class="qc-travel">
          <div class="qc-travel-head">
            <div class="qc-travel-head-left">
              ${icon("route", 17)}
              <h2>${esc(site.travelStrip.title)}</h2>
              <span>${esc(site.travelStrip.eyebrow)}</span>
            </div>
            <a href="/moments.html">最近出发 ${icon("arrowUpRight", 12)}</a>
          </div>
          <div class="qc-travel-strip">
            ${travelCards}
          </div>
        </section>

        <footer class="qc-footer">
          <span>© ${esc(site.footer.since)} ${esc(site.footer.owner)} · 版权所有 · ${esc(site.footer.icp)}</span>
          <div class="qc-footer-tools">
            <a href="/journal.html" aria-label="拾记">${icon("layout", 14)}</a>
            <a href="/moments.html" aria-label="随影">${icon("grid", 14)}</a>
          </div>
        </footer>
      </article>
    </main>

    ${renderNoticeModal()}
    <script type="application/json" id="headline-data">${JSON.stringify(site.headlines).replace(/</g, "\\u003c")}</script>
    <script type="application/json" id="pager-data">${JSON.stringify(site.pager).replace(/</g, "\\u003c")}</script>
` +
    tail(["/assets/js/site.js", "/assets/js/home.js"])
  );
}

const navIcon = (key) => ({ home: "home", moments: "camera", journal: "notebook", about: "user" })[key] || "arrowUpRight";

function renderCalendar() {
  // A deterministic month grid built from the post + photo dates.
  const dates = new Map();
  const bump = (d, key) => {
    if (!d) return;
    if (!dates.has(d)) dates.set(d, { article: 0, photo: 0, code: 0 });
    dates.get(d)[key] += 1;
  };
  journal.posts.forEach((p) => bump(p.date, "article"));
  photos.photos.forEach((p) => bump(p.date, "photo"));

  const today = new Date("2026-11-16T00:00:00+08:00");
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday-first

  const solar = {
    "11-07": "立冬",
    "11-22": "小雪",
  };

  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<span aria-hidden="true"></span>');

  let updatedCount = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const hit = dates.get(iso);
    const total = hit ? hit.article + hit.photo + hit.code : 0;
    const isToday = day === today.getDate();
    const term = solar[iso.slice(5)];
    const cls = [isToday ? "is-today" : "", total ? "has-update" : ""].filter(Boolean).join(" ");
    const label = `${iso}${term ? ` ${term}` : ""}，文章 ${hit?.article || 0} 篇，图片 ${hit?.photo || 0} 张，维护 ${hit?.code || 0} 次`;
    const heat = hit
      ? `<span class="qc-calendar-heat" aria-hidden="true">${["article", "photo", "code"]
          .map((k) => `<i class="heat-${k}" style="opacity:${hit[k] ? Math.min(1, 0.35 + hit[k] * 0.25) : 0}"></i>`)
          .join("")}</span>`
      : "";
    if (total) updatedCount++;
    cells.push(
      `<button type="button" class="${cls}" title="${esc(label)}" aria-label="${esc(label)}" aria-pressed="false"><span class="qc-calendar-date" aria-hidden="true">${day}${
        term ? `<small>${term}</small>` : ""
      }</span>${heat}</button>`
    );
  }

  return `<section class="qc-calendar" aria-label="站点更新日历" data-panel="calendar">
              <header class="qc-section-heading">
                <div>
                  <span>02 / EVERY LITTLE UPDATE</span>
                  <div class="qc-calendar-title"><h2>更新日历</h2></div>
                </div>
                <div class="qc-month-control">
                  <button type="button" aria-label="上一个月" disabled>${icon("chevronLeft", 13)}</button>
                  <span>${year}.${String(month + 1).padStart(2, "0")}</span>
                  <button type="button" aria-label="下一个月" disabled>${icon("chevronRight", 13)}</button>
                </div>
              </header>
              <div class="qc-weekdays" aria-hidden="true">
                <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
              </div>
              <div class="qc-calendar-days">
                ${cells.join("")}
              </div>
              <div class="qc-calendar-legend">
                <ul>
                  <li><i class="heat-article"></i>文章</li>
                  <li><i class="heat-photo"></i>图片</li>
                  <li><i class="heat-code"></i>维护</li>
                </ul>
                <span>${updatedCount} 次更新</span>
              </div>
            </section>`;
}

function renderNoticeModal() {
  return `<div class="modal" id="notice-modal" role="dialog" aria-modal="true" aria-labelledby="notice-modal-title" data-notice-modal>
      <div class="modal-panel">
        <header>
          <div>
            <small>${esc(site.notice.label)}</small>
            <h2 id="notice-modal-title">${esc(site.notice.title)}</h2>
          </div>
          <button type="button" aria-label="关闭" data-notice-close>${icon("x", 18)}</button>
        </header>
        <div class="modal-body notice-modal-body">
          <p>${esc(site.notice.text)}</p>
        </div>
      </div>
    </div>`;
}

/* Distribute cards into `columns` balanced flex columns (greedy, by ratio). */
function columnize(cards, columns) {
  const cols = Array.from({ length: columns }, () => []);
  const weights = new Array(columns).fill(0);
  cards.forEach((card) => {
    const target = weights.indexOf(Math.min(...weights));
    weights[target] += 1 + (card.weight || 0);
    cols[target].push(card.html);
  });
  return cols
    .map((list) => `<div class="moment-column">\n${list.join("\n")}\n        </div>`)
    .join("\n        ");
}
/* ----------------------------------------------------------- moments page */
function renderMoments() {
  const photoCards = photos.photos.map((p) => {
    const [rw, rh] = p.ratio.split("/").map((v) => parseFloat(v));
    const weight = rh / rw; // taller photos consume more column height
    const html = `<button class="moment-card" type="button" data-photo="${esc(p.id)}" aria-label="查看：${esc(p.title)}">
        <span class="moment-image">
          <img src="${esc(p.src)}" alt="${esc(p.title)}" decoding="async" width="960" height="1200" />
          <span class="moment-camera-overlay">
            <strong>${esc(p.camera)}</strong>
            <span title="快门">${icon("timer", 10)}${esc(p.shutter)}</span>
            <span title="光圈">${icon("aperture", 10)}${esc(p.aperture)}</span>
            <span title="ISO">${icon("gauge", 10)}${esc(p.iso)}</span>
          </span>
        </span>
        <span class="moment-meta">
          <strong>${esc(p.title)}</strong>
          <span class="moment-meta-row"><time datetime="${esc(p.date)}">${esc(p.date.replaceAll("-", "."))}</time></span>
          <span class="moment-place">${esc(p.location)}</span>
        </span>
      </button>`;
    return { html, weight };
  });

  return (
    head({
      title: `随影 — ${site.title}`,
      description: photos.lead,
      preload: [photos.photos[0].src],
    }) +
    `    <main class="moments-page" data-moments>
      ${topbar("moments")}
      ${headingBar("随影", photos.photos.length, "张照片")}
      <p class="moments-lead">${esc(photos.lead)}</p>
      <section class="moments-grid" aria-label="全部随影图片">
        ${columnize(photoCards, 6)}
      </section>
    </main>

    <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="图片预览" data-lightbox>
      <div class="lightbox-head">
        <span data-lb-counter></span>
        <button type="button" aria-label="关闭预览" data-lb-close>${icon("x", 18)}</button>
      </div>
      <div class="lightbox-stage">
        <button class="lightbox-nav prev" type="button" aria-label="上一张" data-lb-prev>${icon("chevronLeft", 18)}</button>
        <img alt="" data-lb-img />
        <button class="lightbox-nav next" type="button" aria-label="下一张" data-lb-next>${icon("chevronRight", 18)}</button>
      </div>
      <div class="lightbox-foot">
        <strong data-lb-title></strong>
        <p data-lb-desc></p>
        <span data-lb-meta></span>
      </div>
    </div>

    <script type="application/json" id="photo-data">${JSON.stringify(
      photos.photos.map((p) => ({
        id: p.id,
        title: p.title,
        src: p.src,
        description: p.description,
        date: p.date,
        location: p.location,
        camera: p.camera,
        shutter: p.shutter,
        aperture: p.aperture,
        iso: p.iso,
      }))
    ).replace(/</g, "\\u003c")}</script>
` +
    tail(["/assets/js/site.js", "/assets/js/moments.js"])
  );
}

/* ----------------------------------------------------------- journal page */
function renderJournal() {
  const recommended = journal.posts.filter((p) => p.kind === "article").slice(0, 2);
  const articles = journal.posts.filter((p) => p.kind === "article");
  const whisperCount = journal.whispers.length;

  const cards = [];
  let wi = 0;
  journal.posts.forEach((p) => {
    cards.push(
      `<article class="content-card">
          <a class="article-card" href="/journal/${esc(p.slug)}.html">
            <span class="article-card-media">
              <img src="${esc(p.cover)}" alt="" loading="lazy" width="1200" height="800" />
            </span>
            <span class="article-card-body">
              <span class="article-card-index"><span>ARTICLE</span><span>${esc(p.dateText)}</span></span>
              <h2>${esc(p.title)}</h2>
              <span class="content-card-copy">${esc(p.summary)}</span>
              <span class="article-card-footer">
                <span class="content-card-metrics">
                  <span>${icon("type", 11)}${p.words.toLocaleString("en-US")} 字</span>
                  <span>${icon("eye", 11)}${p.views}</span>
                  <span>${icon("heart", 11)}${p.likes}</span>
                </span>
                <span class="article-card-more">阅读全文 ${icon("arrowUpRight", 12)}</span>
              </span>
            </span>
          </a>
        </article>`
    );
    // interleave a whisper after the first card, mimicking the original rhythm
    if (wi < journal.whispers.length && cards.length % 2 === 1) {
      const w = journal.whispers[wi++];
      cards.push(
        `<article class="content-card whisper-reveal">
          <div class="whisper-card" id="${esc(w.id)}">
            <header><strong>拾记 · 絮语</strong><time datetime="${esc(w.date)}">${esc(
              w.date.replaceAll("-", ".")
            )} · ${esc(w.time)}</time></header>
            <p>${esc(w.text)}</p>
          </div>
        </article>`
      );
    }
  });

  return (
    head({
      title: `拾记 — ${site.title}`,
      description: journal.lead,
      preload: [articles[0].cover],
    }) +
    `    <main class="content-page" data-journal>
      ${topbar("journal")}
      ${headingBar("拾记", journal.posts.length + journal.whispers.length, "条内容")}

      <aside class="content-info-card" aria-label="拾记栏目详情">
        <header>
          <small>${esc(journal.label)}</small>
          <strong>${esc(journal.title)}</strong>
        </header>
        <div class="content-info-stats">
          <div><strong>${articles.length}</strong><span>articles</span></div>
          <div><strong>${whisperCount}</strong><span>whispers</span></div>
        </div>
        <div class="content-info-recommend">
          <span>作者推荐</span>
          ${recommended.map((p) => `<a href="/journal/${esc(p.slug)}.html">${esc(p.title)}</a>`).join("\n          ")}
        </div>
        <div class="content-info-actions">
          <a href="/feed.xml">${icon("rss", 12)}RSS</a>
          <a href="/about.html">${icon("user", 12)}关于我</a>
        </div>
      </aside>

      <div class="content-view-toggles" role="group" aria-label="内容展示模式">
        <button class="content-view-toggle" type="button" aria-pressed="false" aria-label="切换为列表模式" data-view-toggle>${icon("list", 12)} <span data-view-label>列表模式</span></button>
      </div>

      <section class="content-card-grid" id="content-entries" data-grid>
        ${cards.join("\n        ")}
      </section>
    </main>
` +
    tail(["/assets/js/site.js", "/assets/js/journal.js"])
  );
}

/* ----------------------------------------------------------- article page */
function renderArticle(post) {
  const articles = journal.posts.filter((p) => p.kind === "article");
  const idx = articles.findIndex((p) => p.slug === post.slug);
  const prev = articles[idx + 1];
  const next = articles[idx - 1];

  const body = post.body
    .map((b) => {
      if (b.type === "h2") return `<h2 id="${esc(b.id)}">${esc(b.text)}</h2>`;
      if (b.type === "quote") return `<blockquote><p>${esc(b.text)}</p></blockquote>`;
      if (b.type === "figure")
        return `<figure><img src="${esc(b.src)}" alt="${esc(b.caption || "")}" loading="lazy" /><figcaption>${esc(
          b.caption || ""
        )}</figcaption></figure>`;
      return `<p>${esc(b.text)}</p>`;
    })
    .join("\n        ");

  const outline = post.sections
    .map((s) => `<li><a href="#${esc(s.id)}" data-outline-link="${esc(s.id)}">${esc(s.title)}</a></li>`)
    .join("\n            ");

  const nav = [prev, next].filter(Boolean).length
    ? `<nav class="article-nav" aria-label="继续阅读">
          ${
            prev
              ? `<a class="prev" href="/journal/${esc(prev.slug)}.html"><span>上一条</span><strong>${esc(prev.title)}</strong></a>`
              : "<span></span>"
          }
          ${
            next
              ? `<a class="next" href="/journal/${esc(next.slug)}.html"><span>下一条</span><strong>${esc(next.title)}</strong></a>`
              : ""
          }
        </nav>`
    : "";

  return (
    head({
      title: `${post.title} — ${site.title}`,
      description: post.summary.slice(0, 140),
      preload: [post.cover],
      bodyClass: "article-doc",
    }) +
    `    <main class="article-page">
      <header class="article-topbar">
        <div class="article-topbar-meta">
          <a href="/journal.html">${icon("arrowLeft", 13)} 返回拾记</a>
          <span>${esc(post.dateText)}</span>
          <span>${post.words.toLocaleString("en-US")} 字</span>
        </div>
        <div class="article-topbar-actions">
          <a href="/journal.html" aria-label="返回列表">${icon("layout", 15)}</a>
          <button type="button" aria-label="回到顶部" data-to-top>${icon("arrowUpRight", 15)}</button>
        </div>
      </header>

      <aside class="article-outline" aria-label="文章目录">
        <span>CONTENTS</span>
        <strong>目录</strong>
        <ol>
            ${outline}
        </ol>
      </aside>

      <article class="article-shell">
        <div class="article-cover">
          <img src="${esc(post.cover)}" alt="" width="1200" height="800" />
        </div>

        <header class="article-head">
          <h1>${esc(post.title)}</h1>
          <div class="article-head-meta">
            <span>${icon("clock", 12)}${esc(post.dateText)}</span>
            <span>${icon("type", 12)}${post.words.toLocaleString("en-US")} 字</span>
            <span>${icon("eye", 12)}${post.views}</span>
            <span>${icon("heart", 12)}${post.likes}</span>
          </div>
          <p class="article-summary">${esc(post.summary)}</p>
        </header>

        <div class="article-body" data-article-body>
        ${body}
        </div>

        <footer class="article-foot">
          <div class="article-tags">${post.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
          <a class="article-back" href="/journal.html">${icon("arrowLeft", 12)} 回到拾记</a>
        </footer>

        ${nav}
      </article>
    </main>
` +
    tail(["/assets/js/site.js", "/assets/js/article.js"])
  );
}

/* ------------------------------------------------------------- about page */
function renderAbout() {
  const changelog = about.changelog
    .map(
      (c) => `<li><time datetime="${esc(c.date)}">${esc(c.date)}</time><b class="changelog-type-${esc(c.type)}">${
        { feature: "新增", fix: "修复", optimize: "优化" }[c.type] || "更新"
      }</b><p>${esc(c.text)}</p></li>`
    )
    .join("\n            ");

  const links = about.links
    .map((l) => `<a href="${esc(l.href)}"${l.href.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}>${icon(l.icon === "mail" ? "mail" : l.icon === "rss" ? "rss" : "arrowUpRight", 13)}${esc(l.text)}</a>`)
    .join("\n          ");

  return (
    head({
      title: `关于 — ${site.title}`,
      description: about.lead,
    }) +
    `    <main class="about-page" data-about>
      ${topbar("about")}
      ${headingBar("关于", "01", "关于本站")}

      <div class="about-shell">
        <div class="about-changelog-link">
          <button type="button" data-changelog-open>
            站点更新日志 ${icon("arrowUpRight", 13)}
          </button>
        </div>

        <p class="about-footnote" style="margin: -18px 0 34px; text-align: right">最后更新 · ${esc(about.updatedAt)}</p>

        <section class="about-text">
          ${about.intro.map((p) => `<p>${esc(p)}</p>`).join("\n          ")}
        </section>

        <div class="about-rule"></div>

        <section class="about-profile">
          <div class="about-avatar">
            <img src="${esc(about.profile.avatar)}" alt="作者头像" width="480" height="480" />
          </div>
          <div class="about-profile-copy">
            ${about.profile.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n            ")}
          </div>
        </section>

        <p class="about-footnote">${esc(about.profile.footnote)}</p>

        <div class="about-rule"></div>

        <section class="about-license">
          <h2>${esc(about.license.title)}</h2>
          <div class="about-license-copy">
            <p>${esc(about.license.paragraphs[0])}</p>
            <p>${esc(about.license.paragraphs[1])}</p>
            <p>${esc(about.license.paragraphs[2])}</p>
            <p>${esc(about.license.paragraphs[3])}</p>
          </div>
        </section>

        <div class="about-links">
          ${links}
        </div>
      </div>
    </main>

    <div class="modal" id="changelog-modal" role="dialog" aria-modal="true" aria-labelledby="changelog-title" data-changelog-modal>
      <div class="modal-panel">
        <header>
          <div>
            <small>CHANGELOG</small>
            <h2 id="changelog-title">${esc(about.changelogTitle)}</h2>
          </div>
          <button type="button" aria-label="关闭更新日志" data-changelog-close>${icon("x", 18)}</button>
        </header>
        <div class="modal-body">
          <ol class="changelog-list">
            ${changelog}
          </ol>
        </div>
      </div>
    </div>
` +
    tail(["/assets/js/site.js", "/assets/js/about.js"])
  );
}

/* ------------------------------------------------------------------ build */
function write(rel, content) {
  const target = join(DIST, rel);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
  return target;
}

function build() {
  if (existsSync(DIST)) rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });

  let count = 0;
  write("index.html", renderHome());
  count++;
  write("moments.html", renderMoments());
  count++;
  write("journal.html", renderJournal());
  count++;
  write("about.html", renderAbout());
  count++;

  for (const post of journal.posts.filter((p) => p.kind === "article")) {
    write(join("journal", `${post.slug}.html`), renderArticle(post));
    count++;
  }

  // 404 + robots + feed
  write(
    "404.html",
    head({ title: `页面不存在 — ${site.title}`, description: "没有找到这个页面。" }) +
      `    <main class="about-page">
      ${topbar("")}
      <div class="about-shell" style="text-align:center">
        <p class="qc-eyebrow" style="justify-content:center">ERROR 404</p>
        <h1 class="qc-hero-title" style="margin-inline:auto">这一页被风吹走了。</h1>
        <p class="about-footnote">你要找的内容可能已经挪了位置，或者从来没有存在过。</p>
        <div class="about-links" style="justify-content:center">
          <a href="/">${icon("home", 13)} 回到主页</a>
          <a href="/journal.html">${icon("notebook", 13)} 去拾记</a>
        </div>
      </div>
    </main>
` +
      tail(["/assets/js/site.js"])
  );

  write(
    "robots.txt",
    `User-agent: *
Allow: /
`
  );

  write(
    "feed.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(site.title)}</title>
    <link>/</link>
    <description>${esc(site.description)}</description>
    <language>zh-CN</language>
${journal.posts
  .filter((p) => p.kind === "article")
  .map(
    (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>/journal/${esc(p.slug)}.html</link>
      <guid>/journal/${esc(p.slug)}.html</guid>
      <pubDate>${new Date(`${p.date}T09:00:00+08:00`).toUTCString()}</pubDate>
      <description>${esc(p.summary)}</description>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>
`
  );

  // static assets
  cpSync(join(SRC, "assets"), join(DIST, "assets"), { recursive: true });

  console.log(`built ${count} pages + assets into dist/`);
}

build();
