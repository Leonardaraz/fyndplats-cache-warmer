# -*- coding: utf-8 -*-
"""Runda 75, Steg 14 — läs de sju publicerade sidorna som kund.

☠️ EN 404 DIREKT EFTER PUBLICERINGEN ÄR CACHEN, INTE SIDAN. Sluggarna är
helt nya i den här rundan, så det gamla svaret är per definition en 404.
Grinden väntar ut omvalideringen i stället för att fälla på den.

✅ FACIT PÅ LIVE-SIDAN är den grind som bär: stämmer längd och hash är
kundens text BYTE FÖR BYTE den lint godkände, och då gäller varje
lint-regel på live-sidan per konstruktion.

☠️ ORDLISTAN ÄR VALD FÖR DEN HÄR FAMILJEN, inte ärvd. Runbokens två
lärdomar gäller båda här:

  * `Metall`, `Glas`, `Magnet` stavas likadant på svenska och tyska — de
    får aldrig stå i listan. Inget av dem finns i den nedan.
  * `Gelb` fällde en korrekt sida för att det står inuti *re·gelb·undet*.
    Därför bär varje ord en ordgräns i BÖRJAN (`\\b`), som släpper igenom
    svenska ord med tysk delsträng men fångar böjda tyska former.

  Kontrollerat ord för ord mot svenskan: inget av tilläggen nedan är
  början på ett svenskt ord. `Rollen` är MEDVETET utelämnat — det är
  bestämd form av svenskans *roll* — och `bouclé` likaså, eftersom det är
  materialordet vår egen text använder.

⚠️ Kortnålen är filens hex-del, inte hela filnamnet: Wix bygger om
   adressen med /v1/fill/ men hexen står kvar i sidkällan.
"""
import json, os, re, subprocess, sys, time

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR)); sys.path.insert(0, HAR)
import texter                                                        # noqa: E402
from lint import FARG, MASTE_STA                                     # noqa: E402
from grindar import TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR, LAGERFRAS  # noqa: E402

# Familjens egna tyska ord, utöver husets delade lista.
TYSKA_KONTORSSTOL = [
    "bürostuhl", "burostuhl", "schreibtischstuhl", "drehstuhl",
    "kopfstütze", "kopfstutze", "höhenverstellbar", "hohenverstellbar",
    "armlehne", "kippfunktion", "wippfunktion", "stoffbezug",
    "bodenschonend", "mobilität", "mobilitat", "ergonomischer",
    "hellgrau", "dunkelgrau", "cremeweiß", "cremeweiss",
    "grau", "braun", "weiß",
]

BAS = "https://www.fyndplats.se/produkt/"
FLIKAR = ["Egenskaper", "Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]
FACIT = json.load(open(os.path.join(HAR, "facit.json"), encoding="utf-8"))
KORT_ID = json.load(open(os.path.join(HAR, "kort-ids.json"), encoding="utf-8"))
os.makedirs(os.path.join(HAR, "live"), exist_ok=True)


def hasha(s):
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) % 1000000007
    return h


def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def en(slug, n):
    # ⚠️ Huvud och kropp till VAR SIN fil: utgående HTTPS går via en proxy,
    #    så ett skript som delar på första tomraden får proxyns
    #    "200 Connection Established" som huvud och sidans huvud som kropp.
    h = os.path.join(HAR, "live", "%s.%d.h" % (slug, n))
    b = os.path.join(HAR, "live", "%s.%d.html" % (slug, n))
    for _ in range(4):
        r = subprocess.run(["curl", "-sS", "--retry", "2", "--retry-all-errors",
                            "-D", h, "-o", b, BAS + slug], timeout=180)
        if r.returncode == 0:
            break
    else:
        return "NÄTFEL", "", ""
    huvud = open(h, encoding="utf-8", errors="replace").read()
    rader = [x for x in huvud.splitlines() if x.startswith("HTTP/")]
    m = re.search(r"(?im)^x-vercel-cache:\s*(.+)$", huvud)
    return (rader[-1].split()[1] if rader else "?", (m.group(1).strip() if m else ""),
            open(b, encoding="utf-8", errors="replace").read())


