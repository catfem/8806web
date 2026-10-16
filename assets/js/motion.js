// Motion ("the plotter": the page is the CAD session that plots Drawing Set 8806) and smooth scrolling.
// Three drivers share one grammar; the CSS lives in motion.css, this file flips state classes and runs
// the few script animations.
// - Scroll is the pen. Linework (the drawing border trace, sheet cuts and "+" ticks, the BOM rules, the
//   budget's dimensions, the 2026 hatch) is plotted by the visitor's scroll through CSS scroll-driven
//   animations (html.sda, set by the head script where they are supported; ?sda=0 forces the fallback).
//   It stops when scrolling stops and un-draws on the way back up. Never text, never a fact. Without
//   scroll timelines the one-shot plotter below draws the same linework once, and a small JS trace
//   (initPlotFallback) keeps the border trace.
// - Arrival regenerates. Blocks that carry text arrive once, in 1 s or less: headlines are cut in by a
//   toolpath, sheet headers type in, counts are read off odometer wheels (roll), event records are plotted
//   row by row (initPlot). .is-in is added once and never taken away.
// - Touch picks: hover and focus select (grips, a lit row); clicks answer (the item balloon flies into the
//   pledge, the budget re-measures, the robot's tab bar slides).
// html.mo ("motion on") is set by the head script unless reduced motion is asked for. Every hidden
// starting state in motion.css hangs off it, so without it (reduced motion, print, no JavaScript, or the
// head script's 3 s backstop when this file never runs) the page paints its final state, and every helper
// here returns at once.
// Desktop wheel scrolling glides (Lenis, loaded on idle); touch and reduced motion keep native scrolling.
// Every in-page jump goes through goTo(), which lands under the nav, updates the hash and moves focus.

export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
// Quart-out: the JavaScript twin of --ease (Lenis jumps, the robot's entry scrub). EASE_CSS is the same
// curve for script animations (WAAPI).
export const EASE = (t) => 1 - (1 - t) ** 4;
export const EASE_CSS = 'cubic-bezier(.22,1,.36,1)';
const EASE_IO_CSS = 'cubic-bezier(.65,0,.35,1)';
// The reading line, 35% down the screen: the sheet being read is the one under it (the rail, the zone
// cursor, the border trace). As an IntersectionObserver rootMargin it is a line, not a band (a box that
// touches it counts), so a zone or sheet boundary switches exactly there; the CSS twin is
// view-timeline-inset: 35% 65% (motion.css).
export const PEN = '-35% 0px -65% 0px';

const root = document.documentElement;
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const motionOn = () => root.classList.contains('mo');
const live = () => motionOn() && !REDUCED.matches;
const jumping = () => root.classList.contains('is-jumping');
const phone = () => matchMedia('(max-width: 760px)').matches;

let lenis = null;
export const getLenis = () => lenis;

// ============================================================ reveal, draw, counters, records

