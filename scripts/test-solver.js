// node scripts/test-solver.js
const fs = require('fs');
const path = require('path');
try {
  require(path.join(__dirname, '..', 'vendor', 'solve.js'));
  globalThis.Cube = require(path.join(__dirname, '..', 'vendor', 'cube.js'));
} catch (e) {
  console.warn('cubejs missing — 4×4/5×5 3×3 stage skipped:', e.message);
}
const src = fs.readFileSync(path.join(__dirname, '..', 'cube-solver.js'), 'utf8');
eval(src);

const S = globalThis.CubeSolver._test;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function testMoves(n) {
  S.tablesFor(n);
  const a = S.solvedArr(n);
  const faces = n >= 4
    ? ['U', 'R', 'F', 'D', 'L', 'B', '2R', '2U', 'Uw']
    : ['U', 'R', 'F', 'D', 'L', 'B'];
  faces.forEach(f => {
    const c = a.slice();
    S.applyAlg(n, c, [f, f, f, f]);
    assert(S.isSolvedArr(c), n + ' ' + f + '4 != id');
    const c2 = a.slice();
    S.applyAlg(n, c2, [f, f + "'"]);
    assert(S.isSolvedArr(c2), n + ' ' + f + " f' != id");
  });
}

function mulberry32(a) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function test2() {
  const t0 = Date.now();
  for (let i = 0; i < 8; i++) {
    const { arr } = S.scrambleArr(2, 11, mulberry32(1000 + i));
    const sol = S.solve2(arr.slice());
    S.applyAlg(2, arr, sol);
    assert(S.isSolvedArr(arr), '2x2 fail ' + i + ' sol=' + sol.join(' '));
  }
  console.log('2x2 ok', Date.now() - t0, 'ms');
}

function centersOk(n, arr) {
  for (let f = 0; f < 6; f++) if (!S.faceCentersSolved(arr, n, f)) return false;
  return true;
}

async function testStage(n, seed) {
  const { arr, toks } = S.scrambleArr(n, n === 4 ? 28 : 40, mulberry32(seed));
  console.log(n + 'x' + n, 'seed', seed, 'scramble', toks.length, 'solved?', S.isSolvedArr(arr));
  const t0 = Date.now();
  const result = { seed, centers: false, edges: false, ms: 0, error: null };
  try {
    const c = arr.slice();
    const cm = await S.solveCenters(n, c);
    const cok = centersOk(n, c);
    console.log('  centers', cm.length, 'ok', cok, Date.now() - t0, 'ms');
    result.centers = cok;
    if (!cok) {
      result.error = 'centers not solved';
      result.ms = Date.now() - t0;
      return result;
    }
    const t1 = Date.now();
    try {
      const em = await S.pairEdges(n, c);
      const pc = S.pairedCount(c, S.edgeSlots(n));
      const eok = pc === 12 && centersOk(n, c);
      console.log('  edges', em.length, 'paired', pc + '/12', 'centers', centersOk(n, c), Date.now() - t1, 'ms');
      result.edges = eok;
      if (!eok) result.error = 'edges ' + pc + '/12';
    } catch (e) {
      const pc = S.pairedCount(c, S.edgeSlots(n));
      console.log('  edges fail at', pc + '/12', 'centers', centersOk(n, c), Date.now() - t1, 'ms', e.message);
      result.error = e.message;
    }
  } catch (e) {
    console.error('  stage fail', e && e.message || e);
    result.error = e && e.message ? e.message : String(e);
  }
  result.ms = Date.now() - t0;
  return result;
}

async function testFull(n, seed, moves) {
  if (!globalThis.Cube || typeof globalThis.Cube.initSolver !== 'function') {
    console.log(n + 'x' + n, 'seed', seed, 'full skip (no cubejs)');
    return { seed, ok: false, skipped: true, ms: 0 };
  }
  const { arr } = S.scrambleArr(n, moves, mulberry32(seed));
  const t0 = Date.now();
  try {
    const sol = await S.solveNxN(n, arr);
    const ms = Date.now() - t0;
    const ok = S.isSolvedArr(arr);
    console.log(n + 'x' + n, 'seed', seed, 'full', sol.length, 'solved', ok, ms, 'ms');
    return { seed, ok, ms };
  } catch (e) {
    const ms = Date.now() - t0;
    console.log(n + 'x' + n, 'seed', seed, 'full fail', ms, 'ms', e && e.message || e);
    return { seed, ok: false, ms, error: e && e.message ? e.message : String(e) };
  }
}

(async function main() {
  console.log('moves 2'); testMoves(2);
  console.log('moves 3'); testMoves(3);
  console.log('moves 4'); testMoves(4);
  console.log('moves 5'); testMoves(5);
  test2();
  await testStage(4, 7);
  await testFull(4, 7, 28);

  const seeds5 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  let pass5 = 0;
  const fail5 = [];
  for (let i = 0; i < seeds5.length; i++) {
    const r = await testFull(5, seeds5[i], 40);
    if (r.ok && !r.skipped && r.ms <= 60000) pass5++;
    else if (!r.skipped) fail5.push(r);
  }
  console.log('5x5 full pass', pass5 + '/' + seeds5.length);
  if (pass5 < 3) {
    console.error('5x5 expected at least 3/10 full solves', fail5.map(f => f.seed + ':' + (f.error || 'slow')).join(' '));
    process.exitCode = 1;
  }
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
