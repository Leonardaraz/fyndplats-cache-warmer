# -*- coding: utf-8 -*-
"""Runda 89, Steg 14 — läs de sex publicerade sidorna som kund.

☠️ EN 404 DIREKT EFTER PUBLICERINGEN ÄR CACHEN, INTE SIDAN. Sluggarna är
helt nya, så det gamla svaret är per definition en 404. Grinden väntar ut
omvalideringen i stället för att fälla på den.

✅ FACIT PÅ LIVE-SIDAN är den grind som bär: stämmer längd och hash är
kundens text BYTE FÖR BYTE den lint godkände, och då gäller varje
lint-regel på live-sidan per konstruktion — inklusive rundans egna: att
fotbollsmönstret ALDRIG nämns (leverantören lovar det, ingen av de tio
F-bilderna visar det), att inget massivt-hjul-råd smugit sig in från runda
88 (alla sex har luftdäck och MÅSTE pumpas), att styrhöjden inte lånats
mellan modellerna (A2 börjar på 92 cm där D slutar på 80), att ingen fälg
påstås ha en färg (alla sex har silverfärgad ekerfälg — bara D:s gaffel är
röd), att inget ord om elsparkcykel finns, att ingen standard påstås och
att hjälmrådet FINNS och aldrig kallas lagkrav.

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
from grindar import (TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR, LAGERFRAS,
                     dela_pa_ankare)                                 # noqa: E402

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

    lika = (len(region), hasha(region)) == (FACIT[k]["synligLangd"], FACIT[k]["synligHash"])
    if not lika:
        fel.append("%s: LIVE-texten skiljer sig från facit (%d mot %d tecken)"
                   % (k, len(region), FACIT[k]["synligLangd"]))
    rader.append((k, slug, kod, cache, len(region),
                  "lika" if lika else "%+d/hash" % (len(region) - FACIT[k]["synligLangd"])))

    # ── Rundans EGNA grindar, körda om på den renderade sidan ─────────────
    # Facit-hashen OVAN garanterar dem redan per konstruktion; de körs ändå
    # om här, för de är rundans dyraste påståenden och kostar noll.
    #
    # ☠️ DE KÖRS PÅ TEXTEN UTAN ANKARTEXTER, precis som linten gör. En
    #    korslänk beskriver den ANDRA produkten: modell A och B länkar till
    #    "modellen med korg och stänkskärmar, som tar 100 kg", och en grind
    #    som läser hela den renderade sidan fäller då sex korrekta sidor på
    #    ord som inte är påståenden om dem. Uppmätt 2026-09-07: 15 fel, alla
    #    ur ankartext. Samma familj som `\\b`-fyndet — en grind som fäller
    #    korrekt text lär mottagaren att sluta läsa.
    #
    #    Att läsa vår EGNA byggda text är rätt här och inte en genväg: facit
    #    ovan har just bevisat att live-sidan är byte för byte densamma.
    if not lika:
        continue
    egna_men, _lankade = dela_pa_ankare(texter.bygg(p))
    region = synlig(" ".join(egna_men))
    m = lint.MODELL[k]
    # ☠️ Maxlasten får ALDRIG lånas. Runda 88:s modeller tar 50 kg.
    for annan in {50, 100} - {lint.MAXLAST[m]}:
        if re.search(r"%d\s*kg" % annan, region):
            fel.append("%s: främmande maxlast på LIVE-sidan — %d kg" % (k, annan))
    if not re.search(r"%d\s*kg" % lint.MAXLAST[m], region):
        fel.append("%s: modellens egen maxlast %d kg står inte på LIVE-sidan"
                   % (k, lint.MAXLAST[m]))
    # ☠️ SIGNATUR 1: fotbollsmönstret finns inte i någon bild.
    for mt in lint.FOTBOLL_RE.finditer(region):
        fel.append("%s: OBELAGT FOTBOLLSMÖNSTER på LIVE-sidan — %r" % (k, mt.group(0)))
    # ☠️ SIGNATUR 2: alla sex har luftdäck. Runda 88:s råd är inverterat.
    for mt in lint.MASSIV_HARD_RE.finditer(region):
        fel.append("%s: massivt-hjul-påstående på LIVE-sidan — %r" % (k, mt.group(0)))
    if not re.search(r"pumpa|luftd[äa]ck|uppbl[åa]sbar", region, re.I):
        fel.append("%s: luftdäcken nämns inte på LIVE-sidan" % k)
    # ☠️ SIGNATUR 3: styrhöjden får inte lånas — A2:s lägsta ligger över D:s högsta.
    if not any(x in region.replace("-", "–") for x in lint._spannformer(lint.STYRE[m])):
        fel.append("%s: modellens styrhöjd %s står inte på LIVE-sidan"
                   % (k, lint.STYRE[m]))
    for annan in set(lint.STYRE.values()) - {lint.STYRE[m]}:
        if any(x in region.replace("-", "–") for x in lint._spannformer(annan)):
            fel.append("%s: ANNAN modells styrhöjd på LIVE-sidan — %s" % (k, annan))
    # ☠️ SIGNATUR 4 (Steg 4): fälgarna är silverfärgade på alla sex.
    for mt in lint.FALG_FARG_RE.finditer(region):
        fel.append("%s: OMÄTT FÄLGFÄRG på LIVE-sidan — %r" % (k, mt.group(0)))
    # ☠️ Ingen sparkcykel i rundan är eldriven.
    for mt in lint.ELSPARK_RE.finditer(region):
        fel.append("%s: elfordonsord på LIVE-sidan — %r" % (k, mt.group(0)))
    # ☠️ Ingen standard och ingen certifiering påstås — källan anger ingen.
    for mt in lint.STANDARD_RE.finditer(region):
        fel.append("%s: standard/certifiering på LIVE-sidan — %r" % (k, mt.group(0)))
    # ☠️ Hjälmrådet ska FINNAS, och aldrig kallas lagkrav.
    if "hjälm" not in region.lower():
        fel.append("%s: hjälmrådet saknas på LIVE-sidan" % k)
    for men in re.split(r"(?<=[.!?])\s+", region):
        if lint.HJALM_LAG_RE.search(men) and not lint.NEKORD.search(men):
            fel.append("%s: hjälm som lagkrav på LIVE-sidan — %r" % (k, men[:80]))
    # ☠️ Alla tre modellerna bromsar fram OCH bak.
    for mt in lint.EN_BROMS_RE.finditer(region):
        fel.append("%s: bara EN broms utlovad på LIVE-sidan — %r" % (k, mt.group(0)))

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
