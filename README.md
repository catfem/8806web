# 8806web

example for dropshipping to FRC 8806 marketing deparatment. ( yes is mocking but for educational purpose)

A concept fundraising website for **FRC Team 8806 — Our Lady of Providence Dream League (OLPDL)**, built from the team's 2025 sponsorship proposal. It's a static site with no build step: open it, edit it, and host it anywhere (GitHub Pages works out of the box).

## What's on the page

The page is ordered by the questions a sponsor asks: *are they good → what do I get → is it a good cause → who are they → what does my money buy → how do I give*. Nothing is scroll-jacked: the nav, the right rail and the phone dock are fixed, everything else scrolls normally.

| # | Section | What it does |
|---|---|---|
| 1 | **Hero** (`#top`) | Proof and the ask in five seconds, centred like a product launch page: the crest as *Detail A* of the drawing (a navy disc in a dash-dot ring with centre-line stubs, on a centre line across the column, with a leader to a "Detail A · Crest" callout), the `8806` badge with the OLPDL wordmark, the headline "11 awards. 5 seasons. Built by 45 students." (counts computed from `data.js`), three square buttons (Sponsor 8806 → pledge, What sponsors get, Instagram), a mono caption, the current supporters as a cell row, the press line, and a full-width four-number scoreboard (awards · regionals and where · the newest season · outreach events). No photo and no 3D here, so the hero loads nothing heavy. |
| 2 | **Results** (`#results`) | The 2025 Imagery Award photo beside the intro, then the newest season (2026) as a wide row — a stat panel with a big blue award count until a 2026 photo is added — and one bordered cell per earlier season, newest first, with the awards as the headline (blue square = the big results; the regional each was won at), off-season results, the team's goals ("next, we're going for"), the "once in the world's top 100" line, and links to verify on The Blue Alliance and FRC Events. |
| 3 | **Photo strip** | A 200 px marquee of season photos (static under reduced motion). |
| 4 | **Why partner** (`#partner`) | Four reasons (Proven · Seen · Purposeful · Accountable) as bordered cells, six sponsor benefits with photos (robot, uniforms, recap videos, social posts, progress reports, co-branded outreach) and the 2024 off-season event the team hosted. |
| 5 | **Impact** (`#impact`) | Outreach and exchange numbers, the outreach log, press coverage (PTS, National Education Radio), the women-in-engineering goal, a dotted world map of every exchange (blue flight arcs), and the full exchange log. The off-season event the team hosted is told once, in the #partner callout. |
| 6 | **Team** (`#team`) | The team photo with the motto, the crest, and the three subteams. Marketing is flagged as the sponsor's point of contact. |
| 7 | **Robot** (`#robot`) | The only 3D on the page: a click-driven viewer with three tabs. *Built by students* (x-ray drivetrain, steering swerve modules, elevator cycling), *Every part has a price* (exploded view with price tags that add the part to the pledge) and *Your logo here* (the camera frames the framed sponsor panel; type a company name to preview it above the six current supporters). Drag sideways to rotate. The view reads as a CAD viewport: the top-right corner names the drawing view of the tab (View A · Assembly, View B · Exploded, View C · Detail) over an "illustrative model · not to scale" note; the bottom-left corner shows "Regenerating · 3/7 · Electronics" while the model really builds, then the camera's live azimuth and elevation (phones: the note). The robot stands on a turntable datum ring and assembles once on its first frame. Each price tag carries the part's bill-of-materials balloon (③ X60, ④ X44, ⑥ materials) or a "07.2" box for the budget sheet, on a leader from the part. |
| 8 | **The ask** (`#sponsor`) | The season clock ("right now: October — R&D & parts check" over a row of month cells, the current month in blue), then three numbered sub-blocks: **07.1 Sponsor a part** (the robot's bill of materials: most valuable item first, each with an item balloon 1–6 that the cart lines and the 3D price tags repeat, under an Item · Part · Unit cost header with column rules; "Send" copies the pledge and opens an Instagram DM), **07.2 Budget** (the full-season split bar as a dimensioned part: the season total is its overall dimension and a chain dimension under it measures build vs travel, with a legend instead on phones; then line items with % of total, scope toggle, tooltip, table) and **07.3 Contact**. |
| — | **Mobile dock** | On phones and small tablets (≤900 px) a square bar along the bottom links to the pledge builder, or shows the pledge total with a Send button once something is in it. It hides on the hero, next to the inline cart and contact block, and whenever the parts list is under it. |
| — | **Right rail** | On wide screens (≥1440 px) the gutter right of the content column holds the page's **drawing list** — the seven sheets plus the sponsor block's sub-sheets 07.1 Sponsor a part, 07.2 Budget and 07.3 Contact (click to jump; the sheet being read is lit with a blue bar, its parent stays bright) — and a **title block** (project, drawn by, units, revision, current sheet, and an "Approved by: your brand?" link to the sponsor section), beside a ruler with one numbered tick per section and a blue marker for the scroll position. Below 1440 px the same title block sits in the footer, and below 1180 px the nav links fold into a **Menu** button that opens the list of sections. |

Everything is bilingual: English and Traditional Chinese (繁體中文). The page follows the browser language, has a toggle in the nav, and supports `?lang=zh` / `?lang=en` links.

## Look

A dark, technical product-page style (one content column framed by 1px rules), laid out as the team's own engineering drawing set. The page styles live in `assets/css/main.css` and the drawing layer in `assets/css/cad.css`; the tokens are on `:root` in each.

- **Palette:** charcoal page `--bg #121316`, raised surface `--bg-2`, hairline rules `--rule`, text `--text` / `--muted` / `--dim` (every text colour is at least 4.5:1 on every surface; nothing on the page is set below 11 px), and one accent, cobalt blue `--accent #2a6df4` (with the lighter `--accent-text #6aa5ff` when the accent is text on the dark page), used sparingly: one word in a headline, the number badge, active states, chart bars, award markers and the focus ring. Team-travel bars are hatched in the same blue, so they differ from the build bars by pattern. The 3D robot matches: blue-alliance bumpers, a blue datum ring and a blue rim light. The team navy only appears in the crest and the 3D scene.
- **Frame:** the column is at most 1280 px wide (with at least an 80 px empty gutter on the left while the rail shows) with full-height rules on both sides and small "+" ticks where section rules cross them. Every section starts with a 44 px strip (`.strip`: "02 / RESULTS" on the left, a mono meta line on the right) and every block inside a section is separated by a full-width rule. No rounded corners (the crest is a round disc), no shadows, no blur.
- **Type:** Archivo (variable, expanded `font-stretch: 112%`, weight 800) for headlines — sized in container units (`cqi`) so they follow the column, which the rail narrows; JetBrains Mono, uppercase and tracked, for short labels, nav, buttons, captions, strips and numbers; Inter for body text and for anything that reads as a sentence (scoreboard labels, notes, the legal line). Chinese uses Noto Sans TC (900 for headlines) with less tracking on mono labels.
- **Drawing layer** (`cad.css`): each section is a sheet and its strip the sheet header. One 1px line weight; grey for geometry (`--cad` for dimension and leader lines, `--cad-faint` for centre, construction and hidden lines), blue and white only for facts and actions. Linetypes: long-dash-dot centre lines (`--ln-center`, the hero crest), dashed hidden lines for what isn't built yet (the goals), and a 135° section hatch (`--hatch-section`) on the 2026 stat panel, whose small labels sit on solid chips. From 1100 px, zone letters (A, B, C… skipping I and O, one per 320 px) run down the drawing border beside each section (`initZones()` in `assets/js/cad.js`; left gutter only while the rail shows). Buttons and price tags show four square selection grips on hover and keyboard focus. One dimension style (closed 8×6 px arrowheads, extension lines 3 px off the object) dimensions the budget bar, and item balloons (`balloon()` in `cad.js`) tie the pledge list, the cart and the 3D price tags together. Every number in an annotation comes from `data.js` or the live camera. All of it is decorative: `aria-hidden`, no pointer events and never focusable. What sits on static content is drawn without JavaScript; the balloons and the 3D view's corners come with the JavaScript-rendered parts list and viewer.
- **Components:** square buttons (`.btn--primary` white, `.btn--ghost` outlined), cell rows (`.cells`: bordered cells sharing their borders, used for partners, goals, tabs, the budget toggle (toggle buttons with `aria-pressed`) and chips), bordered grids (`.grid`: 1px gaps over the rule colour), photo|text rows (`.split`), and the badge + wordmark.

## Run locally

ES modules need a web server (opening `index.html` as a file won't work):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy on GitHub Pages

1. Merge this branch into `main`.
2. In the repo, go to **Settings → Pages**, then set **Source: Deploy from a branch**, **Branch: `main` / `(root)`**.
3. The site will be at `https://<user>.github.io/8806web/`.

## Editing content

- **Numbers, budget, sponsor items, seasons, calendar, exchanges, outreach, media, sponsors, contacts:** `assets/js/data.js`. The budget totals and the chart are computed from the line items there.
- **Counts that follow the data:** the award and season counts ("7 awards in 4 seasons" in the headline, the *Proven* reason, the scoreboard and the page title) and the outreach / exchange counts are computed from `SEASONS`, `OUTREACH` and `EXCHANGES`, so adding a season updates them. The number of regionals and the list of places ("New Taipei City, Hawaii, Istanbul and Arizona") come from each season's `regionals` and `places`, and the outreach year range comes from the `OUTREACH` dates. The title block's revision is one letter per season with the latest year ("E · 2026"), so it moves on with `SEASONS` too. Only the static `<title>` and `<meta>` description in `index.html` (what crawlers and link previews read before JavaScript runs) need a manual edit.
- **Seasons:** in `SEASONS`, `result: true` marks a placing that isn't an award (e.g. "Top 8 alliance"), `star` highlights the big results, `at` names the regional when a season had more than one, `offseason` lists off-season results (shown, not counted), `regionals` is how many regionals the team played that season and `places` where. A season with `draft: true` is hidden and left out of every count — use it to prepare results before they are confirmed. A season with no `img` gets a branded placeholder tile.
- **Outreach:** an `OUTREACH` entry can carry a `note` (shown in smaller text under the event).
- **Page copy:** `index.html`. Each translatable element has its English text inline and the Chinese in a `data-zh="…"` attribute next to it.
- **Contact settings** (`SITE` in `data.js`):
  - `email`: leave it empty to hide the e-mail buttons. Fill it in to enable "Send by e-mail" for pledges.
  - `proposalUrl`: link to the sponsorship proposal PDF (for example `assets/proposal-2025.pdf`). When it's set, the contact block shows a "Download our sponsorship proposal (PDF)" button; empty hides it.
  - `facebook`: currently a Facebook *search* link. Replace it with the page URL.
  - `conceptNotice`: shows "Concept site … not an official team page" in the footer. Set it to `false` once the team adopts the site.

## Using the team's real CAD model

The built-in robot is generated in code (no download). To show the team's actual robot instead:

1. In Onshape, export the robot assembly as **GLB**.
2. Compress it for the web (this usually takes a 30–100 MB CAD export down to a few MB):
   ```bash
   npx @gltf-transform/cli optimize robot.glb assets/models/robot.glb \
     --compress meshopt --texture-compress webp --simplify true
   ```
3. Set `robotModelUrl: 'assets/models/robot.glb'` in `assets/js/data.js`.

A custom model is auto-scaled and centred. It keeps the three camera views and gets a generic exploded view in the "price" tab. The mechanism animations and the 3D price tags and sponsor panel only exist on the built-in model, so with a custom model the price tab lists the price tags as buttons and the logo tab shows the sponsor panel as a 2D card (the same drawing as on the built-in robot).

## How the 3D viewer works

`main.js` → `initShowcase()` wires the three tabs (they switch the text even without WebGL) and lazy-loads `scene.js` when `#robot` is about one viewport away. `scene.js` → `initShowcase({ canvas, wrap, section, hotspotLayer, hotspots, onHotspot, onStage, onCamera, sponsors, modelUrl, reducedMotion, lang, view })` returns `{ custom, setView(id), setName(str), setLang(l), redrawText() }`.

- Each tab is a row in the `VIEWS` table (camera orbit, target, mechanism pose, price-tag opacity, sway). `setView` blends every field over ~0.9 s; with reduced motion it snaps.
- The "Your logo here" view frames the sponsor panel using the model's `panel` anchor when there is one. The panel is drawn by `assets/js/sponsor-panel.js` on a 1024×1366 canvas: every supporter at one size (long names wrap onto two lines rather than shrink), and a typed name in a highlighted slot on top.
- Price tags are placed beside their part and pushed apart when they would overlap each other or another part's dot, and kept 44 px from the top and bottom (phones: 40 px and 48 px) so they clear the corner labels. A leader runs from the part's dot to the tag, wherever the tag was pushed. Each hotspot's `ref` is its balloon: an item number from `ITEM` in `main.js` (derived from the parts list order) or a sheet number. `onHotspot(h, { keyboard })` tells the page whether a tag was activated from the keyboard, so focus follows to the parts list only then.
- `onStage(id)` reports each finished build stage — `'frame'`, `'drive'`, `'electronics'`, `'elevator'`, `'effector'` (the labelled pauses of `buildRobotAsync`), then `'intake'`, `'shading'` (after the shader warm-up) and `'done'` (a custom model reports `'model'`, then `'done'`) — which drives the "Regenerating · n/7" status line. `onCamera(az, el)` reports the camera's azimuth and elevation in whole degrees, only when one of them changes.
- On its first rendered frame in the build view the robot assembles once: the parts start slightly apart and converge over 1.1 s (not with reduced motion, and not if another tab was picked first).
- Start-up is spread over idle time so scrolling stays smooth: the engine starts once the main thread is quiet after `#robot` comes within a viewport, the robot is built in chunks (`buildRobotAsync` in `robot-model.js`), and the shaders are compiled before the first visible frame (in parallel where the GPU supports it, otherwise a few at a time).
- The canvas is sized by a `ResizeObserver`, the pixel ratio is capped (1.5 on phones, 2 otherwise), phones get a lighter model (`detail: 'low'`), and the render loop only runs while `#robot` is on screen and the tab is visible.
- No WebGL: a photo is shown instead, the price tab lists the price tags as buttons and the logo tab draws the sponsor panel in 2D, so the name preview still works. No JavaScript: the photo and all three tab texts are shown.

## Performance & accessibility notes

- Three.js is vendored (`assets/vendor/three`, r169, MIT) and only requested when you scroll near the robot section, so the hero doesn't pay for 3D (even the WebGL support check waits until then). There is one WebGL canvas on the page.
- Web fonts never block the first paint: Archivo, Inter and JetBrains Mono load in the background in one request (`media="print"` swap, `display=swap`), and Noto Sans TC is only requested, the same way, when the page is shown in Chinese.
- Photos are WebP (~1.6 MB total) and all lazy-loaded; the hero shows only the crest mark (16 KB, also the nav logo). They're small originals, so no photo is shown wider than about 1.3× its native width.
- `prefers-reduced-motion` turns off camera sway, spinning parts, view transitions, the robot's assembly intro, the marquee, the count-up numbers and the reveal fades.

## Things to confirm before publishing

- **Budget totals:** the proposal's line items add up to NT$11,650,000 (NT$3,650,000 without team travel), but the proposal states NT$11,570,000 / NT$3,570,000. The site shows the sums of the line items. Fix the line item that's off in `data.js`.
- **Ranking line:** the Results section says the team's overall ability was "at our peak" among the world's top 100 (the team's own statement). The old "No.1 in Taiwan" claim was removed: Statbotics' 2026 EPA ranking places 8806 around 706th of 3,724, with several Taiwan teams ahead.
- **2026 results** (Shanghai: Regional Finalist + Industrial Design; Haliç, Istanbul: Excellence in Engineering; Marmara, Istanbul: Industrial Design) were verified in October 2026 against copies of FRC Events / The Blue Alliance data. The 2026 card shows a stat panel because there is no 2026 photo yet — set `img` on the 2026 entry once you have one. The 2026 雙北盃 off-season Industrial Design Award was only partly verified and is not shown.
- **Sponsors:** public FRC records list only the school, so `SPONSORS` holds the partners shown in the team's own 2025 materials (AMD removed — it sponsored events, not the team). The hero says "Our partners include …"; replace the list with the team's full 2026 sponsor list.
- **2026 team exchanges** are not in `EXCHANGES` yet.
- Photos and sponsor names are taken from the team's own proposal.

## Credits

- [three.js](https://threejs.org) (MIT).
- World map dots generated from Natural Earth 110m land via [world-atlas](https://github.com/topojson/world-atlas).
- *FIRST*® and *FIRST*® Robotics Competition are registered trademarks of *FIRST*®, which is not affiliated with this site.
