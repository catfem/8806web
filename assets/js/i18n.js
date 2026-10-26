// Language for every page: English inline, Traditional Chinese in data-zh / data-zh-aria / data-zh-alt /
// data-zh-placeholder attributes and UI('en', 'zh') in scripts. The head script picks the language before
// the first paint (?lang=zh|en, then the saved choice, then the browser); the nav toggle switches it and
// remembers it. Shared by the home page (main.js) and the shop (shop.js).
const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let lang = root.getAttribute('data-lang') === 'zh-Hant' ? 'zh-Hant' : 'en';
let meta = null;
const listeners = [];

export const getLang = () => lang;
export const zh = () => lang === 'zh-Hant';
export const t = (o) => (o == null ? '' : typeof o === 'string' ? o : (zh() ? o.zh : o.en) ?? o.en);
export const UI = (en, zhText) => (zh() ? zhText : en);
// Runs now and after every language switch.
export const onLang = (fn) => { listeners.push(fn); fn(); };

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (n) => 'NT$' + Math.round(n).toLocaleString('en-US');

// `pageMeta` is { en: { title, desc }, 'zh-Hant': { title, desc } } or a function returning it.
export function initLang(pageMeta) {
  meta = pageMeta;
  $('#lang-toggle')?.addEventListener('click', () => {
    lang = zh() ? 'en' : 'zh-Hant';
    try { localStorage.setItem('lang', lang); } catch (e) { /* storage unavailable */ }
    applyLang();
  });
}

export function applyLang() {
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
  if (toggle) {
    // The name starts with the visible label (speech input), in the language it is written in.
    toggle.textContent = zh() ? 'EN' : '中文';
    toggle.lang = zh() ? 'en' : 'zh-Hant';
    toggle.setAttribute('aria-label', zh() ? 'EN – Switch to English' : '中文 – 切換為中文');
  }
  const m = (typeof meta === 'function' ? meta() : meta)?.[lang];
  if (m) {
    document.title = m.title;
    const d = $('meta[name="description"]');
    if (d) d.content = m.desc;
  }
  listeners.forEach((fn) => fn());
}

// Copy text to the clipboard; falls back to a hidden textarea where the async API is refused.
export async function copyText(text) {
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
