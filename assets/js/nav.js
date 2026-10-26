// The nav bar, shared by every page: the phone / tablet menu and the reading line.
import { getLenis } from './motion.js';

const $ = (s, r = document) => r.querySelector(s);

// Phone / tablet menu: a button in the nav opens the list of sections.
export function initMenu() {
  const btn = $('#menu-toggle');
  const menu = $('#menu');
  if (!btn || !menu) return;
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

// A line along the nav's bottom rule shows how far down the page you are (--p, one write per frame).
export function initProgress() {
  const bar = $('.nav__progress');
  let maxScroll = 1, raf = 0;
  const layout = () => { maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight); move(); };
  const move = () => { raf = 0; bar?.style.setProperty('--p', Math.min(1, Math.max(0, scrollY / maxScroll)).toFixed(4)); };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(move); }, { passive: true });
  addEventListener('resize', layout);
  addEventListener('load', layout);
  // The page grew or shrank (images, a language switch, a re-rendered list): Lenis re-measures too,
  // unless it is gliding (its own resize debounce catches up then).
  new ResizeObserver(() => {
    layout();
    const lenis = getLenis();
    if (lenis && !lenis.isScrolling) lenis.resize();
  }).observe($('#main'));
  layout();
}
