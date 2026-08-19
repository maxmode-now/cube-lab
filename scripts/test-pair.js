const fs = require('fs');
eval(fs.readFileSync(require('path').join(__dirname, '..', 'cube-solver.js'), 'utf8'));
const S = globalThis.CubeSolver._test;
function mulberry32(a) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function wingId(c1, c2) { return c1 < c2 ? c1 * 6 + c2 : c2 * 6 + c1; }
const n = 4;
const { arr } = S.scrambleArr(n, 28, mulberry32(7));
S.solveCenters(n, arr).then(() => S.pairEdges(n, arr)).catch(e => console.log(e.message)).then(() => {
const slots = S.edgeSlots(n);
console.log('paired', S.pairedCount(arr, slots));
slots.forEach((s, i) => {
  if (S.slotPaired(arr, s)) return;
  const wings = s.a.map((ai, j) => arr[ai] + '' + arr[s.b[j]]);
  console.log('unpaired slot', i, wings.join(' '), 'ids', s.a.map((ai, j) => wingId(arr[ai], arr[s.b[j]])).join(','));
});
const algs = {
  L2E4: ["Uw", "R", "U", "R'", "Uw'"],
  FLIP: ['R', 'U', "R'", 'F', "R'", "F'", 'R'],
  B: ["Rw", 'U2', "Rw'", 'U2', "Rw'", 'F', 'Rw', "F'"],
  C: ['2R2', 'B2', 'U2', '2L', 'U2', "2R'", 'U2', '2R', 'U2', 'F2', '2R', 'F2', "2L'", 'B2', '2R2'],
};
Object.keys(algs).forEach(name => {
  const c = arr.slice();
  S.applyAlg(n, c, algs[name]);
  console.log(name, S.pairedCount(c, slots));
});
['U', 'R', 'F', 'Uw', '2R'].forEach(s => {
  const c = arr.slice();
  S.applyName(n, c, s);
  S.applyAlg(n, c, algs.L2E4);
  console.log('setup', s, S.pairedCount(c, slots));
});
});

