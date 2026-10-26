// 8806 merch studio: every product drawn as a lit studio mockup on a 1600×1600 transparent canvas
// (studio.html renders one; render.cjs renders them all into assets/img/shop). The prints use the team's
// own marks: the crest (logo-640.webp), the white scorpion mark (mark-white.webp, tinted through a mask)
// and the robot's hidden-line drawing (robot-lines.webp, rendered from the site's 3D model by lines.html).
let uid = 0;
const id = (p) => `${p}${++uid}`;
const A = '../../assets/img/';

const NAVY = '#1b2a5c', BLUE = '#2a6df4', BLUE_T = '#7aaaff';
const F = "Geist, system-ui, sans-serif", M = "'Geist Mono', ui-monospace, monospace";

// The crest mark (white on transparent) tinted any colour through a luminance mask.
function mark(x, y, s, fill, extra = '') {
  const m = id('mk');
  return `<mask id="${m}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${s}" height="${s}"><image href="${A}mark-white.webp" x="${x}" y="${y}" width="${s}" height="${s}"/></mask>
  <rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${fill}" mask="url(#${m})" ${extra}/>`;
}
// The robot's hidden-line drawing (robot-lines.webp: white lines on transparent, 1488×1742), tinted any
// colour, fitted into the box x, y, w, h (h defaults to the drawing's own proportions).
const LR = 1742 / 1488;
function lines(fill, x, y, w, h = w * LR) {
  const m = id('ln');
  return `<mask id="${m}" maskUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}"><image href="robot-lines.webp" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/></mask>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" mask="url(#${m})"/>`;
}

// Fabric: a silhouette filled, shaded, seamed and textured.
function fabric({ path, base, folds = '', seams = '', stitches = '', print = '', dark = false, rim = true, shadow = true }) {
  const clip = id('cl'), noise = id('nz'), blur = id('bl'), sh = id('sh'), soft = id('sf');
  const st = dark ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.2)';
  return `
  <defs>
    <clipPath id="${clip}"><path d="${path}"/></clipPath>
    <filter id="${noise}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix type="saturate" values="0"/></filter>
    <filter id="${blur}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="${soft}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
    <filter id="${sh}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="26"/></filter>
  </defs>
  ${shadow ? `<path d="${path}" fill="#000" opacity=".55" filter="url(#${sh})" transform="translate(0 26)"/>` : ''}
  <path d="${path}" fill="${base}"/>
  <g clip-path="url(#${clip})">
    <rect x="-200" y="-200" width="1600" height="1600" fill="url(#topLight)"/>
    <g filter="url(#${blur})">${folds}</g>
    ${print}
    <g fill="none" stroke-linecap="round">${seams}</g>
    <g fill="none" stroke="${st}" stroke-width="2.2" stroke-dasharray="7 6">${stitches}</g>
    <rect x="-200" y="-200" width="1600" height="1600" filter="url(#${noise})" opacity="${dark ? 0.16 : 0.12}" style="mix-blend-mode:overlay"/>
    <path d="${path}" fill="none" stroke="#000" stroke-opacity="${dark ? 0.55 : 0.16}" stroke-width="22" filter="url(#${soft})"/>
    ${rim ? `<path d="${path}" fill="none" stroke="#fff" stroke-opacity="${dark ? 0.07 : 0}" stroke-width="4" filter="url(#${soft})"/>` : ''}
  </g>`;
}

