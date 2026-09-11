# -*- coding: utf-8 -*-
"""Runda 131 — textgrinden, körd på FILEN före varje skrivning.

☠️ INGEN REGEL DEFINIERAS OM HÄR. `grindar.py` äger jargongen, homoglyferna,
   artikelnummerformen, aktörsorden, landorden, butikstvätten, negationen och
   SKU-regeln; `tvillingsvep()` fäller om en runda skriver en egen kopia.

☠️ RUNDANS EGEN HUVUDREGEL ÄR PRODUKTTYPEN. Fem av sju produkter bytte typ
   under arbetet, i båda riktningarna, och en trappa såld som ramp skickar
   fel vara till den kund som behöver skillnaden mest. `TYPGRIND` kräver
   därför att RÄTT typord står i namn, titel, slug och meta — och att FEL
   typord inte gör det. Brödtexten är undantagen med flit: biltrapporna SKA
   få säga ordet "ramp" när de förklarar att ramper finns som alternativ.

☠️ LASTGRINDEN ÄR DEN ANDRA. Rundans fyra laster (15/25/40/50 kg) står på
   varor som ser likadana ut, och att skriva en grannes tal på sin egen sida
   är precis den förväxling som färgfamiljer föder. Varje produkts EGEN last
   måste stå i namnet och i metan, och ingen ANNAN produkts last får stå i
   den egna texten. Länkstycken är undantagna — där är grannens tal rätt.

☠️ MONTERINGSGRINDEN ÄR NEGATIV. Ingen av de sju källorna säger något om
   montering, alltså får ingen egen mening göra det heller. Den publicerade
   `hundramp-bil-155-cm` HAR uppgiften, så ordet är tillåtet i ett
   länkstycke — samma zonindelning som talgrinden.
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

# ☠️ INGA ord som finns i svenskan: `Rampe` (jfr "ramp"), `Stufe`
#    (jfr "stuff"), `Matte`. Varje post nedan saknar svensk tvilling.
TYSKA = ["Hunderampe", "Haustierrampe", "Hundetreppe", "Haustiertreppe",
         "Hundeautorampe", "Kofferraum", "Klappbar", "klappbare",
         "rutschfest", "Rutschfeste", "Anti-Rutsch", "Trittgr",
         "Belastbarkeit", "Empfohlenes", "Lieferumfang", "Technische",
         "Bedienungsanleitung", "Handbuch", "Anleitung", "Kiefernholz",
         "Tannenholz", "Mehrschichten", "Kunststoff", "Teppich",
         "Polyester-", "Schwarz", "Braun", "Grau", "Weiß", "Naturholz",
         "Gesamtabmessung", "Abmessungen", "Beschreibung", "Zertifi",
         "Haustier", "Stufig", "verstellbar"]

# ☠️ TYPGRIND. Vilket ord som MÅSTE stå, och vilket som inte FÅR stå, i de
#    fyra fälten kunden möter i sökresultatet.
TYPORD = {
    "biltrappa": (re.compile(r"hundtrappa", re.I), re.compile(r"ramp", re.I)),
    "mobelramp": (re.compile(r"hundramp", re.I), re.compile(r"trapp", re.I)),
    "mobelramp_plattform": (re.compile(r"hundramp", re.I),
                            re.compile(r"trapp", re.I)),
}

# ☠️ NEGATIONSGRINDADE. `loftestraff` ursäktar en träff som förnekas i sin
#    EGNA mening.
NEGERBART = [
    (re.compile(r"\bvattent[äa]t\w*|\bv[äa]derbest[äa]ndig\w*", re.I),
     "VÄDERPÅSTÅENDE — ingen av de sju källorna anger något väderskydd"),
    (re.compile(r"\bh[öo]jdjusterbar\w*|\bst[äa]llbar\s+h[öo]jd", re.I),
     "JUSTERBAR HÖJD — gäller inte alla; 15e4c7a7 har fast lutning"),
]

FORBJUDET = [
    (re.compile(r"\bCE-?m[äa]rkt\w*|\bCE-?certifi|\btestad\s+enligt", re.I),
     "CERTIFIERINGSPÅSTÅENDE — ingen källa anger någon norm"),
    (re.compile(r"\bmassivt?\s+tr[äa]\b|\b[äa]kta\s+tr[äa]\b", re.I),
     "MASSIVT TRÄ — källan säger furu, gran och lamellträ, inte massivträ"),
    (re.compile(r"\bmarknadens\b|\bbranschens\b|\bstarkast\w*\b"
                r"|\bb[äa]st(?:a|e)?\s+(?:i|p[åa]|av)\s+"
                r"(?:marknaden|klassen|sortimentet|sitt slag)"
                r"|\bdet\s+b[äa]sta\s+(?:valet|alternativet)", re.I),
     "SUPERLATIV utan mätvärde"),
    # ☠️ BATCHSUPERLATIV (Steg 5 regel 14). Tre sådana stod i rundans egen
    #    första text: "den högsta rampen i den här uppsättningen", "mest av
    #    de sju varorna här", "den lägsta bärigheten av ramperna". Ett
    #    "högst/lägst/mest" kräver en sökning bland de PUBLICERADE sidorna.
    (re.compile(r"\b(?:h[öo]gst|l[äa]gst|mest|st[öo]rst|minst|tyngst|"
                r"l[äa]ttast)\w*\b[^.]{0,40}\b(?:uppsättning\w*|batch\w*|"
                r"de\s+sju\b|rundan\w*|sortimentet)", re.I),
     "BATCHSUPERLATIV — mät mot katalogen, inte mot rundan"),
    (re.compile(r"\bfri\s+frakt\b|\bsnabb\s+leverans\b|\bleverans\s+inom\b", re.I),
     "LEVERANSLÖFTE"),
    (re.compile(r"\bartikelnummer\b|\bmodellreferens\b|\bartikelnr\b"
                r"|\breferens:", re.I),
     "ARTIKELNUMMER-ETIKETT — numret hör hemma på mappningen"),
    # ☠️ RASNAMN. Leverantörens grafik illustrerar 25 kg med husky, dalmatiner
    #    och bullterrier — raser som väger 20-38 kg. Ett rasnamn på sidan är
    #    ett viktpåstående utan mätvärde.
    (re.compile(r"\b(?:labrador|golden\s*retriever|husky|dalmatiner|"
                r"bullterrier|sch[äa]fer|beagle|border\s*collie)\w*", re.I),
     "RASNAMN — ett rasnamn är ett viktpåstående utan mätvärde"),
]


def talen(pid):
    """Varje tal som produktens EGNA spec-tabell bär, som strängar."""
    ut = set()
    for _, v in T.SPEC[pid]:
        ut |= set(re.findall(r"\d+(?:,\d+)?", v))
    return ut


def _granntal(slug):
    """Talen som en LÄNKAD sida får bidra med till en mening."""
    for k, s in T.SLUG.items():
        if s == slug:
            return talen(k)
    rad = M.GRANNAR.get(slug)
    if rad is None:
        return None
    ut = set()
    for v in rad.values():
        ut |= set(re.findall(r"\d+(?:,\d+)?", str(v)))
    return ut


# Rundans egna laster. Ingen produkts text får bära en ANNANS.
LASTER = {p: str(M.RAMPER[p]["last"]) for p in T.NAMN}


def granska(pid, html=None, live=False):
    """Rundans domänregler. EN uppsättning, två indata."""
    if html is None:
        html = T.bygg(pid)
    fel = []

    if live:
        egna, _ = G.egna_meningar(html, T.SLUG[pid], T.NAMN[pid])
        syn = G.synlig_meningstext(
            "<p>%s</p><p>%s</p><p>%s</p><p>%s</p><p>%s</p>"
            % (egna, T.NAMN[pid], T.TITEL[pid], T.META[pid],
               " ".join(T.SOKORD[pid])))
    else:
        syn = G.synlig_meningstext(html)

    for m, etikett in FORBJUDET:
        for t in m.finditer(syn):
            fel.append("%s: %r" % (etikett, G.mening_kring(syn, t.start())[:90]))

    for m, etikett in NEGERBART:
        t = G.loftestraff(m, syn)
        if t:
            fel.append("%s: %r" % (etikett, G.mening_kring(syn, t.start())[:90]))

    for ord_ in TYSKA:
        if re.search(r"\b" + re.escape(ord_), syn, re.I):
            fel.append("TYSKT ORD: %s" % ord_)

    lag = syn.lower()
    for a in G.ATTRIBUTION:
        if re.search(r"\b" + re.escape(a) + r"\b", lag):
            fel.append("AKTÖRSORD: %s — mot kunden är VI leverantören" % a)
    for l in G.LANDORD:
        if re.search(r"\b" + re.escape(l), lag):
            fel.append("LAND: %s" % l)
    for f in G.LAGERFRAS:
        if f in lag:
            fel.append("LAGERFRAS: %s" % f)
    for h in G.HUSMARKEN:
        if re.search(r"\b" + re.escape(h), lag):
            fel.append("HUSMÄRKE: %s" % h)

    if G.JARGONG.search(syn):
        fel.append("JARGONG: intern rundbeteckning i kundtext")

    # ---------------------------------------------------------- typgrind ---
    kravs, forbjudet = TYPORD[M.RAMPER[pid]["typ"]]
    for txt, var in ((T.NAMN[pid], "namn"), (T.TITEL[pid], "titel"),
                     (T.SLUG[pid], "slug"), (T.META[pid], "meta")):
        if not kravs.search(txt):
            fel.append("TYP: %s saknar %r" % (var, kravs.pattern))
        if forbjudet.search(txt):
            fel.append("TYP: %s bär FEL typord (%r)" % (var, forbjudet.pattern))

    # ---------------------------------------------------------- lastgrind --
    egen_last = LASTER[pid]
    for txt, var in ((T.NAMN[pid], "namn"), (T.META[pid], "meta")):
        if not re.search(r"\b%s\b" % re.escape(egen_last), txt):
            fel.append("LAST: %s saknar maxlasten %s kg" % (var, egen_last))

    _falt = [(T.NAMN[pid], "namn"), (T.TITEL[pid], "titel"),
             (T.META[pid], "meta")]
    if not live:
        _falt.append((syn, "brödtext"))
    for txt, var in _falt:
        h = G.homoglyfer(txt)
        if h:
            fel.append("HOMOGLYF i %s: %s" % (var, h))
        if G.ARTNR.search(txt):
            fel.append("ARTIKELNUMMER i %s" % var)

    fel += ["NAMN: " + x for x in G.granska_namn(T.NAMN[pid])]

    # ☠️ SKU:n RÄKNAS ur husregeln. FYRA av de sju utkasten bar en DELAD SKU.
    vantat = "FP-" + G.sku_bas(T.SLUG[pid])
    if T.SKU[pid] != vantat:
        fel.append("SKU: filen säger %r, regeln ger %r" % (T.SKU[pid], vantat))

    if live:
        return fel + ["FLIKFEL: %s" % p for p in G.flikfel(html)]

    # ---------------------------------------------- källans egen struktur --
    for flik in G.FLIKAR_SOM_KRAVS:
        n = len(re.findall(r"<h2>" + re.escape(flik) + r"</h2>", html))
        if n != 1:
            fel.append("FLIKRUBRIK %r förekommer %d gånger" % (flik, n))

    forsta = html.index("<h2>Tekniska specifikationer</h2>")
    for rubrik in (T.RUBRIK[pid], T.LAST_RUBRIK[pid], T.BRUK_RUBRIK[pid],
                   "Passar inte den här?"):
        if html.index("<h2>%s</h2>" % rubrik) > forsta:
            fel.append("BLOCKET %r ligger EFTER första flikrubriken" % rubrik)

    for t in re.finditer(r"\d+(?:,\d+)?, \d", syn):
        fel.append("KOMMALISTA av tal: %r" % G.mening_kring(syn, t.start())[:70])

    # ------------------------------------------------- zonindelad talgrind --
    JAMFOR = {"1", "2", "3", "4"}
    egna, kors = G.dela_pa_ankare(html)
    brod_slut = "Tekniska specifikationer"

    def _provala(text, kanda, var):
        for t in re.finditer(r"\d+(?:,\d+)?", text):
            if t.group() not in kanda:
                fel.append("OHÄRLETT TAL %s (%s): %r"
                           % (t.group(), var, G.mening_kring(text, t.start())[:70]))

    egen_text = " ".join(egna)
    if brod_slut in egen_text:
        egen_text = egen_text[:egen_text.index(brod_slut)]
    _provala(egen_text, talen(pid) | JAMFOR, "egen text")

    # ☠️ MONTERING och ANNANS LAST prövas BARA i den egna texten.
    if re.search(r"\bmonter\w*", egen_text, re.I):
        fel.append("MONTERING i egen text — ingen av källorna anger något")
    for annan, last in LASTER.items():
        if annan == pid or last == egen_last:
            continue
        if re.search(r"\b%s\s*kil" % re.escape(last), egen_text, re.I):
            fel.append("ANNANS LAST %s kg i egen text (egen är %s)"
                       % (last, egen_last))

    for mal, mening in kors:
        facit = set()
        for m in mal:
            t = _granntal(m)
            if t is None:
                fel.append("KORSLÄNK till okänd slug %r" % m)
                continue
            facit |= t
        _provala(mening, facit | talen(pid) | JAMFOR, "korslänk")
    return fel


def sjalvtest():
    """Rundans EGNA grindar prövas här, inte bara i mutation.py.

    ☠️ Runda 129 tappade sitt eget självtest när live-grinden kopierades.
       `liverunda.kor` anropar den här om den finns.
    """
    fel, antal = [], 0

    def prov(namn, villkor):
        nonlocal antal
        antal += 1
        if not villkor:
            fel.append(namn)

    # Typgrinden känner igen båda riktningarna.
    kravs, forb = TYPORD["biltrappa"]
    prov("typ biltrappa kräver hundtrappa", bool(kravs.search("Hundtrappa 154")))
    prov("typ biltrappa fäller ramp", bool(forb.search("Hundramp 154")))
    kravs, forb = TYPORD["mobelramp"]
    prov("typ mobelramp kräver hundramp", bool(kravs.search("Hundramp 90")))
    prov("typ mobelramp fäller trappa", bool(forb.search("Hundtrappa 90")))

    # Batchsuperlativet fäller på rundans egna tre formuleringar.
    m = next(x[0] for x in FORBJUDET if "BATCHSUPERLATIV" in x[1])
    for s in ("Den högsta rampen i den här uppsättningen.",
              "Rampen bär 50 kilo, mest av de sju varorna här.",
              "Det är den lägsta bärigheten av ramperna i sortimentet."):
        prov("batchsuperlativ: %s" % s[:28], bool(m.search(s)))
    prov("batchsuperlativ släpper igenom ett vanligt 'högst'",
         not m.search("Trappan når som högst 82 centimeter."))

    # Rasnamnsgrinden.
    m = next(x[0] for x in FORBJUDET if "RASNAMN" in x[1])
    prov("rasnamn fäller labrador", bool(m.search("Passar en labrador.")))
    prov("rasnamn släpper hund", not m.search("Passar en hund."))

    # Lasterna är fyra skilda tal och alla sju har ett.
    prov("alla sju har en last", all(LASTER[p] for p in T.NAMN))
    prov("lasterna är 15/25/40/50", set(LASTER.values()) == {"15", "25", "40", "50"})

    # Granntalen går att slå upp för varje korslänk i rundan.
    for pid in T.NAMN:
        for mal, _ in T.KORSLANK[pid]:
            prov("granntal för %s" % mal, _granntal(mal) is not None)
    return fel, antal


if __name__ == "__main__":
    kfel = G._kallkodsgrind_sku()
    sfel, santal = G._sjalvtest()
    rfel, rantal = sjalvtest()
    tfel = G.tvillingsvep()
    print("grindar._sjalvtest(): %d fall, %d fel" % (santal, len(sfel)))
    print("grind.sjalvtest():    %d fall, %d fel" % (rantal, len(rfel)))
    for x in sfel + rfel + kfel + tfel:
        print("  ☠️", x)

    summa = len(sfel) + len(rfel) + len(kfel) + len(tfel)
    for pid in T.NAMN:
        f = granska(pid)
        summa += len(f)
        print(("  FEL " if f else "  OK  ") + pid)
        for x in f:
            print("        ☠️", x)
    print("\n%d produkter, %d fel" % (len(T.NAMN), summa))
    sys.exit(1 if summa else 0)
