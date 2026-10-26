import { SITE, BUDGET, PARTS, SEASONS as ALL_SEASONS, GOALS, CALENDAR, PLACES, EXCHANGES, OUTREACH, MEDIA, SPONSORS } from './data.js';

// Seasons marked `draft` (results not yet confirmed) stay off the page and out of every count.
const SEASONS = ALL_SEASONS.filter((s) => !s.draft);
import { WORLD } from './worldmap-data.js';
import { balloon, sheetRef } from './cad.js';
import { initMotion, initSmoothScroll, goTo, getLenis, REDUCED, PEN, EASE_CSS, rollIn, remeasure, tickDigit, fly, armSend } from './motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reducedMotion = REDUCED.matches;
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

// A season's official regionals and their awards. Off-season events (`offseason`) are shown on the
// season's card but never counted.
const eventsOf = (season) => season.events || [];
const awardsOf = (season) => eventsOf(season).flatMap((e) => e.awards || []);
const N = {
  awards: SEASONS.reduce((n, s) => n + awardsOf(s).length, 0),
  seasons: SEASONS.length,
  regionals: ALL_SEASONS.reduce((n, s) => n + eventsOf(s).length, 0),
  outreach: OUTREACH.length,
  exchanges: EXCHANGES.length,
};

// Where we've competed, in season order: "New Taipei City, Hawaii, Istanbul, Arizona and Shanghai".
// Attendance is a confirmed fact even for a draft season, so places and the regional count read every
// season; awards and the season cards only read confirmed ones.
const PLACES_PLAYED = ALL_SEASONS.flatMap((s) => eventsOf(s).map((e) => e.place))
  .filter((p, i, all) => all.findIndex((q) => q.en === p.en) === i);
// Award balloons: the official awards numbered 1, 2, 3… in the order they were won (oldest season
// first, events in season order), so the headline count is itemized on the cards. Keyed by event.
const AWARD_NO = new Map();
[...SEASONS].sort((a, b) => a.year - b.year).reduce((k, s) => eventsOf(s).reduce((k2, e) => {
  AWARD_NO.set(e, (e.awards || []).map((_, i) => k2 + i + 1));
  return k2 + (e.awards || []).length;
}, k), 0);
// An award's full official name: "Excellence in Engineering Award sponsored by Littelfuse".
const awardName = (a) => (zh() ? a.zh + (a.by ? `（${a.by.zh}）` : '') : a.en + (a.by ? ` ${a.by.en}` : ''));
const ABROAD = PLACES_PLAYED.filter((p) => p.en !== 'New Taipei City');
const joinList = (list, l) => {
  const names = list.map((p) => (l === 'zh' ? p.zh : p.en));
  if (names.length < 2) return names.join('');
  const last = names[names.length - 1];
  return l === 'zh' ? `${names.slice(0, -1).join('、')}與${last}` : `${names.slice(0, -1).join(', ')} and ${last}`;
};
const yearRange = (years) => `${Math.min(...years)}–\u2060${Math.max(...years)}`;
const OUTREACH_RANGE = yearRange(OUTREACH.map((o) => +o.date.slice(0, 4)));
const SEASON_RANGE = yearRange(SEASONS.map((s) => s.year));
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
  $$('.js-season-range').forEach((el) => { el.textContent = SEASON_RANGE; });
  // Scoreboard cell for the newest season: "2026 — Regional Finalists in Shanghai, plus 3 more awards".
  const latest = [...SEASONS].sort((a, b) => b.year - a.year)[0];
  const evs = eventsOf(latest);
  const topEv = evs.find((e) => (e.awards || []).some((a) => a.star)) || evs.find((e) => e.awards?.length);
  const top = topEv && (topEv.awards.find((a) => a.star) || topEv.awards[0]);
  const more = awardsOf(latest).length - 1;
  const year = $('#score-latest-year'), label = $('#score-latest');
  if (year && top) {
    year.textContent = latest.year;
    label.textContent = zh()
      ? `${topEv.name.zh}${awardName(top)}${more > 0 ? `，本季再添 ${more} 座獎項` : ''}`
      : `${awardName(top)} in ${topEv.place.en}${more > 0 ? `, plus ${more} more award${more > 1 ? 's' : ''} this season` : ''}`;
  }
}

// ============================================================ i18n

const META = {
  en: {
    title: `FRC Team 8806 · ${N.awards} awards in ${N.seasons} seasons · Partner with us`,
    desc: `45 students from Our Lady of Providence High School, New Taipei City. Regional Winners in our 2022 rookie season, ${N.awards} FRC awards, ${N.regionals} regionals in ${joinList(PLACES_PLAYED, 'en')}. See what sponsors get and where every NT$ goes.`,
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
  // The name starts with the visible label (speech input), in the language it is written in.
  toggle.textContent = zh() ? 'EN' : '中文';
  toggle.lang = zh() ? 'en' : 'zh-Hant';
  toggle.setAttribute('aria-label', zh() ? 'EN – Switch to English' : '中文 – 切換為中文');
  document.title = META[lang].title;
  $('meta[name="description"]').content = META[lang].desc;
  listeners.forEach((fn) => fn());
}

$('#lang-toggle').addEventListener('click', () => {
  lang = zh() ? 'en' : 'zh-Hant';
  try { localStorage.setItem('lang', lang); } catch (e) { /* storage unavailable */ }
  applyLang();
});

// ============================================================ nav + menu

// Phone / tablet menu: a button in the nav opens the list of sections.
function initMenu() {
  const btn = $('#menu-toggle');
  const menu = $('#menu');
  const set = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  };
  btn.addEventListener('click', () => set(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); } });
  document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target) && !btn.contains(e.target)) set(false); });
  addEventListener('resize', () => { if (!menu.hidden && innerWidth > 1180) set(false); });
}

