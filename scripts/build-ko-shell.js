/**
 * Copy EN guide HTML into ko/ with path + URL fixes.
 * Body translation is applied afterward by dedicated transform scripts.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

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

function depthOf(rel) {
  // how-to-solve-3x3/cfop/f2l/index.html -> 3
  return rel.split('/').length - 1;
}

function deepen(relEn) {
  const enPath = path.join(ROOT, relEn);
  const koPath = path.join(ROOT, 'ko', relEn);
  fs.mkdirSync(path.dirname(koPath), { recursive: true });
  let html = fs.readFileSync(enPath, 'utf8');
  const depth = depthOf(relEn);
  const enUps = '../'.repeat(depth);
  const koUps = '../'.repeat(depth + 1);

  html = html.replace(/lang="en"/g, 'lang="ko"');
  html = html.replace(/og:locale" content="en_US"/g, 'og:locale" content="ko_KR"');

  const rootAssets = [
    'icons/',
    'vendor/',
    'f2l-cases.js',
    'oll-cases-data.js',
    'oll-cases.js',
    'pll-cases-data.js',
    'pll-cases.js',
    'lessons.js',
  ];
  for (const asset of rootAssets) {
    html = html.split(enUps + asset).join(koUps + asset);
  }

  // App index CTAs and brand link to root index.html
  const enApp = enUps + 'index.html';
  const koApp = koUps + 'index.html';
  html = html.split(enApp + '?').join(koApp + '?lang=ko&');
  html = html.split('href="' + enApp + '"').join('href="' + koApp + '"');

  // Absolute cube URLs for guides -> /ko/
  html = html.replace(
    /https:\/\/cube\.maxmode-now\.com\/(how-to-solve(?:-[2345]x[2345])?(?:\/[^"<\s]*)?)/g,
    'https://cube.maxmode-now.com/ko/$1'
  );
  html = html.replace(/\/ko\/ko\//g, '/ko/');

  // og:locale:alternate for Korean pages
  if (!html.includes('og:locale:alternate')) {
    html = html.replace(
      /<meta property="og:locale" content="ko_KR" \/>/,
      '<meta property="og:locale" content="ko_KR" />\n<meta property="og:locale:alternate" content="en_US" />'
    );
  }

  fs.writeFileSync(koPath, html);
  console.log('shell', relEn);
}

GUIDES.forEach(deepen);
console.log('done', GUIDES.length);
