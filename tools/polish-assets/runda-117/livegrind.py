# -*- coding: utf-8 -*-
"""Runda 117 Steg 14 — läs de ÅTTA publicerade sidorna som kunden ser dem.

☠️ FACIT LÄSTES UR KATALOGEN EFTER PUBLICERINGEN (`facit-live.json`), inte
   kopierat ur rundans egna filer. Två filer som bär samma tal är just den
   tvilling huset förlorat tid på flera gånger.

Fem uppmjukningar ärvs, alla köpta med ett falsklarm i en tidigare runda:

  1. Ord- och märkeskontroller läser sidans EGEN text, med grannarnas
     produktnamn strukna (runda 111, uppgift #398).
  2. Bildadresser stryks — Wix `srcset` bär `1080w`, en bildbredd och inget
     påstående (runda 112, uppgift #403).
  3. SVG-geometri stryks — butikens ikoner bär tal i `d`-attribut (uppgift #413).
  4. Grannens SLUG stryks också, inte bara hennes namn (runda 116, uppgift #431).
     Här är risken konkret: en granne kan heta `koksvagn-…-gummitraskiva-vit`,
     och `gummiträ` är ett materialpåstående grinden prövar.
  5. En FRÅGA är ingen granne — JSON-LD:s FAQ använder `"name"` för frågan, så
     sidans EGNA frågor hamnade i grannlistan och ströks ur texten (uppgift #430).

☠️ RUNDANS EGEN SIGNATUR ÄR MATERIALET. Sex av åtta sidor har en skiva som är
   DEKOR (spånskiva/MDF med ekfärgad yta); bara grupp C har massivt gummiträ.
   Live-grinden är sista stället där ett "massivt trä" på fel sida kan fångas.
"""
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                              # noqa: E402
sys.path.insert(0, HAR)
import matt as M                                                 # noqa: E402
from grind import FORBJUDET, TONGRINDAR, NEGERANDE_GRINDAR, MASSIVT  # noqa: E402

FACIT = json.load(open(os.path.join(HAR, "facit-live.json"), encoding="utf-8"))
BAS = "https://www.fyndplats.se/produkt/"
FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]

SVG_GEOMETRI = re.compile(r'\b(?:d|points|viewBox|transform)="[^"]*"'
                          r'|"(?:d|points|viewBox|transform)":"[^"]*"')
BILDADRESS = re.compile(r"https?://static\.wixstatic\.com/\S+|\b\d+w\b")


# ☠️ GRANNSTRYKNINGEN BOR I DEN DELADE MODULEN sedan runda 117. Den här filen
#    bar först egna kopior av `_grannar` och `_grannslugs` — och kopian kände
#    fyra kanaler av sex. Grannen "Träbänk 175 cm i massiv furu för tre
#    personer" stod i `<div class="pname">` och i `alt="…"`, aldrig som en
#    `"name"`-nyckel, och fällde materialgrinden på en korrekt köksvagnssida.
#    Kanalerna hittas en i taget; en delad modul är det enda som gör att nästa
#    runda ärver alla sex utan att veta om dem.


