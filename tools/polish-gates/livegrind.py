# LIVE-GRIND — grindar den PUBLICERADE texten, inte bara kallfilen.
#
# ☠️ FILGRINDEN TACKER BARA HALVA VAGEN. Batch 65 (2026-09-04) matte upp det:
# filgrinden var ren, och tva fel uppstod anda NAR texten skrevs in i
# API-anropet — ett kyrilliskt "t" (U+0442) i "granträ" och tre forekomster av
# "träådrad" som blev "tråådrad". PATCH-svaret ekade bada tillbaka som korrekta,
# for det ar ju precis det man skickade. De nadde live.
#
# Det som fangar dem ar en MEKANISK jamforelse mot det som faktiskt ligger ute.
# Nionde gangen samma husregel: ett svar utan fel ar inget kvitto.
#
# ANVANDNING (kor fran batch-katalogen):
#   slugs.txt:  "p1 min-produkt-slug"  en rad per produkt
#   p1.html ... kallfilerna som skickades till Wix
#   live/      hamtade sidor:  curl -o live/p1.html https://www.fyndplats.se/produkt/<slug>
#   python3 livegrind.py        -> exit 1 vid avvikelse
#
# TRE KONTROLLER:
#   1. ORDDIFF mot kallfilen   -> fangar VARJE transkriberingsfel
#   2. HOMOGLYFER i live-texten -> kyrilliskt/grekiskt som slunkit in
#   3. SIDSVEP + ALT-SVEP       -> husmarke, artikelnummer, fraktland, tyska
#   4. SEO-SVEP                 -> <title> och meta description
#
# ☠️ SEO-FALTEN AR EN EGEN BLIND FLACK, och den var oupptackt till 2026-09-06.
# Poleringen ror `name` och beskrivningen men ALDRIG `seoData` — importen
# skriver tysk titel och tysk metabeskrivning, och ingenting skrev over dem. Alla
# atta sidor i runda F1 lag ute med `<title>Kratzbaum Deckenhoch...</title>`
# medan brodtexten var invandningsfri svenska. Det ar det Google VISAR.
#
# Tva skal till att svepen ovan inte racker:
#   * meta description ligger i ett ATTRIBUT. `brodtext` strippar taggar, sa
#     attributinnehall ar osynligt for sidsvepet — exakt samma blinda flack som
#     alt-texterna hade.
#   * <title> syns visserligen i sidsvepet, men bara for att den GERMANSKA
#     titeln rakade innehalla `228-260` och traffa artikelnummer-monstret.
#     "Schlafsessel, Gastebett..." (runda D1) hade gatt rakt igenom.
#
# Finns `seo.tsv` i rundans katalog jamfors live-faltet EXAKT mot den — mekaniskt,
# alltsa oberoende av vilka tyska ord nagon rakat tanka pa. Saknas filen faller
# svepet tillbaka pa monstren, som ar battre an ingenting men inte ett kvitto.
#
# ⚠️ Butiken delar upp beskrivningen i flikar (pdp-flikar/details/summary), sa
# HTML:en ar med flit INTE identisk med kallfilen. Jamfor BRODTEXT, inte markup.
#
# ⚠️ ALT-TEXTER MASTE SVEPAS SEPARAT. Sidsvepet strippar taggar, sa alt="" ar
# osynligt for det — och det ar just dar de tyska resterna sitter kvar efter en
# polering som bara rort beskrivningen.
#
# ⚠️ VANTA UT BUTIKENS ISR-CACHE. Sidorna ar prerenderade
# (x-nextjs-stale-time: 300). En hamtning direkt efter skrivningen serverar den
# GAMLA sidan, och den ser ut precis som en fungerande ny. Forsta traffen efter
# fonstret triggar en bakgrundsrendering; NASTA hamtning far den farska sidan.

import os, re, sys, unicodedata, html, difflib

BRANDS = ["homcom","outsunny","pawhut","aiyaplay","aosom","sportnow","vinsetto",
          "kleankin","zonekiz","durhand"]
LAND   = ["tyskland","germany","deutschland","från polen","från spanien","made in china"]
TYSKA  = ["hundehütte","kaninchenstall","hasenstall","kleintierstall","wetterfest",
          "tannenholz","rädern","klappdach","lieferumfang","beschreibung",
          "technische","größe","maße","fressnäpfen","dachterrasse","massivholz"]
