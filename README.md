# 8806web

example for dropshipping to FRC 8806 marketing deparatment. ( yes is mocking but for educational purpose)

A concept fundraising website for **FRC Team 8806 — Our Lady of Providence Dream League (OLPDL)**, built from the team's 2025 sponsorship proposal. It's a static site with no build step: open it, edit it, and host it anywhere (GitHub Pages works out of the box).

## What's on the page

| Section | What it does |
|---|---|
| **3D scroll story** | An Apple-style product page for the robot. A procedural 3D model of the 2025 robot (swerve drive, red bumpers, elevator, green compliant-wheel intake) is pinned while you scroll through six chapters: hero turntable → swerve drive (chassis lifts off the modules) → elevator extends → intake grabs a game piece → exploded view → outro. |
| **Price tags in the exploded view** | Hotspots on real parts ("Kraken X60 · NT$9,500 · Sponsor one"). Clicking one adds the part to the pledge builder. |
| **Numbers, record, gallery** | Stats, a season-by-season awards rail (2022–2025 plus next season's goals), and a photo filmstrip. |
| **Team, crest, impact, world map** | The three sub-teams, an interactive breakdown of the scorpion crest, outreach and media history, and a dotted world map of every team exchange. |
| **"Right now" season clock** | Reads today's date and shows where the team is in its Aug→Mar season, so the ask is always timely. |
| **See your name on the robot** | A second 3D viewer: type a company name and it appears on the robot's sponsor panel. |
| **Sponsor a part** | A pledge builder whose items come straight from the budget (Kraken motors, notebooks, robot freight, student travel, open materials fund). "Send" copies the pledge and opens an Instagram DM to the team. |
| **Budget chart** | What a season costs, with a toggle to include international team travel, a hover tooltip per line item, and a table view. |
| **Bilingual** | English and Traditional Chinese (繁體中文). It follows the browser language, has a toggle in the nav, and supports `?lang=zh` / `?lang=en` links. |

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
- **Page copy:** `index.html`. Each translatable element has its English text inline and the Chinese in a `data-zh="…"` attribute next to it.
- **Contact settings** (`SITE` in `data.js`):
  - `email`: leave it empty to hide the e-mail buttons. Fill it in to enable "Send by e-mail" for pledges.
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

A custom model is auto-scaled and centred. It keeps the camera choreography and gets a generic exploded view. The mechanism animations and price-tag hotspots only apply to the built-in model.

## Performance & accessibility notes

- Three.js is vendored (`assets/vendor/three`, r169, MIT) and loaded as a module. Both 3D scenes stop rendering when off-screen, the device pixel ratio is capped, and the second viewer only starts when you scroll near it.
- Photos are WebP (~1.6 MB total, lazy-loaded).
- `prefers-reduced-motion` turns off auto-rotation, smoothing, marquee and counters.
- If WebGL isn't available, a photo fallback is shown. Without JavaScript, the story renders as plain text.

## Things to confirm before publishing

- **Budget totals:** the proposal's line items add up to NT$11,650,000 (NT$3,650,000 without team travel), but the proposal states NT$11,570,000 / NT$3,570,000. The site shows the sums of the line items. Fix the line item that's off in `data.js`.
- **"No.1 in Taiwan · top 100 in the world"** comes from the proposal (綜合能力：全台第一 世界百強). Confirm the source and season before using it publicly.
- Photos and sponsor names are taken from the team's own proposal.

## Credits

- [three.js](https://threejs.org) (MIT).
- World map dots generated from Natural Earth 110m land via [world-atlas](https://github.com/topojson/world-atlas).
- *FIRST*® and *FIRST*® Robotics Competition are registered trademarks of *FIRST*®, which is not affiliated with this site.
