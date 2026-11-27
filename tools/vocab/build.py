import json, re, sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from py2hg import conv, syllables, tone
from words import CATS
from words2 import CATS2
CATS = CATS2 + CATS  # 추가 기초 단어를 앞에
from ex1 import EX as E1
from ex2 import EX as E2
from ex3 import EX as E3
EX = {**E1, **E2, **E3}

def sandhi(t):
    o = t[:]; i = 0
    while i < len(t):
        if t[i] != 3: i += 1; continue
        j = i
        while j + 1 < len(t) and t[j + 1] == 3: j += 1
        for k in range(i, j): o[k] = 2
        i = j + 1
    return o

def render(py):
    """병음 문장 → (한글 문장, [[소리, 실제 성조], ...])"""
    toks = py.split(' ')
    hg_toks, segs, cur = [], [], []
    for tk in toks:
        if tk == '/':
            hg_toks.append('/'); segs.append(cur); cur = []; continue
        m = re.match(r"^([^A-Za-zÀ-ɏ']*)(.*?)([^A-Za-zÀ-ɏ']*)$", tk)
        pre, core, post = m.groups()
        sy = syllables(core)
        chunks = [conv(x) for x in sy]
        for c, x in zip(chunks, sy): cur.append([c, tone(x)])
        hg_toks.append(pre + ''.join(chunks) + post)
        if re.search(r'[,.?!…]', post): segs.append(cur); cur = []
    segs.append(cur)
    parts = []
    for sg in segs:
        st = sandhi([t for _, t in sg])
        parts += [[c, t] for (c, _), t in zip(sg, st)]
    return ' '.join(hg_toks), parts

out = []
missing, extra = [], set(EX)
for cid, name, ws in CATS:
    items = []
    for i, (hz, py, ko, star, note) in enumerate(ws):
        hg, parts = render(py.replace('…', ' ').strip())
        w = {'id': cid + ':' + str(i), 'hz': hz, 'py': py, 'ko': ko, 'hg': hg.replace('  ', ' '), 'parts': parts}
        if star: w['star'] = 1
        if note: w['note'] = note
        key = cid + ':' + py
        if star:
            if key not in EX or len(EX[key]) != 2: missing.append(key)
            else:
                extra.discard(key)
                w['ex'] = []
                for ehz, epy, eko in EX[key]:
                    ehg, ep = render(epy)
                    w['ex'].append({'hz': ehz, 'py': epy, 'ko': eko, 'hg': ehg, 'tones': ep})
        items.append(w)
    out.append({'id': cid, 'name': name, 'words': items})
print('missing', missing); print('extra', extra)
open(os.path.join(ROOT, 'vocab', 'data.js'), 'w', encoding='utf-8').write('window.VOC=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('words', sum(len(c['words']) for c in out), 'examples', sum(len(w.get('ex', [])) for c in out for w in c['words']))

# ---- 예문 단어 사전 (기본 단어) + 연결률 검사 ----
from func import FUNC
lex = []
seen = set()
for py, ko in FUNC:
    if (py, ko) in seen: continue
    seen.add((py, ko))
    hg = '|'.join(conv(x) for x in syllables(py))
    lex.append([py, hg, ko])
with open(os.path.join(ROOT, 'vocab', 'data.js'), 'a', encoding='utf-8') as f:
    f.write('window.VOC_FUNC=' + json.dumps(lex, ensure_ascii=False, separators=(',', ':')) + ';\n')
keys = set()
def norm(s): return re.sub(r"[,.?!…]", '', s).lower()
for c in out:
    for w in c['words']: keys.add(norm(re.sub(r'\s*…\s*', ' ', w['py'])).replace('  ', ' '))
for py, _, _ in lex: keys.add(norm(py))
miss = {}
for c in out:
    for w in c['words']:
        for e in w.get('ex', []):
            toks = [norm(t) for t in e['py'].split(' ') if t not in ('/', '…')]
            i = 0
            while i < len(toks):
                hit = 0
                for n in (3, 2, 1):
                    if ' '.join(toks[i:i+n]) in keys: hit = n; break
                if not hit: miss[toks[i]] = e['py']; i += 1
                else: i += hit
print('unlinked', len(miss))
for k, v in miss.items(): print(' ', k, '|', v)

# ---- 양사 탭 (measure.py → vocab/measure.js) ----
from measure import MW, GROUPS, SENTS, LEX as MLEX
def row(hz, py, ko):
    hg, parts = render(py); return {'hz': hz, 'py': py, 'ko': ko, 'hg': hg, 'tones': parts}
mw = []
for i, (grade, hz, py, ko, target, note, ph) in enumerate(MW):
    hg, parts = render(py)
    mw.append({'id': 'mw:' + str(i), 'grade': grade, 'hz': hz, 'py': py, 'hg': hg, 'parts': parts, 'ko': ko, 'target': target, 'note': note, 'ph': [row(*p) for p in ph]})
sents = [dict(row(hz, py, ko), part=part) for part, hz, py, ko in SENTS]
mlex = [[py, '|'.join(conv(x) for x in syllables(py)), '양사: ' + ko] for _, hz, py, ko, *_ in MW]
mlex += [[py, '|'.join(conv(x) for x in syllables(py)), ko] for py, ko in MLEX]
with open(os.path.join(ROOT, 'vocab', 'measure.js'), 'w', encoding='utf-8') as f:
    f.write('// 양사 탭 데이터. tools/vocab/measure.py를 고친 뒤 build.py로 만든다.\n')
    f.write('window.MW=' + json.dumps({'words': mw, 'groups': GROUPS, 'sents': sents, 'lex': mlex}, ensure_ascii=False, separators=(',', ':')) + ';\n')
for py, _, _ in mlex: keys.add(norm(py))
mmiss = {}
for w in mw:
    for e in w['ph'] + []:
        pass
for e in [p for w in mw for p in w['ph']] + sents:
    toks = [norm(t) for t in e['py'].split(' ') if t not in ('/', '…')]
    i = 0
    while i < len(toks):
        hit = 0
        for n in (3, 2, 1):
            if ' '.join(toks[i:i+n]) in keys: hit = n; break
        if not hit: mmiss[toks[i]] = e['py']; i += 1
        else: i += hit
print('measure', len(mw), 'phrases', sum(len(w['ph']) for w in mw), 'unlinked', len(mmiss))
for k, v in mmiss.items(): print(' ', k, '|', v)
