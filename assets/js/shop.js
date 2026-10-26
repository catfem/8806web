// 8806 Supply, the team shop: the collection (shop/index.html), a product (shop/product.html?item=…) and
// the bag (shop/bag.html). The catalog is shop-data.js. The bag lives in this browser (localStorage, or
// memory where storage is unavailable). Nothing is paid here: an order is copied and sent to the team on
// Instagram (or by e-mail when SITE.email is set), and the team confirms the total, payment and pickup in
// the chat — the same flow as the sponsor pledge on the home page.
import { SITE } from './data.js';
import { SHOP, CATEGORIES, SIZE_GUIDE, PRODUCTS } from './shop-data.js';
import { zh, t, UI, onLang, esc, money, initLang, applyLang, copyText } from './i18n.js';
import { initMenu, initProgress } from './nav.js';
import { initMotion, initSmoothScroll, REDUCED, EASE_CSS } from './motion.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const PAGE = document.body.dataset.page;
const live = () => root.classList.contains('mo') && !REDUCED.matches;

const byId = new Map(PRODUCTS.map((p) => [p.id, p]));
const catOf = (id) => CATEGORIES.find((c) => c.id === id);
const IMG = (src, w) => `../assets/img/shop/${src}-${w}.webp`;
const srcset = (src) => `${IMG(src, 600)} 600w, ${IMG(src, 1200)} 1200w`;
const fitOf = (p) => (p.fit ? SIZE_GUIDE[p.fit] : null);
const ICON_ARROW = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';

// ============================================================ the bag

// One line per product, colour and size: { id, color, size, qty }. Lines whose product or colour no
// longer exists are dropped on load, and every quantity stays within 1–SHOP.maxQty.
const KEY = 'bag-8806';
let memory = [];
const keyOf = (l) => `${l.id}|${l.color}|${l.size || ''}`;
const valid = (l) => { const p = byId.get(l?.id); return p && p.colors.some((c) => c.id === l.color) && (!fitOf(p) || fitOf(p).sizes.includes(l.size)); };
const bag = {
  read() {
    let lines = memory;
    try { const raw = localStorage.getItem(KEY); if (raw) lines = JSON.parse(raw); } catch (e) { /* storage unavailable: memory */ }
    return (Array.isArray(lines) ? lines : []).filter(valid).map((l) => ({ ...l, qty: Math.min(SHOP.maxQty, Math.max(1, Math.floor(+l.qty) || 1)) }));
  },
  write(lines) {
    memory = lines;
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* storage unavailable: memory */ }
    paintCount();
  },
  add(line) {
    const lines = bag.read();
    const hit = lines.find((l) => keyOf(l) === keyOf(line));
    if (hit) hit.qty = Math.min(SHOP.maxQty, hit.qty + line.qty); else lines.push(line);
    bag.write(lines);
  },
  set(key, qty) { bag.write(bag.read().map((l) => (keyOf(l) === key ? { ...l, qty: Math.min(SHOP.maxQty, qty) } : l)).filter((l) => l.qty > 0)); },
  clear() { bag.write([]); },
};
const count = (lines = bag.read()) => lines.reduce((n, l) => n + l.qty, 0);
const total = (lines = bag.read()) => lines.reduce((s, l) => s + byId.get(l.id).price * l.qty, 0);
const colorOf = (p, id) => p.colors.find((c) => c.id === id) || p.colors[0];
const variant = (p, l) => [p.colors.length > 1 ? t(colorOf(p, l.color).label) : '', l.size || ''].filter(Boolean).join(' · ');

// The nav's Bag button: the count, and a name that says it ("Bag, 3 items").
function paintCount() {
  const n = count();
  const el = $('#bag-count');
  if (el) { el.textContent = n; el.hidden = !n; }
  $('#nav-bag')?.setAttribute('aria-label', n ? UI(`Bag, ${n} item${n > 1 ? 's' : ''}`, `購物袋，${n} 件`) : UI('Bag, empty', '購物袋，空的'));
}
// Another tab changed the bag.
addEventListener('storage', (e) => { if (e.key === KEY) { paintCount(); if (PAGE === 'bag') renderBag(); } });

