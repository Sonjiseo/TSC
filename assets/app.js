/* TSC 학습 페이지 — 공통 기능 */
(function(){
const T = window.TSC = {};
const esc = T.esc = s => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
T.$ = (s, r=document) => r.querySelector(s);
T.$$ = (s, r=document) => [...r.querySelectorAll(s)];

/* ---------- 저장소 (실패해도 동작) ---------- */
T.load = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
T.save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* ---------- 설정 ---------- */
const settings = T.settings = Object.assign({theme:'auto', py:true, hg:true, hz:true, brk:true, cover:true}, T.load('tsc-settings', {}));
T.applySettings = () => {
  const r = document.documentElement;
  if (settings.theme === 'auto') r.removeAttribute('data-theme'); else r.dataset.theme = settings.theme;
  if (document.body) {
    document.body.classList.toggle('hide-py', !settings.py);
    document.body.classList.toggle('hide-hg', !settings.hg);
    document.body.classList.toggle('hide-hz', !settings.hz);
    document.body.classList.toggle('hide-brk', !settings.brk);
  }
};
T.setSetting = (k, v) => { settings[k] = v; T.save('tsc-settings', settings); T.applySettings(); document.dispatchEvent(new CustomEvent('tsc:settings')); };
T.applySettings();

/* ---------- 진도 ---------- */
const PROG = {};
T.progress = part => PROG[part] || (PROG[part] = (() => {
  const key = 'tsc-progress-' + part;
  const data = T.load(key, {});
  return {
    has: id => !!data[id],
    set(id, on){ if (on) data[id] = Date.now(); else delete data[id]; T.save(key, data); },
    count: ids => ids ? ids.filter(id => data[id]).length : Object.keys(data).length,
  };
})());
/* 외웠어요(✓) / 틀렸어요(✗) — 'p1' 진도에 ✓, 'p1-x'에 ✗ 저장 */
T.markState = (part, id) => T.progress(part).has(id) ? 'done' : T.progress(part + '-x').has(id) ? 'wrong' : '';
T.setMark = (part, id, v) => { T.progress(part).set(id, v === 'done'); T.progress(part + '-x').set(id, v === 'wrong'); };

/* ---------- 성조 ---------- */
const tonePaths = T.tonePaths = ['', 'M5 12H95', 'M5 88L95 12', 'M5 30L45 90L95 55', 'M5 12L95 88'];
/* hangul: "니 쟈오", parts: [["니",3],["쟈오",4]] → 성조선이 겹쳐진 HTML */
/* b·d·g·j·z·zh 소리: 1·4성은 된소리(ㅃㄸㄲㅉ), 2·3성·경성은 예사소리(ㅂㄷㄱㅈ) */
const LAX_TENSE = [[0, 1], [3, 4], [7, 8], [12, 13]];
T.tenseByTone = (sound, tone) => {
  const c = sound.charCodeAt(0) - 0xAC00;
  if (c < 0 || c > 11171) return sound;
  const cho = Math.floor(c / 588), rest = c % 588;
  const pair = LAX_TENSE.find(p => p.includes(cho));
  if (!pair) return sound;
  const want = (tone === 1 || tone === 4) ? pair[1] : pair[0];
  return String.fromCharCode(0xAC00 + want * 588 + rest) + sound.slice(1);
};
T.toneHTML = (hangul, parts) => {
  let off = 0;
  return parts.map(([sound0, tone]) => {
    const start = hangul.indexOf(sound0, off);
    if (start < 0) return '';
    const gap = hangul.slice(off, start);
    off = start + sound0.length;
    const sound = T.tenseByTone(sound0, tone);
    const line = tone ? '<svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="' + tonePaths[tone] + '"/></svg>' : '';
    return esc(gap) + '<span class="tone" data-t="' + tone + '">' + esc(sound) + line + '</span>';
  }).join('') + esc(hangul.slice(off));
};
/* 3성 연속 → 앞의 것을 2성으로 (실제 읽는 성조) */
T.sandhi = tones => {
  const out = tones.slice();
  for (let i = 0; i < out.length; i++) {
    if (out[i] !== 3) continue;
    let j = i; while (j + 1 < out.length && tones[j + 1] === 3) j++;
    for (let k = i; k < j; k++) out[k] = 2;
    i = j;
  }
  return out;
};

/* ---------- 병음 ---------- */
const MARKS = {a:'āáǎà', e:'ēéěè', i:'īíǐì', o:'ōóǒò', u:'ūúǔù', ü:'ǖǘǚǜ'};
const BASE = {}; for (const [b, m] of Object.entries(MARKS)) [...m].forEach((c, i) => BASE[c] = [b, i + 1]);
const plain = c => BASE[c] ? BASE[c][0] : c;
const toneOf = c => BASE[c] ? BASE[c][1] : 0;
const mark = (b, t) => t ? MARKS[b][t - 1] : b;
/* 축약형 풀어쓰기: iu→iou, ui→uei, un→uen (j q x y 뒤 un=ün 제외) */
T.expandSyllable = syl => {
  const chars = [...syl]; const low = chars.map(c => plain(c.toLowerCase())).join('');
  let t = 0; chars.forEach(c => { t = t || toneOf(c.toLowerCase()); });
  let m;
  if ((m = low.match(/^([bpmfdtnljqxgkhzcsrwy]h?)?iu$/))) return chars.slice(0, low.length - 2).join('') + 'i' + mark('o', t) + 'u';
  if ((m = low.match(/^([bpmfdtnlgkhzcsr]h?)?ui$/))) return chars.slice(0, low.length - 2).join('') + 'u' + mark('e', t) + 'i';
  if ((m = low.match(/^([bpmfdtnlgkhzcsr]h?)un$/)) && !/^[jqxy]/.test(low)) return chars.slice(0, low.length - 2).join('') + 'u' + mark('e', t) + 'n';
  return syl;
};
const SYL = /(?:[bpmfdtnlgkhjqxrzcsyw]|zh|ch|sh)?[aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜv]+(?:ng|n|r)?(?![aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])/gi;
/* 단어 단위로 처리: "liùshí" → "liùshí (liòushí)" */
T.expandWord = w => {
  let changed = false;
  const out = w.replace(SYL, s => { const e = T.expandSyllable(s); if (e !== s) changed = true; return e; });
  return changed ? out : null;
};
T.pinyinWithExpanded = text => text.replace(/[A-Za-zÀ-ɏǖǘǚǜüÜ']+/g, w => {
  const e = T.expandWord(w); return e ? w + ' (' + e + ')' : w;
});
/* 숫자 성조 → 기호: "sun1 zhi4" → "sūn zhì" */
T.numToMark = text => text.replace(/([a-züv]+)([0-5])/gi, (_, s, d) => {
  s = s.replace(/v/g, 'ü'); const t = +d; if (!t || t === 5) return s;
  const low = s.toLowerCase();
  let idx = low.search(/[ae]/); if (idx < 0) idx = low.indexOf('ou');
  if (idx < 0) { const vs = [...low].map((c, i) => 'aeiouü'.includes(c) ? i : -1).filter(i => i >= 0); idx = vs[vs.length - 1]; }
  if (idx == null || idx < 0) return s;
  const ch = s[idx], b = ch.toLowerCase();
  const r = mark(b, t);
  return s.slice(0, idx) + (ch === b ? r : r.toUpperCase()) + s.slice(idx + 1);
});
/* 병음 음절별 성조 목록 */
T.tonesOf = text => (text.match(SYL) || []).map(s => { let t = 0; for (const c of s.toLowerCase()) t = t || toneOf(c); return t; });

/* ---------- 단어 목록으로 문장 만들기 ----------
   단어: [한자, 병음, 한글(음절은 | 또는 공백으로 구분), 성조들, 뜻]
   문장부호 '，。？！、' 와 끊어 읽기 '/' 를 사이에 넣는다. 3성 연속은 자동 변조. */
const PUNCT = {'，':',','。':'.','？':'?','、':',','！':'!'};
T.sentence = (items, ko) => {
  const hz = [], hzHTML = [], py = [], hgW = [], toneW = [];
  items.forEach(it => {
    if (it === '/') { hzHTML.push(' <span class="brk" aria-hidden="true">/</span> '); py.push('/'); hgW.push('/'); toneW.push(null); return; }
    if (typeof it === 'string') { hz.push(it); hzHTML.push(esc(it)); if (py.length) py[py.length-1] += PUNCT[it] || it; hgW.push(null); toneW.push(null); return; }
    const [h, p, g, t] = it;
    hz.push(h); hzHTML.push('<ruby>' + esc(h) + '<rt>' + esc(p) + '</rt></ruby>');
    py.push(p); hgW.push(g); toneW.push(t);
  });
  let seg = []; const out = [];
  const flush = () => { const s = T.sandhi(seg.flatMap(i => toneW[i])); let k = 0; seg.forEach(i => { out[i] = toneW[i].map(() => s[k++]); }); seg = []; };
  toneW.forEach((t, i) => { if (!t) { flush(); out[i] = null; } else seg.push(i); });
  flush();
  const hgParts = [], tones = [];
  hgW.forEach((g, i) => {
    if (g === null) return;
    if (g === '/') { hgParts.push('/'); return; }
    g.split(/[| ]+/).filter(Boolean).forEach((c, k) => tones.push([c, out[i] ? out[i][k] || 0 : 0]));
    hgParts.push(g.replaceAll('|', ''));
  });
  /* 문장부호 뒤 한글 줄에 쉼표 표시 */
  let hgText = ''; let pi = 0;
  items.forEach(it => {
    if (it === '/') { hgText += ' /'; pi++; return; }
    if (typeof it === 'string') { if (/[，。？！、]/.test(it)) hgText += PUNCT[it]; return; }
    hgText += (hgText ? ' ' : '') + hgParts[pi++];
  });
  const pyText = py.join(' ').replace(/(^|[.?!] )(\S)/g, (m, a, b) => a + b.toUpperCase());
  /* 병음 줄의 단어마다 뜻 정보 (눌러서 뜻 보기) */
  const wl = []; let cap = true;
  items.forEach((it, i) => {
    if (it === '/') { wl.push({t: '/'}); return; }
    if (typeof it === 'string') { if (wl.length) { wl[wl.length - 1].t += PUNCT[it] || it; if (/[。？！]/.test(it)) cap = true; } return; }
    const [h, p, g, t, k] = it;
    const chunks = (g || '').split(/[| ]+/).filter(Boolean);
    const info = {py: p, hg: (g || '').replaceAll('|', ''), parts: chunks.map((c, j) => [c, out[i] ? out[i][j] || 0 : 0]), ko: /[\u4e00-\u9fff]/.test(k || '') ? '' : (k || '')};
    wl.push({t: cap ? p.replace(/^./, c => c.toUpperCase()) : p, w: info.ko ? info : null}); cap = false;
  });
  return {hz: hz.join(''), hzHTML: hzHTML.join(''), py: pyText, hg: hgText.replace(/^ /, '').replace(/ \/ ?/g, ' / ').replace(/\s+/g, ' ').trim(), tones, ko, wl};
};
T.hgTones = w => { const t = w[3] ? T.sandhi(w[3]) : []; return w[2].split(/[| ]+/).filter(Boolean).map((c, i) => [c, t[i] || 0]); };
/* 단어 정보 {py, hg, parts:[[소리,성조]], ko} */
T.wordInfo = w => ({py: w[1], hg: w[2].replaceAll('|', ''), parts: T.hgTones(w), ko: w[4]});
T.wordChip = (info, extra = '') => '<div class="word" role="button" tabindex="0" data-w="' + esc(JSON.stringify(info)) + '"><div class="w-py">' + esc(T.pinyinWithExpanded(info.py)) + '</div><div class="w-ko"><span class="hgw">' + T.toneHTML(info.hg, info.parts) + '</span> · ' + esc(info.ko) + '</div>' + extra + '</div>';
T.wordHTML = (w, extra) => T.wordChip(T.wordInfo(w), extra);

/* ---------- 문장 렌더 ---------- */
/* row: {hz, py, hg, tones:[[소리,성조],...], ko} */
/* 끊어 읽기: 문장 속 " / " 를 표시용 span으로 */
T.brk = html => html.replaceAll(' / ', ' <span class="brk" aria-hidden="true">/ </span>');
const twSpan = (text, info) => '<span class="tw" role="button" tabindex="0" data-tw="' + esc(JSON.stringify(info)) + '">' + text + '</span>';
/* 단어 사전 (2부분처럼 문자열 문장용): 정규화한 병음 → [정보, ...] */
T.LEX = {};
const lexKey = s => (s || '').replace(/\s*\([^)]*\)/g, '').replace(/[’]/g, "'").replace(/[,.?!:;]/g, '').trim().toLowerCase();
T.addLex = info => { if (!info || !info.py || !info.ko) return; for (const alt of info.py.split(/\s+\/\s+/)) { const k = lexKey(alt); if (!k) continue; const list = T.LEX[k] || (T.LEX[k] = []); if (!list.some(x => x.ko === info.ko)) list.push(info); } };
/* [병음, 한글(음절은 | 로), 뜻] 목록을 사전에 넣기 */
T.addLexList = list => list.forEach(([py, hg, ko]) => { const t = T.sandhi(T.tonesOf(py)), ch = hg.split(/[| ]+/).filter(Boolean); T.addLex({py, hg: hg.replaceAll('|', ''), parts: ch.map((c, i) => [c, t[i] || 0]), ko}); });
const lexInfo = list => list.length === 1 ? list[0] : Object.assign({}, list[0], {ko: list.map(x => x.ko).join(' / ')});
/* 문자열 병음 문장에서 사전에 있는 단어(1~3 단어 묶음)를 찾아 감싸기 */
const linkPinyin = (py, expand) => {
  const toks = []; py.split(' ').forEach(w => { if (w.startsWith('(') && toks.length) toks[toks.length - 1] += ' ' + w; else toks.push(w); });
  const out = [];
  for (let i = 0; i < toks.length;) {
    if (toks[i] === '/') { out.push('<span class="brk" aria-hidden="true">/ </span>'); i++; continue; }
    let hit = 0;
    for (let n = Math.min(3, toks.length - i); n >= 1 && !hit; n--) {
      const grp = toks.slice(i, i + n); if (grp.includes('/')) continue;
      const list = T.LEX[lexKey(grp.join(' '))];
      if (list) {
        const raw = grp.join(' '), m = raw.match(/^(.*?)([,.?!]*)$/);
        out.push(twSpan(esc(expand ? T.pinyinWithExpanded(m[1]) : m[1]), lexInfo(list)) + esc(m[2])); i += n; hit = n;
      }
    }
    if (!hit) { out.push(esc(expand ? T.pinyinWithExpanded(toks[i]) : toks[i])); i++; }
  }
  return out.join(' ').replace(/ <span class="brk"/g, ' <span class="brk"');
};
T.sayHTML = (row, opt = {}) => {
  const lines = [];
  /* 한자는 화면에 보이지 않음. 병음 단어를 누르면 뜻이 나온다 */
  if (row.wl) {
    const parts = row.wl.map(tok => tok.t === '/' ? '<span class="brk" aria-hidden="true">/ </span>' : (tok.w ? (() => { const m = tok.t.match(/^(.*?)([,.?!，。？！、]*)$/); return twSpan(esc(T.pinyinWithExpanded(m[1])), tok.w) + esc(m[2]); })() : esc(T.pinyinWithExpanded(tok.t))));
    lines.push('<div class="line py" lang="zh-Latn-pinyin">' + parts.join(' ') + '</div>');
  } else if (row.py) lines.push('<div class="line py" lang="zh-Latn-pinyin">' + linkPinyin(row.py, !opt.noExpand) + '</div>');
  if (row.hg) lines.push('<div class="line hg">' + T.brk(row.tones ? T.toneHTML(row.hg, row.tones) : esc(row.hg)) + '</div>');
  return '<div class="say">' + lines.join('') + '</div>';
};
T.revealHTML = (inner, open) => '<div class="reveal' + (open || !settings.cover ? ' open' : '') + '">' + inner + '<button class="cover" type="button">👀 눌러서 보기</button></div>';
document.addEventListener('click', e => {
  const c = e.target.closest('.reveal .cover');
  if (c) c.parentElement.classList.add('open');
});

/* 듣기(음성) 기능은 사용하지 않음 — 사용자 요청 */

/* ---------- 타이머 ---------- */
/* el 안에 원형 카운트다운. 반환: Promise (끝나면 true, 취소되면 false) */
T.countdown = (el, seconds, label, kind = '') => {
  const R = 64, C = 2 * Math.PI * R;
  el.innerHTML = '<div class="timer ' + kind + '"><svg viewBox="0 0 150 150"><circle class="bg" cx="75" cy="75" r="' + R + '"/><circle class="fg" cx="75" cy="75" r="' + R + '" stroke-dasharray="' + C + '" stroke-dashoffset="0"/></svg><div class="t"><span>' + esc(label) + '</span><b>' + seconds + '</b><span>초</span></div></div>';
  const fg = el.querySelector('.fg'), num = el.querySelector('b');
  const t0 = performance.now(), ms = seconds * 1000;
  let stop = false;
  const p = new Promise(res => {
    const tick = now => {
      if (stop) return res(false);
      const left = Math.max(0, ms - (now - t0));
      fg.style.strokeDashoffset = String(C * (1 - left / ms));
      num.textContent = Math.ceil(left / 1000);
      if (left <= 0) return res(true);
      requestAnimationFrame(tick);
    };
    if (seconds <= 0) res(true); else requestAnimationFrame(tick);
  });
  p.cancel = () => { stop = true; };
  return p;
};

/* ---------- 토스트 ---------- */
T.toast = msg => {
  let t = T.$('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(T._tt); T._tt = setTimeout(() => t.classList.remove('show'), 1800);
};

/* ---------- 아이콘 ---------- */
const I = T.icon = {
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>',
};
T.speakBtn = () => '';
T.markBtns = (part, id) => { const st = T.markState(part, id);
  return '<span class="marks" data-part="' + esc(part) + '" data-mid="' + esc(id) + '">' +
    '<button class="mark ok" type="button" data-mark="done" aria-pressed="' + (st === 'done') + '" aria-label="외웠어요" title="외웠어요">' + I.check + '</button>' +
    '<button class="mark no" type="button" data-mark="wrong" aria-pressed="' + (st === 'wrong') + '" aria-label="틀렸어요" title="틀렸어요">' + I.x + '</button></span>'; };
/* 넘기는 카드·퀴즈용 큰 아이콘 버튼 */
T.judgeBtns = () => '<div class="row" style="justify-content:center;gap:14px"><button class="judge no" type="button" id="no" aria-label="틀렸어요" title="틀렸어요">' + I.x + '</button><button class="judge ok" type="button" id="yes" aria-label="외웠어요" title="외웠어요">' + I.check + '</button></div>';
T.onMark = null;
document.addEventListener('click', e => {
  const b = e.target.closest('[data-mark]'); if (!b) return;
  e.stopPropagation();
  const wrap = b.closest('.marks'), part = wrap.dataset.part, id = wrap.dataset.mid;
  const v = T.markState(part, id) === b.dataset.mark ? '' : b.dataset.mark;
  T.setMark(part, id, v);
  const host = wrap.closest('.card, .word-wrap');
  if (host) { host.classList.toggle('done', v === 'done'); host.classList.toggle('wrong', v === 'wrong'); }
  wrap.outerHTML = T.markBtns(part, id);
  T.onMark && T.onMark(part, id, v);
}, true);

/* ---------- 상단 바 + 설정 시트 ---------- */
T.topbar = ({title, sub, home = '../'}) => {
  const bar = document.createElement('header');
  bar.className = 'topbar';
  bar.innerHTML = '<div class="wrap">' + (home ? '<a class="icon-btn" href="' + home + '" aria-label="처음 화면">' + I.home + '</a>' : '') +
    '<div class="title">' + (sub ? '<small>' + esc(sub) + '</small>' : '') + esc(title) + '</div>' +
    '<button class="icon-btn" type="button" id="open-settings" aria-label="보기 설정">' + I.gear + '</button></div>';
  document.body.prepend(bar);
  const sheet = document.createElement('div');
  sheet.className = 'sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', '보기 설정');
  const tg = (k, label, hint) => '<label class="toggle"><span>' + label + (hint ? '<br><span class="small muted">' + hint + '</span>' : '') + '</span><input type="checkbox" data-set="' + k + '"' + (settings[k] ? ' checked' : '') + '></label>';
  sheet.innerHTML = '<div class="panel"><div class="row"><h3 style="margin:0">보기 설정</h3><span class="spacer"></span><button class="btn ghost" type="button" data-close>닫기</button></div>' +
    tg('cover', '답을 가리고 시작', '눌러야 중국어가 보여요. 스스로 말해 본 뒤 확인하세요.') +
    tg('py', '병음 보기') + tg('brk', '끊어 읽기 표시', '/ 표시에서 잠깐 쉬어 읽어요.') + tg('hg', '한글 발음 보기', '한글 위의 선이 성조예요. ─1성 ／2성 ⌄3성 ＼4성') +
    '<div class="toggle"><span>화면 테마</span><span class="seg" data-theme-seg>' + [['auto','자동'],['light','밝게'],['dark','어둡게']].map(([v, l]) => '<button type="button" data-v="' + v + '" aria-pressed="' + (settings.theme === v) + '">' + l + '</button>').join('') + '</span></div>' +
    '</div>';
  document.body.append(sheet);
  const open = () => sheet.classList.add('open'), close = () => sheet.classList.remove('open');
  T.$('#open-settings').onclick = open;
  sheet.addEventListener('click', e => {
    if (e.target === sheet || e.target.closest('[data-close]')) close();
    const tb = e.target.closest('[data-theme-seg] button');
    if (tb) { T.setSetting('theme', tb.dataset.v); T.$$('[data-theme-seg] button', sheet).forEach(b => b.setAttribute('aria-pressed', b === tb)); }
  });
  sheet.addEventListener('change', e => { const k = e.target.dataset.set; if (k) T.setSetting(k, e.target.checked); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  T.applySettings();
};

/* ---------- 탭 ---------- */
T.tabs = (el, items, current, onPick) => {
  el.setAttribute('role', 'tablist');
  el.innerHTML = items.map(([id, label, icon], i) => '<button type="button" role="tab" data-id="' + id + '" aria-selected="' + (id === current) + '"><span class="ti" aria-hidden="true">' + (icon || '') + '</span>' + esc(label) + '</button>').join('');
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; T.$$('button', el).forEach(x => x.setAttribute('aria-selected', x === b)); onPick(b.dataset.id); };
};
})();
