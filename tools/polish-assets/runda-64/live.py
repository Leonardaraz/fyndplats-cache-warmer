# -*- coding: utf-8 -*-
"""Runda 64, Steg 14 — läs de åtta publicerade sidorna som kund.

☠️ Reglerna IMPORTERAS från lint.py, kopieras aldrig. Runda 57: live-grinden
bar en egen kopia av en regel utan dess undantag och fällde åtta korrekta sidor.

☠️ EN 404 DIREKT EFTER PUBLICERINGEN ÄR CACHEN, INTE SIDAN. Slugen svarade 404
medan produkten var utkast, och det svaret ligger kvar i ISR-cachen. Runda 60:
alla åtta gav 404 med `x-vercel-cache: STALE` medan Wix sa `visible:true`.
Omvalideringen är ASYNKRON, så grinden väntar ut den. `?cb=` hjälper inte —
frågesträngen ingår inte i cachenyckeln.

☠️ Proxyn skriver sitt eget "HTTP/1.1 200 Connection Established" FÖRST, så
huvudena läses ur en egen fil och SISTA HTTP/-raden är sidans.

☠️ Landgrinden är TVÅ regler. Butikens egen chrome-rad säger "Skickas från
EU-lager" — den är butikens, inte vår. Lagerfraserna läses därför bara inuti
VÅR textregion; landsNAMNEN på hela sidan.

✅ FACIT PÅ LIVE-SIDAN är den grind som bär. Ordlistorna räknar UPP fel man
kommit på; facit bevisar att den text kunden ser är BYTE FÖR BYTE den text lint
godkände — alltså håller varje lint-regel på live-sidan per konstruktion.
"""
import json
import os
import re
import subprocess
import sys
import time

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HAR)
import texter                                                   # noqa: E402
from facit import hasha, synlig                                 # noqa: E402
from lint import TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR  # noqa: E402

BAS = "https://www.fyndplats.se/produkt/"
FLIKAR = ["Egenskaper", "Tekniska specifikationer",
          "Användning och skötsel", "Vanliga frågor"]
LAGERFRAS = ["eu-lager", "skickas från", "fraktas från", "lagerland"]

# ☠️ Rundans säkerhetsrelevanta villkor — de påståenden som MÅSTE ha nått
#    kunden, ordagrant. Ett facit som stämmer bevisar dem redan, men de står
#    här också för att felet ska peka på RÄTT sak när något går sönder.
MASTE_STA = {
    "17620f5b": ["fotpallen 50 kg"],          # två laster, inte en
    "e76002c1": ["Vagga inte fåtöljen"],      # leverantörens egen varning
    "b09d20b7": ["något lägre än sitsen"],    # pallen når aldrig sitshöjd
    "ca92e3ce": ["inte gummi"],               # gummiträ är trä
    "90caeb9d": ["250 kg"],
}

FACIT = json.load(open(os.path.join(HAR, "facit.json"), encoding="utf-8"))

# ☠️ Bilder som Steg 9 tog bort: tre bar tysk text inbränd, en bar
#    leverantörens logotyp. Nämnaren måste vara det vi FAKTISKT lämnade kvar —
#    annars läser tabellen som ett fel ("4/5") när gallringen gjorde sitt jobb.
#    Grinden vänder dessutom på det: de borttagna får INTE synas på sidan.
BORT = {("5e2dee74", 4), ("e76002c1", 2), ("beacff5a", 4), ("beacff5a", 5)}

_alla = json.load(open(os.path.join(HAR, "bilder.json"), encoding="utf-8"))
BILDER, BORTTAGNA = {}, {}
for k, v in _alla.items():
    BILDER[k] = [f for i, f in enumerate(v) if (k, i + 1) not in BORT]
    BORTTAGNA[k] = [f for i, f in enumerate(v) if (k, i + 1) in BORT]
os.makedirs(os.path.join(HAR, "live"), exist_ok=True)


def en_hamtning(slug, n):
    h = os.path.join(HAR, "live", "%s.%d.h" % (slug, n))
    b = os.path.join(HAR, "live", "%s.%d.html" % (slug, n))
    for _ in range(4):
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


# ☠️ FÄRSK betyder att raden INTE är STALE — en STALE-rad ÄR det gamla svaret
#    medan omvalideringen pågår, och för en nyss publicerad sida är det en 404.
VANTAN = [0, 10, 20, 30, 60, 60, 120]


