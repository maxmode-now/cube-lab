const fs = require('fs');
const path = require('path');

function walk(d, a = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, a);
    else if (e.name === 'index.html') a.push(p);
  }
  return a;
}

function extractInlineScripts(html) {
  const out = [];
  let i = 0;
  while (i < html.length) {
    const start = html.indexOf('<script', i);
    if (start < 0) break;
    const tagEnd = html.indexOf('>', start);
    if (tagEnd < 0) break;
    const openTag = html.slice(start, tagEnd + 1);
    const close = html.indexOf('</script>', tagEnd);
    if (close < 0) break;
    const body = html.slice(tagEnd + 1, close);
    i = close + 9;
    if (/\ssrc\s*=/.test(openTag)) continue;
    if (/type\s*=\s*"application\/ld\+json"/.test(openTag)) continue;
    out.push(body);
  }
  return out;
}

let errs = 0;
for (const f of walk('ko')) {
  const html = fs.readFileSync(f, 'utf8');
  const scripts = extractInlineScripts(html);
  scripts.forEach((code, idx) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    try {
      // eslint-disable-next-line no-new-func
      new Function(trimmed);
    } catch (e) {
      errs++;
      console.log('JS ERR', f, 'inline', idx + 1, e.message);
      console.log(trimmed.slice(0, 200));
    }
  });
}
console.log('done errs', errs);
