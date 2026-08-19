// Full PLL 21-case library. Shared by the trainer and written guide.
(function (g) {
  'use strict';

  const DATA = g.PllCasesData;
  if (!DATA) {
    throw new Error('pll-cases-data.js must load before pll-cases.js');
  }

  const CATS = DATA.CATS;
  const CASES = DATA.CASES;
  const TWO_LOOK_CORNER_IDS = DATA.TWO_LOOK_CORNER_IDS;
  const TWO_LOOK_EDGE_IDS = DATA.TWO_LOOK_EDGE_IDS;
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
    if (id == null || id === '') return null;
    const key = String(id);
    return CASES.find(c => c.id === key)
      || CASES.find(c => c.id.toLowerCase() === key.toLowerCase())
      || null;
  }

  function twoLookCorners() {
    return TWO_LOOK_CORNER_IDS.map(byId).filter(Boolean);
  }

  function twoLookEdges() {
    return TWO_LOOK_EDGE_IDS.map(byId).filter(Boolean);
  }

  function lessonStepForCase(id) {
    const c = byId(id);
    if (!c) return 0;
    if (TWO_LOOK_CORNER_IDS.some(x => x.toLowerCase() === c.id.toLowerCase())) {
      return CAT_STEP.twoLookCorners;
    }
    if (TWO_LOOK_EDGE_IDS.some(x => x.toLowerCase() === c.id.toLowerCase())) {
      return CAT_STEP.twoLookEdges;
    }
    return CAT_STEP[c.cat] != null ? CAT_STEP[c.cat] : CAT_STEP.adjacent;
  }

  g.CubePLL = {
    cats: CATS,
    cases: CASES,
    twoLookCornerIds: TWO_LOOK_CORNER_IDS,
    twoLookEdgeIds: TWO_LOOK_EDGE_IDS,
    catStep: CAT_STEP,
    invertAlg,
    toCubejsAlg,
    byCat,
    byId,
    twoLookCorners,
    twoLookEdges,
    lessonStepForCase,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
