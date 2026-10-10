// Three.js robot showcase: one click-driven viewer with three views (build, price, logo).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildRobotAsync, poseRobot } from './robot-model.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const isMobileLayout = () => matchMedia('(max-width: 760px)').matches;

function makeRenderer(canvas, maxDpr) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new RoomEnvironment();
  scene.environment = pmrem.fromScene(env, 0.04).texture;
  scene.environmentIntensity = 0.8; // a little less fill than the default, so the key light shapes the metal
  env.dispose();
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(1.6, 4.2, 2.4);
  // Rims tuned for the charcoal page: a cool-neutral edge light and a faint warm one that echoes the amber accent.
  const rim = new THREE.DirectionalLight(0xd6e0f5, 2.3);
  rim.position.set(-3, 2.5, -3.5);
  const rim2 = new THREE.DirectionalLight(0xffc46b, 1.0);
  rim2.position.set(3.5, 1.5, -2.5);
  scene.add(key, rim, rim2);
  return { renderer, scene };
}

function contactShadow(size = 1.9) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, 'rgba(0,0,0,0.75)');
  grd.addColorStop(0.45, 'rgba(0,0,0,0.35)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.002;
  return m;
}

// Floor ring that glows under the robot, a nod to the hero lighting of product pages (amber, like the page accent).
function floorGlow() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 60, 128, 128, 128);
  grd.addColorStop(0, 'rgba(245,179,42,0)');
  grd.addColorStop(0.82, 'rgba(245,179,42,0.12)');
  grd.addColorStop(0.9, 'rgba(255,196,100,0.38)');
  grd.addColorStop(1, 'rgba(245,179,42,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.75), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.001;
  return m;
}

// ------------------------------------------------------------------ custom GLB

async function loadCustomRobot(url) {
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import('three/addons/loaders/GLTFLoader.js'),
    import('three/addons/libs/meshopt_decoder.module.js'),
  ]);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const s = 1.2 / Math.max(size.y, size.x * 1.1, size.z * 1.1);
  model.scale.setScalar(s);
  model.position.set(-center.x * s, -box.min.y * s, -center.z * s);
  const root = new THREE.Group();
  root.add(model);
  root.updateMatrixWorld(true);
  const pieces = [];
  const mid = new THREE.Vector3(0, 0.45, 0);
  model.traverse((o) => {
    if (!o.isMesh) return;
    const c = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
    pieces.push({ o, base: o.position.clone(), dir: c.sub(mid).multiplyScalar(0.6 / s) });
  });
  return {
    root, anchors: {}, custom: true,
    pose(st) {
      const ex = st.explode || 0;
      root.position.y = ex * 0.2;
      pieces.forEach((p) => p.o.position.copy(p.base).addScaledVector(p.dir, ex));
    },
  };
}

// ------------------------------------------------------------------ shader warm-up

async function warmUp(renderer, scene, camera, idle) {
  camera.position.set(3, 1.6, 3);
  camera.lookAt(0, 0.6, 0);
  camera.updateMatrixWorld();
  if (renderer.extensions.has('KHR_parallel_shader_compile')) {
    try { await renderer.compileAsync(scene, camera); return; } catch (e) { /* fall back to batches */ }
  }
  const meshes = [];
  scene.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const was = meshes.map((m) => m.visible);
  const mats = [...new Set(meshes.map((m) => m.material))];
  // a tiny viewport: the programs are what we are after, not the pixels
  const vp = renderer.getViewport(new THREE.Vector4());
  renderer.setViewport(0, 0, 8, 8);
  for (let i = 0; i < mats.length; i += 4) {
    const allowed = new Set(mats.slice(0, i + 4));
    meshes.forEach((m, k) => { m.visible = was[k] && allowed.has(m.material); });
    renderer.render(scene, camera);
    await idle();
  }
  meshes.forEach((m, k) => { m.visible = was[k]; });
  renderer.setViewport(vp);
}

