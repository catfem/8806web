// Renders the 8806 merch images into assets/img/shop (see README.md in this folder).
//   node tools/merch/render.cjs           every product view (-600 / -1200 .webp) and the collection shot
//   node tools/merch/render.cjs --lines   first re-renders robot-lines.webp from the site's 3D model
// Serve the repo root first (python3 -m http.server 8806). Needs Playwright with Chromium.
const fs = require('fs');
const path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { pw = require(process.env.PW_PATH || 'playwright'); }
const BASE = process.env.BASE || 'http://127.0.0.1:8806';
const OUT = path.join(__dirname, '../../assets/img/shop');

// output name → studio item, view, colour (the names are the `src` of the images in shop-data.js)
const JOBS = {
  'tee-scorpion-front-black': ['tee-scorpion', 'front', 'black'],
  'tee-scorpion-back-black': ['tee-scorpion', 'back', 'black'],
  'tee-scorpion-front-white': ['tee-scorpion', 'front', 'white'],
  'tee-scorpion-back-white': ['tee-scorpion', 'back', 'white'],
  'tee-blueprint-front': ['tee-blueprint', 'front'],
  'tee-blueprint-back': ['tee-blueprint', 'back'],
  'hoodie-front': ['hoodie', 'front'],
  'hoodie-back': ['hoodie', 'back'],
  'cap-front': ['cap', 'front'],
  'pin-front': ['pin', 'front'],
  'pin-card': ['pin', 'card'],
  'stickers-front': ['stickers', 'front'],
  'tote-front': ['tote', 'front'],
  'bottle-front': ['bottle', 'front'],
};
// The collection shot (shop hero, home page shop band): [image, longest side, centre x, centre y], back to front.
const COLLECTION = { w: 2800, h: 1420, items: [
  ['tee-blueprint-front', 900, 820, 580], ['tee-scorpion-back-black', 900, 1990, 580], ['bottle-front', 740, 2520, 720],
  ['hoodie-front', 1060, 1400, 640], ['tote-front', 660, 380, 860], ['cap-front', 620, 1980, 1060], ['pin-front', 340, 860, 1130],
] };

// In a blank page: PNG (base64) → WebP at the given widths; images are cropped to their content first if asked.
const encode = (page, png, widths, q = 0.82) => page.evaluate(async ({ png, widths, q }) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
  const c = document.createElement('canvas'), x = c.getContext('2d');
  return widths.map((w) => { c.width = w; c.height = Math.round((img.height * w) / img.width); x.imageSmoothingQuality = 'high'; x.clearRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/webp', q).split(',')[1]; });
}, { png, widths, q });
const write = (name, b64) => { fs.writeFileSync(path.join(OUT, name), Buffer.from(b64, 'base64')); console.log('wrote', name); };

(async () => {
  const b = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const enc = await b.newPage();
  await enc.goto(`${BASE}/tools/merch/studio.html?item=none`); // same origin, so data URLs and canvases stay clean

  if (process.argv.includes('--lines')) {
    const p = await b.newPage({ viewport: { width: 800, height: 600 } });
    await p.goto(`${BASE}/tools/merch/lines.html?w=2200&h=2200&az=0.75&el=0.16&d=5.2&thr=40`);
    await p.waitForFunction(() => window.__done, null, { timeout: 180000 });
    const png = await p.evaluate(() => document.getElementById('c').toDataURL('image/png').split(',')[1]);
    // crop to the drawing, then thicken the 1px WebGL lines (a 3×3 dilation) and soften them a touch
    const webp = await enc.evaluate(async (png) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
      const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true });
      c.width = img.width; c.height = img.height; x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
      for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 8) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const o = document.createElement('canvas'), ox = o.getContext('2d');
      o.width = x1 - x0 + 3; o.height = y1 - y0 + 3; ox.filter = 'blur(0.6px)';
      for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) ox.drawImage(c, x0, y0, o.width - 2, o.height - 2, dx, dy, o.width - 2, o.height - 2);
      return o.toDataURL('image/webp', 1).split(',')[1];
    }, png);
    fs.writeFileSync(path.join(__dirname, 'robot-lines.webp'), Buffer.from(webp, 'base64'));
    console.log('wrote tools/merch/robot-lines.webp');
    await p.close();
  }

  const shots = {};
  const p = await b.newPage({ viewport: { width: 1600, height: 1600 } });
  for (const [name, [item, view, color = '']] of Object.entries(JOBS)) {
    await p.goto(`${BASE}/tools/merch/studio.html?item=${item}&view=${view}&color=${color}`);
    await p.waitForFunction(() => window.__done, null, { timeout: 60000 });
    shots[name] = (await p.screenshot({ omitBackground: true })).toString('base64');
    const [w1200, w600] = await encode(enc, shots[name], [1200, 600], 0.82);
    write(`${name}-1200.webp`, w1200);
    write(`${name}-600.webp`, w600);
  }

  // The collection: each image cropped to its content and placed by its centre.
  const [c2000, c1000] = await enc.evaluate(async ({ C, shots }) => {
    const load = async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); return i; };
    const crop = (img) => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
      for (let y = 0; y < c.height; y++) for (let i = 0; i < c.width; i++) if (d[(y * c.width + i) * 4 + 3] > 0) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
    };
    const out = document.createElement('canvas'); out.width = C.w; out.height = C.h;
    const ox = out.getContext('2d'); ox.imageSmoothingQuality = 'high';
    for (const [name, size, cx, cy] of C.items) {
      const img = await load(shots[name]); const [x, y, w, h] = crop(img); const k = size / Math.max(w, h);
      ox.drawImage(img, x, y, w, h, cx - (w * k) / 2, cy - (h * k) / 2, w * k, h * k);
    }
    return [2000, 1000].map((w) => { const c = document.createElement('canvas'); c.width = w; c.height = Math.round((C.h * w) / C.w); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(out, 0, 0, c.width, c.height); return c.toDataURL('image/webp', 0.82).split(',')[1]; });
  }, { C: COLLECTION, shots });
  write('collection-2000.webp', c2000);
  write('collection-1000.webp', c1000);
  await b.close();
})();
