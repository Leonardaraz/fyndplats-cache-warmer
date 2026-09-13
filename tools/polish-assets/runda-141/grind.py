# -*- coding: utf-8 -*-
"""Runda 141 — textgrinden, med självtest åt BÅDA hållen (#505).

☠️ RUNDANS EGNA FÖRBUD, utöver den delade modulen:

   1. **`massiv`, `massivträ`, `bokträ`.** `18b94738`:s punktlista säger
      `Massivholz` och dess Technische Daten `Buche` — tre eniga rader ur
      leverantörens underlag. Zoomen på skivkanten visar staplade fanerskikt
      (STEG4.md 2). Ingen produkt i rundan har en stomme av massivt trä:
      `8de3c3ef` och `b4961e6f` har plywoodkärnor i dynorna. Förbudet är
      därför GLOBALT här, till skillnad från runda 140 där det var
      produktspecifikt.

   2. **`grön` på `8de3c3ef`.** Leverantören säger `Farbe: Grün`. Av bildens
      1 432 mättade pixlar är noll gröna — 91 % blå, 9 % turkos (STEG4.md 3).

   3. **CE och EN 957.** `EN 957`/`EN 20957` finns som standard för stationär
      träningsutrustning, men ingenting i underlaget säger att bänkarna är
      provade mot den. Ett standardnamn utan belägg är exakt den ogrundade
      certifiering som fälldes i runda 54 (#252).

   4. **`100 × 26` på `7b818c3b`.** Min egen Steg 3-transkribering bar 100 cm
      där måttritningen säger 110 (STEG4.md 5). Talet finns kvar i `matt.py`
      som `rygg_langd_transkriberad` för att kunna grindas bort — det
      harvestas INTE in i de tillåtna talen.

   5. **Attribution uppåt i ledet.** Mot kunden är VI leverantören (batch 64).

☠️ POSITIVA VILLKOR ur Steg 2, och det är rundans farligaste punkt:

   Sex av sju bänkar anger BÅDE en totalkapacitet och en max användarvikt,
   och den STÖRRE siffran står i marknadsföringen. Grinden kräver därför att
   användarvikten står i texten OCH att den är etiketterad som just
   användarvikt. `7b818c3b` anger ingen alls — där krävs i stället att texten
   SÄGER att den inte anges, så att tystnaden blir ett besked och inte en
   lucka.
"""
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grindar as G                                              # noqa: E402
import matt as M                                                 # noqa: E402
import texter as T                                               # noqa: E402


def _vikt(o):
    """Ordgräns som fungerar på svenska — `\\b` räcker inte (#324)."""
    return re.compile(r"(?<![0-9A-Za-zÅÄÖåäöÉéÜü])" + o
                      + r"(?![0-9A-Za-zÅÄÖåäöÉéÜü])", re.I)


FORBJUDET = [
    (re.compile(r"\b(?:som|se)\s+(?:ovan|nedan|ovanst[åa]ende|f[öo]reg[åa]ende)\b"
                r"|\b(?:ovanst[åa]ende|nedanst[åa]ende)\b", re.I),
     "SIDHÄNVISNING — en produktsida har inget 'ovan'"),
    (re.compile(r"^Samma\s+\w+", re.I),
     "DINGLANDE SYSKONREFERENS"),
    (re.compile(r"\brundan\b|\brunda\s+\d+|\bbatch\b|\butkast\b", re.I),
     "INTERN JARGONG"),
    (re.compile(r"\bmarknadens\b|\bbranschens\b|\bseriens\b"
                r"|\b(?:av|bland|i)\s+v[åa]r[at]?\b|\bvi\s+har\b"
                r"|\bi\s+sortimentet\b|\bhos\s+oss\s+[äa]r\b", re.I),
     "SORTIMENTSSUPERLATIV utan mätvärde (#522, #533)"),
    (_vikt(r"b[äa]st[ae]?"), "SUPERLATIV utan mätvärde"),
    (_vikt(r"st[öo]rst[ae]?"), "SUPERLATIV utan mätvärde"),
    (_vikt(r"h[öo]gst[ae]"), "SUPERLATIV utan mätvärde"),
    (re.compile(r"\bCE[-\s]?m[äa]rkt\w*|\bCE[-\s]?m[äa]rkning\w*", re.I),
     "CE-PÅSTÅENDE utan belägg"),
    (re.compile(r"\bEN\s?9\s?57\b|\bEN\s?20\s?957\b|\bISO\s?20957\b", re.I),
     "OGRUNDAD CERTIFIERING — inget i underlaget säger att bänkarna är provade"),
    (_vikt(r"massiv\w*"),
     "MASSIVT TRÄ — ingen stomme i rundan är det (STEG4.md 2)"),
    (_vikt(r"boktr[äa]\w*"),
     "BOK — leverantören säger Buche, bilden visar björkfaner i skikt"),
    (re.compile(r"\bstoss[äa]ker\w*|\bstött[åa]lig\w*|\bobrytbar\w*", re.I),
     "HÅLLFASTHETSSUPERLATIV utan mätvärde"),
]

