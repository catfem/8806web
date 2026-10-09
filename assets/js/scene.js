// Three.js scenes: the scroll-driven story stage and the "your name on the robot" viewer.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildRobot, poseRobot } from './robot-model.js';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const isMobileLayout = () => matchMedia('(max-width: 760px), (max-aspect-ratio: 4/5)').matches;

function makeRenderer(canvas, maxDpr) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = new RoomEnvironment();
  scene.environment = pmrem.fromScene(env, 0.04).texture;
  env.dispose();
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(2, 4, 3);
  const rim = new THREE.DirectionalLight(0x6aa8ff, 2.6);
  rim.position.set(-3, 2.5, -3.5);
  const rim2 = new THREE.DirectionalLight(0x5ee1ff, 1.2);
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

// Floor ring that glows under the robot, a nod to the hero lighting of product pages.
function floorGlow() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 60, 128, 128, 128);
  grd.addColorStop(0, 'rgba(47,123,255,0)');
  grd.addColorStop(0.82, 'rgba(47,123,255,0.22)');
  grd.addColorStop(0.9, 'rgba(94,225,255,0.5)');
  grd.addColorStop(1, 'rgba(47,123,255,0)');
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

// ------------------------------------------------------------------ story

// Camera + mechanism keyframes, one per chapter.
const KEYS = [
  { az: 0.62, el: 0.16, dist: 5.7, md: 6.6, ty: 0.55, sx: 0, sy: -0.03, msy: 0.02, elevator: 0, intake: 1, explode: 0 },        // hero
  { az: 0.95, el: 0.26, dist: 3.4, md: 5.4, ty: 0.25, sx: 0.2, sy: 0, msy: 0.2, elevator: 0, intake: 1, explode: 0 },         // drivetrain
  { az: -0.62, el: 0.08, dist: 4.7, md: 8.2, ty: 1.05, sx: 0.2, sy: 0, msy: 0.2, elevator: 1, intake: 0, explode: 0 },       // elevator
  { az: 0.5, el: 0.3, dist: 3.4, md: 6.4, ty: 0.25, sx: 0.2, sy: 0, msy: 0.22, elevator: 0.12, intake: 1, explode: 0 },        // intake
  { az: 0.78, el: 0.32, dist: 5.9, md: 8.6, ty: 0.95, sx: 0.17, sy: 0, msy: 0.2, elevator: 0, intake: 1, explode: 1 },        // exploded
  { az: -2.45, el: 0.16, dist: 4.2, md: 7.0, ty: 0.6, sx: -0.2, sy: 0, msy: 0.2, elevator: 0.35, intake: 1, explode: 0 },     // outro
];