export function initMotion() {
  // Staggered groups: the container stays put and its children place one after another (motion.css).
  // Children are re-rendered on a language switch, so the index is rewritten whenever they change.
  $$('[data-stagger]').forEach((box) => {
    const index = () => [...box.children].forEach((c, i) => c.style.setProperty('--i', i));
    index();
    new MutationObserver(index).observe(box, { childList: true });
  });
  typeIndex();

  // One-shot observers. An element is in once its top passes a line near the bottom of the screen. The
  // observed area reaches far above the screen, so whatever is already above (a deep link) or was
  // scrolled past between two frames (a fast scroll or jump) counts as in too, and nothing can stay
  // hidden. What enters together on screen is staggered top to bottom, then left to right (the entry's
  // own rect: no layout read), 60 ms apart and at most 6 steps (phones: 40 ms, 4). During an in-page
  // jump nothing waits, and a sheet header passed on the way is simply there (data-instant: no typing).
  const once = (targets, bottom, stagger) => {
    const io = new IntersectionObserver((entries) => {
      const jump = jumping();
      const step = phone() ? 40 : 60, cap = phone() ? 4 : 6;
      let n = 0;
      entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((e) => {
          const el = e.target;
          if (stagger && el.hasAttribute('data-reveal')) {
            const d = jump || e.boundingClientRect.bottom <= 0 ? 0 : Math.min(n++, cap) * step;
            if (d) el.style.setProperty('--d', d + 'ms'); else el.style.removeProperty('--d');
          }
          if (jump && el.classList.contains('strip')) el.dataset.instant = '';
          el.classList.add('is-in');
          io.unobserve(el);
        });
    }, { rootMargin: `100000px 0px ${bottom} 0px`, threshold: 0 });
    targets.forEach((el) => io.observe(el));
  };
  // Content (fades and rises; the "+" ticks and zone letters of a sheet) 8% up from the bottom (phones
  // 6%), then geometry (draw-ins and the sheet headers) 15% up.
  once($$('[data-reveal], .sec, .gallery'), phone() ? '-6%' : '-8%', true);
  once($$('[data-draw], .strip'), '-15%', false);

  initCounters();
  initPlot();

  // Focus that reaches a block before its reveal (fast tabbing) places it at once and for good.
  document.addEventListener('focusin', (e) => {
    const box = e.target.closest?.('[data-reveal], [data-stagger]');
    if (box && !box.classList.contains('is-in')) box.classList.add('is-in');
  });

  // The backstop in the head script removes .mo after 3 s unless this ran; it is never added back.
  window.__motionReady = true;

  // Reduced motion switched on while the page is open: final states, native scrolling, no overlays.
  REDUCED.addEventListener?.('change', (e) => {
    if (!e.matches) return;
    root.classList.remove('mo', 'is-boot');
    lenis?.destroy();
    lenis = null;
    $$('.odo, .fly').forEach((el) => el.remove());
  });

  initPlotFallback();
}

// ------------------------------------------------------------ sheet headers: typed in (motion.css)

// Each label types in one step per character (at most 32), so the caret ends exactly after the last
// glyph. The id and the meta line run one after the other, and together they finish within 1 s: the
// meta gets the steps the id leaves (48 in all). Rewritten when the text changes (a language switch); a
// finished animation stays finished.
function typeIndex() {
  const strips = $$('.strip');
  const count = (el) => Array.from(el.textContent.replace(/\s+/g, ' ').trim()).length || 1;
  const set = (el, k, v) => { if (el.style.getPropertyValue(k) !== String(v)) el.style.setProperty(k, v); };
  const index = () => strips.forEach((s) => {
    const id = s.querySelector(':scope > .strip__id'), meta = s.querySelector(':scope > .strip__meta');
    const nId = id ? Math.min(32, count(id)) : 1;
    if (id) set(id, '--n', nId);
    if (meta) set(meta, '--n', Math.max(1, Math.min(32, 48 - nId, count(meta))));
    set(s, '--n-id', nId);
  });
  index();
  const mo = new MutationObserver(index);
  strips.forEach((s) => mo.observe(s, { characterData: true, childList: true, subtree: true }));
}

// ------------------------------------------------------------ odometer counts (never money)

