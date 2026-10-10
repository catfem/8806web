import { SITE, BUDGET, PARTS, SEASONS as ALL_SEASONS, GOALS, CALENDAR, PLACES, EXCHANGES, OUTREACH, MEDIA, SPONSORS } from './data.js';

// Seasons marked `draft` (results not yet confirmed) stay off the page and out of every count.
const SEASONS = ALL_SEASONS.filter((s) => !s.draft);
import { WORLD } from './worldmap-data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let lang = root.getAttribute('data-lang') === 'zh-Hant' ? 'zh-Hant' : 'en';
const zh = () => lang === 'zh-Hant';
const t = (o) => (o == null ? '' : typeof o === 'string' ? o : (zh() ? o.zh : o.en) ?? o.en);
const UI = (en, zhText) => (zh() ? zhText : en);

const money = (n) => 'NT$' + Math.round(n).toLocaleString('en-US');
const moneyShort = (n) => (zh()
  ? 'NT$' + (n / 10000).toLocaleString('zh-TW', { maximumFractionDigits: 1 }) + ' 萬'
  : 'NT$' + (n >= 1e6 ? (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M' : Math.round(n / 1000) + 'K'));
const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  if (zh()) return d ? `${y}/${m}/${d}` : `${y}/${m}`;
  const mon = new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' });
  return d ? `${mon} ${d}, ${y}` : `${mon} ${y}`;
};
const monthName = (m, long) => (zh() ? `${m} 月` : new Date(2000, m - 1, 1).toLocaleString('en-US', { month: long ? 'long' : 'short' }));

const listeners = [];
const onLang = (fn) => { listeners.push(fn); fn(); };

// ============================================================ counts from data.js

// Season results: entries flagged `result` (e.g. "Top 8 alliance") are not awards.
const awardsOf = (season) => season.awards.filter((a) => !a.result);
const N = {
  awards: SEASONS.reduce((n, s) => n + awardsOf(s).length, 0),
  seasons: SEASONS.length,
  regionals: ALL_SEASONS.reduce((n, s) => n + (s.regionals || 1), 0),
  outreach: OUTREACH.length,
  exchanges: EXCHANGES.length,
};

// Where we've competed, in season order: "New Taipei City, Hawaii, Istanbul, Arizona and Shanghai".
// Attendance is a confirmed fact even for a draft season, so places and the regional count read every
// season; awards and the season cards only read confirmed ones.
const PLACES_PLAYED = ALL_SEASONS.flatMap((s) => s.places || [])
  .filter((p, i, all) => all.findIndex((q) => q.en === p.en) === i);
const ABROAD = PLACES_PLAYED.filter((p) => p.en !== 'New Taipei City');
const joinList = (list, l) => {
  const names = list.map((p) => (l === 'zh' ? p.zh : p.en));
  if (names.length < 2) return names.join('');
  const last = names[names.length - 1];
  return l === 'zh' ? `${names.slice(0, -1).join('、')}與${last}` : `${names.slice(0, -1).join(', ')} and ${last}`;
};
const outreachYears = OUTREACH.map((o) => +o.date.slice(0, 4));
const OUTREACH_RANGE = `${Math.min(...outreachYears)}–\u2060${Math.max(...outreachYears)}`;
const zhNum = (n) => {
  const d = '零一二三四五六七八九';
  if (n < 10) return d[n];
  if (n < 20) return '十' + (n % 10 ? d[n % 10] : '');
  return d[Math.floor(n / 10)] + '十' + (n % 10 ? d[n % 10] : '');
};
// Text that quotes a count (headline, reasons) carries .js-n-<key> / .js-n-<key>-zh placeholders.
function fillCounts() {
  Object.entries(N).forEach(([k, n]) => {
    $$(`.js-n-${k}`).forEach((el) => { el.textContent = n; });
    $$(`.js-n-${k}-zh`).forEach((el) => { el.textContent = zhNum(n); });
  });
  // Place lists and the outreach year range follow the same pattern.
  // English names are kept whole ("New Taipei City" never splits); Chinese uses word-break: keep-all.
  const keepNames = (list) => esc(joinList(list, 'en'))
    .replace(new RegExp(list.map((p) => p.en).sort((x, y) => y.length - x.length).join('|'), 'g'), (n) => `<span class="nowrap">${n}</span>`);
  $$('.js-places').forEach((el) => { el.innerHTML = keepNames(PLACES_PLAYED); });
  $$('.js-places-zh').forEach((el) => { el.textContent = joinList(PLACES_PLAYED, 'zh'); });
  $$('.js-abroad').forEach((el) => { el.innerHTML = keepNames(ABROAD); });
  $$('.js-abroad-zh').forEach((el) => { el.textContent = joinList(ABROAD, 'zh'); });
  $$('.js-outreach-range').forEach((el) => { el.textContent = OUTREACH_RANGE; });
  // Scoreboard cell for the newest season: "2026 — Regional Finalist in Shanghai, + 3 more awards".
  const latest = [...SEASONS].sort((a, b) => b.year - a.year)[0];
  const top = awardsOf(latest).find((a) => a.star) || awardsOf(latest)[0];
  const more = awardsOf(latest).length - 1;
  const year = $('#score-latest-year'), label = $('#score-latest');
  if (year && top) {
    year.textContent = latest.year;
    const where = top.at ? (zh() ? top.at.zh : top.at.en) : '';
    label.textContent = zh()
      ? `${where}${where && !where.includes('·') ? '區域賽' : ''}${top.zh}${more > 0 ? `，本季再添 ${more} 座獎項` : ''}`
      : `${top.en}${where ? ` in ${where}` : ''}${more > 0 ? `, plus ${more} more award${more > 1 ? 's' : ''} this season` : ''}`;
  }
}

// ============================================================ i18n

const META = {
  en: {
    title: `FRC Team 8806 · ${N.awards} awards in ${N.seasons} seasons · Partner with us`,
    desc: `45 students from Our Lady of Providence High School, New Taipei City. 2022 Regional Winner, ${N.awards} FRC awards, ${N.regionals} regionals in ${joinList(PLACES_PLAYED, 'en')}. See what sponsors get and where every NT$ goes.`,
  },
  'zh-Hant': {
    title: `FRC 8806 崇光高中機器人隊 · ${zhNum(N.seasons)}個賽季、${zhNum(N.awards)}座獎項 · 成為贊助夥伴`,
    desc: `FRC 第 8806 隊（OLPDL）— 新北市崇光高中 45 位學生。2022 年新秀賽季奪下聯盟冠軍，${zhNum(N.seasons)}個賽季 ${N.awards} 座 FRC 獎項，${N.regionals} 場區域賽，足跡遍及${joinList(PLACES_PLAYED, 'zh')}。看看贊助效益與每一塊錢的去向。`,
  },
};

function applyLang() {
  root.setAttribute('data-lang', lang);
  if (zh()) window.loadCJKFont?.();
  root.lang = zh() ? 'zh-Hant' : 'en';
  $$('[data-zh]').forEach((el) => {
    if (el._en == null) el._en = el.innerHTML;
    el.innerHTML = zh() ? el.getAttribute('data-zh') : el._en;
  });
  $$('[data-zh-placeholder]').forEach((el) => {
    if (el._enPh == null) el._enPh = el.placeholder;
    el.placeholder = zh() ? el.getAttribute('data-zh-placeholder') : el._enPh;
  });
  // The English originals are kept as attributes, so copies made with innerHTML (the marquee) still swap.
  $$('[data-zh-aria]').forEach((el) => {
    if (el.dataset.enAria == null) el.dataset.enAria = el.getAttribute('aria-label') || '';
    el.setAttribute('aria-label', zh() ? el.dataset.zhAria : el.dataset.enAria);
  });
  $$('[data-zh-alt]').forEach((el) => {
    if (el.dataset.enAlt == null) el.dataset.enAlt = el.alt;
    el.alt = zh() ? el.dataset.zhAlt : el.dataset.enAlt;
  });
  const toggle = $('#lang-toggle');
  toggle.textContent = zh() ? 'EN' : '中文';
  toggle.setAttribute('aria-label', zh() ? 'Switch to English' : '切換為中文');
  document.title = META[lang].title;
  $('meta[name="description"]').content = META[lang].desc;
  listeners.forEach((fn) => fn());
}

$('#lang-toggle').addEventListener('click', () => {
  lang = zh() ? 'en' : 'zh-Hant';
  try { localStorage.setItem('lang', lang); } catch (e) { /* storage unavailable */ }
  applyLang();
});

// ============================================================ nav theme + reveal

function initNav() {
  const nav = $('#nav');
  const sections = $$('main > section, footer');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) nav.classList.toggle('nav--light', /section--(light|gray)/.test(e.target.className));
    });
  }, { rootMargin: `-${26}px 0px -${Math.max(0, innerHeight - 27)}px 0px` });
  sections.forEach((s) => io.observe(s));
}

