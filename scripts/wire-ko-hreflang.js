/**
 * Add hreflang + EN|한국어 lang-switch to English guides,
 * and update sitemap.xml with Korean URLs.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://cube.maxmode-now.com';

const GUIDES = [
  'how-to-solve/index.html',
  'how-to-solve/notation/index.html',
  'how-to-solve-2x2/index.html',
  'how-to-solve-2x2/ortega/index.html',
  'how-to-solve-3x3/index.html',
  'how-to-solve-3x3/cfop/index.html',
  'how-to-solve-3x3/cfop/f2l/index.html',
  'how-to-solve-3x3/cfop/oll/index.html',
  'how-to-solve-3x3/cfop/pll/index.html',
  'how-to-solve-3x3/roux/index.html',
  'how-to-solve-4x4/index.html',
  'how-to-solve-5x5/index.html',
];

const LANG_CSS = `
  .lang-switch { display: flex; gap: 8px; align-items: center; font-size: 13px; font-weight: 600; flex: 0 0 auto; }
  .lang-switch a { color: var(--muted); text-decoration: none; }
  .lang-switch a:hover { color: var(--text); }
  .lang-switch a[aria-current="true"] { color: var(--text-strong); }
`;

function depthOf(rel) {
  return rel.split('/').length - 1;
}

function wireEn(rel) {
  const enPath = path.join(ROOT, rel);
  let html = fs.readFileSync(enPath, 'utf8');
  const enUrl = `${BASE}/${rel}`;
  const koUrl = `${BASE}/ko/${rel}`;

  if (!html.includes('hreflang="ko"')) {
    const hreflang = [
      `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
      `<link rel="alternate" hreflang="ko" href="${koUrl}" />`,
      `<link rel="alternate" hreflang="x-default" href="${enUrl}" />`,
    ].join('\n');
    if (html.includes('name="twitter:card"')) {
      html = html.replace(
        /<meta name="twitter:card" content="summary_large_image" \/>/,
        `<meta name="twitter:card" content="summary_large_image" />\n${hreflang}`
      );
    } else {
      html = html.replace('</title>', `</title>\n${hreflang}`);
    }
  }

  if (!html.includes('og:locale:alternate')) {
    html = html.replace(
      /<meta property="og:locale" content="en_US" \/>/,
      '<meta property="og:locale" content="en_US" />\n<meta property="og:locale:alternate" content="ko_KR" />'
    );
  }

  if (!html.includes('.lang-switch')) {
    html = html.replace('</style>', `${LANG_CSS}\n</style>`);
  }

  // Relative path from EN page to KO sibling: add ../ once for depth, then ko/rel
  // From how-to-solve-3x3/cfop/f2l (depth 3): ../../../ko/how-to-solve-3x3/cfop/f2l/index.html
  const depth = depthOf(rel);
  const toKo = '../'.repeat(depth) + 'ko/' + rel;

  if (!html.includes('aria-label="Language"') && !html.includes("aria-label='Language'")) {
    const switchHtml = `
    <nav class="lang-switch" aria-label="Language">
      <a href="./index.html" aria-current="true">EN</a>
      <a href="${toKo}">한국어</a>
    </nav>`;
    // Insert after brand link's closing, before sizes nav — or before </header>
    if (html.includes('<a class="brand"')) {
      html = html.replace(
        /(<a class="brand"[^>]*>[\s\S]*?<\/a>)/,
        `$1${switchHtml}`
      );
    }
  }

  fs.writeFileSync(enPath, html);
  console.log('wired EN', rel);
}

function ensureKoHreflang(rel) {
  const koPath = path.join(ROOT, 'ko', rel);
  if (!fs.existsSync(koPath)) {
    console.warn('missing KO', rel);
    return;
  }
  let html = fs.readFileSync(koPath, 'utf8');
  const enUrl = `${BASE}/${rel}`;
  const koUrl = `${BASE}/ko/${rel}`;
  if (!html.includes('hreflang="en"')) {
    const hreflang = [
      `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
      `<link rel="alternate" hreflang="ko" href="${koUrl}" />`,
      `<link rel="alternate" hreflang="x-default" href="${enUrl}" />`,
    ].join('\n');
    if (html.includes('name="twitter:card"')) {
      html = html.replace(
        /<meta name="twitter:card" content="summary_large_image" \/>/,
        `<meta name="twitter:card" content="summary_large_image" />\n${hreflang}`
      );
    } else {
      html = html.replace(/<title>[^<]*<\/title>/, (m) => `${m}\n${hreflang}`);
    }
    fs.writeFileSync(koPath, html);
    console.log('hreflang KO', rel);
  } else {
    console.log('hreflang KO ok', rel);
  }
}

function updateSitemap() {
  const smPath = path.join(ROOT, 'sitemap.xml');
  let sm = fs.readFileSync(smPath, 'utf8');
  if (sm.includes('/ko/how-to-solve/')) {
    console.log('sitemap already has ko');
    return;
  }
  const entries = GUIDES.map((rel) => `  <url>
    <loc>${BASE}/ko/${rel}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`).join('\n');
  sm = sm.replace('</urlset>', `${entries}\n</urlset>`);
  fs.writeFileSync(smPath, sm);
  console.log('sitemap updated');
}

GUIDES.forEach(wireEn);
GUIDES.forEach(ensureKoHreflang);
updateSitemap();
