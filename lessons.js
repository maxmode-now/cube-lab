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
// playAlg는 면 회전 + 3×3 M/E/S·와이드(Rw 등) + 4×4/5×5 슬라이스를 지원.
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

// Roux 목표 전개도. 흰=D, 노랑=U. 왼쪽 1x2x3 = First Block, 오른쪽 = Second Block.
const STEP_STATES_ROUX = [
  // 0: 개요 — 완성
  { U:[...Array(9)].map(()=>'Y'), D:[...Array(9)].map(()=>'W'), F:[...Array(9)].map(()=>'G'), B:[...Array(9)].map(()=>'B'), L:[...Array(9)].map(()=>'O'), R:[...Array(9)].map(()=>'R') },
  // 1: First Block (왼쪽 1x2x3)
  { U:[_,_,_, _,'Y',_, _,_,_], D:['W',_,_, 'W','W',_, 'W',_,_], F:[_,_,_, 'G','G',_, 'G',_,_], B:[_,_,_, _,'B','B', _,_,'B'], L:[_,_,_, 'O','O','O', 'O','O','O'], R:[_,_,_, _,'R',_, _,_,_] },
  // 2: Second Block (양쪽 1x2x3)
  { U:[_,_,_, _,'Y',_, _,_,_], D:['W',_,'W', 'W','W','W', 'W',_,'W'], F:[_,_,_, 'G','G','G', 'G',_,'G'], B:[_,_,_, 'B','B','B', 'B',_,'B'], L:[_,_,_, 'O','O','O', 'O','O','O'], R:[_,_,_, 'R','R','R', 'R','R','R'] },
  // 3: CMLL (윗면 코너만 맞춤, 엣지는 아직)
  { U:['Y',_,'Y', _,'Y',_, 'Y',_,'Y'], D:['W',_,'W', 'W','W','W', 'W',_,'W'], F:['G',_,'G', 'G','G','G', 'G',_,'G'], B:['B',_,'B', 'B','B','B', 'B',_,'B'], L:['O',_,'O', 'O','O','O', 'O','O','O'], R:['R',_,'R', 'R','R','R', 'R','R','R'] },
  // 4: LSE 4a — 엣지 방향 (U/D에 노랑·흰)
  { U:['Y','Y','Y', _,'Y',_, 'Y','Y','Y'], D:['W','W','W', 'W','W','W', 'W','W','W'], F:['G',_,'G', 'G','G','G', 'G',_,'G'], B:['B',_,'B', 'B','B','B', 'B',_,'B'], L:['O',_,'O', 'O','O','O', 'O','O','O'], R:['R',_,'R', 'R','R','R', 'R','R','R'] },
  // 5: LSE 4b — UL / UR
  { U:['Y',_,'Y', 'Y','Y','Y', 'Y',_,'Y'], D:['W',_,'W', 'W','W','W', 'W',_,'W'], F:['G',_,'G', 'G','G','G', 'G',_,'G'], B:['B',_,'B', 'B','B','B', 'B',_,'B'], L:['O','O','O', 'O','O','O', 'O','O','O'], R:['R','R','R', 'R','R','R', 'R','R','R'] },
  // 6: LSE 4c — 완성
  { U:[...Array(9)].map(()=>'Y'), D:[...Array(9)].map(()=>'W'), F:[...Array(9)].map(()=>'G'), B:[...Array(9)].map(()=>'B'), L:[...Array(9)].map(()=>'O'), R:[...Array(9)].map(()=>'R') },
];

const ROUX_EN = [
  {
    title: 'Roux Overview', intro: true,
    goal: 'Block building: First Block · Second Block · CMLL · LSE. About 48 moves, few cube rotations.',
    desc: `<p>Gilles Roux’s 2003 method. You build two 1x2x3 blocks on the left and right, solve the last-layer <b>corners</b> (CMLL), then the last six <b>edges</b> with only M and U (LSE).</p>
      <p>Compared with CFOP (~60 moves), Roux averages about <b>48</b>. Fewer cube rotations, and the last step is a smooth M-slice flow — a favourite for one-handed solving.</p>
      <p>This track is the entry path: intuitive blocks, <b>2-look CMLL</b> (a few algs), then LSE as three short sub-steps. Full CMLL is 42 cases later.</p>`,
    algs: [{ label: 'M-slice feel (M and U)', alg: "M' U M U'" }],
  },
  {
    title: '1. First Block (FB)',
    goal: 'Build a 1x2x3 on the left in about 7–8 moves.',
    desc: `<p>Hold the cube so the first block will sit on the <b>left</b> (this trainer uses orange left, white down). Pair a corner and edge into a “square”, then expand to the full 1x2x3.</p>
      <p>No set algorithm — intuition. During inspection, look for a pair that is already made. Colour neutrality (white <i>or</i> yellow on bottom) finds those pairs faster.</p>
      <p>The left face’s bottom two rows plus the matching white stickers on D should be solved. The top row of L and the M slice stay free.</p>`,
    algs: [{ label: 'Example pair insert (right)', alg: "U R U' R'" }],
  },
  {
    title: '2. Second Block (SB)',
    goal: 'Build the matching 1x2x3 on the right without breaking First Block.',
    desc: `<p>Harder than FB because the left block must stay intact. Favour <b>R, r (Rw), U</b>. Avoid L / Lw. Skip M while a Second Block piece still lives in the M slice.</p>
      <p>Build a corner–edge pair on top (FR/FU), then insert with R / r / U. Keyhole: turn U to set up an insert without ripping the right block you already placed.</p>
      <p>When both blocks are done, only the U-layer corners and six edges (UL, UR, and the four M-slice edges) remain.</p>`,
    algs: [
      { label: 'Insert into the right slot', alg: "U R U' R'" },
      { label: 'Wide R (r) trigger', alg: "Rw U Rw'" },
    ],
  },
  {
    title: '3. CMLL — Last-layer corners',
    goal: 'Solve all four U corners in one stage. Ignore the M-slice edges.',
    desc: `<p>Unlike CFOP OLL, CMLL ignores edges, so the algs are shorter. Full CMLL is 42 cases (O, H, Pi, U, T, S, As, L). Start with <b>2-look</b>.</p>
      <p><b>Look 1 — orient:</b> Sune until yellow is on top of every U corner. Put an unoriented corner at front-left and repeat. It will look messy in between.</p>
      <p><b>Look 2 — permute:</b> cycle three corners with A-perm. If one corner is already correct, hold from it. Edges can scramble — LSE will fix them.</p>`,
    algs: [
      { label: 'Sune — orient corners', alg: "R U R' U R U2 R'" },
      { label: 'A-perm — 3-corner cycle', alg: "R' F R' B2 R F' R' B2 R2" },
    ],
  },
  {
    title: '4. LSE ① — Edge orientation (4a)',
    goal: 'Orient the last six edges using only M and U.',
    desc: `<p>LSE (Last Six Edges) is Roux’s signature step. All remaining work is <b>M</b> and <b>U</b>. First, make every leftover edge oriented (yellow or white on U/D).</p>
      <p>Read the “bad edges” (wrong orientation). Common shapes: arrow, line, L, dot. The arrow case below is the one you will see most.</p>
      <p>Tap M in Settings or press the <b>M</b> key (Shift = M′). Do not rotate the cube in your hands — M is the slice between L and R, same direction as L.</p>`,
    algs: [
      { label: 'Arrow case (4a)', alg: "M' U M' U' M'" },
      { label: 'Line (4a)', alg: "M' U2 M' U2" },
    ],
  },
  {
    title: '4. LSE ② — UL and UR (4b)',
    goal: 'Place the UL and UR edges. Four M-slice edges left.',
    desc: `<p>After EO, put the orange-yellow edge at UL and the red-yellow edge at UR (matching the left and right centres).</p>
      <p>Use M and U to bring those two edges into the M slice, then an M2 (or a short M/U sequence) to drop them into UL/UR. AUF (U turns) to line them up.</p>
      <p>Later, EOLR combines 4a and 4b into one look. You do not need that yet.</p>`,
    algs: [
      { label: 'Insert UL/UR with M2', alg: "M2 U M2" },
      { label: 'Cycle then insert', alg: "M' U2 M U2" },
    ],
  },
  {
    title: '4. LSE ③ — M slice (Done!)',
    goal: 'Solve the last four M-slice edges. The cube is solved.',
    desc: `<p>Four edges remain in the M slice (UF, UB, DF, DB) plus the centres, which may be off by M turns.</p>
      <p>Opposite swap is just <b>M2</b>. A 4-cycle uses a short M/U sequence. Finish with an AUF if the top needs a U turn. 🎉</p>
      <p>This step is why Roux feels fast: high TPS, no cube rotations, tiny patterns instead of 21 PLLs.</p>`,
    algs: [
      { label: 'Opposite edges (M2)', alg: 'M2' },
      { label: '4-cycle', alg: "M' U2 M U2" },
    ],
  },
];

