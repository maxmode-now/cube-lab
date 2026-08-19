// node scripts/test-beginner.js
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'cube-solver.js'), 'utf8');
eval(src);
const beg = fs.readFileSync(path.join(__dirname, '..', 'beginner-solver.js'), 'utf8');
eval(beg);

const S = globalThis.CubeSolver._test;
const B = globalThis.CubeBeginner;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function mulberry32(a) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function testXyz() {
  [2, 3, 4, 5].forEach(n => {
    const a = S.solvedArr(n);
    S.applyAlg(n, a, ['x', 'x', 'x', 'x']);
    assert(S.isSolvedArr(a), n + ' x4');
    const b = S.solvedArr(n);
    S.applyAlg(n, b, ['y', "y'"]);
    assert(S.isSolvedArr(b), n + " y y'");
    const c = S.solvedArr(n);
    S.applyAlg(n, c, ['x2', 'x2']);
    assert(S.isSolvedArr(c), n + ' x2 x2');
  });
}

function faceletsOf(arr) {
  return globalThis.CubeSolver.toStr(arr);
}

function testSolved() {
  [2, 3].forEach(n => {
    const r = B.solve(faceletsOf(S.solvedArr(n)), n);
    assert(!r.error, 'solved error ' + n + ' ' + r.error);
    assert(r.toks.length === 0, 'solved toks ' + n);
  });
}

function join(toks) { return toks.join(' '); }

function testN(n, seeds, moves) {
  for (let i = 0; i < seeds; i++) {
    const { arr } = S.scrambleArr(n, moves, mulberry32(2000 + n * 100 + i));
    const facelets = faceletsOf(arr);
    const r = B.solve(facelets, n);
    assert(!r.error, n + 'x' + n + ' seed ' + i + ' error=' + r.error + ' scramble=' + facelets);
    const a = arr.slice();
    S.applyAlg(n, a, r.toks);
    assert(B.isUniform(a), n + 'x' + n + ' seed ' + i + ' not uniform sol=' + join(r.toks));
    const covered = r.chunks.reduce((s, c) => s + c.len, 0);
    assert(covered === r.toks.length, n + ' chunk cover ' + i);
  }
}

function testLessonAlgs() {
  const lesson = {
    4: "F R U R' U' F'",
    5: "R U R' U R U2 R'",
    6: "U R U' L' U R' U' L",
    7: "R U' R U R U R U' R' U' R2",
  };
  const extra = {
    4: [],
    5: ["R U2 R' U' R U' R'"],
    6: [
      "R U R' F' R U R' U' R' F R2 U' R' U'",
      "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    ],
    7: [],
  };
  for (let i = 0; i < 8; i++) {
    const { arr } = S.scrambleArr(3, 20, mulberry32(9000 + i));
    const r = B.solve(faceletsOf(arr), 3);
    assert(!r.error, 'lesson seed ' + i + ' ' + r.error);
    r.chunks.forEach(ch => {
      if (ch.lessonIdx < 4 || !ch.alg) return;
      const slice = r.toks.slice(ch.start, ch.start + ch.len).join(' ');
      const allowed = [lesson[ch.lessonIdx]].concat(extra[ch.lessonIdx] || []);
      const ok = allowed.some(a => slice.indexOf(a) >= 0)
        || /^[Uxyz2' ]+$/.test(slice);
      assert(ok, 'lesson alg idx ' + ch.lessonIdx + ' got ' + slice);
    });
  }
}

testXyz();
testSolved();
testN(3, 10, 20);
testN(2, 10, 11);
testLessonAlgs();
console.log('beginner ok');
