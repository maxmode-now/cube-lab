const fs = require('fs');
const path = require('path');

eval(fs.readFileSync(path.join(__dirname, '..', 'cube-scan.js'), 'utf8'));
const CS = globalThis.CubeScan;

if (!CS) throw new Error('CubeScan not found (cube-scan.js did not load).');

let ok = true;
function assert(cond, msg) {
  if (!cond) {
    ok = false;
    console.error('FAIL:', msg);
  }
}

// nextColor(null) should be a safe guard value
assert(CS.nextColor(null) === 'U', 'nextColor(null) returns U');

// emptyFaces(n) should seed nulls only
{
  const n = 3;
  const faces = CS.emptyFaces(n);
  const need = n * n;
  CS.FACE_ORDER.forEach(f => {
    assert(Array.isArray(faces[f]), `faces[${f}] exists`);
    assert(faces[f].length === need, `faces[${f}] length is ${need}`);
    assert(faces[f].every(x => x === null), `faces[${f}] are all null initially`);
  });
}

// Paint-seeded partial face should not validate
{
  const n = 3;
  const faces = CS.emptyFaces(n);
  const mid = CS.centerIndex(n);
  faces.U[mid] = 'U'; // fixed center seed only
  assert(!faces.U.every(Boolean), 'partial face: every(Boolean) is false');
  const v = CS.validateCube(faces, n);
  assert(!v.ok, 'validateCube fails for partial painting');
}

// Fully painted-by-color (not necessarily physically solvable) passes validateCube checks
{
  const n = 3;
  const faces = CS.emptyFaces(n);
  CS.FACE_ORDER.forEach(f => { faces[f] = Array(n * n).fill(f); });
  const v = CS.validateCube(faces, n);
  assert(v.ok, 'validateCube passes for full single-color faces (counts + centers)');
}

// Even N: validateCube should not require fixed centers
{
  const n = 4;
  const faces = CS.emptyFaces(n);
  CS.FACE_ORDER.forEach(f => { faces[f] = Array(n * n).fill(f); });
  const v = CS.validateCube(faces, n);
  assert(v.ok, 'validateCube passes for even N full single-color faces');
}

if (!ok) process.exit(1);
console.log('test-scan-paint: OK');