// A short confirmation at the bottom of the screen ("Added to your bag · View bag").
let toastTimer = 0;
function toast(html) {
  const el = $('#toast');
  el.innerHTML = html;
  el.hidden = false;
  if (live()) el.animate([{ opacity: 0, transform: 'translate(-50%, 12px)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 320, easing: EASE_CSS });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 5000);
}
function bump() {
  const el = $('#nav-bag');
  if (el && live()) el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 420, easing: EASE_CSS });
}

// ============================================================ product cards

function card(p) {
  const c = p.colors[0], [front, back] = c.images;
  const n = p.colors.length;
  return `<li class="product" data-cat="${p.cat}">
    <a class="product__link" href="product.html?item=${p.id}">
      <span class="product__stage">
        <img class="product__img" src="${IMG(front.src, 600)}" srcset="${srcset(front.src)}" sizes="(max-width: 560px) 46vw, (max-width: 1099px) 31vw, 300px" width="600" height="600" alt="" loading="lazy">
        ${back ? `<img class="product__img product__img--alt" src="${IMG(back.src, 600)}" srcset="${srcset(back.src)}" sizes="(max-width: 560px) 46vw, (max-width: 1099px) 31vw, 300px" width="600" height="600" alt="" loading="lazy">` : ''}
        ${p.badge ? `<span class="product__badge">${esc(t(p.badge))}</span>` : ''}
      </span>
      <span class="product__info">
        <h3 class="product__name">${esc(t(p.name))}</h3>
        <span class="product__price">${money(p.price)}</span>
      </span>
      <span class="product__tag">${esc(t(p.tagline))}</span>
      ${n > 1 ? `<span class="product__swatches">${p.colors.map((x) => `<i style="--c:${x.hex}" aria-hidden="true"></i>`).join('')}<span class="sr-only">${UI(`${n} colours`, `${n} 種顏色`)}</span></span>` : ''}
    </a>
  </li>`;
}

// ============================================================ shop: the collection

function initShop() {
  const params = new URLSearchParams(location.search);
  let cat = catOf(params.get('cat'))?.id || 'all';
  const grid = $('#products'), filter = $('#shop-filter');
  const paint = () => {
    $$('.product', grid).forEach((li) => { li.hidden = cat !== 'all' && li.dataset.cat !== cat; });
    $$('button', filter).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
  };
  onLang(() => {
    grid.innerHTML = PRODUCTS.map(card).join('');
    filter.innerHTML = CATEGORIES.map((c) => `<button type="button" data-cat="${c.id}" aria-pressed="false">${esc(t(c.label))}</button>`).join('');
    $('#collection-meta').textContent = UI(`${PRODUCTS.length} items · made to order · ${t(SHOP.batch)}`, `${PRODUCTS.length} 件商品 · 接單後製作 · ${t(SHOP.batch)}`);
    paint();
  });
  filter.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    cat = b.dataset.cat;
    const u = new URL(location.href);
    if (cat === 'all') u.searchParams.delete('cat'); else u.searchParams.set('cat', cat);
    history.replaceState(null, '', u);
    paint();
  });
}

// ============================================================ product page

