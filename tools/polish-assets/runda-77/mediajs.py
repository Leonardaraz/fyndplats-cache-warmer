# -*- coding: utf-8 -*-
"""Sätter ihop bildskrivningens JS: nyttolast från mediagen + grind i anropet.

☠️ Grinden ligger INNE i anropet. Nyttolasten måste passera chatten för att
nå Wix, så längd och hash räknas om på plats och PATCH:en vägras vid avvikelse.

☠️ fieldMask är ENBART ["media"]. En variantsInfo-PATCH publicerar ett utkast
(uppmätt 2026-08-28); media gör det inte, och masken hålls smal så att det
förblir sant.

☠️ Posten är PLATT: {id, altText}. En inbakad {image:{id}} avvisas med 400
"id or url must not be empty" — uppmätt 2026-09-06. Fel form skriver ingenting,
alltså är felet högljutt, men den kostade ett anrop.
"""
import subprocess
import os

HAR = os.path.dirname(os.path.abspath(__file__))
NYTTOLAST = subprocess.run(["python3", os.path.join(HAR, "mediagen.py")],
                           capture_output=True, text=True, check=True).stdout

SVANS = r"""
function hash(t){let h=0;for(const c of t){h=(h*31+c.codePointAt(0))%1000000007;}return h;}
const ut=[];
for(const p of M){
  const sig=p.m.map(x=>x.id+"|"+x.altText).join("\n");
  const n=p.m.length, H=hash(sig);
  if(n!==p.n||H!==p.H){ut.push(p.k+"  GRIND FALLER "+n+"/"+H+" mot facit "+p.n+"/"+p.H);continue;}
  if(p.m.some(x=>!x.altText||!x.altText.trim())){ut.push(p.k+"  TOM ALT-TEXT — hoppar över");continue;}
  const cur=await wix.request({method:"GET",url:"/stores/v3/products/"+p.id});
  const curP=(cur&&cur.data&&cur.data.product)||(cur&&cur.product);
  if(!curP||!curP.revision){ut.push(p.k+"  LÄSTE INGEN REVISION — hoppar över");continue;}
  const r=await wix.request({method:"PATCH",
    url:"/stores/v3/products/"+p.id,
    body:{product:{revision:curP.revision,
      media:{itemsInfo:{items:p.m.map(x=>({id:x.id,altText:x.altText}))}}},
      fieldMask:["media"]}});
  const rp=(r&&r.data&&r.data.product)||(r&&r.product)||{};
  ut.push(p.k+"  ok rev="+rp.revision+" visible="+rp.visible+" n="+n);
}
return ut.join("\n");
"""

print(NYTTOLAST.rstrip() + "\n" + SVANS)
