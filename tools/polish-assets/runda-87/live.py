# -*- coding: utf-8 -*-
"""Runda 87, Steg 14 — läs de åtta publicerade sidorna som kund.

☠️ EN 404 DIREKT EFTER PUBLICERINGEN ÄR CACHEN, INTE SIDAN. Sluggarna är
helt nya, så det gamla svaret är per definition en 404. Grinden väntar ut
omvalideringen i stället för att fälla på den.

✅ FACIT PÅ LIVE-SIDAN är den grind som bär: stämmer längd och hash är
kundens text BYTE FÖR BYTE den lint godkände, och då gäller varje
lint-regel på live-sidan per konstruktion — inklusive rundans egna: att
snölasten bara står på de TRE tält där källan anger en siffra (5 och
10 kg/m²) och aldrig på de fem som tiger, att orden "vinterklar",
"vintersäker" och "vinterfast" inte finns någonstans trots att tyskan
kallar två av dem `winterfest`, att förankringen räknas rätt per produkt
i BÅDE siffror och bokstäver ("sexton markankare") och aldrig utlovas på
`8bdba748` som saknar den, att "vattentät" bara står där källan säger det
och `0f5e3fea` bara får "vattenavvisande", och att ordet "rundan" inte
finns någonstans i kundtexten (grind 5c).

☠️ ORDLISTAN ÄRVS INTE — den LÄSES ur `lint.TYSKA_BANK`, alltså exakt den
lista som redan självtestas mot rundans egen text. Runda 84 bar en egen
kopia i den här filen, och en kopia är en tvilling som glider isär. Orden
`material` och `grun` fälldes ur banken av just det självtestet den här
rundan: de träffar VÅR text (`Material:` i spec-raden, `grundyta`).
"""

import json, os, re, subprocess, sys, time

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR)); sys.path.insert(0, HAR)
import texter                                                        # noqa: E402
import lint                                                          # noqa: E402
from grindar import TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR, LAGERFRAS  # noqa: E402

# ☠️ Familjens tyska ord LÄSES ur lint, aldrig kopieras hit.
TYSKA_BANK = lint.TYSKA_BANK

BAS = "https://www.fyndplats.se/produkt/"

# ☠️ De tre OBLIGATORISKA flikrubrikerna måste stå ORDAGRANT — matchar
# strängen inte renderas spec-tabellen inline mitt i brödtexten, och det
# ser inte trasigt ut, bara som en rubrik till.
FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]
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


# ☠️ SJÄLVTEST: ordlistan mot VÅR EGEN text, innan ett enda anrop görs.
_egen = " ".join(synlig(texter.bygg(_p)) for _p in texter.PRODUKTER)
_traff = [_o for _o in TYSKA + TYSKA_BANK + HUSMARKEN + ATTRIBUTION
          if re.search(r"\b%s" % re.escape(_o), _egen, re.I)]
if _traff:
    raise SystemExit("ORDLISTAN TRÄFFAR VÅR EGEN TEXT: %s — grinden hade "
                     "fällt korrekta sidor (runda 81:s lärdom)" % ", ".join(_traff))


def sidtext(h):
    h = re.sub(r"(?is)<script.*?</script>", " ", h)
    h = re.sub(r"(?is)<style.*?</style>", " ", h)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


