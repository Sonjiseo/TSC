# 3부분 추가 단원(more.py) → part3/more.js
# 실행: python3 tools/part3/build.py   (기존 단어 표는 node tools/checks/dump.js로 읽어 같은 단어는 같은 키를 쓴다)
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'vocab')); sys.path.insert(0, HERE)
from py2hg import hangul_word
import more

dump = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'tools', 'checks', 'dump.js')], cwd=ROOT))
# 이전에 만든 more.js 단어는 index.html에서 W에 합쳐지므로, 기존 표로 보지 않는다(다시 만든다)
_old = open(os.path.join(ROOT, 'part3', 'more.js')).read() if os.path.exists(os.path.join(ROOT, 'part3', 'more.js')) else ''
OLDKEYS = set(json.loads(_old[_old.index('{'):_old.rindex('}') + 1])['W']) if _old else set()
EXISTX = {}  # 추가 패턴 단어(WX) — 뜻을 안 정한 단어는 여기서도 찾는다
EXIST = {}   # (hz, py) -> [(key, ko)]  — 기존 W(단어 탭에 나오는 표)
for k, hz, py, hg, tones, ko in dump['part3']:
    t, key = k.split('.', 1)
    if t == 'W' and key in OLDKEYS: continue
    if t == 'W': EXIST.setdefault((hz, py), []).append((key, ko))
    elif t == 'WX': EXISTX.setdefault((hz, py), (key, [hz, py, hg, tones, ko]))

PUNCT = set('，。？！、')
NEW = {}       # key -> [hz, py, hg, tones, ko]
BYSPEC = {}    # (hz, py) -> ko (스펙 안에서 처음 정한 뜻)
NEWKEY = {}    # (hz, py, ko) -> key
def plain(s):
    m = {'āáǎà': 'a', 'ēéěè': 'e', 'īíǐì': 'i', 'ōóǒò': 'o', 'ūúǔù': 'u', 'ǖǘǚǜü': 'v'}
    for a, b in m.items():
        for c in a: s = s.replace(c, b)
    return re.sub(r'[^a-z]', '', s.lower())
def hg_of(py):
    groups = [hangul_word(w) for w in py.split(' ')]
    return ' '.join(g[0] for g in groups), [t for g in groups for t in g[1]]
errors = []
def word_key(hz, py, ko):
    if ko is None:
        ko = BYSPEC.get((hz, py))
        if ko is None:
            ex = EXIST.get((hz, py))
            if ex: return ex[0][0]
            if (hz, py) in EXISTX:   # 단어 탭에도 나오도록 같은 키로 W에 넣는다
                key, row = EXISTX[(hz, py)]; NEW[key] = row; return key
            if hz == '一': ko = '1, 하나'
            else:
                errors.append('뜻 없음: %s %s' % (hz, py)); return '?'
    BYSPEC.setdefault((hz, py), ko)
    for key, eko in EXIST.get((hz, py), []):
        if eko == ko: return key
    if (hz, py, ko) in NEWKEY: return NEWKEY[(hz, py, ko)]
    base = 'm_' + plain(py); key = base; n = 2
    while key in NEW or any(key == k for v in EXIST.values() for k, _ in v): key = base + str(n); n += 1
    hg, tones = hg_of(py)
    NEW[key] = [hz, py, hg, tones, ko]; NEWKEY[(hz, py, ko)] = key
    return key
def sent(ko, spec):
    keys, toks = [], []
    for tok in spec.split(' '):   # 뜻 안의 공백: ':'이 없는 조각은 앞 단어의 뜻에 이어 붙인다
        if tok not in PUNCT and tok != '/' and ':' not in tok and toks: toks[-1] += ' ' + tok
        else: toks.append(tok)
    for tok in toks:
        if tok in PUNCT or tok == '/': keys.append(tok); continue
        parts = tok.split(':', 2)
        hz, py = parts[0], parts[1].replace('_', ' ')
        keys.append(word_key(hz, py, parts[2] if len(parts) > 2 else None))
    return [ko, keys]

units = []
for uid, name, items in more.UNITS:
    out = []
    for it in items:
        x = {'id': it['id'], 'title': it['title'], 'q': sent(*it['q']), 'a': [sent(*a) for a in it['a']], 'note': it['note']}
        if it.get('alt'): x['alt'] = [{'s': sent(k, s), 'why': w} for k, s, w in it['alt']]
        out.append(x)
    units.append({'id': uid, 'name': name, 'items': out})
if errors: print('\n'.join(sorted(set(errors)))); sys.exit(1)
with open(os.path.join(ROOT, 'part3', 'more.js'), 'w') as f:
    f.write('// 3부분 추가 단원 (교재 29~43쪽). tools/part3/more.py를 고친 뒤 build.py로 만든다. 직접 고치지 않는다.\n')
    f.write('window.P3MORE = ' + json.dumps({'W': NEW, 'units': units}, ensure_ascii=False, indent=0).replace('\n', '') + ';\n')
print('새 단어', len(NEW), '문항', sum(len(u['items']) for u in units))
for k, v in NEW.items():
    if (v[0], v[1]) in EXIST: print('  같은 글자 다른 뜻:', v[0], v[1], v[4], '/ 기존:', [e[1] for e in EXIST[(v[0], v[1])]])
