const fs = require('fs');
const vm = require('vm');
const g = { console };
vm.runInNewContext(fs.readFileSync('vendor/cube.js', 'utf8'), g);
vm.runInNewContext(fs.readFileSync('pll-cases-data.js', 'utf8'), g);
vm.runInNewContext(fs.readFileSync('pll-cases.js', 'utf8'), g);

const Cube = g.Cube;
const P = g.CubePLL;
const TOKEN = /^(3|2)?(Uw|Dw|Lw|Rw|Fw|Bw|[UDLRFB]|[udlrfb]|[MESmes]|[xyzXYZ])(2|')?$/;

let fail = 0;
function ok(cond, msg) {
  if (!cond) {
    fail++;
    console.log('FAIL', msg);
  }
}

ok(P.cases.length === 21, 'count ' + P.cases.length);
const ids = P.cases.map(c => c.id);
ok(new Set(ids).size === 21, 'unique ids');
const cats = {};
P.cases.forEach(c => { cats[c.cat] = (cats[c.cat] || 0) + 1; });
console.log('by cat', cats);
ok(Object.values(cats).reduce((a, b) => a + b, 0) === 21, 'cat sum');
ok(P.twoLookCornerIds.length === 3, '2look corners');
ok(P.twoLookEdgeIds.length === 4, '2look edges');
ok(P.lessonStepForCase('Aa') === 1, 'Aa step');
ok(P.lessonStepForCase('Ua') === 2, 'Ua step');
ok(P.lessonStepForCase('T') === 6, 'T step');
ok(P.lessonStepForCase('Ga') === 8, 'Ga step');
ok(P.lessonStepForCase('t') && P.byId('t').id === 'T', 'case-insensitive');

P.cases.forEach(c => {
  c.alg.trim().split(/\s+/).forEach(tok => {
    ok(TOKEN.test(tok), c.id + ' bad token ' + tok);
    ok(!/^[xyzXYZ]/.test(tok), c.id + ' uses cube rotation ' + tok);
  });
  const cube = new Cube();
  try {
    cube.move(P.toCubejsAlg(c.alg));
  } catch (e) {
    ok(false, c.id + ' cube.js move failed ' + e.message);
    return;
  }
  const s = cube.asString();
  const U = s.slice(0, 9);
  const D = s.slice(27, 36);
  ok(U === 'UUUUUUUUU', c.id + ' U not oriented ' + U);
  ok(D === 'DDDDDDDDD', c.id + ' D broken ' + D);
  ok(!cube.isSolved(), c.id + ' is identity');
  let solved = false;
  const c2 = new Cube();
  for (let i = 1; i <= 6; i++) {
    c2.move(P.toCubejsAlg(c.alg));
    if (c2.isSolved()) {
      solved = true;
      break;
    }
  }
  ok(solved, c.id + ' never returns to solved');
});

if (fail) {
  console.log('failures', fail);
  process.exit(1);
}
console.log('ok', P.cases.length, 'plls');