SPECIFIKA = [
    ("8de3c3ef", _vikt(r"gr[öo]n\w*"),
     "GRÖN — mätt: noll gröna pixlar, 91 % blå (STEG4.md 3)"),
    ("7b818c3b", re.compile(r"100\s*[×x]\s*26"),
     "FEL DYNMÅTT — måttritningen säger 110 × 26 (STEG4.md 5)"),
    ("18b94738", _vikt(r"korg\w*"),
     "KORG — namnet säger Aufbewahrungskorb, ingen korg syns på någon bild"),
]

# ── POSITIVA villkor ur Steg 2 ───────────────────────────────────────────
_ANVANDARVIKT = re.compile(r"anv[äa]ndarvikt|\(anv[äa]ndare\)", re.I)
KRAVS = {}
for _p in T.NAMN:
    krav = []
    g = M.M[_p]
    anv = g.get("maxlast_anvandare_kg")
    odelad = g.get("maxlast_kg")
    if anv:
        # TVA angivna granser: texten maste bara den MINDRE, etiketterad.
        s = ("%g" % anv).replace(".", "[,.]")
        krav.append((re.compile(s + r"\s*kg"),
                     "MAX ANVÄNDARVIKT måste stå i texten (Steg 2)"))
        krav.append((_ANVANDARVIKT,
                     "MAX ANVÄNDARVIKT måste vara ETIKETTERAD som sådan"))
    elif odelad:
        # ☠️ EN angiven grans. Att da kalla den "max anvandarvikt" vore ett
        #    pastaende om hur talet ar UPPDELAT som ingen kalla stoder —
        #    grinden kravde det, och hade tvingat fram just den sortens
        #    ogrundade precision den finns for att stoppa. Kravet ar i
        #    stallet att texten SAGER att det bara finns ett tal.
        s = ("%g" % odelad).replace(".", "[,.]")
        krav.append((re.compile(s + r"\s*kg"),
                     "MAXLAST måste stå i texten (Steg 2)"))
        krav.append((re.compile(r"bara\s+en\s+enda\s+siffra", re.I),
                     "ODELAD MAXLAST måste sägas vara odelad"))
    else:
        # ☠️ 7b818c3b anger ingen användarvikt. Tystnad är inte ett svar —
        #    texten måste SÄGA att siffran saknas.
        krav.append((re.compile(r"anges\s+inte", re.I),
                     "SAKNAD ANVÄNDARVIKT måste sägas rakt ut"))
    if not g.get("skivor_ingar", True) or _p in ("83b2cf8b", "a4bbe667"):
        krav.append((re.compile(r"ing[åa]r\s+inte", re.I),
                     "VIKTER/SKIVSTÅNG ingår inte — måste stå i brödtexten (#468)"))
    if _p == "18b94738":
        krav.append((re.compile(r"skiktlimmad", re.I),
                     "MATERIALET måste beskrivas som skiktlimmad träskiva"))
    if _p == "b4961e6f":
        # ☠️ MOT HTML, inte mot den synliga texten: sluggen bor i href:en och
        #    `strip_taggar` tar bort den. Grinden sokte i ett underlag dar
        #    svaret aldrig kunde finnas, och fallde en korrekt sida.
        krav.append((re.compile(re.escape(T.PUB_ROD)),
                     "KORSLÄNK till den röda systern saknas (#480)", True))
    KRAVS[_p] = krav