function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  $$('[data-reveal]').forEach((el) => io.observe(el));
}

function initCounters() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const el = e.target, end = +el.dataset.count;
      if (reducedMotion) return;
      const t0 = performance.now(), dur = 1400;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => io.observe(el));
}

// ============================================================ results

// "Regional Finalist · Istanbul": the venue is shown when a season had more than one regional.
const withVenue = (a) => esc(t(a)) + (a.at ? `<small>${esc(t(a.at))}</small>` : '');

// The newest season leads as a wide card; earlier seasons follow, newest first.
function renderSeasons() {
  const ordered = [...SEASONS].sort((a, b) => b.year - a.year);
  $('#season-cards').innerHTML = ordered.map((s, i) => {
    const latest = i === 0;
    const n = awardsOf(s).length;
    const media = s.img
      ? `<img class="season__img" src="assets/img/${s.img}" alt="${esc(alt(s))}" loading="lazy" width="640" height="480">`
      : latest
        ? `<div class="season__img season__stat"><span class="season__stat-year">${s.year}</span><span class="season__stat-num">${n}</span><span class="season__stat-label">${UI(n === 1 ? 'FRC award' : 'FRC awards', '座 FRC 獎項')}</span><span class="season__stat-sub">${UI(`${s.regionals || 1} regionals`, `${s.regionals || 1} 場區域賽`)}</span></div>`
        : '<div class="season__img season__img--empty" aria-hidden="true"><img src="assets/img/mark-white.webp" alt="" width="512" height="512" loading="lazy"></div>';
    return renderSeason(s, media, latest);
  }).join('');
  renderGoalsAndLinks();
}

