#!/usr/bin/env python3
"""rec_langd.py <rundkatalog>: kontrollerar längden på varje översatt omdöme i `recensioner.json` mot källans längd i `recensioner-kalla.json`,
före torrkörningen.

Skrivflödet vägrar ett översatt omdöme som är kortare än 0,4 gånger källans längd (spärren *för-kort*), och en vägrad torrkörning kostar en
push och en körning (runda vevor-455: *gen-1yi7g9e* var 39 tecken mot källans 194, för att kundtjänsten, märket och andra köp hade strukits).
Då ska omdömet få en längre mening som säger vad kunden faktiskt sa om varan, aldrig fyllnad: kan inget mer sägas om varan döljs omdömet.

Skriver en rad per översatt omdöme (kvot, källans och översättningens längd) och slutar med kod 1 om någon kvot är under 0,45 (marginal mot spärren),
och med kod 2 om ett omdöme som ska beslutas saknar beslut eller ett beslut saknar omdöme. Den slutar också med kod 3 när ett omdöme som
källan märkt `namn: true` (originalet bär ett namn) ligger bland de översatta i stället för bland de dolda: torrkörningen vägrar det
(*originalet bär ett namn, dölj recensionen*, runda vevor-456), och en vägrad torrkörning kostar en push och en körning. Den slutar med kod 4 när en
översättning bryter husets stilregler (tankstreck, semikolon, citattecken, tre punkter, AI-fraser som *sammantaget*, marknadsplats eller leverantör,
budfirma, pris, säljare eller kundtjänst): torrkörningen vägrar det (*recensioner FEL <id8>/<id>: AI-fras*, runda vevor-459), och reglerna är en
kopia av `STIL` i `lib/reviews/polering.ts`, så ändras de där ska de ändras här. Kör med python3.
"""
import json
import os
import re
import sys

# En kopia av STIL i lib/reviews/polering.ts (artikelnummerformer kontrolleras inte här: leak.py tar dem).
STIL = [
    ("tankstreck", r"[–—]| - "),
    ("semikolon", r";(?!-?[)(DPp])"),
    ("citattecken", r"[\"“”„«»]"),
    ("tre punkter", r"…|\.\.\."),
    ("AI-fras", r"\b(sammantaget|sammanfattningsvis|helt och hållet|förhållandet mellan pris och kvalitet|kan varmt rekommenderas|ett riktigt blickfång)\b"),
    ("marknadsplats eller leverantör", r"\b(aliexpress|ali express|alibaba|amazon|temu|ebay|aosom|vevor|homcom|outsunny|pawhut|aiyaplay|vinsetto|kleankin|zonekiz|sportnow|durhand)\b"),
    ("budfirma", r"\b(dhl|ups|postnord|gls|dpd|hermes|bring|schenker|inpost|fedex|budbee|instabox|early bird)\b"),
    ("pris", r"\d\s*(?:kr|kronor|sek|eur|euro|usd|dollar|pln)(?![a-zåäö])|\d\s*(?:€|\$|zł)|[€$]\s*\d"),
    ("säljare eller kundtjänst", r"(?<![a-zåäö])(?:säljaren|säljare|kundtjänst|kundtjänsten|kundservice)(?![a-zåäö])"),
]

MIN = 0.45  # spärren är 0,4; en marginal för att räkningen kan skilja något mellan Python och TypeScript

rd = sys.argv[1]
kalla = json.load(open(os.path.join(rd, "recensioner-kalla.json"), encoding="utf-8"))
rec = json.load(open(os.path.join(rd, "recensioner.json"), encoding="utf-8"))
kod = 0
for k, v in kalla.items():
    att = {r["id"]: r for r in v.get("attBesluta", [])}
    b = rec.get(k, {"oversatt": {}, "dolj": {}})
    beslut = set(b.get("oversatt", {})) | set(b.get("dolj", {}))
    for rid in sorted(set(att) - beslut):
        print(k, rid, "SAKNAR BESLUT")
        kod = max(kod, 2)
    for rid in sorted(beslut - set(att)):
        print(k, rid, "BESLUT UTAN OMDÖME")
        kod = max(kod, 2)
    for rid, t in b.get("oversatt", {}).items():
        if rid not in att:
            continue
        n = len(att[rid]["text"])
        q = len(t) / n if n else 0
        flagga = ""
        if att[rid].get("namn"):
            flagga = "  <-- ORIGINALET BÄR ETT NAMN: dölj omdömet"
            kod = max(kod, 3)
        if q < MIN:
            flagga = "  <-- FÖR KORT"
            kod = max(kod, 1)
        for namn, rx in STIL:
            if re.search(rx, t, re.I):
                flagga += f"  <-- STILFEL: {namn}"
                kod = max(kod, 4)
        print(k, rid, "källa", n, "översättning", len(t), "kvot", round(q, 2), flagga)
sys.exit(kod)