def granska(pid, html=None, live=False):
    """live=True granskar den RENDERADE sidan i stället för källtexten."""
    fel = []
    namn, titel, meta = T.NAMN[pid], T.TITEL[pid], T.META[pid]
    html = html if html is not None else T.bygg(pid)
    if live:
        syn = G.livetext(html, T.SLUG[pid], namn)
    else:
        syn = G.strip_taggar(html)
    allt = " ".join([namn, titel, meta, syn])

    # ── delade grindar ────────────────────────────────────────────────
    if G.ARTNR.search(allt):
        fel.append("ARTIKELNUMMER i kundtext")
    if not live:
        h = G.homoglyfer(allt)
        if h:
            fel.append("HOMOGLYFER: %r" % (h,))
    # ☠️ Fyndsträngen bär MENINGEN, aldrig ett läge (#538).
    for t in G.TREKONSONANT.finditer(allt):
        fel.append("TRE LIKA KONSONANTER %r — %r"
                   % (t.group(0), G.mening_kring(allt, t.start())[:90]))
    if G.JARGONG.search(allt):
        fel.append("JARGONG")
    for n in G.granska_namn(namn):
        fel.append("NAMN: " + n)
    if live:
        fel.extend("FLIKSTRUKTUR: %s" % x for x in G.flikfel(html))
    else:
        for f in G.FLIKAR_SOM_KRAVS:
            n_ = html.count("<h2>" + f + "</h2>")
            if n_ != 1:
                fel.append("FLIK: %r förekommer %d gånger som <h2> (ska vara 1)"
                           % (f, n_))
        ordning = [html.find("<h2>" + f + "</h2>") for f in G.FLIKAR_SOM_KRAVS]
        if ordning != sorted(ordning):
            fel.append("FLIK: rubrikerna står i fel ordning")
    for o in G.LANDORD:
        if _vikt(o).search(allt):
            fel.append("LANDORD: " + o)
    for f in G.LAGERFRAS:
        if f.lower() in allt.lower():
            fel.append("LAGERFRAS: " + f)
    for m in G.HUSMARKEN:
        if _vikt(m).search(allt):
            fel.append("HUSMÄRKE: " + m)
    for a in G.ATTRIBUTION:
        if _vikt(a).search(allt):
            fel.append("ATTRIBUTION: " + a + " — mot kunden är VI leverantören")

    # ── rundans egna förbud, över PÅSTÅENDEN (inte naken finditer, #415) ──
    rubrikfalt = namn + " " + titel + " " + meta
    for monster, skal in FORBJUDET:
        if G.pastaenden(syn, monster) or monster.search(rubrikfalt):
            fel.append(skal)
    for p, monster, skal in SPECIFIKA:
        if p != pid:
            continue
        if G.pastaenden(syn, monster) or monster.search(rubrikfalt):
            fel.append(skal)

    # ── POSITIVA villkor ur Steg 2 ────────────────────────────────────
    for krav in KRAVS[pid]:
        monster, skal = krav[0], krav[1]
        mot_html = len(krav) > 2 and krav[2]
        if not monster.search(html if mot_html else allt):
            fel.append("SAKNAS: " + skal)

    # ── talgrinden, ZONINDELAD ────────────────────────────────────────
    if not live:
        fel.extend(_talgrind(pid, html))

    # ── strukturen (bara källtexten: taggarna finns inte på sidan) ────
    if live:
        return fel
    i_flik = html.find("<h2>Tekniska specifikationer</h2>")
    i_kors = html.find(T.KORS_INGRESS[pid])
    if i_kors < 0 or i_flik < 0 or i_kors > i_flik:
        fel.append("KORSLÄNKARNA ligger inte före första flikrubriken")
    for s, _ in T.KORSLANK[pid]:
        if s == T.SLUG[pid]:
            fel.append("SJÄLVLÄNK i korslänkarna")
    if 'href="/' in html:
        fel.append("ROTRELATIV href — Wix skriver om den till en död länk")
    return fel


_TAL = re.compile(r"\d+(?:[,.]\d+)?")
_FRIA = {"1", "2", "3", "4", "0"}
# ☠️ Nycklar som bär tal som INTE får skrivas: min egen felaktiga
#    transkribering bevaras i matt.py just för att kunna grindas bort.
_EJ_SKRIVBARA = ("_transkriberad",)