const alt = (s) => (s.img === 'g-arizona-team.webp'
  ? UI('Team 8806 at the 2025 Arizona East Regional', '第 8806 隊於 2025 亞利桑那東區域賽')
  : `${t(s.event)} ${s.year}`);

function renderSeason(s, media, latest) {
  const result = s.awards.find((a) => a.result);
  return `
    <article class="season${latest ? ' season--latest' : ''}">
      ${media}
      <div class="season__body">
        ${latest ? `<p class="season__badge">${UI('Latest season', '最新賽季')}</p>` : ''}
        <p class="season__year">${s.year}</p>
        <p class="season__event">${esc(t(s.event))}</p>
        ${result ? `<p class="season__result">${esc(t(result))}${result.at ? ` · ${esc(t(result.at))}` : ''}</p>` : ''}
        <ul class="season__awards">${awardsOf(s).map((a) => `<li class="${a.star ? 'star' : ''}">${withVenue(a)}</li>`).join('')}</ul>
        ${(s.offseason || []).map((o) => `<p class="season__off"><span>${UI('Off-season', '季後賽')}</span>${esc(t(o))}</p>`).join('')}
        ${s.note ? `<p class="season__note">${esc(t(s.note))}</p>` : ''}
      </div>
    </article>`;
}

function renderGoalsAndLinks() {
  $('#goals').innerHTML = `
    <p class="goals__label">${UI('Next, we\'re going for', '接下來，我們的目標')}</p>
    <ul class="goals__list">${GOALS.map((g) => `<li>${esc(t(g))}</li>`).join('')}</ul>
    <a class="btn btn--ghost" href="#sponsor">${UI('Help us get there', '幫助我們達成')}</a>`;
  $('#verify-links').innerHTML = [
    [SITE.tba, UI('Verify on The Blue Alliance ↗', '在 The Blue Alliance 查證 ↗')],
    [SITE.frcEvents, UI('FRC Events ↗', 'FRC Events 官方紀錄 ↗')],
  ].map(([h, l]) => `<a href="${h}" target="_blank" rel="noopener">${esc(l)}</a>`).join('');
}

// ============================================================ gallery

function initMarquee() {
  const track = $('#marquee .marquee__track');
  if (reducedMotion) return;
  track.innerHTML += track.innerHTML.replace(/<img /g, '<img aria-hidden="true" ');
}

// ============================================================ impact

// Keep a short tail ("— Zhitan Elementary") on one line; long tails must be free to wrap.
const keepTail = (s) => { const [a, b] = s.split(' — '); return b && b.length <= 28 ? `${esc(a)} — <span class="nowrap">${esc(b)}</span>` : esc(s); };

function renderImpact() {
  $('#outreach-log').innerHTML = OUTREACH.map((o) => `<li><time datetime="${o.date}">${fmtDate(o.date)}</time><span>${keepTail(t(o.t))}${o.note ? `<small>${esc(t(o.note))}</small>` : ''}</span></li>`).join('');
  // Events the team hosted are told in the #partner callout; this list is press coverage only.
  $('#media-list').innerHTML = MEDIA.filter((m) => !m.hosted).map((m) => `
    <div class="media-item">
      <img src="assets/img/${m.img}" alt="" loading="lazy" width="112" height="84">
      <div><time datetime="${m.date}">${fmtDate(m.date)}</time><p>${esc(t(m.t))}</p>${m.note ? `<small>${esc(t(m.note))}</small>` : ''}</div>
    </div>`).join('');
  $('#exchange-log').innerHTML = EXCHANGES.map((x) => `<li><time datetime="${x.date}">${fmtDate(x.date)}</time><span><b>${esc(t(x.teams))}</b> · ${esc(t(x.where))}</span></li>`).join('');
}

// ============================================================ world map

