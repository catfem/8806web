// The printed sponsor card on the robot's elevator tower. It has no three.js dependency, so the page
// can also draw it on a plain 2D canvas when WebGL is unavailable.
export const FONT_STACK = '"Inter", -apple-system, "SF Pro Display", "Segoe UI", "PingFang TC", "Noto Sans TC", Arial, sans-serif';

// Split `text` into at most two lines that fit `max` px at the current ctx.font (break at a space).
function wrap2(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return [text];
  const words = text.split(' ');
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' '), b = words.slice(i).join(' ');
    const w = Math.max(ctx.measureText(a).width, ctx.measureText(b).width);
    if (!best || w < best.w) best = { w, lines: [a, b] };
  }
  return best && best.w <= max ? best.lines : null;
}

// Lay out `text` at `size`, shrinking toward `min` only if even two lines don't fit -> { lines, size, fits }.
function fitLines(ctx, text, weight, size, max, min) {
  for (let s = size; s >= min; s -= 2) {
    ctx.font = `${weight} ${s}px ${FONT_STACK}`;
    const lines = wrap2(ctx, text, max);
    if (lines) return { lines, size: s, fits: true };
  }
  return { lines: [text], size: min, fits: false };
}

// Card layout on a w x h canvas (designed at 1024 x 1366; everything scales with w).
// Every supporter is drawn at one size; long names wrap onto two lines instead of shrinking.
// A typed name gets a highlighted slot at the top and all supporters stay listed below it.
export function drawSponsorPanel(ctx, w, h, name = '', sponsors = []) {
  const k = w / 1024;
  const rr = (x, y, rw, rh, rad) => (ctx.roundRect ? ctx.roundRect(x, y, rw, rh, rad) : ctx.rect(x, y, rw, rh));
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f6f7f9';
  ctx.beginPath(); rr(0, 0, w, h, 26 * k); ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // header
  ctx.fillStyle = '#6b7484';
  ctx.font = `700 ${44 * k}px ${FONT_STACK}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${4 * k}px`;
  ctx.fillText('PROUDLY SUPPORTED BY', w / 2, 118 * k);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.fillStyle = '#d5d9e1';
  ctx.fillRect(w / 2 - 60 * k, 150 * k, 120 * k, 5 * k);

  const maxW = w - 150 * k;
  let top = 196 * k;
  if (name) {
    const n = fitLines(ctx, name, 800, 92 * k, maxW - 40 * k, 52 * k);
    const lh = n.size * 1.12;
    const boxH = n.lines.length * lh + 70 * k;
    ctx.fillStyle = 'rgba(47,123,255,0.12)';
    ctx.beginPath(); rr(46 * k, top, w - 92 * k, boxH, 30 * k); ctx.fill();
    ctx.lineWidth = 5 * k; ctx.strokeStyle = 'rgba(47,123,255,0.55)'; ctx.stroke();
    ctx.fillStyle = '#1f63e0';
    ctx.font = `800 ${n.size}px ${FONT_STACK}`;
    n.lines.forEach((l, i) => ctx.fillText(l, w / 2, top + 35 * k + n.size * 0.86 + i * lh));
    top += boxH + 34 * k;
  }

  // supporters: one font size for all (the largest that fits between `top` and the footer)
  const bottom = h - 178 * k, avail = bottom - top, n = sponsors.length;
  let size = 68 * k, laid = [], lh = 0, lines = 0;
  for (; size > 36 * k; size -= 2 * k) {
    laid = sponsors.map((s) => fitLines(ctx, s, 700, size, maxW, size));
    lh = size * 1.12;
    lines = laid.reduce((a, l) => a + l.lines.length, 0);
    if (laid.every((l) => l.fits) && lines * lh + (n - 1) * size * 0.4 <= avail) break;
  }
  const gap = n > 1 ? Math.min(size * 0.95, (avail - lines * lh) / (n - 1)) : 0;
  let y = top + Math.max(0, (avail - lines * lh - gap * (n - 1)) / 2);
  ctx.fillStyle = '#232833';
  laid.forEach((l) => {
    ctx.font = `700 ${l.size}px ${FONT_STACK}`;
    l.lines.forEach((line) => { ctx.fillText(line, w / 2, y + l.size * 0.9); y += lh; });
    y += gap;
  });

  // footer
  ctx.fillStyle = '#d5d9e1';
  ctx.fillRect(w / 2 - 60 * k, h - 150 * k, 120 * k, 5 * k);
  ctx.fillStyle = '#1f63e0';
  ctx.font = `800 ${64 * k}px ${FONT_STACK}`;
  ctx.fillText('FRC 8806', w / 2, h - 62 * k);
}
