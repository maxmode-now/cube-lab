const fs = require('fs');
eval(fs.readFileSync(require('path').join(__dirname, '..', 'cube-solver.js'), 'utf8'));
const S = globalThis.CubeSolver._test;
const n = 4;
const a = S.solvedArr(n);
function face(arr, f) {
  const n2 = 16, base = f * n2, ix = [];
  for (let r = 1; r < 3; r++) for (let c = 1; c < 3; c++) ix.push(base + r * 4 + c);
  return ix.map(i => arr[i]).join('');
}
const algs = [
  ['2R', 'U', "2R'"],
  ['2R', 'U2', "2R'"],
  ['2R', 'U', "2R'", "U'"],
  ['2R', 'U2', "2R'", 'U2'],
  ['2R2', 'U', '2R2'],
  ['2R2', 'U', '2R2', "U'"],
  ['Rw', 'U', "Rw'", "U'"],
  ['Rw', 'U2', "Rw'"],
  ['2R', 'D', "2R'"],
  ['2R', 'D2', "2R'"],
  ['2R', 'D', "2R'", "D'"],
  ['2F', 'U', "2F'", "U'"],
  ['2R', 'U', '2L', "U'", "2R'", 'U', "2L'", "U'"],
];
algs.forEach(alg => {
  const c = a.slice();
  S.applyAlg(n, c, alg);
  const uok = S.faceCentersSolved(c, n, 0);
  const dok = S.faceCentersSolved(c, n, 3);
  const same = ['U','R','F','D','L','B'].every(f => face(c, 'URFDLB'.indexOf(f)) === face(a, 'URFDLB'.indexOf(f)));
  console.log(alg.join(' '), 'U', face(c, 0), 'D', face(c, 3), 'F', face(c, 2), 'uok', uok, 'dok', dok, 'id', same);
});
