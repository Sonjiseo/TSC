# 검사 4: 데이터에 적힌 한글 발음이 병음에서 규칙대로 만든 한글(tools/vocab/py2hg.py)과 같은지.
# 실행: python3 tools/checks/hangul.py   → 다른 곳 목록. (된소리 ㄲㄸㅃㅉ는 화면에서 성조로 정해지므로 비교에서 뺀다)
import json, os, re, subprocess, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'vocab'))
from py2hg import conv, syllables

def plain(h):
    out = ''
    for ch in h:
        c = ord(ch) - 0xAC00
        if 0 <= c < 11172:
            cho, rest = c // 588, c % 588
            cho = {1: 0, 4: 3, 8: 7, 13: 12}.get(cho, cho)
            ch = chr(0xAC00 + cho * 588 + rest)
        out += ch
    return out

def expect(py):
    py = re.sub(r"\s*\([^)]*\)", '', py)
    return [conv(s) for s in syllables(py)]

def check(where, py, parts):
    got = [plain(p[0]) for p in parts]
    exp = expect(py)
    if got != exp:
        return where + ' | ' + py + '\n    지금: ' + ' '.join(got) + '\n    규칙: ' + ' '.join(exp)

def p2rows():
    js = open(os.path.join(ROOT, 'part2', 'data.js')).read()
    data = json.loads(js[js.index('{'):js.rindex('}') + 1])
    rows = []
    def walk(x, w):
        if isinstance(x, list):
            if len(x) == 4 and isinstance(x[1], str) and isinstance(x[3], list) and all(isinstance(t, list) and len(t) == 2 for t in x[3]):
                rows.append((w, x[1], x[3])); return
            for y in x: walk(y, w)
        elif isinstance(x, dict):
            for k, y in x.items(): walk(y, w + '.' + k)
    walk(data, 'part2')
    return rows

if __name__ == '__main__':
    bad = [r for r in (check(w, py, parts) for w, py, parts in p2rows()) if r]
    seen = set(); out = []
    for b in bad:
        if b not in seen: seen.add(b); out.append(b)
    print('\n'.join(out)); print('part2 다른 곳', len(out))
