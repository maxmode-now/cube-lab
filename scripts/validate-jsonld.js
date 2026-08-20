const fs = require('fs');
const path = require('path');

function walk(d, acc = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.html') || e.name.endsWith('.js') || e.name.endsWith('.xml') || e.name.endsWith('.json')) acc.push(p);
  }
  return acc;
}

const roots = ['ko', 'how-to-solve', 'how-to-solve-2x2', 'how-to-solve-3x3', 'how-to-solve-4x4', 'how-to-solve-5x5'];
const files = [];
for (const r of roots) {
  if (fs.existsSync(r)) walk(r, files);
}
files.push('index.html', 'sitemap.xml', 'manifest.json');

let errs = 0;
for (const f of [...new Set(files)]) {
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8');
  if (f.endsWith('.html')) {
    const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
    let m;
    let i = 0;
    while ((m = re.exec(html))) {
      i++;
      try {
        JSON.parse(m[1]);
      } catch (e) {
        errs++;
        console.log('JSON ERR', f, 'block', i, e.message);
        console.log('--- snippet ---');
        console.log(m[1].slice(0, 200));
        console.log('---');
      }
    }
  }
  if (f.endsWith('.json') || f === 'manifest.json') {
    try {
      JSON.parse(html);
    } catch (e) {
      errs++;
      console.log('FILE JSON ERR', f, e.message);
    }
  }
}
console.log('done errs', errs);