def granska(nyckel, html):
    f = FACIT[nyckel]
    fel = []
    # ── Sidans EGEN text ─────────────────────────────────────────────────
    # ☠️ ORDNINGEN ÄR INTE VALFRI. `BILDADRESS` matchar `\S+`, alltså fram till
    #    första blanksteget — och i flight-payloaden finns inga blanksteg på
    #    långa sträckor. Kördes den FÖRE grannstrykningen åt den halva grannens
    #    namn (`…file.webp\",\"alt\":\"Träbänk`) och lämnade `175 cm i massiv
    #    furu för tre personer` kvar som ett namn ingen replace längre matchar.
    #    Uppmätt i runda 117: materialgrinden fällde en korrekt sida på ordet
    #    `massiv` som tillhörde en granne. Stryk grannarna FÖRST, ur rå HTML.
    utan_grannar = G.strak_grannar(html, html, f["slug"], f["namn"])
    ren = SVG_GEOMETRI.sub(" ", BILDADRESS.sub(" ", G.EU_RIBBON.sub(" ", utan_grannar)))
    rensad = G.synlig_meningstext(ren)
    # Närvarokontrollerna läser sidan FÖRE strykningen (uppgift #430).
    egen_syn = G.synlig_meningstext(
        SVG_GEOMETRI.sub(" ", BILDADRESS.sub(" ", G.EU_RIBBON.sub(" ", html))))

    # ── NÄRVARO prövas på egen_syn, FÖRE strykningen (uppgift #430) ───────
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
    if "<title>" in html:
        t = re.search(r"<title>(.*?)</title>", html, re.S)
        if t and t.group(1).strip() != f["titel"]:
            fel.append(f"TITELN är {t.group(1).strip()[:70]!r}, väntade {f['titel']!r}")

    # ── FÖRBJUDET prövas på rensad — grannens ord är inte vårt fel ────────
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

    # ── Materialgrinden: massivt trä bara på grupp C ──────────────────────
    if M.GRUPP[nyckel] != "C":
        m = MASSIVT.search(rensad)
        if m:
            fel.append(f"MASSIVT TRÄ på grupp {M.GRUPP[nyckel]}-sida: "
                       f"…{G.mening_kring(rensad, m.start()).strip()[:100]}…")

    # ── Leveranslöften på den LEVERERADE sidan ────────────────────────────
    fel += G.leveransloften(rensad, ["köksvagn", "monteringsanvisning"], nyckel)
    return fel


FALL = [
    ("grannens namn fäller inte oss", "63235957",
     lambda h: h + '<script>{"slug":"annan-sida","name":"Köksvagn i massivt gummiträ"}</script>', 0),
    ("grannens slug fäller inte oss", "63235957",
     lambda h: h + '<script>{"slug":"koksvagn-109-cm-gummitraskiva-vit"}</script>', 0),
    ("egen fråga raderas INTE som granne", "63235957",
     lambda h: h.replace("</body>", '<script>{"name":"Hur mycket tål vagnen?"}</script></body>'), 0),
    ("bildbredd 1080w är inget påstående", "63235957",
     lambda h: h + '<img srcset="https://static.wixstatic.com/x.jpg 1080w">', 0),
    ("massivt trä på grupp A fälls", "63235957",
     lambda h: h.replace("</body>", "<p>Skivan är massivt ekträ.</p></body>"), 1),
    ("husmärke fälls", "63235957",
     lambda h: h.replace("</body>", "<p>Tillverkad av HOMCOM.</p></body>"), 1),
    ("leveranslöfte fälls", "63235957",
     lambda h: h.replace("</body>", "<p>En bestickinsats ingår i lådan.</p></body>"), 1),
    ("grannens namn i <div class=pname> fäller inte oss", "63235957",
     lambda h: h + '<div class="pname">Träbänk 175 cm i massiv furu för tre personer</div>', 0),
    ("grannens namn i alt-attribut fäller inte oss", "63235957",
     lambda h: h + '<img alt="Träbänk 175 cm i massiv furu för tre personer">', 0),
    ("butikens EU-ribbon fäller inte oss", "63235957",
     lambda h: h + '<a href="/eu-lager-garanti">Skickas från EU-lager – ingen importtull.</a>', 0),
    ("saknat tal fälls", "63235957", lambda h: h.replace("106 × 42 × 87 cm", "X"), 1),
    ("saknad flik fälls", "63235957", lambda h: h.replace("Vanliga frågor", "X"), 1),
]


def sjalvtest(bas_html):
    fel = []
    for namn, nyckel, skada, minst in FALL:
        n = len(granska(nyckel, skada(bas_html)))
        grund = len(granska(nyckel, bas_html))
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
    st = sjalvtest(sidor["63235957"])
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