const svg = (body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600" width="1600" height="1600">
  <defs>
    <linearGradient id="topLight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f6f9"/><stop offset=".35" stop-color="#a7adb7"/><stop offset=".55" stop-color="#eef1f5"/><stop offset="1" stop-color="#737985"/></linearGradient>
    <filter id="drop" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#000" flood-opacity=".55"/></filter>
    <filter id="dropS" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".5"/></filter>
    ${defs}
  </defs>${body}</svg>`;

// Ink on fabric: slightly worn into the weave.
const ink = (inner, op = 0.94) => { const f = id('ik'); return `<filter id="${f}"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2"/></filter><g filter="url(#${f})" opacity="${op}">${inner}</g>`; };
// Embroidery: raised thread with a soft shadow and a sheen.
const embroider = (inner) => { const f = id('em'); return `<filter id="${f}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="turbulence" baseFrequency="0.9 0.08" numOctaves="1" seed="5" result="t"/><feColorMatrix in="t" type="saturate" values="0" result="tg"/><feComposite in="tg" in2="SourceAlpha" operator="in" result="tex"/><feBlend in="SourceGraphic" in2="tex" mode="multiply" result="th"/><feDropShadow in="th" dx="0" dy="2.5" stdDeviation="1.6" flood-color="#000" flood-opacity=".7"/></filter><g filter="url(#${f})">${inner}</g>`; };

// ------------------------------------------------------------------ tee

const TEE = 'M410,60 Q500,82 590,60 L768,108 Q872,160 935,330 L820,415 Q782,372 742,352 C735,600 745,850 752,1050 Q500,1068 248,1050 C255,850 265,600 258,352 Q218,372 180,415 L65,330 Q128,160 232,108 Z';
const TEE_HOLE = 'M410,60 Q500,82 590,60 C570,138 532,160 500,161 C468,160 430,138 410,60 Z';
const TEE_RIB = 'M398,56 C420,160 466,190 500,191 C534,190 580,160 602,56 L590,60 C570,138 532,160 500,161 C468,160 430,138 410,60 Z';
const TEE_RIB_BACK = 'M410,60 Q500,82 590,60 L594,72 Q500,98 406,72 Z';

function tee({ base, dark, print, back }) {
  const folds = `
    <ellipse cx="500" cy="470" rx="150" ry="330" fill="#fff" opacity="${dark ? 0.03 : 0.35}"/>
    <path d="M318,640 C330,820 330,940 322,1046" stroke="#000" stroke-width="46" opacity="${dark ? 0.45 : 0.08}" fill="none"/>
    <path d="M680,600 C668,780 676,930 690,1046" stroke="#000" stroke-width="40" opacity="${dark ? 0.4 : 0.07}" fill="none"/>
    <path d="M380,900 C460,880 560,920 640,896" stroke="#fff" stroke-width="22" opacity="${dark ? 0.025 : 0.3}" fill="none"/>
    <path d="M258,352 Q270,230 232,108" stroke="#000" stroke-width="42" opacity="${dark ? 0.55 : 0.1}" fill="none"/>
    <path d="M742,352 Q730,230 768,108" stroke="#000" stroke-width="42" opacity="${dark ? 0.55 : 0.1}" fill="none"/>
    <path d="M120,300 Q160,220 232,150" stroke="#fff" stroke-width="40" opacity="${dark ? 0.05 : 0.35}" fill="none"/>`;
  const seamC = dark ? 'rgba(0,0,0,.6)' : 'rgba(0,0,0,.16)', hiC = dark ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.7)';
  const seams = `
    <path d="M232,108 Q270,230 258,352" stroke="${seamC}" stroke-width="3"/><path d="M234,112 Q273,230 262,350" stroke="${hiC}" stroke-width="1.5"/>
    <path d="M768,108 Q730,230 742,352" stroke="${seamC}" stroke-width="3"/><path d="M766,112 Q727,230 738,350" stroke="${hiC}" stroke-width="1.5"/>`;
  const stitches = `
    <path d="M250,1026 Q500,1044 750,1026"/>
    <path d="M78,312 L193,397"/><path d="M922,312 L807,397"/>
    ${back ? '' : '<path d="M402,64 C424,170 468,200 500,201 C532,200 576,170 598,64"/>'}`;
  const collar = back
    ? `<path d="${TEE_RIB_BACK}" fill="${base}"/><path d="${TEE_RIB_BACK}" fill="#000" opacity="${dark ? 0.25 : 0.06}"/>
       <g stroke="#000" stroke-opacity="${dark ? 0.35 : 0.08}" stroke-width="1.2">${Array.from({ length: 30 }, (_, i) => `<line x1="${414 + i * 6}" y1="${64 + Math.sin((i / 29) * Math.PI) * 18}" x2="${414 + i * 6}" y2="${76 + Math.sin((i / 29) * Math.PI) * 18}"/>`).join('')}</g>`
    : `<path d="${TEE_HOLE}" fill="${dark ? '#050506' : '#c9c7c1'}"/>
       <path d="M410,60 Q500,82 590,60 L586,74 Q500,96 414,74 Z" fill="${dark ? '#1b1c20' : '#e2e0da'}"/>
       <rect x="470" y="80" width="60" height="26" rx="3" fill="${BLUE}" opacity=".92"/>
       <text x="500" y="98" text-anchor="middle" font-family="${M}" font-size="12" font-weight="700" fill="#fff">8806</text>
       <path d="${TEE_RIB}" fill="${base}"/><path d="${TEE_RIB}" fill="#000" opacity="${dark ? 0.18 : 0.05}"/>`;
  return `<g transform="translate(225 205) scale(1.15)">
    ${fabric({ path: TEE, base, folds, seams, stitches, dark, print: print + collar })}
  </g>`;
}

function scorpionFront(dark) {
  const c = dark ? '#f2f3f5' : NAVY;
  return ink(`${mark(604, 252, 112, c)}<text x="660" y="394" text-anchor="middle" font-family="${F}" font-weight="800" font-size="32" letter-spacing="-1" fill="${c}">8806</text>`);
}
function scorpionBack(dark) {
  const c = dark ? '#f2f3f5' : NAVY, a = dark ? BLUE_T : BLUE, d = dark ? 'rgba(255,255,255,.55)' : 'rgba(27,42,92,.62)';
  return ink(`
    <text x="500" y="214" text-anchor="middle" font-family="${M}" font-weight="600" font-size="17" letter-spacing="6" fill="${d}">FRC TEAM · NEW TAIPEI CITY</text>
    ${mark(355, 232, 290, c)}
    <text x="500" y="676" text-anchor="middle" font-family="${F}" font-weight="800" font-size="150" letter-spacing="-7" fill="${c}">8806</text>
    <g stroke="${a}" stroke-width="2" fill="${a}">
      <line x1="352" y1="708" x2="648" y2="708"/><line x1="352" y1="698" x2="352" y2="718"/><line x1="648" y1="698" x2="648" y2="718"/>
      <path d="M352,708 l12,-4.5 v9 z"/><path d="M648,708 l-12,-4.5 v9 z"/>
    </g>
    <rect x="426" y="696" width="148" height="24" fill="${dark ? '#141518' : '#efeeea'}"/>
    <text x="500" y="714" text-anchor="middle" font-family="${M}" font-weight="700" font-size="14" letter-spacing="2" fill="${a}">45 STUDENTS</text>
    <text x="500" y="760" text-anchor="middle" font-family="${M}" font-weight="600" font-size="16" letter-spacing="6" fill="${c}">ALWAYS READY TO STRIKE</text>
    <g stroke="${d}" stroke-width="1.5" fill="none"><path d="M436,305 L368,262 H282"/><circle cx="436" cy="305" r="5" fill="${a}" stroke="none"/></g>
    <text x="282" y="253" font-family="${M}" font-weight="600" font-size="12" letter-spacing="2" fill="${d}">01 · GEAR, NOT CLAWS</text>`);
}

// Blueprint tee: the robot's own CAD edges in a drawing frame with a title block.
function drawingFrame({ X, Y, W, H, w, d, fill, titleW = 200 }) {
  const ticks = [1, 2, 3].map((i) => `<line x1="${X + (W / 4) * i}" y1="${Y}" x2="${X + (W / 4) * i}" y2="${Y + 10}"/><line x1="${X + (W / 4) * i}" y1="${Y + H}" x2="${X + (W / 4) * i}" y2="${Y + H - 10}"/>`).join('')
    + [1, 2, 3, 4].map((i) => `<line x1="${X}" y1="${Y + (H / 5) * i}" x2="${X + 10}" y2="${Y + (H / 5) * i}"/><line x1="${X + W}" y1="${Y + (H / 5) * i}" x2="${X + W - 10}" y2="${Y + (H / 5) * i}"/>`).join('');
  const zones = ['A', 'B', 'C', 'D'].map((l, i) => `<text x="${X + (W / 4) * (i + 0.5)}" y="${Y - 8}" text-anchor="middle">${l}</text>`).join('')
    + [1, 2, 3, 4, 5].map((n, i) => `<text x="${X - 14}" y="${Y + (H / 5) * (i + 0.5) + 4}" text-anchor="middle">${n}</text>`).join('');
  const k = titleW / 200;
  return `
    <g stroke="${w}" fill="none"><rect x="${X}" y="${Y}" width="${W}" height="${H}" stroke-width="3"/><rect x="${X + 14}" y="${Y + 14}" width="${W - 28}" height="${H - 28}" stroke-width="1.2" stroke="${d}"/>${ticks}</g>
    <g font-family="${M}" font-size="12" font-weight="600" fill="${d}">${zones}</g>
    ${lines(w, X + 40, Y + 26, W - 110, H - 120)}
    <g transform="translate(${X + W - 14 - titleW} ${Y + H - 14 - 78 * k}) scale(${k})">
      <rect width="200" height="78" fill="${fill}" stroke="${w}" stroke-width="1.5"/>
      <g stroke="${d}" stroke-width="1"><line x1="0" y1="30" x2="200" y2="30"/><line x1="0" y1="54" x2="200" y2="54"/><line x1="100" y1="30" x2="100" y2="78"/></g>
      <text x="9" y="21" font-family="${F}" font-weight="800" font-size="16" fill="${w}">FRC 8806 · OLPDL</text>
      <g font-family="${M}" font-size="9.5" font-weight="600" fill="${d}" letter-spacing="1">
        <text x="9" y="46">DWG 8806-001</text><text x="109" y="46">SCALE 1:8</text>
        <text x="9" y="70">BY STUDENTS</text><text x="109" y="70">SHEET 1/1</text>
      </g>
    </g>`;
}
function blueprintFront() {
  const w = 'rgba(255,255,255,.92)', d = 'rgba(255,255,255,.6)';
  return ink(drawingFrame({ X: 300, Y: 236, W: 400, H: 500, w, d, fill: '#20347a' })
    + `<text x="300" y="766" font-family="${M}" font-size="13" font-weight="600" letter-spacing="3.5" fill="${d}">FIG. 1 — OUR ROBOT, IN LINES</text>`);
}
function blueprintBack() {
  return ink(`<text x="500" y="170" text-anchor="middle" font-family="${F}" font-weight="800" font-size="40" letter-spacing="-1" fill="rgba(255,255,255,.92)">8806</text>
    <text x="500" y="198" text-anchor="middle" font-family="${M}" font-weight="600" font-size="12" letter-spacing="5" fill="rgba(255,255,255,.6)">DESIGNED IN NEW TAIPEI CITY</text>`);
}

// ------------------------------------------------------------------ hoodie (black, cobalt hood lining)

const HOOD_BODY = 'M500,0 C590,0 668,40 676,150 L785,215 C862,330 890,600 895,870 L898,950 L788,958 L786,885 C760,700 730,500 710,420 L702,960 L704,1050 L296,1050 L298,960 L290,420 C270,500 240,700 214,885 L212,958 L102,950 L105,870 C110,600 138,330 215,215 L324,150 C332,40 410,0 500,0 Z';
const HOOD_OPEN = 'M395,175 C392,80 448,44 500,44 C552,44 608,80 605,175 C585,262 415,262 395,175 Z';
const HOOD_BACK = 'M330,150 C318,330 400,410 500,410 C600,410 682,330 670,150 C660,40 580,4 500,4 C420,4 340,40 330,150 Z';

function hoodie(view) {
  const base = '#131417', back = view === 'back';
  const folds = `
    <ellipse cx="500" cy="560" rx="160" ry="300" fill="#fff" opacity=".028"/>
    <path d="M150,300 C130,500 128,700 140,880" stroke="#fff" stroke-width="30" opacity=".035" fill="none"/>
    <path d="M860,300 C880,500 882,700 870,880" stroke="#000" stroke-width="44" opacity=".5" fill="none"/>
    <path d="M290,420 C270,560 250,720 220,880" stroke="#000" stroke-width="50" opacity=".55" fill="none"/>
    <path d="M710,420 C730,560 750,720 780,880" stroke="#000" stroke-width="50" opacity=".55" fill="none"/>
    <path d="M330,560 C340,700 330,860 340,950" stroke="#000" stroke-width="40" opacity=".35" fill="none"/>
    <path d="M670,560 C660,700 668,860 660,950" stroke="#000" stroke-width="40" opacity=".35" fill="none"/>`;
  const rib = (x1, y1, x2, y2, h) => `<g stroke="#000" stroke-opacity=".38" stroke-width="1.4">${Array.from({ length: Math.round(Math.abs(x2 - x1) / 7) }, (_, i) => { const x = x1 + ((x2 - x1) * i) / Math.round(Math.abs(x2 - x1) / 7); const y = y1 + ((y2 - y1) * i) / Math.round(Math.abs(x2 - x1) / 7); return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}"/>`; }).join('')}</g>`;
  const seams = `
    <path d="M298,960 L702,960" stroke="rgba(0,0,0,.7)" stroke-width="3"/>
    <path d="M105,870 L895,870" stroke="none"/>
    <path d="M105,872 L214,885" stroke="rgba(0,0,0,.7)" stroke-width="3"/><path d="M895,872 L786,885" stroke="rgba(0,0,0,.7)" stroke-width="3"/>
    <path d="M215,215 Q300,320 290,420" stroke="rgba(0,0,0,.6)" stroke-width="3"/><path d="M785,215 Q700,320 710,420" stroke="rgba(0,0,0,.6)" stroke-width="3"/>`;
  const stitches = back ? '' : `
    <path d="M344,712 L656,712"/><path d="M344,712 C330,790 316,860 306,920"/><path d="M656,712 C670,790 684,860 694,920"/>`;
  let print;
  if (back) {
    print = `
      <path d="${HOOD_BACK}" fill="${base}"/>
      <path d="${HOOD_BACK}" fill="url(#hoodShade)"/>
      <path d="M500,10 C506,140 506,300 500,408" stroke="rgba(0,0,0,.7)" stroke-width="3" fill="none"/>
      <path d="${HOOD_BACK}" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="10" filter="url(#dropS)"/>
      ${ink(`<text x="500" y="500" text-anchor="middle" font-family="${M}" font-weight="600" font-size="20" letter-spacing="8" fill="rgba(255,255,255,.62)">FRC TEAM 8806</text>
        ${mark(360, 520, 280, '#f2f3f5')}
        <text x="500" y="846" text-anchor="middle" font-family="${M}" font-weight="600" font-size="14" letter-spacing="2.5" fill="#f2f3f5">DREAM BIG, AND NEVER GIVE UP.</text>`)}`;
  } else {
    print = `
      <path d="${HOOD_OPEN}" fill="url(#lining)"/>
      <path d="${HOOD_OPEN}" fill="none" stroke="${base}" stroke-width="26"/>
      <path d="${HOOD_OPEN}" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="3" transform="translate(0 2)"/>
      <path d="M395,175 C415,262 585,262 605,175" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="2"/>
      ${ink(`<text x="500" y="604" text-anchor="middle" font-family="${F}" font-weight="800" font-size="104" letter-spacing="-5" fill="#f2f3f5">8806</text>
        <text x="500" y="640" text-anchor="middle" font-family="${M}" font-weight="600" font-size="16" letter-spacing="6" fill="${BLUE_T}">OLPDL · PIT CREW</text>
        <text transform="translate(170 360) rotate(84)" font-family="${M}" font-weight="600" font-size="15" letter-spacing="5" fill="rgba(255,255,255,.7)">DREAM BIG, AND NEVER GIVE UP.</text>`)}
      <g stroke="#e9eaee" stroke-width="7" fill="none" stroke-linecap="round" filter="url(#dropS)"><path d="M462,240 C458,320 466,400 458,500"/><path d="M538,240 C544,320 534,400 544,486"/></g>
      <g fill="#9aa0aa"><rect x="452" y="498" width="12" height="30" rx="3"/><rect x="538" y="484" width="12" height="30" rx="3"/></g>
      <path d="M340,700 L660,700 C676,780 690,860 700,930 L300,930 C310,860 324,780 340,700 Z" fill="#000" opacity=".2"/>
      <path d="M340,700 L660,700 C676,780 690,860 700,930 M300,930 C310,860 324,780 340,700" fill="none" stroke="rgba(0,0,0,.7)" stroke-width="3"/>
      <path d="M343,704 L657,704" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="2"/>`;
  }
  const defs = `<linearGradient id="lining" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1736"/><stop offset=".6" stop-color="#18357f"/><stop offset="1" stop-color="#1f45a3"/></linearGradient>
    <radialGradient id="hoodShade" cx=".45" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>`;
  return { defs, body: `<g transform="translate(240 230) scale(1.12)">${fabric({ path: HOOD_BODY, base, folds, seams: seams + rib(300, 966, 700, 966, 82) + rib(106, 878, 212, 892, 70) + rib(788, 892, 896, 878, 70), stitches, print, dark: true })}</g>` };
}

// ------------------------------------------------------------------ cap

function cap() {
  const base = '#141519';
  const crown = 'M170,560 C150,330 300,140 520,130 C730,122 870,300 860,540 C700,600 330,610 170,560 Z';
  const brim = 'M188,548 C330,610 700,604 862,532 C915,600 892,688 772,722 C590,770 360,764 246,716 C162,682 140,600 188,548 Z';
  const c = id('cc'), b = id('bc');
  return `<defs>
      <clipPath id="${c}"><path d="${crown}"/></clipPath><clipPath id="${b}"><path d="${brim}"/></clipPath>
      <radialGradient id="capLight" cx=".34" cy=".26" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
      <linearGradient id="brimLight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
      <filter id="capBlur"><feGaussianBlur stdDeviation="30"/></filter>
      <filter id="capNoise" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="2"/><feColorMatrix type="saturate" values="0"/></filter>
    </defs>
    <g transform="translate(300 380)">
      <ellipse cx="520" cy="740" rx="380" ry="60" fill="#000" opacity=".6" filter="url(#capBlur)"/>
      <path d="${crown}" fill="${base}"/>
      <g clip-path="url(#${c})">
        <rect width="1000" height="800" fill="url(#capLight)"/>
        <g fill="none" stroke-linecap="round">
          <path d="M515,134 C380,200 300,380 292,566" stroke="rgba(0,0,0,.7)" stroke-width="3.5"/><path d="M518,136 C385,204 306,382 298,568" stroke="rgba(255,255,255,.06)" stroke-width="1.5"/>
          <path d="M515,134 C700,200 790,380 800,552" stroke="rgba(0,0,0,.7)" stroke-width="3.5"/>
          <path d="M515,134 C560,300 548,450 540,600" stroke="rgba(0,0,0,.6)" stroke-width="3"/>
          <g stroke="rgba(255,255,255,.13)" stroke-width="1.8" stroke-dasharray="6 5"><path d="M528,140 C574,300 560,450 552,600"/><path d="M502,140 C546,300 534,450 526,600"/></g>
        </g>
        ${embroider(`${mark(400, 250, 270, '#f1f2f4')}`)}
        ${embroider(`<text transform="translate(694 470) rotate(-12)" font-family="${F}" font-weight="800" font-size="40" letter-spacing="-1" fill="${BLUE}">8806</text>`)}
        <ellipse cx="360" cy="300" rx="9" ry="6" fill="#050506" stroke="rgba(255,255,255,.18)" stroke-width="2"/>
        <ellipse cx="692" cy="284" rx="9" ry="6" fill="#050506" stroke="rgba(255,255,255,.18)" stroke-width="2"/>
        <rect width="1000" height="800" filter="url(#capNoise)" opacity=".14" style="mix-blend-mode:overlay"/>
        <path d="${crown}" fill="none" stroke="#fff" stroke-opacity=".06" stroke-width="5" filter="url(#dropS)"/>
      </g>
      <ellipse cx="515" cy="132" rx="30" ry="13" fill="${base}" stroke="rgba(255,255,255,.12)" stroke-width="2"/>
      <path d="${brim}" fill="#16171b"/>
      <g clip-path="url(#${b})">
        <rect width="1000" height="800" fill="url(#brimLight)"/>
        <g fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1.8" stroke-dasharray="6 5">
          ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${250 + i * 6},${700 - i * 16} C${370 + i * 4},${744 - i * 18} ${600},${750 - i * 18} ${770 - i * 6},${704 - i * 16}"/>`).join('')}
        </g>
        <path d="M188,548 C330,610 700,604 862,532" fill="none" stroke="#000" stroke-opacity=".75" stroke-width="16" filter="url(#dropS)"/>
        <rect width="1000" height="800" filter="url(#capNoise)" opacity=".12" style="mix-blend-mode:overlay"/>
      </g>
    </g>`;
}

// ------------------------------------------------------------------ enamel trading pin

function pin(cx, cy, r) {
  const k = r / 520;
  return `
    <ellipse cx="${cx}" cy="${cy + r * 1.02}" rx="${r * 0.82}" ry="${r * 0.12}" fill="#000" opacity=".6" filter="url(#drop)"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#steel)" filter="url(#drop)"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.985}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="${2 * k + 1}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.915}" fill="url(#pinSteelIn)"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.885}" fill="url(#enamel)"/>
    <g filter="url(#metalEdge)">${mark(cx - r * 0.86, cy - r * 0.86, r * 1.72, 'url(#steel)')}</g>
    <path d="M${cx - r * 0.78},${cy - r * 0.32} A${r * 0.86},${r * 0.86} 0 0 1 ${cx + r * 0.36},${cy - r * 0.8}" fill="none" stroke="#fff" stroke-opacity=".32" stroke-width="${26 * k}" stroke-linecap="round" filter="url(#glossBlur)"/>
    <ellipse cx="${cx - r * 0.35}" cy="${cy - r * 0.52}" rx="${r * 0.2}" ry="${r * 0.08}" transform="rotate(-38 ${cx - r * 0.35} ${cy - r * 0.52})" fill="#fff" opacity=".28" filter="url(#glossBlur)"/>`;
}
const PIN_DEFS = `
  <radialGradient id="enamel" cx=".42" cy=".36" r=".75"><stop offset="0" stop-color="#2a3f86"/><stop offset=".7" stop-color="#1b2a5c"/><stop offset="1" stop-color="#101a3c"/></radialGradient>
  <linearGradient id="pinSteelIn" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#eef1f5"/><stop offset=".5" stop-color="#8c929c"/><stop offset="1" stop-color="#d9dde3"/></linearGradient>
  <filter id="metalEdge" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#050a1a" flood-opacity=".8"/></filter>
  <filter id="glossBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>`;

