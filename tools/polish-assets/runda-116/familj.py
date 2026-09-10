# -*- coding: utf-8 -*-
"""Runda 116 Steg 1 — hundvagnsfamiljen: 33 utkast mot 16 PUBLICERADE.

☠️ FAMILJEN DEFINIERAS PÅ BÅDA SPRÅKEN. Runda 115:s svep matchade bara
   leverantörens tyska ord (`Rutschauto`, `Sitzbagger`) och missade FEM redan
   polerade svenska syskon — en av dem visade sig vara en bevisad dubblett av
   ett utkast som var på väg att publiceras (uppgift #421). Här söks därför
   både `hundewagen|hundebuggy|…` OCH `hundvagn|hundbuggy|cykelvagn-for-hund`.

☠️ SÖKORDSRYMDEN ÄR REDAN TÄT. Sexton publicerade sidor slåss om ordet
   `hundvagn`. Trettiotre nya hade kannibaliserat dem — det är precis den
   krock runbokens Steg 1 säger att man aldrig hoppar över.

⚠️ `-2`- OCH `-3`-SUFFIXEN ÄR ETT FYND I SIG. Wix lägger dem när en NY produkt
   vill ha en slug som redan är tagen. Tre rader som slutar `…bodenkorb`,
   `…bodenkorb-2`, `…bodenkorb-3` betyder alltså att importen skapade tre
   produkter ur samma råa titel. Det är inte bevis för dubblett — färgsyskon
   delar också titel — men det är den starkaste kandidatlistan som finns utan
   att titta på en enda pixel.

☠️ GRINDEN JÄMFÖR HELA BILDUPPSÄTTNINGAR — INTE HUVUDBILDEN. Ett första utkast
   av den här filen mätte bara position 1 mot position 1, och ärvde dessutom
   `NARA = 6.0` rakt av från runda 115. Den rapporterade **"0 utkast ligger nära
   en publicerad sida"**. Ögat sa något annat: `ca84c48b` (729 kr) och
   publicerade `hundvagn-liten-hund` (629 kr) är SAMMA vagn — samma
   teleskophandtag med samma rem, samma fyra små hjul, samma PawHut-logotyp på
   samma panel.

   ☠️ **Och runbooken hade redan mätt paret till 0,10 i runda 47.** Den siffran
   är "lägsta bildskillnad" över ALLA bilder; min hjälte-mot-hjälte gav 6,18 på
   exakt samma par. Skillnaden är inte brus, den är metod: de två sidorna delar
   en byte-identisk bild — men inte på plats 1. Den publicerade huvudbilden har
   en hund i vagnen, utkastets har den inte.

   Jag skrev alltså en SVAGARE tvilling av en grind runbooken redan beskrev, och
   lappade sedan tröskeln i stället för metoden. Husets vanligaste bugg, en gång
   till: **tvillingar glider isär.** Med hela uppsättningen jämförd faller paret
   på 0,10 — under `TROSKEL`, utan ett enda inställt tal.

⚠️ ORDNINGEN ÖVERLEVER FAMILJEBYTET, AVSTÅNDET GÖR DET INTE. Runda 115
   fotograferade sparkbilar mot vit botten; hälften av hundvagnarna har en HUND
   i bilden, och hunden ensam flyttar medelavvikelsen flera enheter. Därför
   lämnar grinden ALLTID över de `OGONTAK` närmaste paren till ögat, oavsett
   avstånd, och skriver ut hela fördelningen. En grind som kan svara "noll" är
   en grind som lär mottagaren att lita på tystnaden.
"""
import json
import os
import urllib.request

import numpy as np
from PIL import Image

HAR = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HAR, "hjaltar")
BAS = "https://static.wixstatic.com/media/%s/v1/fill/w_320,h_320,al_c,q_80/f.jpg"
TROSKEL = 1.0          # under detta: samma bildfil — ett påstående om BYTES,
                       # inte om familjen, och därför det enda tal som ärvs
OGONTAK = 8            # så många närmaste par går ALLTID till ögat

RADER = json.load(open(os.path.join(HAR, "familj.json"), encoding="utf-8"))
BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
UTKAST = [r["k"] for r in RADER if not r["publ"]]
PUBLICERADE = [r["k"] for r in RADER if r["publ"]]
SLUG = {r["k"]: r["slug"] for r in RADER}
PRIS = {r["k"]: r["pris"] for r in RADER}

