// Procedural model of Team 8806's 2025 REEFSCAPE robot: MK4i-style swerve drivetrain on a punched
// 2x1 aluminium frame, fabric bumpers, a two-stage elevator with a coral end effector, a drag chain,
// and a compliant-wheel ground intake. Everything is built from primitives and canvas textures, so
// it costs no download; static parts are merged per material ("baked") to keep draw calls low.
// Units are metres, +y is up and +z is the robot's front.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FONT_STACK, drawSponsorPanel } from './sponsor-panel.js';

export { FONT_STACK, drawSponsorPanel };

const TAU = Math.PI * 2;
const IN = 0.0254;
// Texture anisotropy; buildRobot raises it to the GPU's maximum when the caller passes maxAnisotropy.
let ANISO = 8;

// ---------------------------------------------------------------- canvas textures

const cache = {};
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function toTex(c, { srgb = true, repeat = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = ANISO;
  return t;
}
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// One tile of punched tube: u = 1/2" along the tube, v = 1" across a face. Brushed streaks run along u.
function holeCanvas() {
  if (cache.hole) return cache.hole;
  const c = makeCanvas(64, 128), g = c.getContext('2d'), r = rng(7);
  for (let y = 0; y < 128; y++) {
    const v = 226 + Math.round((r() - 0.5) * 26);
    g.fillStyle = `rgb(${v},${v + 1},${v + 4})`;
    g.fillRect(0, y, 64, 1);
  }
  const ring = (rad, style) => { g.beginPath(); g.arc(32, 64, rad, 0, TAU); g.fillStyle = style; g.fill(); };
  ring(15.5, 'rgba(255,255,255,0.7)');
  ring(13.6, '#6b7078');
  const grd = g.createRadialGradient(30, 61, 2, 32, 64, 12.6);
  grd.addColorStop(0, '#050608'); grd.addColorStop(0.75, '#0b0c10'); grd.addColorStop(1, '#2a2d33');
  ring(12.6, grd);
  return (cache.hole = c);
}

// Two pitches of #25 roller chain, seen from the side (transparent between the plates).
function chainCanvas() {
  if (cache.chain) return cache.chain;
  const c = makeCanvas(128, 32), g = c.getContext('2d');
  const plate = (x0, x1, hh, waist, col) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(x0, 16, hh, Math.PI / 2, Math.PI * 1.5);
    g.quadraticCurveTo((x0 + x1) / 2, 16 - waist, x1, 16 - hh);
    g.arc(x1, 16, hh, -Math.PI / 2, Math.PI / 2);
    g.quadraticCurveTo((x0 + x1) / 2, 16 + waist, x0, 16 + hh);
    g.fill();
  };
  plate(64, 128, 12, 8, '#3a3e46');
  plate(-64, 0, 12, 8, '#3a3e46');
  plate(0, 64, 14, 10, '#5d626c');
  plate(128, 192, 14, 10, '#5d626c');
  [0, 64, 128].forEach((x) => { g.beginPath(); g.arc(x, 16, 4.5, 0, TAU); g.fillStyle = '#c9ced6'; g.fill(); });
  return (cache.chain = c);
}

function batteryLabelCanvas() {
  if (cache.battery) return cache.battery;
  const c = makeCanvas(256, 224), g = c.getContext('2d');
  g.fillStyle = '#17181c'; g.fillRect(0, 0, 256, 224);
  g.fillStyle = '#d7262f'; g.fillRect(0, 0, 256, 34);
  g.fillStyle = '#ffffff'; g.textAlign = 'center';
  g.font = `800 22px ${FONT_STACK}`; g.fillText('SEALED LEAD-ACID', 128, 25);
  g.font = `800 64px ${FONT_STACK}`; g.fillText('12V', 128, 104);
  g.font = `700 30px ${FONT_STACK}`; g.fillStyle = '#c8ccd4'; g.fillText('18 Ah', 128, 142);
  g.fillStyle = '#f2f3f5';
  g.beginPath(); (g.roundRect ? g.roundRect(54, 164, 148, 40, 8) : g.rect(54, 164, 148, 40)); g.fill();
  g.fillStyle = '#c21d29'; g.font = `800 24px ${FONT_STACK}`; g.fillText('FRC 8806', 128, 192);
  return (cache.battery = c);
}

let logoTex = null;
function logoTexture() {
  if (logoTex) return logoTex;
  logoTex = new THREE.TextureLoader().load(new URL('../img/logo-640.webp', import.meta.url).href);
  logoTex.colorSpace = THREE.SRGBColorSpace;
  logoTex.anisotropy = ANISO;
  return logoTex;
}

// ---------------------------------------------------------------- materials

function makeMaterials(hi) {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const phys = (o) => (hi ? new THREE.MeshPhysicalMaterial(o) : new THREE.MeshStandardMaterial(stripPhys(o)));
  const holeTex = toTex(holeCanvas(), { repeat: true });
  const chainTex = toTex(chainCanvas(), { repeat: true });
  chainTex.wrapT = THREE.ClampToEdgeWrapping;
  return {
    // punched 2x1 / 1x1 tube: brushed along its length (uv.u), holes from the tile texture
    tube: phys({ color: 0xc9ced6, metalness: 1, roughness: 0.36, map: holeTex, anisotropy: 0.55 }),
    tubeBlack: phys({ color: 0x3a3e46, metalness: 0.8, roughness: 0.38, map: holeTex, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
    plate: phys({ color: 0xc6cbd3, metalness: 1, roughness: 0.3, anisotropy: 0.7 }),
    machined: phys({ color: 0xb3b9c2, metalness: 1, roughness: 0.27, anisotropy: 0.5, anisotropyRotation: Math.PI / 2 }),
    anodBlack: phys({ color: 0x22252c, metalness: 0.7, roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.3 }),
    anodBlue: phys({ color: 0x1f5fe0, metalness: 0.75, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.18 }),
    poly: std({ color: 0x17191e, metalness: 0.15, roughness: 0.5 }),
    smoke: phys({ color: 0x2a3446, metalness: 0, roughness: 0.08, transparent: true, opacity: 0.42, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide }),
    pan: std({ color: 0x30343c, metalness: 0.45, roughness: 0.55 }),
    rubber: std({ color: 0x141518, metalness: 0, roughness: 0.88 }),
    motor: phys({ color: 0x1a1c21, metalness: 0.6, roughness: 0.36, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
    steel: std({ color: 0x2c2f35, metalness: 0.85, roughness: 0.32 }),
    rivet: std({ color: 0xc4c9d1, metalness: 1, roughness: 0.3 }),
    chain: std({ color: 0xffffff, metalness: 0.85, roughness: 0.38, map: chainTex, alphaTest: 0.45 }),
    dragChain: std({ color: 0x141518, metalness: 0.05, roughness: 0.62 }),
    bumper: phys({ color: 0xffffff, metalness: 0, roughness: 0.92, sheen: 1, sheenRoughness: 0.42, sheenColor: new THREE.Color(0xff6b6b), transparent: true }),
    green: std({ color: 0x66d94a, metalness: 0, roughness: 0.55 }),
    pvc: phys({ color: 0xf1f0ea, metalness: 0, roughness: 0.38, clearcoat: 0.25, clearcoatRoughness: 0.4 }),
    ball: std({ color: 0x35c2a6, metalness: 0, roughness: 0.78 }),
    battery: std({ color: 0x1b1c20, metalness: 0.05, roughness: 0.55 }),
    batteryLabel: std({ map: toTex(batteryLabelCanvas()), metalness: 0, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }),
    rio: std({ color: 0x9aa1ad, metalness: 0.65, roughness: 0.35 }),
    white: std({ color: 0xf2f3f5, metalness: 0, roughness: 0.45 }),
    lens: std({ color: 0x050608, metalness: 0.9, roughness: 0.06 }),
    // small coloured parts (wires, fuses, connectors) share one material through vertex colours
    plastic: std({ color: 0xffffff, metalness: 0.05, roughness: 0.5, vertexColors: true }),
    glow: new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, toneMapped: false }),
    logo: phys({ map: logoTexture(), metalness: 0, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.15 }),
  };
}
function stripPhys(o) {
  const out = { ...o };
  ['anisotropy', 'anisotropyRotation', 'clearcoat', 'clearcoatRoughness', 'sheen', 'sheenRoughness', 'sheenColor'].forEach((k) => delete out[k]);
  return out;
}

// ---------------------------------------------------------------- geometry helpers

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

function mesh(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  return m;
}

function rrShape(w, h, r, ox = 0, oy = 0, Cls = THREE.Shape) {
  const s = new Cls();
  r = Math.max(1e-4, Math.min(r, w / 2 - 1e-5, h / 2 - 1e-5));
  const x = ox - w / 2, y = oy - h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function circ(cx, cy, r, Cls = THREE.Path) {
  const p = new Cls();
  p.absarc(cx, cy, r, 0, TAU, false);
  return p;
}

// Polygon with rounded corners.
function roundPoly(pts, r, Cls = THREE.Path) {
  const p = new Cls();
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n];
    const ab = new THREE.Vector2(b[0] - a[0], b[1] - a[1]), bc = new THREE.Vector2(c[0] - b[0], c[1] - b[1]);
    const rr = Math.min(r, ab.length() * 0.45, bc.length() * 0.45);
    ab.normalize(); bc.normalize();
    const p1 = [b[0] - ab.x * rr, b[1] - ab.y * rr], p2 = [b[0] + bc.x * rr, b[1] + bc.y * rr];
    if (i === 0) p.moveTo(p1[0], p1[1]); else p.lineTo(p1[0], p1[1]);
    p.quadraticCurveTo(b[0], b[1], p2[0], p2[1]);
  }
  p.closePath();
  return p;
}

// Rounded triangular lightening pocket: centre, circumradius, rotation.
function triPocket(cx, cy, R, rot, r = 0.004) {
  const pts = [0, 1, 2].map((k) => {
    const a = rot + Math.PI / 2 + (k * TAU) / 3;
    return [cx + Math.cos(a) * R, cy + Math.sin(a) * R];
  });
  return roundPoly(pts, r);
}

function extrude(shape, t, D, seg) {
  const b = D && D.bevel && t > 4 * D.bevel ? D.bevel : 0;
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(1e-4, t - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 1,
    curveSegments: seg || (D ? D.seg : 6),
  });
  g.translate(0, 0, -(t - 2 * b) / 2);
  return g;
}
// plate orientations: XY (normal z), YZ (shape x -> world z, normal x), XZ (shape y -> world z, normal y)
const inYZ = (g) => g.rotateY(-Math.PI / 2);
const inXZ = (g) => g.rotateX(Math.PI / 2);

