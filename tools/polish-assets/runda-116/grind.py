# -*- coding: utf-8 -*-
"""Runda 116 Steg 7 — textgrind för de sju hundvagnarna.

☠️ RUNDANS EGEN HUVUDGRIND ÄR CYKELGRINDEN. Ingen av vagnarna har cykelfäste.
   En tillkopplad cykelkärra har ett svenskt utrustningskrav (röd reflex eller
   baklykta bakåt), så ett antytt cykelbruk vore både ett falskt påstående om
   varan OCH en regelfråga vi inte kan uppfylla. Ordet `cykel` får bara stå
   NEGERAT.

☠️ DEN ANDRA HUVUDGRINDEN ÄR TALET 4 KG I GRUPP B. Leverantören kallar den
   vagnen "leicht (4 kg)" medan spec-kolumnen säger 5,9 kg — och 4 kg är
   samtidigt grupp A:s HUNDVIKT. Talgrinden fäller på det av sig själv, men
   felet är så farligt att det får en egen, namngiven grind: ett OHÄRLETT TAL
   i loggen läses som slarv, en FÖRVÄXLAD HUNDVIKT läses som det den är.

☠️ LÖFTESMASKINERIET IMPORTERAS från `grindar.py` — det skrivs inte om.
   Runda 115:s livegrind skrev en egen kopia och den var trasig på sin första
   körning. Se uppgift #423.

⚠️ Alla självtestfall prövas ÅT BÅDA HÅLLEN.
"""
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
import grindar as G                                              # noqa: E402
sys.path.insert(0, HAR)
import matt as M                                                 # noqa: E402
import texter as T                                               # noqa: E402

NEGATION = G.NEGATION
loftestraff = G.loftestraff

# ── Rundans löftesgrindar ───────────────────────────────────────────────────
CYKELLOFTE = re.compile(
    r"\b(cykel\w*|cykla\w*|dragkrok\w*|kopplas\s+efter|tillkopplad\w*"
    r"|sl[äa]pvagn\w*\s+till\s+cykel)\b", re.I)
# ☠️ En vagn är TRANSPORT, inte förvaring. L80 gäller djurhållning, och ett
#    ord som antyder att hunden bor eller lämnas i vagnen tar oss dit.
BOSTADSLOFTE = re.compile(
    r"\b(sovplats\w*|bo\s+i\s+den|l[äa]mna\w*\s+hunden|hundb[äa]dd\w*"
    r"|[öo]vernatt\w*|f[öo]rvara\s+hunden)\b", re.I)
# ☠️ Ingen av vagnarna har regnskydd. Den PUBLICERADE grannen har det, och den
#    som skriver mot grannens text tar med ordet av misstag.
REGNLOFTE = re.compile(
    r"\b(regnskydd\w*|regnt[äa]ck\w*|vattent[äa]t\w*|t[åa]l\s+regn"
    r"|skyddar\s+mot\s+regn)\b", re.I)
# ☠️ En hopfällbar tygvagn är inte ett fordon. Fart- och terränglöften är
#    leverantörens ton, inte vår.
TERRANGLOFTE = re.compile(
    r"\b(terr[äa]ng\w*|off[- ]?road|alla\s+underlag|vilket\s+underlag\s+som"
    r"|klarar\s+allt)\b", re.I)

TONGRINDAR = (
    ("LEVERANTÖRSATTRIBUTION",
     re.compile(r"\bleverant[öo]r(?:en|ens|er|ers)?\b", re.I)),
    ("INTERN JARGONG", re.compile(r"\brundans?\b|\brunda\s+\d", re.I)),
    ("VI HAR FÅTT — pekar på en tredje part",
     re.compile(r"\b(?:vi\s+har|har\s+vi)\s+(?:inte\s+)?f[åa]tt\b", re.I)),
    # ☠️ REFLEX ÄR PASSIV. Ett band som "lyser" är en ljuskälla; det här
    #    återkastar ljus. Samma klass som runda 115:s strålkastare som gav
    #    LJUD — ett predikat på fel subjekt, och ögat är enda grinden som
    #    hittar det om mönstret inte finns.
    ("REFLEX SOM LJUSKÄLLA",
     re.compile(r"\breflex\w*[^.]{0,40}\b(lyser|lyste|belyser|ger\s+ljus)\b",
                re.I)),
)

# ☠️ MÄRKET SKRIVS ALDRIG — ingen av de sju har en uttalad licens.
MARKE = re.compile(r"\b(PawHut|HOMCOM|Outsunny|Aiyaplay|Vinsetto|Aosom)\b")

FORBJUDET = [
    ("tyskt ord", re.compile(
        r"\b(Hundewagen|Hundebuggy|Haustierwagen|Katzenwagen|Bodenkorb|"
        r"Netzfenster|Aufbewahrungskorb|Kissen|Regenschutz|Vordach|"
        r"Becherhalter|Reflektorstreif\w*|Sicherheitsleinen|Klappbar|"
        r"Faltbar|Belastbarkeit|Gesamtabmessungen|Lieferumfang|Montage|"
        r"Grau|Blau\b|Rot\b|Kaffee)\b")),
    ("engelskt skräp", re.compile(r"\b(pet stroller|dog buggy|Oxford cloth)\b", re.I)),
    ("lagerland", re.compile(r"Skickas fr[åa]n\s+(Tyskland|Polen|Spanien|Kina)", re.I)),
    ("artikelnummer", G.ARTNR),
    ("trasig relativ länk", re.compile(r"https:/produkt")),
]