const NAV_SECTIONS = ['top', 'results', 'partner', 'impact', 'team', 'robot', 'sponsor'];
// The nav marks the section being read (the reading line, PEN: 35% down the viewport) and a hairline
// along the pill shows how far down the page you are. Sub-sections (pledge, budget, contact) mark
// their parent's link when the list has no link of their own; never two links in one list.
function initNav() {
  const ORDER = [...NAV_SECTIONS, 'pledge', 'budget', 'contact']; // each sub-section after its parent
  const PARENT = { pledge: 'sponsor', budget: 'sponsor', contact: 'sponsor' };
  const navLists = [$$('.nav__links a'), $$('.menu a')];
  const bar = $('.nav__progress');
  let current = 'top';

  let maxScroll = 1, raf = 0;
  const layout = () => { maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight); move(); };
  const move = () => { raf = 0; bar?.style.setProperty('--p', Math.min(1, Math.max(0, scrollY / maxScroll)).toFixed(4)); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(move); }, { passive: true });
  addEventListener('resize', layout);
  addEventListener('load', layout);
  // The page grew or shrank (images, a language switch): Lenis re-measures too, unless it is gliding
  // (its own resize debounce catches up then).
  new ResizeObserver(() => {
    layout();
    const lenis = getLenis();
    if (lenis && !lenis.isScrolling) lenis.resize();
  }).observe($('#main'));
  layout();

  const paint = () => {
    const parent = PARENT[current];
    navLists.forEach((links) => {
      const hit = links.find((a) => a.getAttribute('href') === `#${current}`)
        || (parent && links.find((a) => a.getAttribute('href') === `#${parent}`));
      links.forEach((a) => a.setAttribute('aria-current', String(a === hit)));
    });
  };
  // The deepest section on the reading line wins; a fast jump can queue enter + leave in one batch.
  const live = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) live.add(e.target.id); else live.delete(e.target.id); });
    const next = ORDER.filter((id) => live.has(id)).at(-1) ?? current;
    if (next === current) return;
    current = next;
    paint();
  }, { rootMargin: PEN });
  ORDER.forEach((id) => io.observe(document.getElementById(id)));
  paint();
}

// ============================================================ results

// Each season is a card: its photo (the newest season, until it has one: a stat panel), the year and
// game, and an event record laid out like a drawing's revision table: one row per event (EVENT · DATES ·
// TEAMS · RANK · W-L-T · ALLIANCE · RESULT), the event's awards under it with their numbered balloons
// (AWARD_NO; blue for the alliance results), then the off-season events, which are never counted.
// Narrow cards (cad.css, a container query) restack each row as a small card with the same cells.
// The newest season leads as a wide card; earlier seasons follow, newest first. Each season is plotted
// as it arrives (data-plot, keyed by year so a language switch never replays it; motion.js), row group
// by row group (--r).
function renderSeasons() {
  const ordered = [...SEASONS].sort((a, b) => b.year - a.year);
  $('#season-cards').innerHTML = ordered.map((s, i) => renderSeason(s, i === 0)).join('');
  renderGoalsAndLinks();
  renderResultsNote();
}

const ROLE = { captain: { en: 'captain', zh: '隊長' }, pick1: { en: '1st pick', zh: '第一指名' }, pick2: { en: '2nd pick', zh: '第二指名' } };
const monShort = (m) => new Date(2000, m - 1, 1).toLocaleString('en-US', { month: 'short' });
// "Mar 12–15" / "3/12–15" (the year is the card's).
const fmtRange = ([a, b]) => {
  const [, m1, d1] = a.split('-').map(Number), [, m2, d2] = b.split('-').map(Number);
  if (zh()) return m1 === m2 ? `${m1}/${d1}–${d2}` : `${m1}/${d1}–${m2}/${d2}`;
  return m1 === m2 ? `${monShort(m1)} ${d1}–${d2}` : `${monShort(m1)} ${d1} – ${monShort(m2)} ${d2}`;
};
const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
// A score ("463–438") never breaks at its dash.
const scores = (str) => str.replace(/(\d)–(\d)/g, '$1\u2060–\u2060$2');

function recordTable(s) {
  const head = [UI('Event', '賽事'), UI('Dates', '日期'), UI('Teams', '隊數'), UI('Rank', '排名'), UI('W-L-T<span class="sr-only"> (qualification matches)</span>', '勝敗和<span class="sr-only">（資格賽）</span>'), UI('Alliance', '聯盟'), UI('Result', '成績')];
  // Each cell repeats its column name for the narrow layout, where the header row is hidden.
  const k = (i) => `<span class="rec__k" aria-hidden="true">${head[i]}</span>`;
  const v = (main, sub) => `<span class="rec__v">${main}</span>${sub ? `<span class="rec__s">${sub}</span>` : ''}`;
  const none = `<span aria-hidden="true">—</span><span class="sr-only">${UI('not confirmed', '未確認')}</span>`;
  const row = (e, off) => {
    const href = off ? `https://www.thebluealliance.com/event/${e.key}` : `https://frc-events.firstinspires.org/${s.year}/${e.code}`;
    const al = e.alliance;
    return `<tr class="rec__ev" role="row">
      <th class="rec__name" scope="row" role="rowheader"><span class="rec__title">${zh() ? esc(t(e.name)) : esc(t(e.name)).replace(/[\u3400-\u9fff]+/g, '<span lang="zh-Hant">$&</span>')}</span><span class="rec__meta"><a class="rec__code" href="${href}" target="_blank" rel="noopener">${esc(off ? e.key : e.code)}<span class="sr-only"> – ${off ? 'The Blue Alliance' : 'FRC Events'}</span></a><span class="rec__venue">${esc(t(e.venue))}</span></span></th>
      <td class="rec__dt" role="cell">${k(1)}${v(esc(fmtRange(e.dates)))}</td>
      <td class="rec__tm${e.rank ? ' is-dup' : ''}" role="cell">${k(2)}${v(e.teams)}</td>
      <td class="rec__rk${e.rank ? '' : ' is-na'}" role="cell">${k(3)}${v(e.rank ? UI(`${e.rank} of ${e.teams}`, `${e.rank}／${e.teams}`) : none)}</td>
      <td class="rec__wl" role="cell">${k(4)}${v(e.wlt)}</td>
      <td class="rec__al" role="cell">${k(5)}${v(al ? UI(`Alliance ${al.n}`, `第${al.n}聯盟`) : none, al?.role ? esc(t(ROLE[al.role])) : '')}</td>
      <td class="rec__rs" role="cell">${k(6)}${v(esc(t(e.result)), esc(scores(t(e.result.sub))))}</td>
    </tr>`;
  };
  const awards = (e) => {
    const list = e.awards || [], nos = AWARD_NO.get(e) || [];
    if (!list.length && !e.note) return '';
    return `<tr class="rec__aw" role="row"><td colspan="7" role="cell">
      ${list.length ? `<ul class="rec__awards" aria-label="${esc(UI(`Awards at the ${e.name.en}`, `${e.name.zh}獎項`))}">${list.map((a, i) => `<li class="${a.star ? 'is-star' : ''}">${balloon(nos[i])}<span>${esc(t(a))}${a.by ? ` <small>${esc(t(a.by))}</small>` : ''}</span></li>`).join('')}</ul>` : ''}
      ${e.note ? `<p class="rec__note">${esc(scores(t(e.note)))}</p>` : ''}
    </td></tr>`;
  };
  const off = s.offseason || [];
  return `<table class="rec" role="table">
    <caption class="sr-only">${UI(`${s.year} event record`, `${s.year} 賽季賽事紀錄`)}</caption>
    <colgroup><col class="rec__c-ev"><col class="rec__c-dt"><col class="rec__c-tm"><col class="rec__c-rk"><col class="rec__c-wl"><col class="rec__c-al"><col class="rec__c-rs"></colgroup>
    <thead role="rowgroup"><tr role="row">${head.map((h) => `<th scope="col" role="columnheader">${h}</th>`).join('')}</tr></thead>
    ${eventsOf(s).map((e, i) => `<tbody class="rec__group" role="rowgroup">${row(e)}${awards(e)}</tbody>`).join('')}
    ${off.length ? `<tbody class="rec__group rec__group--off" role="rowgroup">
      <tr class="rec__offhead" role="row"><th colspan="7" scope="colgroup" role="columnheader">${UI(`Off-season event${off.length > 1 ? 's' : ''} · not counted in the FRC awards`, '季後賽 · 不計入 FRC 獎項')}</th></tr>
      ${off.map((e) => row(e, true)).join('')}
    </tbody>` : ''}
  </table>`;
}