def _egna_tal(pid):
    """Produktens egen uppsättning tal, härledd ur HELA matt.py-posten.

    ☠️ Nycklarna räknas inte upp. Runda 141:s poster är heterogena — sju
    bänkar med sju olika uppsättningar fält — och en uppräkning hade tyst
    tappat det fält som var nytt för just en produkt. Grinden hade då fällt
    ett korrekt tal som 'ohärlett'. Rekursionen tar tupler och listor också,
    och strängar som `98-122` eller `73,5-85` plockas isär på siffrorna.
    """
    ut = set()

    def lagg(v):
        if isinstance(v, bool) or v is None:
            return
        if isinstance(v, (int, float)):
            # ☠️ ABSOLUTBELOPP ocksa. `vinklar` lagras med tecken (-22.5 =
            #    22,5 grader NEDAT) medan texten skriver riktningen i ord.
            #    Utan raden faller grinden ett korrekt tal som ohaarlett.
            for x in {v, abs(v)}:
                ut.add(("%g" % x).replace(".", ","))
                ut.add("%g" % x)
        elif isinstance(v, str):
            for tal in _TAL.findall(v):
                ut.add(tal)
                ut.add(tal.replace(".", ","))
        elif isinstance(v, (tuple, list)):
            for x in v:
                lagg(x)

    for nyckel, v in M.M[pid].items():
        if any(nyckel.endswith(s) for s in _EJ_SKRIVBARA):
            continue
        lagg(v)
    return ut


def _talgrind(pid, html):
    """Ett LÄNKAT tal får bara stå i länkens eget stycke."""
    egna = _egna_tal(pid) | _FRIA
    lankade = set()
    for slug, _ in T.KORSLANK[pid]:
        for annan, s2 in T.SLUG.items():
            if s2 == slug:
                lankade |= _egna_tal(annan)
        for tal in _TAL.findall(slug):
            lankade.add(tal)
    fel = []
    for stycke in re.findall(r"<(?:p|li)\b[^>]*>.*?</(?:p|li)>", html, re.S):
        tillatna = egna | lankade if "<a href" in stycke else egna
        txt = G.strip_taggar(stycke)
        for tal in _TAL.findall(txt):
            if tal not in tillatna:
                fel.append("OHÄRLETT TAL %r i %r" % (tal, txt[:70]))
    return fel


# ── självtest: varje regel har ett fall som SKA fälla och ett som INTE ska ──
#
# ☠️ #505: ett självtest som bara kör den FÄRDIGA texten och ser grönt bevisar
#    ingenting — det är grönt även om regeln aldrig kan fälla. Varje rad nedan
#    planterar felet i en KOPIA av den riktiga texten och kräver att rätt
#    sträng dyker upp. Sista blocket kräver dessutom att inget ANNAT fälls,
#    så att en regel som fångar allt inte kan gömma sig som en som fångar rätt.

def _plantera(pid, par, i_meta=False):
    """Planterar felet i SAMMA yta som grinden granskar.

    ☠️ `html` räcker inte. `granska` läser namn + titel + meta + synlig text,
       och två av självtestets fall visade varför: kravet var uppfyllt från
       META medan brödtexten var sönderplanterad. En plantering som inte når
       hela ytan mäter bara den del man råkade tänka på.
    """
    h = T.bygg(pid)
    meta = T.META[pid]
    for gammalt, nytt in par:
        traff = gammalt in h or (i_meta and gammalt in meta)
        assert traff, "självtestets utgångstext finns inte: %r" % gammalt
        h = h.replace(gammalt, nytt)
        if i_meta:
            meta = meta.replace(gammalt, nytt)
    return h, meta


