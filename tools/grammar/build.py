# 문법·표현 페이지 데이터 → grammar/data.js
# 실행: python3 tools/grammar/build.py   (끝에 'unlinked 0'이어야 한다)
import json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'vocab'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from py2hg import conv, syllables
src = open(os.path.join(ROOT, 'tools', 'vocab', 'build.py')).read().split('\nout = []')[0]
ns = {'__file__': os.path.join(ROOT, 'tools', 'vocab', 'build.py')}; exec(src, ns); render = ns['render']
from data import BOOK, EXTRA, UP_BOOK, UP_EXTRA, MEMO, LEX

HZ = re.compile(r'[一-鿿]')
def row(r):
    hz, py, ko = r[:3]
    hg, parts = render(py)
    o = {'hz': hz, 'py': py, 'ko': ko, 'hg': hg, 'tones': parts}
    if len(r) > 3: o['tsc'] = 1
    return o
def point(p, pid):
    for k in ('t', 'f', 'd', 'tip', 'fix'):
        if p.get(k) and HZ.search(p[k]): raise SystemExit('화면 글에 한자: ' + pid + ' ' + p[k])
    o = {'id': pid, 't': p['t'], 'f': p['f'], 'd': p['d'], 'ex': [row(r) for r in p['ex']]}
    if p.get('tip'): o['tip'] = p['tip']
    if p.get('fix'): o['fix'] = p['fix']
    return o

out = {
 'book': [{'id': uid, 'lesson': les, 'py': py, 'ko': ko, 'pages': pg, 'points': [point(p, uid + ':' + str(i)) for i, p in enumerate(pts)]} for uid, les, py, ko, pg, pts in BOOK],
 'extra': [point(p, 'x:' + str(i)) for i, p in enumerate(EXTRA)],
 'up': [point(p, 'u:' + str(i)) for i, p in enumerate(UP_BOOK)] + [dict(point(p, 'ux:' + str(i)), add=1) for i, p in enumerate(UP_EXTRA)],
 'memo': [{'id': 'm' + str(i), 'part': part, 'desc': desc, 'rows': [dict(row(r), id='m' + str(i) + ':' + str(j)) for j, r in enumerate(rows)]} for i, (part, desc, rows) in enumerate(MEMO)],
 'lex': [[py, '|'.join(conv(x) for x in syllables(py)), ko] for py, ko in LEX],
}
with open(os.path.join(ROOT, 'grammar', 'data.js'), 'w', encoding='utf-8') as f:
    f.write('// 문법·표현 페이지 데이터. tools/grammar/data.py를 고친 뒤 build.py로 만든다(직접 고치지 않기).\n')
    f.write('window.GR=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')

# ---- 연결 검사: 단어장·기본 단어·양사·LEX에 없는 단어 ----
def load(path, var):
    t = open(os.path.join(ROOT, path), encoding='utf-8').read()
    m = re.search(r'window\.' + var + r'=(.*?);\n', t, re.S); return json.loads(m.group(1))
def norm(s): return re.sub(r"[,.?!…、]", '', s).lower()
keys = set()
for c in load('vocab/data.js', 'VOC'):
    for w in c['words']: keys.add(norm(re.sub(r'\s*…\s*', ' ', w['py'])).replace('  ', ' ').strip())
for py, _, _ in load('vocab/data.js', 'VOC_FUNC') + load('vocab/measure.js', 'MW')['lex'] + out['lex']: keys.add(norm(py))
rows = [e for u in out['book'] for p in u['points'] for e in p['ex']] + [e for p in out['extra'] + out['up'] for e in p['ex']] + [e for m in out['memo'] for e in m['rows']]
miss = {}
for e in rows:
    toks = [norm(t) for t in e['py'].split(' ') if t not in ('/', '…')]
    i = 0
    while i < len(toks):
        hit = 0
        for n in (3, 2, 1):
            if ' '.join(toks[i:i + n]) in keys: hit = n; break
        if not hit: miss[toks[i]] = e['py']; i += 1
        else: i += hit
n = sum(len(u['points']) for u in out['book'])
print('book', len(out['book']), 'units', n, 'points · extra', len(out['extra']), '· up', len(out['up']), '· memo', sum(len(m['rows']) for m in out['memo']), '· rows', len(rows))
print('unlinked', len(miss))
for k, v in sorted(miss.items()): print(' ', k, '|', v)