function renderMap() {
  const svg = $('#world-map');
  const { step, lon0, lat0, data } = WORLD;
  let d = '';
  data.forEach((hex, r) => {
    [...hex].forEach((h, hi) => {
      const n = parseInt(h, 16);
      for (let b = 0; b < 4; b++) if (n & (8 >> b)) d += `M${(hi * 4 + b) * step + 1} ${r * step + 1}h0`;
    });
  });
  const proj = (p) => [((p.lon - lon0) % 360 + 360) % 360 + 1, lat0 - p.lat + 1];
  const home = PLACES.find((p) => p.home);
  const [hx, hy] = proj(home);
  let arcs = '', pins = '';
  PLACES.forEach((p) => {
    const [x, y] = proj(p);
    if (!p.home) {
      const dist = Math.hypot(x - hx, y - hy);
      const cx = (x + hx) / 2, cy = (y + hy) / 2 - Math.max(6, dist * 0.32);
      arcs += `<path class="map__arc" pathLength="1" d="M${hx} ${hy}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}"/>`;
    }
    pins += `<circle class="map__halo" cx="${x}" cy="${y}" r="2.2"/><circle class="map__pin${p.home ? ' map__pin--home' : ''}" cx="${x}" cy="${y}" r="${p.home ? 1.6 : 1.2}"/>`;
  });
  svg.insertAdjacentHTML('beforeend', `
    <defs><linearGradient id="arc-grad" x1="0" x2="1"><stop offset="0" stop-color="#2f7bff"/><stop offset="1" stop-color="#0aa2d8"/></linearGradient></defs>
    <path class="map__dots" d="${d}"/>
    <g>${arcs}</g><g>${pins}</g>`);

  const inner = svg.parentElement;
  const wrap = inner.parentElement;
  const labels = document.createElement('div');
  inner.appendChild(labels);
  const pos = { home: 'below', istanbul: 'below', hawaii: 'below', shanghai: 'left', poland: '', arizona: '' };
  onLang(() => {
    labels.innerHTML = PLACES.map((p) => {
      const [x, y] = proj(p);
      const cls = (pos[p.id] ? ' map__label--' + pos[p.id] : '') + (p.home ? ' map__label--home' : '');
      return `<div class="map__label${cls}" style="left:${(x / 360 * 100).toFixed(2)}%;top:${(y / 140 * 100).toFixed(2)}%"><b>${esc(t(p.name))}</b><span>${esc(t(p.what))}</span></div>`;
    }).join('');
    // Narrow screens hide the map labels (except home) and list the places instead.
    $('#place-list').innerHTML = PLACES.map((p) => `<li><b>${esc(t(p.name))}</b><span>${esc(t(p.what))}</span></li>`).join('');
  });
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { wrap.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.3 }).observe(wrap);
}

// ============================================================ season clock

function renderSeasonNow() {
  const m = new Date().getMonth() + 1;
  const order = CALENDAR.map((c) => c.m);
  const pos = order.indexOf(m);
  const cur = CALENDAR[pos];
  $('#now-month').textContent = monthName(m, true);
  if (cur) {
    $('#now-title').innerHTML = UI(`We're in <span class="grad">${esc(t(cur.t))}</span>.`, `我們正在進行<span class="grad">${esc(t(cur.t))}</span>。`);
    $('#now-text').textContent = t(cur.d) + (zh() ? '' : ' ') + (pos <= order.indexOf(1)
      ? UI('What gets funded this month is what competes in March.', '這個月到位的資源，就是三月登上賽場的機器人。')
      : UI('The season is live — every contribution goes straight to the field.', '賽季進行中 — 每一份支持都直接送上賽場。'));
  } else {
    $('#now-title').innerHTML = UI('It\'s the <span class="grad">off-season</span>.', '現在是<span class="grad">季後期</span>。');
    $('#now-text').textContent = UI('Off-season events, outreach and planning the next robot. Recruiting starts in August.', '季後賽、教育推廣與下一台機器人的規劃，八月開始招募新生。');
  }
  $('#months').innerHTML = CALENDAR.map((c, i) => {
    const cls = pos < 0 ? '' : i < pos ? 'is-past' : i === pos ? 'is-now' : '';
    return `<li class="${cls}"><b>${monthName(c.m)}</b>${esc(t(c.t))}</li>`;
  }).join('');
}

// ============================================================ sponsor a part

const ICONS = {
  motor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="12" height="12" rx="3"/><path d="M16 12h4M8 6V4M12 6V4M8 18v2M12 18v2"/><circle cx="10" cy="12" r="2"/></svg>',
  'motor-sm': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="8" width="9" height="8" rx="2.5"/><path d="M15 12h4"/><circle cx="10.5" cy="12" r="1.5"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6"/></svg>',
  plane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 13.5 4 11l1.5-1.5 7 1 4-4c1-1 2.5-1.5 3-1s0 2-1 3l-4 4 1 7L14 21l-2.5-6.5L8 18v2l-1.5 1L6 18l-3-.5L4 16h2z"/></svg>',
  student: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/></svg>',
  materials: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h18v4H3zM5 11v8h14v-8"/><path d="M9 15h6"/></svg>',
};

const MATERIALS = {
  id: 'materials', custom: true, icon: 'materials',
  name: { en: 'Materials fund — any amount', zh: '材料基金 — 任意金額' },
  blurb: { en: 'Aluminium, carbon fibre, polycarbonate and filament. Every robot starts as raw stock.', zh: '鋁材、碳纖維、聚碳酸酯與列印線材。每一台機器人都從原料開始。' },
};
const ALL_PARTS = [...PARTS, MATERIALS];
const cart = new Map(); // id -> qty (or NT$ for the custom fund)

