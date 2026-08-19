// F2L 41-case library. Front-right slot. Classic script.
(function (g) {
  'use strict';

  function invertToken(tok) {
    if (tok.endsWith('2')) return tok;
    if (tok.endsWith("'")) return tok.slice(0, -1);
    return tok + "'";
  }

  function invertAlg(str) {
    return String(str).trim().split(/\s+/).filter(Boolean).reverse().map(invertToken).join(' ');
  }

  // cube.js parseAlg rejects tokens longer than 2 (Dw'). Wide → lowercase SiGN.
  function toCubejsAlg(str) {
    return String(str).trim().split(/\s+/).map(tok => {
      const m = tok.match(/^(Uw|Dw|Lw|Rw|Fw|Bw)(2|')?$/i);
      if (!m) return tok;
      return m[1][0].toLowerCase() + (m[2] || '');
    }).join(' ');
  }

  const CATS = [
    { id: 'basic', en: 'Basic inserts', ko: '기본 삽입' },
    { id: 'corner', en: 'Corner in the slot', ko: '코너가 슬롯에 있음' },
    { id: 'edge', en: 'Edge in the slot', ko: '엣지가 슬롯에 있음' },
    { id: 'split', en: 'Both pieces in U', ko: '둘 다 U층' },
    { id: 'advanced', en: 'Split / trapped', ko: '갈라짐·갇힘' },
  ];

  const CASES = [
    { id: 1, cat: 'basic',
      title: { en: 'Paired — insert right', ko: '페어 — 오른쪽 삽입' },
      tips: { en: 'Corner and edge already paired. White faces you. Drop into FR.', ko: '코너와 엣지가 이미 페어. 흰 면이 앞. FR에 넣기만 하면 됩니다.' },
      alg: "R U R'" },
    { id: 2, cat: 'basic',
      title: { en: 'Paired — insert left', ko: '페어 — 왼쪽 삽입' },
      tips: { en: 'Mirror of #1 for the front-left slot.', ko: '#1의 왼쪽 슬롯 미러.' },
      alg: "L' U' L" },
    { id: 3, cat: 'basic',
      title: { en: 'Paired — white on U', ko: '페어 — 흰 면이 위' },
      tips: { en: 'Pair is made but white points up. U to hide white, then insert.', ko: '페어는 됐지만 흰 면이 위. U로 돌린 뒤 삽입.' },
      alg: "U R U' R'" },
    { id: 4, cat: 'basic',
      title: { en: 'Hidden pair in the back', ko: '뒤에 숨은 페어' },
      tips: { en: 'Pair is already connected on U, sitting at the back. Bring it around, then insert.', ko: '페어는 이미 붙었고 U 뒤쪽에 있음. 앞으로 가져온 뒤 삽입.' },
      alg: "U' R U R' U2 R U' R'" },

    { id: 5, cat: 'corner',
      title: { en: 'Corner solved, edge on U', ko: '코너는 맞음, 엣지는 U' },
      tips: { en: 'Corner sits in FR. Edge is floating on U with white to the side.', ko: '코너는 FR. 엣지는 U에 떠 있고 흰 면이 옆.' },
      alg: "R U' R' U R U' R' U F' U' F" },
    { id: 6, cat: 'corner',
      title: { en: 'Corner solved, edge misoriented', ko: '코너는 맞음, 엣지 방향 오류' },
      tips: { en: 'Corner correct. Edge on U, flipped. Dw keeps other slots.', ko: '코너는 맞음. 엣지가 U에서 뒤집힘. Dw로 다른 슬롯을 지킵니다.' },
      alg: "R U' R' Dw R' U' R" },
    { id: 7, cat: 'corner',
      title: { en: 'Corner solved, edge flipped', ko: '코너는 맞음, 엣지 뒤집힘' },
      tips: { en: 'Take the corner out, flip the edge, put the pair back.', ko: '코너를 빼서 엣지를 뒤집고 다시 넣습니다.' },
      alg: "R U' R' U R U' R'" },
    { id: 8, cat: 'corner',
      title: { en: 'Corner in, edge in front', ko: '코너 삽입, 엣지 앞' },
      tips: { en: 'Corner in FR. Edge is at FU. Pair via the front.', ko: '코너는 FR. 엣지는 FU. 앞으로 페어.' },
      alg: "U' R U R' U F' U' F" },
    { id: 9, cat: 'corner',
      title: { en: 'Corner in, edge above flipped', ko: '코너 삽입, 위 엣지 뒤집힘' },
      tips: { en: 'Edge sits over the slot but the colours do not match yet.', ko: '엣지가 슬롯 위에 있지만 색이 아직 안 맞음.' },
      alg: "R U2 R' U' R U R'" },
    { id: 10, cat: 'corner',
      title: { en: 'Corner in, edge adjacent', ko: '코너 삽입, 엣지 인접' },
      tips: { en: 'Edge is next to the slot on U. Setup, then front insert.', ko: '엣지가 U에서 슬롯 옆. 각도를 맞춘 뒤 앞 삽입.' },
      alg: "R U' R' U2 F' U' F" },
    { id: 11, cat: 'corner',
      title: { en: 'Corner in, edge in back', ko: '코너 삽입, 엣지 뒤' },
      tips: { en: 'U2 to bring the edge around, then a right insert.', ko: 'U2로 엣지를 돌린 뒤 오른쪽 삽입.' },
      alg: "U2 R U R' U R U' R'" },
    { id: 12, cat: 'corner',
      title: { en: 'Corner in, edge opposite', ko: '코너 삽입, 엣지 반대' },
      tips: { en: 'Edge is across U. Two-step setup into a front insert.', ko: '엣지가 U 반대편. 두 단계로 앞 삽입.' },
      alg: "U' R U2 R' U F' U' F" },
    { id: 13, cat: 'corner',
      title: { en: 'Corner in, edge in a wrong slot', ko: '코너 삽입, 엣지 잘못된 슬롯' },
      tips: { en: 'Edge is trapped in another F2L slot. Keyhole it out with D, then insert.', ko: '엣지가 다른 F2L 슬롯에 끼어 있음. D 키홀로 뺀 뒤 삽입.' },
      alg: "R' D' R U' R' D R U R U' R'" },

    { id: 14, cat: 'edge',
      title: { en: 'Edge solved, corner on U', ko: '엣지는 맞음, 코너는 U' },
      tips: { en: 'FR edge is in. Corner on U with white on top.', ko: 'FR 엣지는 맞음. 코너가 U에 있고 흰 면이 위.' },
      alg: "U' R U' R' U R U R'" },
    { id: 15, cat: 'edge',
      title: { en: 'Edge in, corner misoriented', ko: '엣지 삽입, 코너 방향 오류' },
      tips: { en: 'Very common. Edge in FR, corner on U, white to the side.', ko: '매우 흔함. 엣지는 FR, 코너는 U, 흰 면이 옆.' },
      alg: "U' R U' R' U2 R U' R'" },
    { id: 16, cat: 'edge',
      title: { en: 'Edge in, corner twisted', ko: '엣지 삽입, 코너 꼬임' },
      tips: { en: 'Edge in. Corner on U needs a twist before it can pair.', ko: '엣지는 맞음. 코너를 한 번 꼬아 페어.' },
      alg: "R U2 R' U' R U' R'" },
    { id: 17, cat: 'edge',
      title: { en: 'Edge in, corner in front', ko: '엣지 삽입, 코너 앞' },
      tips: { en: 'Corner is at UFR. U2 setup into a right insert.', ko: '코너가 UFR. U2로 각도를 맞춘 뒤 삽입.' },
      alg: "U R U2 R' U R U' R'" },
    { id: 18, cat: 'edge',
      title: { en: 'Edge in, corner in back', ko: '엣지 삽입, 코너 뒤' },
      tips: { en: 'Corner sits at the back of U. U2, then pair.', ko: '코너가 U 뒤. U2 후 페어.' },
      alg: "U2 R U' R' U R U R'" },
    { id: 19, cat: 'edge',
      title: { en: 'Edge in, corner adjacent', ko: '엣지 삽입, 코너 인접' },
      tips: { en: 'Corner is next to FR on U.', ko: '코너가 U에서 FR 옆.' },
      alg: "U R U R' U2 R U' R'" },
    { id: 20, cat: 'edge',
      title: { en: 'Edge in, corner opposite', ko: '엣지 삽입, 코너 반대' },
      tips: { en: 'Corner across U. Two U2s to line it up.', ko: '코너가 U 반대편. U2 두 번으로 맞춤.' },
      alg: "U' R U2 R' U2 R U' R'" },
    { id: 21, cat: 'edge',
      title: { en: 'Edge in, corner above', ko: '엣지 삽입, 코너 바로 위' },
      tips: { en: 'Corner sits over the slot. Awkward orientation — extra U2.', ko: '코너가 슬롯 바로 위. 방향이 까다로워 U2가 더 들어갑니다.' },
      alg: "R U' R' U2 R U R' U R U' R'" },
    { id: 22, cat: 'edge',
      title: { en: 'Edge in, corner in a wrong slot', ko: '엣지 삽입, 코너 잘못된 슬롯' },
      tips: { en: 'Corner is stuck in another slot. Kick it to U, then insert.', ko: '코너가 다른 슬롯에 끼어 있음. U로 뺀 뒤 삽입.' },
      alg: "R U R' U' R U' R' U2 R U' R'" },

    { id: 23, cat: 'split',
      title: { en: 'Both on U — white in front', ko: '둘 다 위 — 흰 면 앞' },
      tips: { en: 'Most common split. White on the corner faces F. Pair, then insert.', ko: '가장 흔한 분리. 코너 흰 면이 앞. 페어 후 삽입.' },
      alg: "U R U' R' U' F' U F" },
    { id: 24, cat: 'split',
      title: { en: 'Both on U — white on right', ko: '둘 다 위 — 흰 면 오른쪽' },
      tips: { en: 'White on the corner faces R. Short right-hand trigger.', ko: '코너 흰 면이 오른쪽. 짧은 오른손 트리거.' },
      alg: "R U R' U' R U R'" },
    { id: 25, cat: 'split',
      title: { en: 'Both on U — white on left', ko: '둘 다 위 — 흰 면 왼쪽' },
      tips: { en: 'Mirror of #24. White faces F/L — use the front trigger.', ko: '#24의 미러. 흰 면이 앞/왼쪽 — 앞 트리거.' },
      alg: "F' U' F U' F' U F" },
    { id: 26, cat: 'split',
      title: { en: 'Both on U — white in back', ko: '둘 다 위 — 흰 면 뒤' },
      tips: { en: 'White faces away from you. U2, then a right insert.', ko: '흰 면이 뒤. U2 후 오른쪽 삽입.' },
      alg: "R U2 R' U' R U R'" },
    { id: 27, cat: 'split',
      title: { en: 'Both on U — white on top', ko: '둘 다 위 — 흰 면 위' },
      tips: { en: 'White sticker on U. Repeat a short trigger until they pair.', ko: '흰 스티커가 U. 짧은 트리거를 반복해 페어.' },
      alg: "R U' R' U R U' R' U R U' R'" },
    { id: 28, cat: 'split',
      title: { en: 'Corner on U, edge at FU', ko: '코너 U, 엣지 FU' },
      tips: { en: 'Edge is in the front, pointing up.', ko: '엣지가 앞에 있고 위쪽을 향함.' },
      alg: "U' R U R' U R U R'" },
    { id: 29, cat: 'split',
      title: { en: 'Corner on U, edge at FU flipped', ko: '코너 U, 엣지 FU 뒤집힘' },
      tips: { en: 'Front edge points down. Flip it while pairing.', ko: '앞 엣지가 아래. 페어하면서 뒤집습니다.' },
      alg: "U R U2 R' U R U' R'" },
    { id: 30, cat: 'split',
      title: { en: 'Corner over the slot, edge in front', ko: '코너가 슬롯 위, 엣지 앞' },
      tips: { en: 'Corner is above FR. Edge at FU. Extra U2 to line up.', ko: '코너가 FR 위. 엣지는 FU. U2로 맞춤.' },
      alg: "R U R' U2 R U' R' U R U' R'" },
    { id: 31, cat: 'split',
      title: { en: 'Corner in front, edge adjacent on U', ko: '코너 앞, 엣지 U 인접' },
      tips: { en: 'Corner at UFR. Edge next to it on U.', ko: '코너 UFR. 엣지가 U에서 옆.' },
      alg: "R U' R' U' R U R' U2 R U' R'" },
    { id: 32, cat: 'split',
      title: { en: 'Pieces far apart on U', ko: 'U에서 멀리 떨어짐' },
      tips: { en: 'Bring them together first, then a normal insert.', ko: '먼저 가까이 붙인 뒤 일반 삽입.' },
      alg: "U' R U' R' U2 R U' R'" },
    { id: 33, cat: 'split',
      title: { en: 'Pieces side by side on U', ko: 'U에서 나란히' },
      tips: { en: 'Adjacent but not paired. Dw to join, then insert.', ko: '옆이지만 아직 페어 아님. Dw로 붙인 뒤 삽입.' },
      alg: "U' R U R' Dw R' U' R" },
    { id: 34, cat: 'split',
      title: { en: 'Corner at FR, edge on U', ko: '코너 FR 세로, 엣지 U' },
      tips: { en: 'Corner is in the front-right column, not in the D slot.', ko: '코너가 앞-오른쪽 세로 모서리. D 슬롯은 아님.' },
      alg: "U R U2 R' U' R U R'" },
    { id: 35, cat: 'split',
      title: { en: 'Opposite colours facing', ko: '색이 서로 반대' },
      tips: { en: 'Both on U, colours point away from each other.', ko: '둘 다 U, 색이 서로 반대 방향.' },
      alg: "R U' R' U2 R U R' U R U' R'" },
    { id: 36, cat: 'split',
      title: { en: 'Mirror facing', ko: '거울처럼 마주봄' },
      tips: { en: 'Symmetric split. Front trigger, then a right insert.', ko: '대칭 분리. 앞 트리거 후 오른쪽 삽입.' },
      alg: "U F' U' F U' R U R'" },
    { id: 37, cat: 'split',
      title: { en: 'Both flipped on U', ko: '둘 다 U에서 뒤집힘' },
      tips: { en: 'Neither piece is ready to pair. Kick both, then insert.', ko: '어느 쪽도 페어 준비가 안 됨. 둘 다 뺀 뒤 삽입.' },
      alg: "R U R' U' R U' R' U2 R U' R'" },

    { id: 38, cat: 'advanced',
      title: { en: 'Split pair — vertical in the slot', ko: '분리 페어 — 슬롯에서 세로' },
      tips: { en: 'Corner in DFR, edge in FR, not paired. Take both out, pair on U, reinsert.', ko: '코너는 DFR, 엣지는 FR, 페어는 아님. 둘 다 빼서 U에서 붙인 뒤 다시 넣습니다.' },
      alg: "R U' R' U R U2 R' U R U' R'" },
    { id: 39, cat: 'advanced',
      title: { en: 'Split pair — horizontal', ko: '분리 페어 — 가로' },
      tips: { en: 'Corner in one slot, edge in the neighbouring slot.', ko: '코너는 한 슬롯, 엣지는 옆 슬롯.' },
      alg: "R U2 R' U' R U R' U2 R U' R'" },
    { id: 40, cat: 'advanced',
      title: { en: 'Both in the wrong slots', ko: '둘 다 잘못된 슬롯' },
      tips: { en: 'Corner and edge occupy two different F2L slots. Free them, then treat as a U case.', ko: '코너와 엣지가 서로 다른 F2L 슬롯. 빼서 U 케이스로 풉니다.' },
      alg: "R U' R' U R U2 R' U R U' R'" },
    { id: 41, cat: 'advanced',
      title: { en: 'Trapped pair', ko: '갇힌 페어' },
      tips: { en: 'The pair is connected but stuck in the wrong place. Extract the whole pair.', ko: '페어는 붙었지만 잘못된 자리에 끼어 있음. 페어 통째로 뺍니다.' },
      alg: "R U R' U2 R U2 R' U R U' R'" },
  ];

  const CAT_STEP = { basic: 1, corner: 2, edge: 3, split: 4, advanced: 5 };

  function byCat(cat) {
    return CASES.filter(c => c.cat === cat);
  }

  function byId(id) {
    return CASES.find(c => c.id === id) || null;
  }

  g.CubeF2L = {
    cats: CATS,
    cases: CASES,
    catStep: CAT_STEP,
    invertAlg,
    toCubejsAlg,
    byCat,
    byId,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