PLANTERADE = [
    # (pid, [(gammalt, nytt), …], väntat felmeddelande, även i META)
    ("18b94738", [("Skiktlimmad träskiva", "Massivt trä")], "MASSIVT TRÄ", False),
    ("18b94738", [("skiktlimmad träskiva och konstläder",
                   "bokträ och konstläder")], "BOK", False),
    ("8de3c3ef", [("Svart med blå detaljer.", "Grön med svarta detaljer.")],
     "GRÖN", False),
    ("83b2cf8b", [("Ryggstöd i tre lägen, låst",
                   "Provad enligt EN 957. Ryggstöd i tre lägen, låst")],
     "OGRUNDAD CERTIFIERING", False),
    ("7b818c3b", [("110 × 26 cm, 43 cm över golvet",
                   "100 × 26 cm, 43 cm över golvet")], "FEL DYNMÅTT", False),
    ("18b94738", [("Öppet fack 27 × 27 cm med formade urtag för hantlar.",
                   "En korg 27 × 27 cm för hantlar.")], "KORG", False),
    # ☠️ BÅDA alternativen i regexen, och även i META — annars är kravet
    #    fortfarande uppfyllt och planteringen bevisar ingenting.
    ("a4bbe667", [("användarvikt", "lastgräns"), ("(användare)", "(gräns)")],
     "ETIKETTERAD", True),
    ("83b2cf8b", [("ingår inte", "medföljer separat")], "ingår inte", True),
    # ☠️ BÅDA skiftlägena: kravet är `re.I` och ordet står med versal i
    #    FAQ:n. En gemen ersättning lämnade `Skiktlimmad` kvar.
    ("18b94738", [("skiktlimmad", "limmad"), ("Skiktlimmad", "Limmad")],
     "skiktlimmad träskiva", True),
    ("b4961e6f", [(T.PUB_ROD, "en-annan-sida")],
     "KORSLÄNK till den röda systern", False),
    ("8a0e05f4", [("146 × 64 × 73,5–85 cm", "149 × 64 × 73,5–85 cm")],
     "OHÄRLETT TAL '149'", False),
    ("8de3c3ef", [("Svart med blå detaljer.",
                   "Svart med blå detaljer och HOMCOM-logotyp.")],
     "HUSMÄRKE", False),
    ("8de3c3ef", [("Svart med blå detaljer.",
                   "Svart med blå detaljer. Skickas från Tyskland.")],
     "LANDORD", False),
    ("18b94738", [("bara en enda siffra", "en siffra")], "ODELAD MAXLAST", False),
    # ☠️ Den ÖVERBEVISADE siffran får inte komma tillbaka. Ritningen säger
    #    74 × 25 cm; leverantörens spec sa 26,4, och den ligger nu bara
    #    under en `_transkriberad`-nyckel som `_egna_tal` hoppar över.
    #    Planteringen låser att omvägen tillbaka är stängd.
    ("83b2cf8b", [("74 × 25 cm", "74 × 26,4 cm")], "OHÄRLETT TAL '26,4'", False),
]

# Fall som INTE får fälla — regeln ska vara SNÄV, inte bara högljudd.
TYSTA = [
    # `grön` är produktspecifikt: en grön granne får nämnas på en annan sida.
    ("b4961e6f", [("i en röd version", "i en grön version")]),
    # 22,5 lagras som -22.5 i `vinklar`. Absolutbeloppet ska vara tillåtet.
    ("8a0e05f4", [("22,5 grader ned och 45 grader ned",
                   "45 grader ned och 22,5 grader ned")]),
    # 42,5 är ett DECIMALTAL, inte två tal.
    ("b4961e6f", [("32 × 29 × 42,5 cm", "42,5 × 29 × 32 cm")]),
]


def _med_meta(pid, meta, html):
    """Kör granska med en tillfälligt utbytt META."""
    spar = T.META[pid]
    T.META[pid] = meta
    try:
        return granska(pid, html)
    finally:
        T.META[pid] = spar


def _sjalvtest():
    fel = []
    for pid, par, vantat, i_meta in PLANTERADE:
        h, meta = _plantera(pid, par, i_meta)
        f = _med_meta(pid, meta, h)
        if not any(vantat in x for x in f):
            fel.append("PLANTERAT FEL FÅNGADES INTE: %s %r (väntade %r, fick %r)"
                       % (pid, par, vantat, f))
    for pid, par in TYSTA:
        h, _ = _plantera(pid, par)
        f = granska(pid, h)
        if f:
            fel.append("TYST FALL FÄLLDE ÄNDÅ: %s %r gav %r" % (pid, par, f))
    # ☠️ Och den riktiga texten måste vara grön, annars mäter allt ovan fel.
    for pid in T.SLUG:
        f = granska(pid)
        if f:
            fel.append("RIKTIG TEXT FÄLLER: %s %r" % (pid, f))
    return fel


def sjalvtest():
    """Kontraktet live-grinden kräver: `(fel-lista, antal fall)`.

    ☠️ NAMNET ÄR GRINDEN. `liverunda.sjalvtester` gör
       `getattr(GR, "sjalvtest", None)`, så en runda vars självtest bara
       heter `_sjalvtest` får den TYST överhoppad — och utskriften ljuger
       dessutom ("rundans grind självtestas i mutation.py", en fil som inte
       finns här). Det är runda 129:s bortfall, och det upptäcktes inte då.
    """
    return _sjalvtest(), len(PLANTERADE) + len(TYSTA) + len(T.SLUG)


if __name__ == "__main__":
    brister = _sjalvtest()
    for b in brister:
        print("☠️ " + b)
    print("självtest: %d planterade, %d tysta, %d brister"
          % (len(PLANTERADE), len(TYSTA), len(brister)))
    raise SystemExit(1 if brister else 0)
