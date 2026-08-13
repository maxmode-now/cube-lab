// N×N×N 큐브 격자 수학. Three.js와 독립.
// 인덱스 0..N-1 ↔ 중심 좌표 (i - (N-1)/2) * GAP
// classic script (file:// 가능). ES import 쓰면 file://에서 모듈 전체가 죽는다.
(function (g) {
  'use strict';

  function outerOf(n) {
    return (n - 1) / 2;
  }

  function layerCoordsOf(n) {
    const outer = outerOf(n);
    return Array.from({ length: n }, (_, i) => i - outer);
  }

  function coordToIndex(n, v, gap) {
    if (gap == null) gap = 1;
    const i = Math.round(v / gap + outerOf(n));
    return Math.max(0, Math.min(n - 1, i));
  }

  function indexToCoord(n, i, gap) {
    if (gap == null) gap = 1;
    return (i - outerOf(n)) * gap;
  }

  function snapCoord(n, v, gap) {
    if (gap == null) gap = 1;
    return indexToCoord(n, coordToIndex(n, v, gap), gap);
  }

  function isOuterCoord(n, v, eps) {
    if (eps == null) eps = 1e-6;
    return Math.abs(Math.abs(v) - outerOf(n)) < eps;
  }

  function assertCubeMath() {
    const nearly = (a, b) => Math.abs(a - b) < 1e-9;
    const fails = [];

    const lc3 = layerCoordsOf(3);
    if (lc3.length !== 3 || !nearly(lc3[0], -1) || !nearly(lc3[1], 0) || !nearly(lc3[2], 1))
      fails.push(['layerCoordsOf(3)', lc3]);
    const lc2 = layerCoordsOf(2);
    if (lc2.length !== 2 || !nearly(lc2[0], -0.5) || !nearly(lc2[1], 0.5))
      fails.push(['layerCoordsOf(2)', lc2]);
    const lc4 = layerCoordsOf(4);
    if (lc4.length !== 4 || !nearly(lc4[0], -1.5) || !nearly(lc4[1], -0.5) || !nearly(lc4[2], 0.5) || !nearly(lc4[3], 1.5))
      fails.push(['layerCoordsOf(4)', lc4]);
    const lc5 = layerCoordsOf(5);
    if (lc5.length !== 5 || !nearly(lc5[0], -2) || !nearly(lc5[2], 0) || !nearly(lc5[4], 2))
      fails.push(['layerCoordsOf(5)', lc5]);

    if (outerOf(2) !== 0.5 || outerOf(3) !== 1 || outerOf(4) !== 1.5 || outerOf(5) !== 2)
      fails.push(['outerOf', [outerOf(2), outerOf(3), outerOf(4), outerOf(5)]]);

    for (const v of [-1.4, -1, -0.51, -0.49, 0, 0.49, 0.51, 1, 1.4]) {
      const got = snapCoord(3, v, 1);
      const exp = Math.round(v);
      if (!nearly(got, exp)) fails.push(['snap N=3 vs Math.round', v, got, exp]);
    }

    if (!nearly(snapCoord(2, -0.5, 1), -0.5)) fails.push(['snap 2 -0.5', snapCoord(2, -0.5, 1)]);
    if (!nearly(snapCoord(2, 0.5, 1), 0.5)) fails.push(['snap 2 0.5', snapCoord(2, 0.5, 1)]);
    if (!nearly(snapCoord(2, -0.4, 1), -0.5)) fails.push(['snap 2 -0.4', snapCoord(2, -0.4, 1)]);
    if (!nearly(snapCoord(2, 0.4, 1), 0.5)) fails.push(['snap 2 0.4', snapCoord(2, 0.4, 1)]);
    if (!nearly(snapCoord(2, 0, 1), 0.5)) fails.push(['snap 2 0', snapCoord(2, 0, 1)]);

    if (!nearly(snapCoord(4, 1.4, 1), 1.5)) fails.push(['snap 4 1.4', snapCoord(4, 1.4, 1)]);
    if (!nearly(snapCoord(4, 0.1, 1), 0.5)) fails.push(['snap 4 0.1', snapCoord(4, 0.1, 1)]);
    if (!nearly(snapCoord(4, -0.1, 1), -0.5)) fails.push(['snap 4 -0.1', snapCoord(4, -0.1, 1)]);
    if (!nearly(snapCoord(4, -1.4, 1), -1.5)) fails.push(['snap 4 -1.4', snapCoord(4, -1.4, 1)]);

    if (!isOuterCoord(3, 1) || !isOuterCoord(3, -1) || isOuterCoord(3, 0))
      fails.push(['isOuterCoord 3']);
    if (!isOuterCoord(2, 0.5) || !isOuterCoord(2, -0.5) || isOuterCoord(2, 0))
      fails.push(['isOuterCoord 2']);
    if (!isOuterCoord(4, 1.5) || !isOuterCoord(4, -1.5) || isOuterCoord(4, 0.5))
      fails.push(['isOuterCoord 4']);
    if (!nearly(snapCoord(5, 1.6, 1), 2) || !nearly(snapCoord(5, 0.4, 1), 0) || !nearly(snapCoord(5, 0.6, 1), 1))
      fails.push(['snap 5', snapCoord(5, 1.6, 1), snapCoord(5, 0.4, 1), snapCoord(5, 0.6, 1)]);
    if (!isOuterCoord(5, 2) || !isOuterCoord(5, -2) || isOuterCoord(5, 1) || isOuterCoord(5, 0))
      fails.push(['isOuterCoord 5']);

    if (fails.length) console.error('[cube-math] assertCubeMath failed:', fails);
    return fails.length === 0;
  }

  g.CubeMath = {
    outerOf, layerCoordsOf, coordToIndex, indexToCoord,
    snapCoord, isOuterCoord, assertCubeMath,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
