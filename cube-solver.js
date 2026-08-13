// Kociemba 3×3 솔버 래퍼. cubejs(window.Cube)만 사용. DOM/엔진 없음.
// classic script (file:// 가능).
(function (g) {
  'use strict';

  let ready = false;

  function Cube() {
    return g.Cube;
  }

  function init() {
    if (ready) return;
    const C = Cube();
    if (!C || typeof C.initSolver !== 'function') {
      throw new Error('cubejs not loaded');
    }
    C.initSolver();
    ready = true;
  }

  function solve(facelets) {
    if (!facelets || facelets.length !== 54) return '';
    const C = Cube();
    if (!C || typeof C.fromString !== 'function') return '';
    const c = C.fromString(facelets);
    if (c.isSolved()) return '';
    return c.solve() || '';
  }

  function parseMoves(sol) {
    return (sol || '').trim().split(/\s+/).filter(Boolean);
  }

  g.CubeSolver = { init, solve, parseMoves };
})(typeof globalThis !== 'undefined' ? globalThis : this);