function initProduct() {
  const params = new URLSearchParams(location.search);
  const p = byId.get(params.get('item'));
  if (!p) {
    $('#pdp-missing').hidden = false;
    $('.crumbs').hidden = true;
    initLang(() => ({ en: { title: 'Not found · 8806 Supply', desc: '' }, 'zh-Hant': { title: '找不到商品 · 8806 Supply', desc: '' } }));
    return;
  }
  const fit = fitOf(p);
  const state = { color: colorOf(p, params.get('color')).id, size: null, qty: 1, view: 0 };
  $('#pdp').hidden = false;
  $('#story').hidden = false;
  $('#more').hidden = false;
  $('#opt-size').hidden = !fit;
  $('#pdp-fit').hidden = !fit;
  $('#opt-color').hidden = p.colors.length < 2;
  initLang(() => ({
    en: { title: `${p.name.en} · 8806 Supply`, desc: `${p.tagline.en} ${money(p.price)}, made to order for FRC Team 8806.` },
    'zh-Hant': { title: `${p.name.zh} · 8806 Supply`, desc: `${p.tagline.zh} ${money(p.price)}，FRC 8806 接單後製作。` },
  }));

  const img = $('#pdp-img'), thumbs = $('#pdp-thumbs');
  const views = () => colorOf(p, state.color).images;
  const viewName = (i) => (i === 0 ? UI('Front', '正面') : p.fit && i === 1 ? UI('Back', '背面') : UI(`View ${i + 1}`, `視角 ${i + 1}`));
  const showView = (fade) => {
    const v = views()[state.view] || views()[0];
    const set = () => { img.src = IMG(v.src, 1200); img.srcset = srcset(v.src); img.sizes = '(max-width: 900px) 100vw, 640px'; img.alt = t(v.alt); };
    if (fade && live()) img.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140 }).onfinish = () => { set(); img.animate([{ opacity: 0, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: EASE_CSS }); };
    else set();
    $$('button', thumbs).forEach((b, i) => b.setAttribute('aria-pressed', String(i === state.view)));
  };
  const paintThumbs = () => {
    const vs = views();
    thumbs.hidden = vs.length < 2;
    thumbs.innerHTML = vs.map((v, i) => `<button type="button" aria-pressed="${i === state.view}" aria-label="${esc(viewName(i))}"><img src="${IMG(v.src, 600)}" width="600" height="600" alt=""></button>`).join('');
  };
  thumbs.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    state.view = $$('button', thumbs).indexOf(b);
    showView(true);
  });

  const addLabel = () => {
    $('#pdp-add').innerHTML = `<span>${UI('Add to bag', '加入購物袋')}</span><span class="pdp__add-sum">${money(p.price * state.qty)}</span>`;
    $('#qty').textContent = state.qty;
    $('#qty-minus').disabled = state.qty <= 1;
    $('#qty-plus').disabled = state.qty >= SHOP.maxQty;
  };
  const paintColor = () => { $('#color-name').textContent = t(colorOf(p, state.color).label); };
  const paintSize = () => { $('#size-name').textContent = state.size || ''; };

  onLang(() => {
    const cat = catOf(p.cat);
    $('#crumb-cat').textContent = t(cat.label);
    $('#crumb-cat').href = `./?cat=${cat.id}#collection`;
    $('#crumb-name').textContent = t(p.name);
    const badge = $('#pdp-badge');
    badge.hidden = !p.badge;
    badge.textContent = p.badge ? t(p.badge) : '';
    $('#pdp-name').textContent = t(p.name);
    $('#pdp-price').textContent = money(p.price);
    $('#pdp-tagline').textContent = t(p.tagline);
    $('#swatches').innerHTML = p.colors.map((c) => `<label class="swatch"><input type="radio" name="color" value="${c.id}"${c.id === state.color ? ' checked' : ''}><i style="--c:${c.hex}" aria-hidden="true"></i><span class="sr-only">${esc(t(c.label))}</span></label>`).join('');
    if (fit) {
      $('#sizes').innerHTML = fit.sizes.map((s) => `<label class="size"><input type="radio" name="size" value="${s}"${s === state.size ? ' checked' : ''}><span>${s}</span></label>`).join('');
      $('#pdp-sizes').innerHTML = `<table class="table sizetable"><caption class="sr-only">${UI('Size guide in centimetres', '尺寸表（公分）')}</caption>
        <thead><tr><th scope="col">${UI('Size', '尺寸')}</th><th scope="col">${UI('Chest, laid flat', '胸寬（平量）')}</th><th scope="col">${UI('Length', '衣長')}</th></tr></thead>
        <tbody>${fit.sizes.map((s, i) => `<tr><th scope="row">${s}</th><td>${fit.chest[i]} cm</td><td>${fit.length[i]} cm</td></tr>`).join('')}</tbody></table>
        <p class="pdp__p">${UI('Relaxed fit, measured flat. Between two sizes? Take the smaller one for a closer fit.', '寬鬆版型，平放測量。介於兩個尺寸之間時，想要合身一點就選小一號。')}</p>`;
    }
    $('#pdp-details').innerHTML = p.details.map((d) => `<li>${esc(t(d))}</li>`).join('');
    $('#pdp-story').textContent = t(p.story);
    const others = [...PRODUCTS.filter((x) => x.id !== p.id && x.cat === p.cat), ...PRODUCTS.filter((x) => x.cat !== p.cat)].slice(0, 4);
    $('#more-products').innerHTML = others.map(card).join('');
    paintColor(); paintSize(); paintThumbs(); showView(false); addLabel();
  });

  $('#swatches').addEventListener('change', (e) => {
    state.color = e.target.value;
    state.view = Math.min(state.view, views().length - 1);
    const u = new URL(location.href); u.searchParams.set('color', state.color); history.replaceState(null, '', u);
    paintColor(); paintThumbs(); showView(true);
  });
  $('#sizes').addEventListener('change', (e) => {
    state.size = e.target.value;
    $('#size-error').hidden = true;
    $('#opt-size').removeAttribute('aria-invalid');
    paintSize();
  });
  $('#qty-minus').addEventListener('click', () => { state.qty = Math.max(1, state.qty - 1); addLabel(); });
  $('#qty-plus').addEventListener('click', () => { state.qty = Math.min(SHOP.maxQty, state.qty + 1); addLabel(); });
  $('#pdp-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (fit && !state.size) {
      $('#size-error').hidden = false;
      $('#opt-size').setAttribute('aria-invalid', 'true');
      $('#sizes input')?.focus();
      return;
    }
    bag.add({ id: p.id, color: state.color, size: fit ? state.size : null, qty: state.qty });
    const v = variant(p, { color: state.color, size: state.size });
    toast(`<span>${UI('Added to your bag:', '已加入購物袋：')} <b>${esc(t(p.name))}</b>${v ? UI(` (${esc(v)})`, `（${esc(v)}）`) : ''} × ${state.qty}</span><a href="bag.html">${UI('View bag', '查看購物袋')}${ICON_ARROW}</a>`);
    bump();
  });
}

