# -*- coding: utf-8 -*-
"""Runda 63, Steg 14 — läs de åtta publicerade sidorna som kund.

☠️ Grindarna IMPORTERAS från lint.py, kopieras aldrig. Runda 57: live-grinden
bar en egen kopia av en regel utan dess undantag och fällde åtta korrekta sidor.

☠️ EN 404 DIREKT EFTER PUBLICERINGEN ÄR CACHEN, INTE SIDAN. Slugen svarade 404
medan produkten var utkast, och det svaret ligger kvar i ISR-cachen. Runda 60:
alla åtta gav `404 x-vercel-cache: STALE` medan Wix samtidigt sa `visible:true`.
Omvalideringen är ASYNKRON, så två hämtningar i rad räcker inte — grinden väntar
ut den. `?cb=` hjälper INTE på produktsidan (frågesträngen ingår inte i nyckeln).

☠️ Proxyn skriver sitt eget "HTTP/1.1 200 Connection Established" FÖRST, så
huvudena parsas ur en egen fil och SISTA HTTP/-raden är sidans.

☠️ Landgrinden är TVÅ regler. Butikens egen chrome-rad säger "Skickas från
EU-lager" — den är butikens, inte vår. LANDER delas därför programmatiskt:
lagerfraserna läses bara inuti VÅR text, landsNAMNEN på hela sidan (ett läckt
avsändarland är ett läckage var det än står).

✅ NYTT I RUNDA 62: FACIT PÅ LIVE-SIDAN — och det är den grind som subsumerar
alla andra. Ordlistorna räknar UPP fel man kommit på; facit bevisar att den text
kunden ser är BYTE FÖR BYTE den text lint godkände, alltså håller varje regel
lint körde — per konstruktion, inte per uppräkning.

Mätt först, grind sedan: körningen 2026-09-05 gav `lika` på alla åtta, alltså
samma längd OCH samma hash som facit.json på den utskurna regionen. Butiken
renderar beskrivningen ordagrant; ingen "Läs mer"-avkortning, ingen omskrivning
av blanktecken utöver den kollaps som facit redan gör. Därför fäller den nu.
"""
import json
import os
import re
import subprocess
import sys
import time

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import texter                                                     # noqa: E402
from facit import hasha, synlig                                   # noqa: E402
from lint import (FRAMMANDE, MEDICINSKT, SUPERLATIV, HUSMARKEN, LANDER,
                  synlig_text)  # noqa: E402

BAS = "https://www.fyndplats.se/produkt/"
FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]

# ☠️ Härledd ur LANDER, inte omskriven. Ett land som läggs till i lint hamnar
#    automatiskt i rätt hink här.
LAGERFRAS = [l for l in LANDER if "lager" in l.lower()]
LANDSNAMN = [l for l in LANDER if "lager" not in l.lower()]

FACIT = json.load(open(os.path.join(HAR, "facit.json"), encoding="utf-8"))
BILDER = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
os.makedirs(os.path.join(HAR, "live"), exist_ok=True)


def en_hamtning(slug, n):
    h = os.path.join(HAR, "live", "%s.%d.h" % (slug, n))
    b = os.path.join(HAR, "live", "%s.%d.html" % (slug, n))
    for _ in range(4):                     # övergående TLS-fel via proxyn
        r = subprocess.run(["curl", "-sS", "--retry", "2", "--retry-all-errors",
                            "-D", h, "-o", b, BAS + slug], timeout=180)
        if r.returncode == 0:
            break
    else:
        return "NÄTFEL", "", "", ""
    huvud = open(h, encoding="utf-8", errors="replace").read()
    rader = [r for r in huvud.splitlines() if r.startswith("HTTP/")]
    status = rader[-1].split()[1] if rader else "?"

    def hitta(namn):
        m = re.search(r"(?im)^%s:\s*(.+)$" % re.escape(namn), huvud)
        return m.group(1).strip() if m else ""
    return (status, hitta("age"), hitta("x-vercel-cache"),
            open(b, encoding="utf-8", errors="replace").read())


# ☠️ FÄRSK betyder att raden INTE är STALE. En STALE-rad är per definition det
#    gamla svaret medan omvalideringen pågår — och för en nyss publicerad
#    produkt är det gamla svaret en 404.
VANTAN = [0, 10, 20, 30, 60, 60, 120]


def hamta(slug):
    for i, paus in enumerate(VANTAN):
        if paus:
            time.sleep(paus)
        status, age, cache, html = en_hamtning(slug, i)
        if cache.upper() != "STALE":
            return status, age, cache, html
    return status, age, cache, html


def sidtext(html):
    html = re.sub(r"(?is)<script.*?</script>", " ", html)
    html = re.sub(r"(?is)<style.*?</style>", " ", html)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


