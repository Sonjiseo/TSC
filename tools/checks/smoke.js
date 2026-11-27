// 검사 2: 모든 페이지·탭을 휴대폰 폭(390px)으로 열어 오류, 가로 스크롤, 화면에 보이는 한자, 듣기·녹음 흔적을 찾는다.
// 실행: node tools/checks/smoke.js   → "문제 없음"이어야 한다. 스크린숏은 tools/checks/shots/ (git에 올리지 않음)
const {chromium} = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = 'file://' + path.resolve(__dirname, '..', '..') + '/';
const SHOTS = path.join(__dirname, 'shots'); fs.mkdirSync(SHOTS, {recursive: true});
const PAGES = [['index.html', []], ['part1/index.html', ['learn', 'me', 'words', 'exam']], ['part2/index.html', ['ex', 'vocab', 'pattern', 'appendix', 'quiz']],
  ['part3/index.html', ['learn', 'pattern', 'words', 'exam']], ['vocab/index.html', ['list', 'card']]];
(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const dark of [false, true]) {
    const ctx = await b.newContext({viewport: {width: 390, height: 844}, colorScheme: dark ? 'dark' : 'light'});
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    for (const [file, tabs] of PAGES) {
      await p.goto(ROOT + file); await p.waitForTimeout(300);
      for (const t of tabs.length ? tabs : [null]) {
        if (t) { await p.click('#tabs [data-id=' + t + ']'); await p.waitForTimeout(150); }
        const r = await p.evaluate(() => {
          const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const hz = [];
          while (w.nextNode()) { const n = w.currentNode; if (/[一-鿿]/.test(n.textContent) && n.parentElement.offsetParent !== null) hz.push(n.textContent.trim().slice(0, 20)); }
          return {sw: document.documentElement.scrollWidth, hz, av: document.querySelectorAll('[data-speak], audio').length + (document.body.innerText.match(/🔊|🎧|녹음/g) || []).length};
        });
        const tag = file + (t ? ' ' + t : '') + (dark ? ' (어두운)' : '');
        if (r.sw > 390) errs.push(tag + ': 가로 스크롤 ' + r.sw);
        if (r.hz.length) errs.push(tag + ': 화면에 한자 ' + r.hz.slice(0, 3).join(' | '));
        if (r.av) errs.push(tag + ': 듣기·녹음 흔적');
        if (!dark) await p.screenshot({path: path.join(SHOTS, tag.replace(/[\/ ]/g, '_') + '.png')});
      }
    }
    await ctx.close();
  }
  await b.close();
  console.log(errs.length ? errs.join('\n') : '문제 없음'); process.exit(errs.length ? 1 : 0);
})();
