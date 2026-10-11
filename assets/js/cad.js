// CAD layer helpers ("Drawing Set 8806"): zone letters in the drawing border, and the item balloons
// and sheet-reference boxes that tie the pledge list, the cart and the 3D price tags together.

// Zone letters skip I and O, as on a drawing border. Z is --zone in cad.css.
const LET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const Z = 320;

// One letter per 320px band down each sheet. A band only exists while its letter (at the band's
// middle) is inside the section, so a letter never hangs past its sheet. Sections are re-measured
// when #main changes size (a language switch, fonts, a resize), never on scroll; a section's bands
// are only rewritten when their count changes. CSS shows them from 1100px up.
export function initZones() {
  const secs = [...document.querySelectorAll('main > .sec')];
  const boxes = secs.map((sec) => {
    let box = sec.querySelector(':scope > .zones');
    if (!box) {
      box = document.createElement('div');
      box.className = 'zones';
      box.setAttribute('aria-hidden', 'true');
      sec.append(box);
    }
    return box;
  });
  let raf = 0;
  const layout = () => {
    raf = 0;
    const heights = secs.map((sec) => sec.offsetHeight); // read everything first, then write
    heights.forEach((h, i) => {
      let n = 0;
      while (n < LET.length && n * Z + Z / 2 + 8 <= h) n++;
      if (boxes[i].childElementCount === n) return;
      boxes[i].innerHTML = Array.from({ length: n }, (_, k) => `<i style="--i:${k}" data-l="${LET[k]}"></i>`).join('');
    });
  };
  new ResizeObserver(() => { if (!raf) raf = requestAnimationFrame(layout); }).observe(document.getElementById('main'));
  layout();
}

// Item balloon: the pledge item number in a circle (decorative; the row itself names the part).
export const balloon = (n, small) => '<span class="balloon' + (small ? ' balloon--sm' : '') + '" aria-hidden="true">' + n + '</span>';
// Sheet-reference box: points at a budget sheet ("07.2") rather than at an item.
export const sheetRef = (s) => '<span class="balloon balloon--sheet" aria-hidden="true">' + s + '</span>';
