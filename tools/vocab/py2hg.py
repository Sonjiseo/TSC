# 병음 → 한글 발음 (사이트 규칙). 된소리는 화면에서 성조로 자동 처리되므로 여기서는 예사소리로 만든다.
import re, unicodedata
V = 'aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'
SYL = re.compile(r"(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[" + V + r"v]+(?:ngr|nr|ng|n|r)?(?![" + V + "])", re.I)
MARKS = {'a':'āáǎà','e':'ēéěè','i':'īíǐì','o':'ōóǒò','u':'ūúǔù','ü':'ǖǘǚǜ'}
BASE = {c:(b, i+1) for b, m in MARKS.items() for i, c in enumerate(m)}
def plain(s): return ''.join(BASE[c][0] if c in BASE else c for c in s.lower()).replace('v', 'ü')
def tone(s):
    for c in s.lower():
        if c in BASE: return BASE[c][1]
    return 0
CHO = {'':11,'b':7,'p':17,'m':6,'f':17,'d':3,'t':16,'n':2,'l':5,'g':0,'k':15,'h':18,'j':12,'q':14,'x':9,'zh':12,'ch':14,'sh':9,'r':5,'z':12,'c':14,'s':10}
JUNG = {'ㅏ':0,'ㅐ':1,'ㅑ':2,'ㅒ':3,'ㅓ':4,'ㅔ':5,'ㅕ':6,'ㅖ':7,'ㅗ':8,'ㅘ':9,'ㅙ':10,'ㅚ':11,'ㅛ':12,'ㅜ':13,'ㅝ':14,'ㅞ':15,'ㅟ':16,'ㅠ':17,'ㅡ':18,'ㅢ':19,'ㅣ':20}
JONG = {'':0,'ㄴ':4,'ㄹ':8,'ㅇ':21}
def mk(cho, jung, jong=''): return chr(0xAC00 + (cho * 21 + JUNG[jung]) * 28 + JONG[jong])
F = {
 'a':[('ㅏ','')],'o':[('ㅗ','')],'e':[('ㅓ','')],'ai':[('ㅏ',''),('ㅣ','')],'ei':[('ㅔ',''),('ㅣ','')],'ao':[('ㅏ',''),('ㅗ','')],
 'ou':[('ㅓ',''),('ㅜ','')],'an':[('ㅏ','ㄴ')],'en':[('ㅓ','ㄴ')],'ang':[('ㅏ','ㅇ')],'eng':[('ㅓ','ㅇ')],'ong':[('ㅜ','ㅇ')],'er':[('ㅓ','ㄹ')],
 'i':[('ㅣ','')],'ia':[('ㅑ','')],'iao':[('ㅑ',''),('ㅗ','')],'ie':[('ㅣ',''),('ㅔ','')],'iu':[('ㅣ',''),('ㅗ',''),('ㅜ','')],
 'ian':[('ㅖ','ㄴ')],'in':[('ㅣ','ㄴ')],'iang':[('ㅑ','ㅇ')],'ing':[('ㅣ','ㅇ')],'iong':[('ㅠ','ㅇ')],
 'u':[('ㅜ','')],'ua':[('ㅘ','')],'uo':[('ㅝ','')],'uai':[('ㅘ',''),('ㅣ','')],'ui':[('ㅜ',''),('ㅔ',''),('ㅣ','')],
 'uan':[('ㅘ','ㄴ')],'un':[('ㅜ',''),('ㅓ','ㄴ')],'uang':[('ㅘ','ㅇ')],'ueng':[('ㅝ','ㅇ')],
 'ü':[('ㅟ','')],'üe':[('ㅟ',''),('ㅔ','')],'üan':[('ㅟ',''),('ㅏ','ㄴ')],'ün':[('ㅟ','ㄴ')],
}
Y = {'a':[('ㅑ','')],'o':[('ㅛ','')],'ao':[('ㅑ',''),('ㅗ','')],'e':[('ㅖ','')],'ou':[('ㅛ',''),('ㅜ','')],'an':[('ㅖ','ㄴ')],'in':[('ㅣ','ㄴ')],
     'ang':[('ㅑ','ㅇ')],'ing':[('ㅣ','ㅇ')],'ong':[('ㅠ','ㅇ')],'i':[('ㅣ','')],'u':[('ㅟ','')],'ue':[('ㅟ',''),('ㅔ','')],'uan':[('ㅟ',''),('ㅏ','ㄴ')],'un':[('ㅟ','ㄴ')]}