// Most valuable first; the open materials fund always closes the list.
const PARTS_BY_PRICE = [...PARTS].sort((a, b) => b.price - a.price).concat(MATERIALS);

function renderParts() {
  $('#parts').innerHTML = PARTS_BY_PRICE.map((p) => `
    <li class="part" data-id="${p.id}">
      <div class="part__icon" aria-hidden="true">${ICONS[p.icon]}</div>
      <div>
        <p class="part__name">${esc(t(p.name))}</p>
        <p class="part__blurb">${esc(t(p.blurb))}</p>
        ${p.need ? `<p class="part__meta">${UI(`Needed this season: ${p.need}`, `本季需求：${p.need}`)}</p>` : ''}
      </div>
      <div class="part__buy">
        ${p.custom
          ? `<p class="part__price">${UI('You choose', '自訂金額')}</p>
             <label class="part__custom"><span class="sr-only">${UI('Amount in NT$', '金額（新台幣）')}</span><input type="number" inputmode="numeric" min="0" step="1000" placeholder="NT$" value="${cart.get(p.id) || ''}"></label>`
          : `<p class="part__price">${money(p.price)}</p>
             <div class="stepper" role="group" aria-label="${esc(t(p.name))}">
               <button type="button" data-step="-1" aria-label="${UI('Remove one', '減少一個')}">−</button>
               <output aria-live="polite">${cart.get(p.id) || 0}</output>
               <button type="button" data-step="1" aria-label="${UI('Add one', '增加一個')}">+</button>
             </div>`}
      </div>
    </li>`).join('');
  syncParts();
}

function syncParts() {
  $$('#parts .part').forEach((li) => {
    const p = ALL_PARTS.find((x) => x.id === li.dataset.id);
    const q = cart.get(p.id) || 0;
    li.classList.toggle('is-picked', q > 0);
    const out = li.querySelector('output');
    if (out) {
      out.textContent = q;
      li.querySelector('[data-step="-1"]').disabled = q === 0;
      li.querySelector('[data-step="1"]').disabled = q >= p.need;
    }
  });
  renderCart();
}

function pledgeLines() {
  return ALL_PARTS.filter((p) => cart.get(p.id) > 0).map((p) => {
    const q = cart.get(p.id);
    const amount = p.custom ? q : q * p.price;
    return { p, q, amount, text: p.custom ? t(p.name).split(' — ')[0] : `${q} × ${t(p.name)}` };
  });
}

function renderCart() {
  const lines = pledgeLines();
  const total = lines.reduce((s, l) => s + l.amount, 0);
  $('#cart-total').textContent = money(total);
  $('#cart-lines').innerHTML = lines.map((l) => `<li><span>${esc(l.text)}</span><b>${money(l.amount)}</b></li>`).join('');
  $('#cart-empty').hidden = lines.length > 0;
  $('#cart-send').disabled = !lines.length;
  $('#cart-clear').hidden = !lines.length;
  const mail = $('#cart-mail');
  mail.hidden = !SITE.email || !lines.length;
  if (SITE.email) mail.href = `mailto:${SITE.email}?subject=${encodeURIComponent(UI('Sponsorship pledge for FRC 8806', 'FRC 8806 贊助認養'))}&body=${encodeURIComponent(pledgeMessage())}`;
  renderDock(total);
}

function pledgeMessage() {
  const lines = pledgeLines();
  const total = lines.reduce((s, l) => s + l.amount, 0);
  const name = $('#namer-input')?.value.trim();
  return [
    UI('Hi FRC 8806! I\'d like to sponsor:', '嗨 FRC 8806！我想認養：'),
    ...lines.map((l) => `• ${l.text} — ${money(l.amount)}`),
    UI(`Total: ${money(total)}`, `合計：${money(total)}`),
    name ? UI(`Name on the robot: ${name}`, `機器人上的名稱：${name}`) : '',
  ].filter(Boolean).join('\n');
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    ta.remove();
    return ok;
  }
}

function addPart(id, n = 1) {
  const p = ALL_PARTS.find((x) => x.id === id);
  if (!p) return;
  if (p.custom) { cart.set(id, Math.max(0, n)); }
  else cart.set(id, Math.min(p.need, Math.max(0, (cart.get(id) || 0) + n)));
  syncParts();
}

function initPledge() {
  const list = $('#parts');
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    addPart(b.closest('.part').dataset.id, +b.dataset.step);
  });
  list.addEventListener('input', (e) => {
    if (!e.target.matches('.part__custom input')) return;
    const v = Math.max(0, Math.floor(+e.target.value || 0));
    cart.set('materials', v);
    syncParts();
  });
  $('#cart-clear').addEventListener('click', () => { cart.clear(); renderParts(); });
  $('#cart-send').addEventListener('click', sendPledge);
  $('#dock-send').addEventListener('click', sendPledge);
  onLang(renderParts);
}

