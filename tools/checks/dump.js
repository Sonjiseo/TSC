// 각 페이지의 단어 표(W 등)를 JSON으로 꺼낸다. hangul.py가 사용한다.
// 실행: node tools/checks/dump.js > /tmp/x.json
const {chromium} = require('playwright');
const path = require('path');
const ROOT = 'file://' + path.resolve(__dirname, '..', '..') + '/';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const out = {};
  for (const f of ['part1', 'part3']) {
    await p.goto(ROOT + f + '/index.html'); await p.waitForTimeout(300);
    out[f] = await p.evaluate(() => {
      const tabs = {W: typeof W !== 'undefined' ? W : {}, WX: typeof WX !== 'undefined' ? WX : {}, FAMILY: typeof FAMILY !== 'undefined' ? FAMILY : {},
        COMPANIES: typeof COMPANIES !== 'undefined' ? COMPANIES : {}, DEPTS: typeof DEPTS !== 'undefined' ? DEPTS : {}};
      const rows = [];
      Object.entries(tabs).forEach(([t, o]) => Object.entries(o).forEach(([k, w]) => { if (Array.isArray(w)) rows.push([t + '.' + k, w[0], w[1], w[2], w[3], w[4]]); }));
      return rows;
    });
  }
  console.log(JSON.stringify(out)); await b.close();
})();
