# -*- coding: utf-8 -*-
"""Runda 113 Steg 14 — läs rundans ÅTTA publicerade sidor som kunden ser dem.

☠️ FACIT HÄMTAS UR `facit-live.json`, som LÄSTES UR KATALOGEN efter
   publiceringen — inte kopierat från rundans egna filer. Två filer som bär
   samma tal är just den tvilling huset förlorat tid på flera gånger.

☠️ TRE UPPMJUKNINGAR ÄRVS FRÅN RUNDA 111–112, alla köpta med ett falsklarm:

   1. MATERIALKONTROLLEN LÄSER `rensad` — sidans EGEN text, med grannarnas
      produktnamn strukna. Runda 111 fällde `79b349f7` på `bambu`, och alla
      sex förekomsterna satt i rekommendationsradens grannar.
   2. LÖFTESGRINDARNA LÄSER SIDAN UTAN BILDADRESSER. Runda 112 fällde ALLA NIO
      på Wix EGEN `srcset` — `1080w` är en bildbredd, inte ett påstående.
   3. `?cb=` BUSTAR INTE ISR-cachen (Next.js nycklar på RUTTEN). `hamta_isr`
      hämtar TVÅ gånger: den första beställer ombyggnaden, den andra mäter.

☠️ RUNDANS EGEN SIGNATUR: energiklassen OCH skalan måste stå på sidan. Det är
   inte en stilfråga utan ett krav i (EU) 2019/2016 på varje visuell annons för
   en specifik modell, internet inräknat — och de två sidor som hade klassen som
   riktig etikettbild förlorade den bilden, eftersom den bar artikelnumret.

⚠️ Alla självtestfall prövas ÅT BÅDA HÅLLEN. En uppmjukning som bara provas på
   "släpper den igenom?" kan lika gärna vara `return []`.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                              # noqa: E402
sys.path.insert(0, HAR)
import matt as _m                                                # noqa: E402
import texter as T                                               # noqa: E402
from grind import (TYSTLOFTE, TVAZONSLOFTE, SNALLOFTE, FRYS_INTE_KYL,   # noqa: E402
                   TONGRINDAR, MATERIALORD, FORBJUDET_ORD, loftestraff)

FACIT = json.load(open(os.path.join(HAR, "facit-live.json"), encoding="utf-8"))
BAS = "https://www.fyndplats.se/produkt/"

FORBJUDET = [
  ("tyskt ord", re.compile(r"\b(K[üu]hlschrank|Gefrierschrank|Gefrierbox|"
                           r"Weink[üu]hlschrank|K[üu]hlbox|Glast[üu]r|K[äa]ltemittel|"
                           r"K[üu]hlmittel|Lieferumfang|Abmessungen|Gesamtma[ßs]e|"
                           r"Innenma[ßs]e|Flaschen|T[üu]r[öo]ffnungswinkel|"
                           r"Energieeffizienzklasse)\b")),
  ("husmärke", re.compile(r"\b(PawHut|HOMCOM|Outsunny|Aiyaplay|Vinsetto|Aosom)\b", re.I)),
  ("lagerland", re.compile(r"Skickas fr[åa]n\s+(Tyskland|Polen|Spanien|Kina)", re.I)),
  ("artikelnummer", G.ARTNR),
  ("trasig relativ länk", re.compile(r"https:/produkt")),
]
FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]


def granska(nyckel, html):
    fel = []
    f = FACIT[nyckel]
    slug = f["slug"]
    if f["hjalte"].replace(".jpg", "") not in html:
        fel.append("KONTROLLMÄTNINGEN FALLER — hjältebilden finns inte i HTML:en")
    if f["kort"].replace(".jpg", "") not in html:
        fel.append("vårt eget Fyndplats-kort saknas i galleriet")
    for flik in FLIKAR:
        if f"<summary>{flik}</summary>" not in html and f">{flik}<" not in html:
            fel.append(f"fliken {flik!r} saknas i renderad HTML")

    norm = (html.replace("\\u003c", "<").replace("\\u003e", ">")
                .replace("\\u0026", "&").replace('\\"', '"'))
    # Butikens rekommendationsrad är ANDRA produkters kort, i två serialiseringar.
    andras = set(re.findall(r"/produkt/([a-z0-9-]+)", norm)) - {slug}
    andras |= set(re.findall(r'"pname">([^<]+)<', norm))
    rensad = norm
    for token in sorted(andras, key=len, reverse=True):
        rensad = rensad.replace(token, "")
    if f["alt1"] not in rensad:
        fel.append("KONTROLLMÄTNINGEN FALLER — strykningen åt sidans egen alt-text")

    # ── Rundans signatur: yttermått, volym, OCH lagkravet ────────────────────
    if T.yttre(nyckel) not in rensad:
        fel.append(f"yttermåttet {T.yttre(nyckel)} står inte på sidan")
    if f"{T.tal(_m.VOLYM[nyckel])} liter" not in rensad:
        fel.append(f"volymen {_m.VOLYM[nyckel]} liter står inte på sidan")
    klass = _m.ENERGIKLASS[nyckel]
    if f"energiklass {klass}".lower() not in rensad.lower():
        fel.append("ENERGIKLASSEN saknas live — (EU) 2019/2016 kräver den i annonsen")
    if "a till g" not in rensad.lower():
        fel.append("ENERGISKALAN saknas live — klassen ensam räcker inte")

    # ☠️ Bildadresserna bort FÖRE löftesgrindarna. `https:/produkt` (ETT
    #    snedstreck) matchas inte av mönstret och överlever, så den trasiga
    #    länken kan fortfarande fångas — den kontrollen läser `rensad`.
    utan_url = re.sub(r"https?://[^\s\"'<>\\]+", " ", rensad)
    syn = G.synlig_meningstext(rensad)

    for ord_ in MATERIALORD[nyckel]:
        if ord_ not in rensad.lower():
            fel.append(f"materialet nämner inte {ord_!r} — importfelet lever kvar live")
    t = FORBJUDET_ORD[nyckel].search(syn)
    if t:
        fel.append(f"FEL SKÅPTYP live: {t.group(0)!r}")

    grindar = [("SNÅLHETSLÖFTE", SNALLOFTE)]
    grindar += ([("TYSTLÖFTE", TYSTLOFTE), ("TVÅZONSLÖFTE", TVAZONSLOFTE)]
                if _m.GRUPPER[nyckel] == "C"
                else [("FRYS SÅLD SOM KYLSKÅP", FRYS_INTE_KYL)])
    for etikett, monster in grindar:
        m = loftestraff(monster, utan_url)
        if m:
            i = max(0, m.start() - 70)
            fel.append(f"{etikett} på sidan: …{utan_url[i:m.end() + 70]}…")
    for etikett, monster in TONGRINDAR:
        m = monster.search(utan_url)
        if m:
            i = max(0, m.start() - 70)
            fel.append(f"{etikett} på sidan: …{utan_url[i:m.end() + 70]}…")

    for etikett, monster in FORBJUDET:
        t = monster.search(rensad if etikett == "trasig relativ länk" else utan_url)
        if t:
            fel.append(f"{etikett}: {t.group(0)!r}")

    # ☠️ De två UTELÄMNADE fälten får inte ha smugit tillbaka live heller.
    if nyckel in _m.UTELAMNAS:
        for o in _m.UTELAMNAS[nyckel]:
            if re.search(r"\b" + re.escape(o), syn, re.I):
                fel.append(f"UTELÄMNAT FÄLT live: {o!r}")
    return fel


def _sjalvtest():
    """☠️ VARJE UPPMJUKNING PRÖVAS ÅT BÅDA HÅLLEN."""
    n = "480849a7"
    f = FACIT[n]

    def sida(egen, granne, extra=""):
        return ('<html>' + f["hjalte"].replace(".jpg", "") + ' '
                + f["kort"].replace(".jpg", "") + '<img alt="' + f["alt1"] + '">'
                '<p>Skåpet är 34,5 × 45 × 78 cm och rymmer 50 liter. '
                'Materialet är metall och härdat glas. '
                'Energiklass G på skalan A till G. ' + egen + '</p>'
                '<summary>Tekniska specifikationer</summary>'
                '<summary>Användning och skötsel</summary>'
                '<summary>Vanliga frågor</summary>'
                '<a class="prod" href="/produkt/' + granne[0] + '">'
                '<div class="pname">' + granne[1] + '</div></a>' + extra + '</html>')

    srcset = ('<img srcset="https://static.wixstatic.com/media/' + f["hjalte"]
              + '/v1/fill/w_1080,h_1080,al_c,q_72/file.webp 1080w">')
    fall = [
        ("A rakt tystlöfte i egen text ", "TYSTLÖFTE",
         sida("Skåpet är helt tyst.", ("vinkyl-x", "Vinkyl med glas")), True),
        ("B negerat tystlöfte         ", "TYSTLÖFTE",
         sida("Den blir aldrig helt ljudlös.", ("vinkyl-x", "Vinkyl med glas")), False),
        ("C tyst-ordet hos GRANNEN    ", "TYSTLÖFTE",
         sida("", ("vinkyl-helt-tyst", "Vinkyl helt tyst modell")), False),
        ("D husmärke i egen text      ", "husmärke",
         sida("Tillverkad av HOMCOM.", ("vinkyl-x", "Vinkyl med glas")), True),
        ("E artikelnummer live        ", "artikelnummer",
         sida("Modell 800-196V90BK.", ("vinkyl-x", "Vinkyl med glas")), True),
        ("F Wix srcset, inget löfte   ", "TYSTLÖFTE",
         sida("", ("vinkyl-x", "Vinkyl med glas"), srcset), False),
        ("G energiklassen borttagen   ", "ENERGIKLASSEN saknas",
         sida("", ("vinkyl-x", "Vinkyl med glas")).replace("Energiklass G på skalan A till G. ", ""), True),
    ]
    fel = 0
    for etikett, sok, html, ska in fall:
        traff = [x for x in granska(n, html) if sok in x]
        if bool(traff) != ska:
            print(f"  SJÄLVTEST FEL {etikett}: {'inget larm' if ska else 'falsklarm'}")
            fel += 1
    print(f"självtest: {len(fall)} fall, {fel} fel")
    return fel


if __name__ == "__main__":
    if _sjalvtest():
        sys.exit(2)
    grona = 0
    for nyckel in _m.WIX:
        slug = FACIT[nyckel]["slug"]
        html, hdr = G.hamta_isr(BAS + slug)
        fel = granska(nyckel, html)
        if not fel:
            grona += 1
        print(f"{'OK ' if not fel else 'FEL'} {slug:<30} {len(html):>7} tecken  "
              f"cache={hdr.get('x-vercel-cache')} age={hdr.get('age')}")
        for x in fel:
            print("      ✗", x)
    print(f"\n{grona} av {len(FACIT)} sidor gröna")
    sys.exit(0 if grona == len(FACIT) else 1)
