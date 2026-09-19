# -*- coding: utf-8 -*-
"""Runda 96 — Steg 14: mekanisk grind mot de PUBLICERADE sidorna.

☠️ Detta ar rundans enda helt MEKANISKA textkontroll av det KUNDEN faktiskt
   far. lint.py laser FILEN; den har laser SIDAN. Skillnaden ar precis den
   som slapp igenom runda 94:s "yttterm att": JSON-kroppen skrevs for hand ur
   filen, och den kopieringen ar ogrindad.

⚠️ Runda 96 har dessutom en NY grind fore skrivningen — transkriberings-
   hashen (samma tal fore PATCH och vid ateralasning, inne i samma anrop).
   Den gor det HAR steget till en andra oberoende matning, inte till den
   enda. Bada behovs: hashen bevisar att Wix lagrade det vi skickade, den
   har bevisar att sidan RENDERAR det. En ISR-cache som serverar utkastet
   syns bara har.

⚠️ CACHE-BUST ALLTID (?cb=). ISR-cachen ligger en timme, och en vanlig
   hamtning direkt efter publicering serverar den GAMLA sidan - som ser ut
   precis som en fungerande ny (runda 60:s cachegata).

☠️ GRINDEN MASTE MATA VAR EGEN TEXT, INTE SIDANS CHROME. Runda 95:s forsta
   version fallde alla fyra korrekta sidor pa butikens egna element:
   EU-lager-ribbonen (den enda sanktionerade platsen for ett avsandarland)
   och betalikonernas alt-texter. Landgrinden laser darfor bara
   BESKRIVNINGSDELEN, och alt-grinden kraver att VARA egna alt-texter finns
   och ar inbordes olika - inte att sidans samtliga alt-attribut ar unika.

⚠️ ANTALET BILDER SKILJER MELLAN PRODUKTERNA I DEN HAR RUNDAN. 2bfaf6dd har
   TRE, de ovriga sex: dess tva ovriga bilder bar badgar mitt i motivet och
   gick inte att beskara rena. En grind som krav sex hade fallt den korrekta
   sidan - antalet las darfor ur media-alt.json, aldrig ur en konstant.
"""
import html as htmllib
import json
import re
import random
import subprocess
import sys
import time

import texter as T
import facitgen


FORBJUDET = [
    (r"aosom", "leverantorsnamn"),
    (r"outsunny|homcom|pawhut|vinsetto|aiyaplay", "husmarke"),
    (r"ersatzdach|pavillon|wasserabweisend|oberteil|gartenlaube|vordach",
     "tyska"),
    (r"zuordnung|traubenspalier|ausziehbar|einziehbar|sonnensegel",
     "tyska ur den har familjens bilder"),
    (r"randhöhe|kohlegrau|rostrot|cremeweiss|kaffee|gartenpavillon", "tyska"),
    (r"\b\d{2,3}[A-Za-z]?-\d{3,4}[A-Za-z]{0,3}\b", "artikelnummer"),
    (r"84c-041|84c-175", "leverantorens artikelnummer"),
    (r"tyskland|spanien|skickas från", "avsandarland"),
    (r"kolgrå", "farg som kallan har FEL om"),
    (r"grön|olivgrön", "MATFALLAN: bild 1 ar en miljobild, graset ar inte duken"),
    (r"leverantör|tillverkar|fabrikant|importör",
     "mot kunden ar VI leverantoren"),
    (r"https:/produkt", "trasig relativ lank"),
    (r"runda|steg \d", "intern jargong (#318)"),
]

# ☠️ RAKNEORDEN AR OSYNLIGA FOR EN SIFFERGRIND. "sexton draneringshal" mot
#    "atta" passerade varenda regel i runda 96:s forsta lint - inget TAL
#    andrades. Grinden ar darfor: det ANDRA rakneordet far inte sta pa sidan.
HAL = {"3f9fda98": "åtta", "2bfaf6dd": "åtta",
       "9a3600f8": "åtta", "22dbd372": "sexton"}


def hamta(slug, forsok=4, frobetsluta=None):
    """⚠️ BUTIKEN SVARAR IBLAND 403 PÅ EN HELT GILTIG BEGÄRAN. Uppmätt i
       runda 96: samma slug gav 403 i ett svep och 200 i nästa, sekunder
       isär. En grind som läser 403 som "sidan är trasig" hade fällt fyra
       korrekta sidor — samma klass av falsklarm som runda 95:s första
       livegrind. Ett 403 är därför inget verdikt förrän det upprepats."""
    sista = ("?", "")
    for i in range(forsok):
        u = "https://www.fyndplats.se/produkt/%s?cb=r96c%d-%d" % (
            slug, i, random.randint(100000, 999999))
        p = subprocess.run(["curl", "-s", "-w", "\\n%{http_code}", u],
                           capture_output=True, text=True, timeout=60)
        delar = p.stdout.rsplit("\n", 1)
        sista = (delar[1].strip() if len(delar) > 1 else "?", delar[0])
        if sista[0] == "200":
            return sista
        time.sleep(2 + 3 * i)
    return sista