function renderSeason(s, latest) {
  const n = awardsOf(s).length, r = eventsOf(s).length;
  const regionals = UI(`${r} regional${r === 1 ? '' : 's'}`, `${r} 場區域賽`);
  const media = s.img
    ? `<img class="season__img" src="assets/img/${s.img}" alt="${esc(t(s.imgAlt) || `${s.year}`)}" loading="lazy" width="640" height="480">`
    : latest
      ? `<div class="season__img season__stat"><span class="season__stat-year">${UI(`${s.year} season`, `${s.year} 賽季`)}</span><span><span class="season__stat-num" data-count="${n}">${n}</span><span class="season__stat-label">${UI(n === 1 ? 'FRC award' : 'FRC awards', '座 FRC 獎項')}</span><span class="season__stat-sub">${regionals}</span>${s.record ? `<span class="season__stat-sub">${UI(`Record ${s.record} incl. playoffs`, `戰績 ${s.record}（含淘汰賽）`)}</span>` : ''}</span></div>`
      : '<div class="season__img season__img--empty" aria-hidden="true"><img src="assets/img/mark-white.webp" alt="" width="512" height="512" loading="lazy"></div>';
  const sum = [s.note && t(s.note), regionals, UI(`${n} FRC award${n === 1 ? '' : 's'}`, `${n} 座 FRC 獎項`)].filter(Boolean).join(' · ');
  return `
    <article class="season${latest ? ' season--latest' : ''}" aria-labelledby="season-${s.year}" data-plot data-key="${s.year}">
      <div class="season__media">${media}</div>
      <div class="season__head">
        ${latest ? `<p class="badge season__badge">${UI('Latest season', '最新賽季')}</p>` : ''}
        <div class="season__title"><h3 class="season__year" id="season-${s.year}">${s.year}</h3><p class="season__game"><span>${UI('Game', '賽題')}</span> ${esc(s.game)}</p></div>
        ${latest ? '' : `<p class="season__sum">${esc(sum)}</p>`}
      </div>
      <div class="season__rec">${recordTable(s)}</div>
    </article>`;
}

// The results footnote: the best confirmed qualification run (the best rank for the field size), and
// when the results were checked.
function renderResultsNote() {
  const best = SEASONS.flatMap((s) => eventsOf(s).filter((e) => e.rank).map((e) => ({ e, year: s.year })))
    .sort((a, b) => a.e.rank / a.e.teams - b.e.rank / b.e.teams)[0];
  const checked = UI(`W-L-T and rank are from qualification matches. Results checked against FRC Events / The Blue Alliance data, ${fmtDate(SITE.checked)}.`, `勝敗和與排名為資格賽成績。戰績已依 FRC Events／The Blue Alliance 資料核對（${fmtDate(SITE.checked)}）。`);
  $('#results-note').innerHTML = (best
    ? `<span class="cite__best">${esc(UI(`Best qualification run: ${best.e.wlt}, ranked ${ord(best.e.rank)} of ${best.e.teams} at the ${best.year} ${best.e.name.en}.`, `最佳資格賽表現：${best.year} ${best.e.name.zh}，${best.e.teams} 隊中排名第 ${best.e.rank}（${best.e.wlt}）。`))}</span>${UI(' ', '')}`
    : '') + `<span>${esc(checked)}</span>`;
}

function renderGoalsAndLinks() {
  $('#goals').innerHTML = `
    <p class="label goals__label">${UI('Next, we\'re going for', '接下來，我們的目標')}</p>
    <ul class="cells goals__list">${GOALS.map((g) => `<li>${esc(t(g))}</li>`).join('')}</ul>
    <a class="btn btn--ghost" href="#sponsor">${ICONS.arrow}<span>${UI('Help us get there', '幫助我們達成')}</span></a>`;
  $('#verify-links').innerHTML = [
    [SITE.tba, UI('Verify on The Blue Alliance ↗', '在 The Blue Alliance 查證 ↗')],
    [SITE.frcEvents, UI('FRC Events ↗', 'FRC Events 官方紀錄 ↗')],
  ].map(([h, l]) => `<a href="${h}" target="_blank" rel="noopener">${esc(l)}</a>`).join('');
}