function pinCard() {
  return `<g filter="url(#drop)">
      <rect x="370" y="150" width="860" height="1300" rx="36" fill="#0f1014"/>
      <rect x="370" y="150" width="860" height="1300" rx="36" fill="url(#cardLight)"/>
      <rect x="371" y="151" width="858" height="1298" rx="35" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="2"/>
    </g>
    <path d="M740,214 h120 a22,22 0 0 1 0,44 h-30 a30,30 0 0 0 -60,0 h-30 a22,22 0 0 1 0,-44 z" fill="#08090b"/>
    <text x="800" y="352" text-anchor="middle" font-family="${M}" font-weight="600" font-size="24" letter-spacing="9" fill="rgba(255,255,255,.55)">FRC TEAM 8806 · OLPDL</text>
    <text x="800" y="420" text-anchor="middle" font-family="${F}" font-weight="700" font-size="54" letter-spacing="-1.5" fill="#f4f5f7">Trading pin</text>
    ${pin(800, 820, 300)}
    <line x1="470" y1="1230" x2="1130" y2="1230" stroke="rgba(255,255,255,.1)" stroke-width="2"/>
    <text x="470" y="1290" font-family="${M}" font-weight="600" font-size="22" letter-spacing="4" fill="${BLUE_T}">SEASON 2026</text>
    <text x="1130" y="1290" text-anchor="end" font-family="${M}" font-weight="600" font-size="22" letter-spacing="4" fill="rgba(255,255,255,.55)">32 MM · SOFT ENAMEL</text>
    <text x="470" y="1360" font-family="${F}" font-weight="500" font-size="30" fill="rgba(255,255,255,.7)">Trade me at a regional.</text>`;
}