KOD    = re.compile(r"\b(?:[A-Z]?\d{2,3}-\d{3}[A-Z0-9]*)\b")

def brodtext(s):
    s = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", s)
    s = re.sub(r"<[^>]+>", " ", s)
    return " ".join(html.unescape(s).split())

# seo.tsv ar VALFRI: aldre rundor har ingen. Finns den blir SEO-svepet en exakt
# jamforelse i stallet for en monstergissning.
VANTAT_SEO = {}
try:
    for _r in open("seo.tsv", encoding="utf-8"):
        if _r.strip():
            _i, _t, _d = _r.rstrip("\n").split("\t")
            VANTAT_SEO[_i] = (_t, _d)
except FileNotFoundError:
    pass

fel = 0
for rad in open("slugs.txt", encoding="utf-8"):
    if not rad.strip(): continue
    p, slug = rad.split()
    live = open(f"live/{p}.html", encoding="utf-8").read()
    problem = []

    # ☠️ EN BACKFILL-RUNDA HAR INGEN KALLFIL. Da ar brodtexten inte skriven i
    # den har rundan — bara SEO-faltet ar det — och orddiffen har ingenting att
    # jamfora mot. Den hoppas over, men TYST far den inte goras: raden skriver
    # ut "utan kallfil" sa ingen tror att den starkaste kontrollen kordes.
    har_kalla = os.path.exists(f"{p}.html")
    fil = open(f"{p}.html", encoding="utf-8").read() if har_kalla else ""

    # --- 1. ORDDIFF mot kallfilen ---
    a, start = [], -1
    if har_kalla:
        a = brodtext(fil).split()
        start = live.find(fil[:60])
        if start < 0:
            problem.append("HITTAR INTE TEXTEN PA SIDAN")
            b = []
        else:
            b = brodtext(live[start:start+len(fil)+6000]).split()[:len(a)]
        for d in [x for x in difflib.ndiff(a, b) if x[0] in "+-"][:12]:
            problem.append(f"ORDDIFF {d}")

    # --- 2. HOMOGLYFER i live-texten ---
    txt = brodtext(live[start:start+len(fil)+200]) if start >= 0 else ""
    for i, ch in enumerate(txt):
        if ord(ch) > 127 and ch not in "ÅÄÖåäöÉéÜü×—–…§°":
            n = unicodedata.name(ch, "?")
            if "CYRILLIC" in n or "GREEK" in n:
                problem.append(f"HOMOGLYF {ch!r} U+{ord(ch):04X}: ...{txt[max(0,i-30):i+30]}...")

    # --- 3. SIDSVEP: hela den publicerade sidan, inte bara beskrivningen ---
    hel = brodtext(live)
    hel_low = hel.lower()
    for bm in BRANDS:
        if re.search(r"(?<![a-zåäö])" + bm + r"(?![a-zåäö])", hel_low):
            j = hel_low.find(bm)
            problem.append(f"SIDA/HUSMARKE {bm}: ...{hel[max(0,j-50):j+50]}...")
    for l in LAND:
        if l in hel_low:
            j = hel_low.find(l)
            problem.append(f"SIDA/LAND {l}: ...{hel[max(0,j-50):j+50]}...")
    for w in TYSKA:
        if re.search(r"(?<![a-zåäöéü])" + re.escape(w) + r"(?![a-zåäöéü])", hel_low):
            j = hel_low.find(w)
            problem.append(f"SIDA/TYSKT {w!r}: ...{hel[max(0,j-60):j+60]}...")
    for m in set(KOD.findall(hel)):
        problem.append(f"SIDA/ARTIKELNUMMER {m}")

    # --- 3b. ALT-TEXTER. Sidsvepet ovan strippar taggar, sa alt="" ar osynligt
    #     for det. Efter batch 66 ar det just dar de tyska resterna satt kvar.
    for alt in set(html.unescape(x) for x in re.findall(r'alt="([^"]{4,})"', live)):
        al = alt.lower()
        for bm in BRANDS:
            if re.search(r"(?<![a-z\u00e5\u00e4\u00f6])" + bm + r"(?![a-z\u00e5\u00e4\u00f6])", al):
                problem.append(f"ALT/HUSMARKE {bm}: {alt[:90]}")
        for w in TYSKA:
            if re.search(r"(?<![a-z\u00e5\u00e4\u00f6\u00e9\u00fc])" + re.escape(w) + r"(?![a-z\u00e5\u00e4\u00f6\u00e9\u00fc])", al):
                problem.append(f"ALT/TYSKT {w!r}: {alt[:90]}")
        for l in LAND:
            if l in al:
                problem.append(f"ALT/LAND {l}: {alt[:90]}")
        for m in KOD.findall(alt):
            problem.append(f"ALT/ARTIKELNUMMER {m}: {alt[:90]}")

    # --- 3c. SEO-SVEP: <title> och meta description ---
    def _meta(namn, attr="name"):
        m = re.search(rf'<meta {attr}="{namn}" content="(.*?)"', live, re.S)
        return html.unescape(m.group(1)) if m else None

    _t = re.search(r"<title>(.*?)</title>", live, re.S)
    seo = {"title": html.unescape(_t.group(1)) if _t else None,
           "description": _meta("description"),
           "og:title": _meta("og:title", "property"),
           "og:description": _meta("og:description", "property")}

    if VANTAT_SEO.get(p):
        # Exakt jamforelse mot seo.tsv. Den ar det enda riktiga kvittot:
        # den bryr sig inte om vilket sprak felet rakar vara pa.
        vt, vd = VANTAT_SEO[p]
        if seo["title"] != vt:
            problem.append(f"SEO/TITEL avviker fran seo.tsv\n        vantat: {vt}\n        live:   {seo['title']}")
        if seo["description"] != vd:
            problem.append(f"SEO/BESKRIVNING avviker fran seo.tsv\n        vantat: {vd}\n        live:   {seo['description']}")
    for falt, varde in seo.items():
        if not varde:
            problem.append(f"SEO/{falt.upper()} SAKNAS PA SIDAN")
            continue
        vl = varde.lower()
        for bm in BRANDS:
            if re.search(r"(?<![a-zåäö])" + bm + r"(?![a-zåäö])", vl):
                problem.append(f"SEO/{falt} HUSMARKE {bm}: {varde[:90]}")
        for w in TYSKA:
            if re.search(r"(?<![a-zåäöéü])" + re.escape(w) + r"(?![a-zåäöéü])", vl):
                problem.append(f"SEO/{falt} TYSKT {w!r}: {varde[:90]}")
        for l in LAND:
            if l in vl:
                problem.append(f"SEO/{falt} LAND {l}: {varde[:90]}")
        for m in KOD.findall(varde):
            problem.append(f"SEO/{falt} ARTIKELNUMMER {m}: {varde[:90]}")

    # --- 4. Korslanken ska ha overlevt ---
    #
    # ☠️ INGEN KRASCH NAR KALLAN SAKNAR LANK. Forr gjorde raden .group(1) rakt
    # pa ett sokresultat som kan vara None: en batch utan korslankar fallde
    # grinden med AttributeError i stallet for att rapportera. En grind som
    # kraschar ar en grind man slutar kora — och da ar aven de tre ovanstaende
    # kontrollerna borta. Saknad lank i KALLAN ar inget fel; en lank som INTE
    # overlevt till live ar det.
    _m = re.search(r'href="(https://www\.fyndplats\.se/produkt/[^"]+)"', fil)
    if _m and _m.group(1).split("/produkt/")[1] not in live:
        problem.append(f"KORSLANK SAKNAS: {_m.group(1)}")

    diffrad = (f"ord={len(a)} diff={len([x for x in problem if x.startswith('ORDDIFF')])}"
               if har_kalla else "utan kallfil (ingen orddiff)")
    print(f"{p} {slug}: {diffrad} "
          f"-> {'REN' if not problem else str(len(problem)) + ' FEL'}")
    for x in problem:
        print(f"    ! {x}")
        fel += 1

print()
print("TOTALT:", fel, "avvikelser i den PUBLICERADE texten")
sys.exit(1 if fel else 0)
