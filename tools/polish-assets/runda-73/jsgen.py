# -*- coding: utf-8 -*-
"""Genererar JS-anropet till Wix UR skrivning.json + facit.json.

☠️ Texten skrivs aldrig för hand i API-anropet (batch 64: nio fel inline mot
noll via fil). Nyttolasten MÅSTE ändå passera chatten för att nå Wix, så
grinden flyttas in i anropet: JS:en räknar synlig längd + hash och VÄGRAR
PATCH:a vid avvikelse. En felskrivning på vägen når då aldrig butiken.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
SKRIV = json.load(open(os.path.join(HAR, "skrivning.json"), encoding="utf-8"))
FACIT = json.load(open(os.path.join(HAR, "facit.json"), encoding="utf-8"))


def js_str(s):
    return json.dumps(s, ensure_ascii=False)


SVANS = r"""
function synlig(h){return h.replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();}
function hash(t){let h=0;for(const c of t){h=(h*31+c.codePointAt(0))%1000000007;}return h;}
const ut=[];
for(const p of P){
  const s=synlig(p.html), L=s.length, H=hash(s);
  if(L!==p.L||H!==p.H){ut.push(p.k+"  GRIND FALLER "+L+"/"+H+" mot facit "+p.L+"/"+p.H);continue;}
  // ☠️ revision hämtas FÄRSKT — Wix kräver den och en sparad siffra är
  //    gammal så fort något annat rört produkten.
  const cur=await wix.request({method:"GET",url:"/stores/v3/products/"+p.id});
  const r=await wix.request({method:"PATCH",
    url:"/stores/v3/products/"+p.id,
    body:{product:{revision:cur?.product?.revision,
      name:p.name,slug:p.slug,plainDescription:p.html,
      seoData:{tags:[{type:"title",children:p.t,custom:false,disabled:false},
        {type:"meta",props:{name:"description",content:p.m},custom:false,disabled:false}]}},
      fieldMask:["name","slug","plainDescription","seoData"]}});
  ut.push(p.k+"  ok rev="+(r?.product?.revision)+" slug="+(r?.product?.slug)+" len="+L);
}
return ut.join("\n");
"""


def bygg(kort_lista):
    rader = []
    for k in kort_lista:
        x = [q for q in SKRIV if q["kort"] == k][0]
        f = FACIT[k]
        rader.append(
            "{k:%s,id:%s,name:%s,slug:%s,t:%s,m:%s,L:%d,H:%d,\nhtml:%s}"
            % (js_str(k), js_str(x["id"]), js_str(x["name"]), js_str(x["slug"]),
               js_str(x["seoTitle"]), js_str(x["seoDescription"]),
               f["synligLangd"], f["synligHash"], js_str(x["html"])))
    return "const P=[\n" + ",\n".join(rader) + "\n];\n" + SVANS


if __name__ == "__main__":
    print(bygg(sys.argv[1:]))
