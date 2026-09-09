# -*- coding: utf-8 -*-
"""Runda 114 Steg 14 — läs rundans NIO publicerade sidor som kunden ser dem.

☠️ FACIT HÄMTAS UR `facit-live.json`, som LÄSTES UR KATALOGEN efter
   publiceringen — inte kopierat från rundans egna filer. Två filer som bär
   samma tal är just den tvilling huset förlorat tid på flera gånger.

☠️ TRE UPPMJUKNINGAR ÄRVS FRÅN RUNDA 111–113, alla köpta med ett falsklarm:

   1. MATERIALKONTROLLEN LÄSER `rensad` — sidans EGEN text, med grannarnas
      produktnamn strukna. Runda 111 fällde `79b349f7` på `bambu`, och alla
      sex förekomsterna satt i rekommendationsradens grannar.
   2. LÖFTESGRINDARNA LÄSER SIDAN UTAN BILDADRESSER. Runda 112 fällde ALLA NIO
      på Wix EGEN `srcset` — `1080w` är en bildbredd, inte ett påstående.
   3. `?cb=` BUSTAR INTE ISR-cachen (Next.js nycklar på RUTTEN). `hamta_isr`
      hämtar TVÅ gånger: den första beställer ombyggnaden, den andra mäter.

☠️ RUNDANS EGEN SIGNATUR — energiklassen gäller BARA TVÅ av nio, och grinden
   går ÅT BÅDA HÅLL. (EU) 2019/2016 artikel 1 omfattar nätdrivna kylapparater
   över 10 liter: de två stora skåpen MÅSTE bära klass + skala, och de sju
   andra får INTE bära någon — sex av dem har ingen klass att luta sig mot
   (kylboxarna är passiva, minikylarna termoelektriska under 10 liter), och en
   påhittad klass är ett värre fel än en utelämnad.

☠️ OCH SKÖTSELTEXTEN ÄR PER PRODUKT FÖR GRUPP E. Dryckeskylen `ef0fa603` har
   INGET frysfack; en gruppdelad skötseltext bad kunden frosta av ett fack som
   inte finns. Live-grinden läser `egen` — sidan utan syskonlänkens stycke —
   eftersom länken till kylskåpet lagligen nämner ordet "frysfack".

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
from grind import (TYSTLOFTE, SNALLOFTE, EJ_KYLSKAP, LASLOFTE, BURKTAL,  # noqa: E402
                   MATSAKERHET, TONGRINDAR, MATERIALORD, FORBJUDET,
                   SKALAN, loftestraff)

FACIT = json.load(open(os.path.join(HAR, "facit-live.json"), encoding="utf-8"))
BAS = "https://www.fyndplats.se/produkt/"
FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]

# ☠️ EN GRUPPDELAD SKÖTSELTEXT SKICKADE AVFROSTNING TILL ETT SKÅP UTAN FRYSFACK.
#    Grinden är per produkt, inte per grupp, och läser sidan UTAN syskonstycket.
FRYSFACK = re.compile(r"\bfrysfack\w*\b", re.I)

# ☠️ SVG-GEOMETRI ÄR INGEN TEXT — och den bar ett tal grinden letade efter.
#    `0-5` fanns TRE gånger på kylskåpets sida, alla i `d`-attribut: Google-,
#    Facebook- och Instagram-ikonerna plus presentikonen vid "Fri frakt över
#    499 kr". Butikens eget chrome, inte vår text. Tredje gången samma familj:
#    runda 111 läste grannens produktnamn, runda 112 läste Wix `srcset` där
#    `1080w` är en bildbredd.
#
#    Regeln som skiljer: strök gör bara ATTRIBUTVÄRDEN, aldrig brödtext. Både
#    HTML-formen `d="…"` och Next.js flight-formen `"d":"…"` täcks, eftersom
#    sidan bär båda serialiseringarna — samma lärdom som rekommendations-
#    radens två former.
SVG_GEOMETRI = re.compile(
    r'\b(?:d|points|viewBox|transform)="[^"]*"'
    r'|"(?:d|points|viewBox|transform)":"[^"]*"')


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
    rensad = SVG_GEOMETRI.sub(" ", rensad)
    if f["alt1"] not in rensad:
        fel.append("KONTROLLMÄTNINGEN FALLER — strykningen åt sidans egen alt-text")

    # ── Rundans signatur: yttermått och volym ────────────────────────────────
    if T.yttre(nyckel) not in rensad:
        fel.append(f"yttermåttet {T.yttre(nyckel)} står inte på sidan")
    if f"{T.tal(_m.VOLYM[nyckel])} liter" not in rensad:
        fel.append(f"volymen {_m.VOLYM[nyckel]} liter står inte på sidan")

    # ── Energiklassen ÅT BÅDA HÅLL ───────────────────────────────────────────
    klass = _m.ENERGIKLASS.get(nyckel)
    har_klass = re.search(r"\benergiklass\s+([A-G])\b", rensad, re.I)
    if klass:
        if not har_klass or har_klass.group(1).upper() != klass:
            fel.append("ENERGIKLASSEN saknas live — (EU) 2019/2016 kräver den i annonsen")
        if not SKALAN.search(rensad):
            fel.append("ENERGISKALAN saknas live — klassen ensam räcker inte")
    elif har_klass:
        fel.append(f"PÅHITTAD ENERGIKLASS live: {har_klass.group(0)!r} — "
                   "produkten har ingen klass i underlaget")

    # ☠️ Bildadresserna bort FÖRE löftesgrindarna. `https:/produkt` (ETT
    #    snedstreck) matchas inte av mönstret och överlever, så den trasiga
    #    länken kan fortfarande fångas — den kontrollen läser `rensad`.
    utan_url = re.sub(r"https?://[^\s\"'<>\\]+", " ", rensad)
    syn = G.synlig_meningstext(rensad)
    # Syskonlänkens stycke bär GRANNENS ord ("ett kylskåp … med frysfack").
    egen = re.sub(r"<p>Finns också som .*?</p>", "", utan_url, flags=re.S)

    for ord_ in MATERIALORD[nyckel]:
        if ord_ not in rensad.lower():
            fel.append(f"materialet nämner inte {ord_!r} — importfelet lever kvar live")

    grindar = [("SNÅLHETSLÖFTE", SNALLOFTE), ("TYSTLÖFTE", TYSTLOFTE)]
    if _m.GRUPPER[nyckel] in ("V", "P", "K", "B"):
        # ☠️ De sju små är inga kylskåp. "Ersätter kylskåpet" är ett
        #    matsäkerhetslöfte de inte kan hålla — FAQ-nekandet är negerat.
        grindar.append(("SÅLD SOM KYLSKÅP", EJ_KYLSKAP))
        grindar.append(("MATSÄKERHETSLÖFTE", MATSAKERHET))
    if nyckel == "397b845e":
        grindar.append(("BURKTAL UTAN UNDERLAG", BURKTAL))
    if nyckel == "e6d2e70b":
        grindar.append(("LÅSLÖFTE — bara en marknadsikon påstår det", LASLOFTE))
    for etikett, monster in grindar:
        m = loftestraff(monster, egen)
        if m:
            i = max(0, m.start() - 70)
            fel.append(f"{etikett} på sidan: …{egen[i:m.end() + 70]}…")
    for etikett, monster in TONGRINDAR:
        m = monster.search(utan_url)
        if m:
            i = max(0, m.start() - 70)
            fel.append(f"{etikett} på sidan: …{utan_url[i:m.end() + 70]}…")

    for etikett, monster in FORBJUDET:
        t = monster.search(rensad if etikett == "trasig relativ länk" else utan_url)
        if t:
            fel.append(f"{etikett}: {t.group(0)!r}")

    # ☠️ Skötseltexten får inte be dryckeskylen frosta av ett fack den saknar.
    if nyckel == "ef0fa603" and FRYSFACK.search(egen):
        fel.append("FRYSFACK på ett skåp utan frysfack — gruppdelad skötseltext live")

    # ☠️ De UTELÄMNADE fälten får inte ha smugit tillbaka live heller.
    if nyckel in _m.UTELAMNAS:
        for o in _m.UTELAMNAS[nyckel]:
            if re.search(r"\b" + re.escape(o), syn, re.I):
                fel.append(f"UTELÄMNAT FÄLT live: {o!r}")
    return fel


def _sjalvtest():
    """☠️ VARJE UPPMJUKNING PRÖVAS ÅT BÅDA HÅLLEN."""
    def sida(n, egen, granne, extra="", energi=None):
        f = FACIT[n]
        e = f"Energiklass {energi} på skalan A till G. " if energi else ""
        mat = " ".join(MATERIALORD[n])
        return ('<html>' + f["hjalte"].replace(".jpg", "") + ' '
                + f["kort"].replace(".jpg", "") + '<img alt="' + f["alt1"] + '">'
                '<p>Skåpet är ' + T.yttre(n) + ' och rymmer '
                + T.tal(_m.VOLYM[n]) + ' liter. Materialet är ' + mat + '. '
                + e + egen + '</p>'
                '<summary>Tekniska specifikationer</summary>'
                '<summary>Användning och skötsel</summary>'
                '<summary>Vanliga frågor</summary>'
                '<a class="prod" href="/produkt/' + granne[0] + '">'
                '<div class="pname">' + granne[1] + '</div></a>' + extra + '</html>')

    GR = ("minikyl-x", "Minikyl med spegel")
    f9 = FACIT["ef0fa603"]
    srcset = ('<img srcset="https://static.wixstatic.com/media/' + f9["hjalte"]
              + '/v1/fill/w_1080,h_1080,al_c,q_72/file.webp 1080w">')
    fall = [
        ("A rakt tystlöfte i egen text  ", "TYSTLÖFTE",
         sida("ef0fa603", "Skåpet är helt tyst.", GR, energi="E"), True),
        ("B negerat tystlöfte           ", "TYSTLÖFTE",
         sida("ef0fa603", "Den blir aldrig helt ljudlös.", GR, energi="E"), False),
        ("C tyst-ordet hos GRANNEN      ", "TYSTLÖFTE",
         sida("ef0fa603", "", ("minikyl-helt-tyst", "Minikyl helt tyst"), energi="E"), False),
        ("D husmärke i egen text        ", "husmärke",
         sida("ef0fa603", "Tillverkad av HOMCOM.", GR, energi="E"), True),
        # ☠️ SYNTETISKT NUMMER, MED FLIT. Ett första utkast klistrade in ett
        #    VERKLIGT Aosom-artikelnummer som fixtur — alltså exakt den sträng
        #    grinden finns för att stoppa, incheckad i ett PUBLIKT repo.
        #    Fixturen ska matcha MÖNSTRET, inte bära hemligheten.
        ("E artikelnummer live          ", "artikelnummer",
         sida("ef0fa603", "Modell 000-0000X.", GR, energi="E"), True),
        ("F Wix srcset, inget löfte     ", "TYSTLÖFTE",
         sida("ef0fa603", "", GR, srcset, energi="E"), False),
        ("G energiklassen borttagen     ", "ENERGIKLASSEN saknas",
         sida("ef0fa603", "", GR), True),
        ("H energiklass PÅ en utan klass", "PÅHITTAD ENERGIKLASS",
         sida("b3e3aac8", "", GR, energi="A"), True),
        ("I ingen klass på en utan klass", "ENERGIKLASS",
         sida("b3e3aac8", "", GR), False),
        ("J skalan borttagen            ", "ENERGISKALAN saknas",
         sida("ef0fa603", "", GR, energi="E").replace(" på skalan A till G", ""), True),
        ("K frysfack i EGEN skötseltext ", "FRYSFACK",
         sida("ef0fa603", "Frosta av frysfacket när isen tar plats.", GR, energi="E"), True),
        ("L frysfack i SYSKONLÄNKEN     ", "FRYSFACK",
         sida("ef0fa603", "", GR, energi="E").replace(
             "</p>", "</p><p>Finns också som ett kylskåp med frysfack.</p>"), False),
        ("M kylskåp om en kylbox        ", "SÅLD SOM KYLSKÅP",
         sida("b3e3aac8", "Boxen ersätter ett kylskåp.", GR), True),
        ("N negerat kylskåpspåstående   ", "SÅLD SOM KYLSKÅP",
         sida("b3e3aac8", "Den ersätter inte ett kylskåp.", GR), False),
        ("O burktal på kylvagnen        ", "BURKTAL",
         sida("397b845e", "Rymmer 60 burkar.", GR), True),
        ("P låslöfte på kylskåpet       ", "LÅSLÖFTE",
         sida("e6d2e70b", "Dörren har ett nyckellås.", GR, energi="E"), True),
        # ☠️ Q ÄR SUBSTRÄNGSFÄLLAN. Den RIKTIGA skalan är borttagen och kvar
        #    står bara "en hyll**a till g**lasen". En kontroll skriven som
        #    `"a till g" in txt.lower()` hade sett skalan där och tigit.
        # ☠️ R/S ÄR SVG-FALLET, PRÖVAT ÅT BÅDA HÅLL. R är butikens ikon
        #    (attributvärde, inte text); S är samma sträng i VÅR brödtext.
        # ☠️ R MÅSTE ANVÄNDA FLIGHT-FORMEN. Ett första utkast skrev ikonen som
        #    ett HTML-`<svg>`, och det fallet bevisade INGENTING: `synlig_-
        #    meningstext` strök redan taggen, så testet passerade även utan
        #    lagningen. Uppmätt: `<svg>`-formen ger 0 träffar i `syn`,
        #    flight-formen ger 3 — och det är den formen sidan faktiskt bär.
        ("R 0-5 i flight-payloadens d   ", "UTELÄMNAT FÄLT",
         sida("e6d2e70b", "", GR,
              '<script>self.__next_f.push([1,"[\\"$\\",\\"path\\",null,'
              '{\\"fill\\":\\"#34A853\\",\\"d\\":\\"M12 23c2.97 0 5.46-.98 0-5.29z\\"}]"])</script>',
              energi="E"), False),
        ("S 0-5 i VÅR egen brödtext     ", "UTELÄMNAT FÄLT",
         sida("e6d2e70b", "Termostaten går 0-5 °C.", GR, energi="E"), True),
        ("Q hylla till glasen ÄR EJ skalan", "ENERGISKALAN saknas",
         sida("ef0fa603", "En hylla till glasen.", GR,
              energi="E").replace(" på skalan A till G", ""), True),
    ]
    fel = 0
    for etikett, sok, html, ska in fall:
        traff = [x for x in granska(etikett_nyckel(html), html) if sok in x]
        if bool(traff) != ska:
            print(f"  SJÄLVTEST FEL {etikett}: {'inget larm' if ska else 'falsklarm'}")
            fel += 1
    print(f"självtest: {len(fall)} fall, {fel} fel")
    return fel


def etikett_nyckel(html):
    """Vilken produkt självtestets sida gäller — avgjort på HJÄLTEBILDEN."""
    for n, f in FACIT.items():
        if f["hjalte"].replace(".jpg", "") in html:
            return n
    raise SystemExit("☠️ SJÄLVTESTET BYGGDE EN SIDA UTAN HJÄLTEBILD")


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
        print(f"{'OK ' if not fel else 'FEL'} {slug:<42} {len(html):>7} tecken  "
              f"cache={hdr.get('x-vercel-cache')} age={hdr.get('age')}")
        for x in fel:
            print("      ✗", x)
    print(f"\n{grona} av {len(FACIT)} sidor gröna")
    sys.exit(0 if grona == len(FACIT) else 1)
