# -*- coding: utf-8 -*-
"""Runda 137 — textgrinden, med självtest åt BÅDA hållen.

☠️ ETT SJÄLVTEST SOM BARA PRÖVAR ATT GRINDEN SLÄPPER IGENOM RÄTT TEXT ÄR
   INGEN GRIND. Varje mönster nedan har minst ett fall som SKA fälla och ett
   som INTE ska — annars går det inte att skilja "hittade inget" från
   "letade inte" (uppgift #505: självtestet låste fel facit och var grönt
   hela rundan).
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


def _vikt(ord_):
    """Ordgräns som fungerar på svenska — `\\b` räcker inte (uppgift #324)."""
    return re.compile(r"(?<![0-9A-Za-zÅÄÖåäöÉéÜü])" + ord_
                      + r"(?![0-9A-Za-zÅÄÖåäöÉéÜü])", re.I)


FORBJUDET = [
    # ☠️ SIDHÄNVISNING. Ny i den här rundan: mitt eget första utkast skrev
    #    "Samma takspända konstruktion som ovan" i en INGRESS. På en
    #    fristående produktsida finns inget "ovan" — texten syftar på en
    #    ordning som bara existerade i filen jag skrev den i. Samma familj
    #    som uppgift #318 (intern jargong "rundan" i publicerad kundtext).
    (re.compile(r"\b(?:som|se)\s+(?:ovan|nedan|ovanst[åa]ende|f[öo]reg[åa]ende)\b"
                r"|\b(?:ovanst[åa]ende|nedanst[åa]ende)\b", re.I),
     "SIDHÄNVISNING — en produktsida har inget 'ovan'"),
    (re.compile(r"^Samma\s+\w+", re.I),
     "DINGLANDE SYSKONREFERENS — en ingress som börjar med `Samma` syftar "
     "på en ordning som bara finns i filen, inte på sidan"),
    (re.compile(r"\brundan\b|\brunda\s+\d+|\bbatch\b|\butkast\b", re.I),
     "INTERN JARGONG — ord ur arbetsprocessen"),
    (re.compile(r"\bmarknadens\b|\bbranschens\b|\bstarkast\w*\b", re.I),
     "SUPERLATIV utan mätvärde"),
    # Ärvd från runda 136: `vi har` saknades i mönstret och Steg 12 fick
    # fånga superlativet med ögon (uppgift #522).
    (re.compile(r"\b(?:h[öo]gst|l[äa]gst|mest|st[öo]rst|minst|tyngst|"
                r"l[äa]ttast|rymligast|smalast|bredast|djupast|grovast)\w*\b"
                r"[^.]{0,45}\b(?:vi\s+(?:s[äa]ljer|har|f[öo]r)|i\s+(?:v[åa]rt\s+)?"
                r"sortiment\w*|hos\s+oss|i\s+butiken|i\s+familjen|av\s+v[åa]ra)", re.I),
     "SORTIMENTSSUPERLATIV — ogrundad jämförelse mot hela butiken"),
    # Ärvd från runda 136 (uppgift #523). Listan är rundans EGNA neutrumord.
    (re.compile(r"\ben\s+(?:\w+[^t\s]\s+)?(?:fotavtryck|munstycke|fogmunstycke"
                r"|m[öo]belmunstycke|utrymme|element|material|snöre|h[åa]l"
                r"|golv|rum|tecken|l[äa]ge|st[äa]lle|m[åa]tt|plan|tak|hus"
                r"|steg|underlag|glapp|spänne|takspänne|kliv)\b", re.I),
     "GENUSFEL — ordet är neutrum och tar `ett`, inte `en`"),
    (re.compile(r"\bleverant[öo]ren\s+(?:anger|uppger|s[äa]ger|lovar)", re.I),
     "MOT KUNDEN ÄR VI LEVERANTÖREN"),
    (re.compile(r"PawHut|HOMCOM|Outsunny|Aiyaplay|Aosom|AliExpress|Vinsetto", re.I),
     "LEVERANTÖRS- ELLER HUSMÄRKE"),
    (re.compile(r"\bskickas\s+fr[åa]n\b|\bfr[åa]n\s+v[åa]rt\s+lager\s+i\b"
                r"|\bTyskland\b|\bSpanien\b|\bPolen\b|\bKina\b", re.I),
     "AVSÄNDARLAND — bara EU-lager-ribbonen får bära det"),
    (re.compile(r"\b\d+\s*(?:kr|kronor|SEK)\b|\bpris(?:et|er)?\s+[äa]r\b", re.I),
     "PRIS I BRÖDTEXTEN"),
    (re.compile(r"\b(?:levereras|kommer fram|hos dig|leverans)\s+(?:inom|p[åa])\s+"
                r"\d+|\b\d+\s*[-–]\s*\d+\s*(?:arbetsdag|vardag|dag)\w*", re.I),
     "LEVERANSLÖFTE — vi lovar ingen leveranstid i produkttexten"),
    (re.compile(r"\bkattr[äa]d\b", re.I),
     "FELSTAVNING — `katträd` ska ha tre led: katt+träd = kattträd, "
     "och husets ord är `klösträd`"),
]

# ☠️ Produktspecifika förbud, ur matt.FORBJUDNA_PASTAENDEN. De är BEVISADE
#    fel i källan, inte smakfrågor — se STEG2-5.md.
SPECIFIKA = {pid: [(_vikt(o), "FÖRBJUDET PÅSTÅENDE %r för %s" % (o, pid))
                   for o in ord_]
             for pid, ord_ in M.FORBJUDNA_PASTAENDEN.items()}

TAL_RE = re.compile(r"(?<![\w,.])(\d{1,3}(?:,\d{1,2})?)(?![\w])")

# Tal som alltid är tillåtna: ordningstal och antal som inte är mått.
TAL_FRIA = {1, 2, 3, 4}


def _talgrind(pid, stycke):
    """Ett tal i texten måste finnas i facit. Zonindelat per STYCKE, och
    länkstycken får bära SYSKONENS tal (uppgift #437, #507)."""
    if "<a href" in stycke:
        return []
    fel = []
    txt = G.strip_taggar(stycke)
    for m in TAL_RE.finditer(txt):
        v = float(m.group(1).replace(",", "."))
        if v in TAL_FRIA:
            continue
        if v not in M.TAL[pid]:
            fel.append("OHÄRLETT TAL %s — %r" % (m.group(1), G.mening_kring(txt, m.start())[:90]))
    return fel


# ☠️ RÄKNEORDSGRINDEN — prosan mot spec-raden (runda 137).
#
#    Texten sa "två runda plan", spec-raden "Plan: 3 st", och TALGRINDEN VAR
#    GRÖN: 2 och 3 ligger båda i `TAL_FRIA`, alltså kan den per konstruktion
#    aldrig se ett fel ANTAL. En delräkning är precis den sortens fakta ingen
#    befintlig grind täcker — den är inte ett mått, den är en uppräkning.
#
#    Facit är spec-tabellen, som byggs ur tyskans `Technische Daten`. Står
#    prosan och tabellen emot varandra är EN av dem fel, och det ska fällas
#    oavsett vilken.
#
# ⚠️ TVÅ UNDANTAG, båda mätta på rundans egen text:
#    1. `<a href`-stycken bär SYSKONENS tal ("klösträd i fem plan 230–260 cm"
#       är en korslänk till en ANNAN produkt). Samma undantag som `_talgrind`.
#    2. `ett`/`en` är obestämd artikel i svenskan, inte ett räkneord: "plats
#       att ligga på ett plan" räknar ingenting. De räknas därför aldrig.
#    Utan undantagen fyrade grinden fyra gånger på korrekt text.
RAKNEORD = {"två": 2, "tre": 3, "fyra": 4, "fem": 5, "sex": 6,
            "sju": 7, "åtta": 8, "nio": 9, "tio": 10}


def _antalsgrind(pid, html):
    """Ett räkneord framför en spec-etikett måste stämma med spec-radens antal."""
    fel = []
    antal = {}
    for etikett, varde in T.SPEC[pid]:
        m = re.match(r"^(\d+)(?:\s*st\b|,)", varde.strip())
        if m:
            antal[etikett.lower()] = int(m.group(1))
    if not antal:
        return fel
    for stycke in re.split(r"(?=<p|<li)", html):
        if "<a href" in stycke:            # korslänk → grannens tal
            continue
        txt = G.strip_taggar(stycke)
        for etikett, n in antal.items():
            # Etikettens ord, med valfria beskrivande ord emellan.
            m = re.compile(r"(?<![0-9A-Za-zÅÄÖåäöÉé])(%s)\s+(?:\w+\s+){0,2}%s(?![0-9A-Za-zÅÄÖåäö])"
                           % ("|".join(RAKNEORD), re.escape(etikett)), re.I)
            for t in m.finditer(txt):
                v = RAKNEORD[t.group(1).lower()]
                if v != n:
                    fel.append("FEL ANTAL %r — spec säger %d, texten %d: %r"
                               % (etikett, n, v, G.mening_kring(txt, t.start())[:90]))
    return fel


def granska(pid, html=None, live=False):
    fel = []
    h = html if html is not None else T.bygg(pid)
    falt = [("namn", T.NAMN[pid]), ("titel", T.TITEL[pid]), ("meta", T.META[pid]),
            ("slug", T.SLUG[pid]), ("sokord", T.SOKORD[pid])]

    if live:
        # ☠️ FLIKGRINDEN HÖR HEMMA HÄR, inte i källgrenen. Butiken renderar
        #    <summary> ur <h2>; källan har inga summaries alls, så i
        #    källgrenen fäller den 24 gånger på åtta korrekta sidor — en
        #    tvilling till uppgift #452 och #510.
        fel.extend("FLIKSTRUKTUR: %s" % x for x in G.flikfel(h))
        h = G.butikstvatt(h)
        h = G.strak_grannar(G.strip_taggar(h), h, T.SLUG[pid], T.NAMN[pid])
        syn = h
    else:
        syn = G.strip_taggar(h)

    allt = syn + " " + " ".join(v for _, v in falt)

    for monster, skal in FORBJUDET:
        for m in monster.finditer(allt):
            fel.append("%s: %r" % (skal, G.mening_kring(allt, m.start())[:110]))
    for monster, skal in SPECIFIKA.get(pid, []):
        for m in monster.finditer(allt):
            fel.append("%s: %r" % (skal, G.mening_kring(allt, m.start())[:110]))

    if not live:
        # Körs bara mot KÄLLAN: live-sidan bär grannarnas rader, och en
        # rekommendationsrad med en annan produkts antal är inte vårt fel.
        fel.extend(_antalsgrind(pid, h))

    for m in G.ARTNR.finditer(allt):
        fel.append("ARTIKELNUMMER %r" % m.group(0))
    for o, s in G.versalfel(allt):
        fel.append("VERSAL MITT I ORD %r — %r" % (o, s))
    for x in G.trekonsonant(allt) if hasattr(G, "trekonsonant") else []:
        fel.append("TRE LIKA KONSONANTER %r" % (x,))
    for x in G.homoglyfer(allt):
        fel.append("OSYNLIGT TECKEN %r" % (x,))

    if not live:
        for st in re.split(r"(?i)</(?:p|li)>", h):
            fel.extend("%s" % x for x in _talgrind(pid, st))
        if len(T.NAMN[pid]) > 80:
            fel.append("NAMN %d tecken (tak 80)" % len(T.NAMN[pid]))
        if T.TITEL[pid] == T.NAMN[pid]:
            fel.append("TITEL == NAMN")
        ratt, forbjudna = M.TYP[pid]
        for falt_namn, v in falt[:3]:
            if not _vikt(ratt).search(v):
                fel.append("%s saknar huvudordet %r" % (falt_namn, ratt))
            for f in forbjudna:
                if _vikt(f).search(v):
                    fel.append("%s bär FEL TYPORD %r" % (falt_namn, f))
        # Korslänken ska gå åt BÅDA håll inom paret (uppgift #480).
        syskon = M.SYSKON[pid]
        if T.SLUG[syskon] not in h:
            fel.append("korslänken till syskonet %s saknas" % syskon)
    return fel


# ── självtest ────────────────────────────────────────────────────────────
FALL = [
    # (text, ska fälla?, etikett)
    ("Samma takspända konstruktion som ovan, men i grått.", True, "sidhänvisning ovan"),
    ("Se nedan för mått.", True, "sidhänvisning nedan"),
    ("Ovanstående mått gäller.", True, "ovanstående"),
    ("Stammen är lindad med sisal hela vägen upp.", False, "ren mening"),
    ("Katten kan klättra upp ovanpå bädden.", False, "ovanpå är inte en hänvisning"),
    ("Planet ovanför kojan är 48 cm brett.", False, "ovanför är en riktning"),
    ("Det här är den grovaste stammen vi har.", True, "sortimentssuperlativ vi har"),
    ("Det här är den grovaste stammen vi säljer.", True, "sortimentssuperlativ vi säljer"),
    ("Stammen är grov: Ø16,5 cm mot 5 till 9 cm som är vanligast.", False,
     "jämförelse med mätvärde, inte mot sortimentet"),
    ("Trappan har en steg som är brett.", True, "genusfel en steg"),
    ("Trappan har ett steg som är brett.", False, "rätt neutrum"),
    ("Ett smalt fogmunstycke når ned.", False, "rätt neutrum fogmunstycke"),
    ("En smal fogmunstycke når ned.", True, "genusfel fogmunstycke"),
    ("Leverantören anger 25 minuter.", True, "vi är leverantören"),
    ("Möbeln skickas från Tyskland.", True, "avsändarland"),
    ("Priset är 899 kr.", True, "pris i brödtexten"),
    ("Levereras inom 3 dagar.", True, "leveranslöfte"),
    ("Ett katträd för katten.", True, "felstavat katträd"),
    ("Ett klösträd för katten.", False, "rätt husord"),
    ("Kojan mäter 30 × 30 cm i rundan.", True, "intern jargong"),
]


def sjalvtest():
    fel = []
    for txt, ska, etikett in FALL:
        traff = any(m.search(txt) for m, _ in FORBJUDET)
        if traff != ska:
            fel.append("SJÄLVTEST %r: förväntade %s, fick %s"
                       % (etikett, "FÄLL" if ska else "SLÄPP",
                          "FÄLL" if traff else "SLÄPP"))
    # Produktspecifika förbud, båda hållen.
    if not any(m.search("Kojan är inte en kattlåda.") for m, _ in SPECIFIKA["dd3b541b"]):
        fel.append("SJÄLVTEST: kattlåda fälls inte på dd3b541b")
    if any(m.search("Kojan är sluten och mörk.") for m, _ in SPECIFIKA["dd3b541b"]):
        fel.append("SJÄLVTEST: ren kojtext fälls på dd3b541b")
    if not any(m.search("Trappan är höjdjusterbar.") for m, _ in SPECIFIKA["1ae60dbc"]):
        fel.append("SJÄLVTEST: höjdjusterbar fälls inte på 1ae60dbc")
    if any(m.search("Trappan kan byggas med tre steg.") for m, _ in SPECIFIKA["1ae60dbc"]):
        fel.append("SJÄLVTEST: korrekt formulering fälls på 1ae60dbc")
    # Talgrinden, båda hållen.
    if not _talgrind("f489937f", "<p>Stammen är 22 cm.</p>"):
        fel.append("SJÄLVTEST: talgrinden släpper ett ohärlett tal")
    if _talgrind("f489937f", "<p>Stammen är 16,5 cm.</p>"):
        fel.append("SJÄLVTEST: talgrinden fäller ett härlett tal")
    if _talgrind("f489937f", '<p>Se <a href="x">klöspelare 87 cm</a>.</p>'):
        fel.append("SJÄLVTEST: talgrinden fäller ett tal i ett LÄNKstycke")
    return fel


if __name__ == "__main__":
    st = sjalvtest()
    for x in st:
        print("☠️", x)
    print("grind.sjalvtest(): %d fall, %d fel" % (len(FALL) + 7, len(st)))
    print()
    tot = 0
    for pid in T.NAMN:
        f = granska(pid)
        tot += len(f)
        print("%-10s %s" % (pid, "OK" if not f else "%d fel" % len(f)))
        for x in f:
            print("     ☠️", x)
    print("\n%d produkter, %d fel" % (len(T.NAMN), tot))
    raise SystemExit(1 if (st or tot) else 0)