// Copy the pledge, then open an Instagram DM to the team (used by the cart and the dock).
async function sendPledge() {
  const ok = await copyText(pledgeMessage());
  const note = $('#cart-note');
  note.textContent = ok
    ? UI('Copied! Paste it into the Instagram chat that just opened.', '已複製！請貼到剛開啟的 Instagram 對話中。')
    : UI('Open the chat and tell us what you\'d like to sponsor.', '請在對話中告訴我們你想認養的項目。');
  note.classList.add('is-done');
  window.open(`https://ig.me/m/${SITE.instagram}`, '_blank', 'noopener');
}

function flashPart(id) {
  const li = $(`#parts .part[data-id="${id}"]`);
  if (!li) return;
  li.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
  li.classList.remove('is-flash');
  void li.offsetWidth;
  li.classList.add('is-flash');
}

// ============================================================ mobile dock

function renderDock(total) {
  $('#dock-cta').hidden = total > 0;
  $('#dock-cart').hidden = !(total > 0);
  $('#dock-total').textContent = money(total);
}

// The dock is a phone shortcut to the pledge. It stays out of the way on the hero, near the
// inline cart and contact block, and whenever the parts list sits under it.
function initDock() {
  const dock = $('#dock');
  const blockers = new Set();
  const update = () => dock.classList.toggle('is-hidden', blockers.size > 0);
  // A fast jump can queue enter + leave in one batch, so apply the entries in order.
  const track = (entries) => {
    entries.forEach((e) => { if (e.isIntersecting) blockers.add(e.target); else blockers.delete(e.target); });
    update();
  };
  const io = new IntersectionObserver(track);
  ['#top', '#cart', '#contact'].forEach((sel) => io.observe($(sel)));
  // Only the bottom 88px of the viewport, where the dock sits.
  let partsIO;
  const watchParts = () => {
    partsIO?.disconnect();
    blockers.delete($('#parts'));
    partsIO = new IntersectionObserver(track, { rootMargin: `-${Math.max(0, innerHeight - 88)}px 0px 0px 0px` });
    partsIO.observe($('#parts'));
  };
  watchParts();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(watchParts, 200); });
}

// ============================================================ budget chart

const sum = (rows) => rows.reduce((s, r) => s + r.amount, 0);
const pct = (part, whole) => {
  const p = Math.round(part / whole * 100);
  return p < 1 ? '<1%' : p + '%';
};

// Full-season split: build & compete vs team travel, computed from BUDGET.
function renderStack() {
  const total = sum(BUDGET);
  const groups = [
    { id: 'build', amount: sum(BUDGET.filter((b) => b.group === 'build')), label: UI('Build & compete', '打造與參賽') },
    { id: 'travel', amount: sum(BUDGET.filter((b) => b.group === 'travel')), label: UI('Team travel', '團隊差旅') },
  ];
  $('#budget-stack').innerHTML = `
    <p class="stack__title">${UI('Full season:', '完整賽季：')} <b>${moneyShort(total)}</b></p>
    <div class="stack__bar" role="img" aria-label="${esc(groups.map((g) => `${g.label} ${moneyShort(g.amount)} ${pct(g.amount, total)}`).join(', '))}">
      ${groups.map((g) => `<div class="stack__seg${g.id === 'travel' ? ' stack__seg--travel' : ''}" style="flex-basis:${(g.amount / total * 100).toFixed(2)}%">${pct(g.amount, total)}</div>`).join('')}
    </div>
    <ul class="stack__legend">
      ${groups.map((g) => `<li class="${g.id === 'travel' ? 'is-travel' : ''}">${esc(g.label)} <b>${moneyShort(g.amount)} · ${pct(g.amount, total)}</b></li>`).join('')}
    </ul>`;
}