// ============================================================ gallery

// The strip is the page's only endless motion, so it has a Pause / Play button (the choice is remembered)
// and it rests while off screen. With reduced motion it is a manual scroller (CSS) and the button stays
// hidden. The label changes rather than aria-pressed, so the button always says what it will do.
function initMarquee() {
  const marquee = $('#marquee');
  const track = $('.marquee__track', marquee);
  const btn = $('#marquee-toggle');
  const label = $('span', btn);
  let paused = false;
  try { paused = localStorage.getItem('marquee') === 'paused'; } catch (e) { /* storage unavailable */ }
  const paint = () => {
    marquee.classList.toggle('is-paused', paused);
    label.textContent = paused ? UI('Play', '播放') : UI('Pause', '暫停');
    btn.setAttribute('aria-label', paused ? UI('Play the photo strip', '播放照片輪播') : UI('Pause the photo strip', '暫停照片輪播'));
  };
  btn.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('marquee', paused ? 'paused' : 'playing'); } catch (e) { /* storage unavailable */ }
    paint();
  });
  onLang(paint);
  const gallery = marquee.closest('.gallery');
  new IntersectionObserver(([e]) => gallery.classList.toggle('is-off', !e.isIntersecting)).observe(gallery);
  // It only runs (.is-live, main.css) once the track is doubled for a seamless loop and the button is
  // there; reduced motion stops it, also when switched on or off while the page is open.
  let doubled = false;
  const set = (still) => {
    if (!still && !doubled) { doubled = true; track.innerHTML += track.innerHTML.replace(/<img /g, '<img aria-hidden="true" '); }
    marquee.classList.toggle('is-live', !still);
    btn.hidden = still;
  };
  set(REDUCED.matches);
  REDUCED.addEventListener?.('change', (e) => set(e.matches));
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

// A place's label lines: the official regionals played there (from SEASONS, matched by name), then the
// teams met there. One regional: "2023 Hawaii Regional". Several named after the place: "2 regionals ·
// 2022, 2025". Several with their own names: "4 regionals", then "İstanbul & Bosphorus 2024" per year.
function placeLines(p) {
  const evs = ALL_SEASONS.flatMap((s) => eventsOf(s).map((e) => ({ e, year: s.year }))).filter(({ e }) => e.place.en === p.name.en);
  const years = [...new Set(evs.map((x) => x.year))];
  const out = p.home ? [UI('Home', '我們的主場')] : [];
  if (evs.length === 1) out.push(`${evs[0].year} ${t(evs[0].e.name)}`);
  else if (evs.length > 1 && evs.every(({ e }) => t(e.short).startsWith(t(p.name)))) {
    out.push(UI(`${evs.length} regionals · ${years.join(', ')}`, `${evs.length} 場區域賽 · ${years.join('、')}`));
  } else if (evs.length > 1) {
    out.push(UI(`${evs.length} regionals`, `${evs.length} 場區域賽`));
    years.forEach((y) => {
      const names = evs.filter((x) => x.year === y).map((x) => t(x.e.short));
      out.push(UI(`${names.join(' & ')} ${y}`, `${y} ${names.join('、')}`));
    });
  }
  if (p.exch) out.push(p.online ? UI(`Online exchange ${p.exch}`, `與 ${p.exch} 線上交流`) : UI(`Exchange ${p.exch}`, `與 ${p.exch} 交流`));
  return out;
}

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
  const dist = (p) => { const [x, y] = proj(p); return Math.hypot(x - hx, y - hy); };
  // Flight plan: the arcs fly out nearest-first, each place's arc, pin, halo and label sharing its step
  // (--k, motion.css). Home has no step.
  const K = Object.fromEntries(PLACES.filter((p) => !p.home).sort((a, b) => dist(a) - dist(b)).map((p, k) => [p.id, k]));
  const kAttr = (p) => (p.home ? '' : ` style="--k:${K[p.id]}"`);
  let arcs = '', pins = '';
  PLACES.forEach((p) => {
    const [x, y] = proj(p);
    if (!p.home) {
      const cx = (x + hx) / 2, cy = (y + hy) / 2 - Math.max(6, dist(p) * 0.32);
      arcs += `<path class="map__arc" pathLength="1"${kAttr(p)} d="M${hx} ${hy}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}"/>`;
    }
    pins += `<circle class="map__halo"${kAttr(p)} cx="${x}" cy="${y}" r="2.2"/><circle class="map__pin${p.home ? ' map__pin--home' : ''}"${kAttr(p)} cx="${x}" cy="${y}" r="${p.home ? 1.6 : 1.2}"/>`;
  });
  svg.insertAdjacentHTML('beforeend', `
    <path class="map__dots" d="${d}"/>
    <g>${arcs}</g><g>${pins}</g>`);

  const inner = svg.parentElement;
  const wrap = inner.parentElement;
  const labels = document.createElement('div');
  inner.appendChild(labels);
  const pos = { home: 'below', istanbul: 'below', hawaii: 'below', shanghai: '', poland: '', arizona: '' };
  onLang(() => {
    const lines = (p) => placeLines(p).map((l) => `<span>${esc(l)}</span>`).join('');
    labels.innerHTML = PLACES.map((p) => {
      const [x, y] = proj(p);
      const cls = (pos[p.id] ? ' map__label--' + pos[p.id] : '') + (p.home ? ' map__label--home' : '');
      return `<div class="map__label${cls}" style="left:${(x / 360 * 100).toFixed(2)}%;top:${(y / 140 * 100).toFixed(2)}%${p.home ? '' : `;--k:${K[p.id]}`}"><b>${esc(t(p.name))}</b>${lines(p)}</div>`;
    }).join('');
    // Narrow screens hide the map labels (except home) and list the places instead.
    $('#place-list').innerHTML = PLACES.map((p) => `<li><b>${esc(t(p.name))}</b>${lines(p)}</li>`).join('');
  });
  // The map also fades in (data-reveal, .is-in), which is too early for the flight: it waits for a third
  // of the map to be on screen.
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { wrap.classList.add('is-flown'); io.disconnect(); } }, { threshold: 0.3 }).observe(wrap);
}