_cache = {}


def gra(fil_id):
    if fil_id in _cache:
        return _cache[fil_id]
    os.makedirs(CACHE, exist_ok=True)
    fil = os.path.join(CACHE, fil_id.replace("~", "_") + ".jpg")
    if not os.path.exists(fil):
        with urllib.request.urlopen(BAS % fil_id, timeout=60) as r:
            open(fil, "wb").write(r.read())
    _cache[fil_id] = np.asarray(Image.open(fil).convert("L").resize((320, 320)),
                                dtype=float)
    return _cache[fil_id]


def avstand(a, b):
    """Lägsta skillnad mellan NÅGON bild på a och NÅGON bild på b.

    ☠️ Minimum, inte huvudbild mot huvudbild. En dubblett delar ofta bara EN
    bild — måttritningen, en detaljbild — medan hjältebilden skiljer sig för
    att den ena sidan har en hund i vagnen.
    """
    return min(float(np.abs(gra(x) - gra(y)).mean())
               for x in BILDER[a] for y in BILDER[b])


def narmaste(kallor, mal):
    """(källa, mål, avstånd) per källa, närmaste först."""
    ut = []
    for u in kallor:
        d, v = min(((avstand(u, x), x) for x in mal if x != u), key=lambda t: t[0])
        ut.append((u, v, d))
    return sorted(ut, key=lambda x: x[2])


def kontroll():
    """☠️ TRE KONTROLLER, OCH INGEN AV DEM FÖRUTSÄTTER SITT SVAR."""
    d = avstand("acfa3c39", "7b344636")    # cykelvagn 2-i-1 mot liten hundvagn
    if d < 3.0:
        raise SystemExit(f"☠️ NEGATIVA KONTROLLEN FÖLL: cykelvagn mot liten "
                         f"hundvagn gav {d:.2f} — grinden skiljer inte produkttyper")
    print(f"negativ kontroll: cykelvagn mot liten hundvagn {d:.2f}   OK")

    alla = [b for v in BILDER.values() for b in v]
    if len(set(alla)) != len(alla):
        raise SystemExit("☠️ TVÅ PRODUKTER DELAR SAMMA WIX-FIL — det är en "
                         "dubblett på filnivå och ska avgöras innan matrisen körs")

    # ☠️ POSITIV KONTROLL mot runbookens EGEN mätning från runda 47: paret
    #    `ca84c48b` ≡ `hundvagn-liten-hund` mättes då till 0,10. Faller den här
    #    raden mäter grinden inte samma sak som runbooken beskriver.
    d47 = avstand("ca84c48b", "7b344636")
    if d47 >= TROSKEL:
        raise SystemExit(
            f"☠️ POSITIVA KONTROLLEN FÖLL: den KÄNDA dubbletten gav {d47:.2f}, "
            f"inte under {TROSKEL} — grinden mäter inte hela bilduppsättningen "
            f"(runbooken, runda 47: 0,10)")
    print(f"positiv kontroll: känd dubblett ca84c48b≡7b344636 {d47:.2f}   OK")
    print(f"{len(UTKAST)} utkast, {len(PUBLICERADE)} publicerade, "
          f"{sum(len(v) for v in BILDER.values())} bilder")


def tabell(rubrik, par):
    print(f"\n── {rubrik} " + "─" * max(0, 60 - len(rubrik)))
    for i, (u, v, d) in enumerate(par):
        if d < TROSKEL:
            flagga = "☠️ SAMMA BILDFIL"
        elif i < OGONTAK:
            flagga = "👁 TILL ÖGAT"
        else:
            flagga = ""
        print(f"  {i + 1:2}. {u} {SLUG[u][:34]:<34} {d:6.2f}  "
              f"{v} {SLUG[v][:30]:<30} {flagga}")


if __name__ == "__main__":
    kontroll()
    tabell("UTKAST mot PUBLICERAD (närmaste först)",
           narmaste(UTKAST, PUBLICERADE))
    tabell("UTKAST mot UTKAST (närmaste först)", narmaste(UTKAST, UTKAST))
    print(f"\n{OGONTAK} närmaste par per riktning lämnas över till ögat. "
          f"Grinden dömer inte — den sållar.")