// Box with rounded vertical edges and chamfered faces: w (x) * h (y) * d (z).
function rbox(w, h, d, r = 0.004, b = 0.0012) {
  b = Math.min(b, d / 4, w / 4, h / 4);
  const g = new THREE.ExtrudeGeometry(rrShape(w - 2 * b, h - 2 * b, Math.min(r, (Math.min(w, h) - 2 * b) / 2 - 1e-4)), {
    depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 3,
  });
  g.translate(0, 0, -(d - 2 * b) / 2);
  return g;
}

// Hollow rectangular tube with a punched hole pattern. Cross-section w x h, length along local z,
// then turned so its length runs along `axis`: y -> (w: x, h: z), x -> (w: z, h: y), z -> (w: x, h: y).
function tube(len, w, h, { axis = 'y', wall = 0.0016, r = 0.0018 } = {}) {
  const s = rrShape(w, h, r);
  if (wall) s.holes.push(rrShape(w - 2 * wall, h - 2 * wall, Math.max(2e-4, r - wall), 0, 0, THREE.Path));
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: 2 });
  g.translate(0, 0, -len / 2);
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  const capEnd = g.groups.length ? g.groups[0].count : 0;
  for (let i = 0; i < pos.count; i++) {
    if (i < capEnd) { uv.setXY(i, 0.04, 0.04); continue; }
    const sideX = Math.abs(nor.getX(i)) > Math.abs(nor.getY(i));
    const across = sideX ? pos.getY(i) : pos.getX(i);
    const face = sideX ? h : w;
    uv.setXY(i, pos.getZ(i) / (IN / 2) + 0.5, across / IN + (Math.round(face / IN) % 2 ? 0.5 : 0));
  }
  if (axis === 'y') g.rotateX(-Math.PI / 2);
  else if (axis === 'x') g.rotateY(Math.PI / 2);
  return g;
}

function strut(a, b, w, h, mat) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(tube(dir.length(), w, h, { axis: 'z' }), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(V3(0, 0, 1), dir.normalize());
  return m;
}

function cyl(r, h, mat, axis = 'y', seg = 28, x = 0, y = 0, z = 0, r2 = r) {
  const g = new THREE.CylinderGeometry(r, r2, h, seg);
  if (axis === 'x') g.rotateZ(-Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  return mesh(g, mat, x, y, z);
}

function lathe(pts, seg, axis = 'y') {
  const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  if (axis === 'x') g.rotateZ(-Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  return g;
}

function gearShape(teeth, rRoot, rTip, bore = 0, hex = false) {
  const s = new THREE.Shape();
  const st = TAU / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * st;
    [[rRoot, a], [rTip, a + st * 0.28], [rTip, a + st * 0.5], [rRoot, a + st * 0.78]].forEach(([r, t], k) => {
      if (i === 0 && k === 0) s.moveTo(Math.cos(t) * r, Math.sin(t) * r); else s.lineTo(Math.cos(t) * r, Math.sin(t) * r);
    });
  }
  s.closePath();
  if (bore) {
    if (hex) {
      const h = new THREE.Path();
      for (let k = 0; k <= 6; k++) { const a = (k / 6) * TAU; if (k) h.lineTo(Math.cos(a) * bore, Math.sin(a) * bore); else h.moveTo(bore, 0); }
      s.holes.push(h);
    } else s.holes.push(circ(0, 0, bore));
  }
  return s;
}

// Belt loop (stadium ring) around two pulleys in the YZ plane, given as [z, y] centres.
function beltGeo(a, b, r, thick, width, seg = 10) {
  const dz = b[0] - a[0], dy = b[1] - a[1];
  const ang = Math.atan2(dy, dz);
  const ring = (rad, Cls) => {
    const p = new Cls();
    p.absarc(a[0], a[1], rad, ang + Math.PI / 2, ang + Math.PI * 1.5, false);
    p.absarc(b[0], b[1], rad, ang - Math.PI / 2, ang + Math.PI / 2, false);
    p.closePath();
    return p;
  };
  const s = ring(r + thick, THREE.Shape);
  s.holes.push(ring(r, THREE.Path));
  return inYZ(extrude(s, width, null, seg));
}

// Small bolt / rivet heads on a face, given positions and the face normal axis.
const boltGeoCache = {};
function boltGeo(r = 0.0032) {
  const k = r.toFixed(4);
  return boltGeoCache[k] || (boltGeoCache[k] = new THREE.CylinderGeometry(r * 0.9, r, r * 0.7, 6, 1));
}
function bolts(parent, mat, pts, axis = 'z', r = 0.0032, sign = 1) {
  const g = boltGeo(r);
  pts.forEach(([x, y, z]) => {
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, y, z);
    if (axis === 'x') m.rotation.z = -sign * Math.PI / 2;
    if (axis === 'z') m.rotation.x = sign * Math.PI / 2;
    if (axis === 'y' && sign < 0) m.rotation.x = Math.PI;
    parent.add(m);
  });
}

function tint(g, hex) {
  const c = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}
// LED / indicator: an unlit dot whose colour can exceed 1 for a hot core.
function led(parent, mats, hex, x, y, z, s = 0.004, k = 1.6) {
  const g = tint(new THREE.BoxGeometry(s, s * 0.6, s), hex);
  const col = g.attributes.color;
  for (let i = 0; i < col.count; i++) col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k);
  parent.add(mesh(g, mats.glow, x, y, z));
}
function wire(parent, mats, hex, pts, r = 0.0032, seg = 28) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => V3(p[0], p[1], p[2])), false, 'catmullrom', 0.5);
  parent.add(new THREE.Mesh(tint(new THREE.TubeGeometry(curve, seg, r, 6, false), hex), mats.plastic));
}
function part(parent, mats, hex, geo, x, y, z, rx = 0, ry = 0, rz = 0) {
  parent.add(mesh(tint(geo, hex), mats.plastic, x, y, z, rx, ry, rz));
}

// Merge every static mesh under `root` into one mesh per material. Children flagged
// userData.dynamic (animated groups) and meshes flagged userData.keep are left alone.
function bake(root) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const buckets = new Map();
  const victims = [];
  const visit = (o) => {
    for (const c of o.children) {
      if (c.userData.dynamic) continue;
      if (c.isMesh && !c.isInstancedMesh && !c.userData.keep) {
        const g = c.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, c.matrixWorld));
        if (!buckets.has(c.material)) buckets.set(c.material, []);
        buckets.get(c.material).push(g);
        victims.push(c);
      }
      visit(c);
    }
  };
  visit(root);
  victims.forEach((v) => v.removeFromParent());
  for (const [mat, list] of buckets) {
    const geo = mergeGeometries(list.map((g) => normaliseGeo(g, !!mat.vertexColors)), false);
    list.forEach((g) => g.dispose());
    const m = new THREE.Mesh(geo, mat);
    m.userData.baked = true;
    root.add(m);
  }
  return root;
}
function normaliseGeo(g, withColor) {
  if (g.index) g = g.toNonIndexed();
  for (const k of Object.keys(g.attributes)) {
    if (!(k === 'position' || k === 'normal' || k === 'uv' || (withColor && k === 'color'))) g.deleteAttribute(k);
  }
  const n = g.attributes.position.count;
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  if (withColor && !g.attributes.color) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  g.morphAttributes = {};
  g.clearGroups();
  return g;
}
function dynamic(g) { g.userData.dynamic = true; return g; }

// ---------------------------------------------------------------- star wheels

function starWheelGeometry(arms = 9, rOut = 0.05, rIn = 0.017, thick = 0.012) {
  const s = new THREE.Shape();
  const half = (TAU / arms) * 0.16;
  for (let k = 0; k < arms; k++) {
    const a = (k / arms) * TAU;
    const pts = [[rIn, a - half * 1.9], [rOut * 0.97, a - half * 0.35], [rOut, a + half * 0.15], [rIn, a + half * 1.9]];
    pts.forEach(([r, ang], i) => {
      const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
      if (k === 0 && i === 0) s.moveTo(x, y); else s.lineTo(x, y);
    });
  }
  s.closePath();
  const hole = new THREE.Path();
  for (let k = 0; k <= 6; k++) {
    const a = (k / 6) * TAU;
    if (k === 0) hole.moveTo(Math.cos(a) * 0.0065, Math.sin(a) * 0.0065); else hole.lineTo(Math.cos(a) * 0.0065, Math.sin(a) * 0.0065);
  }
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelSize: 0.0015, bevelThickness: 0.0015, bevelSegments: 1, curveSegments: 4 });
  g.center();
  g.rotateY(Math.PI / 2);
  return g;
}