W = {'a':[('ㅘ','')],'o':[('ㅝ','')],'ai':[('ㅘ',''),('ㅣ','')],'ei':[('ㅞ',''),('ㅣ','')],'an':[('ㅘ','ㄴ')],'en':[('ㅝ','ㄴ')],'ang':[('ㅘ','ㅇ')],'eng':[('ㅝ','ㅇ')],'u':[('ㅜ','')]}
def conv(syl):
    s = plain(syl)
    r = False
    if s.endswith('r') and s not in ('er',) and len(s) > 1 and not s.endswith('er'):
        r = True; s = s[:-1]
    m = re.match(r'(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?(.*)', s)
    ini, fin = m.group(1) or '', m.group(2)
    if ini == 'y': parts = Y[fin]; ini = ''
    elif ini == 'w': parts = W[fin]; ini = ''
    else:
        if ini in ('j','q','x') and fin.startswith('u'): fin = 'ü' + fin[1:]
        parts = list(F[fin])
        if ini in ('zh','ch','sh','r','z','c','s') and fin == 'i': parts = [('ㅡ','')]
        if ini == 'j':
            parts = {'ia':[('ㅏ','')],'iao':[('ㅏ',''),('ㅗ','')],'ian':[('ㅔ','ㄴ')],'iang':[('ㅏ','ㅇ')],'iong':[('ㅜ','ㅇ')]}.get(fin, parts)
        if ini in ('q','x'):
            parts = {'ian':[('ㅖ','ㄴ')]}.get(fin, parts)
        if ini == 'sh':
            parts = {'a':[('ㅑ','')],'ai':[('ㅑ',''),('ㅣ','')],'an':[('ㅑ','ㄴ')],'ang':[('ㅑ','ㅇ')],'ao':[('ㅑ',''),('ㅗ','')],'ei':[('ㅖ',''),('ㅣ','')],
                     'u':[('ㅠ','')],'ui':[('ㅠ',''),('ㅔ',''),('ㅣ','')],'un':[('ㅠ',''),('ㅓ','ㄴ')]}.get(fin, parts)
    if r and len(parts) > 1 and parts[-1] == ('ㅣ', ''): parts = parts[:-1]  # 얼화: ai·ei·ui 뒤 i는 빠진다 (háir → 할)
    out = ''
    for k, (jung, jong) in enumerate(parts):
        out += mk(CHO[ini] if k == 0 else 11, jung, jong)
    if r:
        c = ord(out[-1]) - 0xAC00
        out = out[:-1] + chr(0xAC00 + (c // 28) * 28 + 8)
    return out
def syllables(py):
    return SYL.findall(re.sub(r"\s*\([^)]*\)", '', py))
def hangul_word(py):
    """단어 하나 → ('밍|톈', [2,1])"""
    sy = syllables(py)
    return '|'.join(conv(x) for x in sy), [tone(x) for x in sy]
if __name__ == '__main__':
    for t in ['míngtiān','xiūxi','shān','shàng','nàr','huàr','jiàn','qián','xiǎo','zhīdào','duì','liù','xué','yuè','jiějie','chūn','yǔsǎn','wǒmen','shéi','guǒzhīr','yīyuàn','wèntí','yòngpǐn','xióngmāo','qióng','lǜsè','nǚ\'ér']:
        print(t, hangul_word(t))
