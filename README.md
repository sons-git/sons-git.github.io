# Personal Website — Tang Trung Son

Interactive single-page portfolio with a persistent Three.js scene, custom cursor, magnetic buttons, morphing particle formations tied to scroll, post-processing bloom, and rich project case studies. Vanilla HTML/CSS/JS. No build step. No framework.

## Structure

```
website/
├── index.html
├── css/
│   └── style.css        # dark editorial theme
├── js/
│   ├── main.js          # entry — renders content + wires everything up
│   ├── scene.js         # Three.js particle system with 8 morphing formations
│   ├── cursor.js        # custom cursor + magnetic hover
│   ├── scroll.js        # scroll progress, section detection, reveal
│   ├── modal.js         # project detail modal
│   ├── util.js          # shared helpers
│   └── data.js          # single source of truth for all content
└── README.md
```

## What's interactive

- **Persistent 3D canvas** with 1200 particles that morph between 8 formations (converge, sphere, helix, grid, wave, torus, spiral, converge) as you scroll through the 8 sections.
- **Cursor influence** — particles are pushed away from the mouse in world space.
- **Post-processing** — Unreal bloom + FXAA on desktop for the glow.
- **Custom cursor** with hover state and magnetic buttons.
- **Scroll rail** on the left showing current section + progress.
- **Live status corner** showing local ICT time.
- **Project case study modals** — click any project card for the full story.
- **Staggered reveal** animations as sections enter the viewport.

## Editing content

All content lives in `js/data.js`:

- `profile` — name, contact, resume URL
- `principles` — the four approach cards
- `experience` — timeline items
- `projects` — full project data including modal sections
- `skills` — grouped capability lists
- `recognition` — awards + certifications
- `vision` — long-term direction + research interests
- `stats` — the six about-section stat tiles

The `linkedin` and `resume` URLs are placeholders (`#`). Update them in `data.js` when you have real ones.

## Running locally

You need an HTTP server — ES modules will not load from `file://`.

```bash
# Python
python -m http.server 8080

# Node
npx serve website

# VS Code
# Right-click index.html → "Open with Live Server"
```

Then open http://localhost:8080.

## Deploying

Any static host. The `website/` folder is the artifact.

- **GitHub Pages** — push, enable Pages, point to `/website`.
- **Vercel / Netlify / Cloudflare Pages** — drag and drop the folder or connect the repo.

## Performance

- Particle count auto-scales down on mobile (600 vs 1200).
- Bloom + FXAA are disabled on small screens.
- Line drawing is capped at `COUNT × 6` segments.
- Full support for `prefers-reduced-motion`.

## Development harness

`website/dev/harness.html` is a browser-based property test runner for the "alive" redesign. It is **dev-only** — not linked from `index.html`, not shipped to production, and pulls `fast-check` from `esm.sh` at runtime so there is no build step and no npm dependency.

What it does:

- Mounts the site inside an `<iframe>` at either **1440×900 (desktop)** or **700×1000 (mobile)** — toggle from the left panel.
- Waits for the framed page to expose `window.__alive` (a small dev-only handle onto `shapeSystem`, `textRegions`, `scanner`, `companion`, `scrollState`, and `setSection` / `setCursor` helpers — wired up by `scene.js`).
- Iterates any property tests registered on `window.__alive.propertyTests` and reports pass / fail counts plus the shrunk counter-example when a property fails.

If `__alive` is not yet exposed (e.g. running against an earlier build), the harness shows a `waiting for __alive…` state and polls until it appears. It will not crash and it will not block the site.

Open it locally:

```bash
# from the workspace root (the folder above website/)
python -m http.server 8080

# then in a browser:
# http://localhost:8080/website/dev/harness.html
```

The harness needs to be served from the same origin as `index.html` (it points its iframe at `../index.html`). Any static file server works — `python -m http.server`, `npx serve`, or VS Code Live Server.

### Playwright — per-section screenshot regression

`website/dev/playwright.spec.js` walks the page through all 8 sections (Hero → Contact), dwells 2 s at each, and captures a screenshot into `dev/screenshots/`. Subsequent runs diff against the stored baseline so visual regressions surface as failing tests. Dev-only — Playwright is a devDependency and the site itself has no build step or npm dependency at runtime.

First-time setup (from `website/dev/`):

```bash
cd website/dev
npm install                          # pulls @playwright/test
npx playwright install chromium      # one-time browser download
```

Running the spec:

```bash
# From website/dev — playwright.config.js auto-launches
# `python -m http.server 8080` out of ../ (i.e. website/).
# Override with PORTFOLIO_SERVE_CMD if your Python launcher
# is different.
npx playwright test playwright.spec.js

# Or use the npm scripts:
npm run test:visual                  # run + compare
npm run test:visual:update           # refresh baselines
```

Notes:

- The first run has no baseline images yet, so `toHaveScreenshot` fails and *writes* them into `dev/screenshots/`. Re-run to get a green pass.
- The test runs with `reducedMotion: 'reduce'` set on the browser context so that the WebGL companion, shape morphs, and scroll-linked parallax render deterministically (per requirements R11.1–R11.5). Without this, screenshots would differ every frame.
- Viewport is pinned to 1440×900 desktop.
- A small `maxDiffPixelRatio: 0.02` tolerance is allowed to absorb sub-pixel font rasterization and bloom halo edges that shift by a pixel or two between runs.
- If you already have a static server running on `:8080`, Playwright's `webServer` config reuses it locally (`reuseExistingServer: !CI`).

## Notes

- Three.js is loaded from unpkg via an ES module import map — see the `<script type="importmap">` block in `index.html` to pin/change versions.
- No analytics or tracking. Add your own if you want.
- Custom cursor is desktop-only (`hover: hover and pointer: fine`).
