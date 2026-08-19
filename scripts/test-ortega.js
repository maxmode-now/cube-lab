const fs = require('fs');
const vm = require('vm');
const path = require('path');
const root = path.join(__dirname, '..');

const g = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'oll-cases-data.js'), 'utf8'), g);
vm.runInNewContext(fs.readFileSync(path.join(root, 'oll-cases.js'), 'utf8'), g);
vm.runInNewContext(fs.readFileSync(path.join(root, 'lessons.js'), 'utf8'), g);

const ok = (cond, msg) => {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exitCode = 1;
  }
};

const L = g.CubeLessons;
const en = L.ortega2.en;
const ko = L.ortega2.ko;
const OLL_OVERVIEW = 2;
const OLL_CASE0 = 3;
const PBL_OVERVIEW = 10;
const PBL_CASE0 = 11;
const WIDE = /(?:^|\s)(?:[udlrfb]|[UDLRFB]w|Rw|Lw|Uw|Dw|Fw|Bw|Mw)(?:2|')?(?=\s|$)/;

ok(en.length === 16, 'ortega en has 16 steps, got ' + en.length);
ok(ko.length === 16, 'ortega ko has 16 steps, got ' + ko.length);
ok(en[0].intro === true, 'step 0 is intro');
ok(en[OLL_OVERVIEW].algs.length === 7, 'OLL overview has 7 algs');
ok(en[PBL_OVERVIEW].algs.length === 5, 'PBL overview has 5 algs');
ok(L.pblOrtega.length === 5, 'PBL_ORTEGA export');
ok(L.statesOrtega.length === 16, 'statesOrtega length');
ok(!!L.statesOrtega[0] && !!L.statesOrtega[1] && !!L.statesOrtega[2], 'diagrams on 0-2');
ok(!L.statesOrtega[OLL_CASE0], 'no diagram on first OLL case');
ok(!!L.statesOrtega[PBL_OVERVIEW], 'diagram on PBL overview');
ok(!!L.statesOrtega[15], 'diagram on last PBL case');

function expectedOllAlg(id) {
  const c = g.CubeOLL.byId(id);
  return (L.ortegaOllAlg && L.ortegaOllAlg[id]) || c.alg;
}

L.ortegaOllIds.forEach((id, i) => {
  const c = g.CubeOLL.byId(id);
  const step = OLL_CASE0 + i;
  const want = expectedOllAlg(id);
  ok(c && en[step].algs[0].alg === want, `OLL case step ${step} alg ${id}`);
  ok(en[step].algs[0].setup === 'inverse', `OLL ${id} inverse setup`);
  ok(en[step].algs[0].caseId === id, `OLL ${id} caseId`);
  ok(L.ortegaLessonStepForCase(id) === step, `ortegaLessonStepForCase(${id})`);
});

en[OLL_OVERVIEW].algs.forEach((a, i) => {
  const id = L.ortegaOllIds[i];
  ok(a.alg === expectedOllAlg(id), `OLL overview alg ${id}`);
});

L.pblOrtega.forEach((c, i) => {
  const step = PBL_CASE0 + i;
  ok(en[step].algs[0].alg === c.alg, `PBL case step ${step} ${c.id}`);
  ok(en[PBL_OVERVIEW].algs[i].alg === c.alg, `PBL overview ${c.id}`);
  ok(L.ortegaLessonStepForCase(c.id) === step, `ortegaLessonStepForCase(${c.id})`);
});

ok(L.ortegaLessonStepForCase('nope') === 0, 'unknown case → 0');

ok(L.ortegaOllAlg[24] === "R U R' U' R' F R F'", 'T override');
ok(L.ortegaOllAlg[25] === "F' R U R' U' R' F R", 'L override');
ok(g.CubeOLL.byId(24).alg.startsWith('r '), '3×3 OLL 24 still uses r');
ok(g.CubeOLL.byId(25).alg.includes(' r '), '3×3 OLL 25 still uses r');

const MOVES_2 = { U: 1, D: 1, L: 1, R: 1, F: 1, B: 1, x: 1, y: 1, z: 1 };
function parse2(tok) {
  const xyz = String(tok).match(/^([xyz])(2|')?$/i);
  if (xyz) return xyz[1].toLowerCase();
  const m = String(tok).match(/^(3|2)?(Uw|Dw|Lw|Rw|Fw|Bw|[UDLRFB]|[udlrfb]|[MESmes])(2|')?$/i);
  if (!m) return null;
  let face = m[2];
  if (/^[MESmes]$/.test(face)) face = face.toUpperCase();
  else if (face.length === 1 && face === face.toLowerCase()) face = face.toUpperCase() + 'w';
  else if (/w$/i.test(face)) face = face[0].toUpperCase() + 'w';
  else face = face.toUpperCase();
  return face;
}

function collectAlgs() {
  const out = [];
  [...en, ...ko].forEach((step, i) => {
    (step.algs || []).forEach(a => out.push({ i, alg: a.alg, label: a.label }));
  });
  return out;
}

collectAlgs().forEach(({ i, alg, label }) => {
  ok(!WIDE.test(alg), `no wide in step ${i} ${label}: ${alg}`);
  alg.trim().split(/\s+/).filter(Boolean).forEach(tok => {
    const face = parse2(tok);
    ok(face && MOVES_2[face], `2×2 engine can play "${tok}" (${label})`);
  });
});

const guide = fs.readFileSync(path.join(root, 'how-to-solve-2x2/ortega/index.html'), 'utf8');
ok(guide.includes(`<code>${L.ortegaOllAlg[24]}</code>`), 'guide T matches override');
ok(guide.includes(`<code>${L.ortegaOllAlg[25]}</code>`), 'guide L matches override');
ok(!guide.includes("r U R' U' r'"), 'guide no 3×3 T r-alg');
ok(!guide.includes("F' r U R'"), 'guide no 3×3 L r-alg');

[27, 26, 21, 22, 23, 24, 25].forEach(id => {
  ok(guide.includes(`learn=ortega&amp;case=${id}`), `guide OLL case link ${id}`);
});
['adj', 'diag', 'h', 'barA', 'barB'].forEach(id => {
  ok(guide.includes(`learn=ortega&amp;case=${id}`), `guide PBL case link ${id}`);
});
ok(guide.includes('learn=ortega&amp;step=0'), 'guide full track link');

console.log(process.exitCode ? 'Some checks failed' : 'All ortega checks passed');