let scope = 'build';
function renderBudget() {
  renderStack();
  const rows = BUDGET.filter((b) => scope === 'all' || b.group === 'build').sort((a, b) => b.amount - a.amount);
  const total = sum(rows);
  const max = rows[0].amount;
  $('#budget-scope').textContent = scope === 'all' ? UI('Full season:', '完整賽季：') : UI('Build & compete:', '打造與參賽：');
  $('#budget-total').textContent = moneyShort(total);
  $('#budget-total-label').textContent = scope === 'all'
    ? UI('Full season, including international team travel', '完整賽季，含國際賽事團費')
    : UI('To build, register and ship one season\'s robots', '一季打造、報名與運送機器人的費用');
  $('#bars').innerHTML = rows.map((r) => `
    <div class="bar${r.group === 'travel' ? ' bar--travel' : ''}" tabindex="0" data-id="${r.id}">
      <div class="bar__label">${esc(t(r.label))}</div>
      <div class="bar__track"><div class="bar__fill" style="width:${(r.amount / max * 100).toFixed(2)}%"></div></div>
      <div class="bar__value">${moneyShort(r.amount)}<small>${pct(r.amount, total)}</small></div>
    </div>`).join('');
  $('#budget-table').innerHTML = `
    <thead><tr><th>${UI('Item', '項目')}</th><th>${UI('Amount', '金額')}</th></tr></thead>
    <tbody>${rows.map((r) => `<tr><td>${esc(t(r.label))}<small>${esc(t(r.detail))}</small></td><td>${money(r.amount)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td>${UI('Total', '合計')}</td><td>${money(total)}</td></tr></tfoot>`;
}

function initBudget() {
  const tabs = $$('[data-scope]');
  tabs.forEach((b) => b.addEventListener('click', () => {
    scope = b.dataset.scope;
    tabs.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    renderBudget();
  }));
  const tip = $('#bars-tip');
  const box = $('#budget');
  const show = (bar, x, y) => {
    const r = BUDGET.find((b) => b.id === bar.dataset.id);
    tip.innerHTML = `<b>${esc(t(r.label))} · ${money(r.amount)}</b>${esc(t(r.detail))}`;
    tip.hidden = false;
    const bb = box.getBoundingClientRect();
    const tw = tip.offsetWidth;
    tip.style.left = Math.min(bb.width - tw - 12, Math.max(12, x - bb.left + 16)) + 'px';
    tip.style.top = (y - bb.top + 18) + 'px';
  };
  const bars = $('#bars');
  bars.addEventListener('pointermove', (e) => {
    const bar = e.target.closest('.bar');
    if (bar) show(bar, e.clientX, e.clientY); else tip.hidden = true;
  });
  bars.addEventListener('pointerleave', () => { tip.hidden = true; });
  bars.addEventListener('focusin', (e) => {
    const bar = e.target.closest('.bar');
    const r = bar.getBoundingClientRect();
    show(bar, r.left + 200, r.bottom - 8);
  });
  bars.addEventListener('focusout', () => { tip.hidden = true; });
  onLang(renderBudget);
}

// ============================================================ contact + footer

function renderContact() {
  const ig = `https://www.instagram.com/${SITE.instagram}/`;
  const btns = [
    `<a class="btn btn--primary" href="https://ig.me/m/${SITE.instagram}" target="_blank" rel="noopener">${UI('Message us on Instagram', '在 Instagram 私訊我們')}</a>`,
    `<a class="btn btn--ghost" href="${SITE.facebook}" target="_blank" rel="noopener">Facebook</a>`,
    SITE.email ? `<a class="btn btn--ghost" href="mailto:${SITE.email}">${UI('E-mail the team', '寄信給我們')}</a>` : '',
    SITE.proposalUrl ? `<a class="btn btn--ghost" href="${esc(SITE.proposalUrl)}" target="_blank" rel="noopener" download>${UI('Download our sponsorship proposal (PDF)', '下載贊助企劃書（PDF）')}</a>` : '',
  ];
  $('#contact-buttons').innerHTML = btns.join('');
  const names = SPONSORS.map((s) => t(s));
  $('#hero-sponsors').textContent = names.join(' · ');
  $('#contact-sponsors').textContent = zh()
    ? `與 ${names.slice(0, -1).join('、')}及${names.at(-1)}一起支持我們。`
    : `Join ${names.slice(0, -1).join(', ')} and ${names.at(-1)}.`;
  $('#footer-links').innerHTML = [
    [ig, `Instagram @${SITE.instagram}`],
    [SITE.facebook, 'Facebook'],
    [SITE.tba, 'The Blue Alliance'],
    [SITE.frcEvents, 'FRC Events'],
    [SITE.github, 'GitHub'],
  ].map(([h, l]) => `<li><a href="${h}" target="_blank" rel="noopener">${esc(l)}</a></li>`).join('');
  $('#concept-notice').hidden = !SITE.conceptNotice;
}

// ============================================================ robot showcase

const HOTSPOTS = [
  { id: 'x60', anchor: 'x60', part: 'x60', label: { en: 'Kraken X60', zh: '海妖 X60 馬達' }, tag: { en: 'NT$9,500 · Sponsor one', zh: 'NT$9,500 · 認養一顆' } },
  { id: 'x44', anchor: 'x44', part: 'x44', label: { en: 'Kraken X44', zh: '海妖 X44 馬達' }, tag: { en: 'NT$5,500 · Sponsor one', zh: 'NT$5,500 · 認養一顆' }, left: true },
  { id: 'camera', anchor: 'camera', budget: true, label: { en: 'Vision camera', zh: '視覺辨識鏡頭' }, tag: { en: 'Electronics · see the budget', zh: '電控 · 查看預算' } },
  { id: 'rio', anchor: 'rio', budget: true, desktopOnly: true, label: { en: 'roboRIO controller', zh: 'roboRIO 主控' }, tag: { en: 'Electronics · see the budget', zh: '電控 · 查看預算' }, left: true },
  { id: 'elevator', anchor: 'elevator', part: 'materials', desktopOnly: true, label: { en: 'Aluminium & carbon fibre', zh: '鋁材與碳纖維' }, tag: { en: 'Materials fund · any amount', zh: '材料基金 · 任意金額' }, left: true },
];

// Probe once, and give the context back straight away (the real renderer makes its own).
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'));
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch (e) { return false; }
}