export async function initStory(opts) {
  const { canvas, stage, section, chapters, dots, hotspotLayer, hotspots, onHotspot, sponsors, modelUrl, reducedMotion } = opts;
  const mobile = () => isMobileLayout();
  const { renderer, scene } = makeRenderer(canvas, mobile() ? 1.5 : 2);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);

  let robot = buildRobot({ sponsors });
  let pose = (st, dt) => poseRobot(robot, st, dt);
  if (modelUrl) {
    try {
      const custom = await loadCustomRobot(modelUrl);
      robot = custom;
      pose = (st) => custom.pose(st);
    } catch (e) {
      console.warn('Custom robot model failed to load, using the built-in one.', e);
    }
  }
  scene.add(robot.root);
  const shadow = contactShadow();
  const glow = floorGlow();
  scene.add(shadow, glow);

  // Hotspot DOM
  let lang = opts.lang || 'en';
  const spots = (robot.custom ? [] : hotspots).map((h) => {
    const el = document.createElement('div');
    el.className = 'hotspot';
    el.innerHTML = '<i class="hotspot__dot"></i><button class="hotspot__tag" type="button" tabindex="-1"><b></b><span></span></button>';
    el.querySelector('button').addEventListener('click', () => onHotspot(h));
    hotspotLayer.appendChild(el);
    return { h, el, anchor: robot.anchors[h.anchor], b: el.querySelector('b'), s: el.querySelector('span'), btn: el.querySelector('button') };
  });
  const renderLabels = () => spots.forEach((sp) => {
    sp.b.textContent = sp.h.label[lang];
    sp.s.textContent = sp.h.tag[lang];
    sp.w = 0;
  });
  renderLabels();

  let W = 1, H = 1;
  const resize = () => {
    W = stage.clientWidth; H = stage.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile() ? 1.5 : 2));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  const target = () => {
    const r = section.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - innerHeight));
  };

  const N = KEYS.length;
  let p = target();
  let time = 0, heroSpin = 0, running = false, last = 0, raf = 0;
  const v = new THREE.Vector3();
  const look = new THREE.Vector3();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    time += dt;

    const tp = target();
    p = reducedMotion ? tp : p + (tp - p) * (1 - Math.exp(-dt * 7));
    const f = Math.min(p * N, N - 0.0001);
    const i = Math.floor(f);
    const local = f - i;
    const tt = smooth(0.55, 1, local);
    const A = KEYS[i], B = KEYS[Math.min(i + 1, N - 1)];
    const k = (key) => lerp(A[key], B[key], tt);
    const w = (j) => smooth(j - 0.45, j, f) * (j === N - 1 ? 1 : 1 - smooth(j + 0.55, j + 1, f));

    // hero turntable: spins while the hero is on screen, then settles back to the nearest full turn
    const heroW = 1 - smooth(0.3, 0.6, f);
    if (!reducedMotion) {
      if (heroW > 0.5) heroSpin += dt * 0.22;
      else heroSpin = lerp(heroSpin, Math.round(heroSpin / (Math.PI * 2)) * Math.PI * 2, 1 - Math.exp(-dt * 2.5));
    }
    stage.style.setProperty('--hero', heroW.toFixed(3));

    const m = mobile();
    const aspect = W / H;
    let dist;
    if (m) dist = k('md') * Math.max(1, Math.pow(0.5 / aspect, 0.9));
    else dist = k('dist') * (aspect < 1.25 ? Math.pow(1.25 / aspect, 0.82) : 1);
    const az = k('az') + heroSpin;
    const el = k('el');
    look.set(0, k('ty') + (robot.root.position.y || 0) * 0.6, 0);
    camera.position.set(
      look.x + dist * Math.cos(el) * Math.sin(az),
      look.y + dist * Math.sin(el),
      look.z + dist * Math.cos(el) * Math.cos(az),
    );
    camera.lookAt(look);
    const sx = m ? 0 : k('sx');
    const sy = m ? k('msy') : k('sy');
    camera.setViewOffset(W, H, -sx * W, sy * H, W, H);

    const wDrive = w(1), wElev = w(2), wIntake = w(3), wEx = w(4);
    const ballT = smooth(2.75, 3.35, f);
    pose({
      yaw: reducedMotion ? 0 : wDrive * Math.sin(time * 0.6) * 0.35,
      xray: wDrive * 0.6,
      lift: wDrive * 0.24,
      explode: k('explode'),
      elevator: k('elevator') + wElev * 0.04 * Math.sin(time * 1.6),
      intake: k('intake'),
      steer: reducedMotion ? 0 : wDrive * Math.sin(time * 0.9) * 0.9,
      wheelSpeed: reducedMotion ? 0 : wDrive * 14,
      intakeSpeed: reducedMotion ? 0 : wIntake * 16 + wEx * 2,
      eeSpeed: reducedMotion ? 0 : (wElev + wIntake) * 6,
      ball: ballT * (1 - smooth(3.55, 3.8, f)),
    }, dt);
    shadow.material.opacity = 1 - k('explode') * 0.6;
    glow.material.opacity = 0.55 * heroW + 0.35 * w(5);

    // chapters
    chapters.forEach((ch, j) => {
      let op = smooth(j - 0.25, j + 0.05, f) * (j === N - 1 ? 1 : 1 - smooth(j + 0.45, j + 0.6, f));
      if (j === 0) op = 1 - smooth(0.4, 0.58, f);
      const y = (1 - op) * (f < j ? 28 : -28);
      ch.style.opacity = op.toFixed(3);
      if (j === 0) ch.style.transform = `translateY(${y}px)`;
      else ch.style.transform = m ? `translateY(${y}px)` : `translateY(calc(-50% + ${y}px))`;
      ch.classList.toggle('is-active', op > 0.02);
    });
    dots.forEach((d, j) => d.classList.toggle('is-on', Math.round(f - 0.3) === j || (j === 0 && f < 0.7)));

    // hotspots
    robot.root.updateMatrixWorld();
    spots.forEach((sp, j) => {
      const vis = m && sp.h.desktopOnly ? 0 : wEx;
      if (vis < 0.02 || !sp.anchor) { sp.el.style.opacity = 0; sp.el.classList.remove('is-on'); sp.btn.tabIndex = -1; return; }
      sp.anchor.getWorldPosition(v);
      v.project(camera);
      const x = (v.x + 1) / 2 * W, y = (1 - v.y) / 2 * H;
      if (!sp.w) sp.w = sp.btn.offsetWidth || 160;
      const fitsRight = x + 14 + sp.w < W - 8, fitsLeft = x - 14 - sp.w > 8;
      const wantLeft = sp.h.left || x > W * 0.72;
      const left = wantLeft ? (fitsLeft || !fitsRight) : (!fitsRight && fitsLeft);
      sp.el.classList.toggle('hotspot--left', left);
      sp.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${left ? '-100%' : '0'}, -50%)`;
      sp.el.style.opacity = smooth(0.4 + j * 0.06, 0.8 + j * 0.04, vis).toFixed(3);
      const on = vis > 0.6;
      sp.el.classList.toggle('is-on', on);
      sp.btn.tabIndex = on ? 0 : -1;
    });

    renderer.render(scene, camera);
  }

  const start = () => { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: '100px' }).observe(section);
  start();
  requestAnimationFrame(() => canvas.classList.add('is-ready'));

  return {
    setLang(l) { lang = l; renderLabels(); },
    redrawText() { robot.parts?.redrawNumbers?.(); robot.parts?.setSponsorName?.(''); },
  };
}

// ------------------------------------------------------------------ namer

export function initNamer({ canvas, wrap, input, sponsors, reducedMotion }) {
  const { renderer, scene } = makeRenderer(canvas, 2);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 50);
  const robot = buildRobot({ sponsors });
  scene.add(robot.root, contactShadow(1.6));
  poseRobot(robot, { elevator: 0.25, intake: 0 }, 0);

  let W = 1, H = 1;
  const resize = () => {
    W = wrap.clientWidth; H = wrap.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(wrap);

  let drag = 0, vel = 0, dragging = false, lastX = 0, t = 0, last = 0, running = false, raf = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = (e.clientX - lastX) / Math.max(W, 1);
    lastX = e.clientX;
    drag += dx * 4; vel = dx * 4;
  });
  const up = () => { dragging = false; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  const name = { value: '' };
  const update = () => {
    name.value = input.value.trim();
    robot.parts.setSponsorName(name.value);
  };
  input.addEventListener('input', update);

  const look = new THREE.Vector3(-0.08, 0.56, -0.1);
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now; t += dt;
    if (!dragging) { drag += vel; vel *= 0.92; }
    const az = -1.25 + (reducedMotion ? 0 : Math.sin(t * 0.35) * 0.3) + drag;
    const el = 0.14, dist = (W / H < 1 ? 3.6 : 3.05);
    camera.position.set(look.x + dist * Math.cos(el) * Math.sin(az), look.y + dist * Math.sin(el), look.z + dist * Math.cos(el) * Math.cos(az));
    camera.lookAt(look);
    poseRobot(robot, { elevator: 0.25, wheelSpeed: 0, intake: 0, eeSpeed: reducedMotion ? 0 : 3 }, dt);
    renderer.render(scene, camera);
  }
  const start = () => { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(wrap);

  return {
    redrawText() { robot.parts.redrawNumbers(); robot.parts.setSponsorName(name.value); },
  };
}
