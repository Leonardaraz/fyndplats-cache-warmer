# -*- coding: utf-8 -*-
"""Runda 115 Steg 14 — läs de SEX publicerade sidorna som kunden ser dem.

☠️ FACIT HÄMTAS UR `facit-live.json`, som LÄSTES UR KATALOGEN efter
   publiceringen — inte kopierat ur rundans egna filer. Två filer som bär
   samma tal är just den tvilling huset förlorat tid på flera gånger.

☠️ FYRA UPPMJUKNINGAR ÄRVS, alla köpta med ett falsklarm i en tidigare runda:

   1. MÄRKES- OCH ORDKONTROLLER LÄSER `rensad` — sidans EGEN text, med
      grannarnas produktnamn strukna (runda 111, uppgift #398).
   2. LÖFTESGRINDARNA LÄSER SIDAN UTAN BILDADRESSER. Wix `srcset` bär `1080w`,
      alltså en bildbredd och inget påstående (runda 112, uppgift #403).
   3. SVG-GEOMETRI STRYKS före kontrollerna — butikens egna ikoner bär tal i
      `d`-attribut, i BÅDA serialiseringarna (runda 114, uppgift #413).
   4. `?cb=` BUSTAR INTE ISR-cachen. `hamta_isr` hämtar TVÅ gånger.

☠️ RUNDANS EGEN SIGNATUR ÄR PEDALFRÅGAN. Leverantören säljer samma vara som
   både `Rutschauto` och `Tretauto`; bilden visar noll pedaler på alla sju.
   Frågan "Har den pedaler?" och dess nej MÅSTE stå på varje sida — det är
   rundans viktigaste besked till kunden, och den enda kontroll som skiljer
   en korrekt sida från en som säljer en trampbil.

☠️ OCH LEKSAKSHINKEN. `fb142c5c`s text lovade en hink som varken står i
   underlaget eller syns i bilden. Löftet är struket, men live-grinden är
   sista stället det kan fångas om skrivningen inte tagit — och en
   återläsning direkt efter en skrivning kan ljuga åt båda hållen (#394).

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
# ☠️ LEVERANSGRINDEN IMPORTERAS, DEN SKRIVS INTE OM. Ett första utkast av den
#    här filen bar en EGEN kopia av `leveransloften` — och kopian var trasig
#    på sin allra första körning: frågeundantaget skrevs som
#    `mening.rstrip().endswith("?")`, men `_mening` klipper FÖRE frågetecknet,
#    så FAQ-rubriken "Ingår batterier?" fälldes som ett löfte på fyra av sex
#    sidor. `grind.py` har den RÄTTA regeln (`_slut` + `_nasta_mening`) sedan
#    samma dag. Tvillingen gled isär inom en session — samma familj som
#    `SHIP_AXIS_RE` och `EU_TULL_CODES`.
from grind import (TRAMPLOFTE, MOTORLOFTE, GASTOLSLOFTE, TOALETT,  # noqa: E402
                   FARTLOFTE, MARKE, TONGRINDAR, FORBJUDET,
                   leveransloften, loftestraff)

FACIT = json.load(open(os.path.join(HAR, "facit-live.json"), encoding="utf-8"))
BAS = "https://www.fyndplats.se/produkt/"
FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]

SVG_GEOMETRI = re.compile(
    r'\b(?:d|points|viewBox|transform)="[^"]*"'
    r'|"(?:d|points|viewBox|transform)":"[^"]*"')

# ☠️ Rundans signatur, ordagrant. Frågan MÅSTE finnas och MÅSTE besvaras nej.
PEDALFRAGA = re.compile(r"Har\s+den\s+pedaler\?", re.I)
# Hinken finns inte i lådan på någon av de sex — den var ett påhitt.
HINK = re.compile(r"\bleksakshink\w*\b|\bhink\w*\b", re.I)


def granska(nyckel, html):
    fel = []
    f = FACIT[nyckel]
    slug = f["slug"]

    # ── Kontrollmätningar: faller de har HÄMTNINGEN gått fel, inte sidan ─────
    if f["hjalte"].replace(".jpg", "") not in html:
        fel.append("KONTROLLMÄTNINGEN FALLER — hjältebilden finns inte i HTML:en")
    if f["kort"].replace(".jpg", "") not in html:
        fel.append("vårt eget Fyndplats-kort saknas i galleriet")
    if f["ritning"].replace(".jpg", "") not in html:
        fel.append("måttritningen saknas i galleriet")
    for flik in FLIKAR:
        if f"<summary>{flik}</summary>" not in html and f">{flik}<" not in html:
            fel.append(f"fliken {flik!r} saknas i renderad HTML")

    norm = (html.replace("\\u003c", "<").replace("\\u003e", ">")
                .replace("\\u0026", "&").replace('\\"', '"'))
    # Butikens rekommendationsrad är ANDRA produkters kort, i två serialiseringar.
    andras = set(re.findall(r"/produkt/([a-z0-9-]+)", norm)) - {slug}
    andras |= set(re.findall(r'"pname">([^<]+)<', norm))
    # ☠️ EN TREDJE SERIALISERING. Uppmätt på den skarpa sidan: raden bär också
    #    `"slug":"…","name":"…"` i flight-payloaden — 46 poster, alltså hela
    #    rekommendationsradens data. Grannens NAMN stod alltså kvar efter
    #    strykningen, och ordet "elektrisk" i en uppresningsfåtöljs namn fällde
    #    MOTORLÖFTET på alla sex korrekta sidor.
    #    Uppgift #385 sa "två serialiseringar". Det var en UNDERSKATTNING —
    #    regeln är att stryka grannens namn ur VARJE form sidan bär, inte ur
    #    de former som råkade vara kända.
    andras |= {n for s_, n in re.findall(r'"slug":"([a-z0-9-]+)","name":"([^"]+)"',
                                         norm) if s_ != slug}
    rensad = norm
    for token in sorted(andras, key=len, reverse=True):
        rensad = rensad.replace(token, "")
    rensad = SVG_GEOMETRI.sub(" ", rensad)
    if f["alt1"] not in rensad:
        fel.append("KONTROLLMÄTNINGEN FALLER — strykningen åt sidans egen alt-text")

    utan_url = re.sub(r"https?://[^\s\"'<>\\]+", " ", rensad)
    syn = G.synlig_meningstext(rensad)
    # Syskonlänkens stycke bär GRANNENS ord och GRANNENS tal.
    egen = re.sub(r"<p>Finns också som .*?</p>", "", utan_url, flags=re.S)

    # ── Rundans signatur ────────────────────────────────────────────────────
    if not PEDALFRAGA.search(rensad):
        fel.append("PEDALFRÅGAN SAKNAS LIVE — rundans viktigaste besked till kunden")
    if T.yttre(nyckel) not in rensad:
        fel.append(f"yttermåttet {T.yttre(nyckel)} står inte på sidan")
    if f["sku"] not in rensad and f["sku"].lower() not in rensad.lower():
        pass          # SKU:n renderas inte på PDP:n — ingen dom, bara ingen kontroll

    # ── Löftesgrindarna, på sidans EGNA text ────────────────────────────────
    for etikett, monster in (
            ("TRAMPLÖFTE — varan har inga pedaler", TRAMPLOFTE),
            ("MOTORLÖFTE — varan har ingen motor", MOTORLOFTE),
            ("GÅSTOLSLÖFTE — EN 1273 är en annan produktkategori", GASTOLSLOFTE),
            ("NÖDTOALETT — leverantörens formulering, inte vår", TOALETT),
            ("FARTLÖFTE — farten är barnets egen", FARTLOFTE)):
        m = loftestraff(monster, egen)
        if m:
            i = max(0, m.start() - 70)
            fel.append(f"{etikett} live: …{egen[i:m.end() + 70]}…")

    # ☠️ Märket bara där licensen är uttalad — och läst ur SIDANS EGEN text.
    for m in MARKE.finditer(egen):
        if M.LICENS.get(nyckel) != m.group(0):
            i = max(0, m.start() - 60)
            fel.append(f"OLICENSIERAT MÄRKE LIVE: {m.group(0)!r} "
                       f"…{egen[i:m.end() + 60]}…")

    for etikett, monster in TONGRINDAR:
        m = monster.search(utan_url)
        if m:
            i = max(0, m.start() - 60)
            fel.append(f"{etikett} live: …{utan_url[i:m.end() + 60]}…")

    for etikett, monster in FORBJUDET:
        t = monster.search(rensad if etikett == "trasig relativ länk" else utan_url)
        if t:
            fel.append(f"{etikett} live: {t.group(0)!r}")

    # ☠️ Leveranslöftet — GRINDENS EGEN funktion, inte en kopia.
    fel += [f.replace("LEVERANSLÖFTE", "LEVERANSLÖFTE live", 1)
            for f in leveransloften(nyckel, syn)]

    # ☠️ Hinken var ett påhitt. Den får inte finnas kvar på NÅGON av de sex.
    h = HINK.search(egen)
    if h:
        i = max(0, h.start() - 60)
        fel.append(f"LEKSAKSHINKEN LEVER LIVE: …{egen[i:h.end() + 60]}…")

    # ☠️ De UTELÄMNADE fälten får inte ha smugit tillbaka live heller.
    for ord_, nycklar in M.UTELAMNAS.items():
        if nyckel in nycklar and re.search(r"\b" + re.escape(ord_), syn, re.I):
            fel.append(f"UTELÄMNAT FÄLT live: {ord_!r}")
    return fel


def _mening(txt, i):
    a = max(txt.rfind(".", 0, i), txt.rfind("?", 0, i), txt.rfind(">", 0, i))
    k = [j for j in (txt.find(".", i), txt.find("?", i)) if j >= 0]
    b = min(k) if k else -1
    return txt[a + 1: b if b >= 0 else len(txt)]


def _sjalvtest():
    """☠️ VARJE UPPMJUKNING PRÖVAS ÅT BÅDA HÅLLEN."""
    def sida(n, egen, granne, extra="", pedal=True):
        f = FACIT[n]
        p = ("<p><strong>Har den pedaler?</strong></p><p>Nej. Barnet skjuter "
             "ifrån med fötterna. Det finns varken pedaler eller motor.</p>"
             if pedal else "")
        return ('<html>' + f["hjalte"].replace(".jpg", "") + ' '
                + f["kort"].replace(".jpg", "") + ' '
                + f["ritning"].replace(".jpg", "")
                + '<img alt="' + f["alt1"] + '">'
                '<p>Fordonet är ' + T.yttre(n) + '. ' + egen + '</p>' + p
                + '<summary>Tekniska specifikationer</summary>'
                '<summary>Användning och skötsel</summary>'
                '<summary>Vanliga frågor</summary>'
                '<a class="prod" href="/produkt/' + granne[0] + '">'
                '<div class="pname">' + granne[1] + '</div></a>' + extra + '</html>')

    GR = ("elgokart-barn-vit", "Elgokart för barn")
    f = FACIT["389ac5ac"]
    srcset = ('<img srcset="https://static.wixstatic.com/media/' + f["hjalte"]
              + '/v1/fill/w_1080,h_1080,al_c,q_72/file.webp 1080w">')
    fall = [
        ("A rakt tramplöfte live        ", "TRAMPLÖFTE",
         sida("389ac5ac", "Barnet trampar sig fram.", GR), True),
        ("B negerat tramplöfte          ", "TRAMPLÖFTE",
         sida("389ac5ac", "Den har inga pedaler alls.", GR), False),
        ("C pedalfrågan BORTTAGEN       ", "PEDALFRÅGAN SAKNAS",
         sida("389ac5ac", "", GR, pedal=False), True),
        ("D pedalfrågan finns           ", "PEDALFRÅGAN SAKNAS",
         sida("389ac5ac", "", GR), False),
        ("E motorlöfte live             ", "MOTORLÖFTE",
         sida("389ac5ac", "Traktorn är eldriven.", GR), True),
        ("F gåstolslöfte live           ", "GÅSTOLSLÖFTE",
         sida("389ac5ac", "Ett stöd när barnet lär sig gå.", GR), True),
        ("G nödtoalett live             ", "NÖDTOALETT",
         sida("389ac5ac", "Facket går att använda som potta.", GR), True),
        # ☠️ H/I är MÄRKESFALLET åt båda håll. Märket får stå på 23ba27a5,
        #    där leverantören NAMNGER licensen — och ingen annanstans.
        ("H olicensierat märke live     ", "OLICENSIERAT MÄRKE",
         sida("389ac5ac", "Traktorn är en New Holland.", GR), True),
        ("I licensierat märke på RÄTT   ", "OLICENSIERAT MÄRKE",
         sida("23ba27a5", "Licensierad av Caterpillar.", GR), False),
        # ☠️ J ÄR GRANNENS MÄRKE. Rekommendationsraden kan bära vilket
        #    produktnamn som helst; det är inte vårt påstående.
        ("J märket hos GRANNEN          ", "OLICENSIERAT MÄRKE",
         sida("389ac5ac", "", ("cat-akbil-barn", "CAT åkbil för barn")), False),
        ("K leverantörsattribution live ", "LEVERANTÖRSATTRIBUTION",
         sida("389ac5ac", "Leverantören anger 25 kg.", GR), True),
        ("L tyskt ord live              ", "tyskt ord",
         sida("389ac5ac", "Ett riktigt Rutschauto.", GR), True),
        ("M artikelnummer live          ", "artikelnummer",
         sida("389ac5ac", "Modell 000-0000X.", GR), True),
        ("N Wix srcset, inget löfte     ", "LÖFTE",
         sida("389ac5ac", "", GR, srcset), False),
        # ☠️ O/P är HINKEN, prövad åt båda håll — den i VÅR text ska fällas,
        #    den i syskonlänkens stycke ska inte.
        ("O leksakshinken live          ", "LEKSAKSHINKEN LEVER",
         sida("389ac5ac", "En leksakshink följer med i lådan.", GR), True),
        ("P hinken i SYSKONLÄNKEN       ", "LEKSAKSHINKEN LEVER",
         sida("389ac5ac", "", GR).replace(
             "</p><p><strong>Har den",
             "</p><p>Finns också som en lastare med leksakshink.</p>"
             "<p><strong>Har den"), False),
        ("Q otäckt leveranslöfte live   ", "LEVERANSLÖFTE",
         sida("389ac5ac", "En hjälm följer med i lådan.", GR), True),
        ("R täckt leveranslöfte live    ", "LEVERANSLÖFTE",
         sida("389ac5ac", "En kratta följer med i lådan.", GR), False),
        # ☠️ S/T är SVG-fallet. S är butikens ikon (attributvärde), T samma
        #    sträng i VÅR brödtext. Flight-formen, inte HTML-`<svg>` — ett
        #    `<svg>` stryks redan av `synlig_meningstext` och bevisar inget.
        ("S trampbil i flight-payloadens d", "UTELÄMNAT FÄLT",
         sida("389ac5ac", "", GR,
              '<script>self.__next_f.push([1,"[\\"$\\",\\"path\\",null,'
              '{\\"d\\":\\"M12 trampbil 23c2.97 0 5.46-.98z\\"}]"])</script>'), False),
        ("T trampbil i VÅR brödtext     ", "UTELÄMNAT FÄLT",
         sida("389ac5ac", "En trampbil för de minsta.", GR), True),
        # ☠️ V ÄR REKOMMENDATIONSRADENS TREDJE FORM, och den fällde alla sex
        #    korrekta sidor. Grannens NAMN bar ordet "elektrisk"; strykningen
        #    kände bara /produkt/-länken och pname-diven.
        ("V grannens namn i flight-JSON  ", "MOTORLÖFTE",
         sida("389ac5ac", "", GR,
              '<script>self.__next_f.push([1,"{\"id\":\"bf2447a6-7360\",'
              '\"slug\":\"uppresningsfatolj-gra-frotte\",\"name\":'
              '\"Uppresningsfåtölj i grå frotté – elektrisk lyft 60°\"}"])'
              '</script>'), False),
        ("W elektrisk i VÅR egen text    ", "MOTORLÖFTE",
         sida("389ac5ac", "Traktorn har elektrisk drivning.", GR), True),
        # ☠️ X ÄR FAQ-RUBRIKEN I JSON-LD, och den fällde fyra av sex. Kopian av
        #    leveransgrinden klippte FÖRE frågetecknet och såg därför en
        #    utsaga där sidan har en fråga. Fallet står kvar för att bevisa att
        #    den importerade grinden hanterar BÅDA serialiseringarna.
        ("X Ingår batterier? i JSON-LD   ", "LEVERANSLÖFTE",
         sida("389ac5ac", "", GR,
              '<script type="application/ld+json">{"@type":"Question",'
              '"name":"Ingår batterier?","acceptedAnswer":{"@type":"Answer",'
              '"text":"Det vet vi inte."}}</script>'), False),
        ("U ren sida                    ", "", sida("389ac5ac", "", GR), False),
    ]
    fel = 0
    for etikett, sok, html, ska in fall:
        traff = [x for x in granska(_nyckel(html), html) if not sok or sok in x]
        if bool(traff) != ska:
            print(f"  SJÄLVTEST FEL {etikett}: "
                  f"{'inget larm' if ska else 'falsklarm — ' + str(traff[:1])}")
            fel += 1
    print(f"självtest: {len(fall)} fall, {fel} fel")
    return fel


def _nyckel(html):
    """Vilken produkt självtestets sida gäller — avgjort på HJÄLTEBILDEN."""
    for n, f in FACIT.items():
        if f["hjalte"].replace(".jpg", "") in html:
            return n
    raise SystemExit("☠️ SJÄLVTESTET BYGGDE EN SIDA UTAN HJÄLTEBILD")


if __name__ == "__main__":
    if _sjalvtest():
        sys.exit(2)
    grona = 0
    for nyckel, f in FACIT.items():
        html, hdr = G.hamta_isr(BAS + f["slug"])
        fel = granska(nyckel, html)
        if not fel:
            grona += 1
        print(f"{'OK ' if not fel else 'FEL'} {f['slug']:<38} {len(html):>7} tecken  "
              f"cache={hdr.get('x-vercel-cache')} age={hdr.get('age')}")
        for x in fel:
            print("      ✗", x)
    print(f"\n{grona} av {len(FACIT)} sidor gröna")
    sys.exit(0 if grona == len(FACIT) else 1)
