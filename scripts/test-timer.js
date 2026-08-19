// node scripts/test-timer.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
eval(fs.readFileSync(path.join(root, 'cube-timer.js'), 'utf8'));
eval(fs.readFileSync(path.join(root, 'cube-solver.js'), 'utf8'));

const T = globalThis.CubeTimer;
const S = globalThis.CubeSolver;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(T.formatClock(0) === '0.00', '0.00');
assert(T.formatClock(12340) === '12.34', '12.34');
assert(T.formatClock(12349) === '12.34', 'truncate hundredths');
assert(T.formatClock(60000) === '1:00.00', 'one minute');
assert(T.formatEntry({ ms: 12340, penalty: 0 }) === '12.34', 'clean single');
assert(T.formatEntry({ ms: 12340, penalty: 2 }) === '12.34+', 'plus2 display');
assert(T.formatEntry({ ms: 12340, penalty: 'DNF' }) === 'DNF', 'dnf display');
assert(T.formatAvg(null) === '—', 'empty avg');

const five = [10000, 11000, 12000, 13000, 14000].map(ms => ({ ms, penalty: 0 }));
assert(T.averageOf(five, 5) === 12000, 'ao5 drop best+worst');
assert(T.averageOf(five, 12) === null, 'ao12 needs 12');
assert(T.pbOf(five) === 10000, 'pb');

const plus = five.map((e, i) => (i === 4 ? { ms: 14000, penalty: 2 } : e));
// 10, 11, 12, 13, 16(+2). drop 10 and 16, avg 11/12/13 = 12.00
assert(T.averageOf(plus, 5) === 12000, 'ao5 with +2 as worst');

const oneDnf = five.map((e, i) => (i === 4 ? { ms: 14000, penalty: 'DNF' } : e));
assert(T.averageOf(oneDnf, 5) === 12000, 'one DNF is dropped as worst');

const twoDnf = five.map((e, i) => (i < 2 ? { ms: 9000, penalty: 'DNF' } : e));
assert(T.averageOf(twoDnf, 5) === 'DNF', 'two DNF make ao5 DNF');

assert(T.inspectPenalty(14999) === 0, 'under 15s');
assert(T.inspectPenalty(15000) === 0, 'at 15s still ok');
assert(T.inspectPenalty(15001) === 2, '+2 after 15s');
assert(T.inspectPenalty(17000) === 2, 'at 17s still +2');
assert(T.inspectPenalty(17001) === 'DNF', 'DNF after 17s');
assert(T.inspectMark(8000) === 'warn', '8s mark');
assert(T.inspectMark(12000) === 'late', '12s mark');

function noSameFace(toks) {
  let prev = '';
  for (let i = 0; i < toks.length; i++) {
    const face = toks[i].replace(/[2']/g, '').replace(/^[23]/, '');
    if (face === prev) return false;
    prev = face;
  }
  return true;
}

assert(S.scrambleCount(2) === 11, '2x2 length');
assert(S.scrambleCount(3) === 25, '3x3 fallback length');
assert(S.scrambleCount(4) === 40, '4x4 length');
assert(S.scrambleCount(5) === 60, '5x5 length');

[2, 3, 4, 5].forEach(n => {
  const toks = S.scrambleMoves(n);
  assert(toks.length === S.scrambleCount(n), n + 'x' + n + ' token count');
  assert(noSameFace(toks), n + 'x' + n + ' same-face repeat');
  assert(toks.some(t => t.endsWith('2') || t.endsWith("'") || /^[UDRLFB]/.test(t)), n + ' suffixes');
});

const s2 = S.scramble(2);
assert(typeof s2 === 'string' && s2.split(/\s+/).length === 11, 'scramble 2x2 string');

console.log('timer + scramble ok');
