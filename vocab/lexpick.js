/* 예문 속 단어의 뜻이 여러 개일 때 문맥으로 고르는 규칙 (단어장·문법 페이지 공용). */
window.VOC_LEXPICK = (key, list0, c) => {
  let list = list0;
  const by = s => list.find(x => x.ko.includes(s));
  const has = k => c.keys.includes(k);
  /* 양사: 숫자·zhè·nà·nǎ·jǐ·měi 뒤면 양사 뜻, 아니면 다른 뜻 */
  const mws = list.filter(x => x.ko.startsWith('양사'));
  if (mws.length) {
    if (/^(yī|yí|yì|liǎng|sān|sì|wǔ|liù|qī|bā|jiǔ|shí|jǐ|zhè|nà|nǎ|měi|zhège|nàge|[a-zǎāáàěēéèǐīíìǒōóòǔūúùǚ]*shí[a-zǎāáàěēéèǐīíìǒōóòǔūúù]*|[a-zǎāáàěēéèǐīíìǒōóòǔūúù]*bǎi|[a-zǎāáàěēéèǐīíìǒōóòǔūúù]*qiān)$/.test(c.prev || '')) {
      if (key === 'zhī') return /^(qiānbǐ|yuánzhūbǐ)/.test(c.next || '') ? mws.find(x => x.ko.includes('자루')) : mws.find(x => x.ko.includes('마리'));
      if (key === 'jiā') return mws[0];
      return mws[0];
    }
    const rest = list.filter(x => !x.ko.startsWith('양사'));
    if (rest.length === 1) return rest[0];
    if (!rest.length) return mws[0];
    list = rest;
  }
  switch (key) {
    case 'jiàn': return c.next === 'yīfu' ? by('벌') : by('만나');
    case 'jiā': return ['zhè', 'nà'].includes(c.prev) ? by('세는') : by('집');
    case 'kuài': if (['qù', 'lái', 'huí'].includes(c.next)) return by('빨리');
      return (c.next === 'máo' || /^(yí|liǎng|sān|sì|wǔ|liù|qī|bā|jiǔ|shí|sānshí|shíwǔ|èrshí)/.test(c.prev || '')) ? by('위안') : by('빠르');
    case 'fēn': return has('diǎn') ? by('분') : by('0.01');
    case 'zuò': return (c.keys.slice(c.i + 1, c.i + 6).some(k => /^(dìtiě|chē|gōnggòng|chūzūchē|fēijī)/.test(k)) || (c.next === 'shénme' && c.next2 === 'qù')) ? by('타다') : by('하다');
    case 'zhù': return c.i === 0 ? by('기원') : by('살다');
    case 'nán': return by('어렵');
    case 'dài': return c.next === 'sǎn' ? by('챙기') : by('쓰다');
    case 'lí': return c.next ? by('거리') : by('배');
    case 'zài': return ['shuō', 'lái', 'yě', 'jiàn'].includes(c.next) ? by('다시') : by('~에서');
    case 'shì': return c.prev === 'jiàn' ? by('일') : by('이다');
    case 'lù': return c.prev === 'tiáo' ? by('길') : by('노선');
    case 'kè': return ['mén', 'shàng', 'xià'].includes(c.prev) ? by('수업') : by('그램');
    case 'hào': return c.next === 'fángjiān' ? by('호') : by('날짜');
    case 'duō': if (['cháng', 'gāo', 'zhòng', 'dà', 'yuǎn', 'jiǔ'].includes(c.next)) return by('얼마나');
      return ['chuān', 'chī', 'hē'].includes(c.next) ? by('더') : by('많다');
    case 'lái': return by('오다');
    case 'qián': return (c.prev === 'duōshao' || c.prev === 'fù' || c.prev === 'huā') ? by('돈') : by('앞');
    case 'xiǎng': return ['jiārén', 'jiā', 'nǐ', 'māma', 'bàba'].includes(c.next) ? by('그리워') : by('싶다');
    default: return null;
  }
};
