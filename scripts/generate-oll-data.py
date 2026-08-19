#!/usr/bin/env python3
"""Generate oll-cases-data.js — standard OLL 1-57 primary algorithms."""

from pathlib import Path

# id, cat, en, ko, alg, tip_en, tip_ko
RAW = [
(1,'dot','Runway','런웨이',"R U2 R2 F R F' U2 R' F R F'","No edges oriented on top.","윗면 엣지가 모두 뒤집혀 있습니다."),
(2,'dot','Slash','슬래시',"F R U R' U' F' f R U R' U' f'","Dot with a diagonal slash pattern.","대각 슬래시가 보이는 점 케이스입니다."),
(3,'dot','Wide Sune dot','와이드 수네 점',"f R U R' U' f' U' F R U R' U' F'","Dot with wide-sune setup.","와이드 수네 셋업이 보이는 점입니다."),
(4,'dot','C-shape dot','C형 점',"f R U R' U' f' U F R U R' U' F'","Dot with a C-shaped yellow pattern.","C자 노란 패턴이 보이는 점입니다."),
(5,'other','Left square','왼쪽 사각',"r' U2 R U R' U r","Square shape on the left.","왼쪽에 사각형 패턴입니다."),
(6,'other','Right square','오른쪽 사각',"r U2 R' U' R U' r'","Square shape on the right.","오른쪽에 사각형 패턴입니다."),
(7,'other','Lightning','번개',"r U R' U R U2 r'","Small lightning bolt.","작은 번개 모양입니다."),
(8,'other','Reverse lightning','역번개',"r' U' R U' R' U2 r","Mirror lightning bolt.","미러 번개 모양입니다."),
(9,'other','Kite','연',"R U R' U' R' F R2 U R' U' F'","Kite / fish shape.","연/물고기 모양입니다."),
(10,'other','Anti-kite','역연',"R U R' U R' F R F' R U2 R'","Mirror kite shape.","미러 연 모양입니다."),
(11,'other','Downstairs','Downstairs',"r' R2 U R' U R U2 R' U M'","Lightning with downstairs pattern.","Downstairs 패턴 번개입니다."),
(12,'other','Upstairs','Upstairs',"r U R' U R' F R F' R U2 r'","Lightning with upstairs pattern.","Upstairs 패턴 번개입니다."),
(13,'other','Gun','총',"r U' r' U' r U r' F' U F","Knight-move gun shape.","나이트 이동 총 모양입니다."),
(14,'other','Anti-gun','역총',"R' F R U R' F' R F U' F'","Mirror gun shape.","미러 총 모양입니다."),
(15,'other','Squeegee','Squeegee',"r' U' r R' U' R U r' U r","Knight squeegee shape.","나이트 스퀴지 모양입니다."),
(16,'other','Anti-squeegee','Anti-squeegee',"r U r' R U R' U' r U' r'","Mirror squeegee shape.","미러 스퀴지 모양입니다."),
(17,'dot','Dot — corners oriented','점 — 코너 맞음',"R U R' U R' F R F' U2 R' F R F'","Dot with some corners already oriented.","코너가 일부 맞은 점입니다."),
(18,'dot','Dot — no corners','점 — 코너 없음',"r U R' U R U2 r r U' R U' R' U2 r","Dot with no oriented corners.","맞은 코너가 없는 점입니다."),
(19,'dot','Dot — right bar','점 — 오른쪽 바',"M U R U R' U' M' R' F R F'","Dot with a vertical bar on the right.","오른쪽 세로 바가 있는 점입니다."),
(20,'dot','Dot — left bar','점 — 왼쪽 바',"M U R U R' U' M2 U R U' r'","Dot with a vertical bar on the left.","왼쪽 세로 바가 있는 점입니다."),
(21,'other','H / Double Sune','H / 더블 수네',"R U R' U R U' R' U R U2 R'","Cross done; checkerboard / H pattern.","십자 완료, 체커보드 H 패턴입니다."),
(22,'other','Pi / Bruno','파이 / 브루노',"R U2 R2 U' R2 U' R2 U2 R","Cross done; headlights, Pi shape.","십자 완료, 헤드라이트 파이 모양입니다."),
(23,'other','U / Headlights','U / 헤드라이트',"R2 D R' U2 R D' R' U2 R'","Cross done; clear headlights on one side.","십자 완료, 한쪽 헤드라이트입니다."),
(24,'other','T / Chameleon','T / 카멜레온',"r U R' U' r' F R F'","Cross done; T-like side face.","십자 완료, T형 옆면입니다."),
(25,'other','L / Bowtie','L / 보타이',"F' r U R' U' r' F R","Cross done; L or bowtie side pattern.","십자 완료, L/보타이 옆면입니다."),
(26,'other','Antisune','안티수네',"R U2 R' U' R U' R'","Cross done; one corner up — Antisune.","십자 완료, 코너 1개 — 안티수네입니다."),
(27,'other','Sune','수네',"R U R' U R U2 R'","Cross done; one corner up — Sune.","십자 완료, 코너 1개 — 수네입니다."),
(28,'line','Arrow / Stealth','화살 / 스텔스',"r U R' U' r' R U R U' R'","All corners oriented; arrow line.","코너 전부 맞음, 화살 선 패턴입니다."),
(29,'other','Spotted chameleon','점 카멜레온',"R U R' U' R U' R' F' U' F R U R'","Awkward spotted chameleon.","어색한 점 카멜레온입니다."),
(30,'other','Anti-spotted chameleon','역 점 카멜레온',"F R' F R2 U' R' U' R U R' F2","Mirror awkward chameleon.","미러 어색한 카멜레온입니다."),
(31,'other','P-shape right','P형 오른쪽',"R' U' F U R U' R' F' R","P-shape opening to the right.","열린 쪽이 오른쪽 P형입니다."),
(32,'other','P-shape left','P형 왼쪽',"R U B' U' R' U R B R'","P-shape opening to the left.","열린 쪽이 왼쪽 P형입니다."),
(33,'tshape','T / Key','T / 키',"R U R' U' R' F R F'","Classic T-shape on top.","윗면 T자 패턴입니다."),
(34,'other','C / City','C / 시티',"R U R2 U' R' F R U R U' F'","C-shape on the side.","옆면 C자 패턴입니다."),
(35,'lshape','Big fish','큰 물고기',"R U2 R2 F R F' R U2 R'","L-shape big fish pattern.","L자 큰 물고기 패턴입니다."),
(36,'other','W / Sea-mew','W / 갈매기',"L' U' L U' L' U L U L F' L' F","W-shape on the side.","옆면 W자 패턴입니다."),
(37,'other','Mounted fish','물고기',"F R U R' U' F'","Small mounted fish.","작은 물고기 패턴입니다."),
(38,'other','W / Breakneck','W / 브레크넥',"R U R' U R U' R' U' R' F R F'","W-shape breakneck variant.","W자 브레크넥 변형입니다."),
(39,'other','Fung','Fung',"L F' L' U' L U F U' L'","Big lightning — Fung.","큰 번개 Fung 패턴입니다."),
(40,'other','Anti-Fung','역 Fung',"R' F R U R' U' F' U R","Mirror Fung pattern.","미러 Fung 패턴입니다."),
(41,'other','Awkward fish','어색한 물고기',"R U R' U R U2 R' F R U R' U' F'","Awkward fish / dalmatian.","어색한 물고기/달마시안입니다."),
(42,'other','Anti-awkward fish','역 어색한 물고기',"R' U' R U' R' U2 R F R U R' U' F'","Mirror awkward fish.","미러 어색한 물고기입니다."),
(43,'tshape','T — reverse P','T — 역 P',"f' L' U' L U f","T with reverse-P on the side.","옆면 역 P가 있는 T입니다."),
(44,'tshape','T — P pattern','T — P 패턴',"f R U R' U' f'","T with P on the side.","옆면 P가 있는 T입니다."),
(45,'tshape','T — headlights back','T — 뒤 헤드라이트',"F R U R' U' F'","Simple T; headlights to the back.","단순 T, 헤드라이트가 뒤입니다."),
(46,'other','C — headlights','C — 헤드라이트',"R' U' R' F R F' U R","C-shape with headlights.","헤드라이트 C자 패턴입니다."),
(47,'lshape','L — back corners','L — 뒤 코너',"F' L' U' L U L' U' L U F","L-shape; back corners oriented.","L자, 뒤 코너 맞음입니다."),
(48,'line','I — F2L trigger','I — F2L 트리거',"F R U R' U' R U R' U' F'","Line with F2L-style trigger.","F2L 트리거 선 패턴입니다."),
(49,'lshape','L — right corners','L — 오른쪽 코너',"r U' r r U r r U r r U' r","L-shape; right corners oriented.","L자, 오른쪽 코너 맞음입니다."),
(50,'lshape','L — left corners','L — 왼쪽 코너',"r' U r r U' r r U' r r U r'","L-shape; left corners oriented.","L자, 왼쪽 코너 맞음입니다."),
(51,'line','Line — front headlights','선 — 앞 헤드라이트',"f R U R' U' R U R' U' f'","Horizontal line; front headlights.","가로 선, 앞 헤드라이트입니다."),
(52,'line','Line — back headlights','선 — 뒤 헤드라이트',"R U R' U R U' B U' B' R'","Horizontal line; back headlights.","가로 선, 뒤 헤드라이트입니다."),
(53,'lshape','L — front corners','L — 앞 코너',"r' U' R U' R' U R U' R' U2 r","L-shape; front corners oriented.","L자, 앞 코너 맞음입니다."),
(54,'lshape','L — diagonal corners','L — 대각 코너',"r U R' U R U' R' U R U2 r'","L-shape; diagonal corners oriented.","L자, 대각 코너 맞음입니다."),
(55,'line','Line — diagonal','선 — 대각',"R U R2 U' R2 U' R2 U2 R","Line with diagonal corners.","대각 코너 선 패턴입니다."),
(56,'line','Line — right corners','선 — 오른쪽 코너',"r U r' U R U' R' U R U' R' r U' r'","Line; right corners oriented.","선, 오른쪽 코너 맞음입니다."),
(57,'line','Line — no corners','선 — 코너 없음',"R U R' U' M' U R U' r'","Line; no corners oriented.","선, 맞은 코너 없음입니다."),
]