const idle = (fn, timeout) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout }) : setTimeout(fn, 1));
const onHotspot = (h) => {
  if (h.part) { if (h.part !== 'materials') addPart(h.part, 1); flashPart(h.part); }
  else $('#budget').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
};

// Without the procedural 3D model (no WebGL, or a custom GLB) the price tags become a plain list of
// buttons and the sponsor panel is drawn on a 2D card, so both tabs still do what their text says.
async function initFlatShowcase(view3d, input) {
  const tags = document.createElement('div');
  tags.className = 'flat-tags';
  tags.innerHTML = HOTSPOTS.map((h) => `<button class="hotspot__tag" type="button" data-id="${h.id}"${h.desktopOnly ? ' data-desktop-only' : ''}><b></b><span></span></button>`).join('');
  tags.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) onHotspot(HOTSPOTS.find((h) => h.id === b.dataset.id));
  });
  const card = document.createElement('div');
  card.className = 'flat-card';
  const c = document.createElement('canvas');
  c.width = 768; c.height = 1024;
  c.setAttribute('role', 'img');
  card.appendChild(c);
  view3d.append(tags, card);
  const { drawSponsorPanel } = await import('./sponsor-panel.js');
  const sponsors = SPONSORS.map((x) => x.en.replace(' Technologies', ''));
  const draw = () => {
    drawSponsorPanel(c.getContext('2d'), c.width, c.height, input.value.trim(), sponsors);
    c.setAttribute('aria-label', UI('Sponsor panel preview: ', '贊助面板預覽：') + [input.value.trim(), ...sponsors].filter(Boolean).join(', '));
  };
  input.addEventListener('input', draw);
  document.fonts?.ready.then(draw);
  onLang(() => {
    $$('button', tags).forEach((b) => {
      const h = HOTSPOTS.find((x) => x.id === b.dataset.id);
      b.querySelector('b').textContent = t(h.label);
      b.querySelector('span').textContent = t(h.tag);
    });
    draw();
  });
  view3d.classList.add('is-flat');
}

// Tabs work on their own (text only); the 3D engine is loaded when #robot comes near the viewport.
function initShowcase() {
  const section = $('#robot');
  const tabs = $$('#robot-tabs [role="tab"]');
  const panels = $$('#robot .tabpanel');
  const view3d = $('#robot-view');
  let view = 'build';
  let engine = null;

  const select = (btn, focus) => {
    view = btn.dataset.view;
    tabs.forEach((b) => {
      const on = b === btn;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => p.classList.toggle('is-active', p.dataset.view === view));
    view3d.dataset.view = view;
    if (focus) btn.focus();
    engine?.setView(view);
  };
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => select(b));
    b.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (step) { e.preventDefault(); select(tabs[(i + step + tabs.length) % tabs.length], true); }
      else if (e.key === 'Home') { e.preventDefault(); select(tabs[0], true); }
      else if (e.key === 'End') { e.preventDefault(); select(tabs[tabs.length - 1], true); }
    });
  });
  view3d.dataset.view = view;

  const input = $('#namer-input');
  view3d.addEventListener('pointerdown', () => view3d.classList.add('is-dragged'), { once: true });

  const flat = () => { root.classList.add('no-webgl'); initFlatShowcase(view3d, input); };
  const start = async () => {
    if (!hasWebGL()) { flat(); return; }
    try {
      const { initShowcase: boot } = await import('./scene.js');
      engine = await boot({
        canvas: $('#robot-canvas'),
        wrap: view3d,
        section,
        hotspotLayer: $('#hotspots'),
        hotspots: HOTSPOTS,
        sponsors: SPONSORS.map((s) => s.en.replace(' Technologies', '')),
        modelUrl: SITE.robotModelUrl,
        reducedMotion,
        lang,
        view,
        onHotspot,
      });
      engine.setView(view); // in case a tab was picked while the engine was loading
      if (engine.custom) initFlatShowcase(view3d, input);
      engine.setName(input.value.trim());
      input.addEventListener('input', () => engine.setName(input.value.trim()));
      listeners.push(() => { engine.setLang(lang); engine.redrawText(); });
      document.fonts?.ready.then(() => engine.redrawText());
    } catch (e) {
      console.error(e);
      flat();
    }
  };
  // About one viewport ahead, and only once the main thread has a quiet moment.
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    idle(start, 1500);
  }, { rootMargin: '100% 0px' }).observe(section);
}

// ============================================================ boot

// Counts that come straight from data.js.
$$('.js-outreach-count').forEach((el) => { el.dataset.count = el.textContent = N.outreach; });
$('#kpi-exchanges').dataset.count = $('#kpi-exchanges').textContent = N.exchanges;
$('#score-awards').dataset.count = $('#score-awards').textContent = N.awards;
$('#score-regionals').dataset.count = $('#score-regionals').textContent = N.regionals;

onLang(fillCounts);
onLang(renderSeasons);
onLang(renderImpact);
renderMap();
onLang(renderSeasonNow);
initPledge();
initBudget();
onLang(renderContact);
applyLang();
initNav();
initReveal();
initCounters();
initMarquee();
initDock();
initShowcase();