TAL = re.compile(r"(?<![\w,.])(\d+(?:,\d+)?)(?![\w])")
# Tal som varje sida får bära utan att stå i en måttsträng: antalsord som
# skrivs med siffra i löptext förekommer inte, men FAQ:ns rubriknivåer och
# HTML:en innehåller inga tal alls — listan hålls därför tom med flit.
EXTRA_TAL = set()


def sidans_tal(k):
    """Talen produkten SJÄLV får bära — allt som står i dess måttrader."""
    g = M.GRUPP[k]
    kallor = list(M.MATT[g].values()) + [M.PAKET[k]]
    t = set()
    for s in kallor:
        t |= set(TAL.findall(s))
    return t | EXTRA_TAL


def SYSKONTAL(k):
    """Talen syskonets EGET stycke får bära.

    ⚠️ Ett syskon UTANFÖR rundan har inga mätta tal här — då är mängden TOM,
       alltså strängare. Ett tal vi inte mätt får inte stå i texten bara för
       att det nämns i en länk.
    """
    mal = T.SYSKON[k][0]
    return sidans_tal(mal) if mal in M.ALLA else set()


def granska(nyckel, d):
    fel = []
    txt = d["plainDescription"]
    allt = " ".join([d["name"], T.TITEL[nyckel], T.META[nyckel], txt])
    # Syskonlänkens stycke bär GRANNENS ord och GRANNENS tal.
    egen = re.sub(r"<p>Finns också som .*?</p>", "", allt, flags=re.S)
    syn = G.synlig_meningstext(egen)

    for etikett, monster in (
            ("CYKELLÖFTE — vagnen har inget cykelfäste", CYKELLOFTE),
            ("BOSTADSLÖFTE — en vagn är transport, inte djurhållning",
             BOSTADSLOFTE),
            ("REGNSKYDDSLÖFTE — det har grannens vagn, inte den här",
             REGNLOFTE),
            ("TERRÄNGLÖFTE — leverantörens ton, inte vår", TERRANGLOFTE)):
        m = loftestraff(monster, syn)
        if m:
            i = max(0, m.start() - 70)
            fel.append(f"{etikett}: …{syn[i:m.end() + 70]}…")

    for etikett, monster in TONGRINDAR:
        m = monster.search(syn)
        if m:
            i = max(0, m.start() - 60)
            fel.append(f"{etikett}: …{syn[i:m.end() + 60]}…")

    for m in MARKE.finditer(allt):
        fel.append(f"OLICENSIERAT MÄRKE I TEXT: {m.group(0)!r}")

    for etikett, monster in FORBJUDET:
        m = monster.search(allt)
        if m:
            fel.append(f"{etikett}: {m.group(0)!r}")

    fel += G.leveransloften(syn, M.INGAR[nyckel], nyckel)

    # ── ☠️ Den förväxlade hundvikten, med eget namn ─────────────────────────
    if M.GRUPP[nyckel] == "B" and re.search(r"\b4\s*kg\b", syn):
        i = re.search(r"\b4\s*kg\b", syn).start()
        fel.append(f"FÖRVÄXLAD HUNDVIKT: '4 kg' står i en grupp B-text. Det är "
                   f"grupp A:s hundvikt OCH leverantörens felaktiga vagnvikt "
                   f"(spec säger {M.MATT['B']['vikt']}) — …{syn[max(0,i-60):i+60]}…")

    # ── Talgrinden, ZONINDELAD ──────────────────────────────────────────────
    egna = sidans_tal(nyckel)
    granne = SYSKONTAL(nyckel)
    for stycke in re.findall(r"<(?:p|li|h2|h3)\b[^>]*>.*?</(?:p|li|h2|h3)>",
                             txt, re.S):
        tillatna = egna | granne if "<a href" in stycke else egna
        ren = G.synlig_meningstext(stycke)
        for m in TAL.finditer(ren):
            if m.group(1) not in tillatna:
                i = max(0, m.start() - 50)
                fel.append(f"OHÄRLETT TAL {m.group(1)!r}: …{ren[i:m.end()+50]}…")

    # ── Rundans signatur: cykelfrågan MÅSTE besvaras, och med nej ───────────
    if "Går den att koppla efter en cykel?" not in txt:
        fel.append("CYKELFRÅGAN SAKNAS — den är rundans viktigaste besked")
    if M.MATT[M.GRUPP[nyckel]]["yttermatt"] not in txt:
        fel.append("yttermåttet står inte i texten")
    if M.FARG[nyckel] not in d["name"].lower():
        fel.append(f"färgen {M.FARG[nyckel]!r} står inte i produktnamnet")
    if not txt.rstrip().endswith("</p>"):
        fel.append("texten slutar inte på ett stycke")
    for f in ("Tekniska specifikationer", "Användning och skötsel",
              "Vanliga frågor"):
        if f"<h2>{f}</h2>" not in txt:
            fel.append(f"fliken {f!r} saknas")
    n = G.granska_namn(d["name"])
    if n:
        fel += n if isinstance(n, list) else [n]
    return fel


