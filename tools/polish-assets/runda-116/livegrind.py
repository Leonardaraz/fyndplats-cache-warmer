# -*- coding: utf-8 -*-
"""Runda 116 Steg 14 — läs de SJU publicerade sidorna som kunden ser dem.

☠️ FACIT HÄMTAS UR `facit-live.json`, som LÄSTES UR KATALOGEN efter
   publiceringen — inte kopierat ur rundans egna filer. Två filer som bär
   samma tal är just den tvilling huset förlorat tid på flera gånger.

☠️ FEM UPPMJUKNINGAR ÄRVS, alla köpta med ett falsklarm i en tidigare runda:

   1. MÄRKES- OCH ORDKONTROLLER LÄSER `rensad` — sidans EGEN text, med
      grannarnas produktnamn strukna (runda 111, uppgift #398).
   2. LÖFTESGRINDARNA LÄSER SIDAN UTAN BILDADRESSER. Wix `srcset` bär `1080w`,
      alltså en bildbredd och inget påstående (runda 112, uppgift #403).
   3. SVG-GEOMETRI STRYKS — butikens ikoner bär tal i `d`-attribut, i BÅDA
      serialiseringarna (runda 114, uppgift #413).
   4. REKOMMENDATIONSRADEN HAR TRE SERIALISERINGAR, inte två. Runda 115 hittade
      den tredje — `"slug":"…","name":"…"` i flight-payloaden, 46 poster — och
      EN grannes namn med ordet "elektrisk" fällde MOTORLÖFTET på sex korrekta
      sidor. Här är motsvarande risk att en grannes namn bär "regnskydd" eller
      "cykelvagn": båda finns i familjen, båda är grindade ord.
   5. `?cb=` BUSTAR INTE ISR-cachen. `hamta_isr` hämtar TVÅ gånger.

☠️ RUNDANS EGEN SIGNATUR ÄR CYKELFRÅGAN. Ingen av vagnarna har cykelfäste, och
   en tillkopplad cykelkärra har ett svenskt utrustningskrav vi inte kan
   uppfylla. Frågan "Går den att koppla efter en cykel?" och dess nej MÅSTE
   stå på varje sida.

☠️ OCH TALET 4 KG PÅ EN GRUPP B-SIDA. Leverantören kallar den vagnen
   "leicht (4 kg)"; spec-kolumnen säger 5,9. Samma siffra är grupp A:s
   HUNDVIKT. Live-grinden är sista stället en sådan förväxling kan fångas.

⚠️ Alla självtestfall prövas ÅT BÅDA HÅLLEN. En uppmjukning som bara provas
   på "släpper den igenom?" kan lika gärna vara `return []`.
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
import texter as T                                               # noqa: E402
# ☠️ LÖFTESMASKINERIET IMPORTERAS, DET SKRIVS INTE OM. Runda 115:s livegrind
#    bar en EGEN kopia av `leveransloften` och kopian var trasig på sin första
#    körning. Sedan runda 116 bor reglerna i `grindar.py` och rundans egna
#    mönster i `grind.py` — den här filen definierar INGA egna.
from grind import (CYKELLOFTE, BOSTADSLOFTE, REGNLOFTE, TERRANGLOFTE,  # noqa: E402
                   MARKE, TONGRINDAR, FORBJUDET, TAL, sidans_tal)

FACIT = json.load(open(os.path.join(HAR, "facit-live.json"), encoding="utf-8"))
BAS = "https://www.fyndplats.se/produkt/"
FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]

SVG_GEOMETRI = re.compile(
    r'\b(?:d|points|viewBox|transform)="[^"]*"'
    r'|"(?:d|points|viewBox|transform)":"[^"]*"')
BILDADRESS = re.compile(r"https?://static\.wixstatic\.com/\S+|\b\d+w\b")
SKRIPT = re.compile(r"(?is)<script[^>]*>.*?</script>")

CYKELFRAGA = re.compile(r"G[åa]r\s+den\s+att\s+koppla\s+efter\s+en\s+cykel\?", re.I)


# ☠️ GRANNSTRYKNINGEN FLYTTADE TILL `grindar.py` i runda 117, som hittade två
#    kanaler till: `<div class="pname">` och `alt="…"`. Den här filens egna
#    kopior kände fyra av sex och lämnades kvar bara för att ingen granne råkade
#    bära ett grindat ord. Tvillingar glider isär — modulen är delad nu.
_grannar = G.grannar
_grannslugs = G.grannslugs


def granska(nyckel, html):
    fel = []
    f = FACIT[nyckel]
    slug = f["slug"]

    # ── Kontrollmätningar: faller de har HÄMTNINGEN gått fel, inte sidan ─────
    if f["hjalte"].replace(".jpg", "") not in html:
        fel.append("KONTROLLMÄTNINGEN FALLER — hjältebilden finns inte i HTML:en")
    if f["kort"].replace(".jpg", "") not in html:
        fel.append("vårt eget Fyndplats-kort saknas i galleriet")
    if f["namn"] not in html:
        fel.append("produktnamnet står inte på sidan")
    if f["alt1"] not in html:
        fel.append("hjältebildens svenska alt-text saknas")

    # ── Rensa bort det som INTE är sidans egen text ──────────────────────────
    utan_skript = SKRIPT.sub(" ", html)
    rensad = SVG_GEOMETRI.sub(" ", utan_skript)
    # ☠️ SIGNATUREN PRÖVAS PÅ SIDAN SOM DEN LEVERERAS, före grannstrykningen.
    #    Strykningen finns för att slippa falska LÖFTESLARM från grannarnas
    #    text; en NÄRVAROKONTROLL av vår egen text ska aldrig gå genom den.
    egen_syn = G.synlig_meningstext(rensad)
    for namn in _grannar(html, slug):
        if namn != f["namn"]:
            rensad = rensad.replace(namn, " ")
    for gs in _grannslugs(html, slug):
        rensad = rensad.replace(gs, " ")
    syn = G.synlig_meningstext(rensad)
    utan_bild = BILDADRESS.sub(" ", syn)

    # ── Löftesgrindarna ─────────────────────────────────────────────────────
    for etikett, monster in (
            ("CYKELLÖFTE live", CYKELLOFTE),
            ("BOSTADSLÖFTE live", BOSTADSLOFTE),
            ("REGNSKYDDSLÖFTE live", REGNLOFTE),
            ("TERRÄNGLÖFTE live", TERRANGLOFTE)):
        m = G.loftestraff(monster, utan_bild)
        if m:
            i = max(0, m.start() - 70)
            fel.append(f"{etikett}: …{utan_bild[i:m.end() + 70]}…")

    for etikett, monster in TONGRINDAR:
        m = monster.search(syn)
        if m:
            i = max(0, m.start() - 60)
            fel.append(f"{etikett} live: …{syn[i:m.end() + 60]}…")

    for m in MARKE.finditer(rensad):
        fel.append(f"OLICENSIERAT MÄRKE live: {m.group(0)!r}")
    for etikett, monster in FORBJUDET:
        m = monster.search(rensad)
        if m:
            fel.append(f"{etikett} live: {m.group(0)!r}")

    fel += [x.replace("LEVERANSLÖFTE", "LEVERANSLÖFTE live", 1)
            for x in G.leveransloften(utan_bild, M.INGAR[nyckel], nyckel)]

    # ── Rundans signatur ────────────────────────────────────────────────────
    if not CYKELFRAGA.search(egen_syn):
        fel.append("CYKELFRÅGAN SAKNAS på den live sidan")
    if M.GRUPP[nyckel] == "B" and re.search(r"\b4\s*kg\b", utan_bild):
        i = re.search(r"\b4\s*kg\b", utan_bild).start()
        fel.append(f"FÖRVÄXLAD HUNDVIKT live: …{utan_bild[max(0,i-60):i+60]}…")

    # ── Sidans egna tal och flikar ──────────────────────────────────────────
    if M.MATT[M.GRUPP[nyckel]]["yttermatt"] not in egen_syn:
        fel.append("yttermåttet står inte på sidan")
    for flik in FLIKAR:
        if flik not in egen_syn:
            fel.append(f"fliken {flik!r} saknas på sidan")
    # ⚠️ SKU:N RENDERAS INTE AV BUTIKEN. Uppmätt: noll `FP-`-strängar i 148 kB
    #    HTML på en korrekt sida. En live-kontroll av SKU:n är därför inte en
    #    grind utan ett garanterat falsklarm — den verifieras mot API:t i
    #    Steg 8 i stället, där den faktiskt går att läsa.
    return fel


def _sjalvtest():
    """☠️ Varje uppmjukning prövas ÅT BÅDA HÅLLEN."""
    n = "3b0aca0a"
    f = FACIT[n]
    bas = ("<html><body><h1>" + f["namn"] + "</h1>"
           "<img src=\"https://static.wixstatic.com/media/"
           + f["hjalte"] + "/v1/fill/w_1080,h_1080/f.jpg\" alt=\"" + f["alt1"] + "\">"
           "<img src=\"https://static.wixstatic.com/media/" + f["kort"] + "\">"
           "<p>Vagnen är 77 × 44 × 102 cm.</p>"
           "<p>Tekniska specifikationer</p><p>Användning och skötsel</p>"
           "<p>Vanliga frågor</p><p>Går den att koppla efter en cykel?</p>"
           "<p>Nej. Det här är en skjutvagn utan cykelfäste.</p>"
           "<p>" + f["sku"] + "</p></body></html>")
    fall = [
        ("A ren sida                    ", bas, "", False),
        ("B cykellöfte i brödtext       ",
         bas.replace("</body>", "<p>Vagnen kopplas efter en cykel.</p></body>"),
         "CYKELLÖFTE", True),
        ("C grannens namn i rekommendation",
         bas.replace("</body>",
                     '<div>"slug":"hundvagn-regnskydd-mugghallare",'
                     '"name":"Hundvagn med regnskydd och mugghållare"</div></body>'),
         "REGNSKYDDSLÖFTE", False),
        ("D regnskyddslöfte i EGEN text ",
         bas.replace("</body>", "<p>Suffletten är vattentät.</p></body>"),
         "REGNSKYDDSLÖFTE", True),
        ("E bildbredd 1080w             ", bas, "OHÄRLETT", False),
        ("F SVG-geometri med tal        ",
         bas.replace("</body>", '<svg><path d="M4 8l12 44"/></svg></body>'),
         "", False),
        ("G förväxlad hundvikt          ",
         bas.replace("</body>", "<p>Vagnen väger bara 4 kg.</p></body>"),
         "FÖRVÄXLAD HUNDVIKT", True),
        ("H märket i texten             ",
         bas.replace("</body>", "<p>En PawHut-vagn.</p></body>"),
         "OLICENSIERAT MÄRKE", True),
        ("I cykelfrågan borta           ",
         bas.replace("<p>Går den att koppla efter en cykel?</p>", ""),
         "CYKELFRÅGAN SAKNAS", True),
        ("J kortet borta                ",
         bas.replace(f["kort"], "b379ce_annat~mv2.jpg"),
         "Fyndplats-kort saknas", True),
        ("K skript med grannens ord     ",
         bas.replace("</body>",
                     '<script>{"name":"Cykelvagn för hund 2-i-1"}</script></body>'),
         "CYKELLÖFTE", False),
        # ☠️ L är felet grinden gjorde mot skarp sida: JSON-LD:s FAQ-poster
        #    använder `"name"` för FRÅGAN, så sidans egen cykelfråga ströks
        #    som om den vore en granne — och rapporterades sedan som saknad.
        ("L egen FAQ i JSON-LD          ",
         bas.replace("</body>",
                     '<div>{"@type":"Question","name":"Går den att koppla '
                     'efter en cykel?"}</div></body>'),
         "CYKELFRÅGAN SAKNAS", False),
    ]
    fel = 0
    for etikett, html, sok, ska in fall:
        traff = [x for x in granska(n, html) if not sok or sok in x]
        if bool(traff) != ska:
            print(f"  SJÄLVTEST FEL {etikett}: "
                  f"{'inget larm' if ska else 'falsklarm — ' + str(traff[:1])}")
            fel += 1
    print(f"live-självtest: {len(fall)} fall, {fel} fel")
    return fel


if __name__ == "__main__":
    f = _sjalvtest()
    if "--bara-test" in sys.argv:
        sys.exit(1 if f else 0)
    os.makedirs(os.path.join(HAR, "live"), exist_ok=True)
    tot = 0
    for k in M.ALLA:
        url = BAS + FACIT[k]["slug"]
        # ⚠️ `hamta_isr` returnerar (html, headers) — inte en sträng.
        html, huvuden = G.hamta_isr(url)
        open(os.path.join(HAR, "live", k + ".html"), "w",
             encoding="utf-8").write(html)
        fel = granska(k, html)
        tot += len(fel)
        print(f"{'OK ' if not fel else 'FEL'} {k}  {FACIT[k]['slug']}  "
              f"({len(html)//1024} kB, cache "
              f"{huvuden.get('x-vercel-cache', '?')})")
        for x in fel:
            print("      ✗", x)
    print(f"\n{len(M.ALLA)} sidor, {tot} fel, {f} fel i självtestet")
    sys.exit(1 if (tot or f) else 0)