// ============================================================ bag page

let ship = SHOP.fulfilment[0].id;
try { ship = SHOP.fulfilment.find((f) => f.id === localStorage.getItem(`${KEY}-ship`))?.id || ship; } catch (e) { /* default */ }

function lineHTML(l) {
  const p = byId.get(l.id), c = colorOf(p, l.color), front = c.images[0];
  const k = keyOf(l), v = variant(p, l), name = t(p.name);
  const who = `${name}${v ? `, ${v}` : ''}`;
  return `<li class="line" data-key="${esc(k)}">
    <a class="line__thumb" href="product.html?item=${p.id}&amp;color=${c.id}" tabindex="-1" aria-hidden="true"><img src="${IMG(front.src, 600)}" width="600" height="600" alt="" loading="lazy"></a>
    <div class="line__main">
      <a class="line__name" href="product.html?item=${p.id}&amp;color=${c.id}">${esc(name)}</a>
      ${v ? `<p class="line__meta">${esc(v)}</p>` : ''}
      <p class="line__unit">${money(p.price)}</p>
    </div>
    <div class="line__qty">
      <div class="stepper" role="group" aria-label="${esc(UI(`Quantity of ${who}`, `${who} 的數量`))}">
        <button type="button" data-step="-1" aria-label="${esc(UI('One fewer', '減少一件'))}">−</button><output>${l.qty}</output><button type="button" data-step="1" aria-label="${esc(UI('One more', '增加一件'))}"${l.qty >= SHOP.maxQty ? ' disabled' : ''}>+</button>
      </div>
      <button class="line__remove" type="button" data-remove aria-label="${esc(UI(`Remove ${who}`, `移除 ${who}`))}">${UI('Remove', '移除')}</button>
    </div>
    <p class="line__sum">${money(p.price * l.qty)}</p>
  </li>`;
}

function renderBag() {
  const lines = bag.read();
  const empty = !lines.length;
  $('#bag-lines').innerHTML = lines.map(lineHTML).join('');
  $('#bag-empty').hidden = !empty;
  $('#bag-grid').classList.toggle('is-empty', empty);
  $('.bag__side').hidden = empty;
  const sub = total(lines);
  $('#sum-sub').textContent = money(sub);
  $('#sum-ship').textContent = ship === 'pickup' ? UI('Free', '免運費') : UI('Quoted in the chat', '對話中報價');
  $('#sum-total').textContent = ship === 'pickup' ? money(sub) : UI(`${money(sub)} + delivery`, `${money(sub)} + 運費`);
  $('#ship').innerHTML = SHOP.fulfilment.map((f) => `<label class="shipopt"><input type="radio" name="ship" value="${f.id}"${f.id === ship ? ' checked' : ''}><span><b>${esc(t(f.label))}</b><small>${esc(t(f.note))}</small></span></label>`).join('');
  $('#order-send').disabled = empty;
  $('#bag-clear').hidden = empty;
  const mail = $('#order-mail');
  mail.hidden = empty || !SITE.email;
  if (SITE.email) mail.href = `mailto:${SITE.email}?subject=${encodeURIComponent(UI('8806 Supply order', '8806 Supply 訂單'))}&body=${encodeURIComponent(orderMessage())}`;
  $('#bag-title').textContent = empty ? UI('Your bag', '你的購物袋') : UI(`Your bag (${count(lines)})`, `你的購物袋（${count(lines)}）`);
}

function orderMessage() {
  const lines = bag.read();
  const f = SHOP.fulfilment.find((x) => x.id === ship);
  const name = $('#order-name')?.value.trim();
  return [
    UI('Hi FRC 8806! I\'d like to order from 8806 Supply:', '嗨 FRC 8806！我想訂購 8806 Supply 的商品：'),
    ...lines.map((l) => { const p = byId.get(l.id), v = variant(p, l); return `• ${t(p.name)}${v ? ` — ${v}` : ''} × ${l.qty} — ${money(p.price * l.qty)}`; }),
    UI(`Total: ${money(total(lines))}${ship === 'pickup' ? '' : ' + delivery'}`, `合計：${money(total(lines))}${ship === 'pickup' ? '' : ' + 運費'}`),
    t(f.label),
    name ? UI(`Name: ${name}`, `姓名：${name}`) : '',
  ].filter(Boolean).join('\n');
}