TWO_LOOK_EDGES = [
  ('dot', 'Dot', '점', "F R U R' U' F' U F R U R' U' F'", 'No yellow cross yet — apply twice if needed.', '노란 십자 없음 — 필요하면 두 번 적용.'),
  ('lshape', 'L-shape', 'L 모양', "F U R U' R' F'", 'Hold L arms up-left.', 'L 팔이 위·왼쪽을 보게.'),
  ('line', 'Line', '선', "F R U R' U' F'", 'Hold the yellow line horizontally.', '노란 선을 가로로.'),
]

TWO_LOOK_CORNER_IDS = [21, 22, 23, 24, 25, 26, 27]

CATS = [
  ('dot', 'Dot', '점'),
  ('line', 'Line', '선'),
  ('lshape', 'L-shape', 'L자'),
  ('tshape', 'T-shape', 'T자'),
  ('other', 'Other', '기타'),
]

CAT_STEP = {
  'twoLookEdges': 1,
  'twoLookCorners': 2,
  'recognition': 3,
  'dot': 4,
  'line': 5,
  'lshape': 6,
  'tshape': 7,
  'other': 8,
}


def js_str(s):
  return s.replace('\\', '\\\\').replace('"', '\\"')


def main():
  out = Path(__file__).resolve().parent.parent / 'oll-cases-data.js'
  lines = [
    '// Auto-generated OLL 1-57 case data. Run: python scripts/generate-oll-data.py',
    '/* eslint-disable */',
    '(function (g) {',
    "  'use strict';",
    '',
    '  const CATS = [',
  ]
  for cid, en, ko in CATS:
    lines.append(f"    {{ id: '{cid}', en: '{en}', ko: '{ko}' }},")
  lines.append('  ];')
  lines.append('')
  lines.append('  const CASES = [')

  for row in RAW:
    i, cat, en, ko, alg, tip_en, tip_ko = row
    ocll = i in TWO_LOOK_CORNER_IDS
    lines.append(f"    {{ id: {i}, cat: '{cat}', ocll: {str(ocll).lower()},")
    lines.append(f"      title: {{ en: '{js_str(en)}', ko: '{js_str(ko)}' }},")
    lines.append(f"      tips: {{ en: '{js_str(tip_en)}', ko: '{js_str(tip_ko)}' }},")
    lines.append(f"      alg: \"{js_str(alg)}\" }},")

  lines.append('  ];')
  lines.append('')
  lines.append('  const TWO_LOOK_EDGES = [')
  for key, en, ko, alg, tip_en, tip_ko in TWO_LOOK_EDGES:
    lines.append(f"    {{ key: '{key}',")
    lines.append(f"      title: {{ en: '{js_str(en)}', ko: '{js_str(ko)}' }},")
    lines.append(f"      tips: {{ en: '{js_str(tip_en)}', ko: '{js_str(tip_ko)}' }},")
    lines.append(f"      alg: \"{js_str(alg)}\" }},")
  lines.append('  ];')
  lines.append('')
  lines.append(f'  const TWO_LOOK_CORNER_IDS = {TWO_LOOK_CORNER_IDS};')
  lines.append('')
  lines.append('  const CAT_STEP = ' + str(CAT_STEP).replace("'", '"') + ';')
  lines.append('')
  lines.append('  g.OllCasesData = { CATS, CASES, TWO_LOOK_EDGES, TWO_LOOK_CORNER_IDS, CAT_STEP };')
  lines.append("})(typeof globalThis !== 'undefined' ? globalThis : this);")
  lines.append('')

  out.write_text('\n'.join(lines), encoding='utf-8')
  print(f'Wrote {len(RAW)} cases to {out}')


if __name__ == '__main__':
  main()
