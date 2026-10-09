// Procedural model of Team 8806's 2025 robot: swerve drivetrain, red bumpers,
// two-stage elevator with a coral end effector, and a compliant-wheel ground intake.
// Built from primitives so it costs no download. Units are metres, +z is the robot's front.
import * as THREE from 'three';

const TAU = Math.PI * 2;
export const FONT_STACK = '"Inter", -apple-system, "SF Pro Display", "Segoe UI", "PingFang TC", "Noto Sans TC", Arial, sans-serif';

function makeMaterials() {
  const std = (o) => new THREE.MeshStandardMaterial(o);
  return {
    alu: std({ color: 0xd5d9e0, metalness: 1, roughness: 0.3 }),
    aluMatte: std({ color: 0xb8bec8, metalness: 0.9, roughness: 0.42 }),
    anodBlack: std({ color: 0x23262d, metalness: 0.65, roughness: 0.38 }),
    anodBlue: std({ color: 0x2f6fe8, metalness: 0.7, roughness: 0.32 }),
    poly: std({ color: 0x15171c, metalness: 0.1, roughness: 0.5 }),
    pan: std({ color: 0x2a2e36, metalness: 0.4, roughness: 0.55 }),
    rubber: std({ color: 0x0f1012, metalness: 0, roughness: 0.92 }),
    motor: std({ color: 0x191b20, metalness: 0.55, roughness: 0.32 }),
    bumper: new THREE.MeshPhysicalMaterial({
      color: 0x8a0f19, metalness: 0, roughness: 0.9, sheen: 0.5, sheenRoughness: 0.7, sheenColor: new THREE.Color(0xff4a4a), transparent: true,
    }),
    green: std({ color: 0x6fe04c, metalness: 0, roughness: 0.48 }),
    pvc: std({ color: 0xf2f1ec, metalness: 0, roughness: 0.42 }),
    ball: std({ color: 0x35c2a6, metalness: 0, roughness: 0.78 }),
    battery: std({ color: 0x1a1a1d, metalness: 0.1, roughness: 0.6 }),
    rio: std({ color: 0x8e96a3, metalness: 0.6, roughness: 0.4 }),
    white: std({ color: 0xf4f5f7, metalness: 0, roughness: 0.5 }),
    wireRed: std({ color: 0xd62a2a, roughness: 0.6 }),
    wireBlack: std({ color: 0x111111, roughness: 0.6 }),
    wireOrange: std({ color: 0xff8a1f, roughness: 0.55 }),
    led: new THREE.MeshStandardMaterial({ color: 0x39ff6a, emissive: 0x39ff6a, emissiveIntensity: 2.2 }),
    lens: std({ color: 0x050608, metalness: 0.9, roughness: 0.08 }),
  };
}

// ---------------------------------------------------------------- helpers

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
}

function cyl(r, h, mat, axis = 'y', seg = 28, x = 0, y = 0, z = 0) {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  if (axis === 'x') g.rotateZ(Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  return m;
}

// A square tube between two points.
function strut(a, b, size, mat) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.BoxGeometry(size, len, size), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function plate(w, h, t, r, mat) {
  const g = new THREE.ExtrudeGeometry(roundedRectShape(w, h, r), { depth: t, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -t / 2);
  return new THREE.Mesh(g, mat);
}

function starWheelGeometry(arms = 9, rOut = 0.05, rIn = 0.017, thick = 0.012) {
  const s = new THREE.Shape();
  const half = (TAU / arms) * 0.16;
  for (let k = 0; k < arms; k++) {
    const a = (k / arms) * TAU;
    const pts = [
      [rIn, a - half * 1.9],
      [rOut * 0.97, a - half * 0.35],
      [rOut, a + half * 0.15],
      [rIn, a + half * 1.9],
    ];
    pts.forEach(([r, ang], i) => {
      const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
      if (k === 0 && i === 0) s.moveTo(x, y); else s.lineTo(x, y);
    });
  }
  s.closePath();
  const hole = new THREE.Path();
  for (let k = 0; k <= 6; k++) {
    const a = (k / 6) * TAU;
    const p = [Math.cos(a) * 0.0065, Math.sin(a) * 0.0065];
    if (k === 0) hole.moveTo(...p); else hole.lineTo(...p);
  }
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelSize: 0.0015, bevelThickness: 0.0015, bevelSegments: 1, curveSegments: 4 });
  g.center();
  g.rotateY(Math.PI / 2); // axis along x
  return g;
}

