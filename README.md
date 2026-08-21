# Cube Lab

A browser trainer for Rubik’s cubes. Play 2×2 through 5×5, learn beginner / CFOP / Roux, drill cases with a spaced-repetition queue, scan or paint a physical cube, share scramble links, and follow beginner steps or a fast solve — all on one page, with no account and no build step.

**Demo:** [cube.maxmode-now.com](https://cube.maxmode-now.com/)

<p align="center">
  <img src="docs/play.png" alt="Cube Lab in Play mode, showing a scrambled 3×3" width="920">
</p>

English and Korean. Installable as a PWA over HTTPS.

## Modes

**Play** is the default. Drag a face to turn it, drag empty space to orbit, and use the wheel to zoom. Scramble, undo, and reset stay on the bottom bar. After a scramble you get a 15-second inspection, then the first turn starts the timer (hundredths, WCA +2 / DNF). ao5 / ao12 / PB and the session list live on the cube; times stay in localStorage, with no account. Set a daily solve goal, and use **Copy link** to share the current scramble. The cube size (2×2–5×5) and sticker numbers live in the header and settings.

**Learn** (2×2 and 3×3) walks through a beginner track and, on 2×2, an **Ortega** track (first layer, then one case per step for 7 OLL + 5 PBL). On 3×3, CFOP / 4-look last layer, an F2L case library (41 cases), and Roux (blocks, CMLL, LSE). Each step has a goal diagram, notation, and a demo. Find My Step reads the cube, opens the matching beginner lesson, and can start Beginner solve for this cube.

**Drill** practices F2L, OLL, PLL, and Ortega cases on the cube. Due cases come from a spaced-repetition queue stored in localStorage — same privacy model as Play times.

**Solve** (2×2–5×5) reads the current state and plays a solution. On 2×2 and 3×3 you can follow **Beginner** steps (the same algorithms as the lessons) or **Fast** solve (corner search / Kociemba). 4×4/5×5 always reduce to a 3×3 first. Next move plays one turn; Solve all runs the rest. If you turn a face yourself, the remaining sequence is recomputed.

**Scan** (2×2–5×5) captures all six faces from photos or the camera, or paints stickers by hand without a camera. Each face can be checked and edited before it is applied. Confirmed 2×2/3×3 scans open beginner steps (Fast solve is a second button). Image data stays in the browser; nothing is uploaded.

**Guide** opens the [written guide hub](https://cube.maxmode-now.com/how-to-solve/) (`/how-to-solve/`) — 2×2–5×5, Beginner, CFOP, Roux, and the F2L / OLL / PLL libraries. The [2×2 Ortega guide](https://cube.maxmode-now.com/how-to-solve-2x2/ortega/) covers 7 OLL + 5 PBL for speed. The [notation reference](https://cube.maxmode-now.com/how-to-solve/notation/) covers U–B, M/E/S, wide and big-cube slices, and x/y/z.

## Controls

| Input | Action |
| --- | --- |
| Drag a face | Turn that layer |
| Shift-click or Shift+key | Counter-clockwise turn |
| Drag empty space | Orbit the camera |
| Scroll wheel | Zoom |
| U D L R F B | Turn that face (also in Settings) |

On a phone, Play / Learn / Drill / Solve / Scan sit in the tab bar. Solve collapses to a next-move HUD so the cube stays large. Lessons start in a short peek and expand when you want the full text.

## Run locally

The 3D engine loads Three.js as ES modules, so `file://` will not work.

```bash
python -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

## Develop

Smoke-test core modules with Node (no browser required):

```bash
node scripts/test-timer.js
node scripts/test-solver.js
node scripts/test-drill.js
node scripts/test-oll.js
node scripts/test-pll.js
node scripts/test-ortega.js
node scripts/test-scan-paint.js
node scripts/test-beginner.js
```

To bump `VERSION`, `index.html`, and the service-worker cache names on every commit, install the hook once:

```bash
scripts/install-hooks.sh
```

## Deploy

The app is static files. Any HTTPS host is enough: GitHub Pages, nginx, Cloudflare Pages, Netlify.

Ship at least:

```
index.html
404.html
_redirects
VERSION
manifest.json
sw.js
legal.css
legal.js
about/
privacy/
terms/
how-to-solve/
how-to-solve-2x2/
how-to-solve-3x3/
how-to-solve-4x4/
how-to-solve-5x5/
ko/
cube-engine.js
cube-math.js
cube-solver.js
beginner-solver.js
cube-timer.js
cube-review.js
cube-drill.js
cube-scan.js
lessons.js
f2l-cases.js
oll-cases-data.js
oll-cases.js
pll-cases-data.js
pll-cases.js
solver-worker.js
vendor/cube.js
vendor/solve.js
icons/
```

With the pre-commit hook installed, each commit bumps `VERSION` and the `cube-static-vX.Y` / `cube-runtime-vX.Y` cache names in `sw.js`. Without the hook, bump those yourself after a code change so installed clients pick up the new bundle.

PWA install needs HTTPS and a hostname. It will not appear on `file://` or a bare HTTP IP.

## Internals

| File | Role |
| --- | --- |
| `index.html` | Shell, layout, i18n, mode wiring |
| `cube-engine.js` | Three.js scene, turns, camera |
| `cube-math.js` | Cube state and move application |
| `cube-timer.js` | Play session times, ao5/ao12, daily goal, inspection penalties, scramble share links |
| `cube-drill.js` | Case-drill UI and sets (F2L / OLL / PLL / Ortega) |
| `cube-review.js` | Spaced-repetition queue for drills (localStorage) |
| `cube-solver.js` | Kociemba wrapper around `cubejs` |
| `beginner-solver.js` | Layer-by-layer beginner path for 2×2 and 3×3 |
| `cube-scan.js` | Six-face capture, paint input, and color mapping |
| `f2l-cases.js` | F2L case library |
| `oll-cases.js` / `oll-cases-data.js` | OLL case library |
| `pll-cases.js` / `pll-cases-data.js` | PLL case library |
| `lessons.js` | Tutorial copy and goal diagrams |
| `sw.js` | Precache of local files; runtime cache for CDNs |

Three.js `r160` and `cubejs` 1.3.1 are loaded from CDNs. The solver runs entirely on the client.

## License

[MIT](LICENSE) © 2026 maxmode

## Contact

[maxmode-now.com](https://maxmode-now.com/) · [maxmode.now@gmail.com](mailto:maxmode.now@gmail.com)
