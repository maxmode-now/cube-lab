// Full OLL 57-case library. Shared by the trainer and written guide.
(function (g) {
  'use strict';

  const DATA = g.OllCasesData;
  if (!DATA) {
    throw new Error('oll-cases-data.js must load before oll-cases.js');
  }

  const CATS = DATA.CATS;
  const CASES = DATA.CASES;
  const TWO_LOOK_EDGES = DATA.TWO_LOOK_EDGES;
  const TWO_LOOK_CORNER_IDS = DATA.TWO_LOOK_CORNER_IDS;
  const CAT_STEP = DATA.CAT_STEP;

  function invertToken(tok) {
    if (tok.endsWith('2')) return tok;
    if (tok.endsWith("'")) return tok.slice(0, -1);
    return tok + "'";
  }

  function invertAlg(str) {
    return String(str).trim().split(/\s+/).filter(Boolean).reverse().map(invertToken).join(' ');
  }

  // cube.js + engine: wide Uw/Dw and lowercase r l f b u d wide layers.
  function toCubejsAlg(str) {
    return String(str).trim().split(/\s+/).map(tok => {
      const wide = tok.match(/^(Uw|Dw|Lw|Rw|Fw|Bw)(2|')?$/i);
      if (wide) return wide[1][0].toLowerCase() + (wide[2] || '');
      const lower = tok.match(/^([rlfbud])(2|')?$/);
      if (lower) return lower[1] + (lower[2] || '');
      return tok;
    }).join(' ');
  }

  function byCat(cat) {
    return CASES.filter(c => c.cat === cat);
  }

  function byId(id) {
    return CASES.find(c => c.id === id) || null;
  }

  function twoLookCorners() {
    return TWO_LOOK_CORNER_IDS.map(byId).filter(Boolean);
  }

  function lessonStepForCase(id) {
    if (TWO_LOOK_CORNER_IDS.includes(id)) return CAT_STEP.twoLookCorners;
    const c = byId(id);
    if (!c) return 0;
    return CAT_STEP[c.cat] != null ? CAT_STEP[c.cat] : CAT_STEP.other;
  }

  g.CubeOLL = {
    cats: CATS,
    cases: CASES,
    twoLookEdges: TWO_LOOK_EDGES,
    twoLookCornerIds: TWO_LOOK_CORNER_IDS,
    catStep: CAT_STEP,
    invertAlg,
    toCubejsAlg,
    byCat,
    byId,
    twoLookCorners,
    lessonStepForCase,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
