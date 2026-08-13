# Cube Lab

A browser Rubik’s cube you can play, learn, scan, and solve. English and Korean UI. No build step.

## Features

- **Play** 2×2, 3×3, 4×4, and 5×5 with drag-to-turn and orbit
- **Learn** beginner method and CFOP / 4-look last layer
- **Solve** a 3×3 with an optimal two-phase (Kociemba) guide
- **Scan** six faces from photos or the camera, then apply and solve
- **Install** as a PWA on HTTPS (home screen, offline cache)

## Run locally

Do not open `index.html` as a file. The 3D engine and PWA need HTTP.

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy

Copy the static files to any HTTPS host (nginx, Cloudflare Pages, GitHub Pages, Netlify).

Include:

- `index.html`
- `manifest.json`, `sw.js`
- `cube-*.js`, `lessons.js`
- `icons/`

After changing app code, bump the cache name in `sw.js` (`cube-static-v1` → `v2`) so clients pick up the update.

PWA install requires HTTPS and a real domain. `file://` and plain IP over HTTP will not offer install.

## Stack

Static HTML/CSS/JS. Three.js from a CDN. `cubejs` for the 3×3 solver. Camera processing stays in the browser; photos are not uploaded to a server.