// ============================================================ season clock

function renderSeasonNow() {
  const m = new Date().getMonth() + 1;
  const order = CALENDAR.map((c) => c.m);
  const pos = order.indexOf(m);
  const cur = CALENDAR[pos];
  $('#now-month').textContent = monthName(m, true);
  if (cur) {
    // The blue month cell below marks "now", so the title stays white (one accent per screen).
    $('#now-title').innerHTML = UI(`We're in <em>${esc(t(cur.t))}</em>.`, `我們正在進行<wbr><em>${esc(t(cur.t))}</em>。`);
    $('#now-text').textContent = t(cur.d) + (zh() ? '' : ' ') + (pos <= order.indexOf(1)
      ? UI('What gets funded this month is what competes in March.', '這個月到位的資源，就是三月登上賽場的機器人。')
      : UI('The season is live — every contribution goes straight to the field.', '賽季進行中 — 每一份支持都直接送上賽場。'));
  } else {
    $('#now-title').innerHTML = UI('It\'s the <em>off-season</em>.', '現在是<em>季後期</em>。');
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
  // 16px button icons
  arrow: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 8h11M9 3.5 13.5 8 9 12.5"/></svg>',
  chat: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3h11v8H7l-3 2.5V11H2.5z"/></svg>',
  ext: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.5 3H3v10h10V9.5M9 3h4v4M13 3 7.5 8.5"/></svg>',
  mail: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3.5h12v9H2zM2 4l6 5 6-5"/></svg>',
  file: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10"/></svg>',
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
// Bill-of-materials item numbers, in list order (student 1 … materials 6). The same balloon marks the
// part in the cart and on its 3D price tag, so they are derived here, never typed in.
const ITEM = Object.fromEntries(PARTS_BY_PRICE.map((p, i) => [p.id, i + 1]));

function renderParts() {
  $('#parts').innerHTML = PARTS_BY_PRICE.map((p, i) => `
    <li class="part" data-id="${p.id}" style="--k:${i}">
      <div class="part__icon" aria-hidden="true">${balloon(ITEM[p.id])}${ICONS[p.icon]}</div>
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
               <output aria-live="polite"><span class="stepper__q">${cart.get(p.id) || 0}</span></output>
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
    const out = li.querySelector('output .stepper__q');
    if (out) {
      out.textContent = q;
      li.querySelector('[data-step="-1"]').disabled = q === 0;
      li.querySelector('[data-step="1"]').disabled = q >= p.need;
    }
  });
  renderCart();
}

function pledgeLines() {
  // In bill-of-materials order, so the cart and the message read balloon 1, 2, 3…
  return PARTS_BY_PRICE.filter((p) => cart.get(p.id) > 0).map((p) => {
    const q = cart.get(p.id);
    const amount = p.custom ? q : q * p.price;
    return { p, q, amount, text: p.custom ? t(p.name).split(' — ')[0] : `${q} × ${t(p.name)}` };
  });
}

let shownTotal = null;
let shownIds = new Set(); // the items in the cart at the last render: a line for a new item slides in (.is-new)
let probeId = null; // the BOM row under the pointer or focus: its cart line's balloon is lit (cross-probe)
function renderCart() {
  const lines = pledgeLines();
  const total = lines.reduce((s, l) => s + l.amount, 0);
  $('#cart-total').textContent = money(total);
  $('#cart-lines').innerHTML = lines.map((l) => {
    const cls = [shownTotal !== null && !shownIds.has(l.p.id) ? 'is-new' : '', l.p.id === probeId ? 'is-probe' : ''].filter(Boolean).join(' ');
    return `<li data-id="${l.p.id}"${cls ? ` class="${cls}"` : ''}><span class="cart__item">${balloon(ITEM[l.p.id], true)}<span>${esc(l.text)}</span></span><b>${money(l.amount)}</b></li>`;
  }).join('');
  shownIds = new Set(lines.map((l) => l.p.id));
  $('#cart-empty').hidden = lines.length > 0;
  // The first time the pledge becomes sendable (and again after a Clear), Send arms (motion.js).
  const send = $('#cart-send'), wasOff = send.disabled;
  send.disabled = !lines.length;
  if (wasOff && !send.disabled) armSend(send);
  $('#cart-clear').hidden = !lines.length;
  const mail = $('#cart-mail');
  mail.hidden = !SITE.email || !lines.length;
  if (SITE.email) mail.href = `mailto:${SITE.email}?subject=${encodeURIComponent(UI('Sponsorship pledge for FRC 8806', 'FRC 8806 贊助認養'))}&body=${encodeURIComponent(pledgeMessage())}`;
  renderDock(total);
  // The totals tick when they change: the new value is written first, so it is never shown wrong.
  if (shownTotal !== null && total !== shownTotal && root.classList.contains('mo')) {
    ['#cart-total', '#dock-total'].forEach((sel) => $(sel).animate?.(
      [{ transform: 'translateY(-6px)', opacity: 0.4 }, { transform: 'none', opacity: 1 }],
      { duration: 240, easing: EASE_CSS }));
  }
  shownTotal = total;
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

// Where the + button's item balloon flies (motion.js fly): its cart line (fly() skips it when it is off
// screen, as it usually is at 900px and below, where the cart is stacked under the list); on phones the
// dock's total while the dock is showing, otherwise nowhere.
function flyTarget(id) {
  if (!matchMedia('(max-width: 760px)').matches) return $(`#cart-lines li[data-id="${id}"] .balloon`);
  const dock = $('#dock');
  return dock && !dock.classList.contains('is-hidden') && !$('#dock-cart').hidden ? $('#dock-total') : null;
}

function initPledge() {
  const list = $('#parts');
  // + / −: the quantity is written first, then it rolls in; a + also sends the item's balloon to the cart.
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    const row = b.closest('.part'), id = row.dataset.id, dir = +b.dataset.step, was = cart.get(id) || 0;
    addPart(id, dir);
    if ((cart.get(id) || 0) === was) return;
    tickDigit(row.querySelector('output .stepper__q'), dir);
    if (dir > 0) fly(b, flyTarget(id), ITEM[id]);
  });
  // Cross-probing: the BOM row under the pointer (or holding focus) lights its cart line's balloon.
  const probe = (id) => {
    probeId = id;
    $$('#cart-lines li').forEach((li) => li.classList.toggle('is-probe', li.dataset.id === id));
  };
  list.addEventListener('pointerenter', (e) => { if (e.target.matches?.('.part')) probe(e.target.dataset.id); }, true);
  list.addEventListener('pointerleave', (e) => { if (e.target.matches?.('.part') && probeId === e.target.dataset.id) probe(null); }, true);
  list.addEventListener('focusin', (e) => { const p = e.target.closest('.part'); if (p) probe(p.dataset.id); });
  list.addEventListener('focusout', (e) => { const p = e.target.closest('.part'); if (p && !p.contains(e.relatedTarget) && probeId === p.dataset.id) probe(null); });
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
  if (root.classList.contains('mo')) note.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: EASE_CSS });
  window.open(`https://ig.me/m/${SITE.instagram}`, '_blank', 'noopener');
}

