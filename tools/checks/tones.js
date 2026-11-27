// 검사 1: 병음 성조(3성 연속 변조 반영)와 한글 위 성조선이 모두 일치하는지 (+ 음절 수)
// 실행: node tools/checks/tones.js   → 모든 파트 "문제 0개"여야 한다.
const {chromium} = require('playwright');
const path = require('path');
const ROOT = 'file://' + path.resolve(__dirname, '..', '..') + '/';
const CHECK = `(() => {
  const T = TSC;
  const strip = py => py.replace(/\\s*\\([^)]*\\)/g, '').replace(/TSC /g, '');
  const expected = py => { let out = []; strip(py).split(/[,.?!，。？！…]|\\s\\/\\s/).forEach(seg => { out = out.concat(T.sandhi(T.tonesOf(seg))); }); return out; };
  const res = []; let n = 0;
  const check = (where, py, parts) => {
    n++; parts = parts.filter(p => p[0] !== 'TSC');
    const exp = expected(py), got = parts.map(p => p[1]), raw = T.tonesOf(strip(py));
    if (exp.length !== got.length) return res.push(where + ' | ' + py + ' → 음절 수 다름 ' + exp.length + '/' + got.length);
    const bad = []; exp.forEach((e, i) => { if (e !== got[i]) bad.push(parts[i][0] + ': 병음 ' + raw[i] + (e !== raw[i] ? '→변조 ' + e : '') + ' / 표시 ' + got[i]); });
    if (bad.length) res.push(where + ' | ' + py + ' → ' + bad.join(', '));
  };
  if (window.P2) { const seen = new Set(); const walk = (x, w) => { if (Array.isArray(x)) { if (x.length === 4 && typeof x[1] === 'string' && Array.isArray(x[3]) && x[3].every(t => Array.isArray(t) && t.length === 2)) { if (!seen.has(x[1])) { seen.add(x[1]); check(w, x[1], x[3]); } return; } x.forEach(y => walk(y, w)); } else if (x && typeof x === 'object') Object.entries(x).forEach(([k, y]) => walk(y, w + '.' + k)); }; walk(P2, 'part2'); if (window.P2X) walk(P2X, 'part2 추가'); }
  if (typeof QS !== 'undefined') { QS.forEach(q => check('part1 질문', q.q.py, q.q.tones)); answers().forEach(a => a && check('part1 답변', a.py, a.tones)); [...Object.values(W), ...Object.values(FAMILY), ...Object.values(COMPANIES), ...Object.values(DEPTS).filter(Boolean)].forEach(w => check('part1 단어', w[1], T.hgTones(w))); }
  if (typeof ALL !== 'undefined') { ALL.forEach(x => [x.q, ...x.a, ...(x.alt || []).map(a => a.s)].forEach(s => check('part3 문장', s.py, s.tones))); Object.values(NEW).forEach(s => check('part3 추가예문', s.py, s.tones)); if (typeof NX !== 'undefined') Object.values(NX).forEach(s => check('part3 추가패턴', s.py, s.tones)); Object.values(WX).forEach(w => check('part3 추가단어', w[1], T.hgTones(w))); Object.values(W).forEach(w => check('part3 단어', w[1], T.hgTones(w))); }
  if (window.VOC) VOC.forEach(c => c.words.forEach(w => { check('단어장 ' + c.name, w.py.replace(/…/g, ''), w.parts); (w.ex || []).forEach(e => check('단어장 예문', e.py.replace(/…/g, ''), e.tones)); }));
  if (window.MW) { MW.words.forEach(w => { check('양사', w.py, w.parts); w.ph.forEach(e => check('양사 표현', e.py, e.tones)); }); MW.sents.forEach(e => check('양사 문장', e.py, e.tones)); }
  if (window.GR) [...GR.book.flatMap(u => u.points), ...GR.extra, ...GR.up].forEach(p => p.ex.forEach(e => check('문법 ' + p.t, e.py, e.tones))), GR.memo.forEach(m => m.rows.forEach(e => check('통암기', e.py, e.tones)));
  return {n, res};
})()`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  let total = 0;
  for (const f of ['part1', 'part2', 'part3', 'vocab', 'grammar']) {
    await p.goto(ROOT + f + '/index.html'); await p.waitForTimeout(300);
    const {n, res} = await p.evaluate(CHECK); total += res.length;
    console.log('== ' + f + ': 검사 ' + n + '개, 문제 ' + res.length + '개'); res.forEach(r => console.log(' - ' + r));
  }
  await b.close(); process.exit(total ? 1 : 0);
})();