// A count is read off mechanical wheels: as it comes into view the wheels spin from 0 and land on the
// real value (the units wheel makes one extra turn). The real number stays in the DOM throughout (its
// glyphs are only made transparent while the aria-hidden overlay rolls), so nothing beside it moves and
// the value is never wrong. A number on screen when the page opens is a fact the visitor has read: it
// never rolls. A count wholly below the fold is armed (wheels at 0) a little before it arrives.
const WHEEL = Array.from({ length: 20 }, (_, k) => `<span>${k % 10}</span>`).join('');
const odoOf = (el) => el.querySelector(':scope > .odo');
function arm(el) {
  if (odoOf(el)) return odoOf(el);
  const ch = Array.from(el.textContent.trim());
  const o = document.createElement('span');
  o.className = 'odo';
  o.setAttribute('aria-hidden', 'true');
  o.innerHTML = ch.map((c, i) => (/\d/.test(c)
    ? `<span class="odo__c"><span class="odo__s" data-n="${+c + (i === ch.length - 1 ? 10 : 0)}">${WHEEL}</span></span>`
    : `<span class="odo__c">${c}</span>`)).join('');
  el.append(o);
  return o;
}
const disarm = (el) => odoOf(el)?.remove();
function roll(el) {
  if (!live() || jumping()) { disarm(el); return; } // the number simply stays final
  const o = arm(el);
  // whole pixels per row (motion.css), read once here: the last frame matches the real digits exactly
  const row = Math.round(parseFloat(getComputedStyle(el).lineHeight)) || el.offsetHeight;
  const anims = $$('.odo__s', o).map((s) => s.animate(
    [{ transform: 'translateY(0)' }, { transform: `translateY(-${s.dataset.n * row}px)` }],
    { duration: 800, easing: EASE_CSS, fill: 'forwards' }));
  const done = () => o.remove();
  Promise.all(anims.map((a) => a.finished)).then(done, done);
  setTimeout(done, 1500);
}
function initCounters() {
  const els = $$('[data-count]');
  const settled = new WeakSet(); // rolled, or on screen at load: never armed again
  let opening = true;
  const counters = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      counters.unobserve(el);
      prearm.unobserve(el);
      settled.add(el);
      if (opening) disarm(el); else roll(el);
    });
    opening = false;
  }, { threshold: 0.6 });
  const prearm = new IntersectionObserver((entries) => entries.forEach((e) => {
    const el = e.target;
    if (settled.has(el)) return;
    if (!e.isIntersecting) disarm(el);
    // wholly below the fold, so never read yet (whichever observer reports first at load)
    else if (live() && !jumping() && e.boundingClientRect.top >= innerHeight) arm(el);
  }), { rootMargin: '0px 0px 25% 0px' });
  els.forEach((el) => {
    el.style.setProperty('--digits', String(+el.dataset.count).length);
    counters.observe(el);
    prearm.observe(el);
  });
  // A language switch never waits for a roll: every number is final at once.
  new MutationObserver(() => $$('.odo').forEach((o) => o.remove())).observe(root, { attributes: true, attributeFilter: ['data-lang'] });
}

// ------------------------------------------------------------ event records, plotted row by row

// Each season ([data-plot]) is plotted once as it arrives (8% up from the bottom; phones 6%): its media
// and head place, then its record table row by row (motion.css). Seasons are re-rendered on a language
// switch: a season already plotted comes back final (data-instant, keyed by data-key), the others stay
// observed. Whatever is reached by a jump, or by keyboard focus, is placed at once.
function initPlot() {
  const plotted = new Set();
  const place = (el, instant) => {
    if (instant) el.dataset.instant = '';
    plotted.add(el.dataset.key);
    el.classList.add('is-in');
    io.unobserve(el);
  };
  // A deep link (#results, ?lang=zh#budget) lands like a jump: what it opens on is simply there. The
  // browser keeps the target in view until the page has loaded, so the landing lasts until then (or the
  // visitor's first input).
  let landing = !!location.hash;
  if (landing) {
    const stop = () => { landing = false; };
    const after = () => requestAnimationFrame(() => requestAnimationFrame(stop));
    if (document.readyState === 'complete') after(); else addEventListener('load', after, { once: true });
    for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown']) addEventListener(type, stop, { once: true, passive: true, capture: true });
  }
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) place(e.target, landing || jumping());
  }), { rootMargin: `100000px 0px ${phone() ? '-6%' : '-8%'} 0px` });
  const scan = (box) => box.querySelectorAll('[data-plot]').forEach((el) => {
    if (el.classList.contains('is-in')) return;
    if (plotted.has(el.dataset.key)) place(el, true); else io.observe(el);
  });
  scan(document);
  $$('[data-plot-host]').forEach((h) => new MutationObserver(() => scan(h)).observe(h, { childList: true }));
  document.addEventListener('focusin', (e) => {
    const el = e.target.closest?.('[data-plot]');
    if (el && !el.classList.contains('is-in')) place(el, true);
  });
}

// ------------------------------------------------------------ the border trace without scroll timelines