// The row is centred under the nav. A price tag activated from the keyboard also takes focus to the row's
// own control; a tap never does, so a phone never opens its keyboard on the amount field.
function flashPart(id, { keyboard } = {}) {
  const li = $(`#parts .part[data-id="${id}"]`);
  if (!li) return;
  goTo(li, { block: 'center', focus: keyboard ? li.querySelector('[data-step="1"]:not(:disabled), .part__custom input') : null });
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

// Full-season split: build & compete vs team travel, computed from BUDGET. The bar is a dimensioned
// part: the season total is its overall dimension, and a chain dimension under it measures each
// group (the legend takes over at ≤640px, cad.css). The dimension geometry is aria-hidden.
function renderStack() {
  const total = sum(BUDGET);
  const groups = [
    { id: 'build', amount: sum(BUDGET.filter((b) => b.group === 'build')), label: UI('Build & compete', '打造與參賽') },
    { id: 'travel', amount: sum(BUDGET.filter((b) => b.group === 'travel')), label: UI('Team travel', '團隊差旅') },
  ];
  const basis = (g) => (g.amount / total * 100).toFixed(2);
  $('#budget-stack').innerHTML = `
    <div class="dim dim--total">
      <i class="dim__ln dim__ln--l" aria-hidden="true"></i>
      <p class="dim__txt"><span class="dim__lbl">${UI('Full season', '完整賽季')}</span> <b class="dim__val">${moneyShort(total)}</b></p>
      <i class="dim__ln dim__ln--r" aria-hidden="true"></i>
    </div>
    <div class="stack__bar" role="img" aria-label="${esc(groups.map((g) => `${g.label} ${moneyShort(g.amount)} ${pct(g.amount, total)}`).join(', '))}">
      ${groups.map((g, i) => `<div class="stack__seg${g.id === 'travel' ? ' stack__seg--travel' : ''}" style="flex-basis:${basis(g)}%;--k:${i}">${pct(g.amount, total)}</div>`).join('')}
    </div>
    <ol class="dim-chain">
      ${groups.map((g, i) => `<li class="dim dim--chain" style="flex-basis:${basis(g)}%;--k:${i}"><i class="dim__ln" aria-hidden="true"></i><span class="dim__lbl">${esc(g.label)}</span> <b class="dim__val">${moneyShort(g.amount)} · ${pct(g.amount, total)}</b></li>`).join('')}
    </ol>
    <ul class="stack__legend">
      ${groups.map((g) => `<li class="${g.id === 'travel' ? 'is-travel' : ''}">${esc(g.label)} <b>${moneyShort(g.amount)} · ${pct(g.amount, total)}</b></li>`).join('')}
    </ul>`;
}

let scope = 'build';
// The stack (the dimensioned bar) does not depend on the scope: a scope change keeps it, so its lit
// dimension can change colour and re-measure in place.
function renderBudget({ stack = true } = {}) {
  if (stack) renderStack();
  const rows = BUDGET.filter((b) => scope === 'all' || b.group === 'build').sort((a, b) => b.amount - a.amount);
  const total = sum(rows);
  const max = rows[0].amount;
  $('#budget-scope').textContent = scope === 'all' ? UI('Full season:', '完整賽季：') : UI('Build & compete:', '打造與參賽：');
  $('#budget-total').textContent = moneyShort(total);
  $('#budget-total-label').textContent = scope === 'all'
    ? UI('Full season, including international team travel', '完整賽季，含國際賽事團費')
    : UI('To build, register and ship one season\'s robots', '一季打造、報名與運送機器人的費用');
  $('#bars').innerHTML = rows.map((r, i) => `
    <div class="bar${r.group === 'travel' ? ' bar--travel' : ''}" tabindex="0" data-id="${r.id}" style="--k:${i}">
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
  const toggles = $$('button[data-scope]');
  const bars = $('#bars');
  const stack = $('#budget-stack');
  // The dimension that measures the pressed scope is lit (cad.css): the build span of the chain, or the
  // overall dimension for the full season.
  stack.dataset.scope = scope;
  toggles.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.scope === scope) return;
    scope = b.dataset.scope;
    stack.dataset.scope = scope;
    toggles.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    // A new scope replots the line items (quickly, motion.css .is-replot): the new bars are born under
    // their covers, then uncovered. A language switch re-renders in place and replots nothing.
    const replot = root.classList.contains('mo') && bars.classList.contains('is-in');
    if (replot) bars.classList.remove('is-in', 'is-replot');
    renderBudget({ stack: false });
    if (replot) requestAnimationFrame(() => requestAnimationFrame(() => bars.classList.add('is-in', 'is-replot')));
    // ...and the lit dimension re-measures (motion.js; only the parts that are drawn at this width).
    remeasure($$(scope === 'all' ? '.dim--total .dim__ln' : '.dim--chain:first-child .dim__ln', stack).filter((el) => el.getClientRects().length));
  }));
  const tip = $('#bars-tip');
  const box = $('#budget');
  let tipBy = ''; // 'pointer' or 'focus'
  const show = (bar, x, y, by) => {
    tipBy = by;
    const r = BUDGET.find((b) => b.id === bar.dataset.id);
    tip.innerHTML = `<b>${esc(t(r.label))} · ${money(r.amount)}</b>${esc(t(r.detail))}`;
    tip.hidden = false;
    const bb = box.getBoundingClientRect();
    const tw = tip.offsetWidth;
    tip.style.left = Math.min(bb.width - tw - 12, Math.max(12, x - bb.left + 16)) + 'px';
    tip.style.top = (y - bb.top + 18) + 'px';
  };
  bars.addEventListener('pointermove', (e) => {
    const bar = e.target.closest('.bar');
    if (bar) show(bar, e.clientX, e.clientY, 'pointer'); else tip.hidden = true;
  });
  bars.addEventListener('pointerleave', () => { tip.hidden = true; });
  bars.addEventListener('focusin', (e) => {
    const bar = e.target.closest('.bar');
    const r = bar.getBoundingClientRect();
    show(bar, r.left + 200, r.bottom - 8, 'focus');
  });
  bars.addEventListener('focusout', () => { tip.hidden = true; });
  // A smooth wheel glide moves the page under a still pointer (no pointermove): a tip the pointer opened
  // goes with the first scroll. One opened by keyboard focus stays with its bar.
  addEventListener('scroll', () => { if (!tip.hidden && tipBy === 'pointer') tip.hidden = true; }, { passive: true });
  onLang(renderBudget);
}

// ============================================================ contact + footer

function renderContact() {
  const ig = `https://www.instagram.com/${SITE.instagram}/`;
  const btns = [
    `<a class="btn btn--primary" href="https://ig.me/m/${SITE.instagram}" target="_blank" rel="noopener">${ICONS.chat}<span>${UI('Message us on Instagram', '在 Instagram 私訊我們')}</span></a>`,
    `<a class="btn btn--ghost" href="${SITE.facebook}" target="_blank" rel="noopener">${ICONS.ext}<span>Facebook</span></a>`,
    SITE.email ? `<a class="btn btn--ghost" href="mailto:${SITE.email}">${ICONS.mail}<span>${UI('E-mail the team', '寄信給我們')}</span></a>` : '',
    SITE.proposalUrl ? `<a class="btn btn--ghost" href="${esc(SITE.proposalUrl)}" target="_blank" rel="noopener" download>${ICONS.file}<span>${UI('Download our sponsorship proposal (PDF)', '下載贊助企劃書（PDF）')}</span></a>` : '',
  ];
  $('#contact-buttons').innerHTML = btns.join('');
  const names = SPONSORS.map((s) => t(s));
  $('#hero-sponsors').innerHTML = names.map((n) => `<li>${esc(n)}</li>`).join('');
  // Chinese names have no spaces to break at, so each one is kept whole.
  const nw = (n) => `<span class="nowrap">${esc(n)}</span>`;
  $('#contact-sponsors').innerHTML = zh()
    ? `與 ${names.slice(0, -1).map(nw).join('、')}及${nw(names.at(-1))}一起支持我們。`
    : esc(`Join ${names.slice(0, -1).join(', ')} and ${names.at(-1)}.`);
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

// `ref` is the tag's balloon: the part's bill-of-materials item number, or the budget sheet it points to.
const HOTSPOTS = [
  { id: 'x60', anchor: 'x60', part: 'x60', ref: ITEM.x60, label: { en: 'Kraken X60', zh: '海妖 X60 馬達' }, tag: { en: 'NT$9,500 · Sponsor one', zh: 'NT$9,500 · 認養一顆' } },
  { id: 'x44', anchor: 'x44', part: 'x44', ref: ITEM.x44, label: { en: 'Kraken X44', zh: '海妖 X44 馬達' }, tag: { en: 'NT$5,500 · Sponsor one', zh: 'NT$5,500 · 認養一顆' }, left: true },
  { id: 'camera', anchor: 'camera', budget: true, ref: '07.2', label: { en: 'Vision camera', zh: '視覺辨識鏡頭' }, tag: { en: 'Electronics · see the budget', zh: '電控 · 查看預算' } },
  { id: 'rio', anchor: 'rio', budget: true, ref: '07.2', desktopOnly: true, label: { en: 'roboRIO controller', zh: 'roboRIO 主控' }, tag: { en: 'Electronics · see the budget', zh: '電控 · 查看預算' }, left: true },
  { id: 'elevator', anchor: 'elevator', part: 'materials', ref: ITEM.materials, desktopOnly: true, label: { en: 'Aluminium & carbon fibre', zh: '鋁材與碳纖維' }, tag: { en: 'Materials fund · any amount', zh: '材料基金 · 任意金額' }, left: true },
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
// info.keyboard: the tag was activated from the keyboard (see flashPart).
const onHotspot = (h, info = {}) => {
  if (h.part) { if (h.part !== 'materials') addPart(h.part, 1); flashPart(h.part, info); }
  else goTo($('#budget'));
};

// Without the procedural 3D model (no WebGL, or a custom GLB) the price tags become a plain list of
// buttons and the sponsor panel is drawn on a 2D card, so both tabs still do what their text says.
async function initFlatShowcase(view3d, input) {
  const tags = document.createElement('div');
  tags.className = 'flat-tags';
  tags.innerHTML = HOTSPOTS.map((h) => `<button class="hotspot__tag" type="button" data-id="${h.id}"${h.desktopOnly ? ' data-desktop-only' : ''}>${typeof h.ref === 'number' ? balloon(h.ref) : sheetRef(h.ref)}<span class="hotspot__text"><b></b><span></span></span></button>`).join('');
  tags.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) onHotspot(HOTSPOTS.find((h) => h.id === b.dataset.id), { keyboard: e.detail === 0 });
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
      b.querySelector('.hotspot__text > span').textContent = t(h.tag);
    });
    draw();
  });
  view3d.classList.add('is-flat');
}