// A roller of compliant star wheels on a hex shaft, spinning about x.
function starRoller(mats, width, count, rOut) {
  const g = new THREE.Group();
  g.add(cyl(0.0075, width + 0.04, mats.alu, 'x', 6));
  const geo = starWheelGeometry(9, rOut, rOut * 0.34, 0.012);
  const inst = new THREE.InstancedMesh(geo, mats.green, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < count; i++) {
    const x = count === 1 ? 0 : -width / 2 + (i / (count - 1)) * width;
    q.setFromEuler(e.set(i * 0.35, 0, 0));
    m.compose(new THREE.Vector3(x, 0, 0), q, one);
    inst.setMatrixAt(i, m);
  }
  g.add(inst);
  return g;
}

function textTexture(draw, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const redraw = (...args) => { draw(c.getContext('2d'), w, h, ...args); tex.needsUpdate = true; };
  redraw();
  return { tex, redraw };
}

function drawNumber(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${h * 0.86}px ${FONT_STACK}`;
  ctx.fillText('8806', w / 2, h * 0.54);
}

export function drawSponsorPanel(ctx, w, h, name = '', sponsors = []) {
  const r = 34;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f7f8fa';
  const rr = (x, y, rw, rh, rad) => (ctx.roundRect ? ctx.roundRect(x, y, rw, rh, rad) : ctx.rect(x, y, rw, rh));
  ctx.beginPath();
  rr(6, 6, w - 12, h - 12, r);
  ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = '#d6dae2'; ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#7b8494';
  ctx.font = `700 30px ${FONT_STACK}`;
  ctx.fillText('PROUDLY SUPPORTED BY', w / 2, 84);

  const fit = (text, weight, max, size) => {
    let s = size;
    do { ctx.font = `${weight} ${s}px ${FONT_STACK}`; s -= 2; } while (ctx.measureText(text).width > max && s > 14);
  };

  let y = 140;
  if (name) {
    ctx.fillStyle = 'rgba(47,123,255,0.1)';
    ctx.beginPath(); rr(36, 110, w - 72, 124, 22); ctx.fill();
    ctx.fillStyle = '#1f63e0';
    fit(name, 800, w - 110, 76);
    ctx.fillText(name, w / 2, 198);
    y = 290;
  }
  ctx.fillStyle = '#2b303a';
  const list = sponsors.slice(0, name ? 5 : 6);
  const gap = (h - 120 - y) / Math.max(list.length, 1);
  list.forEach((s, i) => {
    fit(s, 700, w - 110, 40);
    ctx.fillText(s, w / 2, y + 30 + i * gap);
  });

  ctx.fillStyle = '#c21d29';
  ctx.font = `800 44px ${FONT_STACK}`;
  ctx.fillText('FRC 8806', w / 2, h - 52);
}

// ---------------------------------------------------------------- build

export function buildRobot({ sponsors = [] } = {}) {
  const mats = makeMaterials();
  const root = new THREE.Group();
  const body = new THREE.Group();       // everything except the parts that animate separately
  root.add(body);

  const parts = {};
  const anchors = {};
  const anchor = (name, parent, x, y, z) => {
    const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); anchors[name] = o; return o;
  };

  // ---------------- frame + belly pan
  const frame = new THREE.Group();
  const F = 0.70, T = 0.025, TH = 0.05, FY = 0.085;
  frame.add(box(F, TH, T, mats.aluMatte, 0, FY, F / 2 - T / 2));
  frame.add(box(F, TH, T, mats.aluMatte, 0, FY, -F / 2 + T / 2));
  frame.add(box(T, TH, F - 2 * T, mats.aluMatte, F / 2 - T / 2, FY, 0));
  frame.add(box(T, TH, F - 2 * T, mats.aluMatte, -F / 2 + T / 2, FY, 0));
  frame.add(box(F - 2 * T, TH, T, mats.aluMatte, 0, FY, 0.17));
  frame.add(box(F - 2 * T, TH, T, mats.aluMatte, 0, FY, -0.2));
  frame.add(box(F - 0.04, 0.005, F - 0.04, mats.pan, 0, 0.0625, 0));
  body.add(frame);
  parts.frame = frame;

  // ---------------- swerve modules
  parts.modules = [];
  const corners = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  corners.forEach(([sx, sz], i) => {
    const mod = new THREE.Group();
    const px = sx * 0.268, pz = sz * 0.268;
    mod.position.set(px, 0, pz);
    mod.userData.dir = new THREE.Vector3(sx, 0, sz).normalize();

    const top = plate(0.13, 0.13, 0.006, 0.018, mats.alu);
    top.rotation.x = -Math.PI / 2; top.position.y = 0.113;
    mod.add(top);
    const drive = new THREE.Group();
    drive.add(cyl(0.03, 0.062, mats.motor, 'y', 28, 0, 0.148, 0.024));
    drive.add(cyl(0.031, 0.008, mats.anodBlue, 'y', 28, 0, 0.176, 0.024));
    drive.add(cyl(0.022, 0.006, mats.alu, 'y', 24, 0, 0.183, 0.024));
    const steerMotor = new THREE.Group();
    steerMotor.add(cyl(0.026, 0.05, mats.motor, 'y', 28, 0, 0.142, -0.03));
    steerMotor.add(cyl(0.027, 0.007, mats.anodBlue, 'y', 28, 0, 0.165, -0.03));
    mod.add(drive, steerMotor);

    const steer = new THREE.Group();
    steer.add(box(0.006, 0.075, 0.085, mats.anodBlack, 0.032, 0.072, 0));
    steer.add(box(0.006, 0.075, 0.085, mats.anodBlack, -0.032, 0.072, 0));
    steer.add(box(0.07, 0.008, 0.07, mats.anodBlack, 0, 0.106, 0));
    const wheel = new THREE.Group();
    wheel.position.y = 0.0508;
    wheel.add(cyl(0.0508, 0.038, mats.rubber, 'x', 36));
    wheel.add(cyl(0.036, 0.041, mats.anodBlue, 'x', 28));
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * TAU;
      wheel.add(box(0.044, 0.008, 0.008, mats.alu, 0, Math.cos(a) * 0.022, Math.sin(a) * 0.022));
    }
    steer.add(wheel);
    mod.add(steer);
    body.add(mod);
    parts.modules.push({ group: mod, steer, wheel, base: mod.position.clone() });
    if (i === 3) anchor('x60', mod, 0, 0.19, 0.024);
    if (i === 1) anchor('swerve', mod, 0.0, 0.05, 0.06);
  });

  // ---------------- bumpers
  const bumpers = new THREE.Group();
  const outer = roundedRectShape(0.86, 0.86, 0.06);
  const hole = new THREE.Path();
  const hi = 0.355;
  hole.moveTo(-hi, -hi); hole.lineTo(-hi, hi); hole.lineTo(hi, hi); hole.lineTo(hi, -hi); hole.lineTo(-hi, -hi);
  outer.holes.push(hole);
  const bg = new THREE.ExtrudeGeometry(outer, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.016, bevelSize: 0.016, bevelSegments: 5, curveSegments: 10 });
  bg.rotateX(-Math.PI / 2);
  const ring = new THREE.Mesh(bg, mats.bumper);
  ring.position.y = 0.032;
  bumpers.add(ring);
  const num = textTexture(drawNumber, 512, 128);
  const numMat = new THREE.MeshStandardMaterial({ map: num.tex, transparent: true, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 });
  const numGeo = new THREE.PlaneGeometry(0.34, 0.085);
  const faceY = 0.032 + 0.045, faceD = 0.43 + 0.017;
  [[0, faceD, 0], [0, -faceD, Math.PI], [faceD, 0, Math.PI / 2], [-faceD, 0, -Math.PI / 2]].forEach(([x, z, ry]) => {
    const n = new THREE.Mesh(numGeo, numMat);
    n.position.set(x, faceY, z); n.rotation.y = ry;
    bumpers.add(n);
  });
  body.add(bumpers);
  parts.bumpers = bumpers;
  parts.redrawNumbers = num.redraw;
  anchor('bumpers', bumpers, 0.3, 0.08, 0.45);

  // ---------------- electronics
  const elec = new THREE.Group();
  elec.add(box(0.18, 0.165, 0.075, mats.battery, 0.0, 0.065 + 0.0825, -0.29));
  elec.add(box(0.03, 0.02, 0.03, mats.wireRed, 0.05, 0.24, -0.29));
  elec.add(box(0.03, 0.02, 0.03, mats.wireBlack, -0.05, 0.24, -0.29));
  const rio = new THREE.Group();
  rio.add(box(0.145, 0.032, 0.095, mats.rio, 0, 0, 0));
  rio.add(box(0.13, 0.004, 0.08, mats.anodBlack, 0, 0.018, 0));
  rio.add(box(0.03, 0.006, 0.012, mats.anodBlue, 0.04, 0.022, 0.025));
  rio.position.set(-0.15, 0.082, 0.07);
  elec.add(rio);
  const pdh = new THREE.Group();
  pdh.add(box(0.17, 0.04, 0.11, mats.anodBlack, 0, 0, 0));
  const fuseCols = [0xff3b30, 0xffcc00, 0x34c759, 0x2f7bff, 0xff3b30, 0xffcc00, 0x34c759, 0x2f7bff, 0xff9500, 0xff3b30];
  fuseCols.forEach((c, k) => {
    pdh.add(box(0.011, 0.012, 0.024, new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }), -0.075 + k * 0.0165, 0.026, 0.02));
  });
  pdh.position.set(0.15, 0.085, 0.07);
  elec.add(pdh);
  elec.add(box(0.1, 0.028, 0.07, mats.white, 0.0, 0.08, 0.27));
  // wiring
  const wire = (pts, mat, r = 0.0045) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    elec.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, r, 6, false), mat));
  };
  wire([[0.15, 0.1, 0.12], [0.2, 0.09, 0.2], [0.25, 0.13, 0.25]], mats.wireRed);
  wire([[0.13, 0.1, 0.12], [0.18, 0.09, 0.21], [0.23, 0.13, 0.26]], mats.wireBlack);
  wire([[0.15, 0.1, 0.02], [0.2, 0.09, -0.12], [0.25, 0.13, -0.24]], mats.wireRed);
  wire([[0.13, 0.1, 0.02], [0.18, 0.09, -0.12], [0.23, 0.13, -0.25]], mats.wireBlack);
  wire([[-0.15, 0.1, 0.12], [-0.08, 0.09, 0.22], [0.0, 0.095, 0.26]], mats.anodBlue, 0.004);
  wire([[0.05, 0.25, -0.29], [0.12, 0.2, -0.15], [0.15, 0.1, 0.03]], mats.wireRed, 0.007);
  wire([[-0.05, 0.25, -0.29], [-0.1, 0.18, -0.1], [0.12, 0.1, 0.05]], mats.wireBlack, 0.007);
  wire([[-0.15, 0.1, 0.02], [-0.2, 0.09, -0.1], [-0.24, 0.13, -0.24]], mats.wireOrange, 0.0035);
  wire([[-0.16, 0.1, 0.12], [-0.21, 0.09, 0.2], [-0.25, 0.13, 0.25]], mats.wireOrange, 0.0035);
  body.add(elec);
  parts.electronics = elec;
  anchor('rio', rio, 0, 0.03, 0);
  anchor('pdh', pdh, 0, 0.04, 0);

  // ---------------- elevator
  const elevator = new THREE.Group();
  const EZ = -0.1, EX = 0.17, H0 = 1.0;
  const stage0 = new THREE.Group();
  stage0.add(box(0.025, H0, 0.05, mats.alu, EX, 0.11 + H0 / 2, EZ));
  stage0.add(box(0.025, H0, 0.05, mats.alu, -EX, 0.11 + H0 / 2, EZ));
  stage0.add(box(2 * EX + 0.025, 0.04, 0.05, mats.alu, 0, 0.11 + H0 - 0.02, EZ));
  stage0.add(box(2 * EX + 0.025, 0.04, 0.05, mats.alu, 0, 0.14, EZ));
  [[EX, 1], [-EX, -1]].forEach(([x, s]) => {
    stage0.add(strut(new THREE.Vector3(x, 0.92, EZ - 0.03), new THREE.Vector3(x, 0.12, -0.33), 0.025, mats.aluMatte));
    const g = plate(0.09, 0.09, 0.004, 0.01, mats.anodBlack);
    g.rotation.y = Math.PI / 2; g.position.set(x + s * 0.0145, 0.16, EZ);
    stage0.add(g);
    const g2 = plate(0.09, 0.07, 0.004, 0.01, mats.anodBlack);
    g2.rotation.y = Math.PI / 2; g2.position.set(x + s * 0.0145, 0.11 + H0 - 0.04, EZ);
    stage0.add(g2);
    stage0.add(box(0.006, H0 - 0.1, 0.012, mats.anodBlack, x - s * 0.018, 0.11 + H0 / 2, EZ + 0.012));
  });
  // vision camera on the top crossbar
  const cam = new THREE.Group();
  cam.add(box(0.085, 0.055, 0.035, mats.anodBlack));
  cam.add(cyl(0.012, 0.008, mats.lens, 'z', 20, 0, 0.004, 0.019));
  [-0.026, 0.026].forEach((x) => [-0.015, 0.015].forEach((y) => cam.add(box(0.012, 0.006, 0.004, mats.led, x, y + 0.004, 0.019))));
  cam.position.set(0, 0.11 + H0 + 0.028, EZ + 0.01);
  stage0.add(cam);
  elevator.add(stage0);
  anchor('camera', cam, 0, 0.03, 0.02);
  anchor('elevator', stage0, -EX, 0.75, EZ);

  // optional sponsor panel on the left side of the tower
  const panel = textTexture((ctx, w, h, name) => drawSponsorPanel(ctx, w, h, name, sponsors), 600, 800);
  const panelMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.33, 0.44), new THREE.MeshStandardMaterial({ map: panel.tex, transparent: true, roughness: 0.45, metalness: 0 }));
  panelMesh.rotation.y = -Math.PI / 2;
  panelMesh.position.set(-EX - 0.016, 0.55, EZ - 0.08);
  stage0.add(panelMesh);
  parts.setSponsorName = (name) => panel.redraw(name);

  const stage1 = new THREE.Group();
  const H1 = 0.95, X1 = 0.135, Z1 = EZ + 0.032;
  stage1.add(box(0.022, H1, 0.022, mats.anodBlack, X1, 0.13 + H1 / 2, Z1));
  stage1.add(box(0.022, H1, 0.022, mats.anodBlack, -X1, 0.13 + H1 / 2, Z1));
  stage1.add(box(2 * X1 + 0.022, 0.03, 0.022, mats.anodBlack, 0, 0.13 + H1 - 0.015, Z1));
  stage1.add(box(2 * X1 + 0.022, 0.03, 0.022, mats.anodBlack, 0, 0.15, Z1));
  elevator.add(stage1);

  const carriage = new THREE.Group();
  const cplate = plate(0.25, 0.17, 0.008, 0.02, mats.alu);
  cplate.position.set(0, 0.26, Z1 + 0.02);
  carriage.add(cplate);
  // end effector: pivoting box with small star rollers holding a PVC "coral"
  const ee = new THREE.Group();
  ee.position.set(0, 0.3, Z1 + 0.03);
  [0.1, -0.1].forEach((x) => {
    const sp = plate(0.2, 0.12, 0.006, 0.02, mats.poly);
    sp.rotation.y = Math.PI / 2; sp.position.set(x, 0, 0.1);
    ee.add(sp);
  });
  const r1 = starRoller(mats, 0.17, 4, 0.032); r1.position.set(0, 0.045, 0.16); ee.add(r1);
  const r2 = starRoller(mats, 0.17, 4, 0.032); r2.position.set(0, -0.045, 0.16); ee.add(r2);
  const coral = cyl(0.056, 0.3, mats.pvc, 'x', 32, 0, 0, 0.15);
  ee.add(coral);
  ee.add(cyl(0.022, 0.05, mats.motor, 'x', 24, 0.13, 0.03, 0.04));
  ee.rotation.x = -0.25;
  carriage.add(ee);
  stage1.add(carriage);
  body.add(elevator);
  parts.elevator = { group: elevator, stage1, carriage, ee, rollers: [r1, r2], coral };

  // ---------------- ground intake
  const intake = new THREE.Group();
  intake.position.set(0, 0.2, 0.25);
  [0.3, -0.3].forEach((x) => {
    const sp = new THREE.Shape();
    sp.moveTo(-0.035, 0.03); sp.lineTo(0.27, -0.06); sp.quadraticCurveTo(0.32, -0.1, 0.29, -0.15);
    sp.lineTo(0.18, -0.16); sp.lineTo(-0.035, -0.035); sp.quadraticCurveTo(-0.06, 0, -0.035, 0.03);
    const g = new THREE.ExtrudeGeometry(sp, { depth: 0.008, bevelEnabled: false, curveSegments: 8 });
    g.translate(0, 0, -0.004);
    g.rotateY(-Math.PI / 2);
    const m = new THREE.Mesh(g, mats.poly);
    m.position.x = x;
    intake.add(m);
  });
  intake.add(cyl(0.011, 0.62, mats.alu, 'x', 6));
  intake.add(box(0.6, 0.025, 0.025, mats.aluMatte, 0, -0.06, 0.16));
  const ir1 = starRoller(mats, 0.52, 9, 0.052); ir1.position.set(0, -0.115, 0.27); intake.add(ir1);
  const ir2 = starRoller(mats, 0.52, 8, 0.042); ir2.position.set(0, -0.03, 0.2); intake.add(ir2);
  const x44 = new THREE.Group();
  x44.add(cyl(0.026, 0.055, mats.motor, 'x', 28));
  x44.add(cyl(0.027, 0.007, mats.anodBlue, 'x', 28, -0.03, 0, 0));
  x44.position.set(0.34, -0.06, 0.18);
  intake.add(x44);
  body.add(intake);
  parts.intake = { group: intake, rollers: [ir1, ir2], base: intake.position.clone() };
  anchor('x44', x44, 0.02, 0.03, 0);
  anchor('intake', ir1, -0.12, 0.05, 0.04);

  // ---------------- game piece (algae), shown during the intake chapter
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 48, 32), mats.ball);
  ball.visible = false;
  root.add(ball);
  parts.ball = ball;

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
  parts.bumpers.children[0].material.opacity = 1 - (s.xray || 0) * 0.82;
  parts.bumpers.children[0].material.depthWrite = (s.xray || 0) < 0.05;

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
