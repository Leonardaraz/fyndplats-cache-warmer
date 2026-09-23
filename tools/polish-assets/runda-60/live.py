# -*- coding: utf-8 -*-
"""Runda 60 Steg 12 — läs de publicerade sidorna som kund.

☠️ Grindarna IMPORTERAS från lint.py, kopieras aldrig. Runda 57: live-grinden
hade en egen kopia av en regel utan dess undantag och fällde åtta korrekta sidor.
☠️ Proxyn skriver sitt eget "HTTP/1.1 200 Connection Established" FÖRST, så
huvudena parsas ur en egen fil och SISTA HTTP/-raden är sidans.
☠️ SKU:n renderas INTE av butiken — en grind på den fäller varje korrekt sida.
Det som går att mäta är att vårt eget kort ligger i sidkällan.
☠️ Landgrinden är TVÅ regler: LAND_NAMN läses på hela sidan, LAND_FRAS bara
inuti VÅR text, eftersom butikens egen chrome-rad säger "Skickas från EU-lager".
☠️ EN 404 DIREKT EFTER PUBLICERINGEN ÄR CACHEN, INTE SIDAN. Slugen svarade 404
medan produkten var utkast, och det svaret ligger kvar i ISR-cachen. Runda 60:
alla åtta gav `404 x-vercel-cache: STALE age: 1410` medan Wix samtidigt sa
`visible: true` på rätt slug. Två hämtningar i rad räcker inte — omvalideringen
är ASYNKRON och hann inte klart mellan dem. Grinden väntar därför ut den.
"""
import subprocess, re, sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from texter import P
from lint import (TYSKA, ICKESVENSKT, SUPERLATIV, DEFENSIV, LEVERANTOR, SPEC_LISTA,
                  LAND_NAMN, LAND_FRAS, ARTIKELNUMMER, MARKEN, CERT, OMATBART,
                  SORTIMENT, JAMFOR_OMATT, MATTETIKETT, SUMMA)

BAS = "https://www.fyndplats.se/produkt/"
FLIKAR = ["Tekniska specifikationer", "Användning och skötsel", "Vanliga frågor"]
os.makedirs("live", exist_ok=True)

KORT = {}
if os.path.exists("uppladdat.txt"):
    for l in open("uppladdat.txt"):
        if l.strip():
            k, f = l.split()
            KORT[k] = f.split("_")[-1].split("~")[0]   # hex-delen räcker som nål

def en_hamtning(slug, n):
    h, b = "live/%s.%d.h" % (slug, n), "live/%s.%d.html" % (slug, n)
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
    return status, hitta("age"), hitta("x-vercel-cache"), \
           open(b, encoding="utf-8", errors="replace").read()


# ☠️ FÄRSK betyder att raden INTE är STALE. En STALE-rad är per definition det
#    gamla svaret medan omvalideringen pågår i bakgrunden — och för en nyss
#    publicerad produkt är det gamla svaret en 404.
#    ⚠️ `?cb=` löser det INTE på den här rutten. Uppmätt runda 60: en unik
#    cb-parameter svarade `HIT age: 44`, alltså samma cache-rad. Frågesträngen
#    ingår inte i nyckeln — det som hjälpte var att omvalideringen hunnit klart.
#    Cache-bust-regeln i CLAUDE.md gäller butikens API-rutter, inte produktsidan.
VANTAN = [0, 10, 20, 30, 60, 60, 120]

def hamta(slug):
    for i, paus in enumerate(VANTAN):
        if paus:
            time.sleep(paus)
        status, age, cache, html = en_hamtning(slug, i)
        if cache.upper() != "STALE":
            return status, age, cache, html
    return status, age, cache, html

def synlig(html):
    html = re.sub(r"(?is)<script.*?</script>", " ", html)
    html = re.sub(r"(?is)<style.*?</style>", " ", html)
    return re.sub(r"<[^>]+>", " ", html)

fel, rader = [], []
for id8, v in P.items():
    slug = v["slug"]
    status, age, cache, html = hamta(slug)      # väntar ut omvalideringen
    s = synlig(html)
    rader.append((id8, slug, status, age, cache, len(html)))
    if status != "200":
        fel.append("%s: status %s" % (id8, status)); continue
    if v["name"] not in s:
        fel.append("%s: produktnamnet står inte på sidan" % id8)
    for f in FLIKAR:
        if f not in s:
            fel.append("%s: fliken %r saknas" % (id8, f))
    for t in TYSKA:
        if re.search(r"\b" + re.escape(t), s, re.I):
            fel.append("%s: tyskt ord på LIVE-sidan — %r" % (id8, t))
    for namn, rx in (("icke-svenskt tecken", ICKESVENSKT), ("superlativ", SUPERLATIV),
                     ("defensivt block", DEFENSIV), ("leverantörsröst", LEVERANTOR),
                     ("spec-kommalista", SPEC_LISTA), ("landsnamn", LAND_NAMN),
                     ("artikelnummer", ARTIKELNUMMER), ("husmärke", MARKEN),
                     ("ogrundad certifiering", CERT), ("omätbart procenttal", OMATBART),
                     ("sortimentspåstående", SORTIMENT),
                     ("omätt jämförelse", JAMFOR_OMATT), ("måttetikett", MATTETIKETT)):
        m = rx.search(s)
        if m:
            fel.append("%s: %s på LIVE-sidan — %r" % (id8, namn, m.group(0)))
    # rundans säkerhetsfynd måste ha överlevt hela vägen till kunden
    if id8 in SUMMA and SUMMA[id8] not in s:
        fel.append("%s: den summerade effekten %s står inte på LIVE-sidan"
                   % (id8, SUMMA[id8]))
    for nal in (KORT.get(id8 + "_spec"), KORT.get(id8 + "_foto")):
        if nal and nal not in html:
            fel.append("%s: vårt kort %s syns inte i sidkällan" % (id8, nal))
    # ☠️ Regionen för VÅR text binds i BÅDA ändar: butikens sidfot har en
    #    navlänk "EU-lager & tull" som ligger EFTER beskrivningen.
    egen = re.sub(r"\s+", " ", synlig(v["html"])).strip()
    forst, sist = egen[:70], egen[-70:]
    plan = re.sub(r"\s+", " ", s)
    i, j = plan.find(forst), plan.find(sist)
    if i < 0:
        fel.append("%s: beskrivningens FÖRSTA mening står inte på sidan" % id8)
    elif j < i:
        fel.append("%s: beskrivningens SISTA mening står inte på sidan" % id8)
    else:
        m = LAND_FRAS.search(plan[i:j + len(sist)])
        if m:
            fel.append("%s: avsändarfras i VÅR text — %r" % (id8, m.group(0)))

print("%-10s %-46s %-5s %-5s %-8s %s" % ("id8", "slug", "kod", "age", "cache", "bytes"))
for r in rader:
    print("%-10s %-46s %-5s %-5s %-8s %d" % r)
print()
for f in fel:
    print("FEL:", f)
print()
print("Live: alla %d sidor rena." % len(P) if not fel
      else "LIVE-GRINDEN FÄLLER: %d fel" % len(fel))
raise SystemExit(1 if fel else 0)
