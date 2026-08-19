// 큐브 솔버. 3×3은 cubejs(Kociemba). 2×2는 코너 IDA*. 4×4/5×5는 리덕션 후 3×3.
// classic script (file:// 가능). DOM/엔진 없음.
(function (g) {
  'use strict';

  const FACE = 'URFDLB';
  const permCache = {};
  const moveNameCache = {};
  let kociembaReady = false;
  let yieldFn = null;
  let lastYieldAt = 0;
  let deadlineAt = 0;
  function setYield(fn, maxMs) {
    yieldFn = fn || null;
    lastYieldAt = Date.now();
    deadlineAt = maxMs ? Date.now() + maxMs : 0;
  }
  function checkDeadline() {
    if (deadlineAt && Date.now() > deadlineAt) throw new Error('timeout');
  }
  function maybeYield() {
    checkDeadline();
    if (!yieldFn) return null;
    const now = Date.now();
    if (now - lastYieldAt < 50) return null;
    lastYieldAt = now;
    return yieldFn();
  }

  function Cube() {
    return g.Cube;
  }

  function init() {
    if (kociembaReady) return;
    const C = Cube();
    if (!C || typeof C.initSolver !== 'function') {
      throw new Error('cubejs not loaded');
    }
    C.initSolver();
    kociembaReady = true;
  }

  function needsKociemba(n) {
    return n !== 2;
  }

  function parseMoves(sol) {
    return (sol || '').trim().split(/\s+/).filter(Boolean);
  }

  function invTok(tok) {
    if (tok.endsWith('2')) return tok;
    if (tok.endsWith("'")) return tok.slice(0, -1);
    return tok + "'";
  }

  function invAlg(toks) {
    const out = [];
    for (let i = toks.length - 1; i >= 0; i--) out.push(invTok(toks[i]));
    return out;
  }

  function rot90(v, axis, dir) {
    const x = v[0], y = v[1], z = v[2];
    if (axis === 0) return dir > 0 ? [x, -z, y] : [x, z, -y];
    if (axis === 1) return dir > 0 ? [z, y, -x] : [-z, y, x];
    return dir > 0 ? [-y, x, z] : [y, -x, z];
  }

  function specFor(n) {
    const O = (n - 1) / 2;
    const s = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) s.push({ p: [c - O, O, r - O], nrm: [0, 1, 0] });
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) s.push({ p: [O, O - r, O - c], nrm: [1, 0, 0] });
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) s.push({ p: [c - O, O - r, O], nrm: [0, 0, 1] });
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) s.push({ p: [c - O, -O, O - r], nrm: [0, -1, 0] });
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) s.push({ p: [-O, O - r, c - O], nrm: [-1, 0, 0] });
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) s.push({ p: [O - c, O - r, -O], nrm: [0, 0, -1] });
    return s;
  }

  function keyOf(p, nrm) {
    return [p[0], p[1], p[2], nrm[0], nrm[1], nrm[2]].map(v => Math.round(v * 2)).join(',');
  }

  function moveDefs(n) {
    const outer = (n - 1) / 2;
    const defs = {
      U: { axis: 1, layers: [outer], dir: -1 },
      D: { axis: 1, layers: [-outer], dir: 1 },
      R: { axis: 0, layers: [outer], dir: -1 },
      L: { axis: 0, layers: [-outer], dir: 1 },
      F: { axis: 2, layers: [outer], dir: -1 },
      B: { axis: 2, layers: [-outer], dir: 1 },
    };
    if (n >= 4) {
      const inner = outer - 1;
      defs['2U'] = { axis: 1, layers: [inner], dir: -1 };
      defs['2D'] = { axis: 1, layers: [-inner], dir: 1 };
      defs['2R'] = { axis: 0, layers: [inner], dir: -1 };
      defs['2L'] = { axis: 0, layers: [-inner], dir: 1 };
      defs['2F'] = { axis: 2, layers: [inner], dir: -1 };
      defs['2B'] = { axis: 2, layers: [-inner], dir: 1 };
      defs.Uw = { axis: 1, layers: [outer, inner], dir: -1 };
      defs.Dw = { axis: 1, layers: [-outer, -inner], dir: 1 };
      defs.Rw = { axis: 0, layers: [outer, inner], dir: -1 };
      defs.Lw = { axis: 0, layers: [-outer, -inner], dir: 1 };
      defs.Fw = { axis: 2, layers: [outer, inner], dir: -1 };
      defs.Bw = { axis: 2, layers: [-outer, -inner], dir: 1 };
      if (n >= 5) {
        defs['3U'] = { axis: 1, layers: [0], dir: -1 };
        defs['3D'] = { axis: 1, layers: [0], dir: 1 };
        defs['3R'] = { axis: 0, layers: [0], dir: -1 };
        defs['3L'] = { axis: 0, layers: [0], dir: 1 };
        defs['3F'] = { axis: 2, layers: [0], dir: -1 };
        defs['3B'] = { axis: 2, layers: [0], dir: 1 };
        defs['3Uw'] = { axis: 1, layers: [outer, inner, 0], dir: -1 };
        defs['3Dw'] = { axis: 1, layers: [-outer, -inner, 0], dir: 1 };
        defs['3Rw'] = { axis: 0, layers: [outer, inner, 0], dir: -1 };
        defs['3Lw'] = { axis: 0, layers: [-outer, -inner, 0], dir: 1 };
        defs['3Fw'] = { axis: 2, layers: [outer, inner, 0], dir: -1 };
        defs['3Bw'] = { axis: 2, layers: [-outer, -inner, 0], dir: 1 };
      }
    }
    return defs;
  }

  function layerHit(val, layers) {
    const a = Math.round(val * 2);
    for (let i = 0; i < layers.length; i++) {
      if (Math.round(layers[i] * 2) === a) return true;
    }
    return false;
  }

  function buildPerm(n, spec, def) {
    const idx = {};
    for (let i = 0; i < spec.length; i++) idx[keyOf(spec[i].p, spec[i].nrm)] = i;
    const perm = new Int16Array(spec.length);
    for (let i = 0; i < spec.length; i++) {
      const st = spec[i];
      let p = st.p, nrm = st.nrm;
      if (layerHit(p[def.axis], def.layers)) {
        p = rot90(p, def.axis, def.dir);
        nrm = rot90(nrm, def.axis, def.dir);
      }
      const j = idx[keyOf(p, nrm)];
      if (j == null) throw new Error('perm miss ' + n + ' ' + i);
      perm[j] = i;
    }
    return perm;
  }

  function tablesFor(n) {
    if (permCache[n]) return permCache[n];
    const spec = specFor(n);
    const defs = moveDefs(n);
    const perms = {};
    const names = [];
    Object.keys(defs).forEach(name => {
      const p = buildPerm(n, spec, defs[name]);
      perms[name] = p;
      names.push(name);
      const p2 = new Int16Array(p.length);
      const p3 = new Int16Array(p.length);
      for (let i = 0; i < p.length; i++) p2[i] = p[p[i]];
      for (let i = 0; i < p.length; i++) p3[i] = p[p2[i]];
      perms[name + '2'] = p2;
      perms[name + "'"] = p3;
      names.push(name + '2', name + "'");
    });
    permCache[n] = { perms, names, spec };
    moveNameCache[n] = names;
    return permCache[n];
  }

  function cloneArr(a) {
    return a instanceof Uint8Array ? new Uint8Array(a) : a.slice();
  }

  const applyScratch = {};
  function applyName(n, arr, name) {
    const p = tablesFor(n).perms[name];
    if (!p) return arr;
    const len = p.length;
    let src = applyScratch[n];
    if (!src || src.length !== len) src = applyScratch[n] = new Uint8Array(len);
    for (let i = 0; i < len; i++) src[i] = arr[i];
    for (let i = 0; i < len; i++) arr[i] = src[p[i]];
    return arr;
  }

  function applyAlg(n, arr, toks) {
    for (let i = 0; i < toks.length; i++) applyName(n, arr, toks[i]);
    return arr;
  }

  function solvedArr(n) {
    const a = [];
    const n2 = n * n;
    for (let f = 0; f < 6; f++) for (let i = 0; i < n2; i++) a.push(f);
    return a;
  }

  function parseFacelets(facelets) {
    const n = Math.round(Math.sqrt(facelets.length / 6));
    const a = [];
    for (let i = 0; i < facelets.length; i++) {
      const k = FACE.indexOf(facelets[i]);
      if (k < 0) return null;
      a.push(k);
    }
    return { n, a };
  }

  function toStr(arr) {
    let s = '';
    for (let i = 0; i < arr.length; i++) s += FACE[arr[i]];
    return s;
  }

  function isSolvedArr(arr) {
    const n2 = arr.length / 6;
    for (let f = 0; f < 6; f++) {
      const b = f * n2;
      for (let i = 0; i < n2; i++) if (arr[b + i] !== f) return false;
    }
    return true;
  }

  function faceOf(tok) {
    return tok.replace(/[2']/g, '').replace(/^[23]/, '');
  }

  function simplify(toks) {
    const out = [];
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (!t) continue;
      if (!out.length) { out.push(t); continue; }
      const prev = out[out.length - 1];
      if (faceOf(prev) !== faceOf(t)) { out.push(t); continue; }
      const amt = x => x.endsWith('2') ? 2 : x.endsWith("'") ? 3 : 1;
      const sum = (amt(prev) + amt(t)) & 3;
      out.pop();
      if (sum === 0) continue;
      const base = prev.replace(/[2']+$/, '');
      out.push(sum === 1 ? base : sum === 2 ? base + '2' : base + "'");
    }
    return out;
  }

  function scrambleArr(n, count, rng) {
    const names = Object.keys(moveDefs(n));
    const arr = solvedArr(n);
    const toks = [];
    let last = '';
    rng = rng || Math.random;
    for (let i = 0; i < count; i++) {
      let name = names[Math.floor(rng() * names.length)];
      for (let t = 0; t < 8 && faceOf(name) === last; t++) name = names[Math.floor(rng() * names.length)];
      last = faceOf(name);
      const suff = rng() < 0.33 ? '2' : rng() < 0.5 ? "'" : '';
      const tok = name + suff;
      applyName(n, arr, tok);
      toks.push(tok);
    }
    return { arr, toks };
  }

  // ── 2×2: 코너 퍼뮤테이션 + 오리엔테이션 IDA* ──
  const C2 = [
    [3, 4, 9], [2, 8, 17], [0, 16, 21], [1, 20, 5],
    [13, 11, 6], [12, 19, 10], [14, 23, 18], [15, 7, 22],
  ];
  const C2_SOLVED = ['012', '024', '045', '051', '321', '342', '354', '315'];
  let pdb2 = null;
  let mv2 = null;

  function cubieId2(cols) {
    const key = [cols[0], cols[1], cols[2]].slice().sort().join('');
    for (let i = 0; i < 8; i++) {
      const s = C2_SOLVED[i];
      const sk = [s[0], s[1], s[2]].map(Number).sort().join('');
      if (sk === key) return i;
    }
    return -1;
  }

  function readCorners2(arr) {
    const cp = new Array(8), co = new Array(8);
    for (let i = 0; i < 8; i++) {
      const cols = [arr[C2[i][0]], arr[C2[i][1]], arr[C2[i][2]]];
      const id = cubieId2(cols);
      let ori = 0;
      for (let k = 0; k < 3; k++) if (cols[k] === 0 || cols[k] === 3) { ori = k; break; }
      cp[i] = id;
      co[i] = ori;
    }
    return { cp, co };
  }

  function packCp(cp) {
    let n = 0;
    const used = [0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 8; i++) used[cp[i]] = 1;
    for (let i = 0; i < 8; i++) {
      let k = 0;
      for (let j = 0; j < cp[i]; j++) if (!used[j]) k++;
      // factorial number system from remaining
    }
    // simpler: base-8 digits (unique)
    let x = 0;
    for (let i = 0; i < 8; i++) x = x * 8 + cp[i];
    return x;
  }

  function packCo(co) {
    let x = 0;
    for (let i = 0; i < 7; i++) x = x * 3 + co[i];
    return x;
  }

  function applyCornerMove(st, m) {
    const cp = new Array(8), co = new Array(8);
    for (let i = 0; i < 8; i++) {
      cp[i] = st.cp[m.cp[i]];
      co[i] = (st.co[m.cp[i]] + m.co[i]) % 3;
    }
    return { cp, co };
  }

  function build2x2() {
    if (mv2) return;
    tablesFor(2);
    const names = ['U', "U'", 'U2', 'R', "R'", 'R2', 'F', "F'", 'F2', 'D', "D'", 'D2', 'L', "L'", 'L2', 'B', "B'", 'B2'];
    const solved = solvedArr(2);
    const id = readCorners2(solved);
    mv2 = names.map(name => {
      const a = solved.slice();
      applyName(2, a, name);
      const st = readCorners2(a);
      const cp = [], co = [];
      for (let i = 0; i < 8; i++) {
        cp[i] = st.cp[i];
        co[i] = (st.co[i] - id.co[i] + 3) % 3;
      }
      return { name, cp, co };
    });

    const NCP = 8 * 8 * 8 * 8 * 8 * 8 * 8 * 8;
    const coDist = new Int8Array(2187);
    coDist.fill(-1);
    coDist[0] = 0;
    const q = [0];
    for (let qi = 0; qi < q.length; qi++) {
      const v = q[qi];
      const co = [];
      let x = v;
      for (let i = 6; i >= 0; i--) { co[i] = x % 3; x = (x / 3) | 0; }
      co[7] = (3 - (co[0] + co[1] + co[2] + co[3] + co[4] + co[5] + co[6]) % 3) % 3;
      const st0 = { cp: [0, 1, 2, 3, 4, 5, 6, 7], co };
      for (let m = 0; m < mv2.length; m++) {
        const st = applyCornerMove(st0, mv2[m]);
        const k = packCo(st.co);
        if (coDist[k] < 0) { coDist[k] = coDist[v] + 1; q.push(k); }
      }
    }

    const cpDist = new Map();
    cpDist.set(packCp([0, 1, 2, 3, 4, 5, 6, 7]), 0);
    const cq = [[0, 1, 2, 3, 4, 5, 6, 7]];
    for (let qi = 0; qi < cq.length; qi++) {
      const cp = cq[qi];
      const st0 = { cp, co: [0, 0, 0, 0, 0, 0, 0, 0] };
      const d = cpDist.get(packCp(cp));
      for (let m = 0; m < mv2.length; m++) {
        const st = applyCornerMove(st0, mv2[m]);
        const k = packCp(st.cp);
        if (!cpDist.has(k)) { cpDist.set(k, d + 1); cq.push(st.cp); }
      }
    }
    pdb2 = { coDist, cpDist };
  }

  function solve2(arr) {
    build2x2();
    const start = readCorners2(arr);
    if (start.cp.every((v, i) => v === i) && start.co.every(v => v === 0)) return [];
    const faces = mv2.map(m => m.name.replace(/[2']/g, ''));
    let found = null;
    function h(st) {
      const a = pdb2.coDist[packCo(st.co)] || 0;
      const b = pdb2.cpDist.get(packCp(st.cp));
      return Math.max(a, b == null ? 0 : b);
    }
    function ida(st, depth, lastFace, path) {
      if (found) return;
      const d = h(st);
      if (d > depth) return;
      if (d === 0) { found = path.slice(); return; }
      for (let m = 0; m < mv2.length; m++) {
        const f = faces[m];
        if (f === lastFace) continue;
        path.push(mv2[m].name);
        ida(applyCornerMove(st, mv2[m]), depth - 1, f, path);
        path.pop();
        if (found) return;
      }
    }
    for (let depth = h(start); depth <= 14 && !found; depth++) ida(start, depth, '', []);
    return found || [];
  }

  // ── 3×3 Kociemba ──
  function solve3str(facelets) {
    if (!facelets || facelets.length !== 54) return '';
    const C = Cube();
    if (!C || typeof C.fromString !== 'function') return '';
    const c = C.fromString(facelets);
    if (c.isSolved()) return '';
    return c.solve() || '';
  }

  // ── NxN 리덕션 ──
  function centerIdxs(n, face) {
    const n2 = n * n, base = face * n2, out = [];
    for (let r = 1; r < n - 1; r++) for (let c = 1; c < n - 1; c++) out.push(base + r * n + c);
    return out;
  }

  function allCenters(n) {
    const out = [];
    for (let f = 0; f < 6; f++) out.push.apply(out, centerIdxs(n, f));
    return out;
  }

  function colorPosKey(arr, idxs, color) {
    let s = '';
    for (let i = 0; i < idxs.length; i++) if (arr[idxs[i]] === color) s += idxs[i] + ',';
    return s;
  }

  function faceCentersSolved(arr, n, face) {
    const idxs = centerIdxs(n, face);
    for (let i = 0; i < idxs.length; i++) if (arr[idxs[i]] !== face) return false;
    return true;
  }

  function basicMoveNames(n) {
    const names = [];
    const faces = n >= 5
      ? ['U', 'D', 'R', 'L', 'F', 'B', '2U', '2D', '2R', '2L', '2F', '2B', '3U', '3D', '3R', '3L', '3F', '3B']
      : n >= 4
        ? ['U', 'D', 'R', 'L', 'F', 'B', '2U', '2D', '2R', '2L', '2F', '2B']
        : ['U', 'D', 'R', 'L', 'F', 'B'];
    for (let i = 0; i < faces.length; i++) names.push(faces[i], faces[i] + "'", faces[i] + '2');
    return names;
  }

  async function bfsCenters(n, arr, color, targetFace, moveList, limit, preserveFaces) {
    preserveFaces = preserveFaces || [];
    function ok(a) {
      if (!faceCentersSolved(a, n, targetFace)) return false;
      for (let i = 0; i < preserveFaces.length; i++) {
        if (!faceCentersSolved(a, n, preserveFaces[i])) return false;
      }
      return true;
    }
    function hash(a) {
      const idxs = allCenters(n);
      if (!preserveFaces.length) return colorPosKey(a, idxs, color);
      let s = colorPosKey(a, idxs, color);
      for (let p = 0; p < preserveFaces.length; p++) {
        const ix = centerIdxs(n, preserveFaces[p]);
        for (let j = 0; j < ix.length; j++) s += a[ix[j]];
      }
      return s;
    }
    if (ok(arr)) return [];
    const qA = [cloneArr(arr)];
    const qP = [[]];
    const seen = new Set([hash(arr)]);
    let qi = 0;
    const cap = limit || 80000;
    while (qi < qA.length && qi < cap) {
      const y = maybeYield();
      if (y) await y;
      const cur = qA[qi];
      const path = qP[qi++];
      for (let m = 0; m < moveList.length; m++) {
        const tok = moveList[m];
        if (typeof tok === 'string' && path.length && faceOf(path[path.length - 1]) === faceOf(tok)) continue;
        const nxt = cloneArr(cur);
        if (Array.isArray(tok)) applyAlg(n, nxt, tok);
        else applyName(n, nxt, tok);
        const k = hash(nxt);
        if (seen.has(k)) continue;
        seen.add(k);
        const np = path.concat(Array.isArray(tok) ? tok : [tok]);
        if (ok(nxt)) return np;
        if (qA.length < cap) {
          qA.push(nxt);
          qP.push(np);
        }
      }
    }
    return null;
  }

  function sliceNames(n) {
    return n >= 5 ? ['2R', '2L', '2F', '2B', '3R', '3L', '3F', '3B'] : ['2R', '2L', '2F', '2B'];
  }

  function preserveUMoves(n) {
    const out = [];
    const faces = ['U', 'D', 'R', 'L', 'F', 'B', '2U', '2D'];
    if (n >= 5) faces.push('3U', '3D');
    for (let i = 0; i < faces.length; i++) out.push(faces[i], faces[i] + "'", faces[i] + '2');
    sliceNames(n).forEach(s => {
      ['D', "D'", 'D2'].forEach(d => {
        out.push([s, d, invTok(s)]);
        out.push([s, d, invTok(s), invTok(d)]);
      });
    });
    if (n >= 5) {
      const dSlices = ['2D', '3D', "2D'", "3D'", '2D2', '3D2'];
      const sides = ['F', 'R', 'B', 'L'];
      dSlices.forEach(s => {
        sides.forEach(d => {
          ['', "'", '2'].forEach(suf => out.push([s, d + suf, invTok(s)]));
        });
      });
    }
    return out;
  }

  function midIdx(n, face) {
    return face * n * n + ((n * n / 2) | 0);
  }

  const CUBE_X = ['R', '2R', '3R', "2L'", "L'"];
  const CUBE_XP = ["R'", "2R'", "3R'", '2L', 'L'];
  const CUBE_Z = ['F', '2F', '3F', "2B'", "B'"];
  const CUBE_ZP = ["F'", "2F'", "3F'", '2B', 'B'];
  const CUBE_Y = ['U', '2U', '3U', "2D'", "D'"];
  const CUBE_YP = ["U'", "2U'", "3U'", '2D', 'D'];
  const CUBE_Y2 = ['U2', '2U2', '3U2', '2D2', 'D2'];
  const CUBE_X2 = ['R2', '2R2', '3R2', '2L2', 'L2'];

  function bringCenterToU(n, arr, color) {
    let at = 0;
    for (let f = 0; f < 6; f++) if (arr[midIdx(n, f)] === color) { at = f; break; }
    const alg = at === 0 ? [] : at === 3 ? CUBE_X2 : at === 2 ? CUBE_X : at === 5 ? CUBE_XP : at === 1 ? CUBE_ZP : CUBE_Z;
    if (alg.length) applyAlg(n, arr, alg);
    return alg.slice();
  }

  function preserveUDMoves(n) {
    const out = [];
    const faces = ['U', 'D', 'R', 'L', 'F', 'B', '2U', '2D'];
    if (n >= 5) faces.push('3U', '3D');
    for (let i = 0; i < faces.length; i++) out.push(faces[i], faces[i] + "'", faces[i] + '2');
    if (n >= 5) {
      const slices = ['2U', '2D', '3U', '3D', "2U'", "2D'", "3U'"];
      const sides = ['F', 'R', 'B', 'L'];
      slices.forEach(s => {
        sides.forEach(d => {
          ['', "'", '2'].forEach(suf => {
            const t = d + suf;
            out.push([s, t, invTok(s)]);
            out.push([s, t, invTok(s), invTok(t)]);
          });
        });
      });
    }
    return out;
  }

  function lastFourCenterMoves(n) {
    const out = [];
    if (n >= 5) {
      const slices = ['2U', '2D', '3U', '3D', "2U'", "2D'", "3U'", "3D'", '2U2', '2D2', '3U2'];
      const sides = ['F', 'R', 'B', 'L'];
      slices.forEach(s => {
        sides.forEach(d => {
          ['', "'", '2'].forEach(suf => {
            const t = d + suf;
            out.push([s, t, invTok(s)]);
          });
        });
      });
      const deep = ['2R', '2L', '2F', '2B', '3R', '3L', '3F', '3B'];
      const mids = ['2U2', '2D2', '3U2', '2U', "2U'"];
      deep.forEach(s => mids.forEach(u => out.push([s + '2', u, s + '2'])));
    }
    const faces = ['U', 'D', 'R', 'L', 'F', 'B', '2U', '2D'];
    if (n >= 5) faces.push('3U', '3D');
    for (let i = 0; i < faces.length; i++) out.push(faces[i], faces[i] + "'", faces[i] + '2');
    return out;
  }

  function subsetCount(arr, idxs, color) {
    let c = 0;
    for (let i = 0; i < idxs.length; i++) if (arr[idxs[i]] === color) c++;
    return c;
  }

  function plusIdxs(n, face) {
    const n2 = n * n, base = face * n2, mid = (n - 1) / 2, out = [];
    for (let r = 1; r < n - 1; r++) for (let c = 1; c < n - 1; c++) {
      if (r === mid && c === mid) continue;
      if (r === mid || c === mid) out.push(base + r * n + c);
    }
    return out;
  }

  function xIdxs(n, face) {
    const n2 = n * n, base = face * n2, mid = (n - 1) / 2, out = [];
    for (let r = 1; r < n - 1; r++) for (let c = 1; c < n - 1; c++) {
      if (r !== mid && c !== mid) out.push(base + r * n + c);
    }
    return out;
  }

  function lastFourPlusMoves5() {
    const out = [];
    const slices = ['2U', '2D', '3U', '3D', "2U'", "2D'", "3U'", "3D'"];
    const sides = ['F', 'R', 'B', 'L'];
    slices.forEach(s => sides.forEach(d => {
      ['', "'", '2'].forEach(suf => out.push([s, d + suf, invTok(s)]));
    }));
    return out;
  }

  function lastFourXMoves5() {
    const out = [];
    const slices = ['2R', '2L', '2F', '2B', '3R', '3L', '3F', '3B'];
    const mids = ['2U2', '2D2', '3U2', '2U', "2U'", '2D', "2D'"];
    slices.forEach(s => mids.forEach(u => out.push([s + '2', u, s + '2'])));
    const uSlices = ['2U2', '2D2', '3U2'];
    const sides = ['F', 'R', 'B', 'L'];
    uSlices.forEach(s => sides.forEach(d => {
      ['', "'", '2'].forEach(suf => out.push([s, d + suf, s]));
    }));
    return out;
  }

  function faceCenterCount(arr, n, face) {
    const idxs = centerIdxs(n, face);
    let c = 0;
    for (let i = 0; i < idxs.length; i++) if (arr[idxs[i]] === face) c++;
    return c;
  }

  function searchImproveFace(n, arr, face, moveList, maxLen, preserveFaces, idxs, holdIdxs) {
    preserveFaces = preserveFaces || [];
    idxs = idxs || centerIdxs(n, face);
    const start = subsetCount(arr, idxs, face);
    const need = idxs.length;
    if (start === need) return [];
    const holdSnap = holdIdxs ? holdIdxs.map(i => arr[i]) : null;
    let found = null;
    const path = [];
    let nodes = 0;
    const budget = 80000;
    function okPreserve() {
      for (let i = 0; i < preserveFaces.length; i++) {
        if (!faceCentersSolved(arr, n, preserveFaces[i])) return false;
      }
      if (holdSnap) {
        for (let i = 0; i < holdIdxs.length; i++) if (arr[holdIdxs[i]] !== holdSnap[i]) return false;
      }
      return true;
    }
    function dfs(remain, last) {
      if (found) return;
      if (++nodes > budget) return;
      if ((nodes & 4095) === 0) checkDeadline();
      if (path.length && subsetCount(arr, idxs, face) > start && okPreserve()) {
        found = path.slice();
        return;
      }
      if (remain === 0) return;
      for (let m = 0; m < moveList.length; m++) {
        const tok = moveList[m];
        if (typeof tok === 'string') {
          if (last && faceOf(tok) === last) continue;
          applyName(n, arr, tok);
          path.push(tok);
          dfs(remain - 1, faceOf(tok));
          path.pop();
          applyName(n, arr, invTok(tok));
        } else {
          applyAlg(n, arr, tok);
          for (let i = 0; i < tok.length; i++) path.push(tok[i]);
          dfs(remain - 1, '');
          for (let i = 0; i < tok.length; i++) path.pop();
          applyAlg(n, arr, invAlg(tok));
        }
        if (found) return;
      }
    }
    for (let d = 1; d <= maxLen && !found; d++) dfs(d, '');
    return found;
  }

  async function fillFaceGreedy(n, arr, face, moveList, maxd, preserveFaces, idxs, holdIdxs) {
    const out = [];
    idxs = idxs || centerIdxs(n, face);
    const need = idxs.length;
    for (let t = 0; t < need + 12 && subsetCount(arr, idxs, face) < need; t++) {
      const y = maybeYield();
      if (y) await y;
      const seq = searchImproveFace(n, arr, face, moveList, maxd, preserveFaces, idxs, holdIdxs);
      if (!seq) break;
      applyAlg(n, arr, seq);
      out.push.apply(out, seq);
    }
    return out;
  }

  function preserveOk(arr, n, faces) {
    for (let i = 0; i < faces.length; i++) {
      if (!faceCentersSolved(arr, n, faces[i])) return false;
    }
    return true;
  }

  async function fillFace5(n, arr, face, moveList, maxd, preserve, label) {
    const out = [];
    out.push.apply(out, await fillFaceGreedy(n, arr, face, moveList, maxd, preserve));
    const kicks = [];
    if (preserve.length) {
      if (preserve.length === 1) {
        kicks.push(CUBE_Y, CUBE_YP, CUBE_Y2);
      }
      moveList.forEach(t => { if (Array.isArray(t)) kicks.push(t); });
    } else {
      ['2R', '2U', '2F', '3U', 'R', 'F', 'D', '2L', '2B'].forEach(f => {
        kicks.push(f, f + "'", f + '2');
        kicks.push([f, 'U'], [f, "U'"], [f, 'U2'], [f, 'D'], [f, "D'"]);
      });
    }
    let ki = 0;
    while (!faceCentersSolved(arr, n, face) && faceCenterCount(arr, n, face) < 8 && ki < kicks.length && ki < 24) {
      const y = maybeYield();
      if (y) await y;
      const k = kicks[ki++];
      const snap = cloneArr(arr);
      const before = faceCenterCount(arr, n, face);
      if (typeof k === 'string') applyName(n, arr, k);
      else applyAlg(n, arr, k);
      if (!preserveOk(arr, n, preserve)) {
        for (let i = 0; i < snap.length; i++) arr[i] = snap[i];
        continue;
      }
      const more = await fillFaceGreedy(n, arr, face, moveList, maxd, preserve);
      if (faceCenterCount(arr, n, face) > before) {
        if (typeof k === 'string') out.push(k);
        else out.push.apply(out, k);
        out.push.apply(out, more);
      } else {
        for (let i = 0; i < snap.length; i++) arr[i] = snap[i];
      }
    }
    const left = faceCenterCount(arr, n, face);
    if (!faceCentersSolved(arr, n, face) && (left >= 8 || preserve.length < 2)) {
      const small = [];
      ['U', 'D', 'R', 'L', 'F', 'B', '2R', '2U', '2F', '2L', '2D', '2B'].forEach(f => small.push(f, f + "'", f + '2'));
      if (n >= 5 && !preserve.length) ['3R', '3U', '3F'].forEach(f => small.push(f, f + "'", f + '2'));
      const comms = moveList.filter(t => Array.isArray(t));
      const finishList = preserve.length >= 2
        ? lastFourPlusMoves5().concat(lastFourXMoves5())
        : preserve.length && comms.length ? comms.concat(small) : small;
      const b = await bfsCenters(n, arr, face, face, finishList, 40000, preserve);
      if (b) {
        applyAlg(n, arr, b);
        out.push.apply(out, b);
      }
    }
    if (!faceCentersSolved(arr, n, face)) throw new Error('centers: ' + label);
    return out;
  }

  async function solveCenters(n, arr) {
    const moves = [];
    if (n >= 5) {
      moves.push.apply(moves, bringCenterToU(n, arr, 0));
      moves.push.apply(moves, await fillFace5(n, arr, 0, basicMoveNames(n), 3, [], 'white'));
      moves.push.apply(moves, await fillFace5(n, arr, 3, preserveUMoves(n), 3, [0], 'yellow'));
      const sideMoves = lastFourCenterMoves(n);
      const sideOrders = [[2, 5, 4, 1], [1, 2, 5, 4]];
      const snap = cloneArr(arr);
      let bestMoves = null;
      for (let oi = 0; oi < sideOrders.length; oi++) {
        if (oi) {
          for (let i = 0; i < snap.length; i++) arr[i] = snap[i];
        }
        const order = sideOrders[oi];
        const sideToks = [];
        const preserved = [0, 3];
        let ok = true;
        try {
          for (let i = 0; i < order.length; i++) {
            const f = order[i];
            if (faceCentersSolved(arr, n, f)) {
              preserved.push(f);
              continue;
            }
            sideToks.push.apply(sideToks, await fillFace5(n, arr, f, sideMoves, 2, preserved, FACE[f]));
            preserved.push(f);
          }
        } catch (e) {
          ok = false;
        }
        if (ok && [0, 1, 2, 3, 4, 5].every(fc => faceCentersSolved(arr, n, fc))) {
          bestMoves = sideToks;
          break;
        }
      }
      if (!bestMoves) throw new Error('centers: last faces');
      moves.push.apply(moves, bestMoves);
      return moves;
    }

    const first = await bfsCenters(n, arr, 0, 0, basicMoveNames(n), 80000, []);
    if (!first) throw new Error('centers: white');
    applyAlg(n, arr, first);
    moves.push.apply(moves, first);

    const safeUD = preserveUDMoves(n);
    const yellow = await bfsCenters(n, arr, 3, 3, preserveUMoves(n), 80000, [0]);
    if (!yellow) throw new Error('centers: yellow');
    applyAlg(n, arr, yellow);
    moves.push.apply(moves, yellow);

    const sides = [2, 5, 4, 1];
    const preserved = [0, 3];
    for (let i = 0; i < sides.length; i++) {
      const f = sides[i];
      if (faceCentersSolved(arr, n, f)) { preserved.push(f); continue; }
      const seq = await bfsCenters(n, arr, f, f, safeUD, 80000, preserved);
      if (!seq) throw new Error('centers: face ' + FACE[f]);
      applyAlg(n, arr, seq);
      moves.push.apply(moves, seq);
      preserved.push(f);
    }
    if (![0, 1, 2, 3, 4, 5].every(f => faceCentersSolved(arr, n, f))) throw new Error('centers: last faces');
    return moves;
  }

  function edgeSlots(n) {
    const spec = tablesFor(n).spec;
    const n2 = n * n;
    const byPos = {};
    for (let i = 0; i < spec.length; i++) {
      const k = spec[i].p.map(v => Math.round(v * 2)).join(',');
      if (!byPos[k]) byPos[k] = [];
      byPos[k].push(i);
    }
    const groups = {};
    Object.keys(byPos).forEach(k => {
      const g = byPos[k];
      if (g.length !== 2) return;
      const f0 = (g[0] / n2) | 0, f1 = (g[1] / n2) | 0;
      const key = f0 < f1 ? f0 + '-' + f1 : f1 + '-' + f0;
      const a = f0 < f1 ? g[0] : g[1];
      const b = f0 < f1 ? g[1] : g[0];
      if (!groups[key]) groups[key] = { a: [], b: [], ps: [] };
      groups[key].a.push(a);
      groups[key].b.push(b);
      groups[key].ps.push(spec[a].p);
    });
    const keys = Object.keys(groups);
    keys.sort();
    return keys.map(key => {
      const g = groups[key];
      const order = g.ps.map((p, i) => ({ i, t: p[0] * 4 + p[1] * 2 + p[2] }));
      order.sort((x, y) => x.t - y.t);
      return {
        a: order.map(o => g.a[o.i]),
        b: order.map(o => g.b[o.i]),
      };
    });
  }

  function slotPaired(arr, slot) {
    const a0 = arr[slot.a[0]], b0 = arr[slot.b[0]];
    for (let i = 1; i < slot.a.length; i++) if (arr[slot.a[i]] !== a0) return false;
    for (let i = 1; i < slot.b.length; i++) if (arr[slot.b[i]] !== b0) return false;
    return true;
  }

  function pairedCount(arr, slots) {
    let c = 0;
    for (let i = 0; i < slots.length; i++) if (slotPaired(arr, slots[i])) c++;
    return c;
  }

  const L2E4 = ["Uw", "R", "U", "R'", "Uw'"];
  const FLIP4 = ['R', 'U', "R'", 'F', "R'", "F'", 'R'];
  const L2E4B = ["Rw", 'U2', "Rw'", 'U2', "Rw'", 'F', 'Rw', "F'"];
  const L2E4C = ['2R2', 'B2', 'U2', '2L', 'U2', "2R'", 'U2', '2R', 'U2', 'F2', '2R', 'F2', "2L'", 'B2', '2R2'];
  const L2E5 = ['Rw', 'U2', 'Rw', 'U2', 'F2', 'Rw', 'F2', "3Rw'", 'U2', 'Rw', 'U2', "Rw'", 'U2', 'F2', "Rw'", 'F2', '3Rw'];
  const OLL_PARITY = ["2R'", 'U2', '2L', 'F2', "2L'", 'F2', '2R2', 'U2', '2R', 'U2', "2R'", 'U2', 'F2', '2R2', 'F2'];
  const PLL_PARITY = ['2R2', 'U2', '2R2', 'Uw2', '2R2', 'Uw2'];

  function pairMoves(n) {
    const out = [];
    ['U', 'D', 'R', 'L', 'F', 'B'].forEach(f => out.push(f, f + "'", f + '2'));
    return out;
  }

  const PAIR_UW = ["Uw'", 'R', 'U', "R'", 'F', "R'", "F'", 'R', 'Uw'];
  const PAIR_DW = ['Dw', 'R', "F'", 'U', "R'", 'F', "Dw'"];
  const L2E_WIDE = ['Rw2', 'B2', 'U2', 'Lw', 'U2', "Rw'", 'U2', 'Rw', 'U2', 'F2', 'Rw', 'F2', "Lw'", 'B2', 'Rw2'];

  function pairMacros(n, late) {
    const m = [
      L2E4, invAlg(L2E4),
      ["Uw'", 'R', 'U', "R'", 'Uw'],
      ['Uw', 'R', "U'", "R'", "Uw'"],
      ['Rw', 'U', "R'", "U'", "Rw'"],
      ["Rw'", "U'", 'R', 'U', 'Rw'],
    ];
    if (n >= 5) {
      m.push(
        ["3Uw", 'R', 'U', "R'", "3Uw'"],
        ["3Uw'", 'R', "U'", "R'", '3Uw'],
        ['3Rw', 'U', "R'", "U'", "3Rw'"],
        ["3Rw'", "U'", 'R', 'U', '3Rw'],
        ["2U'", 'R', 'U', "R'", '2U'],
        ['2U', 'R', "U'", "R'", "2U'"],
        ['2R', 'U', "R'", "U'", "2R'"],
        ["2R'", "U'", 'R', 'U', '2R'],
        ["3U'", 'R', 'U', "R'", '3U'],
        ['3U', 'R', "U'", "R'", "3U'"],
        ['3R', 'U', "R'", "U'", "3R'"],
        ["3R'", "U'", 'R', 'U', '3R']
      );
    }
    if (late) {
      m.push(PAIR_UW, invAlg(PAIR_UW), PAIR_DW, invAlg(PAIR_DW), L2E4C, invAlg(L2E4C), L2E_WIDE, invAlg(L2E_WIDE));
      if (n === 4) m.push(PLL_PARITY, invAlg(PLL_PARITY));
      if (n >= 5) {
        m.push(
          L2E5, invAlg(L2E5),
          ["3Uw'", 'R', 'U', "R'", 'F', "R'", "F'", 'R', '3Uw'],
          ['3Uw', 'R', "U'", "R'", 'F', "R'", "F'", 'R', "3Uw'"],
          ["2U'", 'R', 'U', "R'", 'F', "R'", "F'", 'R', '2U'],
          ['2U', 'R', "U'", "R'", 'F', "R'", "F'", 'R', "2U'"],
          ["3U'", 'R', 'U', "R'", 'F', "R'", "F'", 'R', '3U'],
          ['3U', 'R', "U'", "R'", 'F', "R'", "F'", 'R', "3U'"]
        );
      }
    }
    return m;
  }

  function wingId(c1, c2) {
    return c1 < c2 ? c1 * 6 + c2 : c2 * 6 + c1;
  }

  function findUnpairedGroup(arr, slots) {
    const groups = {};
    for (let si = 0; si < slots.length; si++) {
      const s = slots[si];
      for (let i = 0; i < s.a.length; i++) {
        const id = wingId(arr[s.a[i]], arr[s.b[i]]);
        if (!groups[id]) groups[id] = [];
        groups[id].push({ si, i });
      }
    }
    const need = slots[0].a.length;
    const ids = Object.keys(groups);
    for (let k = 0; k < ids.length; k++) {
      const g = groups[ids[k]];
      if (g.length !== need) continue;
      const same = g.every(p => p.si === g[0].si);
      if (same && slotPaired(arr, slots[g[0].si])) continue;
      return g;
    }
    return null;
  }

  function groupTogether(arr, slots, group) {
    const si = group[0].si;
    return group.every(p => p.si === si);
  }

  async function bfsPairGroup(n, arr, slots, group, limit) {
    const s0 = slots[group[0].si];
    const tid = wingId(arr[s0.a[group[0].i]], arr[s0.b[group[0].i]]);
    const need = group.length;
    const startC = pairedCount(arr, slots);
    function together(a) {
      const sis = [];
      for (let si = 0; si < slots.length; si++) {
        const s = slots[si];
        for (let i = 0; i < s.a.length; i++) {
          if (wingId(a[s.a[i]], a[s.b[i]]) === tid) sis.push(si);
        }
      }
      return sis.length === need && sis.every(x => x === sis[0]) && slotPaired(a, slots[sis[0]]) && pairedCount(a, slots) > startC;
    }
    function gkey(a) {
      const loc = [];
      for (let si = 0; si < slots.length; si++) {
        const s = slots[si];
        for (let i = 0; i < s.a.length; i++) {
          if (wingId(a[s.a[i]], a[s.b[i]]) === tid) loc.push(si + ':' + i + ':' + a[s.a[i]] + a[s.b[i]]);
        }
      }
      loc.sort();
      return loc.join(',');
    }
    if (together(arr)) return [];
    const names = pairMoves(n);
    const qA = [cloneArr(arr)];
    const qP = [[]];
    const seen = new Set([gkey(arr)]);
    let qi = 0;
    const cap = limit || 40000;
    while (qi < qA.length && qi < cap) {
      const y = maybeYield();
      if (y) await y;
      const cur = qA[qi];
      const path = qP[qi++];
      for (let m = 0; m < names.length; m++) {
        const tok = names[m];
        if (path.length && faceOf(path[path.length - 1]) === faceOf(tok)) continue;
        const nxt = cloneArr(cur);
        applyName(n, nxt, tok);
        const k = gkey(nxt);
        if (seen.has(k)) continue;
        seen.add(k);
        const np = path.concat([tok]);
        if (together(nxt)) return np;
        if (qA.length < cap) { qA.push(nxt); qP.push(np); }
      }
      const macros = pairMacros(n, startC >= 8);
      for (let i = 0; i < macros.length; i++) {
        const nxt = cloneArr(cur);
        applyAlg(n, nxt, macros[i]);
        const k = gkey(nxt);
        if (seen.has(k)) continue;
        seen.add(k);
        const np = path.concat(macros[i]);
        if (together(nxt)) return np;
        if (qA.length < cap) { qA.push(nxt); qP.push(np); }
      }
    }
    return null;
  }

  function allUnpairedGroups(arr, slots) {
    const groups = {};
    for (let si = 0; si < slots.length; si++) {
      const s = slots[si];
      for (let i = 0; i < s.a.length; i++) {
        const id = wingId(arr[s.a[i]], arr[s.b[i]]);
        if (!groups[id]) groups[id] = [];
        groups[id].push({ si, i });
      }
    }
    const need = slots[0].a.length;
    const out = [];
    const ids = Object.keys(groups);
    for (let k = 0; k < ids.length; k++) {
      const g = groups[ids[k]];
      if (g.length !== need) continue;
      const same = g.every(p => p.si === g[0].si);
      if (same && slotPaired(arr, slots[g[0].si])) continue;
      out.push(g);
    }
    return out;
  }

  async function bfsPairOne(n, arr, slots, limit) {
    const groups = allUnpairedGroups(arr, slots);
    for (let i = 0; i < groups.length; i++) {
      const seq = await bfsPairGroup(n, arr, slots, groups[i], limit);
      if (seq && seq.length) return seq;
    }
    return null;
  }

  async function solveLastEdges(n, arr, slots) {
    const need = slots.length;
    const startC = pairedCount(arr, slots);
    if (startC === need) return [];
    function ekey(a) {
      let s = '';
      for (let i = 0; i < slots.length; i++) {
        const sl = slots[i];
        for (let j = 0; j < sl.a.length; j++) s += a[sl.a[j]] + '' + a[sl.b[j]] + ',';
      }
      return s;
    }
    const names = pairMoves(n);
    const macros = pairMacros(n, true);
    function tryMacros(a, path) {
      for (let i = 0; i < macros.length; i++) {
        const nxt = cloneArr(a);
        applyAlg(n, nxt, macros[i]);
        if (pairedCount(nxt, slots) === need) return path.concat(macros[i]);
      }
      return null;
    }
    const hit = tryMacros(arr, []);
    if (hit) return hit;
    const qA = [cloneArr(arr)];
    const qP = [[]];
    const seen = new Set([ekey(arr)]);
    let qi = 0;
    const cap = n >= 5 ? 20000 : 8000;
    while (qi < qA.length && qi < cap) {
      const y = maybeYield();
      if (y) await y;
      const cur = qA[qi];
      const path = qP[qi++];
      if (path.length > 10) continue;
      for (let m = 0; m < names.length; m++) {
        const tok = names[m];
        if (path.length && faceOf(path[path.length - 1]) === faceOf(tok)) continue;
        const nxt = cloneArr(cur);
        applyName(n, nxt, tok);
        const k = ekey(nxt);
        if (seen.has(k)) continue;
        seen.add(k);
        const np = path.concat([tok]);
        const solved = tryMacros(nxt, np);
        if (solved) return solved;
        if (qA.length < cap) {
          qA.push(nxt);
          qP.push(np);
        }
      }
    }
    return null;
  }

  function slotLayer(n, slot) {
    const p = tablesFor(n).spec[slot.a[0]].p;
    const o = (n - 1) / 2;
    if (Math.abs(Math.abs(p[1]) - o) < 1e-6) return p[1] > 0 ? 'U' : 'D';
    return 'E';
  }

  async function storePairsUD(n, arr, slots) {
    function score(a) {
      let s = 0;
      for (let i = 0; i < slots.length; i++) {
        if (!slotPaired(a, slots[i])) continue;
        const ly = slotLayer(n, slots[i]);
        if (ly === 'U' || ly === 'D') s++;
      }
      return s;
    }
    const start = score(arr);
    if (start >= 8) return [];
    const names = [];
    ['U', 'D', 'R', 'L', 'F', 'B'].forEach(f => names.push(f, f + "'", f + '2'));
    function h(a) {
      let s = '';
      for (let i = 0; i < slots.length; i++) s += slotPaired(a, slots[i]) ? slotLayer(n, slots[i]) : '-';
      return s;
    }
    const qA = [cloneArr(arr)];
    const qP = [[]];
    const seen = new Set([h(arr)]);
    let qi = 0;
    while (qi < qA.length && qi < 20000) {
      const y = maybeYield();
      if (y) await y;
      const cur = qA[qi];
      const path = qP[qi++];
      if (score(cur) > start && score(cur) >= Math.min(8, pairedCount(cur, slots))) {
        if (score(cur) >= 8 || score(cur) > start) {
          // keep searching for 8
        }
      }
      if (score(cur) >= 8) return path;
      for (let m = 0; m < names.length; m++) {
        const nxt = cloneArr(cur);
        applyName(n, nxt, names[m]);
        const k = h(nxt);
        if (seen.has(k)) continue;
        seen.add(k);
        qA.push(nxt);
        qP.push(path.concat([names[m]]));
      }
    }
    return null;
  }

  function centersStillSolved(n, arr) {
    for (let f = 0; f < 6; f++) if (!faceCentersSolved(arr, n, f)) return false;
    return true;
  }

  async function bfsImprovePairs(n, arr, slots, limit) {
    const start = pairedCount(arr, slots);
    const startProg = n >= 5 ? edgesProgress(arr, slots) : start;
    const need = slots.length;
    if (start === need) return [];
    function ekey(a) {
      let s = '';
      for (let i = 0; i < slots.length; i++) {
        const sl = slots[i];
        for (let j = 0; j < sl.a.length; j++) s += a[sl.a[j]] + '' + a[sl.b[j]] + ',';
      }
      return s;
    }
    function better(a) {
      const pc = pairedCount(a, slots);
      if (pc === need) return true;
      if (n >= 5 && start >= 8) return pc > start && (n < 5 || centersStillSolved(n, a));
      if (n >= 5) return (pc > start || edgesProgress(a, slots) > startProg) && centersStillSolved(n, a);
      return pc > start;
    }
    const names = pairMoves(n);
    const macros = pairMacros(n, n >= 5 || start >= 8);
    for (let i = 0; i < macros.length; i++) {
      const nxt = cloneArr(arr);
      applyAlg(n, nxt, macros[i]);
      if (better(nxt) && (n < 5 || centersStillSolved(n, nxt))) return macros[i].slice();
    }
    const qA = [cloneArr(arr)];
    const qP = [[]];
    const seen = new Set([ekey(arr)]);
    let qi = 0;
    const cap = limit || 80000;
    while (qi < qA.length && qi < cap) {
      const y = maybeYield();
      if (y) await y;
      const cur = qA[qi];
      const path = qP[qi++];
      if (path.length > 12) continue;
      for (let i = 0; i < macros.length; i++) {
        const nxt = cloneArr(cur);
        applyAlg(n, nxt, macros[i]);
        if (better(nxt) && (n < 5 || centersStillSolved(n, nxt))) return path.concat(macros[i]);
      }
      for (let m = 0; m < names.length; m++) {
        const tok = names[m];
        if (path.length && faceOf(path[path.length - 1]) === faceOf(tok)) continue;
        const nxt = cloneArr(cur);
        applyName(n, nxt, tok);
        const k = ekey(nxt);
        if (seen.has(k)) continue;
        seen.add(k);
        qA.push(nxt);
        qP.push(path.concat([tok]));
      }
    }
    return null;
  }

  function slotProgress(arr, slot) {
    if (slotPaired(arr, slot)) return slot.a.length;
    const counts = {};
    let best = 1;
    for (let i = 0; i < slot.a.length; i++) {
      const id = wingId(arr[slot.a[i]], arr[slot.b[i]]);
      counts[id] = (counts[id] || 0) + 1;
      if (counts[id] > best) best = counts[id];
    }
    return best;
  }

  function edgesProgress(arr, slots) {
    let s = 0;
    for (let i = 0; i < slots.length; i++) s += slotProgress(arr, slots[i]);
    return s;
  }

  async function pairEdges(n, arr) {
    const slots = edgeSlots(n);
    const moves = [];
    const need = slots.length;
    if (n >= 5) {
      for (let i = 0; i < 12 && pairedCount(arr, slots) < 8; i++) {
        const seq = await bfsPairOne(n, arr, slots, 3000)
          || await bfsImprovePairs(n, arr, slots, 1500);
        if (!seq || !seq.length) break;
        applyAlg(n, arr, seq);
        moves.push.apply(moves, seq);
        if (!centersStillSolved(n, arr)) throw new Error('edge pairing: centers');
      }
      if (pairedCount(arr, slots) < need) {
        const seq = await bfsImprovePairs(n, arr, slots, 3000)
          || await solveLastEdges(n, arr, slots);
        if (seq && seq.length) {
          applyAlg(n, arr, seq);
          moves.push.apply(moves, seq);
        }
      }
      for (let i = 0; i < 8 && pairedCount(arr, slots) < need; i++) {
        const pc = pairedCount(arr, slots);
        const seq = (pc >= 10 ? await solveLastEdges(n, arr, slots) : null)
          || await bfsImprovePairs(n, arr, slots, 4000)
          || await solveLastEdges(n, arr, slots);
        if (!seq || !seq.length) break;
        applyAlg(n, arr, seq);
        moves.push.apply(moves, seq);
        if (!centersStillSolved(n, arr)) throw new Error('edge pairing: centers');
      }
      if (pairedCount(arr, slots) < need) throw new Error('edge pairing');
      if (!centersStillSolved(n, arr)) throw new Error('edge pairing: centers');
      return moves;
    }
    for (let i = 0; i < 16 && pairedCount(arr, slots) < 8; i++) {
      const seq = await bfsPairOne(n, arr, slots, 40000);
      if (!seq || !seq.length) break;
      applyAlg(n, arr, seq);
      moves.push.apply(moves, seq);
    }
    const stored = await storePairsUD(n, arr, slots);
    if (stored && stored.length) {
      applyAlg(n, arr, stored);
      moves.push.apply(moves, stored);
    }
    for (let i = 0; i < 16 && pairedCount(arr, slots) < need; i++) {
      const pc = pairedCount(arr, slots);
      const seq = (pc >= 8 ? await solveLastEdges(n, arr, slots) : null)
        || await bfsImprovePairs(n, arr, slots, 40000)
        || await solveLastEdges(n, arr, slots);
      if (!seq || !seq.length) break;
      applyAlg(n, arr, seq);
      moves.push.apply(moves, seq);
    }
    if (pairedCount(arr, slots) < need) throw new Error('edge pairing');
    if (!centersStillSolved(n, arr)) throw new Error('edge pairing: centers');
    return moves;
  }

  function midEdge(n, strip) {
    return strip[(strip.length / 2) | 0];
  }

  function to3x3(n, arr) {
    const n2 = n * n;
    let s = '';
    const slots = edgeSlots(n);
    const edgeOnFace = [];
    for (let f = 0; f < 6; f++) edgeOnFace[f] = { t: null, r: null, b: null, l: null };
    const map = [
      ['t', 0, 'a'], ['b', 2, 'a'], ['l', 3, 'a'], ['r', 1, 'a'],
      ['t', 1, 'b'], ['b', 5, 'b'], ['l', 8, 'b'], ['r', 10, 'b'],
      ['t', 0, 'b'], ['b', 4, 'b'], ['l', 9, 'a'], ['r', 8, 'a'],
      ['t', 4, 'a'], ['b', 6, 'a'], ['l', 7, 'a'], ['r', 5, 'a'],
      ['t', 3, 'b'], ['b', 7, 'b'], ['l', 11, 'b'], ['r', 9, 'b'],
      ['t', 2, 'b'], ['b', 6, 'b'], ['l', 10, 'a'], ['r', 11, 'a'],
    ];
    // Fallback: sample edge mids directly from faces (more reliable than the map)
    function faceEdge(f, side) {
      const b = f * n2;
      if (side === 't') return arr[b + midEdge(n, Array.from({ length: n - 2 }, (_, i) => i + 1))];
      if (side === 'b') return arr[b + (n - 1) * n + midEdge(n, Array.from({ length: n - 2 }, (_, i) => i + 1))];
      if (side === 'l') return arr[b + midEdge(n, Array.from({ length: n - 2 }, (_, i) => i + 1)) * n];
      return arr[b + midEdge(n, Array.from({ length: n - 2 }, (_, i) => i + 1)) * n + (n - 1)];
    }
    for (let f = 0; f < 6; f++) {
      const b = f * n2;
      const tl = arr[b];
      const tr = arr[b + n - 1];
      const bl = arr[b + (n - 1) * n];
      const br = arr[b + n * n - 1];
      const ctr = n % 2 === 1 ? arr[b + ((n * n) / 2) | 0] : arr[b + n + 1];
      s += FACE[tl] + FACE[faceEdge(f, 't')] + FACE[tr];
      s += FACE[faceEdge(f, 'l')] + FACE[ctr] + FACE[faceEdge(f, 'r')];
      s += FACE[bl] + FACE[faceEdge(f, 'b')] + FACE[br];
    }
    return s;
  }

  function tryKociemba(facelets) {
    try {
      init();
      if (!legal3(facelets)) return null;
      return solve3str(facelets) || '';
    } catch (e) {
      return null;
    }
  }

  function legal3(str) {
    const C = Cube();
    if (!C || typeof C.fromString !== 'function') return false;
    try {
      const c = C.fromString(str);
      if (new Set(c.ep).size !== 12 || new Set(c.cp).size !== 8) return false;
      let eo = 0, co = 0, ep = 0, cp = 0;
      for (let i = 0; i < 12; i++) eo += c.eo[i];
      for (let i = 0; i < 8; i++) co += c.co[i];
      for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) if (c.ep[i] > c.ep[j]) ep++;
      for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) if (c.cp[i] > c.cp[j]) cp++;
      return eo % 2 === 0 && co % 3 === 0 && ep % 2 === cp % 2;
    } catch (e) {
      return false;
    }
  }

  function solveReduced(n, arr) {
    if (isSolvedArr(arr)) return [];
    const attempts = n === 4
      ? [[], OLL_PARITY, PLL_PARITY, OLL_PARITY.concat(PLL_PARITY)]
      : [[], OLL_PARITY];
    for (let i = 0; i < attempts.length; i++) {
      const cpy = arr.slice();
      applyAlg(n, cpy, attempts[i]);
      const f = to3x3(n, cpy);
      const sol = tryKociemba(f);
      if (sol == null) continue;
      const toks = parseMoves(sol);
      applyAlg(n, cpy, toks);
      if (!isSolvedArr(cpy)) continue;
      applyAlg(n, arr, attempts[i]);
      applyAlg(n, arr, toks);
      return attempts[i].concat(toks);
    }
    throw new Error('reduced 3×3');
  }

  async function solveNxN(n, arr) {
    const work = arr instanceof Uint8Array ? arr : Uint8Array.from(arr);
    const moves = [];
    moves.push.apply(moves, await solveCenters(n, work));
    moves.push.apply(moves, await pairEdges(n, work));
    moves.push.apply(moves, solveReduced(n, work));
    const out = simplify(moves);
    if (work !== arr) for (let i = 0; i < work.length; i++) arr[i] = work[i];
    if (!isSolvedArr(arr)) throw new Error('nxn: not solved');
    return out;
  }

  function solve(facelets, n) {
    const parsed = parseFacelets(facelets);
    if (!parsed) return '';
    if (n == null) n = parsed.n;
    if (n !== parsed.n) return '';
    if (isSolvedArr(parsed.a)) return '';
    if (n === 2) return solve2(parsed.a).join(' ');
    if (n === 3) {
      init();
      return solve3str(facelets);
    }
    if (n === 4 || n === 5) {
      return Promise.resolve(solveNxN(n, parsed.a)).then(toks => toks.join(' '));
    }
    return '';
  }

  g.CubeSolver = {
    init, solve, parseMoves, needsKociemba, setYield,
    _test: { tablesFor, applyName, applyAlg, solvedArr, scrambleArr, isSolvedArr, solve2, solveNxN, solveCenters, pairEdges, to3x3, parseFacelets, pairedCount, edgeSlots, faceCentersSolved, slotPaired, findUnpairedGroup, searchImproveFace, lastFourCenterMoves, fillFaceGreedy, faceCenterCount, preserveUMoves, basicMoveNames, bfsCenters, plusIdxs, xIdxs },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
