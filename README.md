# 8806web

example for dropshipping to FRC 8806 marketing deparatment. ( yes is mocking but for educational purpose)

A concept fundraising website for **FRC Team 8806 — Our Lady of Providence Dream League (OLPDL)**, built from the team's 2025 sponsorship proposal. It's a static site with no build step: open it, edit it, and host it anywhere (GitHub Pages works out of the box).

## What's on the page

The page is ordered by the questions a sponsor asks: *are they good → what do I get → is it a good cause → who are they → what does my money buy → how do I give*. Nothing is sticky or scroll-jacked.

| # | Section | What it does |
|---|---|---|
| 1 | **Hero** (`#top`) | Proof and the ask in five seconds: "7 awards in 4 seasons. Built by 45 students.", the 2025 Imagery Award photo, a four-number scoreboard (7 awards · 6 regionals · 2022 Regional Winner · 9 outreach events), and a trust strip of current supporters and media. No 3D here, so the hero loads nothing heavy. |
| 2 | **Results** (`#results`) | One card per season (2022–2025) with the awards as the headline (and the regional each was won at, when a season had two), the team's goals in a dashed "not yet won" row, the proposal's "No.1 in Taiwan" claim as a cited line, and links to verify on The Blue Alliance and FRC Events. |
| 3 | **Photo strip** | A 200 px marquee of season photos (static under reduced motion). |
| 4 | **Why partner** (`#partner`) | Four reasons (Proven · Seen · Purposeful · Accountable), six sponsor benefits with photos (robot, uniforms, recap videos, social posts, progress reports, co-branded outreach) and the 2024 off-season event the team hosted. |
| 5 | **Impact** (`#impact`) | Outreach and exchange numbers, the outreach log, press coverage (PTS, National Education Radio), the women-in-engineering goal, a dotted world map of every exchange, and the full exchange log. The off-season event the team hosted is told once, in the #partner callout. |
| 6 | **Team** (`#team`) | The team photo with the motto, and the three subteams. Marketing is flagged as the sponsor's point of contact. |
| 7 | **Robot** (`#robot`) | The only 3D on the page: a click-driven viewer with three tabs. *Built by students* (x-ray drivetrain, steering swerve modules, elevator cycling), *Every part has a price* (exploded view with price tags that add the part to the pledge) and *Your logo here* (the camera frames the framed sponsor panel; type a company name to preview it above the six current supporters). Drag sideways to rotate. |
| 8 | **The ask** (`#sponsor`) | A one-line "right now in the season" pill (calendar in a disclosure), the **Sponsor a part** pledge builder (most valuable item first; "Send" copies the pledge and opens an Instagram DM), the **budget** (full-season split bar, line items with % of total, scope toggle, tooltip, table) and the **contact** block. |
| — | **Mobile dock** | On phones and small tablets (≤900 px) a bottom pill links to the pledge builder, or shows the pledge total with a Send button once something is in it. It hides on the hero, next to the inline cart and contact block, and whenever the parts list is under it. |

Everything is bilingual: English and Traditional Chinese (繁體中文). The page follows the browser language, has a toggle in the nav, and supports `?lang=zh` / `?lang=en` links.

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
- **Counts that follow the data:** the award and season counts ("7 awards in 4 seasons" in the headline, the *Proven* reason, the scoreboard and the page title) and the outreach / exchange counts are computed from `SEASONS`, `OUTREACH` and `EXCHANGES`, so adding a season updates them. The number of regionals and the list of places ("New Taipei City, Hawaii, Istanbul and Arizona") come from each season's `regionals` and `places`, and the outreach year range comes from the `OUTREACH` dates. Only the static `<title>` and `<meta>` description in `index.html` (what crawlers and link previews read before JavaScript runs) need a manual edit.
- **Seasons:** in `SEASONS`, `result: true` marks a placing that isn't an award (e.g. "Top 8 alliance"), `star` highlights the big results, `at` names the regional when a season had more than one, `regionals` is how many regionals the team played that season and `places` where. A season with `draft: true` is hidden and left out of every count — use it to prepare results before they are confirmed. A season with no `img` gets a branded placeholder tile.
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