// ------------------------------------------------------------------ sticker pack

function sticker(transform, inner, outline) {
  return `<g transform="${transform}" filter="url(#drop)">${outline}${inner}</g>`;
}
function stickers() {
  const cut = (d, w = 16) => `<path d="${d}" fill="#fff" stroke="#fff" stroke-width="${w * 2}" stroke-linejoin="round"/>`;
  const tri = 'M0,-250 L240,170 L-240,170 Z';
  return `
    ${sticker('translate(500 470) rotate(-9)', `<circle r="230" fill="${NAVY}"/><image href="${A}logo-640.webp" x="-230" y="-230" width="460" height="460"/>`, `<circle r="250" fill="#fff"/>`)}
    ${sticker('translate(1120 380) rotate(7)', `<rect x="-230" y="-95" width="460" height="190" rx="95" fill="${BLUE}"/><text y="44" text-anchor="middle" font-family="${F}" font-weight="800" font-size="128" letter-spacing="-6" fill="#fff">8806</text>`, cut('M-230,-95 h460 a95,95 0 0 1 0,190 h-460 a95,95 0 0 1 0,-190 z', 16))}
    ${sticker('translate(1110 930) rotate(-5)', `<path d="${tri}" fill="#fff" stroke="#e0362c" stroke-width="34" stroke-linejoin="round"/>${mark(-110, -150, 220, '#16181d')}<text y="128" text-anchor="middle" font-family="${F}" font-weight="800" font-size="50" letter-spacing="1" fill="${BLUE}">WARNING</text>`, cut(tri, 30))}
    ${sticker('translate(500 1000) rotate(5)', `<rect x="-290" y="-90" width="580" height="180" rx="36" fill="#0d0e12"/><text x="-246" y="-10" font-family="${F}" font-weight="700" font-size="52" letter-spacing="-1.5" fill="#fff">Built by</text><text x="-246" y="56" font-family="${F}" font-weight="700" font-size="52" letter-spacing="-1.5" fill="${BLUE_T}">45 students.</text>`, cut('M-290,-90 h580 v180 h-580 z', 16))}
    ${sticker('translate(640 1380) rotate(-7)', `<rect x="-210" y="-100" width="420" height="200" rx="14" fill="#fff"/><rect x="-186" y="-76" width="372" height="152" rx="8" fill="none" stroke="${BLUE}" stroke-width="5" stroke-dasharray="16 11"/><text y="-6" text-anchor="middle" font-family="${M}" font-weight="700" font-size="34" letter-spacing="3" fill="${BLUE}">YOUR LOGO</text><text y="38" text-anchor="middle" font-family="${M}" font-weight="700" font-size="34" letter-spacing="3" fill="${BLUE}">HERE</text>`, cut('M-210,-100 h420 v200 h-420 z', 14))}
    ${sticker('translate(1180 1370) rotate(9)', `<rect x="-170" y="-170" width="340" height="340" rx="40" fill="#20347a"/>${lines('#fff', -118, -142, 236)}`, cut('M-170,-170 h340 v340 h-340 z', 14))}`;
}

