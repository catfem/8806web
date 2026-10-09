import { SITE, BUDGET, PARTS, SEASONS, GOALS, CALENDAR, PLACES, EXCHANGES, OUTREACH, MEDIA, SPONSORS } from './data.js';
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

// ============================================================ i18n

const META = {
  en: { title: 'FRC Team 8806 · Our Lady of Providence Dream League', desc: $('meta[name="description"]').content },
  'zh-Hant': { title: 'FRC 8806 · 崇光高中機器人隊 OLPDL', desc: 'FRC 第 8806 隊（OLPDL）— 新北市崇光高中 45 位學生，打造比賽機器人，也打造未來的工程師。認養一個零件，支持我們的下一台機器人。' },
};

function applyLang() {
  root.setAttribute('data-lang', lang);
  root.lang = zh() ? 'zh-Hant' : 'en';
  $$('[data-zh]').forEach((el) => {
    if (el._en == null) el._en = el.innerHTML;
    el.innerHTML = zh() ? el.getAttribute('data-zh') : el._en;
  });
  $$('[data-zh-placeholder]').forEach((el) => {
    if (el._enPh == null) el._enPh = el.placeholder;
    el.placeholder = zh() ? el.getAttribute('data-zh-placeholder') : el._enPh;
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

// ============================================================ record rail

function renderSeasons() {
  const track = $('#season-cards');
  const cards = SEASONS.map((s) => `
    <article class="season">
      <img class="season__img" src="assets/img/${s.img}" alt="${esc(t(s.event))} ${s.year}" loading="lazy" width="640" height="480">
      <div class="season__body">
        <p class="season__year">${s.year}</p>
        <p class="season__event">${esc(t(s.event))}</p>
        <p class="season__note">${esc(t(s.note))}</p>
        <ul class="season__awards">${s.awards.map((a) => `<li class="${a.star ? 'star' : ''}">${esc(t(a))}</li>`).join('')}</ul>
      </div>
    </article>`).join('');
  const goal = `
    <article class="season season--goal">
      <div class="season__body">
        <div>
          <p class="eyebrow">${UI('Next season', '下一季')}</p>
          <p class="season__year">${UI('The goal', '我們的目標')}</p>
          <ul class="goal-list">${GOALS.map((g) => `<li>${esc(t(g))}</li>`).join('')}</ul>
        </div>
        <div>
          <p class="season__note" style="margin-bottom:16px">${UI('This is where you come in.', '這一步，需要你的支持。')}</p>
          <a class="btn btn--primary" href="#sponsor">${UI('Help us get there', '幫助我們達成')}</a>
        </div>
      </div>
    </article>`;
  track.innerHTML = cards + goal;
}

function initRail() {
  const track = $('#season-cards');
  const [prev, next] = $$('[data-rail]');
  const update = () => {
    prev.disabled = track.scrollLeft < 8;
    next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 8;
  };
  $$('[data-rail]').forEach((b) => b.addEventListener('click', () => {
    const card = track.querySelector('.season');
    track.scrollBy({ left: (+b.dataset.rail) * (card.offsetWidth + 20), behavior: reducedMotion ? 'auto' : 'smooth' });
  }));
  track.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
}

// ============================================================ gallery

function initMarquee() {
  const track = $('#marquee .marquee__track');
  if (reducedMotion) return;
  track.innerHTML += track.innerHTML.replace(/<img /g, '<img aria-hidden="true" ');
}

// ============================================================ crest

function initCrest() {
  const items = $$('#crest-list li');
  const rings = $$('.crest__ring');
  let idx = -1, auto = true, timer = 0;
  const set = (part) => {
    items.forEach((li) => li.classList.toggle('is-on', li.dataset.part === part));
    rings.forEach((r) => r.classList.toggle('is-on', r.dataset.part === part));
  };
  items.forEach((li) => {
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    const pick = () => { auto = false; clearInterval(timer); set(li.dataset.part); };
    li.addEventListener('click', pick);
    li.addEventListener('mouseenter', pick);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });
  new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (e.isIntersecting && auto && !reducedMotion) {
      timer = setInterval(() => { idx = (idx + 1) % items.length; set(items[idx].dataset.part); }, 2200);
      if (idx < 0) { idx = 0; set(items[0].dataset.part); }
    }
  }, { threshold: 0.4 }).observe($('.crest'));
}

// ============================================================ impact

function renderImpact() {
  $('#outreach-log').innerHTML = OUTREACH.map((o) => `<li><time datetime="${o.date}">${fmtDate(o.date)}</time><span>${esc(t(o.t))}</span></li>`).join('');
  $('.tile__big > span').textContent = OUTREACH.length;
  $('#media-list').innerHTML = MEDIA.map((m) => `
    <div class="media-item">
      <img src="assets/img/${m.img}" alt="" loading="lazy" width="112" height="84">
      <div><time datetime="${m.date}">${fmtDate(m.date)}</time><p>${esc(t(m.t))}</p></div>
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
  // On narrow screens the map scrolls sideways; start with home in view.
  requestAnimationFrame(() => { wrap.scrollLeft = Math.max(0, inner.offsetWidth * (hx / 360) - wrap.clientWidth * 0.45); });
  const pos = { home: 'below', istanbul: 'below', hawaii: 'below', shanghai: 'left', poland: '' , arizona: '' };
  onLang(() => {
    labels.innerHTML = PLACES.map((p) => {
      const [x, y] = proj(p);
      return `<div class="map__label${pos[p.id] ? ' map__label--' + pos[p.id] : ''}" style="left:${(x / 360 * 100).toFixed(2)}%;top:${(y / 140 * 100).toFixed(2)}%"><b>${esc(t(p.name))}</b><span>${esc(t(p.what))}</span></div>`;
    }).join('');
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
    $('#now-text').textContent = t(cur.d) + ' ' + (pos <= order.indexOf(1)
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

function renderParts() {
  $('#parts').innerHTML = ALL_PARTS.map((p) => `
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
  $('#cart-send').addEventListener('click', async () => {
    const ok = await copyText(pledgeMessage());
    const note = $('#cart-note');
    note.textContent = ok
      ? UI('Copied! Paste it into the Instagram chat that just opened.', '已複製！請貼到剛開啟的 Instagram 對話中。')
      : UI('Open the chat and tell us what you\'d like to sponsor.', '請在對話中告訴我們你想認養的項目。');
    note.classList.add('is-done');
    window.open(`https://ig.me/m/${SITE.instagram}`, '_blank', 'noopener');
  });
  onLang(renderParts);
}

function flashPart(id) {
  const li = $(`#parts .part[data-id="${id}"]`);
  if (!li) return;
  li.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
  li.classList.remove('is-flash');
  void li.offsetWidth;
  li.classList.add('is-flash');
}

// ============================================================ budget chart

let scope = 'build';
function renderBudget() {
  const rows = BUDGET.filter((b) => scope === 'all' || b.group === 'build').sort((a, b) => b.amount - a.amount);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const max = rows[0].amount;
  $('#budget-total').textContent = moneyShort(total);
  $('#budget-total-label').textContent = scope === 'all'
    ? UI('Full season, including international team travel', '完整賽季，含國際賽事團費')
    : UI('To build, register and ship one season\'s robots', '一季打造、報名與運送機器人的費用');
  $('#bars').innerHTML = rows.map((r) => `
    <div class="bar${r.group === 'travel' ? ' bar--travel' : ''}" tabindex="0" data-id="${r.id}">
      <div class="bar__label">${esc(t(r.label))}</div>
      <div class="bar__track"><div class="bar__fill" style="width:${(r.amount / max * 82).toFixed(2)}%"></div><span class="bar__value">${moneyShort(r.amount)}</span></div>
    </div>`).join('');
  $('#budget-table').innerHTML = `
    <thead><tr><th>${UI('Item', '項目')}</th><th>${UI('Amount', '金額')}</th></tr></thead>
    <tbody>${rows.map((r) => `<tr><td>${esc(t(r.label))}<small>${esc(t(r.detail))}</small></td><td>${money(r.amount)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td>${UI('Total', '合計')}</td><td>${money(total)}</td></tr></tfoot>`;
}

function initBudget() {
  const tabs = $$('.seg [data-scope]');
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
    SITE.email ? `<a class="btn btn--ghost" href="mailto:${SITE.email}">${UI('E-mail the team', '寄信給我們')}</a>` : '',
    `<a class="btn btn--ghost" href="${SITE.facebook}" target="_blank" rel="noopener">Facebook</a>`,
  ];
  $('#contact-buttons').innerHTML = btns.join('');
  $('#footer-links').innerHTML = [
    [ig, `Instagram @${SITE.instagram}`],
    [SITE.facebook, 'Facebook'],
    [SITE.tba, 'The Blue Alliance'],
    [SITE.frcEvents, 'FRC Events'],
  ].map(([h, l]) => `<li><a href="${h}" target="_blank" rel="noopener">${esc(l)}</a></li>`).join('');
  $('#sponsor-list').innerHTML = SPONSORS.map((s) => `<li>${esc(t(s))}</li>`).join('');
  $('#concept-notice').hidden = !SITE.conceptNotice;
}

// ============================================================ 3D

const HOTSPOTS = [
  { id: 'x60', anchor: 'x60', part: 'x60', label: { en: 'Kraken X60', zh: '海妖 X60 馬達' }, tag: { en: 'NT$9,500 · Sponsor one', zh: 'NT$9,500 · 認養一顆' } },
  { id: 'x44', anchor: 'x44', part: 'x44', label: { en: 'Kraken X44', zh: '海妖 X44 馬達' }, tag: { en: 'NT$5,500 · Sponsor one', zh: 'NT$5,500 · 認養一顆' } },
  { id: 'camera', anchor: 'camera', budget: true, label: { en: 'Vision camera', zh: '視覺辨識鏡頭' }, tag: { en: 'Electronics · see the budget', zh: '電控 · 查看預算' } },
  { id: 'rio', anchor: 'rio', budget: true, desktopOnly: true, label: { en: 'roboRIO controller', zh: 'roboRIO 主控' }, tag: { en: 'Electronics · see the budget', zh: '電控 · 查看預算' }, left: true },
  { id: 'elevator', anchor: 'elevator', part: 'materials', desktopOnly: true, label: { en: 'Aluminium & carbon fibre', zh: '鋁材與碳纖維' }, tag: { en: 'Materials fund · any amount', zh: '材料基金 · 任意金額' }, left: true },
];

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

async function init3D() {
  if (!hasWebGL()) { root.classList.add('no-webgl'); return; }
  const sponsorNames = SPONSORS.slice(0, 5).map((s) => s.en.replace(' Technologies', ''));
  try {
    const { initStory, initNamer } = await import('./scene.js');
    const story = await initStory({
      canvas: $('#robot-canvas'),
      stage: $('.story__stage'),
      section: $('.story'),
      chapters: $$('.chapter'),
      dots: $$('.story__dots li'),
      hotspotLayer: $('#hotspots'),
      hotspots: HOTSPOTS,
      sponsors: sponsorNames,
      modelUrl: SITE.robotModelUrl,
      reducedMotion,
      lang,
      onHotspot: (h) => {
        if (h.part) { if (h.part !== 'materials') addPart(h.part, 1); flashPart(h.part); }
        else { $('#budget').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }); }
      },
    });
    listeners.push(() => story.setLang(lang));
    let namer = null;
    const startNamer = () => {
      if (namer) return;
      namer = initNamer({ canvas: $('#namer-canvas'), wrap: $('.namer__view'), input: $('#namer-input'), sponsors: sponsorNames, reducedMotion });
      document.fonts?.ready.then(() => namer.redrawText());
    };
    new IntersectionObserver(([e], io) => { if (e.isIntersecting) { startNamer(); io.disconnect(); } }, { rootMargin: '600px' }).observe($('#your-name'));
    document.fonts?.ready.then(() => story.redrawText());
  } catch (e) {
    console.error(e);
    root.classList.add('no-webgl');
  }
}

// "#robot" points into the sticky 3D stage, so jump to that chapter's scroll position instead.
function initStoryLinks() {
  $$('a[href="#robot"]').forEach((a) => a.addEventListener('click', (e) => {
    const story = $('.story');
    if (!story) return;
    e.preventDefault();
    const top = story.offsetTop + (1 / 6 + 0.04) * (story.offsetHeight - innerHeight);
    window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
  }));
}

// ============================================================ boot

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
initRail();
initMarquee();
initCrest();
initStoryLinks();
init3D();