// The view is a CAD viewport. Its top-right label names the drawing view of each tab (they match the
// A/B/C tabs). Its bottom-left status line follows the model's real build stages while it regenerates
// (robot-model.js yields, then scene.js), then reads the live camera angles (phones: the
// "illustrative model" note). All of it is aria-hidden: the canvas label says the same.
const VIEW_LABELS = {
  build: { en: 'View A · Assembly', zh: '視圖 A · 組立圖' },
  price: { en: 'View B · Exploded', zh: '視圖 B · 爆炸圖' },
  logo: { en: 'View C · Detail', zh: '視圖 C · 局部詳圖' },
};
const STAGES = {
  frame: { en: 'Frame', zh: '車架' },
  drive: { en: 'Swerve drive & bumpers', zh: 'Swerve 底盤與防撞框' },
  electronics: { en: 'Electronics', zh: '電控系統' },
  elevator: { en: 'Elevator', zh: '升降機構' },
  effector: { en: 'End effector', zh: '末端執行器' },
  intake: { en: 'Intake', zh: '夾取機構' },
  shading: { en: 'Shading', zh: '材質著色' },
  model: { en: 'Model', zh: '模型' },
};
// The built-in robot's stages in build order; a custom model (SITE.robotModelUrl) is a single one.
const BUILD_STAGES = ['frame', 'drive', 'electronics', 'elevator', 'effector', 'intake', 'shading'];