// ------------------------------------------------------------------ tote (natural canvas)

function tote() {
  const body = 'M330,560 L1270,560 L1296,1470 C1000,1490 600,1490 304,1470 Z';
  const c = id('tc');
  return `<defs>
      <clipPath id="${c}"><path d="${body}"/></clipPath>
      <filter id="weave" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.06" numOctaves="2" seed="4" result="a"/><feTurbulence type="fractalNoise" baseFrequency="0.06 0.9" numOctaves="2" seed="9" result="b"/><feBlend in="a" in2="b" mode="multiply"/><feColorMatrix type="saturate" values="0"/></filter>
      <linearGradient id="toteLight" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></linearGradient>
      <filter id="toteBlur"><feGaussianBlur stdDeviation="18"/></filter>
    </defs>
    <ellipse cx="800" cy="1490" rx="560" ry="40" fill="#000" opacity=".65" filter="url(#toteBlur)"/>
    <path d="M590,590 C590,250 680,190 800,190 C920,190 1010,250 1010,590" fill="none" stroke="#bdb39b" stroke-width="54"/>
    <path d="${body}" fill="#e7dfcb"/>
    <g clip-path="url(#${c})">
      <rect x="300" y="540" width="1000" height="960" fill="url(#toteLight)"/>
      <g filter="url(#toteBlur)"><path d="M420,700 C440,1000 430,1300 420,1480" stroke="#000" stroke-width="50" opacity=".08" fill="none"/><path d="M1160,640 C1150,980 1170,1300 1180,1480" stroke="#000" stroke-width="60" opacity=".1" fill="none"/></g>
      ${ink(`
        <text x="800" y="700" text-anchor="middle" font-family="${M}" font-weight="700" font-size="30" letter-spacing="12" fill="#1a1d24">OLPDL WORKSHOP</text>
        ${lines('#1a1d24', 590, 740, 420)}
        <g stroke="#1a1d24" stroke-width="2" fill="#1a1d24"><line x1="560" y1="740" x2="560" y2="1230"/><line x1="548" y1="740" x2="572" y2="740"/><line x1="548" y1="1230" x2="572" y2="1230"/><path d="M560,740 l-5,14 h10 z"/><path d="M560,1230 l-5,-14 h10 z"/></g>
        <text transform="translate(540 985) rotate(-90)" text-anchor="middle" font-family="${M}" font-weight="600" font-size="16" letter-spacing="4" fill="#1a1d24">FIG. 1</text>
        <text x="800" y="1310" text-anchor="middle" font-family="${F}" font-weight="800" font-size="74" letter-spacing="-3" fill="#1a1d24">8806</text>
        <text x="800" y="1352" text-anchor="middle" font-family="${M}" font-weight="600" font-size="18" letter-spacing="6" fill="#1a1d24">FRC · NEW TAIPEI CITY · EST. 2022</text>`, 0.9)}
      <rect x="300" y="540" width="1000" height="960" filter="url(#weave)" opacity=".28" style="mix-blend-mode:multiply"/>
      <path d="M330,560 L1270,560" stroke="#000" stroke-opacity=".18" stroke-width="30" filter="url(#toteBlur)"/>
      <g fill="none" stroke="rgba(0,0,0,.28)" stroke-width="2.2" stroke-dasharray="8 6"><path d="M334,590 L1266,590"/></g>
    </g>
    <path d="M560,590 C560,210 670,150 800,150 C930,150 1040,210 1040,590" fill="none" stroke="#d9d0b9" stroke-width="54"/>
    <path d="M560,590 C560,210 670,150 800,150 C930,150 1040,210 1040,590" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2" stroke-dasharray="8 6" transform="translate(0 -16)"/>
    <path d="M560,590 C560,210 670,150 800,150 C930,150 1040,210 1040,590" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2" stroke-dasharray="8 6" transform="translate(0 16)"/>
    <g fill="none" stroke="rgba(0,0,0,.3)" stroke-width="2"><rect x="532" y="586" width="56" height="70"/><path d="M532,586 L588,656 M588,586 L532,656"/><rect x="1012" y="586" width="56" height="70"/><path d="M1012,586 L1068,656 M1068,586 L1012,656"/></g>`;
}

