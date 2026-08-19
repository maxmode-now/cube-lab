const fs = require('fs');
eval(fs.readFileSync(require('path').join(__dirname, '..', 'cube-solver.js'), 'utf8'));
const S = globalThis.CubeSolver._test;
const n = 4;
const a = S.solvedArr(n);
const slots = S.edgeSlots(n);
console.log('solved paired', S.pairedCount(a, slots), '/', slots.length);
slots.forEach((s, i) => {
  console.log(i, 'a', s.a.map(x => a[x]).join(''), 'b', s.b.map(x => a[x]).join(''), 'ok', S.slotPaired ? S.slotPaired(a, s) : (s.a.every((x, j, arr) => a[x] === a[s.a[0]]) && s.b.every(x => a[x] === a[s.b[0]])));
});
