#!/usr/bin/env python3
"""mkrad.py <ut.jpg> <id8>...: en rad per produkt med alla bilder (300 px), för snabb granskning av tysk text/märken. Hämtar originalen till <ut-katalog>/orig om de saknas."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw
SP='/tmp/claude-0/-home-user-fyndplats-cache-warmer/fb0002bf-5601-54fa-ae29-3d067e6665d6/scratchpad'
ut=sys.argv[1]; kat=os.path.dirname(ut); os.makedirs(kat+'/orig',exist_ok=True)
T=300
rows=[]
for k in sys.argv[2:]:
    d=json.load(open(f'{SP}/t15/data/{k}.json',encoding='utf-8'))
    ims=[]
    for n,m in enumerate(d['items'],1):
        fn=f'{kat}/orig/{k}-{n}.jpg'
        if not (os.path.exists(fn) and os.path.getsize(fn)>1000):
            r=subprocess.run(['curl','-sS','-L','--max-time','60','https://static.wixstatic.com/media/'+m['id']],capture_output=True)
            open(fn,'wb').write(r.stdout)
        try:
            im=Image.open(fn).convert('RGB'); im.thumbnail((T,T)); ims.append((n,im))
        except Exception as e:
            print(k,n,'fel',e)
    rows.append((k,d['name'][:70],ims))
W=20+6*(T+6); H=sum(T+30 for _ in rows)+10
sheet=Image.new('RGB',(W,H),(244,244,244)); dr=ImageDraw.Draw(sheet)
y=5
for k,nm,ims in rows:
    dr.text((10,y),f'{k}  {nm}'.encode('ascii','replace').decode(),fill=(0,0,0))
    for i,(n,im) in enumerate(ims):
        sheet.paste(im,(10+i*(T+6),y+18)); dr.text((14+i*(T+6),y+20),str(n),fill=(255,0,0))
    y+=T+30
sheet.save(ut,quality=82); print(ut,sheet.size)
