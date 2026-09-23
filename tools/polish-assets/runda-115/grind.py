# -*- coding: utf-8 -*-
"""Runda 115 Steg 7 — textgrind för de sju sparkfordonen.

☠️ RUNDANS EGEN HUVUDGRIND ÄR TRAMPGRINDEN. Leverantören kallar samma vara
   både `Rutschauto` och `Tretauto`; bilden visar noll pedaler. Ett ord som
   `trampbil` eller `pedaler` får bara stå NEGERAT.

☠️ NEGATIONEN LÄSES PER MENING, INTE PER STYCKE. Runda 114 fick en FALSK
   GODKÄNNANDE när ett `ingen` 120 tecken bort i en ANNAN FAQ-fråga ursäktade
   ett löfte. `_nasta_mening` returnerar EN mening och `?` räknas som
   meningsslut.

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

# ── Rundans löftesgrindar ───────────────────────────────────────────────────
TRAMPLOFTE = re.compile(
    r"\b(trampbil\w*|trampfordon\w*|tramptraktor\w*|trampa[rs]?\b|trampas"
    r"|pedal\w*|kedjedriv\w*|vevas)\b", re.I)
MOTORLOFTE = re.compile(
    r"\b(eldriv\w*|elektrisk\w*|batteridriv\w*|motordriv\w*|elmotor\w*"
    r"|laddningsbar\w*|k[öo]r\w*\s+av\s+sig)\b", re.I)
GASTOLSLOFTE = re.compile(
    r"\b(g[åa]stol\w*|g[åa]vagn\w*|l[äa]r\w*\s+sig\s+g[åa]|g[åa]ngtr[äa]ning\w*"
    r"|l[äa]rar?\s+barnet\s+att\s+g[åa]|motorik\w*|utveckla\w*)\b", re.I)
TOALETT = re.compile(r"\b(toalett\w*|potta\w*|n[öo]dtoalett\w*|bajs\w*)\b", re.I)
FARTLOFTE = re.compile(
    r"\b(snabb\w*|fart\w*fylld|rusar|k[öo]r\w*\s+fort|h[öo]g\s+hastighet)\b", re.I)

TONGRINDAR = (
    ("LEVERANTÖRSATTRIBUTION",
     re.compile(r"\bleverant[öo]r(?:en|ens|er|ers)?\b", re.I)),
    # ☠️ MÖNSTRET VAR FÖR BRETT — `\brundan?s?\b` fångade ADJEKTIVET i "den
    #    runda logotypen" och fällde en korrekt alt-text (runda 115). Jargongen
    #    är substantivet: "rundan", "rundans", "runda 115". Adjektivet "runda"
    #    tar aldrig bestämd -n framför sitt huvudord, så de bestämda formerna
    #    är entydiga; bara den NAKNA formen är tvetydig och den kräver därför
    #    en siffra efter sig. Samma lärdom som uppgift #398: en grind skriven
    #    mot den PLATS där felet hittades täcker inte REGELN.
    # ☠️ ETT PREDIKAT PÅ FEL SUBJEKT. "Ratten har tuta och strålkastare, och
    #    DE ger ljud" lade ljudet på strålkastarna också. En strålkastare ger
    #    ljus. Felet nådde live och hittades med ögon — grinden vaktade tal,
    #    märken och ton, inte vad ett ord faktiskt kan göra.
    ("LJUD FRÅN EN LJUSKÄLLA",
     re.compile(r"\bstr[åa]lkastar\w*[^.]{0,40}\bljud\b"
                r"|\bljus\w*[^.]{0,25}\bger\s+ljud\b", re.I)),
    ("INTERN JARGONG", re.compile(r"\brundans?\b|\brunda\s+\d", re.I)),
    # ☠️ OMVÄND ORDFÖLJD SLAPP IGENOM. Regexen fångade "vi har inte fått" men
    #    inte "har vi inte fått", och den formen stod kvar i en text som
    #    grinden godkände. Svensk huvudsatsinversion är regel, inte undantag —
    #    ett tonmönster måste tåla båda ledföljderna.
    ("VI HAR FÅTT — pekar på en tredje part",
     re.compile(r"\b(?:vi\s+har|har\s+vi)\s+(?:inte\s+)?f[åa]tt\b", re.I)),
)

# ☠️ MÄRKET SKRIVS BARA DÄR LICENSEN ÄR UTTALAD.
MARKE = re.compile(r"\b(Caterpillar|CAT\b|New\s*Holland|PawHut|HOMCOM|Outsunny"
                   r"|Aiyaplay|Vinsetto|Aosom)\b")

FORBJUDET = [
    ("tyskt ord", re.compile(
        r"\b(Rutschauto|Rutschfahrzeug|Tretauto|Trettraktor|Kinderbagger|"
        r"Sitzbagger|Aufsitzbagger|Lauflernhilfe|Schiebstange|Stauraum|"
        r"Kippschutz|Belastbarkeit|Gesamtma[ßs]e|Lieferumfang|Anh[äa]nger|"
        r"Gelb|Blau\b|Schwarz)\b")),
    ("engelskt skräp", re.compile(r"\b(ride[- ]on|NOTICE SAFETY|TRUCK)\b")),
    ("lagerland", re.compile(r"Skickas fr[åa]n\s+(Tyskland|Polen|Spanien|Kina)", re.I)),
    ("artikelnummer", G.ARTNR),
    ("trasig relativ länk", re.compile(r"https:/produkt")),
]

# ☠️ NEGATIONEN, MENINGSHJÄLPARNA OCH LÖFTESSTRAFFET BOR I `grindar.py`
#    SEDAN RUNDA 116. De låg som en kopia här, och kopian hann bli fel inom EN
#    session: livegrind.py skrev en egen `leveransloften` vars FAQ-undantag
#    testade `mening.endswith("?")` medan `_mening_kring` klipper FÖRE
#    frågetecknet — och läste därför JSON-LD:ns "Ingår batterier?" som ett
#    löfte på fyra av sex KORREKTA sidor. Husets vanligaste bugg.
#    Namnen behålls här så modulens anropare (livegrind.py) inte ändras.
NEGATION = G.NEGATION
_slut = G.meningsslut
_mening_kring = G.mening_kring
_nasta_mening = G.nasta_mening
loftestraff = G.loftestraff
LEVERANS = G.LEVERANS
TILLBEHOR = G.TILLBEHOR


def leveransloften(nyckel, syn):
    """Rundans signatur — leveransomfattningen slås upp i matt.INGAR."""
    return G.leveransloften(syn, M.INGAR[nyckel], nyckel)


def sidans_tal(k):
    """Talen produkten SJÄLV får bära. Allt annat är någon annans."""
    t = set()
    for trio in (M.YTTRE[k], M.PAKET[k], M.SITS.get(k), M.SLAP.get(k)):
        if trio:
            t |= {T.tal(x) for x in trio}
    if M.RYGGSTOD.get(k):
        t |= {T.tal(x) for x in M.RYGGSTOD[k]}
    if k in M.SITSHOJD:
        t.add(T.tal(M.SITSHOJD[k]))
    if k in M.HJUL:
        t |= {T.tal(v) for v in M.HJUL[k].values()}
    t |= {T.tal(M.VIKT[k]), T.tal(M.MAXLAST[k])}
    t |= {str(M.ALDER[k][0]), str(M.ALDER[k][1])}
    t |= {"2"}          # två spakar / två AAA-batterier / två skydd
    return t


TAL = re.compile(r"(?<![\w,.])(\d+(?:,\d+)?)(?![\w])")



def granska(nyckel, d):
    fel = []
    txt = d["plainDescription"]
    allt = " ".join([d["name"], T.TITEL[nyckel], T.META[nyckel], txt])
    # Syskonlänkens stycke bär GRANNENS ord och GRANNENS tal.
    egen = re.sub(r"<p>Finns också som .*?</p>", "", allt, flags=re.S)
    syn = G.synlig_meningstext(egen)

    for etikett, monster in (
            ("TRAMPLÖFTE — varan har inga pedaler", TRAMPLOFTE),
            ("MOTORLÖFTE — varan har ingen motor", MOTORLOFTE),
            ("GÅSTOLSLÖFTE — EN 1273 är en annan produktkategori", GASTOLSLOFTE),
            ("NÖDTOALETT — leverantörens formulering, inte vår", TOALETT),
            ("FARTLÖFTE — farten är barnets egen", FARTLOFTE)):
        m = loftestraff(monster, syn)
        if m:
            i = max(0, m.start() - 70)
            fel.append(f"{etikett}: …{syn[i:m.end() + 70]}…")

    for etikett, monster in TONGRINDAR:
        m = monster.search(syn)
        if m:
            i = max(0, m.start() - 60)
            fel.append(f"{etikett}: …{syn[i:m.end() + 60]}…")

    # ☠️ Märket bara där licensen är uttalad.
    for m in MARKE.finditer(allt):
        if M.LICENS.get(nyckel) != m.group(0):
            fel.append(f"OLICENSIERAT MÄRKE I TEXT: {m.group(0)!r}")

    for etikett, monster in FORBJUDET:
        m = monster.search(allt)
        if m:
            fel.append(f"{etikett}: {m.group(0)!r}")

    fel += leveransloften(nyckel, syn)

    # ── Talgrinden, ZONINDELAD ──────────────────────────────────────────────
    # ☠️ Ett LÄNKAT tal får bara stå i länkens EGET stycke. Utanför det gäller
    #    produktens egen uppsättning ensam — runda 92:s lärdom.
    egna = sidans_tal(nyckel)
    granne = SYSKONTAL(nyckel)
    for stycke in re.findall(r"<(?:p|li|h2)\b[^>]*>.*?</(?:p|li|h2)>", txt, re.S):
        tillatna = egna | granne if "<a href" in stycke else egna
        ren = G.synlig_meningstext(stycke)
        for m in TAL.finditer(ren):
            if m.group(1) not in tillatna:
                i = max(0, m.start() - 50)
                fel.append(f"OHÄRLETT TAL {m.group(1)!r}: …{ren[i:m.end()+50]}…")

    # ── Rundans signatur: pedalfrågan MÅSTE besvaras, och med nej ────────────
    if "Har den pedaler?" not in txt:
        fel.append("PEDALFRÅGAN SAKNAS — den är rundans viktigaste besked")
    if T.yttre(nyckel) not in txt:
        fel.append(f"yttermåttet {T.yttre(nyckel)} står inte i texten")
    if not txt.rstrip().endswith("</p>"):
        fel.append("texten slutar inte på ett stycke")
    for f in ("Tekniska specifikationer", "Användning och skötsel",
              "Vanliga frågor"):
        if f"<h2>{f}</h2>" not in txt:
            fel.append(f"fliken {f!r} saknas")
    return fel


def SYSKONTAL(k):
    """Talen syskonets EGET stycke får bära.

    ⚠️ Ett syskon UTANFÖR rundan har inga mätta tal här — då är den tillåtna
       mängden TOM, alltså strängare än för ett syskon i rundan. Det är rätt
       håll: ett tal vi inte mätt får inte stå i texten bara för att det
       nämns i en länk.
    """
    m = T.SYSKON[k][0]
    return sidans_tal(m) if m in T.SLUG else set()


def _sjalvtest():
    n = "39d85f18"
    bas = {"name": T.NAMN[n], "plainDescription": T.bygg(n)}

    def med(extra):
        d = dict(bas)
        d["plainDescription"] = bas["plainDescription"].replace(
            "</p>", "</p>" + extra, 1)
        return d

    fall = [
        ("A rakt tramplöfte            ", "TRAMPLÖFTE",
         med("<p>Barnet trampar sig fram.</p>"), True),
        ("B negerat tramplöfte         ", "TRAMPLÖFTE",
         med("<p>Den har inga pedaler alls.</p>"), False),
        ("C pedalfrågans egna nej      ", "TRAMPLÖFTE", bas, False),
        ("D motorlöfte                 ", "MOTORLÖFTE",
         med("<p>Traktorn är eldriven.</p>"), True),
        ("E negerat motorlöfte         ", "MOTORLÖFTE",
         med("<p>Den är inte eldriven.</p>"), False),
        ("F gåstolslöfte               ", "GÅSTOLSLÖFTE",
         med("<p>Ett stöd när barnet lär sig gå.</p>"), True),
        ("G nödtoalett                 ", "NÖDTOALETT",
         med("<p>Facket går att använda som potta.</p>"), True),
        ("H leverantörsattribution     ", "LEVERANTÖRSATTRIBUTION",
         med("<p>Leverantören anger 25 kg.</p>"), True),
        ("I olicensierat märke         ", "OLICENSIERAT MÄRKE",
         med("<p>Traktorn är en New Holland.</p>"), True),
        ("J tyskt ord                  ", "tyskt ord",
         med("<p>Ett riktigt Rutschauto.</p>"), True),
        ("K artikelnummer              ", "artikelnummer",
         med("<p>Modell 000-0000X.</p>"), True),
        ("L ohärlett tal               ", "OHÄRLETT TAL",
         med("<p>Den väger 77 kg.</p>"), True),
        ("M syskonets tal i EGET stycke", "OHÄRLETT TAL",
         med("<p>Släpet är 60 cm.</p>"), True),
        ("N fartlöfte                  ", "FARTLÖFTE",
         med("<p>Den kör fort på asfalt.</p>"), True),
        ("O omvänd ordföljd: har vi fått", "VI HAR FÅTT",
         med("<p>Det måttet har vi inte fått.</p>"), True),
        # ☠️ Q–S: leveranslöftet. Runda 115 lovade en leksakshink i FYRA fält
        #    på fb142c5c; INGAR säger `fordonet, bruksanvisning` och bild 4
        #    visar maskinens EGEN frontskopa. Ingen dåvarande grind såg det.
        ("Q otäckt leveranslöfte       ", "LEVERANSLÖFTE",
         med("<p>En hink följer med i lådan.</p>"), True),
        ("R täckt leveranslöfte        ", "LEVERANSLÖFTE",
         med("<p>En kratta följer med i lådan.</p>"), False),
        # ☠️ S är den som gör grinden användbar: FAQ:ns "Ingår batterier?" är
        #    en fråga, och svaret negerar den i NÄSTA mening. Utan regeln
        #    fyrade grinden på alla sju KORREKTA sidor — och ett falsklarm som
        #    alltid fyrar lär mottagaren att sluta läsa.
        ("S fråga med negerande svar   ", "LEVERANSLÖFTE",
         med("<p><strong>Ingår verktyg?</strong></p><p>Nej.</p>"), False),
        ("T jargong: substantivet      ", "INTERN JARGONG",
         med("<p>Vi tog den i rundan innan jul.</p>"), True),
        ("U jargong: numrerad runda     ", "INTERN JARGONG",
         med("<p>Se runda 115 för syskonen.</p>"), True),
        # ☠️ V är falsklarmet som mönstret FAKTISKT gav: "runda" som ADJEKTIV.
        ("V adjektivet runda            ", "INTERN JARGONG",
         med("<p>Den runda logotypen i rattnavet.</p>"), False),
        ("Y ljud från strålkastaren     ", "LJUD FRÅN EN LJUSKÄLLA",
         med("<p>Strålkastarna ger ljud när barnet trycker.</p>"), True),
        ("Z ljud från TUTAN, ljus från   ", "LJUD FRÅN EN LJUSKÄLLA",
         med("<p>Tutan låter och strålkastarna lyser.</p>"), False),
        ("P ren text                   ", "", bas, False),
    ]
    fel = 0
    for etikett, sok, d, ska in fall:
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
    for k in M.YTTRE:
        d = {"name": T.NAMN[k], "plainDescription": T.bygg(k)}
        fel = granska(k, d)
        tot += len(fel)
        print(f"{'OK ' if not fel else 'FEL'} {k}  {T.SLUG[k]}")
        for x in fel:
            print("      ✗", x)
    print(f"\n{tot} fel i texterna, {f} fel i självtestet")
    sys.exit(1 if (tot or f) else 0)
