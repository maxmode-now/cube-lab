// 레슨 데이터. UI/엔진과 분리. classic script (file:// 가능).
(function (g) {
  'use strict';

const _ = '_';
const STEP_STATES = [
  // 0: notation — 완성된 큐브 (U=흰, D=노랑)
  { U:[...Array(9)].map(()=>'W'), D:[...Array(9)].map(()=>'Y'), F:[...Array(9)].map(()=>'G'), B:[...Array(9)].map(()=>'B'), L:[...Array(9)].map(()=>'O'), R:[...Array(9)].map(()=>'R') },
  // 1: 흰 십자 (U에 + 모양, 각 엣지는 사이드 센터 색과 일치)
  { U:[_,'W',_, 'W','W','W', _,'W',_], F:[_,'G',_, _,'G',_, _,_,_], R:[_,'R',_, _,'R',_, _,_,_], B:[_,'B',_, _,'B',_, _,_,_], L:[_,'O',_, _,'O',_, _,_,_], D:[_,_,_, _,'Y',_, _,_,_] },
  // 2: 첫 층 완성 (U 전체 흰색, 사이드 위 한 줄 맞춤)
  { U:[...Array(9)].map(()=>'W'), F:['G','G','G', _,'G',_, _,_,_], R:['R','R','R', _,'R',_, _,_,_], B:['B','B','B', _,'B',_, _,_,_], L:['O','O','O', _,'O',_, _,_,_], D:[_,_,_, _,'Y',_, _,_,_] },
  // 3: 중간층 완성 (큐브 뒤집어 노랑 위 / D=흰, 사이드 아래 2줄 맞춤)
  { U:[_,_,_, _,'Y',_, _,_,_], F:[_,_,_, 'G','G','G', 'G','G','G'], R:[_,_,_, 'R','R','R', 'R','R','R'], B:[_,_,_, 'B','B','B', 'B','B','B'], L:[_,_,_, 'O','O','O', 'O','O','O'], D:[...Array(9)].map(()=>'W') },
  // 4: 노란 십자 (U에 + 모양)
  { U:[_,'Y',_, 'Y','Y','Y', _,'Y',_], F:[_,_,_, 'G','G','G', 'G','G','G'], R:[_,_,_, 'R','R','R', 'R','R','R'], B:[_,_,_, 'B','B','B', 'B','B','B'], L:[_,_,_, 'O','O','O', 'O','O','O'], D:[...Array(9)].map(()=>'W') },
  // 5: 노란 면 완성 (U 전체 노랑)
  { U:[...Array(9)].map(()=>'Y'), F:[_,_,_, 'G','G','G', 'G','G','G'], R:[_,_,_, 'R','R','R', 'R','R','R'], B:[_,_,_, 'B','B','B', 'B','B','B'], L:[_,_,_, 'O','O','O', 'O','O','O'], D:[...Array(9)].map(()=>'W') },
  // 6: 노란 코너 위치 (U 전체 노랑, 사이드 코너 위치 맞춤)
  { U:[...Array(9)].map(()=>'Y'), F:['G',_,'G', 'G','G','G', 'G','G','G'], R:['R',_,'R', 'R','R','R', 'R','R','R'], B:['B',_,'B', 'B','B','B', 'B','B','B'], L:['O',_,'O', 'O','O','O', 'O','O','O'], D:[...Array(9)].map(()=>'W') },
  // 7: 완성!
  { U:[...Array(9)].map(()=>'Y'), F:[...Array(9)].map(()=>'G'), R:[...Array(9)].map(()=>'R'), B:[...Array(9)].map(()=>'B'), L:[...Array(9)].map(()=>'O'), D:[...Array(9)].map(()=>'W') },
];

// ──────────────────────────────────────────────────────────
// 2단계: 초보자법(Layer-by-Layer) 레슨 가이드
//   각 단계: 목표 + 설명 + 시연 가능한 알고리즘
//   흰 면 위 → 노란 면 마지막 기준
// ──────────────────────────────────────────────────────────
const LESSONS_EN = [
  {
    title: 'Notation & Terms', name: 'Notation & Terms', intro: true,
    goal: 'Learn the turn notation (U R L F B D) and how to control the view.',
    desc: `<p>Each letter means turning that face <b>90° clockwise</b>, as seen looking straight at it.</p>
      <p><b>U</b>=Up <b>D</b>=Down <b>L</b>=Left <b>R</b>=Right <b>F</b>=Front <b>B</b>=Back.</p>
      <p>A <b>'</b> (prime) after the letter means <b>counter-clockwise</b>, and <b>2</b> means <b>180°</b> (twice). For example <b>R'</b>, <b>U2</b>.</p>
      <p>Drag empty space to orbit the view, or drag a face to turn it directly. Hit ▶Demo below to watch a turn happen.</p>`,
    algs: [{ label: 'Example: right → up → right back → up back', alg: "R U R' U'" }],
  },
  {
    title: 'Step 1 · White Cross', name: 'White Cross',
    goal: "Build a white + on the top face, with each edge's side colour matching its centre.",
    desc: `<p>Put the white centre on top. Find the four <b>edge pieces</b> (two colours) containing white and bring them up to form a + on the top face.</p>
      <p>Key point: a white cross alone is not enough — each edge's <b>side colour</b> must match that face's centre (the edge with a red side goes above the red centre).</p>
      <p>There is no algorithm to memorise here — solve it by <b>intuition</b>. Bring the edge into the bottom layer, then turn that face twice to lift it up.</p>`,
    algs: [{ label: 'Lifting an edge up from the bottom (front face twice)', alg: 'F2' }],
  },
  {
    title: 'Step 2 · White Corners (First Layer)', name: 'White Corners (First Layer)',
    goal: 'Fill in the four white corners under the cross to complete the first layer.',
    desc: `<p>Bring a <b>corner piece</b> (three colours) containing white to the bottom layer, <b>directly below</b> where it belongs.</p>
      <p>Then repeat the algorithm below 1–5 times, <b>until white moves from the side up to the top face</b> — the corner drops right into place.</p>
      <p>Start with that corner at the front-bottom-right.</p>`,
    algs: [{ label: 'Corner insert (repeat as needed)', alg: "R' D' R D" }],
  },
  {
    title: 'Step 3 · Middle Layer Edges', name: 'Middle Layer Edges',
    goal: 'Place the four second-layer edges to finish the top two layers.',
    desc: `<p><b>Flip the cube over</b> so the finished white face is on the bottom. Yellow is now on top.</p>
      <p>Find an edge in the top layer <b>with no yellow</b>, line it up with U so its side colour matches the centre, then use the algorithm for the direction it needs to go.</p>
      <p>The algorithm differs for inserting to the <b>right</b> versus the <b>left</b>.</p>`,
    algs: [
      { label: 'Insert to the right', alg: "U R U' R' U' F' U F" },
      { label: 'Insert to the left', alg: "U' L' U L U F U' F'" },
    ],
  },
  {
    title: 'Step 4 · Yellow Cross', name: 'Yellow Cross',
    goal: "Make a yellow + on the top face. (Side colours don't matter yet.)",
    desc: `<p>The yellow edge pattern on top usually progresses <b>dot → L-shape → line → cross</b>.</p>
      <p>Repeat the algorithm below. Hold the <b>L-shape</b> with its two arms pointing <b>left and up</b>, and hold the <b>line</b> <b>horizontally</b>.</p>`,
    algs: [{ label: 'Make the yellow cross (repeat until formed)', alg: "F R U R' U' F'" }],
  },
  {
    title: 'Step 5 · Yellow Face', name: 'Yellow Face',
    goal: 'Turn the whole top face yellow. (Orient the corners.)',
    desc: `<p>From the yellow cross, fix the <b>orientation of the top corners</b> with the <b>Sune</b> algorithm below.</p>
      <p>Put an unsolved corner at the <b>front-left</b> and apply it → then put the next unsolved corner at the front-left and repeat, until the whole top is yellow. (It looks scrambled in between — that's normal.)</p>`,
    algs: [{ label: 'Sune — orient the corners (repeat)', alg: "R U R' U R U2 R'" }],
  },
  {
    title: 'Step 6 · Yellow Corner Positions', name: 'Yellow Corner Positions',
    goal: 'Send the yellow corners to their correct spots, so the side colours line up.',
    desc: `<p>With the top all yellow, now change the corners' <b>positions</b>.</p>
      <p>If any corner is already <b>in the right place</b>, hold it at the <b>back-right</b> and apply the algorithm. If none is, apply it once from any angle and one will land correctly.</p>`,
    algs: [{ label: 'Swap corner positions (repeat)', alg: "U R U' L' U R' U' L" }],
  },
  {
    title: 'Step 7 · Yellow Edge Positions (Done!)', name: 'Yellow Edge Positions (Done!)',
    goal: 'Cycle the last edges into place and finish the cube.',
    desc: `<p>The corners are all set, so finish by <b>cycling the remaining three edges</b>.</p>
      <p>If one edge is already <b>solved</b>, hold that face at the <b>back</b> and apply the algorithm. If one pass isn't enough, apply it once more and you're done. 🎉</p>`,
    algs: [{ label: '3-edge cycle (U-perm)', alg: "R U' R U R U R U' R' U' R2" }],
  },
];

const LESSONS_KO = [
  {
    title: '용어와 표기법', name: '용어와 표기법', intro: true,
    goal: '돌리기 표기(U R L F B D)와 화면 조작을 익힙니다.',
    desc: `<p>각 글자는 한 면을 <b>시계 방향 90°</b> 돌린다는 뜻이에요. 면을 정면으로 봤을 때 기준입니다.</p>
      <p><b>U</b>=위 <b>D</b>=아래 <b>L</b>=왼쪽 <b>R</b>=오른쪽 <b>F</b>=앞 <b>B</b>=뒤.</p>
      <p>글자 뒤 <b>'</b>(프라임)은 <b>반시계</b>, <b>2</b>는 <b>180°</b>(두 번)예요. 예: <b>R'</b>, <b>U2</b>.</p>
      <p>큐브는 마우스로 빈 곳을 드래그해 시점을 돌리고, 면을 드래그하면 직접 돌릴 수 있어요. 아래 ▶시연으로 직접 돌아가는 걸 보세요.</p>`,
    algs: [{ label: '예시: 오른쪽→위→오른쪽 되돌리기→위 되돌리기', alg: "R U R' U'" }],
  },
  {
    title: '1단계 · 흰색 십자', name: '흰색 십자',
    goal: '윗면(흰색)에 흰 모서리 4개로 +자를 만들되, 옆면 색이 가운데(센터)와 맞아야 합니다.',
    desc: `<p>흰색 센터를 위로 둡니다. 흰색이 들어간 <b>모서리 조각(엣지, 2색)</b> 4개를 찾아 윗면에 +자로 올려요.</p>
      <p>핵심: 단순히 흰 십자만 만드는 게 아니라, 각 엣지의 <b>옆면 색</b>이 그 면의 센터와 같아야 해요(예: 빨강 옆면을 가진 엣지는 빨강 센터 위로).</p>
      <p>이 단계는 외울 공식 없이 <b>직관</b>으로 풀어요. 엣지를 아랫줄로 가져온 뒤 해당 면을 두 번 돌려 위로 올리면 됩니다.</p>`,
    algs: [{ label: '아래에 온 엣지를 위로 올리는 예 (앞면 두 번)', alg: 'F2' }],
  },
  {
    title: '2단계 · 흰색 코너 (첫 층 완성)', name: '흰색 코너 (첫 층 완성)',
    goal: '흰 십자 아래 4개의 흰색 코너를 채워 첫 번째 층을 완성합니다.',
    desc: `<p>흰색이 들어간 <b>코너 조각(3색)</b>을, 들어갈 자리 <b>바로 아래</b>(아랫줄)로 가져옵니다.</p>
      <p>그 상태에서 아래 공식을 <b>흰색이 옆면→윗면으로 올라올 때까지</b> 1~5번 반복하면 코너가 제자리에 쏙 들어가요.</p>
      <p>코너를 오른쪽 앞 아래에 두고 시작하세요.</p>`,
    algs: [{ label: '코너 삽입 (필요한 만큼 반복)', alg: "R' D' R D" }],
  },
  {
    title: '3단계 · 중간층 모서리', name: '중간층 모서리',
    goal: '두 번째 층의 모서리 4개를 맞춰 위 두 층을 완성합니다.',
    desc: `<p>완성한 흰 면을 <b>아래로 뒤집습니다</b>. 이제 노란 면이 위예요.</p>
      <p>윗줄에서 <b>노란색이 없는 엣지</b>를 찾아, 옆면 색이 센터와 맞도록 U로 정렬한 뒤 들어갈 방향에 따라 공식을 씁니다.</p>
      <p><b>오른쪽</b>으로 넣을 때와 <b>왼쪽</b>으로 넣을 때 공식이 달라요.</p>`,
    algs: [
      { label: '오른쪽으로 삽입', alg: "U R U' R' U' F' U F" },
      { label: '왼쪽으로 삽입', alg: "U' L' U L U F U' F'" },
    ],
  },
  {
    title: '4단계 · 노란 십자', name: '노란 십자',
    goal: '윗면(노랑)에 노란 +자를 만듭니다. (옆면 색은 아직 신경 안 써요)',
    desc: `<p>윗면 노란색 엣지 모양은 보통 <b>점 → ⌐자(꺾쇠) → 일자 → 십자</b> 순서로 발전해요.</p>
      <p>아래 공식을 반복합니다. <b>꺾쇠</b>는 두 변이 <b>왼쪽·위</b>를 향하게, <b>일자</b>는 <b>가로</b>로 두고 적용하세요.</p>`,
    algs: [{ label: '노란 십자 만들기 (모양 될 때까지 반복)', alg: "F R U R' U' F'" }],
  },
  {
    title: '5단계 · 노란 면 완성', name: '노란 면 완성',
    goal: '윗면 전체를 노란색으로 만듭니다. (코너 방향 맞추기)',
    desc: `<p>노란 십자 상태에서 윗면 <b>코너들의 방향</b>을 맞춰요. 아래 <b>Sune(수네)</b> 공식을 씁니다.</p>
      <p>맞춰지지 않은 코너를 <b>왼쪽 앞</b>에 두고 공식을 적용 → 다시 안 된 코너를 왼쪽 앞에 두고 반복. 윗면이 전부 노랑이 될 때까지 반복하세요. (중간에 흐트러져 보여도 정상)</p>`,
    algs: [{ label: 'Sune — 코너 방향 맞추기 (반복)', alg: "R U R' U R U2 R'" }],
  },
  {
    title: '6단계 · 노란 코너 위치', name: '노란 코너 위치',
    goal: '노란 코너들을 올바른 자리로 보냅니다. (옆면 색이 맞물리게)',
    desc: `<p>윗면이 노랑이 된 상태에서, 이제 코너의 <b>위치</b>를 바꿔요.</p>
      <p>먼저 이미 <b>제자리에 맞은 코너</b>가 하나라도 있으면 그걸 <b>오른쪽 뒤</b>에 두고 공식을 적용. 없으면 아무 방향에서 한 번 적용하면 하나가 맞아요.</p>`,
    algs: [{ label: '코너 위치 교환 (반복)', alg: "U R U' L' U R' U' L" }],
  },
  {
    title: '7단계 · 노란 모서리 위치 (완성!)', name: '노란 모서리 위치 (완성!)',
    goal: '마지막 모서리들을 제자리로 돌려 큐브를 완성합니다.',
    desc: `<p>코너가 다 맞았으니 남은 <b>엣지 3개를 회전</b>시켜 마무리해요.</p>
      <p>이미 <b>맞은 엣지</b>가 하나 있으면 그 면을 <b>뒤쪽</b>에 두고 공식을 적용. 한 번에 안 되면 한 번 더 적용하면 완성됩니다. 🎉</p>`,
    algs: [{ label: '엣지 3-회전 (U-perm)', alg: "R U' R U R U R U' R' U' R2" }],
  },
];

// ── 효율(CFOP / 4-look LL) 레슨 트랙 ──
// playAlg는 면 회전(U R L F D B)만 지원 → 모든 공식은 회전·와이드무브 없는 면-전용
const CFOP_EN = [
  {
    title: 'CFOP Overview', intro: true,
    goal: 'Fewer moves, faster times — the four stages Cross · F2L · OLL · PLL.',
    desc: `<p>This is the standard speedcubing method. It averages far fewer moves than the layer-by-layer beginner method.</p>
      <p><b>C</b>ross → <b>F2L</b> (first two layers) → <b>O</b>LL (orient last layer) → <b>P</b>LL (permute last layer).</p>
      <p>Here you'll learn the entry-level <b>4-look LL</b> (solving the last layer in four looks): 2 OLL steps + 2 PLL steps. Few algorithms, easy to memorise.</p>`,
    algs: [],
  },
  {
    title: '1. Cross — Efficiently',
    goal: 'Build the bottom white cross in 4–7 moves by planning ahead.',
    desc: `<p>The same white cross as the beginner method, but instead of <b>one edge at a time</b> you <b>plan the whole route</b> in advance and use fewer moves.</p>
      <p>During inspection, trace the paths of all four cross edges in your head. There is no set algorithm — it's intuition plus practice.</p>
      <p>With experience you'll be able to build the cross without looking at it (blind).</p>`,
    algs: [],
  },
  {
    title: '2. F2L — Pairing Corner + Edge',
    goal: 'Insert the first two layers by <b>pairing a corner and edge and placing them together</b>.',
    desc: `<p>The beginner method inserts corners and middle-layer edges separately. F2L builds a <b>corner+edge pair</b> and drops both into the slot at once — much faster, far fewer moves.</p>
      <p>The most basic case: the pair is already split in the top layer and the slot is empty, so use the algorithm below to insert it.</p>
      <p>These assume the front-right slot. Mirror them left/right depending on where the pair sits.</p>`,
    algs: [
      { label: 'Insert into the right slot', alg: "U R U' R'" },
      { label: 'Insert into the left slot', alg: "U' L' U L" },
      { label: 'Insert via the front', alg: "U' F' U F" },
    ],
  },
  {
    title: '3. OLL ① — Yellow Cross',
    goal: 'Get a yellow + on top (orient the edges).',
    desc: `<p>Once F2L is done, orient the top (yellow) edges first. The shape goes <b>dot → L-shape → line → cross</b>.</p>
      <p>Apply the single algorithm below to match the shape: hold the <b>L-shape</b> with its arms left and up, and the <b>line</b> horizontally.</p>`,
    algs: [{ label: 'Yellow cross (repeat until formed)', alg: "F R U R' U' F'" }],
  },
  {
    title: '3. OLL ② — Yellow Corners',
    goal: 'Make the whole top yellow (orient the corners). 4-look uses Sune/Antisune.',
    desc: `<p>From the yellow cross, orient the corners to complete the top face.</p>
      <p>The entry-level 2-look approach solves every corner orientation with just <b>Sune</b> and <b>Antisune</b> (repeat and reposition as needed).</p>
      <p>Later, memorising all 7 OLL corner cases lets you finish it in one algorithm.</p>`,
    algs: [
      { label: 'Sune', alg: "R U R' U R U2 R'" },
      { label: 'Antisune', alg: "R U2 R' U' R U' R'" },
    ],
  },
  {
    title: '4. PLL ① — Corner Positions',
    goal: 'Move the top corners into place (3-corner cycle).',
    desc: `<p>The top is yellow, so now fix the <b>positions</b> — corners first.</p>
      <p>Use the <b>A-perm</b> below (cycles three corners). If one corner is already correct, work from it; if none is, apply it once and look again. For a diagonal swap, apply it twice.</p>`,
    algs: [{ label: '3-corner cycle (A-perm)', alg: "R' F R' B2 R F' R' B2 R2" }],
  },
  {
    title: '4. PLL ② — Edge Positions (Done!)',
    goal: 'Cycle the last edges to finish the cube. 🎉',
    desc: `<p>With the corners done, finish by <b>cycling the remaining three edges</b>.</p>
      <p>Two <b>U-perm</b> variants (clockwise / counter-clockwise cycle) cover the 3-edge cases. Finish with an AUF (a turn of the top) to align. Done!</p>`,
    algs: [
      { label: 'U-perm (a)', alg: "R U' R U R U R U' R' U' R2" },
      { label: 'U-perm (b)', alg: "R2 U R U R' U' R' U' R' U R'" },
    ],
  },
];

const CFOP_KO = [
  {
    title: 'CFOP 개요', intro: true,
    goal: '더 적은 수로 빠르게 — Cross · F2L · OLL · PLL 4단계.',
    desc: `<p>속도 큐빙의 표준 방법이에요. 초보자법(층층이)보다 평균 수가 훨씬 적어요.</p>
      <p><b>C</b>ross(십자) → <b>F2L</b>(첫 두 층) → <b>O</b>LL(윗면 색) → <b>P</b>LL(윗면 위치).</p>
      <p>여기선 입문용 <b>4-look LL</b>(마지막 층을 4번에 나눠 풀기)을 배워요: OLL 2단계 + PLL 2단계. 공식 수가 적어 외우기 쉬워요.</p>`,
    algs: [],
  },
  {
    title: '1. Cross — 효율적으로',
    goal: '바닥 흰 십자를 가능하면 4~7수 안에, 미리 계획해서.',
    desc: `<p>초보자법과 같은 흰 십자지만, <b>한 번에 한 면씩</b>이 아니라 <b>미리 경로를 계획</b>해 적은 수로 만들어요.</p>
      <p>섞인 상태를 보는 동안(인스펙션) 십자 엣지 4개의 경로를 머릿속으로 그려요. 정해진 공식은 없고 직관 + 연습이에요.</p>
      <p>익숙해지면 흰 십자를 보지 않고도(블라인드) 만들 수 있게 돼요.</p>`,
    algs: [],
  },
  {
    title: '2. F2L — 코너+엣지 페어링',
    goal: '첫 두 층을 코너와 엣지를 <b>쌍으로 묶어 한 번에</b> 삽입.',
    desc: `<p>초보자법은 코너 따로, 중간층 엣지 따로 넣지만, F2L은 <b>코너+엣지 쌍</b>을 만들어 슬롯에 동시에 넣어요. 훨씬 빠르고 수가 적어요.</p>
      <p>가장 기본: 위층에서 쌍이 이미 만들어져(분리돼) 있고 슬롯이 비었을 때, 아래 공식으로 끼워 넣어요.</p>
      <p>오른쪽 앞 슬롯 기준이에요. 쌍의 위치에 따라 좌우 대칭으로 적용하세요.</p>`,
    algs: [
      { label: '오른쪽 슬롯 삽입', alg: "U R U' R'" },
      { label: '왼쪽 슬롯 삽입', alg: "U' L' U L" },
      { label: '앞면으로 삽입', alg: "U' F' U F" },
    ],
  },
  {
    title: '3. OLL ① — 노란 십자',
    goal: '윗면에 노란 +자 (엣지 방향 맞추기).',
    desc: `<p>F2L이 끝나면 윗면(노랑) 엣지 방향부터 맞춰요. 모양은 <b>점 → 꺾쇠 → 일자 → 십자</b> 순.</p>
      <p>아래 공식 하나를 모양에 맞춰 적용: <b>꺾쇠</b>는 두 변이 왼쪽·위로, <b>일자</b>는 가로로 두고.</p>`,
    algs: [{ label: '노란 십자 (모양 될 때까지)', alg: "F R U R' U' F'" }],
  },
  {
    title: '3. OLL ② — 노란 코너',
    goal: '윗면 전체를 노랑으로 (코너 방향). 4-look은 Sune/Antisune로.',
    desc: `<p>노란 십자 상태에서 코너 방향을 맞춰 윗면을 완성해요.</p>
      <p>입문용 2-look은 <b>Sune</b>와 <b>Antisune</b> 두 공식만으로 모든 코너 방향을 풀 수 있어요(필요한 만큼 반복·재배치).</p>
      <p>나중에 7개 OLL 코너 케이스를 모두 외우면 한 번에 끝나요.</p>`,
    algs: [
      { label: 'Sune', alg: "R U R' U R U2 R'" },
      { label: 'Antisune', alg: "R U2 R' U' R U' R'" },
    ],
  },
  {
    title: '4. PLL ① — 코너 위치',
    goal: '윗면 코너를 제자리로 (3-코너 순환).',
    desc: `<p>윗면이 노랑이 됐으니 이제 <b>위치</b>를 맞춰요. 먼저 코너부터.</p>
      <p>아래 <b>A-perm</b>(코너 3개 순환)으로 코너를 배치해요. 맞은 코너가 하나 있으면 그걸 기준으로, 없으면 한 번 적용 후 다시 봐요. 대각 교환은 두 번 적용.</p>`,
    algs: [{ label: '코너 3-순환 (A-perm)', alg: "R' F R' B2 R F' R' B2 R2" }],
  },
  {
    title: '4. PLL ② — 엣지 위치 (완성!)',
    goal: '마지막 엣지를 순환시켜 큐브 완성. 🎉',
    desc: `<p>코너가 다 맞았으면 남은 <b>엣지 3개를 순환</b>해 마무리해요.</p>
      <p><b>U-perm</b> 두 종류(시계/반시계 순환)면 엣지 3-순환 케이스를 풀 수 있어요. 마지막에 윗면을 돌려(AUF) 정렬하면 완성!</p>`,
    algs: [
      { label: 'U-perm (a)', alg: "R U' R U R U R U' R' U' R2" },
      { label: 'U-perm (b)', alg: "R2 U R U R' U' R' U' R' U R'" },
    ],
  },
];


const f2 = c => [c, c, c, c];
const STEP_STATES_2 = [
  { U: f2('W'), D: f2('Y'), F: f2('G'), B: f2('B'), L: f2('O'), R: f2('R') },
  { U: f2('W'), F: ['G','G', '_','_'], R: ['R','R', '_','_'], B: ['B','B', '_','_'], L: ['O','O', '_','_'], D: ['_','_','_','_'] },
  { U: f2('Y'), F: ['_','_', 'G','G'], R: ['_','_', 'R','R'], B: ['_','_', 'B','B'], L: ['_','_', 'O','O'], D: f2('W') },
  { U: f2('Y'), D: f2('W'), F: f2('G'), R: f2('R'), B: f2('B'), L: f2('O') },
];

const LESSONS_2_EN = [
  {
    title: 'Notation (2×2)', name: 'Notation', intro: true,
    goal: 'Same face letters as 3×3. A 2×2 is eight corners only — no edges or centres.',
    desc: `<p>Turns use the same letters: <b>U D L R F B</b>. Clockwise 90°, <b>'</b> = counter-clockwise, <b>2</b> = 180°.</p>
      <p>A 2×2 has only <b>corner pieces</b> (three colours each). There are no centres to hold as a reference, so you keep one solved face as your “anchor”.</p>
      <p>Orbit by dragging empty space; drag a face to turn it. ▶Demo below shows a short trigger.</p>`,
    algs: [{ label: 'Example trigger', alg: "R U R' U'" }],
  },
  {
    title: 'Step 1 · White Layer', name: 'White Layer',
    goal: 'Solve the four white corners so white is on top and the side colours match around the first layer.',
    desc: `<p>Pick white as the first face. Place one white corner, then insert the other three <b>below their slot</b> and repeat the algorithm until white flips up.</p>
      <p>The side colours of the first layer must match each other (green next to green, and so on). There is no centre — match the corners to each other.</p>
      <p>Start with the working corner at <b>front-bottom-right</b>.</p>`,
    algs: [{ label: 'Corner insert (repeat as needed)', alg: "R' D' R D" }],
  },
  {
    title: 'Step 2 · Yellow Orientation (OLL)', name: 'Yellow Orientation',
    goal: 'Flip the cube (white down) and make the whole top face yellow.',
    desc: `<p><b>Turn the cube over</b> so the finished white layer is on the bottom. Yellow corners are on top, probably mixed.</p>
      <p>Use <b>Sune</b> and <b>Antisune</b> until the top is all yellow. Put the case in a familiar angle, apply, then AUF (turn U) and repeat. The first layer will look messy in between — that is normal.</p>`,
    algs: [
      { label: 'Sune', alg: "R U R' U R U2 R'" },
      { label: 'Antisune', alg: "R U2 R' U' R U' R'" },
    ],
  },
  {
    title: 'Step 3 · Yellow Permutation (Done!)', name: 'Yellow Permutation',
    goal: 'Swap the last-layer corners into place and finish the 2×2.',
    desc: `<p>The top is yellow; now fix <b>corner positions</b>.</p>
      <p><b>Adjacent swap</b>: two corners that need to swap are next to each other — hold them so matching side colours (“headlights”) are on the back, then apply T-perm.</p>
      <p><b>Diagonal swap</b>: opposite corners need to swap — use Y-perm. Finish with a U turn (AUF) if needed. 🎉</p>`,
    algs: [
      { label: 'Adjacent swap (T-perm)', alg: "R U R' F' R U R' U' R' F R2 U' R' U'" },
      { label: 'Diagonal swap (Y-perm)', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
    ],
  },
];

const LESSONS_2_KO = [
  {
    title: '표기법 (2×2)', name: '표기법', intro: true,
    goal: '3×3과 같은 면 글자. 2×2는 코너 8개뿐 — 엣지·센터가 없습니다.',
    desc: `<p>돌리기는 같은 글자예요: <b>U D L R F B</b>. 시계 90°, <b>'</b> = 반시계, <b>2</b> = 180°.</p>
      <p>2×2는 <b>코너 조각</b>(3색)만 있어요. 기준이 되는 센터가 없으니, 맞춘 한 면을 “앵커”로 두고 진행합니다.</p>
      <p>빈 곳을 드래그해 시점을 돌리고, 면을 드래그하면 직접 돌려요. 아래 ▶시연으로 짧은 트리거를 보세요.</p>`,
    algs: [{ label: '예시 트리거', alg: "R U R' U'" }],
  },
  {
    title: '1단계 · 흰 층', name: '흰 층',
    goal: '흰 코너 4개를 맞춰 윗면이 하얗고, 옆면 색이 첫 층에서 서로 맞게 합니다.',
    desc: `<p>흰색을 첫 면으로 고릅니다. 흰 코너 하나를 맞춘 뒤, 나머지 셋을 <b>들어갈 자리 바로 아래</b>에 두고 공식을 반복해 흰색이 위로 올라오게 해요.</p>
      <p>첫 층의 옆면 색은 서로 같아야 해요(초록 옆에 초록). 센터가 없으니 코너끼리 맞춰요.</p>
      <p>작업 중인 코너는 <b>오른쪽 앞 아래</b>에 두고 시작하세요.</p>`,
    algs: [{ label: '코너 삽입 (필요한 만큼 반복)', alg: "R' D' R D" }],
  },
  {
    title: '2단계 · 노란 방향 (OLL)', name: '노란 방향',
    goal: '큐브를 뒤집어(흰 면 아래) 윗면 전체를 노랑으로 만듭니다.',
    desc: `<p>완성한 흰 층을 <b>아래로 뒤집습니다</b>. 노란 코너가 위에 있고 방향은 섞여 있을 거예요.</p>
      <p><b>Sune</b>와 <b>Antisune</b>을 써서 윗면이 전부 노랑이 될 때까지 맞추세요. 익숙한 각도로 두고 적용 → U를 돌려(AUF) 반복. 중간에 첫 층이 흐트러져 보여도 정상입니다.</p>`,
    algs: [
      { label: 'Sune', alg: "R U R' U R U2 R'" },
      { label: 'Antisune', alg: "R U2 R' U' R U' R'" },
    ],
  },
  {
    title: '3단계 · 노란 위치 (완성!)', name: '노란 위치',
    goal: '마지막 층 코너를 제자리로 바꿔 2×2를 완성합니다.',
    desc: `<p>윗면은 노랑이니 이제 코너 <b>위치</b>를 맞춥니다.</p>
      <p><b>인접 교환</b>: 바꿔야 할 코너가 서로 옆일 때 — 같은 옆면 색(“헤드라이트”)이 뒤쪽에 오게 들고 T-perm.</p>
      <p><b>대각 교환</b>: 반대편 코너를 바꿀 때 — Y-perm. 필요하면 마지막에 U를 돌려(AUF) 정렬하면 완성입니다. 🎉</p>`,
    algs: [
      { label: '인접 교환 (T-perm)', alg: "R U R' F' R U R' U' R' F R2 U' R' U'" },
      { label: '대각 교환 (Y-perm)', alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
    ],
  },
];

  g.CubeLessons = {
    states3: STEP_STATES,
    beginner3: { en: LESSONS_EN, ko: LESSONS_KO },
    cfop: { en: CFOP_EN, ko: CFOP_KO },
    states2: STEP_STATES_2,
    beginner2: { en: LESSONS_2_EN, ko: LESSONS_2_KO },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
