// Motion ("the plotter") and smooth scrolling. Construction lines draw first, content places, annotations
// land last, then everything rests: the CSS lives in motion.css, this file only flips state classes.
// - html.mo ("motion on") is set by the head script unless reduced motion is asked for. Every hidden
//   starting state in motion.css hangs off it, so without it (reduced motion, print, no JavaScript, or the
//   head script's 3 s backstop when this file never runs) the page paints its final state.
// - .is-in is the one state class, added once by an IntersectionObserver and never taken away.
// - Desktop wheel scrolling glides (Lenis, loaded on idle); touch and reduced motion keep native scrolling.
//   Every in-page jump goes through goTo(), which lands under the nav, updates the hash and moves focus.

export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
// Quart-out: the JavaScript twin of --ease (counters, Lenis jumps).
export const EASE = (t) => 1 - (1 - t) ** 4;

const root = document.documentElement;
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const motionOn = () => root.classList.contains('mo');
const phone = () => matchMedia('(max-width: 760px)').matches;

let lenis = null;
export const getLenis = () => lenis;

// ============================================================ reveal, draw, counters

export function initMotion() {
  // Staggered groups: the container stays put and its children place one after another (motion.css).
  // Children are re-rendered on a language switch, so the index is rewritten whenever they change.
  $$('[data-stagger]').forEach((box) => {
    const index = () => [...box.children].forEach((c, i) => c.style.setProperty('--i', i));
    index();
    new MutationObserver(index).observe(box, { childList: true });
  });

  // One-shot observers. An element is in once its top passes a line near the bottom of the screen. The
  // observed area reaches far above the screen, so whatever is already above (a deep link) or was
  // scrolled past between two frames (a fast scroll or jump) counts as in too, and nothing can stay
  // hidden. What enters together on screen is staggered top to bottom, then left to right (the entry's
  // own rect: no layout read), 60 ms apart and at most 6 steps (phones: 40 ms, 4). During an in-page
  // jump nothing waits.
  const once = (targets, bottom, stagger) => {
    const io = new IntersectionObserver((entries) => {
      const jumping = root.classList.contains('is-jumping');
      const step = phone() ? 40 : 60, cap = phone() ? 4 : 6;
      let n = 0;
      entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((e) => {
          const el = e.target;
          if (stagger && el.hasAttribute('data-reveal')) {
            const d = jumping || e.boundingClientRect.bottom <= 0 ? 0 : Math.min(n++, cap) * step;
            if (d) el.style.setProperty('--d', d + 'ms'); else el.style.removeProperty('--d');
          }
          el.classList.add('is-in');
          io.unobserve(el);
        });
    }, { rootMargin: `100000px 0px ${bottom} 0px`, threshold: 0 });
    targets.forEach((el) => io.observe(el));
  };
  // Content (fades and rises; the "+" ticks and zone letters of a sheet) 8% up from the bottom (phones
  // 6%), then geometry (draw-ins and the strip sweeps) 15% up.
  once($$('[data-reveal], .sec, .gallery'), phone() ? '-6%' : '-8%', true);
  once($$('[data-draw], .strip'), '-15%', false);

  // Counters (never money): 0 → the value over 900 ms. The box is sized for the final number up front
  // (--digits, tabular figures), so the "+" after it and the label never move.
  // A number that is already on screen when the page opens (the hero scoreboard) is a fact the visitor
  // has read: it never resets to 0. Only numbers scrolled into view count up.
  let opening = true;
  const counters = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      counters.unobserve(e.target);
      if (motionOn() && !opening) count(e.target);
    });
    opening = false;
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => {
    el.style.setProperty('--digits', String(+el.dataset.count).length);
    counters.observe(el);
  });

  // Focus that reaches a block before its reveal (fast tabbing) places it at once and for good.
  document.addEventListener('focusin', (e) => {
    const box = e.target.closest?.('[data-reveal], [data-stagger]');
    if (box && !box.classList.contains('is-in')) box.classList.add('is-in');
  });

  // The backstop in the head script removes .mo after 3 s unless this ran; it is never added back.
  window.__motionReady = true;

  // Reduced motion switched on while the page is open: final states, native scrolling.
  REDUCED.addEventListener?.('change', (e) => {
    if (!e.matches) return;
    root.classList.remove('mo', 'is-boot');
    lenis?.destroy();
    lenis = null;
  });
}

function count(el) {
  const end = +el.dataset.count, t0 = performance.now(), dur = 900;
  const step = (now) => {
    const k = Math.min(1, Math.max(0, (now - t0) / dur)); // a frame stamped before t0 must not go below 0
    el.textContent = Math.round(end * EASE(k));
    if (k < 1) requestAnimationFrame(step);
  };
  el.textContent = '0';
  requestAnimationFrame(step);
}

// ============================================================ jumps

// html.is-jumping: content on the way and at the destination is shown at once (motion.css), so a sponsor
// who clicks "Budget" arrives at a budget that is already there. Geometry still draws on arrival.
let jumpTimer = 0;
const endJump = (delay = 150) => {
  clearTimeout(jumpTimer);
  jumpTimer = setTimeout(() => root.classList.remove('is-jumping'), delay);
};
const startJump = (safety) => {
  root.classList.add('is-jumping');
  endJump(safety);
};
// A native jump (no Lenis): ends on scrollend, or after the fallback when nothing had to move.
const nativeJump = () => {
  startJump(1300);
  addEventListener('scrollend', () => endJump(), { once: true });
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

let navH = 0; // html scroll-padding-top (= --nav-h): Lenis subtracts it itself, the centre offset needs it
const readNav = () => { navH = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0; };

// Every in-page jump: nav and rail links, the dock, the hero buttons (through the anchor listener below),
// a price tag to its row of the parts list, the camera tag to the budget.
export function goTo(el, { block = 'start', hash, focus = el } = {}) {
  if (!el) return;
  if (hash && hash !== location.hash) history.pushState(null, '', hash);
  // Where the target should sit when the jump ends (a 'start' target just under the nav).
  const want = () => (block === 'center' ? Math.max(navH, (innerHeight + navH - el.offsetHeight) / 2) : navH);
  // The glide is measured once, at the click. Something above the target can still change size on the
  // way (an image, the robot's no-WebGL stand-in), so the landing is checked and corrected at the end.
  const missed = () => Math.abs(el.getBoundingClientRect().top - want()) > 2;
  if (lenis) {
    const offset = block === 'center' ? -Math.max(0, (innerHeight - navH - el.offsetHeight) / 2) : 0;
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
  nativeJump();
  readNav();
  el.scrollIntoView({ behavior: REDUCED.matches ? 'auto' : 'smooth', block });
  addEventListener('scrollend', () => { if (missed()) el.scrollIntoView({ behavior: 'instant', block }); }, { once: true });
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
    // Lenis drives the real window scroll (no transformed wrapper), so every observer, sticky element and
    // scroll listener keeps working. It runs its own rAF; anchors are ours (goTo).
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
  }).catch(() => { /* stays native */ });

  // Soon after the page is interactive (this module runs after parsing), not after every image has loaded:
  // on a slow connection 'load' can come seconds after the page is readable. The module is preloaded.
  if (window.requestIdleCallback) requestIdleCallback(start, { timeout: 300 }); else setTimeout(start, 1);
}