def hamta(slug):
    status = age = cache = html = ""
    for i, paus in enumerate(VANTAN):
        if paus:
            time.sleep(paus)
        status, age, cache, html = en_hamtning(slug, i)
        if cache.upper() != "STALE" and status == "200":
            return status, age, cache, html
    return status, age, cache, html


def sidtext(html):
    html = re.sub(r"(?is)<script.*?</script>", " ", html)
    html = re.sub(r"(?is)<style.*?</style>", " ", html)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


fel, rader = [], []
for p in texter.PRODUKTER:
    k, slug = p["kort"], p["slug"]
    status, age, cache, html = hamta(slug)
    s = sidtext(html)
    nalar = [f.split("_")[-1].split("~")[0] for f in BILDER[k]]

    if status != "200":
        rader.append((k, slug, status, age, cache, "—", 0, "—", len(nalar)))
        fel.append("%s: status %s" % (k, status))
        continue

    # ---- hela sidan -------------------------------------------------------
    if p["name"] not in s:
        fel.append("%s: produktnamnet står inte på sidan" % k)
    for f in FLIKAR:
        if f not in s:
            fel.append("%s: avsnittet %r saknas" % (k, f))
    for land in LANDORD:
        if re.search(r"\b%s\b" % re.escape(land), s, re.I):
            fel.append("%s: landsnamn på LIVE-sidan — %r" % (k, land))
    if ARTNR.search(s):
        fel.append("%s: artikelnummer på LIVE-sidan" % k)

    # ☠️ Nålen är hex-delen; Wix bygger om adressen med /v1/fill/…
    #    Nämnaren är antalet nålar vi FAKTISKT lämnade kvar efter Steg 9,
    #    inte en hårdkodad femma — tre bilder plockades bort i den här rundan.
    tratt = sum(1 for n in nalar if n in html)
    if tratt < len(nalar):
        fel.append("%s: bara %d av %d kvarvarande bilder syns i sidkällan"
                   % (k, tratt, len(nalar)))
    # ☠️ Och de gallrade får inte ha kommit tillbaka.
    for f in BORTTAGNA.get(k, []):
        if f.split("_")[-1].split("~")[0] in html:
            fel.append("%s: en BORTTAGEN bild syns på sidan — %s" % (k, f[:28]))

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
    for ord_ in TYSKA:
        if re.search(r"\b%s\b" % re.escape(ord_), region, re.I):
            fel.append("%s: tyskt ord i VÅR text — %r" % (k, ord_))
    for h in HUSMARKEN:
        if re.search(r"\b%s\b" % re.escape(h), region, re.I):
            fel.append("%s: husmärke i VÅR text — %r" % (k, h))
    for a in ATTRIBUTION:
        if re.search(r"\b%s\b" % re.escape(a), region, re.I):
            fel.append("%s: attribution i VÅR text — %r" % (k, a))
    for kravd in MASTE_STA.get(k, []):
        if kravd not in region:
            fel.append("%s: %r nådde inte kunden" % (k, kravd))

    # ☠️ DEN HÄR GRINDEN BÄR. Stämmer längd och hash är kundens text identisk
    #    med den lint godkände — då gäller alla lints regler på LIVE-sidan.
    lika = (len(region), hasha(region)) == (FACIT[k]["len"], FACIT[k]["hash"])
    avvik = "lika" if lika else "%+d/hash" % (len(region) - FACIT[k]["len"])
    if not lika:
        fel.append("%s: LIVE-texten skiljer sig från facit (%d mot %d tecken)"
                   % (k, len(region), FACIT[k]["len"]))
    rader.append((k, slug, status, age, cache, tratt, len(region), avvik, len(nalar)))

print("%-9s %-34s %-4s %-5s %-8s %-7s %-6s %s"
      % ("id8", "slug", "kod", "age", "cache", "bilder", "text", "mot facit"))
for r in rader:
    bild = r[5] if r[5] == "—" else "%d/%d" % (r[5], r[8])
    print("%-9s %-34s %-4s %-5s %-8s %-7s %-6d %s"
          % (r[0], r[1], r[2], r[3] or "-", r[4] or "-", bild, r[6], r[7]))
print()
for f in fel:
    print("FEL:", f)
print()
print("Live: alla %d sidor rena." % len(texter.PRODUKTER) if not fel
      else "LIVE-GRINDEN FÄLLER: %d fel" % len(fel))
raise SystemExit(1 if fel else 0)