VANTAN = [0, 15, 25, 40, 60, 90, 120]


def hamta(slug):
    kod = cache = html = ""
    for i, paus in enumerate(VANTAN):
        if paus:
            time.sleep(paus)
        kod, cache, html = en(slug, i)
        if kod == "200" and cache.upper() != "STALE":
            return kod, cache, html
    return kod, cache, html


def sidtext(h):
    h = re.sub(r"(?is)<script.*?</script>", " ", h)
    h = re.sub(r"(?is)<style.*?</style>", " ", h)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


fel, rader = [], []
for p in texter.PRODUKTER:
    k, slug = p["kort"], p["slug"]
    kod, cache, html = hamta(slug)
    s = sidtext(html)
    if kod != "200":
        rader.append((k, slug, kod, cache, "—", "—")); fel.append("%s: status %s" % (k, kod)); continue

    if p["name"] not in s:
        fel.append("%s: produktnamnet står inte på sidan" % k)
    for f in FLIKAR:
        if f not in s:
            fel.append("%s: avsnittet %r saknas" % (k, f))
    for o in LANDORD:
        if re.search(r"\b%s\b" % re.escape(o), s, re.I):
            fel.append("%s: landsnamn på LIVE-sidan — %r" % (k, o))
    if ARTNR.search(s):
        fel.append("%s: artikelnummer på LIVE-sidan" % k)
    # ☠️ Kortet kan INTE sökas i den strippade texten: alt-texten bor i ett
    #    ATTRIBUT, och sidtext() tar bort taggarna. Nålen är filens hex-del i
    #    SIDKÄLLAN — Wix bygger om adressen med /v1/fill/, men hexen står kvar.
    nal = KORT_ID[k].split("_")[-1].split("~")[0]
    if nal not in html:
        fel.append("%s: det egna kortet finns inte i sidkällan" % k)

    egen = synlig(texter.bygg(p))
    forst, sist = egen[:70], egen[-70:]
    i, j = s.find(forst), s.find(sist)
    if i < 0:
        fel.append("%s: beskrivningens FÖRSTA mening står inte på sidan" % k)
        rader.append((k, slug, kod, cache, 0, "—")); continue
    if j < i:
        fel.append("%s: beskrivningens SISTA mening står inte på sidan" % k)
        rader.append((k, slug, kod, cache, 0, "—")); continue
    region = s[i:j + len(sist)]

    for o in TYSKA + TYSKA_KONTORSSTOL + HUSMARKEN + ATTRIBUTION:
        if re.search(r"\b%s" % re.escape(o), region, re.I):
            fel.append("%s: %r i VÅR text" % (k, o))
    for f in LAGERFRAS:
        if re.search(re.escape(f), region, re.I):
            fel.append("%s: lagerfras i VÅR text — %r" % (k, f))
    for kravd in MASTE_STA.get(k, []):
        if kravd not in region:
            fel.append("%s: %r nådde inte kunden" % (k, kravd[:40]))

    lika = (len(region), hasha(region)) == (FACIT[k]["synligLangd"], FACIT[k]["synligHash"])
    if not lika:
        fel.append("%s: LIVE-texten skiljer sig från facit (%d mot %d tecken)"
                   % (k, len(region), FACIT[k]["synligLangd"]))
    rader.append((k, slug, kod, cache, len(region), "lika" if lika else "%+d/hash" % (len(region) - FACIT[k]["synligLangd"])))

print("%-9s %-30s %-4s %-8s %-6s %s" % ("id8", "slug", "kod", "cache", "text", "mot facit"))
for r in rader:
    print("%-9s %-30s %-4s %-8s %-6s %s" % (r[0], r[1], r[2], r[3] or "-", r[4], r[5]))
print()
for f in fel:
    print("FEL:", f)
print("\nLive: alla %d sidor rena." % len(texter.PRODUKTER) if not fel
      else "\nLIVE-GRINDEN FÄLLER: %d fel" % len(fel))
raise SystemExit(1 if fel else 0)