`main.js` → `initShowcase()` wires the three tabs (they switch the text even without WebGL) and lazy-loads `scene.js` when `#robot` is about one viewport away. `scene.js` → `initShowcase({ canvas, wrap, hotspotLayer, hotspots, onHotspot, sponsors, modelUrl, reducedMotion, lang })` returns `{ setView(id), setName(str), setLang(l), redrawText() }`.

- Each tab is a row in the `VIEWS` table (camera orbit, target, mechanism pose, price-tag opacity, sway). `setView` blends every field over ~0.9 s; with reduced motion it snaps.
- The "Your logo here" view frames the sponsor panel using the model's `panel` anchor when there is one. The panel is drawn by `assets/js/sponsor-panel.js` on a 1024×1366 canvas: every supporter at one size (long names wrap onto two lines rather than shrink), and a typed name in a highlighted slot on top.
- Price tags are placed beside their part and pushed apart when they would overlap each other or another part's dot.
- Start-up is spread over idle time so scrolling stays smooth: the engine starts once the main thread is quiet after `#robot` comes within a viewport, the robot is built in chunks (`buildRobotAsync` in `robot-model.js`), and the shaders are compiled before the first visible frame (in parallel where the GPU supports it, otherwise a few at a time).
- The canvas is sized by a `ResizeObserver`, the pixel ratio is capped (1.5 on phones, 2 otherwise), phones get a lighter model (`detail: 'low'`), and the render loop only runs while `#robot` is on screen and the tab is visible.
- No WebGL: a photo is shown instead, the price tab lists the price tags as buttons and the logo tab draws the sponsor panel in 2D, so the name preview still works. No JavaScript: the photo and all three tab texts are shown.

## Performance & accessibility notes

- Three.js is vendored (`assets/vendor/three`, r169, MIT) and only requested when you scroll near the robot section, so the hero doesn't pay for 3D (even the WebGL support check waits until then). There is one WebGL canvas on the page.
- Web fonts never block the first paint: Inter loads in the background, and Noto Sans TC is only requested when the page is shown in Chinese.
- Photos are WebP (~1.6 MB total, lazy-loaded except the hero photo, which is preloaded). They're small originals, so no photo is shown wider than about 1.3× its native width.
- `prefers-reduced-motion` turns off camera sway, spinning parts, view transitions, the marquee and the count-up numbers.

## Things to confirm before publishing

- **Budget totals:** the proposal's line items add up to NT$11,650,000 (NT$3,650,000 without team travel), but the proposal states NT$11,570,000 / NT$3,570,000. The site shows the sums of the line items. Fix the line item that's off in `data.js`.
- **Ranking line:** the Results section says the 2025 proposal ranked the team's overall ability No.1 in Taiwan and that the team was once in the world's top 100 (it no longer is). Confirm whether "No.1 in Taiwan" is still current.
- **2026 season is a draft.** The team confirmed it competed at the 2026 Shanghai Regional, so Shanghai already appears in the "regionals in …" lines and the regional count (attendance is read from every season, drafts included). The 2026 card and the award counts wait for the confirmed results: add the awards (and any other 2026 regional) to the 2026 entry in `SEASONS`, add a photo, then remove `draft: true`.
- **2026 team exchanges** are not in `EXCHANGES` yet.
- Photos and sponsor names are taken from the team's own proposal.

## Credits

- [three.js](https://threejs.org) (MIT).
- World map dots generated from Natural Earth 110m land via [world-atlas](https://github.com/topojson/world-atlas).
- *FIRST*® and *FIRST*® Robotics Competition are registered trademarks of *FIRST*®, which is not affiliated with this site.