fel, rader = [], []
for p in texter.PRODUKTER:
    k, slug = p["kort"], p["slug"]
    status, age, cache, html = hamta(slug)          # väntar ut omvalideringen
    s = sidtext(html)

    if status != "200":
        rader.append((k, slug, status, age, cache, 0, 0, "—", 0))
        fel.append("%s: status %s" % (k, status))
        continue

    # ---- hela sidan -------------------------------------------------------
    if p["name"] not in s:
        fel.append("%s: produktnamnet står inte på sidan" % k)
    for f in FLIKAR:
        if f not in s:
            fel.append("%s: avsnittet %r saknas" % (k, f))
    for land in LANDSNAMN:
        # ☠️ ORDGRÄNS, precis som i lint.py. Utan den matchar "Polen" inuti
        #    "kupolen" och grinden fäller en korrekt sida. Runda 57:s lärdom
        #    i sin exakta form: live-grinden hade en EGEN kopia av regeln —
        #    utan det undantag lint hade fått samma dag.
        if re.search(r"\b%s\b" % re.escape(land), s, re.I):
            fel.append("%s: landsnamn på LIVE-sidan — %r" % (k, land))
    if re.search(r"\b\d{3}-\d{3}[A-Z0-9]{0,8}\b", s):
        fel.append("%s: artikelnummer på LIVE-sidan" % k)

    # ☠️ Bilderna: nålen är hex-delen. Wix bygger om adressen med /v1/fill/…
    # ⚠️ e16338a9 har fyra bilder i galleriet men fem i bilder.json — den
    #    femte är den som bar tysk text inbränd och plockades bort i Steg 9.
    #    Nämnaren är därför antalet nålar, inte en hårdkodad femma.
    nalar = [f.split("_")[-1].split("~")[0] for f in BILDER[k]]
    tratt = sum(1 for n in nalar if n in html)
    if tratt == 0:
        fel.append("%s: ingen av våra fem bilder syns i sidkällan" % k)

    # ---- VÅR textregion ---------------------------------------------------
    egen = synlig(texter.bygg(p))
    forst, sist = egen[:70], egen[-70:]
    i, j = s.find(forst), s.find(sist)
    if i < 0:
        fel.append("%s: beskrivningens FÖRSTA mening står inte på sidan" % k)
        rader.append((k, slug, status, age, cache, tratt, 0, "—", len(nalar)))
        continue
    if j < i:
        fel.append("%s: beskrivningens SISTA mening står inte på sidan" % k)
        rader.append((k, slug, status, age, cache, tratt, 0, "—", len(nalar)))
        continue
    region = s[i:j + len(sist)]

    for lager in LAGERFRAS:
        if re.search(re.escape(lager), region, re.I):
            fel.append("%s: lagerfras i VÅR text — %r" % (k, lager))
    for ord_ in FRAMMANDE:
        if re.search(r"\b%s" % re.escape(ord_), region, re.I):
            fel.append("%s: främmande ord i VÅR text — %r" % (k, ord_))
    for m in MEDICINSKT:
        if re.search(re.escape(m), region, re.I):
            fel.append("%s: medicinskt påstående i VÅR text — %r" % (k, m))
    for sup in SUPERLATIV:
        if re.search(re.escape(sup), region, re.I):
            fel.append("%s: superlativ i VÅR text — %r" % (k, sup))
    for h in HUSMARKEN:
        if re.search(r"\b%s\b" % re.escape(h), region, re.I):
            fel.append("%s: husmärke i VÅR text — %r" % (k, h))
    # ☠️ Steg 2:s ordagranna lastgräns måste ha nått kunden på de två
    #    möbelvarianterna — det är rundans enda säkerhetsrelevanta villkor.
    if k == "d82950a3" and "inte en sittplats för en vuxen" not in region:
        fel.append("%s: förnekelsen av sittplatsbruk nådde inte kunden" % k)
    if k == "73cb432c" and "bär 80 kg" not in region:
        fel.append("%s: sittlasten 80 kg nådde inte kunden" % k)

    # ☠️ DEN HÄR GRINDEN ÄR DEN SOM BÄR. Stämmer längd och hash är den text
    #    kunden ser identisk med den lint godkände, och då gäller alla lints
    #    regler på LIVE-sidan utan att behöva räknas upp här.
    lika = (len(region), hasha(region)) == (FACIT[k]["langd"], FACIT[k]["hash"])
    avvik = "lika" if lika else "%+d/hash" % (len(region) - FACIT[k]["langd"])
    if not lika:
        fel.append("%s: LIVE-texten skiljer sig från facit (%d tecken mot %d)"
                   % (k, len(region), FACIT[k]["langd"]))
    rader.append((k, slug, status, age, cache, tratt, len(region), avvik, len(nalar)))

print("%-9s %-26s %-4s %-5s %-8s %-6s %-6s %s"
      % ("id8", "slug", "kod", "age", "cache", "bilder", "text", "mot facit"))
for r in rader:
    print("%-9s %-31s %-4s %-5s %-8s %-6s %-6d %s"
          % (r[0], r[1], r[2], r[3] or "-", r[4] or "-",
             "%d/%d" % (r[5], r[8]), r[6], r[7]))
print()
for f in fel:
    print("FEL:", f)
print()
print("Live: alla %d sidor rena." % len(texter.PRODUKTER) if not fel
      else "LIVE-GRINDEN FÄLLER: %d fel" % len(fel))
raise SystemExit(1 if fel else 0)
