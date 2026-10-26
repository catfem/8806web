# 8806 merch studio

The source of the 8806 Supply product images in `assets/img/shop`. Every product is drawn in code as a
studio mockup (an SVG on a 1600×1600 transparent canvas), so a print can be changed and re-rendered
instead of redrawn.

| File | What it is |
|---|---|
| `items.js` | The designs: the garment and product shapes, their shading, and every print. |
| `studio.html` | Renders one product: `studio.html?item=tee-scorpion&view=back&color=white` (add `&bg=1` for a dark backdrop while designing). Items: `tee-scorpion` (views `front` / `back`, colours `black` / `white`), `tee-blueprint`, `hoodie` (`front` / `back`), `cap`, `pin` (`front` / `card`), `stickers`, `tote`, `bottle`. |
| `robot-lines.webp` | The robot as a hidden-line drawing (white on transparent), used by the Blueprint tee, the tote and a sticker; `items.js` tints it. |
| `lines.html` | Renders that drawing from the site's own 3D model (`assets/js/robot-model.js`). |
| `render.cjs` | Renders every catalog image (600 and 1200 px WebP) and the collection shot into `assets/img/shop`. |

The prints only use the team's own marks: the crest (`assets/img/logo-640.webp`), the white scorpion mark
(`assets/img/mark-white.webp`) and the robot drawing. Type is Geist and Geist Mono, as on the site.

## Re-render

```bash
python3 -m http.server 8806            # from the repo root, in another terminal
node tools/merch/render.cjs            # all product images + the collection shot
node tools/merch/render.cjs --lines    # also re-draw robot-lines.webp from the 3D model first
```

It needs [Playwright](https://playwright.dev) with Chromium (`npm i -D playwright && npx playwright install chromium`).
To add a product view, add its drawing to `render()` in `items.js`, a line to `JOBS` in `render.cjs` (the
output name is the image `src` used in `assets/js/shop-data.js`), and the image to the product in `shop-data.js`.

These are mockups for the shop, not print files: for production, export the print artwork (the parts of
`items.js` wrapped in `ink(…)` / `embroider(…)`) at the printer's size and colour spec.
