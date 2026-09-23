# -*- coding: utf-8 -*-
"""Runda 94 — Steg 14: mekanisk grind mot de PUBLICERADE sidorna.

☠️ Detta ar rundans enda helt MEKANISKA textkontroll. Grinden i lint.py laser
   filen; den har laser vad kunden faktiskt far. Skillnaden ar just den som
   slapp igenom "yttterm att" i tva av fyra beskrivningar: JSON-kroppen
   skrevs for hand ur filen, och den kopieringen ar ogrindad.

⚠️ CACHE-BUST ALLTID (?cb=). ISR-cachen ligger en timme, och en vanlig hamtning
   direkt efter publicering serverar den GAMLA sidan - som ser ut precis som
   en fungerande ny.

☠️ GRINDEN MASTE MATA VAR EGEN TEXT, INTE SIDANS CHROME. Forsta versionen
   fallde alla fyra korrekta sidor pa tva punkter, bada butikens egna:

   · "Skickas fran EU-lager - ingen importtull" ar EU-lager-ribbonen, den enda
     sanktionerade platsen for ett avsandarland.
   · "13/19 unika alt-texter" - de sex dubbletterna var Klarna x3, Mastercard,
     Amex och Apple Pay, plus hjaltebilden som star bade som huvudbild och som
     galleripost.

   Landgrinden laser darfor bara BESKRIVNINGSDELEN, och alt-grinden kraver att
   VARA FEM alt-texter finns och ar inbordes olika - inte att sidans samtliga
   alt-attribut ar unika. Samma lardom som runda 60: en grind som fyrar pa
   varje korrekt sida lar mottagaren att sluta lasa.
"""
import html as htmllib
import json
import re
import subprocess
import sys

import texter as T
import facitgen


FORBJUDET = [
    (r"aosom", "leverantorsnamn"),
    (r"outsunny|homcom|pawhut|vinsetto|aiyaplay", "husmarke"),
    (r"ersatzdach|pavillon|wasserabweisend|oberteil|gartenlaube|vordach", "tyska"),
    (r"\b\d{2,3}[A-Za-z]?-\d{3,4}[A-Za-z]{0,3}\b", "artikelnummer"),
    (r"01-0867", "leverantorens serienummer"),
    (r"tyskland|spanien|skickas från", "avsandarland"),
    (r"ljusgrå", "matt falsk farg"),
    (r"leverantör", "mot kunden ar VI leverantoren"),
    (r"https:/produkt", "trasig relativ lank"),
]


def hamta(slug):
    u = "https://www.fyndplats.se/produkt/%s?cb=r94" % slug
    p = subprocess.run(["curl", "-s", "-w", "\\n%{http_code}", u],
                       capture_output=True, text=True, timeout=60)
    delar = p.stdout.rsplit("\n", 1)
    return (delar[1].strip() if len(delar) > 1 else "?"), delar[0]


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


def kor():
    facit = json.load(open("facit.json", encoding="utf-8"))
    fel = 0
    for pid in T.PRODUKTER:
        f = facit[pid]
        kod, h = hamta(f["slug"])
        txt = synlig(h)
        brister = []
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
            for bit in ("utan stomme", "vattenavvisande", "UPF 30+"):
                if bit.lower() not in lag:
                    brister.append("saknar %r" % bit)
            # ☠️ VAR EGEN TEXT ORDAGRANT. Detta ar den enda kontroll som kan
            #    fanga ett stavfel som uppstod nar JSON-kroppen skrevs for hand.
            kalla = facitgen.synlig(T.beskrivning(pid))
            for bit in re.split(r"(?<=[.!?]) ", kalla):
                bit = bit.strip()
                if len(bit) >= 45 and bit not in var:
                    brister.append("saknas ordagrant: %r" % bit[:70])
            # alt-texter: VARA fem ska finnas och vara inbordes olika
            alt = [htmllib.unescape(a) for a in re.findall(r'alt="([^"]{6,})"', h)]
            vara = [a for a in json.load(open("media-alt.json", encoding="utf-8"))[pid]]
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
        print("%s  %s  HTTP %s  %d tecken i var del  %s"
              % (pid, f["slug"][:42], kod, len(var_del(txt)) if kod == "200" else 0,
                 "OK" if not brister else "%d BRISTER" % len(brister)))
        for b in brister:
            print("    x", b)
            fel += 1
    print("\n%s" % ("0 brister pa fyra live-sidor" if not fel else "%d brister" % fel))
    return fel


if __name__ == "__main__":
    sys.exit(1 if kor() else 0)