def _sjalvtest():
    def bas(n):
        return {"name": T.NAMN[n], "plainDescription": T.bygg(n)}

    def med(n, extra):
        d = bas(n)
        d["plainDescription"] = d["plainDescription"].replace(
            "</p>", "</p>" + extra, 1)
        return d

    A, B = "adc81917", "3b0aca0a"
    fall = [
        ("A rakt cykellöfte            ", A, "CYKELLÖFTE",
         med(A, "<p>Vagnen kopplas efter en cykel.</p>"), True),
        ("B negerat cykellöfte         ", A, "CYKELLÖFTE",
         med(A, "<p>Den går inte att koppla efter en cykel.</p>"), False),
        ("C cykelfrågans egna nej      ", A, "CYKELLÖFTE", bas(A), False),
        ("D bostadslöfte               ", A, "BOSTADSLÖFTE",
         med(A, "<p>Vagnen blir en fin sovplats.</p>"), True),
        ("E negerat bostadslöfte       ", A, "BOSTADSLÖFTE",
         med(A, "<p>Den är ingen sovplats.</p>"), False),
        ("F regnskyddslöfte            ", A, "REGNSKYDDSLÖFTE",
         med(A, "<p>Suffletten är vattentät.</p>"), True),
        ("G terränglöfte               ", A, "TERRÄNGLÖFTE",
         med(A, "<p>Hjulen klarar alla underlag.</p>"), True),
        ("H leverantörsattribution     ", A, "LEVERANTÖRSATTRIBUTION",
         med(A, "<p>Leverantören anger 4 kg.</p>"), True),
        ("I olicensierat märke         ", A, "OLICENSIERAT MÄRKE",
         med(A, "<p>Vagnen är en PawHut.</p>"), True),
        ("J tyskt ord                  ", A, "tyskt ord",
         med(A, "<p>Ett riktigt Hundebuggy.</p>"), True),
        ("K artikelnummer              ", A, "artikelnummer",
         med(A, "<p>Modell 000-0000X.</p>"), True),
        ("L ohärlett tal               ", A, "OHÄRLETT TAL",
         med(A, "<p>Den väger 77 kg.</p>"), True),
        ("M jargong: substantivet      ", A, "INTERN JARGONG",
         med(A, "<p>Vi tog den i rundan innan jul.</p>"), True),
        ("N adjektivet runda           ", A, "INTERN JARGONG",
         med(A, "<p>Den runda logotypen i navet.</p>"), False),
        ("O reflex som ljuskälla       ", B, "REFLEX SOM LJUSKÄLLA",
         med(B, "<p>Reflexbanden lyser i mörkret.</p>"), True),
        ("P reflex som återkastare     ", B, "REFLEX SOM LJUSKÄLLA", bas(B), False),
        ("Q otäckt leveranslöfte       ", A, "LEVERANSLÖFTE",
         med(A, "<p>En vattenflaska följer med i lådan.</p>"), True),
        ("R täckt leveranslöfte        ", A, "LEVERANSLÖFTE",
         med(A, "<p>En anvisning följer med i lådan.</p>"), False),
        ("S fråga med negerande svar   ", A, "LEVERANSLÖFTE",
         med(A, "<p><strong>Ingår regnskydd?</strong></p><p>Nej.</p>"), False),
        # ☠️ T är rundans farligaste fel, och det har en EGEN etikett så att
        #    loggen säger vad det är i stället för "ohärlett tal".
        ("T förväxlad hundvikt i B     ", B, "FÖRVÄXLAD HUNDVIKT",
         med(B, "<p>Vagnen väger bara 4 kg.</p>"), True),
        ("U samma tal i grupp A är rätt", A, "FÖRVÄXLAD HUNDVIKT", bas(A), False),
        ("V ren text A                 ", A, "", bas(A), False),
        ("Y ren text B                 ", B, "", bas(B), False),
    ]
    fel = 0
    for etikett, n, sok, d, ska in fall:
        traff = [x for x in granska(n, d) if not sok or sok in x]
        if bool(traff) != ska:
            print(f"  SJÄLVTEST FEL {etikett}: "
                  f"{'inget larm' if ska else 'falsklarm — ' + str(traff[:1])}")
            fel += 1
    print(f"självtest: {len(fall)} fall, {fel} fel")
    return fel


if __name__ == "__main__":
    M.kontroll()
    f = _sjalvtest()
    print()
    tot = 0
    for k in M.ALLA:
        d = {"name": T.NAMN[k], "plainDescription": T.bygg(k)}
        fel = granska(k, d)
        tot += len(fel)
        print(f"{'OK ' if not fel else 'FEL'} {k}  {T.SLUG[k]}")
        for x in fel:
            print("      ✗", x)
    print(f"\n{tot} fel i texterna, {f} fel i självtestet")
    sys.exit(1 if (tot or f) else 0)
