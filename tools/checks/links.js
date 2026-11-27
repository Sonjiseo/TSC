// 검사 3: 문장 속 병음 단어가 모두 뜻 말풍선(.tw)에 연결됐는지. 연결 안 된 단어를 보여 준다.
// 실행: node tools/checks/links.js   → 빈칸(___) 외에는 0개여야 한다. 빠진 단어는 그 페이지의 단어 사전(addLex/addLexList, W 등)에 추가한다.
const {chromium} = require('playwright');
const path = require('path');
const ROOT = 'file://' + path.resolve(__dirname, '..', '..') + '/';
const CHECK = `(() => {
  const rows = [];
  if (window.P2) [...P2.patterns, ...P2.ex.flat(), ...P2.app, ...P2.appendix.flat(), ...(window.P2X ? P2X.patterns.flatMap(p => p.ex) : [])].forEach(r => rows.push({py: r[1], ko: r[0]}));
  if (typeof QS !== 'undefined') { QS.forEach(q => rows.push(q.q)); answers().forEach(a => a && rows.push(a)); QS.forEach(q => q.more.forEach(([hz, py, ko]) => rows.push({py, ko}))); }
  if (typeof ALL !== 'undefined') { ALL.forEach(x => [x.q, ...x.a, ...(x.alt || []).map(a => a.s)].forEach(s => rows.push(s))); Object.values(NEW).forEach(s => rows.push(s)); if (typeof NX !== 'undefined') Object.values(NX).forEach(s => rows.push(s)); }
  if (window.VOC) VOC.forEach(c => c.words.forEach(w => (w.ex || []).forEach(e => rows.push(e))));
  if (window.MW) [...MW.words.flatMap(w => w.ph), ...MW.sents].forEach(e => rows.push(e));
  if (window.GR) [...GR.book.flatMap(u => u.points), ...GR.extra, ...GR.up].forEach(p => p.ex.forEach(e => rows.push(e))), GR.memo.forEach(m => m.rows.forEach(e => rows.push(e)));
  const miss = {};
  rows.forEach(r => { const d = document.createElement('div'); d.innerHTML = TSC.sayHTML(r); const l = d.querySelector('.py'); if (!l) return;
    [...l.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').replace(/\\([^)]*\\)/g, '').split(/\\s+/).map(w => w.replace(/[,.?!…]/g, '')).filter(w => w && w !== '/' && w !== '___').forEach(w => { miss[w] = r.ko; }); });
  return Object.entries(miss).map(([w, k]) => w + '  (' + k + ')');
})()`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); let total = 0;
  for (const f of ['part1', 'part2', 'part3', 'vocab', 'grammar']) {
    await p.goto(ROOT + f + '/index.html'); await p.waitForTimeout(300);
    const m = await p.evaluate(CHECK); total += m.length;
    console.log('== ' + f + ': 연결 안 된 단어 ' + m.length + '개'); m.forEach(x => console.log(' - ' + x));
  }
  await b.close(); process.exit(total ? 1 : 0);
})();