// Where CSS scroll-driven animations are missing (or ?sda=0), the sheet trace in the drawing border
// (≥761px) and the phone nav bar (≤760px) are driven from here: one rAF per scroll writes two transforms.
// Geometry is cached at start, on resize, load, fonts.ready and when #main changes size; nothing is
// measured while scrolling.
function initPlotFallback() {
  const mo = motionOn(), sda = root.classList.contains('sda');
  const jsTrace = mo && !sda;
  const jsNav = mo && (!sda || !CSS.supports('timeline-scope: none'));
  if (!jsTrace && !jsNav) return;
  const secs = $$('main > .sec');
  const traces = secs.map((s) => {
    const t = s.querySelector(':scope > .trace');
    return t && { t, ln: t.querySelector('.trace__ln'), pen: t.querySelector('.trace__pen') };
  });
  const bars = $$('#nav .nav__plot > span');
  let geo = [], cur = -1, raf = 0;
  const paint = () => {
    raf = 0;
    const y = scrollY + innerHeight * 0.35;
    let i = -1;
    for (let k = 0; k < geo.length; k++) if (geo[k].top <= y && y < geo[k].top + geo[k].h) { i = k; break; }
    if (i !== cur) {
      if (cur >= 0) {
        const o = traces[cur];
        if (jsTrace && o) { o.t.classList.remove('is-cur'); o.ln.style.removeProperty('transform'); o.pen.style.removeProperty('transform'); }
        if (jsNav && bars[cur]) { bars[cur].classList.remove('is-cur'); bars[cur].style.removeProperty('transform'); }
      }
      cur = i;
      if (i >= 0) {
        if (jsTrace) traces[i]?.t.classList.add('is-cur');
        if (jsNav) bars[i]?.classList.add('is-cur');
      }
    }
    if (i < 0) return;
    const { top, h } = geo[i], p = (y - top) / h;
    const o = traces[i];
    if (jsTrace && o) {
      o.ln.style.transform = `scaleY(${p.toFixed(4)})`;
      o.pen.style.transform = `translateY(${(p * h - 2.5).toFixed(1)}px)`;
    }
    if (jsNav && bars[i]) bars[i].style.transform = `scaleX(${p.toFixed(4)})`;
  };
  const measure = () => {
    geo = secs.map((s) => { const r = s.getBoundingClientRect(); return { top: r.top + scrollY, h: Math.max(1, r.height) }; });
    paint();
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
  addEventListener('resize', measure);
  addEventListener('load', measure);
  document.fonts?.ready.then(measure);
  new ResizeObserver(measure).observe(document.getElementById('main'));
  measure();
}

// ------------------------------------------------------------ small script animations (clicks, state)

// A label that changes (the title block's sheet number, the robot's view label) rolls up into place.
export function rollIn(el) {
  if (!el || !live() || jumping()) return;
  el.animate([{ transform: 'translateY(70%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 320, easing: EASE_CSS });
}

// The budget's lit dimension re-measures (scaleX 0 → 1) when the scope toggle picks it. A script
// animation sits above the scroll-linked one; when it ends the scroll-linked value resumes.
export function remeasure(els) {
  if (!live()) return;
  els.forEach((el) => el.animate([{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: 320, easing: EASE_CSS }));
}

// Pledge stepper: the new quantity (already written) rolls in from below on +, from above on −.
export function tickDigit(el, dir) {
  if (!el || !live()) return;
  el.animate([{ transform: `translateY(${dir * 45}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 160, easing: EASE_CSS });
}

// The item balloon flies from the + button into its cart line (or the phone dock's total) on a
// right-angled path, across then up or down, and the target pings when it lands. Skipped when the target
// is missing or off screen, and during a jump.
const PING = [{ transform: 'none' }, { transform: 'scale(1.25)', borderColor: '#2a6df4', offset: 0.4 }, { transform: 'none' }];
export function fly(from, to, n) {
  if (!from || !to || !live() || jumping()) return;
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  if (!b.width || b.bottom <= 0 || b.top >= innerHeight || b.right <= 0 || b.left >= innerWidth) return;
  const S = 18; // .balloon--sm
  const x0 = a.left + a.width / 2 - S / 2, y0 = a.top + a.height / 2 - S / 2;
  const x1 = b.left + b.width / 2 - S / 2, y1 = b.top + b.height / 2 - S / 2;
  const g = document.createElement('span');
  g.className = 'balloon balloon--sm fly';
  g.setAttribute('aria-hidden', 'true');
  g.textContent = n;
  document.body.append(g);
  const anim = g.animate([
    { transform: `translate(${x0}px, ${y0}px) scale(0.4)`, opacity: 0 },
    { transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1, offset: 0.15 },
    { transform: `translate(${x1}px, ${y0}px)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${x1}px, ${y1}px)`, opacity: 1 },
  ], { duration: 640, easing: EASE_IO_CSS, fill: 'forwards' });
  let over = false;
  const end = (landed) => {
    if (over) return;
    over = true;
    g.remove();
    if (landed && to.isConnected && live()) to.animate(PING, { duration: 600, easing: EASE_CSS });
  };
  anim.finished.then(() => end(true), () => end(false));
  setTimeout(() => end(false), 1000);
}

// The first time the pledge becomes sendable, "Send via Instagram" arms: its grips flash and a blue line
// sweeps along its bottom edge (motion.css), once.
export function armSend(btn) {
  if (!btn || !live()) return;
  btn.classList.remove('is-armed');
  void btn.offsetWidth; // restart
  btn.classList.add('is-armed');
  let t = 0;
  const off = () => { clearTimeout(t); btn.classList.remove('is-armed'); btn.removeEventListener('animationend', onEnd); };
  const onEnd = (e) => { if (e.pseudoElement === '::after') off(); };
  btn.addEventListener('animationend', onEnd);
  t = setTimeout(off, 1200);
}

// ============================================================ jumps

// html.is-jumping: content on the way and at the destination is shown at once (motion.css), so a sponsor
// who clicks "Budget" arrives at a budget that is already there. Scroll-linked linework is position-
// mapped, so it lands finished too.
let jumpTimer = 0;
const endJump = (delay = 150) => {
  clearTimeout(jumpTimer);
  jumpTimer = setTimeout(() => root.classList.remove('is-jumping'), delay);
};
const startJump = (safety) => {
  root.classList.add('is-jumping');
  endJump(safety);
};
// A native jump (no Lenis): ends on scrollend, or after the fallback when nothing had to move. Its
// listeners belong to this jump only: the next jump, the visitor's own touch, wheel or keys, Back /
// Forward, or the safety timer cancels them, so a later scroll is never pulled back to an old target.
let jumpAc = null;
const nativeJump = () => {
  jumpAc?.abort();
  const ac = (jumpAc = new AbortController()), { signal } = ac;
  startJump(1300);
  setTimeout(() => ac.abort(), 2500);
  for (const type of ['touchstart', 'wheel', 'keydown', 'popstate']) addEventListener(type, () => ac.abort(), { capture: true, passive: true, signal });
  addEventListener('scrollend', () => endJump(), { once: true, signal });
  return signal;
};

// Focus follows the jump. Sections are not controls: they take focus without a ring.
const FOCUSABLE = 'a[href], area[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable]';
let focusing = false; // set only while goTo() moves focus, so its own focusin doesn't stop the glide
function focusOn(el) {
  if (!el) return;
  if (!el.matches(FOCUSABLE)) {
    el.setAttribute('tabindex', '-1');
    el.setAttribute('data-jump-focus', '');
  }
  focusing = true;
  el.focus({ preventScroll: true });
  focusing = false;
}

// html scroll-padding: the nav on top (Lenis subtracts it itself, the centre offset needs it) and, on
// phones, the dock at the bottom; a centred target sits between the two.
let navH = 0, padB = 0;
const readNav = () => {
  const cs = getComputedStyle(root);
  navH = parseFloat(cs.scrollPaddingTop) || 0;
  padB = parseFloat(cs.scrollPaddingBottom) || 0;
};

// Every in-page jump: nav and rail links, the dock, the hero buttons (through the anchor listener below),
// a price tag to its row of the parts list, the camera tag to the budget.
export function goTo(el, { block = 'start', hash, focus = el } = {}) {
  if (!el) return;
  if (hash && hash !== location.hash) history.pushState(null, '', hash);
  // Where the target should sit when the jump ends (a 'start' target just under the nav).
  const want = () => (block === 'center' ? Math.max(navH, (innerHeight + navH - padB - el.offsetHeight) / 2) : navH);
  // The glide is measured once, at the click. Something above the target can still change size on the
  // way (an image, the robot's no-WebGL stand-in), so the landing is checked and corrected at the end.
  const missed = () => Math.abs(el.getBoundingClientRect().top - want()) > 2;
  if (lenis) {
    const offset = block === 'center' ? -Math.max(0, (innerHeight - navH - padB - el.offsetHeight) / 2) : 0;
    const dy = el.getBoundingClientRect().top - navH + offset;
    const duration = Math.min(1.2, Math.max(0.6, 0.45 + Math.sqrt(Math.abs(dy)) / 150));
    startJump(duration * 1000 + 300);
    lenis.scrollTo(el, { offset, duration, easing: EASE, onComplete: () => {
      if (missed()) lenis.scrollTo(el, { offset, immediate: true, force: true });
      focusOn(focus);
      endJump();
    } });
    return;
  }
  readNav();
  if (!missed()) { jumpAc?.abort(); focusOn(focus); return; } // already there: nothing to scroll or correct
  const signal = nativeJump();
  el.scrollIntoView({ behavior: REDUCED.matches ? 'auto' : 'smooth', block });
  addEventListener('scrollend', () => { if (missed()) el.scrollIntoView({ behavior: 'instant', block }); }, { once: true, signal });
  focusOn(focus);
}

// ============================================================ smooth scrolling

export function initSmoothScroll() {
  // In-page links all go through goTo(): with Lenis it glides there, without it the browser scrolls
  // (smooth on touch, instant with reduced motion). Either way the hash updates and focus follows, so the
  // next Tab continues from the section. The skip link stays native.
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest?.('a[href^="#"]');
    if (!a || a.classList.contains('skip')) return;
    const hash = a.getAttribute('href');
    let el = null;
    try { el = hash.length > 1 && document.getElementById(decodeURIComponent(hash.slice(1))); } catch (err) { /* malformed */ }
    if (!el) return;
    e.preventDefault();
    goTo(el, { hash });
  });

  // Desktop only: a fine pointer that can hover, not reduced motion, not data saver.
  if (REDUCED.matches || !matchMedia('(hover: hover) and (pointer: fine)').matches || navigator.connection?.saveData) return;

  const start = () => import('lenis').then(({ default: Lenis }) => {
    if (REDUCED.matches || lenis) return;
    readNav();
    addEventListener('resize', readNav);
    // Lenis drives the real window scroll (no transformed wrapper), so every observer, sticky element,
    // scroll listener and scroll timeline keeps working. It runs its own rAF; anchors are ours (goTo).
    lenis = new Lenis({
      lerp: 0.1, smoothWheel: true, syncTouch: false, wheelMultiplier: 1,
      autoRaf: true, anchors: false, stopInertiaOnNavigate: true,
      autoResize: true, overscroll: true, allowNestedScroll: false,
      // Lenis 1.3.26 ends a glide when Math.round(value) === Math.round(target), which never happens for a
      // target on exactly .5px (38.49… rounds down, 38.5 up): it would glide forever and undo any other
      // scroll. Small trackpad deltas can add up to such a target, so wheel targets stay on whole pixels.
      virtualScroll: (d) => {
        if (lenis && d.event.type.includes('wheel')) d.deltaY = Math.round(lenis.targetScroll + d.deltaY) - lenis.targetScroll;
      },
    });
    // The keyboard and focus win: a key that scrolls, or focus moving somewhere goTo() didn't send it,
    // stops a glide, then the browser's own scroll runs and Lenis follows it.
    const KEYS = ['PageUp', 'PageDown', 'Home', 'End', ' ', 'ArrowUp', 'ArrowDown'];
    addEventListener('keydown', (e) => {
      if (!lenis || lenis.isScrolling !== 'smooth' || !KEYS.includes(e.key)) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
      if (e.key === ' ' && t?.closest('button, a[href], summary, [role="button"], [role="tab"]')) return;
      lenis.reset();
    }, true);
    document.addEventListener('focusin', () => { if (lenis && !focusing) lenis.reset(); });
    // Back / Forward during a jump glide: the browser's own scroll restoration wins (reset() also drops the
    // glide's onComplete, so neither the landing correction nor the focus move runs).
    addEventListener('popstate', () => { if (lenis?.isScrolling === 'smooth') { lenis.reset(); endJump(0); } });
  }).catch(() => { /* stays native */ });

  // Soon after the page is interactive (this module runs after parsing), not after every image has loaded:
  // on a slow connection 'load' can come seconds after the page is readable. The module is preloaded.
  if (window.requestIdleCallback) requestIdleCallback(start, { timeout: 300 }); else setTimeout(start, 1);
}