function initBag() {
  initLang({
    en: { title: 'Your bag · 8806 Supply', desc: 'Your 8806 Supply bag. Send your order to FRC Team 8806 on Instagram — no payment is taken on this site.' },
    'zh-Hant': { title: '購物袋 · 8806 Supply', desc: '你的 8806 Supply 購物袋。透過 Instagram 把訂單傳給 FRC 8806——網站不收取任何款項。' },
  });
  onLang(renderBag);
  const list = $('#bag-lines');
  list.addEventListener('click', (e) => {
    const li = e.target.closest('.line');
    if (!li) return;
    const key = li.dataset.key, l = bag.read().find((x) => keyOf(x) === key);
    if (!l) return;
    const step = e.target.closest('[data-step]'), rm = e.target.closest('[data-remove]');
    if (!step && !rm) return;
    const qty = rm ? 0 : l.qty + +step.dataset.step;
    bag.set(key, qty);
    renderBag();
    // keep focus on the same control after the re-render (or on the list's next control once a line goes)
    const again = $(`.line[data-key="${CSS.escape(key)}"]`);
    if (again) (step ? again.querySelector(`[data-step="${step.dataset.step}"]:not(:disabled)`) || again.querySelector('[data-remove]') : null)?.focus();
    else ($('#bag-lines .line [data-remove]') || $('#bag-empty a'))?.focus();
  });
  $('#ship').addEventListener('change', (e) => {
    ship = e.target.value;
    try { localStorage.setItem(`${KEY}-ship`, ship); } catch (err) { /* memory */ }
    renderBag();
    $(`#ship input[value="${ship}"]`)?.focus();
  });
  $('#order-name').addEventListener('input', () => { if (SITE.email) $('#order-mail').href = `mailto:${SITE.email}?subject=${encodeURIComponent(UI('8806 Supply order', '8806 Supply 訂單'))}&body=${encodeURIComponent(orderMessage())}`; });
  $('#bag-clear').addEventListener('click', () => { bag.clear(); renderBag(); $('#bag-empty a')?.focus(); });
  $('#order-send').addEventListener('click', async () => {
    const ok = await copyText(orderMessage());
    const note = $('#order-note');
    note.textContent = ok
      ? UI('Copied! Paste it into the Instagram chat that just opened. We\'ll confirm the total and how to pay there.', '已複製！請貼到剛開啟的 Instagram 對話中，我們會在那裡確認總額與付款方式。')
      : UI('Open the chat and tell us what you\'d like to order.', '請在對話中告訴我們你想訂購的商品。');
    note.classList.add('is-done');
    if (live()) note.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: EASE_CSS });
    window.open(`https://ig.me/m/${SITE.instagram}`, '_blank', 'noopener');
  });
}

// ============================================================ shared: footer, boot

function renderFooter() {
  $('#footer-links').innerHTML = [
    [`https://www.instagram.com/${SITE.instagram}/`, `Instagram @${SITE.instagram}`],
    [SITE.facebook, 'Facebook'],
    [SITE.tba, 'The Blue Alliance'],
    [SITE.frcEvents, 'FRC Events'],
    [SITE.github, 'GitHub'],
  ].map(([h, l]) => `<li><a href="${h}" target="_blank" rel="noopener">${esc(l)}</a></li>`).join('');
  $('#concept-notice').hidden = !SITE.conceptNotice;
}

if (PAGE === 'shop') {
  initLang({
    en: { title: '8806 Supply · The FRC Team 8806 shop', desc: 'Tees, a hoodie, a cap, trading pins and more, designed around our robot and our crest. Made to order for FRC Team 8806 from New Taipei City.' },
    'zh-Hant': { title: '8806 Supply · FRC 8806 隊伍商店', desc: 'T 恤、連帽衫、棒球帽、交換徽章等商品，圍繞著我們的機器人與隊徽設計。FRC 8806 新北市崇光高中，接單後製作。' },
  });
  initShop();
} else if (PAGE === 'product') initProduct();
else if (PAGE === 'bag') initBag();
onLang(renderFooter);
onLang(paintCount);
applyLang();
initMenu();
initProgress();
initMotion();
initSmoothScroll();