// A roller of compliant star wheels on a hex shaft, spinning about x.
function starRoller(mats, width, count, rOut) {
  const g = dynamic(new THREE.Group());
  g.add(cyl(0.0075, width + 0.04, mats.machined, 'x', 6));
  const geo = starWheelGeometry(9, rOut, rOut * 0.34, 0.012);
  const inst = new THREE.InstancedMesh(geo, mats.green, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = V3(1, 1, 1);
  for (let i = 0; i < count; i++) {
    const x = count === 1 ? 0 : -width / 2 + (i / (count - 1)) * width;
    q.setFromEuler(e.set(i * 0.35, 0, 0));
    m.compose(V3(x, 0, 0), q, one);
    inst.setMatrixAt(i, m);
  }
  g.add(inst);
  return g;
}

// ---------------------------------------------------------------- printed panels

function textTexture(draw, w, h) {
  const c = makeCanvas(w, h);
  const tex = toTex(c);
  const redraw = (...args) => { draw(c.getContext('2d'), w, h, ...args); tex.needsUpdate = true; };
  redraw();
  return { tex, redraw };
}

// ---------------------------------------------------------------- bumpers

// The bumper is one swept mesh: a fabric-wrapped, two-noodle cross-section run around the frame
// perimeter. Each side gets its own band of a 1024x1024 texture (4 x 256 px) so the numerals and
// stitching can be painted on and stay crisp, and fade with the x-ray effect for free.
const BUMP = { H: 0.355, D: 0.09, y0: 0.0135, y1: 0.1415, NC: 10 };

function bumperProfile() {
  const { D, y0, y1 } = BUMP;
  const yc = (y0 + y1) / 2;
  // two pool noodles under taut fabric: overlapping squircle lobes with a shallow crease between them
  const n = 3, dc = 0.045, ax = D - dc, ay = 0.044, off = (y1 - y0) / 2 - ay;
  const pts = []; // [d, y, nd, ny, region]
  const add = (d, y, nd, ny, reg) => { const l = Math.hypot(nd, ny) || 1; pts.push([d, y, nd / l, ny / l, reg]); };
  add(0, y1, 0, 1, 0);
  add(dc * 0.5, y1, 0, 1, 0);
  const sp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
  const tc = Math.asin(Math.pow(off / ay, n / 2));
  const lobe = (cy, t0, t1, steps) => {
    for (let i = 0; i <= steps; i++) {
      const t = t0 + ((t1 - t0) * i) / steps;
      const x = ax * sp(Math.cos(t), 2 / n), y = ay * sp(Math.sin(t), 2 / n);
      add(dc + x, cy + y, sp(x / ax, n - 1) / ax, sp(y / ay, n - 1) / ay, 1);
    }
  };
  lobe(yc + off, Math.PI / 2, -tc, 16);
  lobe(yc - off, tc, -Math.PI / 2, 16);
  add(dc * 0.5, y0, 0, -1, 2);
  add(0, y0, 0, -1, 2);
  add(0, y0, -1, 0, 3);
  add(0, y1, -1, 0, 3);
  // arc length per region, mapped to texture rows: top 0-24, outer face 24-232, bottom 232-248, inside 248-256
  const rows = [[0, 24], [24, 232], [232, 248], [248, 256]];
  const len = [0, 0, 0, 0];
  for (let i = 1; i < pts.length; i++) if (pts[i][4] === pts[i - 1][4]) len[pts[i][4]] += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const acc = [0, 0, 0, 0];
  pts.forEach((p, i) => {
    if (i && p[4] === pts[i - 1][4]) acc[p[4]] += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    const [r0, r1] = rows[p[4]];
    p.push(r0 + (r1 - r0) * (len[p[4]] ? acc[p[4]] / len[p[4]] : 0));
  });
  return { pts, outerLen: len[1], yc };
}

function bumperGeometry(nc) {
  const { H, D } = BUMP;
  const { pts } = bumperProfile();
  const normals = [V3(0, 0, 1), V3(1, 0, 0), V3(0, 0, -1), V3(-1, 0, 0)];
  const corners = [V3(-H, 0, H), V3(H, 0, H), V3(H, 0, -H), V3(-H, 0, -H)];
  const sideLen = 2 * H + 2 * (Math.PI / 4) * D;
  const P = [], N = [], UV = [], I = [];
  for (let k = 0; k < 4; k++) {
    const n = normals[k], nPrev = normals[(k + 3) % 4], nNext = normals[(k + 1) % 4];
    const A = corners[k], B = corners[(k + 1) % 4];
    const st = [];
    for (let i = 0; i <= nc; i++) {
      const phi = (Math.PI / 4) * (1 - i / nc);
      st.push({ base: A, o: n.clone().multiplyScalar(Math.cos(phi)).addScaledVector(nPrev, Math.sin(phi)).normalize(), s: (Math.PI / 4) * D * (i / nc) });
    }
    for (let i = 0; i <= nc; i++) {
      const phi = (Math.PI / 4) * (i / nc);
      st.push({ base: B, o: n.clone().multiplyScalar(Math.cos(phi)).addScaledVector(nNext, Math.sin(phi)).normalize(), s: (Math.PI / 4) * D + 2 * H + (Math.PI / 4) * D * (i / nc) });
    }
    const v0 = P.length / 3;
    st.forEach((s) => {
      pts.forEach(([d, y, nd, ny, , vpx]) => {
        P.push(s.base.x + s.o.x * d, y, s.base.z + s.o.z * d);
        N.push(s.o.x * nd, ny, s.o.z * nd);
        UV.push(s.s / sideLen, 1 - (k * 256 + vpx) / 1024);
      });
    });
    const np = pts.length;
    for (let i = 0; i < st.length - 1; i++) {
      for (let j = 0; j < np - 1; j++) {
        const a = v0 + i * np + j, b = a + 1, c = a + np, d = c + 1;
        I.push(a, b, c, c, b, d);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setIndex(I);
  return { geo: g, sideLen };
}

function bumperBase() {
  if (cache.bumperBase) return cache.bumperBase;
  const c = makeCanvas(1024, 1024), g = c.getContext('2d');
  g.fillStyle = '#a3121c'; g.fillRect(0, 0, 1024, 1024);
  // fabric grain: a small random tile used as a pattern (no read-back of the big canvas)
  const tile = makeCanvas(128, 128), tg = tile.getContext('2d'), img = tg.createImageData(128, 128), d = img.data, r = rng(3);
  for (let i = 0; i < d.length; i += 4) {
    const v = r(), light = ((i >> 2) & 1) ^ ((i >> 9) & 1);
    d[i] = d[i + 1] = d[i + 2] = light ? 255 : 0;
    d[i + 3] = Math.round(6 + v * 16);
  }
  tg.putImageData(img, 0, 0);
  g.fillStyle = g.createPattern(tile, 'repeat');
  g.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 4; k++) {
    const y = k * 256;
    // ambient occlusion in the crease between the noodles and on the hidden faces
    const grd = g.createLinearGradient(0, y + 24, 0, y + 232);
    grd.addColorStop(0, 'rgba(0,0,0,0.1)'); grd.addColorStop(0.12, 'rgba(0,0,0,0)');
    grd.addColorStop(0.44, 'rgba(0,0,0,0)'); grd.addColorStop(0.5, 'rgba(40,0,0,0.38)'); grd.addColorStop(0.56, 'rgba(0,0,0,0)');
    grd.addColorStop(0.86, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,0.22)');
    g.fillStyle = grd; g.fillRect(0, y + 24, 1024, 208);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, y + 232, 1024, 24);
    // top & bottom seams with stitching
    g.fillStyle = 'rgba(30,0,4,0.45)';
    g.fillRect(0, y + 22, 1024, 3); g.fillRect(0, y + 231, 1024, 3);
    g.strokeStyle = 'rgba(255,190,190,0.42)'; g.lineWidth = 1.3; g.setLineDash([7, 5]);
    [y + 31, y + 225].forEach((sy) => { g.beginPath(); g.moveTo(0, sy); g.lineTo(1024, sy); g.stroke(); });
    g.setLineDash([]);
    // corner seams at the band ends
    g.fillStyle = 'rgba(30,0,4,0.35)';
    g.fillRect(0, y, 3, 256); g.fillRect(1021, y, 3, 256);
  }
  return (cache.bumperBase = c);
}

function drawBumper(ctx, w, h, sideLen, outerLen) {
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(bumperBase(), 0, 0, w, h);
  const pxU = w / sideLen, pxV = (208 * (h / 1024)) / outerLen;
  const band = h / 4;
  for (let k = 0; k < 4; k++) {
    ctx.save();
    ctx.translate(w / 2, k * band + band * (128 / 256));
    ctx.scale(pxU / pxV, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const size = 0.118 * pxV;
    ctx.font = `800 ${size}px ${FONT_STACK}`;
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(40,0,4,0.45)';
    ctx.fillText('8806', 0, size * 0.06 + 2);
    ctx.lineWidth = size * 0.05;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeText('8806', 0, size * 0.04);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('8806', 0, size * 0.04);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- sub-assemblies

// Kraken-style brushless motor standing on its base (axis +y), radius r, height h.
function kraken(mats, D, r = 0.03, h = 0.062) {
  const g = new THREE.Group();
  const seg = D.hi ? 32 : 20;
  const body = [[0, 0], [r - 0.003, 0], [r, 0.003], [r, h * 0.28]];
  if (D.hi) body.push([r - 0.0012, h * 0.28 + 0.0008], [r - 0.0012, h * 0.28 + 0.003], [r, h * 0.28 + 0.0038]);
  body.push([r, h * 0.78], [r - 0.0015, h * 0.8], [r - 0.0015, h * 0.82]);
  g.add(mesh(lathe(body, seg), mats.motor));
  g.add(cyl(r + 0.0004, h * 0.09, mats.anodBlue, 'y', seg, 0, h * 0.86));
  g.add(mesh(lathe([[r - 0.001, h * 0.9], [r - 0.001, h * 0.95], [r - 0.004, h], [r * 0.42, h], [r * 0.4, h + 0.0025], [0, h + 0.0025]], seg), mats.machined));
  if (D.hi) {
    // cable gland and status LED on the side
    g.add(cyl(0.0055, 0.008, mats.steel, 'x', 10, -r - 0.003, h * 0.55, 0));
    led(g, mats, 0xff8a1f, r * 0.72, h + 0.0005, r * 0.42, 0.0035);
    bolts(g, mats.steel, [0, 1, 2, 3].map((k) => [Math.cos(k * TAU / 4 + 0.6) * r * 0.66, h + 0.0004, Math.sin(k * TAU / 4 + 0.6) * r * 0.66]), 'y', 0.0018);
  }
  return g;
}

function gearbox(mats, D, r = 0.026, stages = 2) {
  // MAXPlanetary-style stack, axis +y from 0 up
  const g = new THREE.Group();
  const seg = D.hi ? 24 : 16;
  let y = 0;
  for (let i = 0; i < stages; i++) {
    g.add(cyl(r, 0.02, mats.machined, 'y', seg, 0, y + 0.01));
    g.add(cyl(r + 0.0006, 0.003, mats.anodBlack, 'y', seg, 0, y + 0.0215));
    y += 0.023;
  }
  g.add(cyl(0.006, 0.014, mats.machined, 'y', 6, 0, y + 0.007));
  return { group: g, height: y };
}

const MOD_ROT = { '1,1': 0, '1,-1': Math.PI / 2, '-1,-1': Math.PI, '-1,1': -Math.PI / 2 };

// One swerve module in the front-right orientation; the robot clones it (sharing geometry) for
// the other corners and turns each copy so the motors face the robot's centre.
function buildModule(mats, D) {
  const mod = new THREE.Group();

  // pocketed top plate (bolted onto the frame rails along its two outer edges)
  const ps = rrShape(0.135, 0.135, 0.022);
  ps.holes.push(circ(0, 0, 0.0135));
  ps.holes.push(triPocket(0.038, 0.038, 0.017, Math.PI * 1.25, 0.003));
  ps.holes.push(triPocket(-0.03, -0.03, 0.012, Math.PI * 0.25, 0.003));
  ps.holes.push(circ(0.046, -0.012, 0.006), circ(-0.012, 0.046, 0.006));
  mod.add(mesh(inXZ(extrude(ps, 0.006, D)), mats.plate, 0, 0.113, 0));
  if (D.hi) {
    const bp = [];
    [-0.042, -0.014, 0.014, 0.042].forEach((t) => { bp.push([0.0605, 0.1168, t], [t, 0.1168, 0.0605]); });
    bolts(mod, mats.steel, bp, 'y', 0.0028);
  }
  // CANcoder on the steering axis
  part(mod, mats, 0x1c1e23, rbox(0.03, 0.03, 0.011, 0.004, 0.001), 0, 0.1215, 0, Math.PI / 2);
  if (D.hi) led(mod, mats, 0x39ff6a, 0.008, 0.1275, 0.008, 0.003);
  // drive + steering motors (Kraken X60)
  const drive = kraken(mats, D, 0.03, 0.062); drive.position.set(-0.04, 0.116, 0.022); mod.add(drive);
  const steerM = kraken(mats, D, 0.03, 0.05); steerM.position.set(0.022, 0.116, -0.04); mod.add(steerM);
  if (D.hi) {
    // motor pigtails dropping onto the plate toward the robot's centre
    [[-0.0735, 0.024, -0.064, -0.012, -0.058, -0.045], [0.024, -0.0735, -0.012, -0.064, -0.045, -0.058]].forEach(([x0, z0, x1, z1, x2, z2]) => {
      wire(mod, mats, 0xd62a2a, [[x0, 0.15, z0], [x1, 0.124, z1], [x2, 0.1185, z2]], 0.0024, 10);
      wire(mod, mats, 0x16171a, [[x0 + 0.002, 0.148, z0 - 0.004], [x1 + 0.004, 0.124, z1 - 0.003], [x2 + 0.004, 0.1185, z2 - 0.004]], 0.0024, 10);
    });
  }

  // steering assembly: rotates about y; the inner group cancels the corner rotation so all wheels stay parallel
  const steer = dynamic(new THREE.Group());
  steer.name = 'steer';
  const inner = dynamic(new THREE.Group());
  inner.name = 'inner';
  steer.add(inner);
  inner.add(mesh(inXZ(extrude(gearShape(D.hi ? 44 : 30, 0.047, 0.05, 0.02), 0.005, null, 4)), mats.anodBlack, 0, 0.1045, 0));
  inner.add(cyl(0.03, 0.012, mats.machined, 'y', 24, 0, 0.097));
  const fork = new THREE.Shape();
  fork.moveTo(-0.047, 0.094);
  fork.lineTo(0.047, 0.094);
  fork.lineTo(0.047, 0.06);
  fork.absarc(0, 0.0508, 0.026, 0.3, Math.PI - 0.3, true);
  fork.lineTo(-0.047, 0.06);
  fork.closePath();
  fork.holes.push(triPocket(-0.024, 0.077, 0.011, Math.PI, 0.003), triPocket(0.024, 0.077, 0.011, Math.PI, 0.003), circ(0, 0.0508, 0.007));
  [0.031, -0.031].forEach((x) => inner.add(mesh(inYZ(extrude(fork, 0.005, D)), mats.anodBlue, x, 0, 0)));
  inner.add(mesh(rbox(0.067, 0.008, 0.07, 0.006, 0.001), mats.anodBlue, 0, 0.0925, 0));
  // bevel gear housing on one side, axle cap on the other
  inner.add(cyl(0.021, 0.013, mats.anodBlack, 'x', 24, 0.04, 0.0508, 0));
  inner.add(cyl(0.012, 0.004, mats.machined, 'x', 20, 0.048, 0.0508, 0));
  inner.add(mesh(rbox(0.014, 0.038, 0.026, 0.004, 0.001), mats.anodBlack, 0.04, 0.074, 0));
  inner.add(cyl(0.009, 0.005, mats.machined, 'x', 16, -0.036, 0.0508, 0));

  // wheel: treaded with two groove rings, pocketed hub
  const wheel = dynamic(new THREE.Group());
  wheel.name = 'wheel';
  wheel.position.y = 0.0508;
  const R = 0.0508, W = 0.019;
  const tread = [[0.04, -W], [R - 0.0025, -W], [R, -W + 0.0025], [R, -0.0085], [R - 0.0016, -0.0078], [R - 0.0016, -0.0052], [R, -0.0045],
    [R, 0.0045], [R - 0.0016, 0.0052], [R - 0.0016, 0.0078], [R, 0.0085], [R, W - 0.0025], [R - 0.0025, W], [0.04, W]];
  wheel.add(mesh(lathe(D.hi ? tread : [[0.04, -W], [R, -W], [R, W], [0.04, W]], D.hi ? 40 : 24, 'x'), mats.rubber));
  const hub = circ(0, 0, 0.0402, THREE.Shape);
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; hub.holes.push(circ(Math.cos(a) * 0.024, Math.sin(a) * 0.024, 0.0085)); }
  hub.holes.push(circ(0, 0, 0.006));
  wheel.add(mesh(inYZ(extrude(hub, 0.034, D, D.hi ? 8 : 5)), mats.machined));
  wheel.add(cyl(0.012, 0.036, mats.anodBlue, 'x', 20));
  bake(wheel);
  inner.add(wheel);
  bake(inner);
  mod.add(steer);
  bake(mod);
  return mod;
}
const DRIVE_TOP = V3(-0.04, 0.19, 0.022);

// Drag chain (cable carrier) between the fixed elevator stage and stage 1, as instanced links.
function buildDragChain(mats, x, zFix, zMove, yFix, yMove0) {
  const R = Math.abs(zFix - zMove) / 2, pitch = 0.022;
  const yBend0 = 0.62;
  const straight = 2 * yBend0 - yFix - yMove0;
  const count = Math.ceil((straight + Math.PI * R) / pitch);
  const parts = [
    new THREE.BoxGeometry(0.004, pitch * 1.02, 0.018).translate(0.013, 0, 0),
    new THREE.BoxGeometry(0.004, pitch * 1.02, 0.018).translate(-0.013, 0, 0),
    new THREE.BoxGeometry(0.03, 0.005, 0.004).translate(0, 0, 0.0075),
    new THREE.BoxGeometry(0.03, 0.005, 0.004).translate(0, 0, -0.0075),
  ].map((g) => g.toNonIndexed());
  const geo = mergeGeometries(parts, false);
  const inst = new THREE.InstancedMesh(geo, mats.dragChain, count);
  inst.frustumCulled = false;
  const zc = (zFix + zMove) / 2, sgn = Math.sign(zFix - zc);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), one = V3(1, 1, 1), ax = V3(1, 0, 0);
  let last = null;
  const update = (yMove) => {
    if (last !== null && Math.abs(yMove - last) < 1e-5) return;
    last = yMove;
    const yB = (straight + yFix + yMove) / 2;
    const a = yB - yFix;
    for (let i = 0; i < count; i++) {
      const s = (i + 0.5) * pitch;
      let ang;
      if (s < a) { p.set(x, yFix + s, zFix); ang = 0; } else if (s < a + Math.PI * R) {
        const phi = (s - a) / R;
        p.set(x, yB + R * Math.sin(phi), zc + (zFix - zc) * Math.cos(phi));
        ang = -sgn * phi;
      } else { p.set(x, Math.max(yMove, yB - (s - a - Math.PI * R)), zMove); ang = Math.PI; }
      q.setFromAxisAngle(ax, ang);
      m.compose(p, q, one);
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
  };
  return { mesh: inst, update };
}

// ---------------------------------------------------------------- build

// The build is a generator that pauses between sub-assemblies, so a caller can spread the work
// over several frames (buildRobotAsync) instead of blocking the main thread in one long task.
export function buildRobot(opts = {}) {
  const steps = buildSteps(opts);
  let r = steps.next();
  while (!r.done) r = steps.next();
  return r.value;
}
export async function buildRobotAsync(opts = {}, wait = () => new Promise((res) => setTimeout(res, 0))) {
  const steps = buildSteps(opts);
  let r = steps.next();
  while (!r.done) { await wait(); r = steps.next(); }
  return r.value;
}

function* buildSteps({ sponsors = [], detail = 'high', maxAnisotropy = 0 } = {}) {
  if (maxAnisotropy) ANISO = Math.max(1, Math.min(16, maxAnisotropy));
  const hi = detail !== 'low';
  const D = { hi, bevel: hi ? 0.0006 : 0, seg: hi ? 6 : 3 };
  const mats = makeMaterials(hi);
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const parts = {};
  const anchors = {};
  const anchor = (name, parent, x, y, z) => {
    const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); anchors[name] = o; return o;
  };
  const EZ = -0.1, EX = 0.17;

  // ---------------- frame: punched 2x1 perimeter, cross members, gussets, belly pan, intake pivot mounts
  const frame = new THREE.Group();
  const F = 0.70, T = 0.025, TH = 0.05, FY = 0.085, RAIL = F / 2 - T / 2;
  frame.add(mesh(tube(F, T, TH, { axis: 'x' }), mats.tube, 0, FY, RAIL));
  frame.add(mesh(tube(F, T, TH, { axis: 'x' }), mats.tube, 0, FY, -RAIL));
  frame.add(mesh(tube(F - 2 * T, T, TH, { axis: 'z' }), mats.tube, RAIL, FY, 0));
  frame.add(mesh(tube(F - 2 * T, T, TH, { axis: 'z' }), mats.tube, -RAIL, FY, 0));
  frame.add(mesh(tube(F - 2 * T, T, TH, { axis: 'x' }), mats.tube, 0, FY, 0.17));
  frame.add(mesh(tube(F - 2 * T, T, TH, { axis: 'x' }), mats.tube, 0, FY, EZ));
  // gussets where the cross members meet the side rails
  const gusShape = roundPoly([[-0.03, -0.034], [0.03, -0.034], [0.03, 0.034], [-0.03, 0.034]], 0.008, THREE.Shape);
  gusShape.holes.push(triPocket(-0.004, 0, 0.012, -Math.PI / 2, 0.003));
  [[1, 0.17], [-1, 0.17], [1, EZ], [-1, EZ]].forEach(([s, z]) => {
    const x = s * (RAIL - 0.018);
    frame.add(mesh(inXZ(extrude(gusShape, 0.0032, D)), mats.anodBlack, x, 0.1116, z, 0, s > 0 ? 0 : Math.PI, 0));
    if (hi) bolts(frame, mats.rivet, [[x + s * 0.02, 0.1133, z - 0.022], [x + s * 0.02, 0.1133, z + 0.022], [x - s * 0.018, 0.1133, z - 0.022], [x - s * 0.018, 0.1133, z + 0.022]], 'y', 0.0028);
  });
  if (hi) {
    // rivet lines along the outer rails
    const rv = [];
    for (let k = -5; k <= 5; k++) if (Math.abs(k) < 4) { rv.push([k * 0.05, 0.1103, RAIL], [k * 0.05, 0.1103, -RAIL], [RAIL, 0.1103, k * 0.05], [-RAIL, 0.1103, k * 0.05]); }
    bolts(frame, mats.rivet, rv, 'y', 0.0024);
  }
  // belly pan with isogrid lightening pockets, notched around the swerve modules
  const PH = 0.325, NOTCH = 0.197;
  const pan = roundPoly([[-NOTCH, -PH], [NOTCH, -PH], [NOTCH, -NOTCH], [PH, -NOTCH], [PH, NOTCH], [NOTCH, NOTCH], [NOTCH, PH], [-NOTCH, PH],
    [-NOTCH, NOTCH], [-PH, NOTCH], [-PH, -NOTCH], [-NOTCH, -NOTCH]], 0.012, THREE.Shape);
  const keepOut = [[-0.12, 0.12, -0.34, -0.24], [-0.24, -0.06, 0.005, 0.135], [0.05, 0.25, 0.0, 0.14], [-0.07, 0.07, 0.22, 0.32],
    [0.1, 0.24, -0.33, -0.22], [-0.35, 0.35, 0.145, 0.195], [-0.35, 0.35, EZ - 0.025, EZ + 0.025], [-0.22, -0.12, -0.33, -0.24]];
  const inside = (x, z) => {
    const ax = Math.abs(x), az = Math.abs(z), m = 0.016;
    if (ax > PH - m || az > PH - m) return false;
    if (ax > NOTCH - m && az > NOTCH - m) return false;
    return !keepOut.some(([x0, x1, z0, z1]) => x > x0 - 0.006 && x < x1 + 0.006 && z > z0 - 0.006 && z < z1 + 0.006);
  };
  const S = 0.072, HT = S * Math.sqrt(3) / 2, rib = 0.011, inr = S / (2 * Math.sqrt(3)), kk = 1 - rib / 2 / inr;
  for (let j = 0; j * HT < 2 * PH; j++) {
    const zb = -PH + j * HT, zt = zb + HT;
    for (let i = -12; i <= 12; i++) {
      const cx = (i * S) / 2;
      const up = (i + j) % 2 === 0;
      const tri = up ? [[cx - S / 2, zb], [cx + S / 2, zb], [cx, zt]] : [[cx - S / 2, zt], [cx, zb], [cx + S / 2, zt]];
      const gx = cx, gz = up ? zb + HT / 3 : zt - HT / 3;
      const ins = tri.map(([x, z]) => [gx + (x - gx) * kk, gz + (z - gz) * kk]);
      if (ins.every(([x, z]) => inside(x, z)) && inside(gx, gz)) pan.holes.push(roundPoly(ins.map(([x, z]) => [x, z]).reverse(), 0.005));
    }
  }
  frame.add(mesh(inXZ(extrude(pan, 0.003, null, D.hi ? 4 : 2)), mats.pan, 0, 0.0625, 0));
  // intake pivot towers
  const tower = roundPoly([[0.19, 0.066], [0.31, 0.066], [0.31, 0.15], [0.272, 0.226], [0.228, 0.226], [0.19, 0.15]], 0.012, THREE.Shape);
  tower.holes.push(circ(0.25, 0.2, 0.0065), triPocket(0.25, 0.122, 0.024, 0, 0.004));
  [1, -1].forEach((s) => {
    frame.add(mesh(inYZ(extrude(tower, 0.005, D)), mats.anodBlack, s * 0.3215, 0, 0));
    frame.add(cyl(0.013, 0.006, mats.machined, 'x', 20, s * 0.3135, 0.2, 0.25));
    if (hi) bolts(frame, mats.steel, [[s * 0.3245, 0.078, 0.2], [s * 0.3245, 0.078, 0.3], [s * 0.3245, 0.098, 0.2], [s * 0.3245, 0.098, 0.3]], 'x', 0.0026, s);
  });
  bake(frame);
  body.add(frame);
  parts.frame = frame;
  yield;

  // ---------------- swerve modules
  parts.modules = [];
  const corners = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  const moduleTemplate = buildModule(mats, D);
  corners.forEach(([sx, sz], i) => {
    const theta = MOD_ROT[`${sx},${sz}`];
    const mod = i ? moduleTemplate.clone(true) : moduleTemplate;
    const steer = mod.getObjectByName('steer'), wheel = mod.getObjectByName('wheel');
    mod.rotation.y = theta;
    steer.getObjectByName('inner').rotation.y = -theta;
    mod.position.set(sx * 0.268, 0, sz * 0.268);
    mod.userData.dir = V3(sx, 0, sz).normalize();
    body.add(mod);
    parts.modules.push({ group: mod, steer, wheel, base: mod.position.clone() });
    if (i === 0) anchor('x60', mod, DRIVE_TOP.x, DRIVE_TOP.y, DRIVE_TOP.z);
    if (i === 1) anchor('swerve', mod, 0, 0.05, 0.06).position.applyAxisAngle(V3(0, 1, 0), -theta);
  });

  // ---------------- bumpers
  const bumpers = new THREE.Group();
  const { geo: bGeo, sideLen } = bumperGeometry(hi ? BUMP.NC : 6);
  const { outerLen } = bumperProfile();
  const num = textTexture((ctx, w, h) => drawBumper(ctx, w, h, sideLen, outerLen), 1024, 1024);
  mats.bumper.map = num.tex;
  const ring = new THREE.Mesh(bGeo, mats.bumper);
  bumpers.add(ring);
  body.add(bumpers);
  parts.bumpers = bumpers;
  parts.redrawNumbers = num.redraw;
  anchor('bumpers', bumpers, 0.3, 0.08, 0.45);
  yield;

  // ---------------- electronics
  const elec = new THREE.Group();
  // battery, strap, Anderson connector, main breaker
  const bat = new THREE.Group();
  bat.position.set(0, 0.0645, -0.29);
  bat.add(mesh(rbox(0.18, 0.15, 0.076, 0.006, 0.002), mats.battery, 0, 0.075, 0));
  bat.add(mesh(rbox(0.184, 0.018, 0.08, 0.006, 0.002), mats.battery, 0, 0.156, 0));
  const lab = new THREE.PlaneGeometry(0.15, 0.13);
  bat.add(mesh(lab, mats.batteryLabel, 0, 0.078, 0.0385));
  bat.add(mesh(lab, mats.batteryLabel, 0, 0.078, -0.0385, 0, Math.PI, 0));
  part(bat, mats, 0x101114, new THREE.BoxGeometry(0.026, 0.004, 0.084), 0.045, 0.166, 0);
  part(bat, mats, 0x101114, new THREE.BoxGeometry(0.026, 0.004, 0.084), -0.045, 0.166, 0);
  part(bat, mats, 0x101114, new THREE.TorusGeometry(0.03, 0.005, 6, 16, Math.PI), 0, 0.168, 0, 0, Math.PI / 2, 0);
  [[0.05, 0xd62a2a], [-0.05, 0x1d1e22]].forEach(([x, c]) => {
    bat.add(mesh(new THREE.BoxGeometry(0.018, 0.012, 0.016), mats.machined, x, 0.17, 0.018));
    part(bat, mats, c, new THREE.CylinderGeometry(0.008, 0.008, 0.016, 12), x, 0.181, 0.018);
  });
  part(bat, mats, 0xc8202a, rbox(0.044, 0.022, 0.03, 0.004, 0.001), 0.0, 0.2, 0.012);
  elec.add(bat);
  part(elec, mats, 0x1b1c20, rbox(0.06, 0.045, 0.034, 0.004, 0.0012), 0.165, 0.088, -0.28);
  part(elec, mats, 0xd8202a, new THREE.CylinderGeometry(0.008, 0.008, 0.008, 14), 0.165, 0.113, -0.285);
  part(elec, mats, 0xc9a55a, new THREE.CylinderGeometry(0.0045, 0.0045, 0.01, 8), 0.145, 0.115, -0.272);
  part(elec, mats, 0xc9a55a, new THREE.CylinderGeometry(0.0045, 0.0045, 0.01, 8), 0.185, 0.115, -0.272);
  // RSL
  part(elec, mats, 0x1b1c20, new THREE.CylinderGeometry(0.014, 0.016, 0.01, 18), -0.17, 0.07, -0.28);
  led(elec, mats, 0xff7a12, -0.17, 0.084, -0.28, 0.022, 1.25);

  // roboRIO
  const rio = new THREE.Group();
  rio.add(mesh(rbox(0.145, 0.095, 0.03, 0.008, 0.0015), mats.rio, 0, 0, 0, Math.PI / 2, 0, 0));
  part(rio, mats, 0x1d1f25, rbox(0.128, 0.08, 0.004, 0.006, 0.001), 0, 0.0158, 0, Math.PI / 2, 0, 0);
  if (hi) {
    [0x39ff6a, 0x39ff6a, 0xffb020, 0x2f7bff, 0x39ff6a, 0xff3b30].forEach((c, k) => led(rio, mats, c, -0.05 + k * 0.0085, 0.0185, -0.028, 0.0035));
    for (let k = 0; k < 10; k++) part(rio, mats, 0x0e0f12, new THREE.BoxGeometry(0.008, 0.008, 0.006), -0.055 + k * 0.0122, 0.004, 0.0505);
    part(rio, mats, 0x0e0f12, new THREE.BoxGeometry(0.016, 0.014, 0.012), 0.06, 0.006, -0.043);
    part(rio, mats, 0x0e0f12, new THREE.BoxGeometry(0.014, 0.008, 0.01), 0.04, 0.006, -0.045);
  }
  rio.position.set(-0.15, 0.0805, 0.07);
  elec.add(rio);

  // Power Distribution Hub with its row of breakers
  const pdh = new THREE.Group();
  pdh.add(mesh(rbox(0.17, 0.11, 0.036, 0.008, 0.0015), mats.anodBlack, 0, 0, 0, Math.PI / 2, 0, 0));
  part(pdh, mats, 0x2a2d34, rbox(0.15, 0.02, 0.004, 0.004, 0.001), 0, 0.019, 0.032, Math.PI / 2, 0, 0);
  const fuseCols = [0xffcc00, 0xffcc00, 0x2f7bff, 0xffcc00, 0xff3b30, 0xffcc00, 0x34c759, 0xffcc00, 0x2f7bff, 0xffcc00];
  [-0.026, 0.026].forEach((z, row) => fuseCols.forEach((c, k) => {
    part(pdh, mats, row ? fuseCols[(k + 3) % 10] : c, new THREE.BoxGeometry(0.0095, 0.012, 0.016), -0.068 + k * 0.0151, 0.024, z);
  }));
  part(pdh, mats, 0xd62a2a, new THREE.CylinderGeometry(0.008, 0.008, 0.016, 12), -0.076, 0.022, -0.05);
  part(pdh, mats, 0x1d1e22, new THREE.CylinderGeometry(0.008, 0.008, 0.016, 12), -0.058, 0.022, -0.05);
  if (hi) led(pdh, mats, 0x39ff6a, 0.072, 0.0195, 0.045, 0.0035);
  pdh.position.set(0.15, 0.084, 0.07);
  elec.add(pdh);

  // radio
  part(elec, mats, 0xf2f3f5, rbox(0.1, 0.07, 0.026, 0.012, 0.002), 0, 0.078, 0.27, Math.PI / 2, 0, 0);
  if (hi) [0, 1, 2].forEach((k) => led(elec, mats, 0x39ff6a, -0.03 + k * 0.009, 0.0915, 0.29, 0.0032));

  // wiring: 6 AWG main feed, 12 AWG pairs to each module, CAN bus (yellow/green), radio PoE
  const RED = 0xd62a2a, BLK = 0x17181b, YEL = 0xf2c230, GRN = 0x2bb24c;
  wire(elec, mats, RED, [[0.05, 0.236, -0.288], [0.1, 0.2, -0.27], [0.14, 0.13, -0.27], [0.145, 0.115, -0.272]], 0.0055);
  wire(elec, mats, RED, [[0.185, 0.115, -0.272], [0.21, 0.12, -0.2], [0.13, 0.11, -0.05], [0.074, 0.106, 0.02]], 0.0055);
  wire(elec, mats, BLK, [[-0.05, 0.236, -0.288], [-0.07, 0.19, -0.2], [0.0, 0.11, -0.05], [0.092, 0.106, 0.02]], 0.0055);
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz], k) => {
    const end = [sx * 0.2, 0.12, sz * 0.2];
    const start = [0.09 + k * 0.03, 0.105, sz > 0 ? 0.125 : 0.015];
    const mid = [(start[0] + end[0]) / 2, 0.118, (start[2] + end[2]) / 2 + 0.02];
    wire(elec, mats, RED, [start, mid, end], 0.0028, 20);
    wire(elec, mats, BLK, [[start[0] + 0.004, start[1], start[2]], [mid[0] + 0.005, mid[1] - 0.003, mid[2]], [end[0] + 0.004, end[1], end[2] + 0.004]], 0.0028, 20);
  });
  const can = [[-0.1, 0.1, 0.07], [-0.03, 0.098, 0.06], [0.06, 0.1, 0.07], [0.2, 0.105, 0.18], [0.21, 0.12, 0.23]];
  wire(elec, mats, YEL, can, 0.0022, 30);
  wire(elec, mats, GRN, can.map(([x, y, z]) => [x, y + 0.004, z + 0.003]), 0.0022, 30);
  const can2 = [[-0.2, 0.1, 0.07], [-0.21, 0.105, -0.05], [-0.2, 0.12, -0.2]];
  wire(elec, mats, YEL, can2, 0.0022, 20);
  wire(elec, mats, GRN, can2.map(([x, y, z]) => [x + 0.004, y, z + 0.003]), 0.0022, 20);
  wire(elec, mats, 0x2f7bff, [[-0.12, 0.096, 0.12], [-0.08, 0.09, 0.2], [-0.04, 0.085, 0.26]], 0.0028, 20);
  bake(elec);
  body.add(elec);
  parts.electronics = elec;
  anchor('rio', rio, 0, 0.03, 0);
  anchor('pdh', pdh, 0, 0.04, 0);
  yield;

  // ---------------- elevator
  const elevator = new THREE.Group();
  const H0 = 1.0;
  const stage0 = new THREE.Group();
  stage0.add(mesh(tube(H0, 0.025, 0.05, { axis: 'y' }), mats.tube, EX, 0.11 + H0 / 2, EZ));
  stage0.add(mesh(tube(H0, 0.025, 0.05, { axis: 'y' }), mats.tube, -EX, 0.11 + H0 / 2, EZ));
  stage0.add(mesh(tube(2 * EX - 0.025, 0.05, 0.04, { axis: 'x' }), mats.tube, 0, 0.11 + H0 - 0.02, EZ));
  stage0.add(mesh(tube(2 * EX - 0.025, 0.05, 0.04, { axis: 'x' }), mats.tube, 0, 0.14, EZ));
  [[EX, 1], [-EX, -1]].forEach(([x, s]) => {
    stage0.add(strut(V3(x, 0.92, EZ - 0.03), V3(x, 0.122, -0.322), 0.025, 0.025, mats.tube));
    // outer gussets top & bottom, and at the brace
    const gb = roundPoly([[-0.05, -0.04], [0.05, -0.04], [0.05, 0.03], [0.0, 0.05], [-0.05, 0.03]], 0.008, THREE.Shape);
    gb.holes.push(triPocket(0, 0.002, 0.016, 0, 0.003));
    stage0.add(mesh(inYZ(extrude(gb, 0.003, D)), mats.anodBlack, x + s * 0.0145, 0.165, EZ));
    const gt = rrShape(0.07, 0.06, 0.008);
    gt.holes.push(circ(0, 0, 0.012));
    stage0.add(mesh(inYZ(extrude(gt, 0.003, D)), mats.anodBlack, x + s * 0.0145, 0.11 + H0 - 0.04, EZ));
    if (hi) {
      const p = [];
      [-0.035, 0.035].forEach((dz) => [0.14, 0.185].forEach((y) => p.push([x + s * 0.0165, y, EZ + dz])));
      [-0.02, 0.02].forEach((dz) => [-0.018, 0.018].forEach((dy) => p.push([x + s * 0.0165, 1.07 + dy, EZ + dz])));
      bolts(stage0, mats.rivet, p, 'x', 0.0028, s);
    }
    // chain loop with top & bottom sprockets on the inner face
    const xs = x - s * 0.0182;
    const spr = inYZ(extrude(gearShape(D.hi ? 18 : 12, 0.019, 0.0225, 0.004, true), 0.004, null, 2));
    stage0.add(mesh(spr, mats.machined, xs, 0.2, EZ));
    stage0.add(mesh(spr, mats.machined, xs, 1.04, EZ));
    if (hi) {
      const run = new THREE.BoxGeometry(0.006, 0.84, 0.0062);
      const uv = run.attributes.uv, pos = run.attributes.position;
      // u counts chain pitches (one tile = 2 pitches); v runs across the plate side
      for (let k = 0; k < pos.count; k++) { const u = (pos.getY(k) + 0.42) / (2 * 0.00635); const v = Math.abs(pos.getX(k)) > 0.0029 ? (pos.getZ(k) / 0.0062 + 0.5) : (pos.getX(k) / 0.006 + 0.5); uv.setXY(k, u, v); }
      stage0.add(mesh(run, mats.chain, xs, 0.62, EZ + 0.0207));
      stage0.add(mesh(run, mats.chain, xs, 0.62, EZ - 0.0207));
    }
  });
  // drive: hex shaft across the bottom sprockets, two Krakens on planetary gearboxes behind
  stage0.add(cyl(0.0064, 2 * EX + 0.04, mats.machined, 'x', 6, 0, 0.2, EZ));
  [0.06, -0.06].forEach((x) => {
    const gbx = gearbox(mats, D, 0.026, 2);
    const z0 = EZ - 0.025 - 0.014 - gbx.height;
    gbx.group.rotation.x = Math.PI / 2;
    gbx.group.position.set(x, 0.19, z0);
    stage0.add(gbx.group);
    const mot = kraken(mats, D, 0.03, 0.06);
    mot.rotation.x = -Math.PI / 2;
    mot.position.set(x, 0.19, z0);
    stage0.add(mot);
  });
  // stage-0 bearing blocks that guide stage 1
  [EX - 0.03, -EX + 0.03].forEach((x) => {
    stage0.add(mesh(rbox(0.03, 0.045, 0.012, 0.004, 0.001), mats.anodBlack, x, 1.065, EZ + 0.031));
    stage0.add(cyl(0.008, 0.006, mats.machined, 'z', 16, x, 1.075, EZ + 0.039));
    stage0.add(cyl(0.008, 0.006, mats.machined, 'z', 16, x, 1.055, EZ + 0.039));
  });

  // vision camera on the top crossbar
  const cam = new THREE.Group();
  cam.add(mesh(rbox(0.085, 0.055, 0.03, 0.007, 0.0015), mats.anodBlack));
  cam.add(cyl(0.0135, 0.006, mats.machined, 'z', 24, 0, 0.004, 0.017));
  cam.add(cyl(0.0105, 0.008, mats.lens, 'z', 24, 0, 0.004, 0.019));
  [-0.028, 0.028].forEach((x) => [-0.014, 0.018].forEach((y) => led(cam, mats, 0x39ff6a, x, y, 0.0158, 0.009, 1.4)));
  if (hi) for (let k = 0; k < 8; k++) cam.add(mesh(new THREE.BoxGeometry(0.0022, 0.045, 0.008), mats.anodBlack, -0.03 + k * 0.0086, 0, -0.018));
  cam.add(mesh(new THREE.BoxGeometry(0.04, 0.004, 0.05), mats.anodBlack, 0, -0.03, -0.005));
  cam.position.set(0, 0.11 + H0 + 0.032, EZ + 0.01);
  stage0.add(cam);
  wire(stage0, mats, 0x17181b, [[0.02, 1.13, EZ - 0.012], [0.12, 1.09, EZ - 0.03], [EX - 0.004, 0.95, EZ - 0.03], [EX - 0.004, 0.4, EZ - 0.03], [0.13, 0.12, -0.05]], 0.0025, 40);

  // sponsor panel on the left (-x) side of the tower: printed card in an aluminium bezel on a black
  // anodised backplate, held off the tower tube and its brace by four standoffs
  const TX = -EX - 0.0125, PZ = EZ - 0.08, PY = 0.55;   // TX: outer face of the tower tube
  const SO = 0.01, BP = 0.003, BZ = 0.004;               // standoff length, backplate and bezel depth
  const PF = TX - SO - BP;                               // front face of the backplate
  const PW = 0.33, PHT = 0.44;                           // card size (z, y)
  [[0.71, EZ], [0.39, EZ], [0.71, -0.18], [0.39, -0.2575]].forEach(([y, z]) => {
    stage0.add(cyl(0.0042, SO, mats.machined, 'x', hi ? 12 : 8, TX - SO / 2, y, z));
  });
  stage0.add(mesh(rbox(PW + 0.042, PHT + 0.042, BP, 0.024, 0.0008), mats.anodBlack, TX - SO - BP / 2, PY, PZ, 0, Math.PI / 2, 0));
  const bezel = rrShape(PW + 0.024, PHT + 0.024, 0.02);
  bezel.holes.push(rrShape(PW - 0.004, PHT - 0.004, 0.012, 0, 0, THREE.Path));
  stage0.add(mesh(inYZ(extrude(bezel, BZ, D, hi ? 6 : 3)), mats.machined, PF - BZ / 2, PY, PZ));
  bolts(stage0, mats.steel, [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [PF - BZ - 0.0011, PY + b * (PHT / 2 + 0.006), PZ + a * (PW / 2 + 0.006)]), 'x', 0.0036, -1);
  const panel = textTexture((ctx, w, h, name) => drawSponsorPanel(ctx, w, h, name, sponsors), 1024, 1366);
  // matte print so reflections don't wash out the names; a little self-light keeps the card white on the shaded side
  const panelMesh = new THREE.Mesh(new THREE.PlaneGeometry(PW, PHT), new THREE.MeshStandardMaterial({ map: panel.tex, roughness: 0.72, metalness: 0, envMapIntensity: 0.7, emissive: 0xffffff, emissiveMap: panel.tex, emissiveIntensity: 0.2, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }));
  panelMesh.rotation.y = -Math.PI / 2;
  panelMesh.position.set(PF - 0.0015, PY, PZ); // 1.5 mm proud of the backplate (no z-fighting on 16-bit depth)
  panelMesh.userData.keep = true;
  stage0.add(panelMesh);
  parts.setSponsorName = (name) => panel.redraw(name);
  anchor('panel', stage0, PF - 0.0015, PY, PZ);

  // team crest on the right (+x) side: smoky backer + logo decal
  const LX = EX + 0.0125;
  stage0.add(mesh(rbox(0.29, 0.29, 0.004, 0.03, 0.0012), mats.smoke, LX + 0.003, PY, PZ, 0, Math.PI / 2, 0));
  const crest = new THREE.CircleGeometry(0.122, hi ? 64 : 40);
  const cuv = crest.attributes.uv;
  for (let k = 0; k < cuv.count; k++) cuv.setXY(k, 0.5 + (cuv.getX(k) - 0.5) * 0.985, 0.5 + (cuv.getY(k) - 0.5) * 0.985);
  stage0.add(mesh(crest, mats.logo, LX + 0.0056, PY, PZ, 0, Math.PI / 2, 0));
  stage0.add(mesh(new THREE.RingGeometry(0.122, 0.128, hi ? 64 : 40), mats.machined, LX + 0.0056, PY, PZ, 0, Math.PI / 2, 0));
  if (hi) bolts(stage0, mats.steel, [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [LX + 0.0055, PY + b * 0.122, PZ + a * 0.122]), 'x', 0.003, 1);
  anchor('logo', stage0, LX + 0.006, PY, PZ);
  // drag chain fixed bracket (right brace -> chain)
  stage0.add(mesh(rbox(0.08, 0.006, 0.03, 0.004, 0.001), mats.anodBlack, 0.13, 0.29, -0.232));
  bake(stage0);
  elevator.add(stage0);
  anchor('camera', cam, 0, 0.03, 0.02);
  anchor('elevator', stage0, -EX, 0.75, EZ);
  yield;

  // stage 1 (black punched tube)
  const stage1 = dynamic(new THREE.Group());
  const H1 = 0.95, X1 = 0.135, Z1 = EZ + 0.038;
  stage1.add(mesh(tube(H1, 0.022, 0.022, { axis: 'y' }), mats.tubeBlack, X1, 0.13 + H1 / 2, Z1));
  stage1.add(mesh(tube(H1, 0.022, 0.022, { axis: 'y' }), mats.tubeBlack, -X1, 0.13 + H1 / 2, Z1));
  stage1.add(mesh(tube(2 * X1 - 0.022, 0.022, 0.03, { axis: 'x' }), mats.tubeBlack, 0, 0.13 + H1 - 0.015, Z1));
  stage1.add(mesh(tube(2 * X1 - 0.022, 0.022, 0.03, { axis: 'x' }), mats.tubeBlack, 0, 0.15, Z1));
  [X1, -X1].forEach((x) => {
    stage1.add(mesh(rbox(0.032, 0.05, 0.01, 0.004, 0.001), mats.anodBlack, x, 1.03, Z1 + 0.016));
    stage1.add(cyl(0.008, 0.006, mats.machined, 'z', 16, x, 1.043, Z1 + 0.023));
    stage1.add(cyl(0.008, 0.006, mats.machined, 'z', 16, x, 1.017, Z1 + 0.023));
  });
  // drag chain moving bracket
  stage1.add(mesh(rbox(0.03, 0.006, 0.09, 0.004, 0.001), mats.anodBlack, 0.1, 0.235, Z1 - 0.04));
  elevator.add(stage1);

  // carriage: pocketed plate riding on stage 1, carrying the end effector
  const carriage = dynamic(new THREE.Group());
  const cp = rrShape(0.25, 0.17, 0.02);
  cp.holes.push(triPocket(-0.07, 0.0, 0.04, Math.PI / 2, 0.006), triPocket(0.07, 0.0, 0.04, -Math.PI / 2, 0.006),
    triPocket(0, 0.045, 0.03, Math.PI, 0.005), triPocket(0, -0.045, 0.03, 0, 0.005));
  carriage.add(mesh(extrude(cp, 0.006, D), mats.plate, 0, 0.26, Z1 + 0.02));
  [-1, 1].forEach((s) => [0.2, 0.32].forEach((y) => {
    carriage.add(mesh(rbox(0.028, 0.03, 0.022, 0.004, 0.001), mats.anodBlack, s * X1, y, Z1 + 0.006));
  }));
  if (hi) {
    const p = [];
    [-0.11, 0.11].forEach((x) => [0.19, 0.33].forEach((y) => p.push([x, y, Z1 + 0.0235])));
    bolts(carriage, mats.steel, p, 'z', 0.003);
  }
  // end effector: pivoting box of pocketed polycarbonate, star rollers, hollow PVC coral
  const ee = dynamic(new THREE.Group());
  ee.position.set(0, 0.3, Z1 + 0.03);
  const side = roundPoly([[-0.02, 0.035], [0.215, 0.108], [0.215, -0.108], [-0.02, -0.035]], 0.016, THREE.Shape);
  side.holes.push(circ(0.15, 0, 0.022), circ(0.06, 0, 0.012), triPocket(0.15, 0.072, 0.014, Math.PI, 0.003), triPocket(0.15, -0.072, 0.014, 0, 0.003));
  [0.1, -0.1].forEach((x) => ee.add(mesh(inYZ(extrude(side, 0.006, D)), mats.smoke, x, 0, 0)));
  ee.add(cyl(0.012, 0.21, mats.machined, 'x', 20));
  [[0.02, 0.024], [0.02, -0.024], [0.2, 0.09], [0.2, -0.09]].forEach(([z, y]) => ee.add(cyl(0.0048, 0.2, mats.machined, 'x', 10, 0, y, z)));
  const r1 = starRoller(mats, 0.17, 4, 0.032); r1.position.set(0, 0.082, 0.15); ee.add(r1);
  const r2 = starRoller(mats, 0.17, 4, 0.032); r2.position.set(0, -0.082, 0.15); ee.add(r2);
  const eem = kraken(mats, D, 0.022, 0.045); eem.rotation.z = -Math.PI / 2; eem.position.set(0.12, 0.03, 0.045); ee.add(eem);
  ee.add(mesh(beltGeo([0.045, 0.03], [0.15, 0.082], 0.011, 0.0025, 0.009), mats.rubber, 0.112, 0, 0));
  ee.add(cyl(0.012, 0.01, mats.machined, 'x', 20, 0.112, 0.082, 0.15));
  const coral = mesh(lathe([[0.0535, -0.15], [0.0572, -0.15], [0.0572, 0.15], [0.0535, 0.15], [0.0535, -0.15]], hi ? 40 : 24, 'x'), mats.pvc, 0, 0, 0.15);
  coral.userData.keep = true;
  ee.add(coral);
  ee.rotation.x = -0.25;
  carriage.add(ee);
  stage1.add(carriage);
  body.add(elevator);
  parts.elevator = { group: elevator, stage1, carriage, ee, rollers: [r1, r2], coral };

  // drag chain from the fixed stage to stage 1
  if (hi) {
    const drag = buildDragChain(mats, 0.1, -0.232, -0.142, 0.296, 0.24);
    elevator.add(drag.mesh);
    parts.elevator.drag = drag;
    drag.update(0.24);
  }
  yield;

  // ---------------- ground intake (over the bumper)
  const intake = new THREE.Group();
  intake.position.set(0, 0.2, 0.25);
  const ip = roundPoly([[-0.032, 0.03], [0.2, 0.012], [0.312, -0.068], [0.33, -0.13], [0.29, -0.172], [0.222, -0.168], [0.198, -0.064], [0.1, -0.04], [-0.032, -0.03]], 0.022, THREE.Shape);
  ip.holes.push(circ(0, 0, 0.0075), triPocket(0.09, -0.012, 0.016, -Math.PI / 2, 0.003), triPocket(0.165, -0.012, 0.015, Math.PI / 2, 0.003),
    triPocket(0.268, -0.075, 0.016, Math.PI * 0.75, 0.003), circ(0.27, -0.115, 0.009), circ(0.215, -0.012, 0.008));
  [0.3, -0.3].forEach((x) => intake.add(mesh(inYZ(extrude(ip, 0.008, D)), mats.poly, x, 0, 0)));
  intake.add(cyl(0.0095, 0.64, mats.machined, 'x', 6));
  intake.add(mesh(tube(0.592, 0.025, 0.025, { axis: 'x' }), mats.tube, 0, 0.003, 0.12));
  const ir1 = starRoller(mats, 0.52, 9, 0.052); ir1.position.set(0, -0.115, 0.27); intake.add(ir1);
  const ir2 = starRoller(mats, 0.52, 8, 0.042); ir2.position.set(0, -0.012, 0.215); intake.add(ir2);
  // belt drive on the right side, driven by a Kraken X44 on a planetary
  const x44 = new THREE.Group();
  const x44m = kraken(mats, D, 0.022, 0.044); x44m.rotation.z = -Math.PI / 2; x44m.position.x = 0.026; x44.add(x44m);
  const x44g = gearbox(mats, D, 0.021, 1); x44g.group.rotation.z = Math.PI / 2; x44g.group.position.x = 0.026; x44.add(x44g.group);
  x44.position.set(0.322, 0.05, 0.1);
  intake.add(x44);
  intake.add(mesh(beltGeo([0.1, 0.05], [0.215, -0.012], 0.012, 0.0025, 0.009), mats.rubber, 0.312, 0, 0));
  intake.add(mesh(beltGeo([0.215, -0.012], [0.27, -0.115], 0.012, 0.0025, 0.009), mats.rubber, 0.322, 0, 0));
  [[0.1, 0.05, 0.312], [0.215, -0.012, 0.316], [0.27, -0.115, 0.322]].forEach(([z, y, x]) => intake.add(cyl(0.0135, 0.02, mats.machined, 'x', 20, x, y, z)));
  if (hi) bolts(intake, mats.steel, [[0.07, -0.025], [0.13, -0.02], [0.24, -0.15], [0.3, -0.06]].map(([z, y]) => [0.3045, y, z]), 'x', 0.0026, 1);
  bake(intake);
  body.add(intake);
  parts.intake = { group: intake, rollers: [ir1, ir2], base: intake.position.clone() };
  anchor('x44', x44, 0.02, 0.03, 0);
  anchor('intake', intake, -0.12, -0.065, 0.31);

  // bake the remaining static groups (roller shafts, stage 1, carriage, end effector)
  [ir1, ir2, r1, r2].forEach((r) => bake(r));
  bake(ee); bake(carriage); bake(stage1);

  // ---------------- game piece (algae), shown during the intake chapter
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 48, 32), mats.ball);
  ball.visible = false;
  root.add(ball);
  parts.ball = ball;

  // shadow flags (only used if the renderer enables shadow maps)
  root.traverse((o) => {
    if (!o.isMesh) return;
    const tr = o.material.transparent && o.material !== mats.bumper;
    o.castShadow = !tr;
    o.receiveShadow = !tr;
  });
  ball.receiveShadow = false;

  // remember rest positions for the exploded view
  parts.rest = {
    bumpers: bumpers.position.clone(),
    elec: elec.position.clone(),
    elevator: elevator.position.clone(),
  };

  return { root, parts, anchors, mats };
}