fel, rader, sedda = [], [], {}
for p in texter.PRODUKTER:
    k, slug = p["kort"], p["slug"]
    kod, cache, html = hamta(slug)
    sedda[slug] = kod
    s = sidtext(html)
    if kod != "200":
        rader.append((k, slug, kod, cache, "—", "—")); fel.append("%s: status %s" % (k, kod)); continue

    if p["name"] not in s:
        fel.append("%s: produktnamnet står inte på sidan" % k)
    # ⚠️ Rundans MITTRUBRIK är produktspecifik ("Vad 10 kg per kvadratmeter
    #    faktiskt betyder", "Förankringen ingår inte — och den behövs" …),
    #    så listan läses UR PRODUKTENS EGEN HTML i stället för att hårdkodas.
    #    En fast lista hade bara kontrollerat det alla åtta delar.
    egna = re.findall(r"<h2>([^<]+)</h2>", texter.bygg(p))
    for f in FLIKAR:
        if f not in egna:
            fel.append("%s: %r saknas i den byggda texten" % (k, f))
    for f in egna:
        if f not in s:
            fel.append("%s: avsnittet %r saknas på LIVE-sidan" % (k, f))
    for o in LANDORD:
        if re.search(r"\b%s\b" % re.escape(o), s, re.I):
            fel.append("%s: landsnamn på LIVE-sidan — %r" % (k, o))
    if ARTNR.search(s):
        fel.append("%s: artikelnummer på LIVE-sidan" % k)
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

    for o in TYSKA + TYSKA_BANK + HUSMARKEN + ATTRIBUTION:
        if re.search(r"\b%s" % re.escape(o), region, re.I):
            fel.append("%s: %r i VÅR text" % (k, o))
    for f in LAGERFRAS:
        if re.search(re.escape(f), region, re.I):
            fel.append("%s: lagerfras i VÅR text — %r" % (k, f))
    # ☠️ Grind 5c på LIVE-sidan: intern jargong i kundtext.
    for m in re.finditer(r"\brundans?\b|\bi rundan\b", region, re.I):
        fel.append("%s: intern jargong på LIVE-sidan — %r" % (k, m.group(0)))

    # ── Rundans EGNA grindar, körda om på den renderade sidan ─────────────
    # Facit-hashen ovan garanterar dem redan per konstruktion; de körs ändå
    # om här, för de är rundans dyraste påståenden och kostar noll.
    #
    # ☠️ Snölasten: bara de TRE tält där källan anger en siffra får bära en.
    tal = set(re.findall(r"(\d+)\s*kg/m²", region))
    vantad = {str(lint.SNOLAST[k])} if k in lint.SNOLAST else set()
    extern = {m.split()[0] for m in lint.EXTERN_TAL if m.endswith("kg")}
    if k in lint.UTAN_SNOLAST and (tal - extern):
        fel.append("%s: snölast på LIVE-sidan trots att källan tiger — %s"
                   % (k, sorted(tal - extern)))
    if vantad and not (vantad & tal):
        fel.append("%s: den angivna snölasten %s kg/m² står inte på LIVE-sidan"
                   % (k, lint.SNOLAST[k]))
    # ☠️ Tyskans `winterfest` får aldrig bli ett svenskt löfte.
    for m in lint.VINTER_RE.finditer(region):
        fel.append("%s: vinterlöfte på LIVE-sidan — %r" % (k, m.group(0)))
    # ☠️ Förankringen: `8bdba748` levereras UTAN, och får aldrig utlova den.
    if k in lint.UTAN_FORANKRING and re.search(
            r"markankare|jordspett|spännlinor", region, re.I):
        if not re.search(r"ing[åa]r inte|medf[öo]ljer inte", region, re.I):
            fel.append("%s: förankring utlovas på LIVE-sidan utan förnekande" % k)

    lika = (len(region), hasha(region)) == (FACIT[k]["synligLangd"], FACIT[k]["synligHash"])
    if not lika:
        fel.append("%s: LIVE-texten skiljer sig från facit (%d mot %d tecken)"
                   % (k, len(region), FACIT[k]["synligLangd"]))
    rader.append((k, slug, kod, cache, len(region),
                  "lika" if lika else "%+d/hash" % (len(region) - FACIT[k]["synligLangd"])))

# ── Korslänkarnas mål ────────────────────────────────────────────────────
mal = {}
for p in texter.PRODUKTER:
    for h in re.findall(r'href="([^"]+)"', texter.bygg(p)):
        mal.setdefault(h.rsplit("/", 1)[-1], []).append(p["kort"])
lankrader = []
for slug in sorted(mal):
    kod = sedda.get(slug)
    if kod is None:
        kod, _, _ = hamta(slug)
    lankrader.append((slug, kod, len(mal[slug])))
    if kod != "200":
        fel.append("korslänk pekar på %s som svarar %s (länkad från %s)"
                   % (slug, kod, ", ".join(sorted(set(mal[slug])))))

print("%-9s %-36s %-4s %-8s %-6s %s" % ("id8", "slug", "kod", "cache", "text", "mot facit"))
for r in rader:
    print("%-9s %-36s %-4s %-8s %-6s %s" % (r[0], r[1], r[2], r[3] or "-", r[4], r[5]))
print("\n%-40s %-4s %s" % ("korslänkens mål", "kod", "länkar"))
for r in lankrader:
    print("%-40s %-4s %d" % (r[0], r[1], r[2]))
print()
for f in fel:
    print("FEL:", f)
print("\nLive: alla %d sidor och %d länkmål rena." % (len(texter.PRODUKTER), len(lankrader))
      if not fel else "\nLIVE-GRINDEN FÄLLER: %d fel" % len(fel))
raise SystemExit(1 if fel else 0)