// ------------------------------------------------------------------ showcase

// One entry per tab. Every field is numeric so views can be blended.
//   az/el/dist: camera orbit (dist on desktop, md on phones); tx/ty/tz: look-at target
//   elevator/cycle/intake/explode/xray/lift: mechanism pose; hot: price-tag opacity
//   glow: floor ring; sway: idle camera sway (rad); spin: roller speed
//   cycle: amplitude of the slow elevator cycle (elevator travel = elevator .. elevator + 2 * cycle)
const VIEWS = {
  build: { az: 0.85, el: 0.2, dist: 4.1, md: 4.6, tx: 0, ty: 0.68, tz: 0, elevator: 0.15, cycle: 0.16, intake: 1, explode: 0, xray: 0, lift: 0, hot: 0, glow: 0.45, sway: 0.25, spin: 1 },
  price: { az: 0.78, el: 0.32, dist: 5.2, md: 6.6, tx: 0, ty: 0.95, tz: 0, elevator: 0, cycle: 0, intake: 1, explode: 1, xray: 0, lift: 0, hot: 1, glow: 0, sway: 0.1, spin: 0 },
  // the elevator is raised so the end effector clears the sponsor panel
  logo: { az: -1.4, el: 0.08, dist: 1.6, md: 1.2, tx: -0.2, ty: 0.55, tz: -0.18, elevator: 0.62, cycle: 0, intake: 0, explode: 0, xray: 0, lift: 0, hot: 0, glow: 0, sway: 0.18, spin: 0 },
};
// Aspect ratio of the view each distance was tuned for; narrower views pull the camera back.
const REF_ASPECT = { desktop: 1.05, mobile: 0.76 };
const FOV = 30;
const TWEEN_MS = 900;
const GAP = 18, PAD = 8; // GAP = .hotspot__tag margin in main.css

// Where the sponsor panel is and how big it is, if the model exposes it.
function panelInfo(robot) {
  const a = robot.anchors?.panel;
  if (!a) return null;
  robot.root.updateMatrixWorld(true);
  const center = a.getWorldPosition(new THREE.Vector3());
  const mesh = a.isMesh ? a : a.parent?.isMesh ? a.parent : null;
  let h = 0.44, w = 0.33;
  if (mesh) {
    const size = new THREE.Box3().setFromObject(mesh).getSize(new THREE.Vector3());
    if (size.y > 0.1 && size.y < 1) { h = size.y; w = Math.max(size.x, size.z); }
  }
  return { center, w, h };
}