// Pose the robot. All inputs are 0..1 weights except the angles/speeds.
export function poseRobot(robot, s, dt) {
  const { parts } = robot;
  const ex = s.explode || 0;

  robot.root.position.y = ex * 0.3;
  robot.root.rotation.y = s.yaw || 0;
  const ringMat = parts.bumpers.children[0].material;
  ringMat.opacity = 1 - (s.xray || 0) * 0.82;
  ringMat.depthWrite = (s.xray || 0) < 0.05;

  const lift = s.lift || 0;
  parts.frame.position.y = lift;
  parts.bumpers.position.y = parts.rest.bumpers.y - ex * 0.24 + lift;
  parts.bumpers.scale.setScalar(1 + ex * 0.08);
  parts.electronics.position.y = parts.rest.elec.y + ex * 0.24 + lift;
  parts.modules.forEach((m) => {
    m.group.position.set(m.base.x + m.group.userData.dir.x * ex * 0.2, -ex * 0.12, m.base.z + m.group.userData.dir.z * ex * 0.2);
    m.steer.rotation.y = s.steer || 0;
    m.wheel.rotation.x += (s.wheelSpeed || 0) * dt;
  });

  const el = parts.elevator;
  el.group.position.set(0, ex * 0.5 + lift, -ex * 0.12);
  const e = s.elevator || 0;
  el.stage1.position.y = e * 0.72;
  el.carriage.position.y = e * 0.68;
  el.ee.rotation.x = -0.25 - e * 0.35;
  el.rollers.forEach((r) => { r.rotation.x += (s.eeSpeed || 0) * dt; });
  if (el.drag) el.drag.update(0.24 + el.stage1.position.y);

  const it = parts.intake;
  const deploy = s.intake || 0;
  it.group.rotation.x = -1.25 * (1 - deploy);
  it.group.position.set(0, it.base.y + ex * 0.06 + lift, it.base.z + ex * 0.32);
  it.rollers.forEach((r, i) => { r.rotation.x -= (s.intakeSpeed || 0) * (i ? 1.2 : 1) * dt; });

  const b = s.ball || 0;
  parts.ball.visible = b > 0.001;
  if (parts.ball.visible) {
    const z = 0.76 + (1 - b) * 1.4;
    parts.ball.position.set(0, 0.2, z);
    parts.ball.rotation.x = z / 0.2;
    parts.ball.scale.setScalar(Math.min(1, b * 3));
  }
}