// ------------------------------------------------------------------ bottle (matte black steel)

function bottle() {
  const body = 'M640,470 C640,420 680,392 712,380 L888,380 C920,392 960,420 960,470 L960,1430 C960,1466 940,1480 900,1480 L700,1480 C660,1480 640,1466 640,1430 Z';
  const c = id('bc');
  return `<defs>
      <clipPath id="${c}"><path d="${body}"/></clipPath>
      <linearGradient id="cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#060607"/><stop offset=".14" stop-color="#26282d"/><stop offset=".24" stop-color="#4b4e56"/><stop offset=".34" stop-color="#25272c"/><stop offset=".7" stop-color="#121316"/><stop offset=".9" stop-color="#2c2f36"/><stop offset="1" stop-color="#070708"/></linearGradient>
      <linearGradient id="cylSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d727b"/><stop offset=".25" stop-color="#f2f4f7"/><stop offset=".45" stop-color="#a6acb5"/><stop offset=".8" stop-color="#5d626b"/><stop offset="1" stop-color="#9aa0a9"/></linearGradient>
      <linearGradient id="engrave" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a9099"/><stop offset=".3" stop-color="#dfe3e8"/><stop offset=".6" stop-color="#a3a9b2"/><stop offset="1" stop-color="#6f757e"/></linearGradient>
      <filter id="bNoise" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="12"/><feColorMatrix type="saturate" values="0"/></filter>
      <filter id="bBlur"><feGaussianBlur stdDeviation="20"/></filter>
    </defs>
    <ellipse cx="800" cy="1490" rx="250" ry="34" fill="#000" opacity=".75" filter="url(#bBlur)"/>
    <path d="M722,226 C722,150 878,150 878,226" fill="none" stroke="#17181c" stroke-width="30" stroke-linecap="round"/>
    <path d="M722,226 C722,150 878,150 878,226" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="3" transform="translate(-6 -4)"/>
    <rect x="680" y="210" width="240" height="140" rx="26" fill="url(#cyl)"/>
    <g stroke="rgba(0,0,0,.45)" stroke-width="2">${Array.from({ length: 22 }, (_, i) => `<line x1="${692 + i * 10.4}" y1="222" x2="${692 + i * 10.4}" y2="338"/>`).join('')}</g>
    <rect x="700" y="346" width="200" height="40" rx="6" fill="url(#cylSteel)"/>
    <path d="${body}" fill="url(#cyl)"/>
    <g clip-path="url(#${c})">
      <rect x="600" y="360" width="400" height="1140" filter="url(#bNoise)" opacity=".18" style="mix-blend-mode:overlay"/>
      <g opacity=".92">${mark(670, 640, 260, 'url(#engrave)')}</g>
      <text transform="translate(905 1380) rotate(-90)" font-family="${F}" font-weight="800" font-size="96" letter-spacing="-4" fill="url(#engrave)" opacity=".85">8806</text>
      <text transform="translate(700 1380) rotate(-90)" font-family="${M}" font-weight="600" font-size="18" letter-spacing="6" fill="url(#engrave)" opacity=".75">OLPDL · 750 ML</text>
      <rect x="742" y="380" width="20" height="1100" fill="#fff" opacity=".06" filter="url(#bBlur)"/>
      <path d="${body}" fill="none" stroke="#fff" stroke-opacity=".06" stroke-width="4" filter="url(#dropS)"/>
    </g>`;
}

// ------------------------------------------------------------------ render

export function render(item, view, color) {
  uid = 0;
  switch (item) {
    case 'tee-scorpion': {
      const dark = color !== 'white';
      return svg(tee({ base: dark ? '#141518' : '#efeeea', dark, back: view === 'back', print: view === 'back' ? scorpionBack(dark) : scorpionFront(dark) }));
    }
    case 'tee-blueprint':
      return svg(tee({ base: '#20347a', dark: true, back: view === 'back', print: view === 'back' ? blueprintBack() : blueprintFront() }));
    case 'hoodie': { const h = hoodie(view); return svg(h.body, h.defs); }
    case 'cap': return svg(cap());
    case 'pin': return view === 'card'
      ? svg(pinCard(), PIN_DEFS + '<linearGradient id="cardLight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient>')
      : svg(pin(800, 760, 520), PIN_DEFS);
    case 'stickers': return svg(stickers());
    case 'tote': return svg(tote());
    case 'bottle': return svg(bottle());
    default: return svg('');
  }
}
