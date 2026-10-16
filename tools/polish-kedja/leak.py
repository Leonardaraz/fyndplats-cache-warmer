#!/usr/bin/env python3
import re,glob,os,sys
sys.path.insert(0,'/home/user/fyndplats-cache-warmer/tools/polish-gates')
R=sys.argv[1]
import gatelib
files=[f for f in glob.glob(R+'/*') if os.path.isfile(f)]
print(len(files),'filer')
pat_extra=[r'\b\d{2}-\d{4}\b', r'\b\d{3}-\d{3}\b', r'artikel(nummer|etikett|nr)', r'\b[0-9][A-Za-z][0-9]\b']
sup=['aosom','homcom','outsunny','pawhut','vinsetto','aiyaplay','aliexpress','dealproffsen','sportnow','kleankin','zonekiz','durhand','leverantör','alibaba','wholesale']
n=0
for f in files:
    t=open(f,encoding='utf-8',errors='ignore').read()
    low=t.lower()
    for w in sup:
        if w in low:
            i=low.index(w); print('LEAK-ORD',os.path.basename(f),w,repr(t[max(0,i-40):i+60])); n+=1
    for p in pat_extra:
        for m in re.finditer(p,t,flags=re.I):
            # ett intervall med enhet (100-156 cm, 100-240 V) är ett mått, inget artikelnummer
            if p==r'\b\d{3}-\d{3}\b' and re.match(r'\s*(cm|mm|m|V|W|kg|g|Hz|A|l|L|Ah|mAh|°|%)(?![A-Za-z])',t[m.end():m.end()+8]): continue
            print('MONSTER',os.path.basename(f),p,repr(t[max(0,m.start()-30):m.end()+30])); n+=1
    for name in ('ARTNR','MARKEN'):
        rx=getattr(gatelib,name,None)
        if rx is None: continue
        if isinstance(rx,str): rx=re.compile(rx,re.I)
        for m in rx.finditer(t):
            print('GATELIB',name,os.path.basename(f),repr(t[max(0,m.start()-30):m.end()+30])); n+=1
print('TRÄFFAR',n)