// Tabs work on their own (text only); the 3D engine is loaded when #robot comes near the viewport.
function initShowcase() {
  const section = $('#robot');
  const tabs = $$('#robot-tabs [role="tab"]');
  const panels = $$('#robot .tabpanel');
  const view3d = $('#robot-view');
  const viewLabel = $('#view-label b');
  const status = $('#view-status');
  const regenText = $('.vs-txt', status);
  const regenBar = $('.vs-bar', status);
  const [azOut, elOut] = $$('.vs-readout b', status);
  let view = 'build';
  let engine = null;

  // The selection pill slides between the tabs (motion.css; reduced motion jumps), sized to the selected
  // tab, from tab geometry cached at start, once fonts load, on resize and after a language switch, never
  // on scroll.
  const tablist = $('#robot-tabs');
  const tabBar = document.createElement('i');
  tabBar.className = 'tabs__bar';
  tabBar.setAttribute('aria-hidden', 'true');
  tablist.append(tabBar);
  tablist.classList.add('has-bar');
  let tabGeo = [];
  const placeTabBar = () => {
    const g = tabGeo[tabs.findIndex((b) => b.getAttribute('aria-selected') === 'true')];
    if (!g?.w) return;
    tabBar.style.width = g.w + 'px';
    tabBar.style.height = g.h + 'px';
    tabBar.style.transform = `translate(${g.left}px, ${g.top}px)`;
  };
  const layoutTabs = () => {
    tabGeo = tabs.map((b) => ({ left: b.offsetLeft, top: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight }));
    placeTabBar();
  };
  layoutTabs();
  addEventListener('resize', layoutTabs);
  document.fonts?.ready.then(() => { layoutTabs(); requestAnimationFrame(() => tabBar.classList.add('is-placed')); });

  // Status line: idle → working ("Regenerating · 3/7 · Electronics": the stage in progress) → done
  // ("Regenerated", 1.2s) → rest. Each finished stage writes the text and the bar once.
  let order = SITE.robotModelUrl ? ['model'] : BUILD_STAGES, built = 0, state = 'idle';
  const paintStatus = () => {
    if (status.dataset.state !== state) status.dataset.state = state;
    if (state === 'working') {
      const n = Math.min(built, order.length - 1);
      regenText.textContent = `${UI('Regenerating', '重新生成中')} · ${n + 1}/${order.length} · ${t(STAGES[order[n]])}`;
    } else if (state === 'done') regenText.textContent = UI('Regenerated', '已重新生成');
  };
  const onStage = (id) => {
    if (id === 'done') {
      state = 'done';
      paintStatus();
      setTimeout(() => { state = 'rest'; paintStatus(); }, 1200);
      return;
    }
    if (!order.includes(id)) order = BUILD_STAGES; // a custom model that failed to load: the built-in robot
    built = order.indexOf(id) + 1;
    regenBar.style.setProperty('--p', (built / order.length).toFixed(3));
    paintStatus();
  };
  // Whole degrees from scene.js, only when one changes: text only, no layout read.
  const deg = (n) => (n < 0 ? '-' : '') + String(Math.abs(n)).padStart(3, '0');
  const onCamera = (az, el) => { azOut.textContent = deg(az); elOut.textContent = deg(el); };

  const select = (btn, focus) => {
    const changed = btn.dataset.view !== view;
    view = btn.dataset.view;
    tabs.forEach((b) => {
      const on = b === btn;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => p.classList.toggle('is-active', p.dataset.view === view));
    view3d.dataset.view = view;
    placeTabBar();
    viewLabel.textContent = t(VIEW_LABELS[view]);
    if (changed) rollIn(viewLabel);
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
  onLang(() => { viewLabel.textContent = t(VIEW_LABELS[view]); paintStatus(); layoutTabs(); });

  const input = $('#namer-input');
  view3d.addEventListener('pointerdown', () => view3d.classList.add('is-dragged'), { once: true });

  const flat = () => { root.classList.add('no-webgl'); initFlatShowcase(view3d, input); };
  const start = async () => {
    if (!hasWebGL()) { flat(); return; }
    state = 'working';
    paintStatus(); // "1/7 · Frame" from the moment the engine starts loading
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
        onStage,
        onCamera,
      });
      engine.setView(view); // in case a tab was picked while the engine was loading
      REDUCED.addEventListener?.('change', (e) => engine.setReducedMotion?.(e.matches));
      if (engine.custom) initFlatShowcase(view3d, input);
      engine.setName(input.value.trim());
      input.addEventListener('input', () => engine.setName(input.value.trim()));
      // onLang runs once now too: the language may have changed while the engine was loading.
      onLang(() => { engine.setLang(lang); engine.redrawText(); });
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
initMenu();
initNav();
initMotion();
initMarquee();
initDock();
initShowcase();
initSmoothScroll();