const ROUX_KO = [
  {
    title: 'Roux 개요', intro: true,
    goal: '블록 빌딩: First Block · Second Block · CMLL · LSE. 평균 약 48수, 큐브 회전이 적어요.',
    desc: `<p>2003년 Gilles Roux가 만든 해법이에요. 왼쪽·오른쪽에 1x2x3 블록을 만들고, 마지막 층 <b>코너</b>(CMLL)를 맞춘 뒤, 남은 엣지 6개를 M과 U만으로 풉니다(LSE).</p>
      <p>CFOP(약 60수)보다 평균 <b>48수</b>로 적고, 큐브를 돌리는 일도 적어요. 마지막 단계의 M 슬라이스가 부드러워 한손(OH) 해법으로도 많이 씁니다.</p>
      <p>여기선 입문 경로예요: 직관 블록, <b>2-look CMLL</b>(공식 몇 개), LSE를 세 단계로. 전체 CMLL 42개는 나중에.</p>`,
    algs: [{ label: 'M 슬라이스 감 익히기 (M과 U)', alg: "M' U M U'" }],
  },
  {
    title: '1. First Block (FB)',
    goal: '왼쪽 1x2x3 블록을 가능하면 7~8수 안에.',
    desc: `<p>첫 블록이 <b>왼쪽</b>에 앉도록 잡아요 (이 트레이너는 주황 왼쪽, 흰 아래). 코너와 엣지를 페어로 ‘사각형’을 만든 뒤 1x2x3으로 확장합니다.</p>
      <p>정해진 공식은 없고 직관이에요. 인스펙션 때 이미 만들어진 페어를 찾으세요. 색 중립(흰 또는 노랑을 아래)이면 페어를 더 빨리 봅니다.</p>
      <p>왼쪽 면 아래 두 줄과 D의 흰 스티커가 맞으면 됩니다. L의 윗줄과 M 슬라이스는 비워 둡니다.</p>`,
    algs: [{ label: '페어 삽입 예시 (오른쪽)', alg: "U R U' R'" }],
  },
  {
    title: '2. Second Block (SB)',
    goal: 'First Block을 깨지 않고 오른쪽에 같은 1x2x3을 만듭니다.',
    desc: `<p>FB보다 어렵습니다. 왼쪽 블록을 지켜야 하니까요. <b>R, r(Rw), U</b> 위주로. L / Lw는 피하고, SB 조각이 아직 M에 있으면 M도 피하세요.</p>
      <p>위에서 FR/FU 코너–엣지 페어를 만든 뒤 R / r / U로 삽입. Keyhole: 이미 넣은 오른쪽 블록을 안 깨게 U로 각도를 맞춘 다음 넣습니다.</p>
      <p>양쪽 블록이 끝나면 윗면 코너 4개와 엣지 6개(UL, UR, M 슬라이스 4개)만 남아요.</p>`,
    algs: [
      { label: '오른쪽 슬롯 삽입', alg: "U R U' R'" },
      { label: '와이드 R (r) 트리거', alg: "Rw U Rw'" },
    ],
  },
  {
    title: '3. CMLL — 마지막 층 코너',
    goal: '윗면 코너 4개를 한 단계에서. M 슬라이스 엣지는 무시.',
    desc: `<p>CFOP의 OLL과 달리 CMLL은 엣지를 무시해서 공식이 짧아요. 전체는 42케이스(O, H, Pi, U, T, S, As, L). 시작은 <b>2-look</b>.</p>
      <p><b>1번째 — 방향:</b> 모든 U 코너 위에 노랑이 올 때까지 Sune. 안 맞은 코너를 앞-왼쪽에 두고 반복. 중간에 흐트러져 보여도 정상이에요.</p>
      <p><b>2번째 — 위치:</b> A-perm으로 코너 3개를 순환. 맞은 코너가 있으면 그걸 기준으로. 엣지가 깨져도 LSE가 고칩니다.</p>`,
    algs: [
      { label: 'Sune — 코너 방향', alg: "R U R' U R U2 R'" },
      { label: 'A-perm — 코너 3-순환', alg: "R' F R' B2 R F' R' B2 R2" },
    ],
  },
  {
    title: '4. LSE ① — 엣지 방향 (4a)',
    goal: '남은 엣지 6개의 방향을 M과 U만으로 맞춥니다.',
    desc: `<p>LSE(Last Six Edges)가 Roux의 대표 단계예요. 남은 일은 전부 <b>M</b>과 <b>U</b>. 먼저 남은 엣지 방향부터 (노랑·흰이 U/D에 오게).</p>
      <p>‘나쁜 엣지’(방향이 틀린 것) 개수와 모양을 봐요. 화살표, 일자, L, 점. 아래 화살표 케이스가 가장 자주 나와요.</p>
      <p>설정에서 M을 누르거나 키보드 <b>M</b>(Shift = M′). 큐브를 손에 돌리지 마세요. M은 L과 R 사이 슬라이스이고 L과 같은 방향입니다.</p>`,
    algs: [
      { label: '화살표 케이스 (4a)', alg: "M' U M' U' M'" },
      { label: '일자 (4a)', alg: "M' U2 M' U2" },
    ],
  },
  {
    title: '4. LSE ② — UL / UR (4b)',
    goal: 'UL과 UR 엣지를 제자리에. M 슬라이스 엣지 4개 남음.',
    desc: `<p>EO 다음, 주황-노랑 엣지를 UL, 빨강-노랑 엣지를 UR에 둡니다 (왼쪽·오른쪽 센터에 맞게).</p>
      <p>M과 U로 그 둘을 M 슬라이스로 가져온 뒤 M2(또는 짧은 M/U)로 UL/UR에 넣어요. AUF(U 회전)로 정렬.</p>
      <p>나중에 EOLR이 4a와 4b를 한 번에 묶습니다. 지금은 필요 없어요.</p>`,
    algs: [
      { label: 'M2로 UL/UR 삽입', alg: "M2 U M2" },
      { label: '순환 후 삽입', alg: "M' U2 M U2" },
    ],
  },
  {
    title: '4. LSE ③ — M 슬라이스 (완성!)',
    goal: 'M 슬라이스 엣지 4개를 맞춰 큐브를 완성합니다.',
    desc: `<p>M 슬라이스에 엣지 4개(UF, UB, DF, DB)와, M 때문에 돌아갈 수 있는 센터가 남아요.</p>
      <p>맞은편 교환은 <b>M2</b> 한 번. 4-순환은 짧은 M/U. 윗면이 안 맞으면 AUF. 🎉</p>
      <p>이 단계 때문에 Roux가 빠르게 느껴져요. TPS가 높고, 큐브 회전이 없고, PLL 21개 대신 작은 패턴만 씁니다.</p>`,
    algs: [
      { label: '맞은편 엣지 (M2)', alg: 'M2' },
      { label: '4-순환', alg: "M' U2 M U2" },
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

const PBL_ORTEGA = [
  {
    id: 'adj',
    label: { en: 'Adjacent (T-perm)', ko: '인접 (T-perm)' },
    tips: {
      en: 'Two corners swap next to each other. Hold headlights on the back.',
      ko: '바꿔야 할 코너가 서로 옆입니다. 헤드라이트를 뒤에 두고 잡으세요.',
    },
    alg: "R U R' F' R U R' U' R' F R2 U' R' U'",
  },
  {
    id: 'diag',
    label: { en: 'Diagonal (Y-perm)', ko: '대각 (Y-perm)' },
    tips: {
      en: 'Opposite corners swap — no headlights pair.',
      ko: '반대편 코너를 바꿉니다. 헤드라이트 쌍이 없습니다.',
    },
    alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
  },
  {
    id: 'h',
    label: { en: 'H', ko: 'H' },
    tips: {
      en: 'Bars / headlights on two faces.',
      ko: '두 면에 바(헤드라이트)가 보입니다.',
    },
    alg: "R2 U2 R' U2 R2",
  },
  {
    id: 'barA',
    label: { en: 'Bar A (Ja-style)', ko: 'Bar A (Ja)' },
    tips: {
      en: 'One bar on the side. Hold it and apply the Ja-style trigger.',
      ko: '옆면에 바가 하나입니다. 잡고 Ja 계열 트리거를 적용하세요.',
    },
    alg: "R U R' U' R' F R F'",
  },
  {
    id: 'barB',
    label: { en: 'Bar B (Jb-style)', ko: 'Bar B (Jb)' },
    tips: {
      en: 'Mirror of Bar A — one bar on the other side.',
      ko: 'Bar A의 미러. 반대쪽 옆면에 바가 하나입니다.',
    },
    alg: "R' U' R U R' F' R F",
  },
];

// Learning order: Sune / Antisune first (already in beginner), then H Pi U T L.
const ORTEGA_OLL_IDS = [27, 26, 21, 22, 23, 24, 25];
// 2×2 engine has no Rw — T/L use face-only Ortega algs, not 3×3 OCLL `r`.
const ORTEGA_OLL_ALG = {
  24: "R U R' U' R' F R F'",
  25: "F' R U R' U' R' F R",
};
const ORTEGA_OLL_OVERVIEW = 2;
const ORTEGA_OLL_CASE0 = 3;
const ORTEGA_PBL_OVERVIEW = 10;
const ORTEGA_PBL_CASE0 = 11;

function ortegaLessonStepForCase(id) {
  const n = Number(id);
  if (Number.isFinite(n)) {
    const i = ORTEGA_OLL_IDS.indexOf(n);
    if (i >= 0) return ORTEGA_OLL_CASE0 + i;
  }
  const p = PBL_ORTEGA.findIndex(c => c.id === String(id));
  if (p >= 0) return ORTEGA_PBL_CASE0 + p;
  return 0;
}

function ortegaLessons(lang) {
  const O = g.CubeOLL;
  const loc = lang === 'ko' ? 'ko' : 'en';
  const ko = loc === 'ko';
  const ollCases = ORTEGA_OLL_IDS.map(id => O && O.byId ? O.byId(id) : null).filter(Boolean);
  const ortegaOllAlgOf = c => ORTEGA_OLL_ALG[c.id] || c.alg;
  const ollAlgs = ollCases.map(c => ({
    label: '#' + c.id + ' · ' + c.title[loc],
    alg: ortegaOllAlgOf(c),
    setup: 'inverse',
    caseId: c.id,
  }));
  const pblAlgs = PBL_ORTEGA.map(c => ({
    label: c.label[loc],
    alg: c.alg,
    setup: 'inverse',
    caseId: c.id,
  }));

  const ollCaseSteps = ollCases.map(c => ({
    title: (ko ? 'OLL · ' : 'OLL · ') + c.title[loc],
    goal: ko
      ? '이 패턴이면 아래 공식 한 번으로 윗면을 노랗게 맞춥니다.'
      : 'One algorithm for this pattern — the top becomes yellow.',
    desc: ko
      ? `<p>${c.tips.ko} 2×2에는 엣지가 없으니 이 7개가 <b>전체 OLL</b>입니다.</p>
        <p>▶시연은 역셋업 후 공식을 재생합니다. 각도가 다르면 U로 맞춘 뒤 적용하세요.</p>`
      : `<p>${c.tips.en} A 2×2 has no edges, so these seven cases are <b>all of OLL</b>.</p>
        <p>▶ Demo inverts the case, then plays the solution. AUF with U if the angle does not match.</p>`,
    algs: [{ label: '#' + c.id + ' · ' + c.title[loc], alg: ortegaOllAlgOf(c), setup: 'inverse', caseId: c.id }],
  }));

  const pblCaseSteps = PBL_ORTEGA.map((c, i) => ({
    title: (ko ? 'PBL · ' : 'PBL · ') + c.label[loc],
    goal: i === PBL_ORTEGA.length - 1
      ? (ko ? '마지막 PBL — 적용하면 2×2가 완성됩니다.' : 'Last PBL case — apply it and the 2×2 is done.')
      : (ko ? '이 패턴이면 아래 공식으로 코너 위치를 맞춥니다.' : 'One algorithm for this permutation pattern.'),
    desc: ko
      ? `<p>${c.tips.ko}</p><p>윗면은 이미 노랑이어야 합니다. ▶시연으로 인식과 공식을 확인하세요.</p>`
      : `<p>${c.tips.en}</p><p>The top should already be yellow. ▶ Demo shows the case, then the solution.</p>`,
    algs: [{ label: c.label[loc], alg: c.alg, setup: 'inverse', caseId: c.id }],
  }));

  if (ko) {
    return [
      {
        title: 'Ortega 개요', intro: true,
        goal: '첫 층 → OLL 7 → PBL 5. 초보자법과 같은 3단계, 공식만 더 많습니다.',
        desc: `<p>2×2 속도법의 입문 경로예요. <b>첫 층</b>을 맞춘 뒤, 윗면을 <b>OLL 7케이스</b>로 노랗게, 마지막에 <b>PBL 5케이스</b>로 코너 위치를 맞춥니다.</p>
          <p>초보자법은 OLL에 Sune/Antisune 두 개, 순열에 T/Y 두 개만 씁니다. Ortega는 마지막 층 케이스마다 고정 공식이 있어 타이머 연습에 적합해요.</p>
          <p>이 트랙은 케이스를 <b>하나씩</b> 넘깁니다. 첫 완성 전이면 <b>2×2 초보자 트랙</b>부터 하세요.</p>`,
        algs: [],
      },
      {
        title: '1단계 · 첫 층', name: '첫 층',
        goal: '흰 코너 4개를 맞춰 윗면이 하얗고, 옆면 색이 첫 층에서 서로 맞게 합니다.',
        desc: `<p>초보자 가이드와 <b>동일</b>합니다. 흰색을 첫 면으로 고르고, 나머지 코너를 자리 아래에 두고 삽입 공식을 반복하세요.</p>
          <p>센터가 없으니 코너 옆면 색끼리 맞추면 됩니다. 작업 코너는 <b>오른쪽 앞 아래</b>에 둡니다.</p>`,
        algs: [{ label: '코너 삽입 (필요한 만큼 반복)', alg: "R' D' R D" }],
      },
      {
        title: '2단계 · OLL 개요', name: 'OLL',
        goal: '큐브를 뒤집어(흰 면 아래) 윗면 전체를 노랑으로 만듭니다. 다음 7스텝이 케이스입니다.',
        desc: `<p>3×3 OCLL과 같은 <b>7케이스</b> (OLL #21–#27). 패턴을 읽고 공식 하나를 적용 → U로 맞춤(AUF).</p>
          <p>다음 스텝 순서: <b>수네 → 안티수네 → H → 파이 → U → T → L</b>. 아래는 전체 목록이고, 이후 스텝에서 하나씩 시연합니다.</p>`,
        algs: ollAlgs,
      },
      ...ollCaseSteps,
      {
        title: '3단계 · PBL 개요', name: 'PBL',
        goal: '코너 위치를 맞추며 첫 층을 유지한 채 2×2를 완성합니다. 다음 5스텝이 케이스입니다.',
        desc: `<p><b>PBL</b> — Permute Both Layers. 윗면은 이미 노랑; 코너만 제자리로 바꿉니다.</p>
          <p>다음 스텝: <b>인접 / 대각 / H / Bar A / Bar B</b>. 아래는 전체 목록입니다.</p>`,
        algs: pblAlgs,
      },
      ...pblCaseSteps,
    ];
  }

  return [
    {
      title: 'Ortega overview', intro: true,
      goal: 'First layer → 7 OLL → 5 PBL. Same three stages as beginner, more algorithms.',
      desc: `<p>The usual 2×2 speed path: build a <b>first layer</b>, orient the top with <b>seven OLL cases</b>, then permute with <b>five PBL cases</b>.</p>
        <p>Beginner uses only Sune/Antisune for OLL and T/Y for permutation. Ortega names every last-layer case — better for the timer.</p>
        <p>This track walks <b>one case per step</b>. Not finished a 2×2 yet? Start the <b>2×2 beginner track</b> first.</p>`,
      algs: [],
    },
    {
      title: 'Step 1 · First layer', name: 'First layer',
      goal: 'Four white corners on top with side colours matching around the layer.',
      desc: `<p><b>Identical</b> to the beginner guide. Pick white, insert each remaining corner from below with the front-right insert.</p>
        <p>There is no centre — match corner side colours to each other. Hold the working corner at <b>front-bottom-right</b>.</p>`,
      algs: [{ label: 'Corner insert (repeat as needed)', alg: "R' D' R D" }],
    },
    {
      title: 'Step 2 · OLL overview', name: 'OLL',
      goal: 'Flip the cube (white down) and make the whole top face yellow. The next seven steps are the cases.',
      desc: `<p>The same <b>seven OCLL cases</b> as 3×3 (OLL #21–#27). Read the pattern, apply one algorithm, AUF with U.</p>
        <p>Next steps: <b>Sune → Antisune → H → Pi → U → T → L</b>. The list below is the full set; each following step demos one case.</p>`,
      algs: ollAlgs,
    },
    ...ollCaseSteps,
    {
      title: 'Step 3 · PBL overview', name: 'PBL',
      goal: 'Permute the corners while keeping the first layer solved. The next five steps are the cases.',
      desc: `<p><b>PBL</b> — Permute Both Layers. The top is yellow; fix corner positions only.</p>
        <p>Next steps: <b>Adjacent / Diagonal / H / Bar A / Bar B</b>. The list below is the full set.</p>`,
      algs: pblAlgs,
    },
    ...pblCaseSteps,
  ];
}

function ortegaStates() {
  const s = STEP_STATES_2;
  return [
    s[0], s[1], s[2],
    null, null, null, null, null, null, null,
    s[2],
    null, null, null, null,
    s[3],
  ];
}

const _g = '_';
const fN = (n, c) => Array(n * n).fill(c);
function paintFace(a, color, idxs) {
  idxs.forEach(i => { a[i] = color; });
  return a;
}
function ctr4(c) {
  const a = fN(4, _g);
  a[5] = a[6] = a[9] = a[10] = c;
  return a;
}
function ctr5(c) {
  return paintFace(fN(5, _g), c, [6, 7, 8, 11, 12, 13, 16, 17, 18]);
}
function f2lSide4(c, top) {
  const a = fN(4, c);
  a[0] = a[3] = top[0];
  a[1] = a[2] = top[1];
  a[4] = a[7] = top[0];
  a[5] = a[6] = c;
  return a;
}
function f2lSide5(c, topRow) {
  const a = fN(5, c);
  for (let i = 0; i < 5; i++) a[i] = topRow[i];
  a[5] = a[9] = topRow[0];
  return a;
}

const STEP_STATES_4 = [
  { U: fN(4, 'W'), D: fN(4, 'Y'), F: fN(4, 'G'), B: fN(4, 'B'), L: fN(4, 'O'), R: fN(4, 'R') },
  { U: ctr4('W'), D: fN(4, _g), F: fN(4, _g), B: fN(4, _g), L: fN(4, _g), R: fN(4, _g) },
  { U: ctr4('W'), D: ctr4('Y'), F: ctr4('G'), B: ctr4('B'), L: ctr4('O'), R: ctr4('R') },
  {
    U: paintFace(ctr4('W'), 'W', [13, 14]),
    D: ctr4('Y'),
    F: paintFace(ctr4('G'), 'G', [1, 2]),
    B: ctr4('B'), L: ctr4('O'), R: ctr4('R')
  },
  {
    U: paintFace(paintFace(ctr4('W'), 'W', [1, 2, 4, 7, 8, 11, 13, 14]), _g, [0, 3, 12, 15]),
    D: fN(4, _g),
    F: paintFace(ctr4('G'), 'G', [1, 2]),
    R: paintFace(ctr4('R'), 'R', [1, 2]),
    B: paintFace(ctr4('B'), 'B', [1, 2]),
    L: paintFace(ctr4('O'), 'O', [1, 2])
  },
  {
    U: paintFace(fN(4, 'Y'), 'G', [13, 14]),
    D: fN(4, 'W'),
    F: f2lSide4('G', ['G', 'Y']),
    R: f2lSide4('R', ['R', 'R']),
    B: f2lSide4('B', ['B', 'B']),
    L: f2lSide4('O', ['O', 'O'])
  },
  {
    U: fN(4, 'Y'),
    D: fN(4, 'W'),
    F: f2lSide4('G', ['G', 'B']),
    R: f2lSide4('R', ['R', 'R']),
    B: f2lSide4('B', ['B', 'G']),
    L: f2lSide4('O', ['O', 'O'])
  }
];

const UF5 = [21, 22, 23], UB5 = [1, 2, 3], UL5 = [5, 10, 15], UR5 = [9, 14, 19], FUF5 = [1, 2, 3];
const STEP_STATES_5 = [
  { U: fN(5, 'W'), D: fN(5, 'Y'), F: fN(5, 'G'), B: fN(5, 'B'), L: fN(5, 'O'), R: fN(5, 'R') },
  { U: ctr5('W'), D: fN(5, _g), F: fN(5, _g), B: fN(5, _g), L: fN(5, _g), R: fN(5, _g) },
  { U: ctr5('W'), D: ctr5('Y'), F: ctr5('G'), B: ctr5('B'), L: ctr5('O'), R: ctr5('R') },
  {
    U: paintFace(ctr5('W'), 'W', UF5),
    D: ctr5('Y'),
    F: paintFace(ctr5('G'), 'G', FUF5),
    B: ctr5('B'), L: ctr5('O'), R: ctr5('R')
  },
  {
    U: paintFace(paintFace(ctr5('W'), 'W', UF5), 'B', UB5),
    D: ctr5('Y'),
    F: paintFace(ctr5('G'), 'G', FUF5),
    B: paintFace(ctr5('B'), 'W', FUF5),
    L: ctr5('O'), R: ctr5('R')
  },
  {
    U: paintFace(ctr5('W'), 'W', UF5.concat(UB5, UL5, UR5)),
    D: fN(5, _g),
    F: paintFace(ctr5('G'), 'G', FUF5),
    R: paintFace(ctr5('R'), 'R', FUF5),
    B: paintFace(ctr5('B'), 'B', FUF5),
    L: paintFace(ctr5('O'), 'O', FUF5)
  },
  {
    U: paintFace(fN(5, 'Y'), 'G', UF5),
    D: fN(5, 'W'),
    F: f2lSide5('G', ['G', 'Y', 'Y', 'Y', 'G']),
    R: f2lSide5('R', ['R', 'R', 'R', 'R', 'R']),
    B: f2lSide5('B', ['B', 'B', 'B', 'B', 'B']),
    L: f2lSide5('O', ['O', 'O', 'O', 'O', 'O'])
  }
];

const LESSONS_4_EN = [
  {
    title: 'Notation (4×4)', name: 'Notation', intro: true,
    goal: 'Outer faces use the same letters as 3×3. Inner slices (2R) and wide turns (Rw) are new.',
    desc: `<p><b>U D L R F B</b> — outer face, 90° clockwise. <b>'</b> counter-clockwise, <b>2</b> a half turn.</p>
      <p><b>2R</b> <b>2U</b> … — the inner slice next to that face. Settings → Layer → <b>Inner</b>, then tap R / U.</p>
      <p><b>Rw</b> <b>Uw</b> — outer and inner together. Settings → Layer → <b>Wide</b>.</p>
      <p>A wide or inner turn moves the 2×2 centres. Pairing uses <b>Uw</b> to bring edges together, then you undo that slice so the centres come back. ▶Demo plays an inner-slice trigger.</p>`,
    algs: [
      { label: 'Inner-slice trigger', alg: "2R U 2R' U'" },
      { label: 'Outer trigger (same as 3×3)', alg: "R U R' U'" },
    ],
  },
  {
    title: 'Step 1 · Centres', name: 'Centres',
    goal: 'A 2×2 block of the same colour on every face. White opposite yellow, then the four sides.',
    desc: `<p>Solve white by intuition. Make <b>1×2 bars</b> with inner slices, then join two bars into a 2×2. Hold finished white on the bottom while you build yellow on top.</p>
      <p>Then the four side centres. Build one (for example green) as two bars, then the opposite (blue). The last two centres fill in with a short commutator.</p>
      <p>If a centre you already solved breaks, you used a slice you did not undo.</p>`,
    algs: [{ label: 'Move a centre bar from front to left', alg: "Uw' 2R Uw" }],
  },
  {
    title: 'Step 2 · Edge pairing', name: 'Edge pairing',
    goal: '24 wing pieces become 12 paired edges — each 3×3-style slot holds two matching colours.',
    desc: `<p>Find two wings that share the same two colours. Put one at <b>front-top</b> (UF). Put its mate where a wide U will bring them together.</p>
      <p>Turn <b>Uw</b> until they sit as a pair, replace that slot with any unpaired edge (<b>R U R'</b>), then undo the slice (<b>Uw'</b>) so the centres return.</p>
      <p>Last two pairs: if a single Uw would swap them wrongly, flip one pair first with <b>R U R'</b>, then restore.</p>`,
    algs: [{ label: 'Pair at UF, store, restore centres', alg: "Uw R U R' Uw'" }],
  },
  {
    title: 'Step 3 · Solve as a 3×3', name: 'Solve as a 3×3',
    goal: 'Outer turns only. Each 2×2 centre is a 3×3 centre. Each paired edge is a 3×3 edge.',
    desc: `<p>Switch Layer back to <b>Outer</b>. Follow the 3×3 beginner method: white cross, white corners, middle edges, yellow cross, yellow face, then last-layer permutation.</p>
      <p>If the last layer looks impossible — one flipped edge pair, or two edges that will not permute — that is parity, not a broken reduction. Go to the next steps.</p>`,
    algs: [{ label: 'Example outer turn (cross lift)', alg: 'F2' }],
  },
  {
    title: 'Step 4 · OLL parity', name: 'OLL parity',
    goal: 'One edge pair looks flipped. The rest of the last layer can be oriented as usual.',
    desc: `<p>This cannot happen on a 3×3. On 4×4 it is normal after pairing. Hold the flipped pair at the <b>front</b> and run the algorithm, then continue yellow cross / Sune as on 3×3.</p>
      <p>▶Demo uses inner slices (<b>2R</b> / <b>2L</b>) mixed with outer U and F. To turn those yourself: Settings → Layer → Inner for 2R / 2L, Outer for U and F.</p>`,
    algs: [{ label: 'OLL parity — flip the front edge pair', alg: "2R' U2 2L F2 2L' F2 2R2 U2 2R U2 2R' U2 F2 2R2 F2" }],
  },
  {
    title: 'Step 5 · PLL parity (Done!)', name: 'PLL parity',
    goal: 'Swap two opposite edges. Then finish with a normal 3×3 PLL if needed.',
    desc: `<p>If two adjacent edges need to swap, use a 3×3 PLL (T-perm, U-perm, …). If two <b>opposite</b> edges are swapped and no 3×3 PLL matches, this is PLL parity. Hold those two edges at front and back.</p>
      <p>Then AUF (turn U) and finish with a normal 3×3 PLL if anything is still off. 🎉</p>`,
    algs: [{ label: 'PLL parity — swap opposite edges', alg: '2R2 U2 2R2 Uw2 2R2 Uw2' }],
  },
];

const LESSONS_4_KO = [
  {
    title: '표기법 (4×4)', name: '표기법', intro: true,
    goal: '겉면 글자는 3×3과 같습니다. 안쪽 슬라이스(2R)와 와이드(Rw)가 추가됩니다.',
    desc: `<p><b>U D L R F B</b> — 겉면, 시계 90°. <b>'</b> 반시계, <b>2</b> 180°.</p>
      <p><b>2R</b> <b>2U</b> … — 그 면 바로 안쪽 층. 설정 → 층 → <b>안쪽</b> 후 R / U.</p>
      <p><b>Rw</b> <b>Uw</b> — 겉+안쪽을 같이. 설정 → 층 → <b>와이드</b>.</p>
      <p>안쪽·와이드는 2×2 센터를 움직입니다. 페어링은 <b>Uw</b>로 붙인 뒤 슬라이스를 되돌려 센터를 복구합니다. ▶시연은 안쪽 트리거입니다.</p>`,
    algs: [
      { label: '안쪽 슬라이스 트리거', alg: "2R U 2R' U'" },
      { label: '겉면 트리거 (3×3과 같음)', alg: "R U R' U'" },
    ],
  },
  {
    title: '1단계 · 센터', name: '센터',
    goal: '각 면에 같은 색 2×2 센터. 흰·노랑(반대)을 먼저, 그다음 옆면 넷.',
    desc: `<p>흰색은 직관으로 맞춥니다. 안쪽 슬라이스로 <b>1×2 바</b>를 만든 뒤 두 바를 2×2로 붙입니다. 완성한 흰 센터는 아래로 두고 노랑을 맞춥니다.</p>
      <p>옆면 센터 넷. 초록처럼 하나를 바 둘로 만들고, 반대(파랑)를 맞춘 뒤 마지막 둘은 짧은 교환으로 채워집니다.</p>
      <p>이미 맞춘 센터가 깨지면 되돌리지 않은 슬라이스가 있습니다.</p>`,
    algs: [{ label: '앞면 센터 바를 왼쪽으로', alg: "Uw' 2R Uw" }],
  },
  {
    title: '2단계 · 엣지 페어링', name: '엣지 페어링',
    goal: '날개 24개를 12쌍으로 — 각 3×3 슬롯에 같은 색 둘.',
    desc: `<p>같은 두 색을 가진 날개 둘을 찾습니다. 하나를 <b>앞-위</b>(UF)에 두고, 와이드 U로 붙을 자리에 짝을 둡니다.</p>
      <p><b>Uw</b>로 붙인 뒤 아직 안 맞춘 엣지로 그 자리를 바꾸고(<b>R U R'</b>), 슬라이스를 되돌려(<b>Uw'</b>) 센터를 복구합니다.</p>
      <p>마지막 두 쌍: Uw 한 번에 잘못 바뀌면 먼저 <b>R U R'</b>로 한 쌍을 뒤집고 복구합니다.</p>`,
    algs: [{ label: 'UF에서 붙이고 저장, 센터 복구', alg: "Uw R U R' Uw'" }],
  },
  {
    title: '3단계 · 3×3처럼 풀기', name: '3×3처럼 풀기',
    goal: '겉면만 돌립니다. 2×2 센터는 3×3 센터, 맞춘 엣지 쌍은 3×3 엣지입니다.',
    desc: `<p>층을 <b>겉면</b>으로 되돌립니다. 3×3 초보자법: 흰 십자, 흰 코너, 중간 엣지, 노란 십자, 노란 면, 마지막 층 순열.</p>
      <p>마지막 층이 불가능해 보이면 — 엣지 한 쌍이 뒤집히거나 두 엣지가 안 바뀌면 — 리덕션이 깨진 게 아니라 패리티입니다. 다음 단계로 가세요.</p>`,
    algs: [{ label: '겉면 예시 (십자 올리기)', alg: 'F2' }],
  },
  {
    title: '4단계 · OLL 패리티', name: 'OLL 패리티',
    goal: '엣지 한 쌍이 뒤집혀 보입니다. 나머지 마지막 층은 평소처럼 방향을 맞춥니다.',
    desc: `<p>3×3에서는 안 나옵니다. 4×4에서는 페어링 후 정상입니다. 뒤집힌 쌍을 <b>앞</b>에 두고 공식을 적용한 뒤 노란 십자 / Sune을 이어갑니다.</p>
      <p>▶시연은 안쪽(<b>2R</b> / <b>2L</b>)과 겉면 U·F를 섞습니다. 직접 돌리려면 설정 → 층 → 안쪽(2R / 2L), 겉면(U·F).</p>`,
    algs: [{ label: 'OLL 패리티 — 앞 엣지 쌍 뒤집기', alg: "2R' U2 2L F2 2L' F2 2R2 U2 2R U2 2R' U2 F2 2R2 F2" }],
  },
  {
    title: '5단계 · PLL 패리티 (완성!)', name: 'PLL 패리티',
    goal: '맞은편 엣지 둘을 바꿉니다. 필요하면 3×3 PLL로 마무리합니다.',
    desc: `<p>옆 엣지 둘을 바꿀 때는 3×3 PLL(T-perm, U-perm, …). <b>맞은편</b> 엣지 둘이고 3×3 PLL이 안 맞으면 PLL 패리티입니다. 그 둘을 앞·뒤에 둡니다.</p>
      <p>그다음 U를 돌려(AUF) 남은 게 있으면 3×3 PLL로 맞추면 완성입니다. 🎉</p>`,
    algs: [{ label: 'PLL 패리티 — 맞은편 엣지 교환', alg: '2R2 U2 2R2 Uw2 2R2 Uw2' }],
  },
];

const LESSONS_5_EN = [
  {
    title: 'Notation (5×5)', name: 'Notation', intro: true,
    goal: 'Outer faces use the same letters as 3×3. 5×5 adds inner (2R), mid (3R), Wide, and 3-Wide.',
    desc: `<p><b>U D L R F B</b> — outer face. <b>'</b> counter-clockwise, <b>2</b> a half turn.</p>
      <p><b>2R</b> — inner slice (wings). Settings → Layer → <b>Inner</b>.</p>
      <p><b>3R</b> — middle slice (fixed centres and middle edges). Settings → Layer → <b>Mid</b>.</p>
      <p><b>Rw</b> — outer + inner. <b>3Rw</b> — those plus the mid slice. Settings → <b>Wide</b> / <b>3-Wide</b>.</p>
      <p>The very middle sticker of each face never moves. Pairing uses <b>Uw</b>, then you undo the slice so the 3×3 centres come back. ▶Demo plays an inner-slice trigger.</p>`,
    algs: [
      { label: 'Inner-slice trigger', alg: "2R U 2R' U'" },
      { label: 'Outer trigger (same as 3×3)', alg: "R U R' U'" },
    ],
  },
  {
    title: 'Step 1 · Centres', name: 'Centres',
    goal: 'A 3×3 block of the same colour on every face, built around the fixed middle sticker.',
    desc: `<p>Start with white. The middle white sticker is already correct — place the eight centre pieces around it. Make <b>1×2 or 1×3 bars</b> with inner slices, then attach them to the fixed centre. Hold finished white on the bottom while you build yellow on top.</p>
      <p>Then the four side centres: two adjacent with bars, then the last two with a commutator.</p>
      <p>A mid-slice turn (<b>3R</b>) moves only the middle row of a centre. Always restore centres you already solved.</p>`,
    algs: [{ label: 'Move a centre bar from front to left', alg: "Uw' 2R Uw" }],
  },
  {
    title: 'Step 2 · Edge pairing', name: 'Edge pairing',
    goal: '36 edge pieces become 12 triples — a middle edge plus two matching wings.',
    desc: `<p>Find a <b>middle edge</b> (two colours, like a 3×3 edge). Put it at <b>front-top</b> (UF). Find the two wings that share those colours.</p>
      <p>Turn <b>Uw</b> until a matching wing sits beside the middle, replace that slot with any unpaired edge (<b>R U R'</b>), then undo the slice (<b>Uw'</b>). Repeat for the second wing.</p>
      <p>Do this until <b>ten</b> of the twelve edges are paired. The last two need the next step.</p>`,
    algs: [{ label: 'Attach a wing at UF, store, restore centres', alg: "Uw R U R' Uw'" }],
  },
  {
    title: 'Step 3 · Last two edges', name: 'Last two edges',
    goal: 'The two leftover edges. Hold them at front-top and back-top.',
    desc: `<p>Put the two messy edges at <b>UF</b> and <b>UB</b>. The algorithm cycles wings onto the middle edges without destroying the centres.</p>
      <p>You may need it once, or once plus a <b>U2</b> and a second pass. ▶Demo uses <b>Rw</b> and <b>3Rw</b> with outer U and F.</p>
      <p>If one triple still looks flipped after this, that is OLL parity — go to the last step.</p>`,
    algs: [{ label: 'Last two edges — UF and UB', alg: "Rw U2 Rw U2 F2 Rw F2 3Rw' U2 Rw U2 Rw' U2 F2 Rw' F2 3Rw" }],
  },
  {
    title: 'Step 4 · Solve as a 3×3', name: 'Solve as a 3×3',
    goal: 'Outer turns only. Each 3×3 centre is a 3×3 centre. Each triple edge is a 3×3 edge.',
    desc: `<p>Switch Layer back to <b>Outer</b>. Follow the 3×3 beginner method: white cross, white corners, middle edges, yellow cross, yellow face, then last-layer permutation.</p>
      <p>There is no PLL parity on 5×5. A single flipped edge is OLL parity — next step.</p>`,
    algs: [{ label: 'Example outer turn (cross lift)', alg: 'F2' }],
  },
  {
    title: 'Step 5 · OLL parity (Done!)', name: 'OLL parity',
    goal: 'One whole edge looks flipped. Hold it in front, then finish the last layer as 3×3.',
    desc: `<p>This is the same family as 4×4 OLL parity. Hold the flipped triple at the <b>front</b>. The algorithm uses inner slices only (<b>2R</b> / <b>2L</b>) — not the mid slice.</p>
      <p>Then continue yellow cross / Sune / PLL as on 3×3. You will not need the 4×4 PLL-parity algorithm. 🎉</p>`,
    algs: [{ label: 'OLL parity — flip the front edge', alg: "2R' U2 2L F2 2L' F2 2R2 U2 2R U2 2R' U2 F2 2R2 F2" }],
  },
];

const LESSONS_5_KO = [
  {
    title: '표기법 (5×5)', name: '표기법', intro: true,
    goal: '겉면 글자는 3×3과 같습니다. 안쪽(2R), 가운데(3R), 와이드, 3와이드가 추가됩니다.',
    desc: `<p><b>U D L R F B</b> — 겉면. <b>'</b> 반시계, <b>2</b> 180°.</p>
      <p><b>2R</b> — 안쪽 층(날개). 설정 → 층 → <b>안쪽</b>.</p>
      <p><b>3R</b> — 가운데 층(고정 센터·중간 엣지). 설정 → 층 → <b>가운데</b>.</p>
      <p><b>Rw</b> — 겉+안쪽. <b>3Rw</b> — 거기에 가운데까지. 설정 → <b>와이드</b> / <b>3와이드</b>.</p>
      <p>각 면 한가운데 스티커는 움직이지 않습니다. 페어링은 <b>Uw</b>로 붙인 뒤 슬라이스를 되돌려 3×3 센터를 복구합니다. ▶시연은 안쪽 트리거입니다.</p>`,
    algs: [
      { label: '안쪽 슬라이스 트리거', alg: "2R U 2R' U'" },
      { label: '겉면 트리거 (3×3과 같음)', alg: "R U R' U'" },
    ],
  },
  {
    title: '1단계 · 센터', name: '센터',
    goal: '각 면에 같은 색 3×3 센터. 고정된 가운데 스티커 둘레를 채웁니다.',
    desc: `<p>흰색부터. 가운데 흰 스티커는 이미 맞습니다. 나머지 여덟을 안쪽 슬라이스로 <b>1×2·1×3 바</b>를 만들어 붙입니다. 완성한 흰 면은 아래로 두고 노랑을 맞춥니다.</p>
      <p>옆면 넷은 바 둘로 인접한 둘을 맞춘 뒤, 마지막 둘은 교환으로 채웁니다.</p>
      <p>가운데 층(<b>3R</b>)은 센터의 가운데 줄만 움직입니다. 이미 맞춘 센터는 항상 되돌리세요.</p>`,
    algs: [{ label: '앞면 센터 바를 왼쪽으로', alg: "Uw' 2R Uw" }],
  },
  {
    title: '2단계 · 엣지 페어링', name: '엣지 페어링',
    goal: '엣지 36개를 12삼중으로 — 중간 엣지 + 날개 둘.',
    desc: `<p><b>중간 엣지</b>(3×3처럼 두 색)를 찾아 <b>앞-위</b>(UF)에 둡니다. 같은 색 날개 둘을 찾습니다.</p>
      <p><b>Uw</b>로 날개를 옆에 붙인 뒤 아직 안 맞춘 엣지로 자리를 바꾸고(<b>R U R'</b>), 슬라이스를 되돌립니다(<b>Uw'</b>). 나머지 날개도 같습니다.</p>
      <p><b>열 개</b>를 맞출 때까지 반복합니다. 마지막 둘은 다음 단계입니다.</p>`,
    algs: [{ label: 'UF에서 날개 붙이고 저장, 센터 복구', alg: "Uw R U R' Uw'" }],
  },
  {
    title: '3단계 · 마지막 두 엣지', name: '마지막 두 엣지',
    goal: '남은 엣지 둘. 앞-위와 뒤-위에 둡니다.',
    desc: `<p>안 맞춘 둘을 <b>UF</b>와 <b>UB</b>에 둡니다. 공식은 센터를 깨지 않고 날개를 중간 엣지에 돌립니다.</p>
      <p>한 번, 또는 <b>U2</b> 후 한 번 더 필요할 수 있습니다. ▶시연은 <b>Rw</b>·<b>3Rw</b>와 겉면 U·F입니다.</p>
      <p>한 삼중이 여전히 뒤집혀 있으면 OLL 패리티 — 마지막 단계로 가세요.</p>`,
    algs: [{ label: '마지막 두 엣지 — UF와 UB', alg: "Rw U2 Rw U2 F2 Rw F2 3Rw' U2 Rw U2 Rw' U2 F2 Rw' F2 3Rw" }],
  },
  {
    title: '4단계 · 3×3처럼 풀기', name: '3×3처럼 풀기',
    goal: '겉면만 돌립니다. 3×3 센터는 3×3 센터, 삼중 엣지는 3×3 엣지입니다.',
    desc: `<p>층을 <b>겉면</b>으로 되돌립니다. 3×3 초보자법: 흰 십자, 흰 코너, 중간 엣지, 노란 십자, 노란 면, 마지막 층 순열.</p>
      <p>5×5에는 PLL 패리티가 없습니다. 엣지 하나가 뒤집히면 OLL 패리티 — 다음 단계.</p>`,
    algs: [{ label: '겉면 예시 (십자 올리기)', alg: 'F2' }],
  },
  {
    title: '5단계 · OLL 패리티 (완성!)', name: 'OLL 패리티',
    goal: '엣지 하나가 통째로 뒤집혀 있습니다. 앞에 두고 마지막 층을 3×3처럼 마무리합니다.',
    desc: `<p>4×4 OLL 패리티와 같은 계열입니다. 뒤집힌 삼중을 <b>앞</b>에 둡니다. 공식은 안쪽 슬라이스만 씁니다(<b>2R</b> / <b>2L</b>) — 가운데 층은 아닙니다.</p>
      <p>그다음 노란 십자 / Sune / PLL을 3×3처럼 이어가면 완성입니다. 4×4 PLL 패리티 공식은 필요 없습니다. 🎉</p>`,
    algs: [{ label: 'OLL 패리티 — 앞 엣지 뒤집기', alg: "2R' U2 2L F2 2L' F2 2R2 U2 2R U2 2R' U2 F2 2R2 F2" }],
  },
];

function f2lLessons(lang) {
  const F = g.CubeF2L;
  const cases = (F && F.cases) || [];
  const cats = (F && F.cats) || [];
  const loc = lang === 'ko' ? 'ko' : 'en';
  const algsOf = cat => cases.filter(c => c.cat === cat).map(c => ({
    label: '#' + c.id + ' · ' + c.title[loc],
    alg: c.alg,
    setup: 'inverse',
    caseId: c.id,
  }));

  if (lang === 'ko') {
    return [
      {
        title: 'F2L 개요', intro: true,
        goal: '코너와 엣지를 페어로 묶어 한 번에 넣습니다. 41케이스는 이 논리의 변형입니다.',
        desc: `<p>초보자법은 흰 코너와 중간층 엣지를 따로 넣습니다. F2L은 같은 슬롯의 <b>코너+엣지</b>를 붙여 한 번에 넣어요.</p>
          <p>공식 41개를 한꺼번에 외우지 마세요. 아래 다섯 개념이면 어떤 케이스든 느리게라도 풀 수 있습니다.</p>
          <ol>
            <li><b>기본 페어링</b> — 이미 붙었으면 슬롯 위에 두고 삽입.</li>
            <li><b>코너는 슬롯에</b> — 코너를 잠깐 빼서 엣지와 붙인 뒤 다시 넣기.</li>
            <li><b>엣지는 슬롯에</b> — 위와 미러. 엣지를 빼서 코너와 페어.</li>
            <li><b>둘 다 U층</b> — 슬롯을 키홀로 써서 U에서 붙이기.</li>
            <li><b>갈라지거나 갇힘</b> — 둘 다 U로 꺼낸 뒤 거기서 페어.</li>
          </ol>
          <p>아래 시연은 맞춘 큐브에서 공식을 거꾸로 적용한 뒤, 해법을 재생합니다. 모든 공식은 <b>앞오른쪽(FR)</b> 슬롯 기준. 다른 슬롯은 미러.</p>`,
        algs: [{ label: '기본 삽입 (FR)', alg: "R U R'", setup: 'inverse', caseId: 1 }],
      },
      {
        title: '1. 기본 삽입',
        goal: '페어가 이미 되어 있으면 슬롯에 넣기만 하면 됩니다.',
        desc: `<p>${cats[0] ? cats[0].ko : '기본 삽입'} ${algsOf('basic').length}개. 근육 기억이 될 때까지 이 네 가지부터.</p>`,
        algs: algsOf('basic'),
      },
      {
        title: '2. 코너가 슬롯에 있음',
        goal: '코너는 FR에 있고 엣지만 빼서 붙입니다.',
        desc: `<p>코너를 잠깐 꺼냈다가 엣지와 페어한 뒤 다시 넣으세요. 자주 나옵니다.</p>`,
        algs: algsOf('corner'),
      },
      {
        title: '3. 엣지가 슬롯에 있음',
        goal: '엣지는 FR에 있고 코너만 U에 있습니다.',
        desc: `<p>코너가 슬롯에 있는 경우의 미러예요. 엣지를 지키거나, 잠깐 빼서 코너와 붙입니다.</p>`,
        algs: algsOf('edge'),
      },
      {
        title: '4. 둘 다 U층',
        goal: '코너와 엣지가 둘 다 위에 있지만 아직 안 붙었습니다.',
        desc: `<p>가장 케이스가 많아요. 흰 면이 어느 쪽을 보는지만 보면 됩니다. 슬롯을 키홀로 써서 U에서 페어하세요.</p>`,
        algs: algsOf('split'),
      },
      {
        title: '5. 갈라짐 · 갇힘',
        goal: '조각이 잘못된 슬롯에 끼었거나, 페어가 잘못된 자리에 붙었습니다.',
        desc: `<p>둘 다 U로 꺼낸 뒤 일반 U 케이스로 풀면 됩니다. 고급이지만 개수는 적어요.</p>`,
        algs: algsOf('advanced'),
      },
    ];
  }

  return [
    {
      title: 'F2L Overview', intro: true,
      goal: 'Pair a corner and edge and insert them together. The 41 cases are variations of that idea.',
      desc: `<p>The beginner method inserts white corners, then middle edges, separately. F2L builds a <b>corner+edge pair</b> and drops both into the slot at once.</p>
        <p>Do not memorise all 41 at once. These five ideas let you solve any case, slowly:</p>
        <ol>
          <li><b>Basic pairing</b> — already joined? Hold over the slot and insert.</li>
          <li><b>Corner in the slot</b> — take it out, pair with the edge, put both back.</li>
          <li><b>Edge in the slot</b> — the mirror. Free the edge, pair, insert.</li>
          <li><b>Both in U</b> — use the slot as a keyhole and pair on top.</li>
          <li><b>Split or trapped</b> — dump both pieces to U, then pair there.</li>
        </ol>
        <p>Each demo resets the cube, applies the inverse instantly, then plays the solution. Algorithms assume the <b>front-right (FR)</b> slot. Mirror left/right for the other three.</p>`,
      algs: [{ label: 'Basic insert (FR)', alg: "R U R'", setup: 'inverse', caseId: 1 }],
    },
    {
      title: '1. Basic inserts',
      goal: 'If the pair is already made, just put it in the slot.',
      desc: `<p>${cats[0] ? cats[0].en : 'Basic inserts'} — ${algsOf('basic').length} cases. Get these four into muscle memory first.</p>`,
      algs: algsOf('basic'),
    },
    {
      title: '2. Corner in the slot',
      goal: 'The corner is in FR. Fetch the edge, pair, reinsert.',
      desc: `<p>Think “out, pair, back in”. These show up a lot once the cross is done.</p>`,
      algs: algsOf('corner'),
    },
    {
      title: '3. Edge in the slot',
      goal: 'The edge is in FR. The corner is still on U.',
      desc: `<p>Mirror of the corner-in-slot idea. Keep the edge or lift it briefly to pair.</p>`,
      algs: algsOf('edge'),
    },
    {
      title: '4. Both pieces in U',
      goal: 'Corner and edge are both on top, not yet paired.',
      desc: `<p>The biggest group. Read where white on the corner points. Use the empty slot as a keyhole.</p>`,
      algs: algsOf('split'),
    },
    {
      title: '5. Split / trapped',
      goal: 'Pieces stuck in the wrong slots, or a pair trapped in the wrong place.',
      desc: `<p>Dump both to U, then solve as a normal U-layer case. Few cases, but they look messy.</p>`,
      algs: algsOf('advanced'),
    },
  ];
}

function ollLessons(lang) {
  const O = g.CubeOLL;
  const cases = (O && O.cases) || [];
  const cats = (O && O.cats) || [];
  const loc = lang === 'ko' ? 'ko' : 'en';
  const catLabel = id => {
    const c = cats.find(x => x.id === id);
    return c ? c[loc] : id;
  };
  const algsOf = cat => cases.filter(c => c.cat === cat).map(c => ({
    label: '#' + c.id + ' · ' + c.title[loc],
    alg: c.alg,
    setup: 'inverse',
    caseId: c.id,
  }));
  const twoLookEdgeAlgs = ((O && O.twoLookEdges) || []).map(e => ({
    label: e.title[loc],
    alg: e.alg,
    setup: 'inverse',
  }));
  const twoLookCornerAlgs = (O && O.twoLookCorners ? O.twoLookCorners() : []).map(c => ({
    label: '#' + c.id + ' · ' + c.title[loc],
    alg: c.alg,
    setup: 'inverse',
    caseId: c.id,
  }));
  const librarySteps = cats.map(cat => ({
    title: (lang === 'ko' ? '라이브러리 · ' : 'Library · ') + catLabel(cat.id),
    goal: lang === 'ko'
      ? `전체 OLL 57 중 ${catLabel(cat.id)} 패턴 ${O.byCat(cat.id).length}개를 연습합니다.`
      : `Drill the ${O.byCat(cat.id).length} full-OLL ${catLabel(cat.id)} cases.`,
    desc: lang === 'ko'
      ? `<p>2-Look OLL을 익힌 뒤, 한 번에 윗면을 맞추는 <b>전체 OLL</b> 케이스입니다. 아래는 <b>${catLabel(cat.id)}</b> 그룹입니다.</p>
         <p>각 케이스를 눌러 ▶시연으로 패턴과 공식을 확인하세요. 글 가이드의 <b>OLL 라이브러리</b>에서도 같은 목록을 볼 수 있습니다.</p>`
      : `<p>After 2-Look OLL, these are the <b>full one-look</b> cases. This step covers the <b>${catLabel(cat.id)}</b> family.</p>
         <p>Tap ▶ Demo on any algorithm to see the pattern and solution. The written <b>OLL library</b> lists the same cases.</p>`,
    algs: algsOf(cat.id),
  }));

  if (lang === 'ko') {
    return [
      {
        title: '2-Look OLL 개요', intro: true,
        goal: '마지막 층의 위치는 그대로 두고 방향만 맞춥니다. 먼저 십자, 그다음 코너입니다.',
        desc: `<p>OLL은 <b>Orientation of the Last Layer</b>입니다. 마지막 층 조각의 <b>방향</b>만 맞춰 윗면을 전부 노랗게 만들어요.</p>
          <p>2-Look OLL은 공식을 적게 외우는 버전입니다.</p>
          <ol>
            <li><b>노란 십자</b> — 윗면 엣지 네 개의 방향 맞추기</li>
            <li><b>노란 코너</b> — 십자 위에서 코너 네 개의 방향 맞추기</li>
          </ol>
          <p>점·L·선은 같은 십자 공식을 반복하면 되고, 코너는 <b>수네 / 안티수네</b>를 U 셋업과 함께 반복하면 됩니다.</p>
          <p>익숙해지면 아래 <b>라이브러리</b> 단계에서 전체 OLL 57케이스를 한 번에 맞추는 연습으로 확장할 수 있습니다.</p>`,
        algs: [{ label: '노란 십자 공식', alg: "F R U R' U' F'" }],
      },
      {
        title: '1. 노란 십자',
        goal: '윗면에 노란 + 를 만듭니다. 옆면 색은 아직 안 맞아도 됩니다.',
        desc: `<p>2-Look 엣지 단계 — <b>점 / L / 선</b> ${twoLookEdgeAlgs.length}가지. 모양은 <b>점 → L → 선 → 십자</b> 순으로 바뀝니다.</p>
          <p><b>L</b>은 팔이 위·왼쪽을 보게, <b>선</b>은 가로가 되게 잡으세요. 점은 한 공식으로 선까지 가거나, 두 번 연속으로 처리해도 됩니다.</p>`,
        algs: twoLookEdgeAlgs,
      },
      {
        title: '2. 노란 코너 (OCLL)',
        goal: '노란 십자 위에서 코너 방향을 맞춰 윗면 전체를 노랗게 만듭니다.',
        desc: `<p>2-Look 코너 단계 — OCLL <b>${twoLookCornerAlgs.length}개</b> (OLL #21–#27). 인식 이름은 <b>수네 / 안티수네 / H / 파이 / U / T / L</b>입니다.</p>
          <p>처음엔 이름을 다 외우기보다 <b>수네·안티수네</b>부터 익히고, 그다음 <b>헤드라이트(U)</b>, <b>T</b>, <b>L</b>처럼 눈에 잘 띄는 패턴을 추가하세요.</p>`,
        algs: twoLookCornerAlgs,
      },
      {
        title: '3. 인식 팁',
        goal: '공식보다 먼저, 윗면 패턴과 잡는 방향을 빠르게 읽는 연습을 합니다.',
        desc: `<p>노란 십자는 <b>점 / L / 선</b>만 바로 구분하면 됩니다. 코너는 <b>1개가 위?</b> 그러면 수네류, <b>0개가 위?</b> 그러면 H·파이, <b>2개가 위?</b> 그러면 U·T·L처럼 크게 나누면 읽기 쉽습니다.</p>
          <p>모양이 헷갈리면 헤드라이트가 어디에 있는지부터 찾으세요. 2-Look OLL은 완벽한 이름 암기보다 <b>눈에 띄는 단서</b>를 빠르게 잡는 단계입니다.</p>`,
        algs: [
          { label: '노란 십자 공식 다시 보기', alg: "F R U R' U' F'" },
          { label: '수네 다시 보기', alg: "R U R' U R U2 R'" },
          { label: '안티수네 다시 보기', alg: "R U2 R' U' R U' R'" },
        ],
      },
      ...librarySteps,
    ];
  }

  return [
    {
      title: '2-Look OLL Overview', intro: true,
      goal: 'Orient the last layer in two passes: edges first, then corners.',
      desc: `<p>OLL means <b>Orientation of the Last Layer</b>. You ignore piece positions for now and make the whole top face yellow.</p>
        <p>2-Look OLL keeps the algorithm count low:</p>
        <ol>
          <li><b>Yellow cross</b> — orient the four top edges</li>
          <li><b>Yellow corners</b> — orient the four top corners</li>
        </ol>
        <p>The edge step is just <b>dot / L / line</b>. The corner step is mostly <b>Sune / Antisune</b> plus U turns and repetition.</p>
        <p>Once that feels smooth, use the <b>Library</b> steps below to drill all <b>57</b> one-look OLL cases.</p>`,
      algs: [{ label: 'Yellow cross algorithm', alg: "F R U R' U' F'" }],
    },
    {
      title: '1. Yellow cross',
      goal: 'Make a yellow + on top. Side colours do not matter yet.',
      desc: `<p>2-Look edge step — <b>dot / L / line</b> (${twoLookEdgeAlgs.length} setups). The pattern flow is <b>dot -> L-shape -> line -> cross</b>.</p>
        <p>Hold the <b>L</b> with its arms up and left. Hold the <b>line</b> horizontally. The dot can be solved by chaining the same edge idea twice.</p>`,
      algs: twoLookEdgeAlgs,
    },
    {
      title: '2. Yellow corners (OCLL)',
      goal: 'From the yellow cross, orient the corners until the entire top is yellow.',
      desc: `<p>2-Look corner step — <b>${twoLookCornerAlgs.length} OCLL cases</b> (OLL #21–#27): <b>Sune / Antisune / H / Pi / U / T / L</b>.</p>
        <p>Start with <b>Sune</b> and <b>Antisune</b>, then add the easy visual patterns like <b>Headlights (U)</b>, <b>T</b>, and <b>L</b>.</p>`,
      algs: twoLookCornerAlgs,
    },
    {
      title: '3. Recognition notes',
      goal: 'Read the top-layer pattern quickly before you worry about full OLL case names.',
      desc: `<p>For the cross, only read <b>dot / L / line</b>. For corners, split the seven patterns by how many stickers face up: <b>1 up</b> means Sune or Antisune, <b>0 up</b> means H or Pi, and <b>2 up</b> means U, T, or L.</p>
        <p>If the pattern still feels unclear, look for <b>headlights</b> first. They are the fastest clue for U, Pi, and several mirror-looking cases.</p>`,
      algs: [
        { label: 'Yellow cross again', alg: "F R U R' U' F'" },
        { label: 'Sune again', alg: "R U R' U R U2 R'" },
        { label: 'Antisune again', alg: "R U2 R' U' R U' R'" },
      ],
    },
    ...librarySteps,
  ];
}

function pllLessons(lang) {
  const P = g.CubePLL;
  const cases = (P && P.cases) || [];
  const cats = (P && P.cats) || [];
  const loc = lang === 'ko' ? 'ko' : 'en';
  const catLabel = id => {
    const c = cats.find(x => x.id === id);
    return c ? c[loc] : id;
  };
  const algsOf = cat => cases.filter(c => c.cat === cat).map(c => ({
    label: c.id + ' · ' + c.title[loc],
    alg: c.alg,
    setup: 'inverse',
    caseId: c.id,
  }));
  const twoLookCornerAlgs = (P && P.twoLookCorners ? P.twoLookCorners() : []).map(c => ({
    label: c.id + ' · ' + c.title[loc],
    alg: c.alg,
    setup: 'inverse',
    caseId: c.id,
  }));
  const twoLookEdgeAlgs = (P && P.twoLookEdges ? P.twoLookEdges() : []).map(c => ({
    label: c.id + ' · ' + c.title[loc],
    alg: c.alg,
    setup: 'inverse',
    caseId: c.id,
  }));
  const librarySteps = cats.map(cat => ({
    title: (lang === 'ko' ? '라이브러리 · ' : 'Library · ') + catLabel(cat.id),
    goal: lang === 'ko'
      ? `전체 PLL 21 중 ${catLabel(cat.id)} ${P.byCat(cat.id).length}개를 연습합니다.`
      : `Drill the ${P.byCat(cat.id).length} full-PLL ${catLabel(cat.id)} cases.`,
    desc: lang === 'ko'
      ? `<p>2-Look PLL을 익힌 뒤, 한 번에 마지막 층을 맞추는 <b>전체 PLL</b> 케이스입니다. 아래는 <b>${catLabel(cat.id)}</b> 그룹입니다.</p>
         <p>각 케이스를 눌러 ▶시연으로 패턴과 공식을 확인하세요. 글 가이드의 <b>PLL 라이브러리</b>에서도 같은 목록을 볼 수 있습니다.</p>`
      : `<p>After 2-Look PLL, these are the <b>full one-look</b> cases. This step covers the <b>${catLabel(cat.id)}</b> family.</p>
         <p>Tap ▶ Demo on any algorithm to see the pattern and solution. The written <b>PLL library</b> lists the same cases.</p>`,
    algs: algsOf(cat.id),
  }));

  if (lang === 'ko') {
    return [
      {
        title: '2-Look PLL 개요', intro: true,
        goal: '윗면은 이미 노랑입니다. 먼저 코너 자리를, 그다음 엣지 자리를 맞춥니다.',
        desc: `<p>PLL은 <b>Permutation of the Last Layer</b>입니다. 방향은 끝난 상태에서 마지막 층 조각의 <b>위치</b>만 바꿉니다.</p>
          <p>2-Look PLL은 공식을 적게 외우는 버전입니다.</p>
          <ol>
            <li><b>코너 위치</b> — A-perm / E-perm으로 코너 네 개를 제자리로</li>
            <li><b>엣지 위치</b> — U / H / Z-perm으로 엣지 네 개를 제자리로</li>
          </ol>
          <p>대각 코너 교환은 <b>E-perm</b> 한 번, 또는 A-perm을 두 번 적용해도 됩니다. 마지막에 윗면을 돌려(AUF) 옆면을 맞춥니다.</p>
          <p>익숙해지면 아래 <b>라이브러리</b> 단계에서 전체 PLL 21케이스를 한 번에 맞추는 연습으로 확장할 수 있습니다.</p>`,
        algs: [{ label: 'A-perm (코너 3-순환)', alg: "R' F R' B2 R F' R' B2 R2" }],
      },
      {
        title: '1. 코너 위치 (CPLL)',
        goal: '윗면 코너 네 개를 제자리로 보냅니다. 엣지는 아직 안 맞아도 됩니다.',
        desc: `<p>2-Look 코너 단계 — CPLL <b>${twoLookCornerAlgs.length}개</b> (Aa, Ab, E).</p>
          <p>맞은 코너가 있으면 헤드라이트를 <b>뒤</b>에 두고 A-perm을 씁니다. 맞은 코너가 없으면 한 번 적용한 뒤 다시 봅니다. 대각 교환은 <b>E-perm</b>입니다.</p>`,
        algs: twoLookCornerAlgs,
      },
      {
        title: '2. 엣지 위치 (EPLL)',
        goal: '남은 엣지를 제자리로 돌려 큐브를 완성합니다.',
        desc: `<p>2-Look 엣지 단계 — EPLL <b>${twoLookEdgeAlgs.length}개</b> (Ua, Ub, H, Z).</p>
          <p>맞은 엣지가 하나면 그걸 <b>뒤</b>에 두고 U-perm을 고릅니다. 네 면이 모두 헤드라이트면 <b>H</b>, 대각 바이면 <b>Z</b>입니다. 마지막에 AUF로 옆면을 맞춥니다.</p>`,
        algs: twoLookEdgeAlgs,
      },
      {
        title: '3. 인식 팁',
        goal: '공식보다 먼저 헤드라이트와 맞은 블록을 빠르게 읽는 연습을 합니다.',
        desc: `<p>2-Look은 <b>코너가 맞았는가?</b>만 먼저 보면 됩니다. 헤드라이트 한 쌍이면 A-perm, 없으면 E-perm입니다.</p>
          <p>코너가 맞은 뒤에는 엣지만 봅니다. 맞은 엣지 하나 → U, 전부 헤드라이트 → H, 대각 바 → Z.</p>
          <p>전체 PLL로 넘어가면 헤드라이트 + 1x2 블록 + 2x2 블록이 가장 빠른 단서입니다.</p>`,
        algs: [
          { label: 'A-perm 다시 보기', alg: "R' F R' B2 R F' R' B2 R2" },
          { label: 'U-perm (a) 다시 보기', alg: "R U' R U R U R U' R' U' R2" },
          { label: 'H-perm 다시 보기', alg: "M2 U M2 U2 M2 U M2" },
        ],
      },
      ...librarySteps,
    ];
  }

  return [
    {
      title: '2-Look PLL Overview', intro: true,
      goal: 'The top is already yellow. Place the corners first, then the edges.',
      desc: `<p>PLL means <b>Permutation of the Last Layer</b>. Orientation is done; now you only move pieces to the right seats.</p>
        <p>2-Look PLL keeps the algorithm count low:</p>
        <ol>
          <li><b>Corner permutation</b> — A-perm / E-perm to seat the four corners</li>
          <li><b>Edge permutation</b> — U / H / Z-perm to seat the four edges</li>
        </ol>
        <p>A diagonal corner swap is one <b>E-perm</b>, or A-perm twice. Finish with an AUF (a U turn) to align the sides.</p>
        <p>Once that feels smooth, use the <b>Library</b> steps below to drill all <b>21</b> one-look PLL cases.</p>`,
      algs: [{ label: 'A-perm (3-corner cycle)', alg: "R' F R' B2 R F' R' B2 R2" }],
    },
    {
      title: '1. Corner positions (CPLL)',
      goal: 'Send the four top corners to their seats. Edges can wait.',
      desc: `<p>2-Look corner step — <b>${twoLookCornerAlgs.length} CPLL cases</b> (Aa, Ab, E).</p>
        <p>If one corner is already correct, hold its headlights at the <b>back</b> and use A-perm. If none is correct, apply it once and look again. A diagonal swap is <b>E-perm</b>.</p>`,
      algs: twoLookCornerAlgs,
    },
    {
      title: '2. Edge positions (EPLL)',
      goal: 'Cycle the last edges and finish the cube.',
      desc: `<p>2-Look edge step — <b>${twoLookEdgeAlgs.length} EPLL cases</b> (Ua, Ub, H, Z).</p>
        <p>If one edge is solved, hold it at the <b>back</b> and pick a U-perm. All headlights means <b>H</b>. Diagonal bars mean <b>Z</b>. Finish with an AUF to align the sides.</p>`,
      algs: twoLookEdgeAlgs,
    },
    {
      title: '3. Recognition notes',
      goal: 'Read headlights and solved blocks quickly before you worry about all 21 names.',
      desc: `<p>For 2-Look, first ask: <b>are the corners solved?</b> One pair of headlights means A-perm. None means E-perm.</p>
        <p>After the corners, read only the edges. One solved edge → U, headlights all around → H, diagonal bars → Z.</p>
        <p>When you move to full PLL, headlights plus 1x2 and 2x2 blocks are the fastest clues.</p>`,
      algs: [
        { label: 'A-perm again', alg: "R' F R' B2 R F' R' B2 R2" },
        { label: 'U-perm (a) again', alg: "R U' R U R U R U' R' U' R2" },
        { label: 'H-perm again', alg: "M2 U M2 U2 M2 U M2" },
      ],
    },
    ...librarySteps,
  ];
}

  g.CubeLessons = {
    states3: STEP_STATES,
    beginner3: { en: LESSONS_EN, ko: LESSONS_KO },
    cfop: { en: CFOP_EN, ko: CFOP_KO },
    roux: { en: ROUX_EN, ko: ROUX_KO },
    statesRoux: STEP_STATES_ROUX,
    f2l: { en: f2lLessons('en'), ko: f2lLessons('ko') },
    oll: { en: ollLessons('en'), ko: ollLessons('ko') },
    pll: { en: pllLessons('en'), ko: pllLessons('ko') },
    states2: STEP_STATES_2,
    beginner2: { en: LESSONS_2_EN, ko: LESSONS_2_KO },
    ortega2: { en: ortegaLessons('en'), ko: ortegaLessons('ko') },
    pblOrtega: PBL_ORTEGA,
    ortegaOllIds: ORTEGA_OLL_IDS,
    ortegaOllAlg: ORTEGA_OLL_ALG,
    statesOrtega: ortegaStates(),
    ortegaLessonStepForCase,
    states4: STEP_STATES_4,
    beginner4: { en: LESSONS_4_EN, ko: LESSONS_4_KO },
    states5: STEP_STATES_5,
    beginner5: { en: LESSONS_5_EN, ko: LESSONS_5_KO },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
