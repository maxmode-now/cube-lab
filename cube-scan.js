// 큐브 얼굴 사진 → 색 샘플링 / 분류 / 검증. DOM·Three 없음.
// 면 순서: U R F D L B. 각 면 N×N칸은 사진 상단→하단, 좌→우 (row-major).
// 홀수(3×3·5×5): 해당 면 센터가 가운데. U면은 F가 사진 아래, 그 외는 U가 사진 위.
// 짝수(2×2·4×4): 고정 센터가 없으므로 같은 위/앞 방향을 유지한 채 큐브 전체만 돌려 6면을 찍는다.
(function (g) {
  'use strict';

  const FACE_ORDER = ['U', 'R', 'F', 'D', 'L', 'B'];
  const FACE_TO_DIAG = { U: 'W', D: 'Y', R: 'R', L: 'O', F: 'G', B: 'B' };
  const DIAG_TO_FACE = { W: 'U', Y: 'D', R: 'R', O: 'L', G: 'F', B: 'B' };
  const COLOR_CYCLE = ['U', 'R', 'F', 'D', 'L', 'B'];

  function hexToRgb(hex) {
    const h = hex >>> 0;
    return { r: (h >> 16) & 255, g: (h >> 8) & 255, b: h & 255 };
  }

  function dist2(a, b) {
    const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
    return dr * dr + dg * dg + db * db;
  }

  function sampleRegion(data, w, h, x0, y0, x1, y1) {
    const xa = Math.max(0, Math.floor(x0));
    const ya = Math.max(0, Math.floor(y0));
    const xb = Math.min(w, Math.ceil(x1));
    const yb = Math.min(h, Math.ceil(y1));
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = ya; y < yb; y++) {
      for (let x = xa; x < xb; x++) {
        const i = (y * w + x) * 4;
        r += data[i]; g += data[i + 1]; b += data[i + 2];
        n++;
      }
    }
    if (!n) return { r: 0, g: 0, b: 0 };
    return { r: r / n, g: g / n, b: b / n };
  }

  /** 정사각 그리드 영역 (이미지 중앙, margin 비율 inset) */
  function gridRect(w, h, margin) {
    if (margin == null) margin = 0.12;
    const side = Math.min(w, h) * (1 - 2 * margin);
    const x = (w - side) / 2;
    const y = (h - side) / 2;
    return { x, y, side };
  }

  /**
   * ImageData에서 N×N 스티커 색 샘플.
   * @returns {{ rgb: {r,g,b}, conf hint later }[]}
   */
  function sampleFace(imageData, n, margin) {
    if (n == null) n = 3;
    const w = imageData.width, h = imageData.height;
    const data = imageData.data;
    const g = gridRect(w, h, margin);
    const cell = g.side / n;
    const inset = cell * (n >= 5 ? 0.18 : n >= 4 ? 0.22 : 0.28);
    const out = [];
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        const x0 = g.x + col * cell + inset;
        const y0 = g.y + row * cell + inset;
        const x1 = g.x + (col + 1) * cell - inset;
        const y1 = g.y + (row + 1) * cell - inset;
        out.push(sampleRegion(data, w, h, x0, y0, x1, y1));
      }
    }
    return out;
  }

  /** refs: { U:0x.., R:.., F:.., D:.., L:.., B:.. } */
  function classifyRgb(rgb, refs) {
    let best = null, bestD = Infinity, second = Infinity;
    for (const face of COLOR_CYCLE) {
      const d = dist2(rgb, hexToRgb(refs[face]));
      if (d < bestD) { second = bestD; bestD = d; best = face; }
      else if (d < second) second = d;
    }
    const conf = second === Infinity ? 1 : (second - bestD) / (second + 1);
    return { face: best, dist: bestD, conf: Math.max(0, Math.min(1, conf)) };
  }

  function classifyFace(samples, refs) {
    return samples.map(rgb => {
      const c = classifyRgb(rgb, refs);
      return { color: c.face, conf: c.conf, rgb };
    });
  }

  /** centers(6)로 refs를 약간 보정 — 촬영 조명 맞춤 */
  function calibrateRefs(baseRefs, centerRgbsByFace) {
    const out = {};
    for (const face of COLOR_CYCLE) {
      const rgb = centerRgbsByFace[face];
      if (!rgb) { out[face] = baseRefs[face]; continue; }
      const base = hexToRgb(baseRefs[face]);
      // 50% blend toward observed center
      const r = Math.round(base.r * 0.5 + rgb.r * 0.5);
      const g = Math.round(base.g * 0.5 + rgb.g * 0.5);
      const b = Math.round(base.b * 0.5 + rgb.b * 0.5);
      out[face] = (r << 16) | (g << 8) | b;
    }
    return out;
  }

  /**
   * faces: { U: ['U','R',...x9], ... } color letters = sticker colors
   */
  function validateCube(faces, n) {
    if (n == null) n = 3;
    const need = n * n;
    const errors = [];
    const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
    const centers = [];

    for (const face of FACE_ORDER) {
      const cells = faces[face];
      if (!cells || cells.length !== need) {
        errors.push({ code: 'missing', face });
        continue;
      }
      const mid = cells[Math.floor(need / 2)];
      centers.push(mid);
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        if (!counts.hasOwnProperty(c)) errors.push({ code: 'badColor', face, i, c });
        else counts[c]++;
      }
    }

    for (const face of COLOR_CYCLE) {
      if (counts[face] !== need) {
        errors.push({ code: 'count', color: face, got: counts[face], need });
      }
    }

    // 홀수 N만 고정 센터. 짝수는 가운데 칸이 없거나(2) 센터 조각이 움직인다(4).
    if (hasFixedCenter(n)) {
      const uniq = new Set(centers.filter(Boolean));
      if (centers.length === 6 && uniq.size !== 6) {
        errors.push({ code: 'centers', centers: centers.slice() });
      }
    }

    return { ok: errors.length === 0, errors, counts };
  }

  function averageRgb(list) {
    let r = 0, g = 0, b = 0;
    const n = list.length || 1;
    for (let i = 0; i < list.length; i++) {
      r += list[i].r; g += list[i].g; b += list[i].b;
    }
    return { r: r / n, g: g / n, b: b / n };
  }

  function hasFixedCenter(n) {
    return (n % 2) === 1;
  }

  function centerIndex(n) {
    return (n * n) >> 1;
  }

  /** 이미 분류된 스티커 RGB를 색(U/R/F/…)별로 평균 — 짝수 큐브 조명 보정용 */
  function observedColorRgbs(faces, rgbsByFace) {
    const buckets = { U: [], R: [], F: [], D: [], L: [], B: [] };
    for (const face of FACE_ORDER) {
      const cols = faces[face];
      const rgbs = rgbsByFace[face];
      if (!cols || !rgbs) continue;
      for (let i = 0; i < cols.length; i++) {
        const c = cols[i];
        if (c && buckets[c] && rgbs[i]) buckets[c].push(rgbs[i]);
      }
    }
    const out = {};
    for (const face of COLOR_CYCLE) {
      if (buckets[face].length) out[face] = averageRgb(buckets[face]);
    }
    return out;
  }

  /** applyDiagramState용 { U:[W..], ... } — 키는 면, 값은 다이어그램 색 코드 */
  function toDiagramState(faces) {
    const state = {};
    for (const face of FACE_ORDER) {
      state[face] = (faces[face] || []).map(c => FACE_TO_DIAG[c] || '_');
    }
    return state;
  }

  /** cubejs facelets 54자 URFDLB 순서 */
  function toFacelets(faces) {
    let s = '';
    for (const face of FACE_ORDER) {
      s += (faces[face] || []).join('');
    }
    return s;
  }

  function emptyFaces(n) {
    if (n == null) n = 3;
    const z = Array(n * n).fill(null);
    const o = {};
    FACE_ORDER.forEach(f => { o[f] = z.slice(); });
    return o;
  }

  function nextColor(cur) {
    const i = COLOR_CYCLE.indexOf(cur);
    return COLOR_CYCLE[(i + 1) % COLOR_CYCLE.length];
  }

  g.CubeScan = {
    FACE_ORDER,
    FACE_TO_DIAG,
    DIAG_TO_FACE,
    COLOR_CYCLE,
    gridRect,
    sampleFace,
    classifyFace,
    classifyRgb,
    calibrateRefs,
    validateCube,
    hasFixedCenter,
    centerIndex,
    observedColorRgbs,
    toDiagramState,
    toFacelets,
    emptyFaces,
    nextColor,
    hexToRgb,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
