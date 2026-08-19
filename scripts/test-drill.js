const fs = require('fs');
const vm = require('vm');
const g = { console, setTimeout, clearTimeout };
vm.runInNewContext(fs.readFileSync('vendor/cube.js', 'utf8'), g);
vm.runInNewContext(fs.readFileSync('f2l-cases.js', 'utf8'), g);
vm.runInNewContext(fs.readFileSync('oll-cases-data.js', 'utf8'), g);
vm.runInNewContext(fs.readFileSync('oll-cases.js', 'utf8'), g);
vm.runInNewContext(fs.readFileSync('pll-cases-data.js', 'utf8'), g);
vm.runInNewContext(fs.readFileSync('pll-cases.js', 'utf8'), g);
vm.runInNewContext(fs.readFileSync('cube-drill.js', 'utf8'), g);

const Cube = g.Cube;
const F = g.CubeF2L;
const O = g.CubeOLL;
const P = g.CubePLL;

let fail = 0;
function ok(cond, msg) {
  if (!cond) {
    fail++;
    console.log('FAIL', msg);
  }
}

function roundTrip(lib, c) {
  const cube = new Cube();
  const inv = lib.toCubejsAlg(lib.invertAlg(c.alg));
  const fwd = lib.toCubejsAlg(c.alg);
  try {
    cube.move(inv);
    cube.move(fwd);
  } catch (e) {
    ok(false, c.id + ' cube.js move failed ' + e.message);
    return;
  }
  ok(cube.isSolved(), c.id + ' inverse+alg not solved ' + cube.asString());
}

ok(F.cases.length === 41, 'f2l count ' + F.cases.length);
ok(O.cases.length === 57, 'oll count ' + O.cases.length);
ok(P.cases.length === 21, 'pll count ' + P.cases.length);

F.cases.forEach(c => roundTrip(F, c));
O.cases.forEach(c => roundTrip(O, c));
P.cases.forEach(c => roundTrip(P, c));

ok(typeof g.CubeDrill.create === 'function', 'CubeDrill.create');

const fakeEngine = {
  isSolved: () => false,
  stats: { moveCount: 0 },
  reset() {},
  playAlg() {},
  whenIdle() { return Promise.resolve(); },
};
const drill = g.CubeDrill.create({
  engine: fakeEngine,
  invertAlg: s => s,
  casesOf: set => (set === 'pll' ? P.cases : []),
  titleOf: c => c.title.en,
  t: k => k,
  toast() {},
});
drill.start('pll');
ok(drill.isActive() && drill.currentSet() === 'pll', 'start pll');
drill.close();
ok(!drill.isActive(), 'close');

if (fail) {
  console.log('failures', fail);
  process.exit(1);
}
console.log('ok', F.cases.length, 'f2l', O.cases.length, 'oll', P.cases.length, 'pll');