export async function initShowcase(opts) {
  const { canvas, wrap, hotspotLayer, hotspots, onHotspot, sponsors, modelUrl, reducedMotion } = opts;
  const section = opts.section || wrap;
  const mobile = () => isMobileLayout();
  // Spread the set-up over idle slices of the main thread, so scrolling nearby stays smooth.
  const idle = () => new Promise((res) => (window.requestIdleCallback ? requestIdleCallback(() => res(), { timeout: 300 }) : setTimeout(res, 16)));
  const { renderer, scene } = makeRenderer(canvas, mobile() ? 1.5 : 2);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 50);
  await idle();

  let robot = null, pose = null;
  if (modelUrl) {
    try {
      robot = await loadCustomRobot(modelUrl);
      pose = (st) => robot.pose(st);
    } catch (e) {
      console.warn('Custom robot model failed to load, using the built-in one.', e);
    }
  }
  if (!robot) {
    robot = await buildRobotAsync({ sponsors, detail: mobile() ? 'low' : 'high', maxAnisotropy: renderer.capabilities.getMaxAnisotropy() }, idle);
    pose = (st, dt) => poseRobot(robot, st, dt);
  }
  scene.add(robot.root);
  const shadow = contactShadow();
  const glow = floorGlow();
  scene.add(shadow, glow);

  // Frame the sponsor panel from the model itself when it says where the panel is:
  // about half the view height on desktop; on phones as large as fits, so the names stay legible.
  const views = Object.fromEntries(Object.entries(VIEWS).map(([k, v]) => [k, { ...v }]));
  // A custom model has no sponsor panel: the logo tab shows the whole robot (the page draws the panel in 2D).
  if (robot.custom) Object.assign(views.logo, { ...views.build, xray: 0, lift: 0, cycle: 0, glow: 0, spin: 0 });
  else {
    pose({ ...views.logo }, 0);
    const info = panelInfo(robot);
    if (info) {
      const span = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      Object.assign(views.logo, {
        tx: info.center.x, ty: info.center.y, tz: info.center.z,
        dist: info.h / (0.52 * span),
        md: Math.max(info.h / (0.7 * span), info.w / (0.8 * span * REF_ASPECT.mobile)),
      });
    }
  }

  // Price-tag DOM. A tag click scrolls the page away, so rendering pauses briefly to keep that scroll smooth.
  let holdUntil = 0;
  // Labels are { en, zh }; the page language is 'en' or 'zh-Hant'.
  const langKey = (l) => (/^zh/i.test(l || '') ? 'zh' : 'en');
  let lang = langKey(opts.lang);
  const spots = (robot.custom ? [] : hotspots).map((h) => {
    const el = document.createElement('div');
    el.className = 'hotspot';
    el.innerHTML = '<i class="hotspot__dot"></i><button class="hotspot__tag" type="button" tabindex="-1"><b></b><span></span></button>';
    el.querySelector('button').addEventListener('click', () => { holdUntil = performance.now() + 1200; onHotspot(h); });
    hotspotLayer.appendChild(el);
    return { h, el, anchor: robot.anchors[h.anchor], b: el.querySelector('b'), s: el.querySelector('span'), btn: el.querySelector('button') };
  });
  const renderLabels = () => spots.forEach((sp) => {
    sp.b.textContent = sp.h.label[lang] ?? sp.h.label.en;
    sp.s.textContent = sp.h.tag[lang] ?? sp.h.tag.en;
    sp.w = 0;
  });
  renderLabels();

  let W = 1, H = 1;
  const resize = () => {
    W = Math.max(1, wrap.clientWidth); H = Math.max(1, wrap.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile() ? 1.5 : 2));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    spots.forEach((sp) => { sp.w = 0; });
  };
  resize();
  new ResizeObserver(resize).observe(wrap);

  // View state: `cur` is blended from `from` to `to`.
  const startView = views[opts.view] ? opts.view : 'build';
  const cur = { ...views[startView] };
  let from = { ...cur }, to = views[startView], k = 1, t0 = 0;

  // Drag to rotate (horizontal only; vertical swipes scroll the page).
  let drag = 0, vel = 0, dragging = false, settle = false, lastX = 0, pid = null;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; settle = false; vel = 0; lastX = e.clientX; pid = e.pointerId;
    canvas.setPointerCapture(pid);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pid) return;
    const dx = (e.clientX - lastX) / Math.max(W, 1);
    lastX = e.clientX;
    drag -= dx * 4;
    vel = -dx * 4;
  });
  const up = () => { dragging = false; pid = null; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('lostpointercapture', up);

  let time = 0, running = false, last = 0, raf = 0;
  const v = new THREE.Vector3();
  const look = new THREE.Vector3();
  let name = '';

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (now < holdUntil) { last = now; return; }
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    if (!reducedMotion) time += dt;

    if (k < 1) {
      // wall-clock, so a slow device still lands on the new view in time
      k = reducedMotion ? 1 : Math.min(1, (now - t0) / TWEEN_MS);
      const e = k * k * (3 - 2 * k);
      for (const key in cur) cur[key] = lerp(from[key], to[key], e);
    }
    if (!dragging) {
      drag += vel;
      vel *= Math.pow(0.9, dt * 60);
      if (Math.abs(vel) < 1e-4) vel = 0;
      if (settle) {
        drag = reducedMotion ? 0 : drag * Math.exp(-dt * 4);
        if (Math.abs(drag) < 1e-3) { drag = 0; settle = false; }
      }
    }

    // Pose first: the camera target follows the robot's lift in the exploded view.
    const drive = clamp(cur.xray / 0.6); // the drivetrain animates while the bumpers are see-through
    const still = reducedMotion;
    pose({
      yaw: 0,
      xray: cur.xray,
      lift: cur.lift,
      explode: cur.explode,
      elevator: cur.elevator + (still ? 0 : cur.cycle * (1 - Math.cos(time * 1.05))),
      intake: cur.intake,
      steer: still ? 0 : drive * Math.sin(time * 0.9) * 0.9,
      wheelSpeed: still ? 0 : drive * 14,
      intakeSpeed: still ? 0 : cur.spin * 3,
      eeSpeed: still ? 0 : cur.spin * 2,
      ball: 0,
    }, dt);
    shadow.material.opacity = 1 - cur.explode * 0.6;
    glow.material.opacity = cur.glow;

    const m = mobile();
    const aspect = W / H;
    const ref = m ? REF_ASPECT.mobile : REF_ASPECT.desktop;
    let dist = m ? cur.md : cur.dist;
    if (aspect < ref) dist *= Math.pow(ref / aspect, 0.85);
    const sway = reducedMotion ? 0 : Math.sin(time * 0.35) * cur.sway;
    const az = cur.az + sway + drag;
    const el = cur.el;
    look.set(cur.tx, cur.ty + (robot.root.position.y || 0) * 0.6, cur.tz);
    camera.position.set(
      look.x + dist * Math.cos(el) * Math.sin(az),
      look.y + dist * Math.sin(el),
      look.z + dist * Math.cos(el) * Math.cos(az),
    );
    camera.lookAt(look);
    camera.updateMatrixWorld(); // tags below project with this frame's camera, not last frame's

    // price tags: place each next to its anchor, then push apart any that overlap
    if (spots.length) robot.root.updateMatrixWorld();
    const shown = [];
    spots.forEach((sp, j) => {
      const vis = m && sp.h.desktopOnly ? 0 : cur.hot;
      if (vis < 0.02 || !sp.anchor) {
        if (sp.op !== '0') { sp.op = '0'; sp.on = false; sp.el.style.opacity = 0; sp.el.classList.remove('is-on'); sp.btn.tabIndex = -1; }
        return;
      }
      sp.anchor.getWorldPosition(v);
      v.project(camera);
      const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
      if (!sp.w) { sp.w = sp.btn.offsetWidth || 160; sp.th = sp.btn.offsetHeight || 44; }
      // Put the tag on the preferred side if it fits, else the roomier side, then nudge it inside the view.
      const fitsRight = x + GAP + sp.w <= W - PAD, fitsLeft = x - GAP - sp.w >= PAD;
      const wantLeft = sp.h.left || x > W * 0.66;
      let left = wantLeft ? fitsLeft : !fitsRight;
      if (!fitsLeft && !fitsRight) left = x > W / 2;
      const shift = left ? Math.max(0, PAD - (x - GAP - sp.w)) : Math.min(0, (W - PAD) - (x + GAP + sp.w));
      const x0 = (left ? x - GAP - sp.w : x + GAP) + shift;
      // keep the tag inside the view vertically too
      const cy = clamp(y, PAD + sp.th / 2, H - PAD - sp.th / 2);
      shown.push({ sp, j, vis, x, y, left, shift, x0, x1: x0 + sp.w, cy });
    });
    // Greedy de-overlap: walk the tags top to bottom and push each below any earlier tag (or another
    // part's dot) it would cover, then walk back up from the bottom edge if that pushed one out of the view.
    shown.sort((p, q) => p.cy - q.cy);
    const hits = (t, x0, x1, y0, y1) => t.x0 < x1 + 6 && x0 < t.x1 + 6 && t.cy - t.sp.th / 2 < y1 + 6 && y0 < t.cy + t.sp.th / 2 + 6;
    for (let i = 0; i < shown.length; i++) {
      const t = shown[i];
      for (let pass = 0; pass < 3; pass++) {
        let moved = false;
        shown.forEach((o, k) => {
          if (o === t) return;
          const push = (y) => { if (y > t.cy) { t.cy = y; moved = true; } };
          if (k < i && hits(t, o.x0, o.x1, o.cy - o.sp.th / 2, o.cy + o.sp.th / 2)) push(o.cy + (o.sp.th + t.sp.th) / 2 + 6);
          if (hits(t, o.x - 8, o.x + 8, o.y - 8, o.y + 8)) push(o.y + 8 + t.sp.th / 2 + 6);
        });
        if (!moved) break;
      }
    }
    for (let i = shown.length - 1; i >= 0; i--) {
      const t = shown[i];
      t.cy = Math.min(t.cy, H - PAD - t.sp.th / 2);
      for (let k = i + 1; k < shown.length; k++) {
        const o = shown[k];
        if (t.x0 < o.x1 + 6 && o.x0 < t.x1 + 6) t.cy = Math.min(t.cy, o.cy - (o.sp.th + t.sp.th) / 2 - 6);
      }
    }
    shown.forEach(({ sp, j, vis, x, y, left, shift, cy }) => {
      const dy = cy - y;
      // Touch the DOM only when something changed.
      const tf = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${left ? '-100%' : '0'}, -50%)`;
      const nudge = shift || Math.abs(dy) > 0.5 ? `${shift.toFixed(1)}px ${dy.toFixed(1)}px` : '';
      const op = smooth(0.4 + j * 0.06, 0.8 + j * 0.04, vis).toFixed(2);
      const on = vis > 0.6;
      if (sp.left !== left) { sp.left = left; sp.el.classList.toggle('hotspot--left', left); }
      if (sp.tf !== tf) { sp.tf = tf; sp.el.style.transform = tf; }
      if (sp.nudge !== nudge) { sp.nudge = nudge; sp.btn.style.translate = nudge; }
      if (sp.op !== op) { sp.op = op; sp.el.style.opacity = op; }
      if (sp.on !== on) { sp.on = on; sp.el.classList.toggle('is-on', on); sp.btn.tabIndex = on ? 0 : -1; }
    });

    renderer.render(scene, camera);
  }

  // Render only while the section is on screen and the tab is visible.
  let inView = false;
  const sync = () => {
    const want = inView && document.visibilityState === 'visible';
    if (want && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
    else if (!want && running) { running = false; cancelAnimationFrame(raf); }
  };
  // Compile the shaders before the first visible frame: in parallel where the GPU driver supports it,
  // otherwise a few materials per idle slice (each render links only the programs it has not seen yet).
  await warmUp(renderer, scene, camera, idle);
  new IntersectionObserver((entries) => { inView = entries.at(-1).isIntersecting; sync(); }).observe(section);
  document.addEventListener('visibilitychange', sync);
  requestAnimationFrame(() => canvas.classList.add('is-ready'));

  return {
    custom: !!robot.custom,
    setView(id) {
      if (!views[id]) return;
      from = { ...cur };
      to = views[id];
      k = 0;
      t0 = performance.now();
      settle = true;
      if (reducedMotion) { Object.assign(cur, to); k = 1; drag = 0; vel = 0; }
    },
    setName(str) { name = str || ''; robot.parts?.setSponsorName?.(name); },
    setLang(l) { lang = langKey(l); renderLabels(); },
    redrawText() { robot.parts?.redrawNumbers?.(); robot.parts?.setSponsorName?.(name); },
  };
}
