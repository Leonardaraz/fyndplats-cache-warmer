# -*- coding: utf-8 -*-
"""Runda 119 Steg 14 — läs de NIO publicerade sidorna som kunden ser dem.

☠️ FACIT LÄSTES UR KATALOGEN EFTER PUBLICERINGEN (`facit-live.json`), inte
   kopierat ur rundans egna filer. Två filer som bär samma tal är just den
   tvilling huset förlorat tid på flera gånger.

Sju uppmjukningar ärvs, alla köpta med ett falsklarm, och alla bor i
`grindar.py` så rundan får dem utan att veta om dem:

  1. Ord- och märkeskontroller läser sidans EGEN text, med grannarnas
     produktnamn strukna — sex kanaler (uppgift #398, #431, #433).
  2. Bildadresser stryks — Wix `srcset` bär `1080w`, en bildbredd (#403).
  3. SVG-geometri stryks — butikens ikoner bär tal i `d`-attribut (#413).
  4. Grannens SLUG stryks också, inte bara namnet (#431).
  5. En FRÅGA är ingen granne — JSON-LD:s FAQ använder `"name"` (#430).
  6. Butikens egen EU-lager-ribbon stryks, på BÅDA ställena (#434).
  7. Sidans EGNA påståenden skiljs från dess KORSHÄNVISNINGAR, och
     RSC-payloaden droppas — den bär samma stycke en gång till, escapad
     (`egna_meningar`, runda 118, uppgift #437).

☠️ RUNDANS EGEN SIGNATUR ÄR EGENSKAPERNA, inte materialet. Nio nästan lika
   köksvagnar och köksöar, där bara TRE har en utfällbar skiva, bara TRE har
   soft close, bara TVÅ rullar på fem hjul, bara EN är i bambu med rottingdörr
   och bara EN är byggd för att stå ute. Live-grinden är sista stället där en
   egenskap som kryper mellan två sidor kan fångas — och den enda som ser den
   RENDERADE sidan, alltså också alt-texterna och butikens egna moduler.
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
                   MASSIVT, ENSKILDA, FEM_HJUL_RE, FYRA_HJUL, INGAR)
import matt as M                                                 # noqa: E402

FACIT = json.load(open(os.path.join(HAR, "facit-live.json"), encoding="utf-8"))
BAS = "https://www.fyndplats.se/produkt/"
FLIKAR = ["Tekniska specifikationer", "Montering och skötsel", "Vanliga frågor"]

SVG_GEOMETRI = re.compile(r'\b(?:d|points|viewBox|transform)="[^"]*"'
                          r'|"(?:d|points|viewBox|transform)":"[^"]*"')
BILDADRESS = re.compile(r"https?://static\.wixstatic\.com/\S+|\b\d+w\b")

# ☠️ INGEN av de nio får säga massivt trä. `Kautschukholz` gäller SKIVAN på
#    c86ff1a6, `Kiefernholz` skivan på 6cf7cfcf och dac7a904 — stommen är
#    spånskiva eller MDF i alla tre.
FAR_SAGA_MASSIVT = set()

# ⚠️ TVÅ AV RUNDANS FYRA ENSKILDA GRINDAR KAN INTE KÖRAS PÅ DEN RENDERADE
#    SIDAN, och skälen är olika:
#
#    UTOMHUSBRUK — butikens egna moduler talar om trädgård och uteplats i
#    kategorilänkar och rekommendationer. Orden är inte sidans påstående.
#
#    BAMBU OCH ROTTING — samma sak: en kategorirad eller ett rekommenderat
#    kort kan bära ordet utan att sidan påstår något. Grinden gjorde sitt
#    jobb i `grind.py`, på KÄLLAN, där bara sidans egen text finns.
LIVE_UNDANTAG = {"UTOMHUSBRUK", "BAMBU OCH ROTTING"}


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
    for monster, agare, etikett in ENSKILDA:
        if etikett in LIVE_UNDANTAG:
            continue
        m = monster.search(egna)
        if m and nyckel not in agare:
            fel.append(f"{etikett} på en sida som inte har det: "
                       f"…{G.mening_kring(egna, m.start()).strip()[:100]}…")

    # ☠️ HJULANTALET. Två av nio har FEM hjul. Ett fel antal är ett påstående
    #    kunden märker vid uppackning, och just den sortens fel som glider
    #    mellan nio nästan lika sidor.
    if nyckel in M.FEM_HJUL and FYRA_HJUL.search(egna):
        fel.append("FYRA HJUL på en sida vars möbel har FEM")
    if nyckel not in M.FEM_HJUL and FEM_HJUL_RE.search(egna):
        fel.append("FEM HJUL på en sida vars möbel har FYRA")

    # …och länkmeningarna mot MÅLETS facit. Utan det hade delningen ovan bara
    # gjort korshänvisningarna OGRANSKADE i stället för felgranskade — och en
    # länk som beskriver grannen fel är ett fel på den HÄR sidan.
    for mal, mening in kors:
        malnycklar = {k for k, v in FACIT.items() if v["slug"] in mal}
        for monster, agare, etikett in ENSKILDA:
            if etikett in LIVE_UNDANTAG:
                continue
            if monster.search(mening) and malnycklar and not (malnycklar & agare):
                fel.append(f"KORSLÄNK påstår {etikett} om {sorted(malnycklar)}: "
                           f"…{mening.strip()[:100]}…")

    # ── Leveranslöften på den LEVERERADE sidan ───────────────────────────
    fel += G.leveransloften(egna, INGAR, nyckel)
    return fel


FALL = [
    # ── De sju ärvda uppmjukningarna: inget av dem får ge ett falsklarm ──
    ("grannens namn fäller inte oss", "ad390a36",
     lambda h: h + '<script>{"slug":"annan","name":"Köksvagn i massivt gummiträ"}</script>', 0),
    ("grannens slug fäller inte oss", "ad390a36",
     lambda h: h + '<script>{"slug":"kokso-115-cm-utfallbar-skiva-kryddhyllor"}</script>', 0),
    ("egen fråga raderas INTE som granne", "ad390a36",
     lambda h: h.replace("</body>", '<script>{"name":"Hur bred är vagnen?"}</script></body>'), 0),
    ("bildbredd 1080w är inget påstående", "ad390a36",
     lambda h: h + '<img srcset="https://static.wixstatic.com/x.jpg 1080w">', 0),
    ("grannens namn i div.pname fäller inte oss", "ad390a36",
     lambda h: h + '<div class="pname">Köksö 115 cm med utfällbar skiva</div>', 0),
    ("grannens namn i alt fäller inte oss", "ad390a36",
     lambda h: h + '<img alt="Köksö 115 cm med utfällbar skiva">', 0),
    # ☠️ DEN SJÄLVFÖRVÅLLADE KANALEN. Butikens Föregående/Nästa-rad visar
    #    grannarna INOM KATEGORIN — den fanns inte förrän rundans eget Steg 10
    #    gav produkterna en. Grannens namn står där i BÅDA serialiseringarna.
    ("grannens namn i pbrowse-namn fäller inte oss", "ad390a36",
     lambda h: h + '<span class="pbrowse-namn">Köksö 129 cm med utdragsbrickor '
                   '– 120 cm skiva, dörrfack och fem hjul</span>', 0),
    ("…och i payloadens pbrowse-namn", "ad390a36",
     lambda h: h + '<script>[\\"$\\",\\"span\\",null,{\\"className\\":'
                   '\\"pbrowse-namn\\",\\"children\\":\\"Köksö 129 cm med '
                   'utdragsbrickor – 120 cm skiva, dörrfack och fem hjul\\"}]</script>', 0),
    ("butikens EU-ribbon fäller inte oss", "ad390a36",
     lambda h: h + '<a href="/eu-lager-garanti">Skickas från EU-lager – ingen importtull.</a>', 0),
    ("egen korslänk i DOM:en fäller inte oss", "ad390a36",
     lambda h: h.replace("</body>", '<p><a href="https://www.fyndplats.se/'
                         'produkt/kokso-115-cm-utfallbar-skiva-kryddhyllor" target="_self">'
                         'Köksö med utfällbar skiva</a>.</p></body>'), 0),
    ("egen korslänk i RSC-payloaden fäller inte oss", "ad390a36",
     lambda h: h.replace("</body>", '<script>self.__next_f.push([1,"'
                         '\\u003cp\\u003e\\u003ca href=\\"https://www.fyndplats.se/'
                         'produkt/kokso-115-cm-utfallbar-skiva-kryddhyllor\\" '
                         'target=\\"_self\\"\\u003eKöksö med utfällbar skiva'
                         '\\u003c/a\\u003e.\\u003c/p\\u003e"])</script></body>'), 0),
    # ── …och det som BEVISAR att delningen inte bara TYSTAR korslänkarna ──
    ("korslänk som LJUGER om grannen fälls", "ad390a36",
     lambda h: h.replace("</body>", '<p><a href="https://www.fyndplats.se/'
                         'produkt/koksvagn-lantstil-furuskiva-tre-lador" target="_self">'
                         'Köksvagn med utfällbar skiva</a>.</p></body>'), 1),
    # ── Rundans egna egenskaper på fel sida ──────────────────────────────
    ("utfällbar skiva på fel sida fälls", "ad390a36",
     lambda h: h.replace("</body>", "<p>Skivan fälls ut när du behöver mer yta.</p></body>"), 1),
    ("soft close på fel sida fälls", "ad390a36",
     lambda h: h.replace("</body>", "<p>Dörren har soft close.</p></body>"), 1),
    ("fem hjul på en fyrhjuling fälls", "ad390a36",
     lambda h: h.replace("</body>", "<p>Vagnen rullar på fem hjul.</p></body>"), 1),
    ("fyra hjul på en femhjuling fälls", "9e5e788c",
     lambda h: h.replace("</body>", "<p>Köksön rullar på fyra hjul.</p></body>"), 1),
    # ── Husets fasta regler ──────────────────────────────────────────────
    ("massivt trä fälls", "6cf7cfcf",
     lambda h: h.replace("</body>", "<p>Skivan är massiv furu.</p></body>"), 1),
    ("husmärke fälls", "ad390a36",
     lambda h: h.replace("</body>", "<p>Tillverkad av HOMCOM.</p></body>"), 1),
    ("leveransland fälls", "ad390a36",
     lambda h: h.replace("</body>", "<p>Vagnen skickas från Tyskland.</p></body>"), 1),
    # ☠️ DE TVÅ SOM AVSLÖJADE BÖJNINGSHÅLET. Första utkastet injicerade
    #    "glasburkar" i tron att listans `glas` täckte det — men mönstret
    #    slutar i en ordgräns, och efter `glas` står ett `b`. Ordet lades till,
    #    och fälldes fortfarande inte: PLURALÄNDELSEN `-ar` fanns inte i
    #    böjningsmönstret alls. Tolv av tretton listade ord tappade sin
    #    pluralform. Båda formerna står kvar här som lås.
    ("leveranslöfte i SINGULAR fälls", "ad390a36",
     lambda h: h.replace("</body>", "<p>En glasburk ingår i leveransen.</p></body>"), 1),
    ("leveranslöfte i PLURAL fälls", "ad390a36",
     lambda h: h.replace("</body>", "<p>Fyra glasburkar ingår i leveransen.</p></body>"), 1),
    ("och rundans andra stylingrekvisita", "c86ff1a6",
     lambda h: h.replace("</body>", "<p>Två vinflaskor ingår i leveransen.</p></body>"), 1),
    ("härdat glas fälls", "5d1696db",
     lambda h: h.replace("</body>", "<p>Skivan är i härdat glas.</p></body>"), 1),
    # ☠️ RUNDANS NYA GRIND, prövad på den RENDERADE sidan: ett påstående om
    #    vårt eget sortiment är sant idag och osant efter nästa import.
    ("påstående om vårt eget sortiment fälls", "e0fed2c9",
     lambda h: h.replace("</body>", "<p>Den största köksön i sortimentet.</p></body>"), 1),
    ("den enda med … fälls", "e0fed2c9",
     lambda h: h.replace("</body>", "<p>Den enda med utdragsbrickor.</p></body>"), 1),
    # ── Och att närvarokontrollerna faktiskt biter ───────────────────────
    ("saknat tal fälls", "ad390a36", lambda h: h.replace("16,5", "X"), 1),
    ("saknad flik fälls", "ad390a36", lambda h: h.replace("Vanliga frågor", "X"), 1),
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
        print(f"    hämtad {nyckel} {len(html)//1024} kB, "
              f"cache {hdr.get('x-vercel-cache','?')}")
    st = sjalvtest(sidor)
    print(f"\nlive-självtest: {len(FALL)} fall, {len(st)} fel")
    for x in st:
        print("  ☠️", x)
    for nyckel, html in sidor.items():
        fl = granska(nyckel, html)
        tot += len(fl)
        print(("FEL " if fl else "OK  ")
              + f"{nyckel}  {FACIT[nyckel]['slug']}  ({len(html)//1024} kB)")
        for x in fl:
            print("      ✗", x)
    print(f"\n{len(FACIT)} sidor, {tot} fel, {len(st)} fel i självtestet")
    sys.exit(1 if (tot or st) else 0)
