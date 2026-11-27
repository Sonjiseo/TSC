/* TSC 학습 페이지 — 단어 상세(예문·유의어·반의어·관련 단어)
   REL: 병음(괄호 풀어쓰기 제외) → [{m: 뜻에 들어가는 말(여러 뜻일 때 구분), syn, ant, rel, note}]
   각 단어: [병음, 한글(음절은 | 로 구분), 뜻]  — 성조선은 병음에서 자동으로 그림
   3급 수준에서 확실한 짝만 넣는다. 새 단어를 넣을 때도 정확성 확인 규칙을 따른다. */
(function(){
const T = window.TSC, esc = T.esc;
const REL = {
  'kuài': [{m:'빠르', ant:[['màn','만','느리다']]}, {m:'위안', syn:[['yuán','위안','위안 (공식 단위)']], rel:[['máo','마오','0.1위안'],['fēn','펀','0.01위안']]}],
  'màn': [{ant:[['kuài','콰이','빠르다']]}],
  'zǎo': [{ant:[['wǎn','완','늦다']]}],
  'wǎn': [{m:'늦', ant:[['zǎo','짜오','이르다']]}],
  'zǎoshang': [{ant:[['wǎnshang','완|샹','저녁, 밤']]}],
  'wǎnshang': [{ant:[['zǎoshang','짜오|샹','아침']]}],
  'shàngwǔ': [{ant:[['xiàwǔ','샤|우','오후']], rel:[['zhōngwǔ','중|우','한낮, 정오 무렵']]}],
  'xiàwǔ': [{ant:[['shàngwǔ','샹|우','오전']], rel:[['zhōngwǔ','중|우','한낮, 정오 무렵']]}],
  'zhōngwǔ': [{rel:[['shàngwǔ','샹|우','오전'],['xiàwǔ','샤|우','오후']]}],
  'kāimén': [{ant:[['guānmén','관|먼','문을 닫다']]}],
  'guānmén': [{ant:[['kāimén','카이|먼','문을 열다']]}],
  'kāishǐ': [{ant:[['jiéshù','지에|슈','끝나다']]}],
  'yǐqián': [{ant:[['yǐhòu','이|허우','이후']], syn:[['zhīqián','즈|쳰','~하기 전']]}],
  'yǐhòu': [{ant:[['yǐqián','이|쳰','이전']], syn:[['zhīhòu','즈|허우','~한 후']]}],
  'zhīqián': [{ant:[['zhīhòu','즈|허우','~한 후']], syn:[['yǐqián','이|쳰','이전']]}],
  'zuótiān': [{ant:[['míngtiān','밍|톈','내일']], rel:[['jīntiān','진|톈','오늘']]}],
  'jīntiān': [{rel:[['zuótiān','쭤|톈','어제'],['míngtiān','밍|톈','내일']]}],
  'míngtiān': [{ant:[['zuótiān','쭤|톈','어제']], rel:[['jīntiān','진|톈','오늘'],['hòutiān','허우|톈','모레']]}],
  'qiántiān': [{ant:[['hòutiān','허우|톈','모레']]}],
  'hòutiān': [{ant:[['qiántiān','쳰|톈','그저께']]}],
  'qùnián': [{ant:[['míngnián','밍|녠','내년']], rel:[['jīnnián','진|녠','올해']]}],
  'jīnnián': [{rel:[['qùnián','취|녠','작년'],['míngnián','밍|녠','내년']]}],
  'míngnián': [{ant:[['qùnián','취|녠','작년']], rel:[['jīnnián','진|녠','올해']]}],
  'shàng ge xīngqī': [{ant:[['xià ge xīngqī','샤 거 싱|치','다음 주']], rel:[['zhè ge xīngqī','저 거 싱|치','이번 주']]}],
  'xià ge xīngqī': [{ant:[['shàng ge xīngqī','샹 거 싱|치','지난주']], rel:[['zhè ge xīngqī','저 거 싱|치','이번 주']]}],
  'shàng ge yuè': [{ant:[['xià ge yuè','샤 거 위에','다음 달']], rel:[['zhè ge yuè','저 거 위에','이번 달']]}],
  'xià ge yuè': [{ant:[['shàng ge yuè','샹 거 위에','지난달']], rel:[['zhè ge yuè','저 거 위에','이번 달']]}],
  'chūntiān': [{ant:[['qiūtiān','치오우|톈','가을']], rel:[['xiàtiān','샤|톈','여름'],['dōngtiān','둥|톈','겨울']]}],
  'qiūtiān': [{ant:[['chūntiān','추언|톈','봄']], rel:[['xiàtiān','샤|톈','여름'],['dōngtiān','둥|톈','겨울']]}],
  'xiàtiān': [{ant:[['dōngtiān','둥|톈','겨울']], rel:[['chūntiān','추언|톈','봄'],['qiūtiān','치오우|톈','가을']]}],
  'dōngtiān': [{ant:[['xiàtiān','샤|톈','여름']], rel:[['chūntiān','추언|톈','봄'],['qiūtiān','치오우|톈','가을']]}],
  'nuǎnhuo': [{ant:[['liángkuai','량|콰이','시원하다']], rel:[['rè','러','덥다'],['lěng','렁','춥다']]}],
  'liángkuai': [{ant:[['nuǎnhuo','놘|훠','따뜻하다']], rel:[['rè','러','덥다'],['lěng','렁','춥다']]}],
  'yánrè': [{syn:[['rè','러','덥다']], ant:[['hánlěng','한|렁','매우 춥다']]}],
  'hánlěng': [{syn:[['lěng','렁','춥다']], ant:[['yánrè','옌|러','무덥다']]}],
  'qíngtiān': [{ant:[['yīntiān','인|톈','흐린 날']]}],
  'yīntiān': [{ant:[['qíngtiān','칭|톈','맑은 날']]}],
  'xià yǔ': [{rel:[['xià xuě','샤 쉬에','눈이 오다'],['guā fēng','과 펑','바람이 불다']]}],
  'xiàyǔ': [{rel:[['xià xuě','샤 쉬에','눈이 오다'],['guā fēng','과 펑','바람이 불다']]}],
  'tiānqì': [{rel:[['tiānqì yùbào','톈|치 위|바오','일기예보'],['qìwēn','치|원','기온']]}],
  'gāo': [{ant:[['dī','디','낮다'],['ǎi','아이','(키가) 작다']]}],
  'dī': [{ant:[['gāo','가오','높다']]}],
  'cháng': [{ant:[['duǎn','돤','짧다']]}],
  'dōng': [{ant:[['xī','시','서쪽']]}],
  'xī': [{ant:[['dōng','둥','동쪽']]}],
  'nán': [{m:'남쪽', ant:[['běi','베이','북쪽']]}],
  'běi': [{ant:[['nán','난','남쪽']]}],
  'běibian': [{ant:[['nánbian','난|볜','남쪽']]}],
  'nánbian': [{ant:[['běibian','베이|볜','북쪽']]}],
  'qián': [{m:'앞', ant:[['hòu','허우','뒤']], syn:[['qiánbian','쳰|볜','앞쪽']]}],
  'hòu': [{m:'뒤', ant:[['qián','쳰','앞']], syn:[['hòubian','허우|볜','뒤쪽']]}],
  'qiánbian': [{ant:[['hòubian','허우|볜','뒤쪽']]}],
  'zuǒ': [{ant:[['yòu','요우','오른쪽']], syn:[['zuǒbian','쭤|볜','왼쪽']]}],
  'yòu': [{ant:[['zuǒ','쭤','왼쪽']], syn:[['yòubian','요우|볜','오른쪽']]}],
  'zuǒbian': [{ant:[['yòubian','요우|볜','오른쪽']]}],
  'shàng': [{m:'위', ant:[['xià','샤','아래']], syn:[['shàngbian','샹|볜','위쪽']]}],
  'shang': [{m:'위', ant:[['xià','샤','아래']]}],
  'xià': [{m:'아래', ant:[['shàng','샹','위']], syn:[['xiàbian','샤|볜','아래쪽']]}],
  'lǐ': [{m:'안', ant:[['wài','와이','밖']], syn:[['lǐbian','리|볜','안쪽']]}],
  'wài': [{ant:[['lǐ','리','안']], syn:[['wàibian','와이|볜','바깥쪽']]}],
  'lǐbian': [{ant:[['wàibian','와이|볜','바깥쪽']]}],
  'wàibian': [{ant:[['lǐbian','리|볜','안쪽']]}],
  'pángbiān': [{rel:[['duìmiàn','두에이|몐','맞은편'],['zhōngjiān','중|젠','가운데']]}],
  'dà': [{ant:[['xiǎo','샤오','작다']]}],
  'xiǎo': [{ant:[['dà','다','크다']]}],
  'duō': [{m:'많', ant:[['shǎo','샤오','적다']]}],
  'zhòng': [{ant:[['qīng','칭','가볍다']]}],
  'yuǎn': [{ant:[['jìn','진','가깝다']]}],
  'kū': [{ant:[['xiào','샤오','웃다']]}],
  'xiào': [{m:'웃', ant:[['kū','쿠','울다']]}],
  'mǎi': [{ant:[['mài','마이','팔다']]}],
  'mài': [{ant:[['mǎi','마이','사다']]}],
  'guì': [{ant:[['piányi','피엔|이','싸다']]}],
  'piányi': [{ant:[['guì','구에이','비싸다']]}],
  'qù': [{ant:[['lái','라이','오다']]}],
  'nánde': [{syn:[['nánrén','난|런','남자']], ant:[['nǚde','뉘|더','여자']]}],
  'nǚde': [{syn:[['nǚrén','뉘|런','여자']], ant:[['nánde','난|더','남자']]}],
  'nánrén': [{syn:[['nánde','난|더','남자']], ant:[['nǚrén','뉘|런','여자']]}],
  'nǚrén': [{syn:[['nǚde','뉘|더','여자']], ant:[['nánrén','난|런','남자']]}],
  'nǚháizi': [{ant:[['nánháizi','난|하이|즈','남자아이']]}],
  'nánháizi': [{ant:[['nǚháizi','뉘|하이|즈','여자아이']]}],
  'lǎoshī': [{rel:[['xuésheng','쉬에|성','학생']]}],
  'xuésheng': [{rel:[['lǎoshī','라오|스','선생님']]}],
  'xiàchē': [{ant:[['shàngchē','샹|처','차에 타다']]}],
  'gàn': [{syn:[['zuò','쭤','하다']]}],
  'zhèngzài': [{syn:[['zài','짜이','~하는 중이다']]}],
  'fàndiàn': [{syn:[['cāntīng','찬|팅','식당']], note:'fàndiàn은 ‘호텔’이라는 뜻으로도 써요.'}],
  'cāntīng': [{syn:[['fàndiàn','판|뎬','식당']]}],
  'rì': [{syn:[['hào','하오','일 (날짜, 입말)']]}],
  'hào': [{m:'일', syn:[['rì','르','일 (날짜, 글말)']]}],
  'xīngqī': [{syn:[['zhōu','저우','주']]}],
  'xīngqītiān': [{syn:[['xīngqīrì','싱|치|르','일요일']]}],
  'yuán': [{syn:[['kuài','콰이','위안 (입말)']]}],
  'máo': [{syn:[['jiǎo','자오','0.1위안 (공식 단위)']]}],
  'jiǎo': [{syn:[['máo','마오','0.1위안 (입말)']]}],
  'xiǎoshí': [{syn:[['zhōngtóu','중|터우','시간 (입말)']]}],
  'gōnggòngqìchē': [{syn:[['gōngjiāochē','궁|자오|처','버스']]}],
  'gōnggòng qìchē': [{syn:[['gōngjiāochē','궁|자오|처','버스']]}],
  'bàoqiàn': [{syn:[['duìbuqǐ','두에이|부|치','미안해']]}],
  'duìbuqǐ': [{syn:[['bàoqiàn','바오|쳰','미안하다']]}],
  'fēicháng': [{syn:[['hěn','헌','매우']]}],
  'hěn': [{syn:[['fēicháng','페이|창','매우, 아주']]}],
  'hǎo de': [{syn:[['xíng','싱','좋아, 돼'],['kěyǐ','커|이','돼, 괜찮아']]}],
  'bāng': [{syn:[['bāngzhù','방|주','돕다']]}],
  'kànjiàn': [{syn:[['kàndào','칸|다오','보다 (눈에 띄다)']]}],
  'jiàn': [{m:'만나', syn:[['jiànmiàn','젠|몐','만나다']]}],
  'yǒu': [{ant:[['méiyǒu','메이|요우','없다']]}],
  'méiyǒu': [{ant:[['yǒu','요우','있다']]}],
  'néng': [{ant:[['bù néng','부 넝','~할 수 없다']]}],
  'bùnéng': [{ant:[['néng','넝','~할 수 있다']]}],
  'máng': [{ant:[['xián','셴','한가하다']]}],
  'àirén': [{rel:[['zhàngfu','장|푸','남편'],['qīzi','치|즈','아내']]}],
  'bàba': [{syn:[['fùqīn','푸|친','아버지']], rel:[['māma','마|마','엄마']]}],
  'māma': [{syn:[['mǔqīn','무|친','어머니']], rel:[['bàba','바|바','아빠']]}],
  'gēge': [{rel:[['jiějie','지에|지에','누나, 언니'],['dìdi','디|디','남동생'],['mèimei','메이|메이','여동생']]}],
  'jiějie': [{rel:[['gēge','거|거','형, 오빠'],['dìdi','디|디','남동생'],['mèimei','메이|메이','여동생']]}],
  'dìdi': [{rel:[['gēge','거|거','형, 오빠'],['jiějie','지에|지에','누나, 언니'],['mèimei','메이|메이','여동생']]}],
  'mèimei': [{rel:[['gēge','거|거','형, 오빠'],['jiějie','지에|지에','누나, 언니'],['dìdi','디|디','남동생']]}],
  'érzi': [{rel:[["nǚ'ér",'뉘|얼','딸']]}],
  "nǚ'ér": [{rel:[['érzi','얼|즈','아들']]}],
  'yéye': [{rel:[['nǎinai','나이|나이','할머니']]}],
  'nǎinai': [{rel:[['yéye','예|예','할아버지']]}],
  'gōngzuò': [{rel:[['gōngsī','궁|쓰','회사'],['shàngbān','샹|반','출근하다']]}],
  'xuéxiào': [{rel:[['shàngxué','샹|쉬에','학교에 다니다'],['xuésheng','쉬에|성','학생']]}],
  'shēngrì': [{rel:[['chūshēng','추|성','태어나다'],['lǐwù','리|우','선물']]}],
  'míngzi': [{rel:[['jiào','쟈오','(이름을) ~라고 부르다']]}],
  'zhīdào': [{note:'회화에서는 뒤 음절을 가볍게 zhīdao로도 읽어요.'}],
  'zhǔyi': [{note:'회화에서는 zhúyi로도 읽어요.'}],
};
T.REL = REL;
const norm = py => (py || '').replace(/\s*\([^)]*\)/g, '').replace(/[’]/g, "'").trim().toLowerCase();
T.relOf = info => {
  const keys = norm(info.py).split(/\s+\/\s+/);
  for (const k of keys) {
    const list = REL[k]; if (!list) continue;
    const hit = list.find(e => !e.m || (info.ko || '').includes(e.m));
    if (hit) return hit;
  }
  return null;
};
/* 문장에서 단어 찾기: 병음 단어 순서가 그대로 들어 있는 문장 */
const toks = py => norm(py).replace(/[,.?!，。？！]/g, ' ').replace(/\s\/\s/g, ' ').split(/\s+/).filter(Boolean);
T.findExamples = (py, list, max = 4) => {
  const outs = [];
  for (const alt of norm(py).split(/\s+\/\s+/)) {
    const w = toks(alt); if (!w.length) continue;
    for (const s of list) {
      if (outs.includes(s) || !s.py) continue;
      const t = toks(s.py);
      for (let i = 0; i + w.length <= t.length; i++) if (w.every((x, j) => t[i + j] === x)) { outs.push(s); break; }
      if (outs.length >= max) return outs;
    }
  }
  return outs;
};
T.exampleSource = () => [];
const relItem = ([py, hg, ko]) => {
  const tones = T.sandhi(T.tonesOf(py)), chunks = hg.split(/[| ]+/).filter(Boolean);
  const info = {py, hg: hg.replaceAll('|', ''), parts: chunks.map((c, i) => [c, tones[i] || 0]), ko};
  return T.wordChip(info);
};
let sheet = null;
T.openWord = info => {
  if (!sheet) {
    sheet = document.createElement('div'); sheet.className = 'sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', '단어 자세히');
    document.body.append(sheet);
    sheet.addEventListener('click', e => { if (e.target === sheet || e.target.closest('[data-close]')) sheet.classList.remove('open'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') sheet.classList.remove('open'); });
  }
  const r = T.relOf(info) || {};
  const ex = T.findExamples(info.py, T.exampleSource());
  const sec = (title, items) => items && items.length ? '<h3>' + title + '</h3><div class="words">' + items.map(relItem).join('') + '</div>' : '';
  sheet.innerHTML = '<div class="panel" style="max-height:85vh;overflow:auto"><div class="row"><span class="badge">단어</span><span class="spacer"></span><button class="btn ghost" type="button" data-close>닫기</button></div>' +
    '<div class="say" style="margin-top:8px"><div class="line py" style="font-size:26px">' + esc(T.pinyinWithExpanded(info.py)) + '</div><div class="line hg" style="font-size:19px">' + T.toneHTML(info.hg, info.parts) + '</div></div>' +
    '<p class="ko" style="margin:6px 0 0">' + esc(info.ko) + '</p>' +
    sec('유의어 (비슷한 말)', r.syn) + sec('반의어 (반대말)', r.ant) + sec('함께 알면 좋은 말', r.rel) +
    (r.note ? '<div class="tip"><b>TIP</b><span>' + esc(r.note) + '</span></div>' : '') +
    '<h3>예문</h3>' + (ex.length ? ex.map(s => '<div style="margin-top:8px"><p class="small" style="margin:0;font-weight:650">' + esc(s.ko || '') + '</p><div class="reveal open" style="margin-top:4px">' + T.sayHTML(s) + '</div></div>').join('') : '<p class="small muted">이 파트에는 아직 이 단어가 들어간 문장이 없어요.</p>') +
    '</div>';
  sheet.classList.add('open');
  sheet.querySelectorAll('.word[data-w]').forEach(el => el.removeAttribute('role'));
};
document.addEventListener('click', e => {
  if (e.target.closest('[data-mark]')) return;
  const el = e.target.closest('[data-w]');
  if (!el || (sheet && sheet.contains(el))) return;
  try { T.openWord(JSON.parse(el.dataset.w)); } catch {}
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-w], [data-tw]')) { e.preventDefault(); e.target.click(); }
  if (e.key === 'Escape') closeTip();
});
/* 문장 속 단어 → 뜻 말풍선 */
let tip = null, tipFor = null;
const closeTip = () => { if (tip) tip.remove(); tip = null; if (tipFor) tipFor.classList.remove('on'); tipFor = null; };
document.addEventListener('click', e => {
  const el = e.target.closest('[data-tw]');
  if (tip && tip.contains(e.target)) {
    if (e.target.closest('[data-more]')) { const info = JSON.parse(tip.dataset.info); closeTip(); T.openWord(info); }
    return;
  }
  if (!el) { closeTip(); return; }
  if (el.closest('.reveal:not(.open)')) return;
  if (tipFor === el) { closeTip(); return; }
  closeTip();
  let info; try { info = JSON.parse(el.dataset.tw); } catch { return; }
  tipFor = el; el.classList.add('on');
  tip = document.createElement('div'); tip.className = 'tw-tip'; tip.setAttribute('role', 'tooltip'); tip.dataset.info = el.dataset.tw;
  const r = T.relOf(info);
  const pairs = r && (r.syn || r.ant || r.rel);
  tip.innerHTML = '<div class="w-py">' + esc(T.pinyinWithExpanded(info.py)) + '</div>' + (info.hg ? '<div class="hgw">' + T.toneHTML(info.hg, info.parts || []) + '</div>' : '') + '<div class="tw-ko">' + esc(info.ko) + '</div>' +
    (r && r.note ? '<div class="small muted" style="margin-top:4px">💡 ' + esc(r.note) + '</div>' : '') +
    '<button type="button" class="tw-more" data-more>' + (pairs ? '예문 · 비슷한 말 · 반대말' : '예문 보기') + ' ›</button>';
  document.body.append(tip);
  const b = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  let left = Math.min(Math.max(8, b.left + b.width / 2 - w / 2), innerWidth - w - 8);
  let top = b.bottom + 8; if (top + h > innerHeight - 8) top = b.top - h - 8;
  tip.style.left = left + 'px'; tip.style.top = top + 'px';
});
addEventListener('scroll', closeTip, {passive: true});
})();
