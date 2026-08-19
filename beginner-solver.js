// 초보자법(LBL) 솔버. 레슨과 같은 공식으로 2×2·3×3을 푼다.
// classic script. CubeSolver(parseFacelets / applyName / colorAt)에 의존.
(function (g) {
  'use strict';

  const FACE = 'URFDLB';
  const NRM = {
    U: [0, 1, 0], D: [0, -1, 0],
    R: [1, 0, 0], L: [-1, 0, 0],
    F: [0, 0, 1], B: [0, 0, -1],
  };
  const SIDES = ['F', 'R', 'B', 'L'];
  const U_CORNERS = ['UFR', 'URB', 'UBL', 'ULF'];
  const D_CORNERS = ['DFR', 'DRB', 'DBL', 'DLF'];
  const SLOT_FACES = {
    UFR: ['U', 'F', 'R'], URB: ['U', 'R', 'B'], UBL: ['U', 'B', 'L'], ULF: ['U', 'L', 'F'],
    DFR: ['D', 'F', 'R'], DRB: ['D', 'R', 'B'], DBL: ['D', 'B', 'L'], DLF: ['D', 'L', 'F'],
  };
  const EDGE_SLOTS = [
    ['U', 'F'], ['U', 'R'], ['U', 'B'], ['U', 'L'],
    ['D', 'F'], ['D', 'R'], ['D', 'B'], ['D', 'L'],
    ['F', 'R'], ['F', 'L'], ['B', 'R'], ['B', 'L'],
  ];
  const D_CYCLE = ['DFR', 'DRB', 'DBL', 'DLF'];
  const FACE_MOVES = [];
  ['U', 'D', 'L', 'R', 'F', 'B'].forEach(f => {
    FACE_MOVES.push(f, f + "'", f + '2');
  });

  const ALG = {
    sexy: ["R'", "D'", 'R', 'D'],
    extractUFR: ["R'", "D'", 'R'],
    extractURB: ["B'", "D'", 'B'],
    extractUBL: ["L'", "D'", 'L'],
    extractULF: ["F'", "D'", 'F'],
    midRight: ['U', 'R', "U'", "R'", "U'", "F'", 'U', 'F'],
    midLeft: ["U'", "L'", 'U', 'L', 'U', 'F', "U'", "F'"],
    yellowCross: ['F', 'R', 'U', "R'", "U'", "F'"],
    sune: ['R', 'U', "R'", 'U', 'R', 'U2', "R'"],
    antisune: ['R', 'U2', "R'", "U'", 'R', "U'", "R'"],
    pllCorners: ['U', 'R', "U'", "L'", 'U', "R'", "U'", 'L'],
    uPerm: ['R', "U'", 'R', 'U', 'R', 'U', 'R', "U'", "R'", "U'", 'R2'],
    tPerm: ['R', 'U', "R'", "F'", 'R', 'U', "R'", "U'", "R'", 'F', 'R2', "U'", "R'", "U'"],
    yPerm: ['F', 'R', "U'", "R'", "U'", 'R', 'U', "R'", "F'", 'R', 'U', "R'", "U'", "R'", 'F', 'R', "F'"],
  };

  const Y_TO_UFR = { UFR: [], URB: ['y'], UBL: ['y2'], ULF: ["y'"] };
  const Y_FROM_UFR = { UFR: [], URB: ["y'"], UBL: ['y2'], ULF: ['y'] };
  const Y_TO_URB = { UFR: ["y'"], URB: [], UBL: ['y'], ULF: ['y2'] };
  const Y_FROM_URB = { UFR: ['y'], URB: [], UBL: ["y'"], ULF: ['y2'] };
  const Y_TO_UB = { UF: ['y2'], UR: ['y'], UB: [], UL: ["y'"] };
  const Y_FROM_UB = { UF: ['y2'], UR: ["y'"], UB: [], UL: ['y'] };

  function CS() { return g.CubeSolver; }

  function isUniform(arr) {
    const n2 = arr.length / 6;
    for (let f = 0; f < 6; f++) {
      const b = f * n2;
      const col = arr[b];
      for (let i = 1; i < n2; i++) if (arr[b + i] !== col) return false;
    }
    return true;
  }

  function outer(n) { return (n - 1) / 2; }

  function colAt(n, arr, p, face) {
    return CS().colorAt(n, arr, p, NRM[face]);
  }

  function centerPos(n, face) {
    const O = outer(n);
    const v = NRM[face];
    return [v[0] * O, v[1] * O, v[2] * O];
  }

  function identCen() {
    return { U: 'U', R: 'R', F: 'F', D: 'D', L: 'L', B: 'B' };
  }

  function applyCen(c, name) {
    const face = name[0];
    if (face !== 'x' && face !== 'y' && face !== 'z') return;
    const times = name.endsWith('2') ? 2 : name.endsWith("'") ? 3 : 1;
    const cycles = {
      x: ['U', 'B', 'D', 'F'],
      y: ['F', 'L', 'B', 'R'],
      z: ['U', 'R', 'D', 'L'],
    };
    const cyc = cycles[face];
    for (let t = 0; t < times; t++) {
      const vals = [c[cyc[0]], c[cyc[1]], c[cyc[2]], c[cyc[3]]];
      for (let i = 0; i < 4; i++) c[cyc[(i + 1) % 4]] = vals[i];
    }
  }

  function centers(n, arr, cen) {
    if (n % 2 === 0) {
      const src = cen || identCen();
      return { U: src.U, R: src.R, F: src.F, D: src.D, L: src.L, B: src.B };
    }
    const c = {};
    FACE.split('').forEach(f => { c[f] = colAt(n, arr, centerPos(n, f), f); });
    return c;
  }

  function edgePos(n, a, b) {
    const O = outer(n);
    const na = NRM[a], nb = NRM[b];
    return [(na[0] + nb[0]) * O, (na[1] + nb[1]) * O, (na[2] + nb[2]) * O];
  }

  function edgeCols(n, arr, a, b) {
    const p = edgePos(n, a, b);
    return { a: colAt(n, arr, p, a), b: colAt(n, arr, p, b) };
  }

  function cornerPos(n, faces) {
    const O = outer(n);
    let x = 0, y = 0, z = 0;
    for (let i = 0; i < faces.length; i++) {
      const v = NRM[faces[i]];
      x += v[0]; y += v[1]; z += v[2];
    }
    return [x * O, y * O, z * O];
  }

  function cornerCols(n, arr, faces) {
    const p = cornerPos(n, faces);
    return faces.map(f => colAt(n, arr, p, f));
  }

  function setEq(a, b) {
    if (a.length !== b.length) return false;
    const sa = a.slice().sort().join('');
    const sb = b.slice().sort().join('');
    return sa === sb;
  }

  function edgeSolved(n, arr, c, a, b) {
    const e = edgeCols(n, arr, a, b);
    return e.a === c[a] && e.b === c[b];
  }

  function cornerSolved(n, arr, c, slot) {
    const faces = SLOT_FACES[slot];
    const cols = cornerCols(n, arr, faces);
    for (let i = 0; i < faces.length; i++) if (cols[i] !== c[faces[i]]) return false;
    return true;
  }

  function findEdge(n, arr, c1, c2) {
    const need = [c1, c2].sort().join('');
    for (let i = 0; i < EDGE_SLOTS.length; i++) {
      const a = EDGE_SLOTS[i][0], b = EDGE_SLOTS[i][1];
      const e = edgeCols(n, arr, a, b);
      const got = [e.a, e.b].sort().join('');
      if (got === need) return { a: a, b: b, colA: e.a, colB: e.b };
    }
    return null;
  }

  function findCorner(n, arr, need) {
    const slots = n === 2
      ? U_CORNERS.concat(D_CORNERS)
      : U_CORNERS.concat(D_CORNERS);
    for (let i = 0; i < slots.length; i++) {
      const faces = SLOT_FACES[slots[i]];
      const cols = cornerCols(n, arr, faces);
      if (setEq(cols, need)) return slots[i];
    }
    return null;
  }

  function dBring(from, to) {
    const a = D_CYCLE.indexOf(from);
    const b = D_CYCLE.indexOf(to);
    if (a < 0 || b < 0) return null;
    const k = (b - a + 4) % 4;
    return k === 0 ? null : k === 1 ? 'D' : k === 2 ? 'D2' : "D'";
  }

  function whiteCrossDone(n, arr) {
    const c = centers(n, arr);
    if (c.U !== 'U') return false;
    return SIDES.every(s => edgeSolved(n, arr, c, 'U', s));
  }

  function firstLayerDone(n, arr, cen) {
    const c = centers(n, arr, cen);
    if (c.U !== 'U') return false;
    if (n >= 3 && !whiteCrossDone(n, arr)) return false;
    return U_CORNERS.every(s => cornerSolved(n, arr, c, s));
  }

  function middleDone(n, arr) {
    const c = centers(n, arr);
    if (c.U !== 'D') return false;
    const pairs = [['F', 'R'], ['F', 'L'], ['B', 'R'], ['B', 'L']];
    return pairs.every(p => edgeSolved(n, arr, c, p[0], p[1]));
  }

  function yellowCrossDone(n, arr) {
    const c = centers(n, arr);
    if (c.U !== 'D') return false;
    return SIDES.every(s => {
      const e = edgeCols(n, arr, 'U', s);
      return e.a === c.U;
    });
  }

  function yellowFaceDone(n, arr) {
    const n2 = n * n;
    if (n === 2) {
      for (let i = 0; i < n2; i++) if (arr[i] !== 3) return false;
      return true;
    }
    const c = centers(n, arr);
    if (c.U !== 'D') return false;
    if (!yellowCrossDone(n, arr)) return false;
    return U_CORNERS.every(s => {
      const cols = cornerCols(n, arr, SLOT_FACES[s]);
      return cols[0] === c.U;
    });
  }

  function pllCornersDone(n, arr) {
    if (!yellowFaceDone(n, arr)) return false;
    const c = centers(n, arr);
    return U_CORNERS.every(s => cornerSolved(n, arr, c, s));
  }

  function Track(n, arr) {
    this.n = n;
    this.arr = arr;
    this.cen = identCen();
    this.toks = [];
    this.chunks = [];
    this._ch = null;
  }
  Track.prototype.apply = function (names) {
    const S = CS();
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      if (!name) continue;
      S.applyName(this.n, this.arr, name);
      applyCen(this.cen, name);
      this.toks.push(name);
      if (this._ch) this._ch.len++;
    }
  };
  Track.prototype.chunk = function (lessonIdx, alg, fn) {
    const ch = { lessonIdx: lessonIdx, start: this.toks.length, len: 0, alg: alg || '' };
    this._ch = ch;
    fn.call(this);
    this._ch = null;
    if (ch.len) this.chunks.push(ch);
  };
  Track.prototype.guard = function (ok, max, msg) {
    for (let i = 0; i < max; i++) {
      if (ok()) return;
      throw new Error(msg || 'stuck');
    }
  };

  function crossKey(n, arr) {
    const c = centers(n, arr);
    const map = {};
    for (let i = 0; i < EDGE_SLOTS.length; i++) {
      const a = EDGE_SLOTS[i][0], b = EDGE_SLOTS[i][1];
      const e = edgeCols(n, arr, a, b);
      map[e.a + e.b] = a + b + e.a;
    }
    return SIDES.map(s => map[c.U + c[s]] || map[c[s] + c.U] || '?').join('|');
  }

  function bfs(n, start, isGoal, maxDepth, nodeLimit, keyFn) {
    if (isGoal(start)) return [];
    const S = CS();
    const keyOf = keyFn || function (a) { return S.toStr(a); };
    const q = [{ a: start.slice(), toks: [] }];
    const seen = new Set([keyOf(start)]);
    let qi = 0;
    let nodes = 0;
    const limit = nodeLimit || 80000;
    while (qi < q.length) {
      const cur = q[qi++];
      if (cur.toks.length >= maxDepth) continue;
      for (let m = 0; m < FACE_MOVES.length; m++) {
        const name = FACE_MOVES[m];
        const b = cur.a.slice();
        S.applyName(n, b, name);
        const k = keyOf(b);
        if (seen.has(k)) continue;
        seen.add(k);
        const toks = cur.toks.concat(name);
        if (isGoal(b)) return toks;
        q.push({ a: b, toks: toks });
        if (++nodes > limit) return null;
      }
    }
    return null;
  }

  function reorientWhiteUp(tr) {
    if (tr.n === 2) return;
    const c = centers(tr.n, tr.arr);
    if (c.U !== 'U') {
      if (c.D === 'U') tr.apply(['x2']);
      else if (c.F === 'U') tr.apply(['x']);
      else if (c.B === 'U') tr.apply(["x'"]);
      else if (c.R === 'U') tr.apply(["z'"]);
      else if (c.L === 'U') tr.apply(['z']);
    }
    const c2 = centers(tr.n, tr.arr);
    if (c2.F === 'F') return;
    if (c2.R === 'F') tr.apply(['y']);
    else if (c2.L === 'F') tr.apply(["y'"]);
    else if (c2.B === 'F') tr.apply(['y2']);
  }

  function dEdgeBring(from, to) {
    const cyc = ['F', 'R', 'B', 'L'];
    const a = cyc.indexOf(from);
    const b = cyc.indexOf(to);
    if (a < 0 || b < 0) return null;
    const k = (b - a + 4) % 4;
    return k === 0 ? null : k === 1 ? 'D' : k === 2 ? 'D2' : "D'";
  }

  function invTok(m) {
    if (m.endsWith('2')) return m;
    if (m.endsWith("'")) return m.slice(0, -1);
    return m + "'";
  }

  function daisyCount(n, arr) {
    const c = centers(n, arr);
    let k = 0;
    for (let i = 0; i < SIDES.length; i++) {
      if (colAt(n, arr, edgePos(n, 'D', SIDES[i]), 'D') === c.U) k++;
    }
    return k;
  }

  function idaDaisy(n, start) {
    const S = CS();
    const arr = start.slice();
    if (daisyCount(n, arr) === 4) return [];
    let found = null;
    const path = [];
    function dfs(d, cap, last) {
      if (found) return;
      if (daisyCount(n, arr) === 4) { found = path.slice(); return; }
      if (d + (4 - daisyCount(n, arr)) > cap) return;
      if (d === cap) return;
      for (let i = 0; i < FACE_MOVES.length; i++) {
        const m = FACE_MOVES[i];
        if (m[0] === last) continue;
        S.applyName(n, arr, m);
        path.push(m);
        dfs(d + 1, cap, m[0]);
        path.pop();
        S.applyName(n, arr, invTok(m));
        if (found) return;
      }
    }
    for (let cap = 1; cap <= 8 && !found; cap++) dfs(0, cap, '');
    return found;
  }

  function placeCross(tr) {
    const n = tr.n;
    if (whiteCrossDone(n, tr.arr)) return;
    if (daisyCount(n, tr.arr) < 4) {
      const toks = idaDaisy(n, tr.arr);
      if (!toks) throw new Error('cross');
      tr.apply(toks);
    }
    SIDES.forEach(T => {
      if (edgeSolved(n, tr.arr, centers(n, tr.arr), 'U', T)) return;
      const c = centers(n, tr.arr);
      const loc = findEdge(n, tr.arr, c.U, c[T]);
      if (!loc) throw new Error('cross');
      const dFace = loc.a === 'D' ? loc.b : loc.a;
      const d = dEdgeBring(dFace, T);
      if (d) tr.apply([d]);
      tr.apply([T + '2']);
    });
    if (!whiteCrossDone(n, tr.arr)) throw new Error('cross');
  }

  function extractFromU(tr, slot) {
    if (slot === 'UFR') tr.apply(ALG.extractUFR);
    else if (slot === 'URB') tr.apply(ALG.extractURB);
    else if (slot === 'UBL') tr.apply(ALG.extractUBL);
    else if (slot === 'ULF') tr.apply(ALG.extractULF);
  }

  function placeCorners(tr) {
    const n = tr.n;
    U_CORNERS.forEach(slot => {
      const c0 = centers(n, tr.arr, tr.cen);
      if (cornerSolved(n, tr.arr, c0, slot)) return;
      tr.apply(Y_TO_UFR[slot]);
      let guard = 0;
      while (guard++ < 16) {
        const c = centers(n, tr.arr, tr.cen);
        const need = [c.U, c.F, c.R];
        if (cornerSolved(n, tr.arr, c, 'UFR')) break;
        const loc = findCorner(n, tr.arr, need);
        if (!loc) throw new Error('corner missing');
        if (loc === 'UFR') {
          tr.apply(ALG.sexy);
        } else if (U_CORNERS.indexOf(loc) >= 0) {
          extractFromU(tr, loc);
        } else {
          const d = dBring(loc, 'DFR');
          if (d) tr.apply([d]);
          tr.apply(ALG.sexy);
        }
      }
      if (guard >= 16) throw new Error('corners');
      tr.apply(Y_FROM_UFR[slot]);
    });
  }

  function flipToYellow(tr) {
    if (tr.n === 2) {
      const n2 = 4;
      let white = 0;
      for (let i = 0; i < n2; i++) if (tr.arr[i] === 0) white++;
      if (white === 4) tr.apply(['x2']);
      return;
    }
    const c = centers(tr.n, tr.arr);
    if (c.U === 'D') return;
    if (c.U === 'U') tr.apply(['x2']);
  }

  function ySideToF(side) {
    return { F: [], R: ['y'], B: ['y2'], L: ["y'"] }[side] || [];
  }
  function yFToSide(side) {
    return { F: [], R: ["y'"], B: ['y2'], L: ['y'] }[side] || [];
  }

  function matchedMiddleSide(n, arr) {
    const c = centers(n, arr);
    for (let i = 0; i < SIDES.length; i++) {
      const s = SIDES[i];
      const e = edgeCols(n, arr, 'U', s);
      if (e.a !== c.U && e.b !== c.U && e.b === c[s]) return s;
    }
    return null;
  }

  function placeMiddle(tr) {
    const n = tr.n;
    const pairs = [['F', 'R'], ['R', 'B'], ['B', 'L'], ['L', 'F']];
    const yFor = { FR: [], RB: ['y'], BL: ['y2'], LF: ["y'"] };
    const yBack = { FR: [], RB: ["y'"], BL: ['y2'], LF: ['y'] };
    let guard = 0;
    while (guard++ < 16 && !middleDone(n, tr.arr)) {
      let side = null;
      for (let u = 0; u < 4; u++) {
        side = matchedMiddleSide(n, tr.arr);
        if (side) break;
        tr.apply(['U']);
      }
      if (side) {
        tr.apply(ySideToF(side));
        const e = edgeCols(n, tr.arr, 'U', 'F');
        const c = centers(n, tr.arr);
        if (e.a === c.R) tr.apply(ALG.midRight);
        else tr.apply(ALG.midLeft);
        tr.apply(yFToSide(side));
        continue;
      }
      const c = centers(n, tr.arr);
      let bad = null;
      for (let i = 0; i < pairs.length; i++) {
        if (!edgeSolved(n, tr.arr, c, pairs[i][0], pairs[i][1])) {
          bad = pairs[i];
          break;
        }
      }
      if (!bad) break;
      const key = bad[0] + bad[1];
      tr.apply(yFor[key] || []);
      tr.apply(ALG.midRight);
      tr.apply(yBack[key] || []);
    }
    if (!middleDone(n, tr.arr)) throw new Error('middle');
  }

  function uYellowMask(tr) {
    const u = tr.arr;
    const y = u[4];
    return { UB: u[1] === y, UL: u[3] === y, UR: u[5] === y, UF: u[7] === y };
  }

  function placeYellowCross(tr) {
    let guard = 0;
    while (guard++ < 8 && !yellowCrossDone(tr.n, tr.arr)) {
      const m = uYellowMask(tr);
      const n = (m.UB ? 1 : 0) + (m.UL ? 1 : 0) + (m.UR ? 1 : 0) + (m.UF ? 1 : 0);
      if (n === 2) {
        const adj = (m.UL && m.UB) || (m.UB && m.UR) || (m.UR && m.UF) || (m.UF && m.UL);
        if (adj) {
          // L: arms left+up = UL+UB
          if (m.UL && m.UB) { /* ok */ }
          else if (m.UB && m.UR) tr.apply(["U'"]);
          else if (m.UR && m.UF) tr.apply(['U2']);
          else tr.apply(['U']);
        } else {
          // line: hold horizontal = UL+UR
          if (!(m.UL && m.UR)) tr.apply(['U']);
        }
      }
      tr.apply(ALG.yellowCross);
    }
    if (!yellowCrossDone(tr.n, tr.arr)) throw new Error('yellow cross');
  }

  function bfsMacros(n, start, isGoal, macros, maxDepth, nodeLimit) {
    const S = CS();
    if (isGoal(start)) return [];
    const q = [{ a: start.slice(), toks: [], d: 0 }];
    const seen = new Set([S.toStr(start)]);
    let qi = 0;
    let nodes = 0;
    const limit = nodeLimit || 40000;
    while (qi < q.length) {
      const cur = q[qi++];
      if (cur.d >= maxDepth) continue;
      for (let i = 0; i < macros.length; i++) {
        const b = cur.a.slice();
        S.applyAlg(n, b, macros[i]);
        const k = S.toStr(b);
        if (seen.has(k)) continue;
        seen.add(k);
        const toks = cur.toks.concat(macros[i]);
        if (isGoal(b)) return toks;
        q.push({ a: b, toks: toks, d: cur.d + 1 });
        if (++nodes > limit) return null;
      }
    }
    return null;
  }

  function placeYellowFace(tr) {
    const n = tr.n;
    const toks = bfsMacros(n, tr.arr, function (a) { return yellowFaceDone(n, a); },
      [ALG.sune, ALG.antisune, ['U'], ["U'"], ['U2']], 12, 80000);
    if (!toks) throw new Error('yellow face');
    tr.apply(toks);
  }

  function solvedUCorners(n, arr) {
    const c = centers(n, arr);
    return U_CORNERS.filter(s => cornerSolved(n, arr, c, s));
  }

  function bestAuf(tr, scoreFn) {
    const S = CS();
    const opts = [[], ['U'], ['U2'], ["U'"]];
    let best = -1, bestToks = [];
    for (let i = 0; i < opts.length; i++) {
      const a = tr.arr.slice();
      S.applyAlg(tr.n, a, opts[i]);
      const sc = scoreFn(a);
      if (sc > best) { best = sc; bestToks = opts[i]; }
    }
    return bestToks;
  }

  function placePllCorners(tr) {
    const tSetup = {
      'UFR,ULF': ['y'],
      'UFR,URB': ['y2'],
      'UBL,URB': ["y'"],
      'UBL,ULF': [],
    };
    const tUndo = {
      'UFR,ULF': ["y'"],
      'UFR,URB': ['y2'],
      'UBL,URB': ['y'],
      'UBL,ULF': [],
    };
    let guard = 0;
    while (guard++ < 8 && !pllCornersDone(tr.n, tr.arr)) {
      tr.apply(bestAuf(tr, function (a) { return solvedUCorners(tr.n, a).length; }));
      if (pllCornersDone(tr.n, tr.arr)) return;
      const good = solvedUCorners(tr.n, tr.arr);
      if (good.length === 1) {
        tr.apply(Y_TO_URB[good[0]]);
        tr.apply(ALG.pllCorners);
        tr.apply(Y_FROM_URB[good[0]]);
      } else if (good.length === 0) {
        tr.apply(ALG.pllCorners);
      } else if (good.length === 2) {
        const diag = (good.indexOf('UFR') >= 0 && good.indexOf('UBL') >= 0)
          || (good.indexOf('URB') >= 0 && good.indexOf('ULF') >= 0);
        if (diag) {
          tr.apply(ALG.yPerm);
        } else {
          const key = good.slice().sort().join(',');
          tr.apply(tSetup[key] || []);
          tr.apply(ALG.tPerm);
          tr.apply(tUndo[key] || []);
        }
      } else {
        tr.apply(ALG.pllCorners);
      }
    }
    if (!pllCornersDone(tr.n, tr.arr)) throw new Error('pll corners');
  }

  function solvedUEdges(n, arr) {
    const c = centers(n, arr);
    return SIDES.filter(s => edgeSolved(n, arr, c, 'U', s));
  }

  function placePllEdges(tr) {
    let guard = 0;
    while (guard++ < 8 && !isUniform(tr.arr)) {
      const good = solvedUEdges(tr.n, tr.arr);
      if (good.length === 4) {
        tr.apply(bestAuf(tr, function (a) { return isUniform(a) ? 1 : 0; }));
        if (isUniform(tr.arr)) return;
        const yopts = [[], ['y'], ['y2'], ["y'"]];
        const S = CS();
        for (let i = 0; i < yopts.length; i++) {
          const a = tr.arr.slice();
          S.applyAlg(tr.n, a, yopts[i]);
          if (isUniform(a)) { tr.apply(yopts[i]); return; }
        }
        throw new Error('pll edges');
      }
      if (good.length === 1) {
        const side = good[0];
        const key = side === 'F' ? 'UF' : side === 'R' ? 'UR' : side === 'B' ? 'UB' : 'UL';
        tr.apply(Y_TO_UB[key]);
        tr.apply(ALG.uPerm);
        tr.apply(Y_FROM_UB[key]);
      } else {
        tr.apply(ALG.uPerm);
      }
    }
    if (!isUniform(tr.arr)) throw new Error('pll edges');
  }

  function solve3(tr) {
    reorientWhiteUp(tr);
    const c = centers(tr.n, tr.arr);
    if (c.U === 'U') {
      if (!whiteCrossDone(tr.n, tr.arr)) {
        tr.chunk(1, '', function () { placeCross(tr); });
      }
      if (!firstLayerDone(tr.n, tr.arr)) {
        tr.chunk(2, "R' D' R D", function () { placeCorners(tr); });
      }
    }
    if (!middleDone(tr.n, tr.arr) || centers(tr.n, tr.arr).U !== 'D') {
      tr.chunk(3, '', function () { flipToYellow(tr); });
    }
    if (!middleDone(tr.n, tr.arr)) {
      tr.chunk(3, "U R U' R' U' F' U F", function () { placeMiddle(tr); });
    }
    if (!yellowCrossDone(tr.n, tr.arr)) {
      tr.chunk(4, "F R U R' U' F'", function () { placeYellowCross(tr); });
    }
    if (!yellowFaceDone(tr.n, tr.arr)) {
      tr.chunk(5, "R U R' U R U2 R'", function () { placeYellowFace(tr); });
    }
    if (!pllCornersDone(tr.n, tr.arr)) {
      tr.chunk(6, "U R U' L' U R' U' L", function () { placePllCorners(tr); });
    }
    if (!isUniform(tr.arr)) {
      tr.chunk(7, "R U' R U R U R U' R' U' R2", function () { placePllEdges(tr); });
    }
  }

  function placeCorners2(tr) {
    placeCorners(tr);
  }

  function headlightsOn(tr, face) {
    const c = centers(tr.n, tr.arr);
    const map = {
      F: [['ULF', 2], ['UFR', 1]],
      R: [['UFR', 2], ['URB', 1]],
      B: [['URB', 2], ['UBL', 1]],
      L: [['UBL', 2], ['ULF', 1]],
    };
    const pair = map[face];
    const a = cornerCols(tr.n, tr.arr, SLOT_FACES[pair[0][0]])[pair[0][1]];
    const b = cornerCols(tr.n, tr.arr, SLOT_FACES[pair[1][0]])[pair[1][1]];
    return a === b && a === c[face];
  }

  function orient2(tr) {
    const n = tr.n;
    const toks = bfsMacros(n, tr.arr, function (a) { return yellowFaceDone(n, a); },
      [ALG.sune, ALG.antisune, ['U'], ["U'"], ['U2']], 14, 120000);
    if (!toks) throw new Error('2x2 oll');
    tr.apply(toks);
  }

  function permute2(tr) {
    const n = tr.n;
    const toks = bfsMacros(n, tr.arr, function (a) { return isUniform(a); },
      [ALG.tPerm, ALG.yPerm, ['U'], ["U'"], ['U2']], 8, 40000);
    if (!toks) throw new Error('2x2 pll');
    tr.apply(toks);
  }

  function solve2(tr) {
    if (!firstLayerDone(tr.n, tr.arr, tr.cen)) {
      tr.chunk(1, "R' D' R D", function () { placeCorners2(tr); });
    }
    if (!firstLayerDone(tr.n, tr.arr, tr.cen)) throw new Error('2x2 first');
    tr.chunk(2, '', function () { flipToYellow(tr); });
    if (!yellowFaceDone(tr.n, tr.arr)) {
      tr.chunk(2, "R U R' U R U2 R'", function () { orient2(tr); });
    }
    if (!isUniform(tr.arr)) {
      tr.chunk(3, "R U R' F' R U R' U' R' F R2 U' R' U'", function () { permute2(tr); });
    }
  }

  function solve(facelets, n) {
    const S = CS();
    if (!S) return { error: 'solver' };
    const parsed = S.parseFacelets(facelets);
    if (!parsed) return { error: 'parse' };
    if (n == null) n = parsed.n;
    if (n !== parsed.n) return { error: 'size' };
    if (n !== 2 && n !== 3) return { error: 'size' };
    const arr = parsed.a.slice();
    if (isUniform(arr)) return { toks: [], chunks: [] };
    const tr = new Track(n, arr);
    try {
      if (n === 2) solve2(tr);
      else solve3(tr);
    } catch (e) {
      return { error: (e && e.message) ? e.message : String(e) };
    }
    if (!isUniform(tr.arr)) return { error: 'unsolved' };
    return { toks: tr.toks, chunks: tr.chunks };
  }

  g.CubeBeginner = {
    solve: solve,
    isUniform: isUniform,
    _test: {
      ALG: ALG,
      isUniform: isUniform,
      centers: centers,
      whiteCrossDone: whiteCrossDone,
      firstLayerDone: firstLayerDone,
      middleDone: middleDone,
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
