# -*- coding: utf-8 -*-
"""Runda 118 Steg 14 — läs de ÅTTA publicerade sidorna som kunden ser dem.

☠️ FACIT LÄSTES UR KATALOGEN EFTER PUBLICERINGEN (`facit-live.json`), inte
   kopierat ur rundans egna filer. Två filer som bär samma tal är just den
   tvilling huset förlorat tid på flera gånger.

Sju uppmjukningar ärvs, alla köpta med ett falsklarm, och alla bor i
`grindar.py` så nästa runda får dem utan att veta om dem:

  1. Ord- och märkeskontroller läser sidans EGEN text, med grannarnas
     produktnamn strukna — sex kanaler (uppgift #398, #431, #433).
  2. Bildadresser stryks — Wix `srcset` bär `1080w`, en bildbredd (#403).
  3. SVG-geometri stryks — butikens ikoner bär tal i `d`-attribut (#413).
  4. Grannens SLUG stryks också, inte bara namnet (#431).
  5. En FRÅGA är ingen granne — JSON-LD:s FAQ använder `"name"` (#430).
  6. Butikens egen EU-lager-ribbon stryks, på BÅDA ställena (#434).
  7. ☠️ Sidans EGNA påståenden skiljs från dess KORSHÄNVISNINGAR, och
     RSC-payloaden droppas — den bär samma stycke en gång till, escapad
     (`egna_meningar`, runda 118; hela mätningen står vid funktionen).

☠️ RUNDANS EGEN SIGNATUR ÄR EGENSKAPERNA, inte materialet. Nio nästan lika
   vagnar, där bara EN viks ihop, bara EN kommer färdigmonterad, bara TRE tål
   att stå ute och bara TVÅ rullas som en skottkärra. Live-grinden är sista
   stället där en egenskap som kryper mellan två sidor kan fångas — och den
   enda som ser den RENDERADE sidan, alltså också butikens egna moduler.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                              # noqa: E402
sys.path.insert(0, HAR)
from grind import (FORBJUDET, TONGRINDAR, NEGERANDE_GRINDAR,     # noqa: E402
                   MASSIVT, ENSKILDA, TVA_HJUL, FYRA_HJUL, INGAR)

FACIT = json.load(open(os.path.join(HAR, "facit-live.json"), encoding="utf-8"))
BAS = "https://www.fyndplats.se/produkt/"
FLIKAR = ["Tekniska specifikationer", "Montering och skötsel", "Vanliga frågor"]

SVG_GEOMETRI = re.compile(r'\b(?:d|points|viewBox|transform)="[^"]*"'
                          r'|"(?:d|points|viewBox|transform)":"[^"]*"')
BILDADRESS = re.compile(r"https?://static\.wixstatic\.com/\S+|\b\d+w\b")


# ☠️ INGEN av de åtta publicerade får säga massivt trä. Bara ca20d60e har
#    `Massivholz` i leverantörsdatan, och den är INTE publicerad (saldo 0).
FAR_SAGA_MASSIVT = set()


def granska(nyckel, html):
    f = FACIT[nyckel]
    fel = []
    # ☠️ ORDNINGEN ÄR INTE VALFRI. `BILDADRESS` matchar `\S+` och åt halva
    #    grannens namn när den kördes först (runda 117). Stryk grannarna
    #    FÖRST, ur rå HTML.
    utan_grannar = G.strak_grannar(html, html, f["slug"], f["namn"])
    ren = SVG_GEOMETRI.sub(" ", BILDADRESS.sub(" ", G.EU_RIBBON.sub(" ", utan_grannar)))
    rensad = G.synlig_meningstext(ren)
    egen_syn = G.synlig_meningstext(
        SVG_GEOMETRI.sub(" ", BILDADRESS.sub(" ", G.EU_RIBBON.sub(" ", html))))

    # Sidans EGNA meningar, med korshänvisningarna för sig. Ordningen mellan
    # namn- och slug-strykningen är kritisk och bor i `grindar.py`.
    egna, kors = G.egna_meningar(
        html, f["slug"], f["namn"],
        lambda t: SVG_GEOMETRI.sub(" ", BILDADRESS.sub(" ", G.EU_RIBBON.sub(" ", t))))

    # ── NÄRVARO prövas FÖRE strykningen (uppgift #430) ───────────────────
    if f["namn"] not in egen_syn:
        fel.append("PRODUKTNAMNET saknas på sidan")
    for flik in FLIKAR:
        if flik not in egen_syn:
            fel.append(f"FLIKEN {flik!r} saknas")
    for tal in f["tal"]:
        if tal not in egen_syn:
            fel.append(f"TALET {tal!r} saknas i sidans text")
    if f["farg"] not in egen_syn.lower():
        fel.append(f"FÄRGEN {f['farg']!r} saknas")
    t = re.search(r"<title>(.*?)</title>", html, re.S)
    if t and t.group(1).strip() != f["titel"]:
        fel.append(f"TITELN är {t.group(1).strip()[:70]!r}, väntade {f['titel']!r}")

    # ── FÖRBJUDET prövas på rensad — grannens ord är inte vårt fel ───────
    for monster, etikett in FORBJUDET:
        if etikett in ("RELATIV LÄNK", "WIX STRIPPAR <br>"):
            continue          # gäller källan, inte den renderade sidan
        m = monster.search(rensad)
        if m:
            fel.append(f"{etikett} på sidan: {m.group(0)!r}")
    for monster, etikett in TONGRINDAR:
        m = G.loftestraff(monster, rensad)
        if m:
            fel.append(f"{etikett}: …{G.mening_kring(rensad, m.start()).strip()[:100]}…")
    for monster, etikett in NEGERANDE_GRINDAR:
        m = monster.search(rensad)
        if m:
            fel.append(f"{etikett}: …{G.mening_kring(rensad, m.start()).strip()[:100]}…")

    # ── Materialgrinden ──────────────────────────────────────────────────
    if nyckel not in FAR_SAGA_MASSIVT:
        m = MASSIVT.search(rensad)
        if m:
            fel.append(f"MASSIVT TRÄ: …{G.mening_kring(rensad, m.start()).strip()[:100]}…")

    # ── Rundans egen risk: en egenskap som kryper mellan två sidor ───────
    #    ⚠️ UTOMHUSGRINDEN körs INTE här. Butikens egna moduler talar om
    #    trädgård och uteplats i sina kategorilänkar och rekommendationer,
    #    och de orden är inte sidans påstående. Grinden gjorde sitt jobb i
    #    `grind.py`, på KÄLLAN, där bara sidans egen text finns.
    for monster, agare, etikett in ENSKILDA:
        if etikett == "UTOMHUSBRUK":
            continue
        m = monster.search(egna)
        if m and nyckel not in agare:
            fel.append(f"{etikett} på en sida som inte har det: "
                       f"…{G.mening_kring(egna, m.start()).strip()[:100]}…")
    if nyckel in TVA_HJUL and FYRA_HJUL.search(egna):
        fel.append("FYRA HJUL på en sida vars vagn har TVÅ")

    # …och länkmeningarna mot MÅLETS facit. Utan det hade delningen ovan bara
    # gjort korshänvisningarna OGRANSKADE i stället för felgranskade — och en
    # länk som beskriver grannen fel är ett fel på den HÄR sidan.
    for mal, mening in kors:
        malnycklar = {k for k, v in FACIT.items() if v["slug"] in mal}
        for monster, agare, etikett in ENSKILDA:
            if etikett == "UTOMHUSBRUK":
                continue
            if monster.search(mening) and malnycklar and not (malnycklar & agare):
                fel.append(f"KORSLÄNK påstår {etikett} om {sorted(malnycklar)}: "
                           f"…{mening.strip()[:100]}…")

    # ── Leveranslöften på den LEVERERADE sidan ───────────────────────────
    #    På `egna` av samma skäl: ett "ingår" i en korshänvisning är grannens.
    fel += G.leveransloften(egna, INGAR, nyckel)
    return fel


FALL = [
    ("grannens namn fäller inte oss", "764a3efc",
     lambda h: h + '<script>{"slug":"annan","name":"Köksvagn i massivt gummiträ"}</script>', 0),
    ("grannens slug fäller inte oss", "764a3efc",
     lambda h: h + '<script>{"slug":"hopfallbar-barvagn-bambu-66-cm"}</script>', 0),
    ("egen fråga raderas INTE som granne", "764a3efc",
     lambda h: h.replace("</body>", '<script>{"name":"Hur mycket tål den?"}</script></body>'), 0),
    ("bildbredd 1080w är inget påstående", "764a3efc",
     lambda h: h + '<img srcset="https://static.wixstatic.com/x.jpg 1080w">', 0),
    ("grannens namn i div.pname fäller inte oss", "764a3efc",
     lambda h: h + '<div class="pname">Hopfällbar barvagn i bambu 66 cm</div>', 0),
    ("grannens namn i alt fäller inte oss", "764a3efc",
     lambda h: h + '<img alt="Hopfällbar barvagn i bambu 66 cm">', 0),
    ("butikens EU-ribbon fäller inte oss", "764a3efc",
     lambda h: h + '<a href="/eu-lager-garanti">Skickas från EU-lager – ingen importtull.</a>', 0),
    ("massivt trä fälls", "764a3efc",
     lambda h: h.replace("</body>", "<p>Skivan är massivt ekträ.</p></body>"), 1),
    ("husmärke fälls", "764a3efc",
     lambda h: h.replace("</body>", "<p>Tillverkad av HOMCOM.</p></body>"), 1),
    ("leveranslöfte fälls", "764a3efc",
     lambda h: h.replace("</body>", "<p>Fyra glas ingår i leveransen.</p></body>"), 1),
    # ☠️ DE TRE SOM KÖPTES AV ETT FALSKLARM. Vår EGEN korshänvisning står i
    #    BÅDA serialiseringarna, och bara den ena var synlig för delningen.
    ("egen korslänk i DOM:en fäller inte oss", "764a3efc",
     lambda h: h.replace("</body>", '<p><a href="https://www.fyndplats.se/'
                         'produkt/hopfallbar-barvagn-bambu-66-cm" target="_self">'
                         'Hopfällbar barvagn i bambu</a>.</p></body>'), 0),
    ("egen korslänk i RSC-payloaden fäller inte oss", "764a3efc",
     lambda h: h.replace("</body>", '<script>self.__next_f.push([1,"'
                         '\\u003cp\\u003e\\u003ca href=\\"https://www.fyndplats.se/'
                         'produkt/hopfallbar-barvagn-bambu-66-cm\\" target=\\"_self\\"'
                         '\\u003eHopfällbar barvagn i bambu\\u003c/a\\u003e.'
                         '\\u003c/p\\u003e"])</script></body>'), 0),
    # …och den som bevisar att delningen inte bara TYSTAR korshänvisningarna:
    ("korslänk som LJUGER om grannen fälls", "764a3efc",
     lambda h: h.replace("</body>", '<p><a href="https://www.fyndplats.se/'
                         'produkt/koksvagn-fyra-utdragskorgar-ek" target="_self">'
                         'Hopfällbar köksvagn i ek</a>.</p></body>'), 1),
    ("hopfällning på fel sida fälls", "764a3efc",
     lambda h: h.replace("</body>", "<p>Vagnen viks ihop när den inte används.</p></body>"), 1),
    ("monteringsfrihet på fel sida fälls", "764a3efc",
     lambda h: h.replace("</body>", "<p>Den kommer färdigmonterad.</p></body>"), 1),
    ("fyra hjul på en tvåhjuling fälls", "8a73caf4",
     lambda h: h.replace("</body>", "<p>Vagnen har fyra hjul.</p></body>"), 1),
    ("saknat tal fälls", "764a3efc",
     lambda h: h.replace("39,5 × 24 × 82 cm", "X"), 1),
    ("saknad flik fälls", "764a3efc", lambda h: h.replace("Vanliga frågor", "X"), 1),
]


def sjalvtest(sidor):
    fel = []
    for namn, nyckel, skada, minst in FALL:
        bas = sidor[nyckel]
        n = len(granska(nyckel, skada(bas)))
        grund = len(granska(nyckel, bas))
        if minst == 0 and n > grund:
            fel.append(f"{namn}: FALSKLARM ({n} mot {grund} utan skadan)")
        if minst and n <= grund:
            fel.append(f"{namn}: grinden såg det INTE ({n} mot {grund})")
    return fel


if __name__ == "__main__":
    sidor, tot = {}, 0
    for nyckel, f in FACIT.items():
        html, hdr = G.hamta_isr(BAS + f["slug"])
        sidor[nyckel] = html
        print(f"    hämtad {nyckel} {len(html)//1024} kB, cache {hdr.get('x-vercel-cache','?')}")
    st = sjalvtest(sidor)
    print(f"\nlive-självtest: {len(FALL)} fall, {len(st)} fel")
    for x in st:
        print("  ☠️", x)
    for nyckel, html in sidor.items():
        fl = granska(nyckel, html)
        tot += len(fl)
        print(("FEL " if fl else "OK  ") + f"{nyckel}  {FACIT[nyckel]['slug']}  ({len(html)//1024} kB)")
        for x in fl:
            print("      ✗", x)
    print(f"\n{len(FACIT)} sidor, {tot} fel, {len(st)} fel i självtestet")
    sys.exit(1 if (tot or st) else 0)
