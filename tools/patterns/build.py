# 추가 패턴(교재 밖, HSK 3~4급 기본 문법) → part2/extra.js
# 실행: python3 tools/patterns/build.py
import json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'vocab'))
import importlib.util
spec = importlib.util.spec_from_file_location('vb', os.path.join(ROOT, 'tools', 'vocab', 'build.py'))
src = open(os.path.join(ROOT, 'tools', 'vocab', 'build.py')).read().split('\nout = []')[0]
ns = {'__file__': os.path.join(ROOT, 'tools', 'vocab', 'build.py')}; exec(src, ns); render = ns['render']

# 2부분 추가 패턴: (제목, 공식, 설명, [(한자, 병음, 한국어), ...])
P2X = [
 ('A는 B만큼 ~하지 않다', 'A méiyǒu B + 형용사', '비교 그림에서 ‘덜 ~하다’를 말할 때. bǐ 문장의 반대 모양이에요. (HSK 3급 문법)',
  [('我没有他高。', 'Wǒ méiyǒu tā gāo.', '저는 그 사람만큼 키가 크지 않아요.'),
   ('这件衣服没有那件贵。', 'Zhè jiàn yīfu / méiyǒu nà jiàn guì.', '이 옷은 저 옷만큼 비싸지 않아요.')]),
 ('A가 B보다 얼마나 더 ~하다', 'A bǐ B + 형용사 + 차이(수량)', '차이 나는 양은 형용사 뒤에 붙여요. 앞에 hěn을 넣지 않아요. (HSK 3급 문법)',
  [('他比我高五厘米。', 'Tā bǐ wǒ gāo wǔ límǐ.', '그는 저보다 5cm 더 커요.'),
   ('红色的比蓝色的贵十块。', 'Hóngsè de / bǐ lánsè de guì shí kuài.', '빨간 것이 파란 것보다 10위안 더 비싸요.')]),
 ('A는 B와 똑같이 ~하다', 'A gēn B yíyàng + 형용사', '두 사물이 같을 때. 다르면 bù yíyàng이에요. (HSK 3급 문법)',
  [('我跟哥哥一样高。', 'Wǒ gēn gēge yíyàng gāo.', '저는 형이랑 키가 똑같아요.'),
   ('这件衣服跟那件一样贵。', 'Zhè jiàn yīfu / gēn nà jiàn yíyàng guì.', '이 옷은 저 옷이랑 가격이 똑같아요.')]),
 ('(장소)에 ~가 …되어 있다', '장소 + 동사zhe + 수량 + 사물', '그림 속 물건이 놓인 모습을 말할 때. fàngzhe(놓여 있다), guàzhe(걸려 있다). (HSK 3급 문법)',
  [('桌子上放着两本书。', 'Zhuōzi shang / fàngzhe liǎng běn shū.', '책상 위에 책이 두 권 놓여 있어요.'),
   ('墙上挂着一张画。', 'Qiáng shang / guàzhe yì zhāng huà.', '벽에 그림이 한 장 걸려 있어요.')]),
]
LEX = [('méiyǒu', '~만큼 ~하지 않다 (비교)'), ('jiàn', '벌 (옷을 세는 말)'), ('yīfu', '옷'), ('nà', '저, 그'), ('límǐ', '센티미터(cm)'), ('yíyàng', '같다'), ('guàzhe', '걸려 있다'),
       ('qiáng', '벽'), ('zhāng', '장 (종이·그림을 세는 말)'), ('huà', '그림'), ('lánsè', '파란색'), ('hóngsè', '빨간색'), ('gēge', '형, 오빠'), ('gēn', '~와')]

def row(hz, py, ko):
    hg, parts = render(py)
    return [ko, py, hg, parts]
out = {'patterns': [{'t': t, 'f': f, 'd': d, 'ex': [row(*e) for e in ex], 'hz': [e[0] for e in ex]} for t, f, d, ex in P2X],
       'lex': [[py, '|'.join(c for c, _ in render(py)[1]), ko] for py, ko in LEX]}
with open(os.path.join(ROOT, 'part2', 'extra.js'), 'w') as fp:
    fp.write('// 추가 패턴 (교재 밖, HSK 3~4급 기본 문법). tools/patterns/build.py로 만든다. 행 = [한국어, 병음, 한글, 성조], 한자는 hz\n')
    fp.write('window.P2X = ' + json.dumps(out, ensure_ascii=False) + ';\n')
print('ok', len(out['patterns']))
for p in out['patterns']:
    for e in p['ex']: print(e[1], '|', e[2], [t for _, t in e[3]])
