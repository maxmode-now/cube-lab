const fs = require('fs');
eval(fs.readFileSync(require('path').join(__dirname, '..', 'cube-solver.js'), 'utf8'));
const S = globalThis.CubeSolver._test;
const n = 4;
const a = S.solvedArr(n);
function uc(arr, face) {
  const n2 = 16, base = face * n2, ix = [];
  for (let r = 1; r < 3; r++) for (let c = 1; c < 3; c++) ix.push(base + r * 4 + c);
  return ix.map(i => arr[i]).join('');
}
console.log('solved U', uc(a, 0), 'D', uc(a, 3));
['F', 'R', '2U', '2D', '2R', 'U'].forEach(tok => {
  const c = a.slice();
  S.applyName(n, c, tok);
  console.log(tok, 'U', uc(c, 0), 'D', uc(c, 3), 'Uok', S.faceCentersSolved(c, n, 0), 'Dok', S.faceCentersSolved(c, n, 3));
});
const c = a.slice();
S.applyAlg(n, c, ['2R', 'U', "2R'", "U'"]);
console.log('comm U', uc(c, 0), 'D', uc(c, 3), S.faceCentersSolved(c, n, 0), S.faceCentersSolved(c, n, 3));