def var_del(txt):
    """Beskrivningsdelen — fran rubriken "Beskrivning" till syskonkarusellen."""
    i = txt.find("Beskrivning")
    j = txt.find("Liknande produkter", i + 1)
    if j < 0:
        j = len(txt)
    return txt[i:j] if i >= 0 else txt


def synlig(h):
    t = re.sub(r"<script.*?</script>", " ", h, flags=re.S)
    t = re.sub(r"<style.*?</style>", " ", t, flags=re.S)
    return re.sub(r"\s+", " ", htmllib.unescape(re.sub(r"<[^>]+>", " ", t))).strip()


def granska(pid, f, kod, h, alla_alt):
    txt = synlig(h)
    brister = []
    var = ""
    if kod != "200":
        brister.append("HTTP %s" % kod)
    else:
        var = var_del(txt)
        lag = var.lower()
        for m, vad in FORBJUDET:
            tr = re.search(m, lag)
            if tr:
                brister.append("%s: %r" % (vad, tr.group(0)))
        # varje pastaende ur var egen text ska STA pa sidan
        for bit in ("utan stomme", "vattenavvisande", "måttbilden"):
            if bit.lower() not in lag:
                brister.append("saknar %r" % bit)
        # rakneordet: ratt ska finnas, det andra far inte
        ratt = HAL[pid]
        fel_ord = "sexton" if ratt == "åtta" else "åtta"
        if ratt not in lag:
            brister.append("saknar rakneordet %r" % ratt)
        if re.search(r"(?<![a-zåäö])%s(?![a-zåäö])" % fel_ord, lag):
            brister.append("fel rakneord pa sidan: %r" % fel_ord)
        # ☠️ VAR EGEN TEXT ORDAGRANT. Enda kontrollen som kan fanga ett
        #    stavfel som uppstod nar JSON-kroppen skrevs for hand.
        kalla = facitgen.synlig(T.beskrivning(pid))
        for bit in re.split(r"(?<=[.!?]) ", kalla):
            bit = bit.strip()
            if len(bit) >= 45 and bit not in var:
                brister.append("saknas ordagrant: %r" % bit[:70])
        # alt-texter: VARA ska finnas och vara inbordes olika
        alt = [htmllib.unescape(a) for a in re.findall(r'alt="([^"]{6,})"', h)]
        vara = alla_alt[pid]
        saknade = [a for a in vara if a not in alt]
        if saknade:
            brister.append("alt-text saknas pa sidan: %r" % saknade[0][:60])
        if len(set(vara)) != len(vara):
            brister.append("vara egna alt-texter ar inte inbordes unika")
        # korslankarna ska finnas och peka ratt
        for lank in f["lankar"]:
            if lank.split("/produkt/")[-1] not in h:
                brister.append("saknar korslank till %s"
                               % lank.split("/produkt/")[-1])
        # ⚠️ SKU RENDERAS INTE — grinda aldrig pa den (runbookens regel).
    return brister


def kor():
    facit = json.load(open("facit.json", encoding="utf-8"))
    alla_alt = json.load(open("media-alt.json", encoding="utf-8"))
    fel = 0
    # ☠️ EN PATCH SYNS INTE DIREKT, OCH CACHE-BUSTEN HJÄLPER INTE.
    #    Uppmätt i runda 96: efter en skrivning svarade sidan 200 med den
    #    GAMLA texten på en helt färsk `?cb=`, och den nya trettio sekunder
    #    senare. Ett svep som läser den första som "texten saknas" fäller en
    #    korrekt sida — samma familj som runda 60:s cachegåta, men åt andra
    #    hållet: där var det utkastet som serverades, här den förra versionen.
    #    Grinden gör därför om HELA kontrollen när bristerna är av
    #    färskhetstyp, och dömer först när de står kvar.
    FARSKHET = ("saknas ordagrant", "saknar korslank", "saknar '", "HTTP")
    for pid in T.PRODUKTER:
        f = facit[pid]
        for omtag in range(4):
            kod, h = hamta(f["slug"])
            brister = granska(pid, f, kod, h, alla_alt)
            if not brister or not all(b.startswith(FARSKHET) for b in brister):
                break
            time.sleep(15)
        txt = synlig(h)
        var = var_del(txt) if kod == "200" else ""
        print("%s  %-40s HTTP %s  %d tecken i var del  %d alt  %s"
              % (pid, f["slug"][:40], kod, len(var), len(alla_alt[pid]),
                 "OK" if not brister else "%d BRISTER" % len(brister)))
        for b in brister:
            print("    x", b)
            fel += 1
    print("\n%s" % ("0 brister pa fyra live-sidor" if not fel
                    else "%d brister" % fel))
    return fel


if __name__ == "__main__":
    sys.exit(1 if kor() else 0)
