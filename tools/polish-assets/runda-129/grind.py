# -*- coding: utf-8 -*-
"""Runda 129 — textgrinden, körd på FILEN före varje skrivning.

☠️ INGEN REGEL DEFINIERAS OM HÄR. `grindar.py` äger jargongen, homoglyferna,
   färgformerna, butikstvätten, löftesgrindarna och SKU-regeln; `tvillingsvep()`
   i samma fil är källkodstestet som fäller om en runda skriver en egen kopia.
   Sex rundors kopierade jargongmönster och fem drivna fogeord (uppgift #484)
   är vad den regeln kostade innan den fanns.

☠️ ORDLISTAN ÄR VALD FÖR DEN HÄR FAMILJEN. `Solar`, `Metall`, `Glas` och
   `Sensor` stavas likadant i båda språken eller lever inuti svenska ord, och
   ett sådant ord i listan fäller varje korrekt sida. Kvar står tyska ord utan
   svensk tvilling — och varje mönster bär ordgräns i BÖRJAN, så böjda former
   fastnar medan `re·gelb·undet`-fällan undviks.
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

TYSKA = ["Laterne", "Stehleuchte", "Gartenlaterne", "Solarlampe", "Solarleuchte",
         "Blumentopf", "Erdspieß", "Erdspiess", "Abschnitte", "Schrauben",
         "Helligkeit", "wasserdicht", "Lieferumfang", "Schwarz", "Kunststoff",
         "Edelstahl", "Leuchtdauer", "Ladezeit", "Gesamtabmessungen",
         "Technische", "Dämmerung", "Damm" + "erung", "Pflanzkübel", "Höhe",
         "Beleuchtung", "Außen", "Aussen", "Farbe", "Batterietyp"]

# ☠️ IP44 ÄR STÄNKSKYDD. Leverantören skriver `Wasserdicht` och anger IP44 i
#    samma mening; ordet får inte översättas rakt av. Blank spärr med flit —
#    ingen av rundans texter förnekar ordet, de undviker det.
FORBJUDET = [
    (re.compile(r"vattent[äa]t\w*", re.I), "VATTENTÄT — IP44 är stänkskydd"),
    (re.compile(r"\bregnt[äa]t\w*", re.I), "REGNTÄT — samma fel som vattentät"),
    (re.compile(r"t[åa]l\w*\s+(?:h[öo]gtryck|vattenstr[åa]l)", re.I),
     "LOVAR MER ÄN IP44"),
    (re.compile(r"\bCE-?m[äa]rkt\w*|\bCE-?certifi", re.I),
     "CERTIFIERINGSPÅSTÅENDE — står inte i källan för någon av de nio"),
    # ☠️ `\bl[åa]ga\b` MATCHAR ADJEKTIVET. Första utkastet fällde
    #    "det LÅGA läget" på `ec8ab782` — samma fel som jargongmönstret
    #    `\brundan?\b` som fällde "två RUNDA pallar" i tre rundor.
    #    Grinden kräver därför eldsammanhang, inte bara ordet.
    (re.compile(r"\b(?:[öo]ppen|levande|riktig|verklig)\s+l[åa]ga"
                r"|\beldsl[åa]g|\bl[åa]gor\b|\bbrinn\w+", re.I),
     "ELD — flameffekten är ett ljusmönster"),
    # ☠️ `\bbäst[ae]?\b` FÄLLDE "batteriet mår BÄST av att övervintra
    #    inomhus" — ett skötselråd, inte ett produktpåstående. Grinden
    #    träffar nu bara den jämförande FORMEN mot en marknad eller ett
    #    sortiment. Ett larm som fyrar på korrekt text slutar läsas.
    (re.compile(r"\bmarknadens\b|\bbranschens\b|\bstarkast\w*\b"
                r"|\bb[äa]st(?:a|e)?\s+(?:i|p[åa]|av)\s+"
                r"(?:marknaden|klassen|sortimentet|sitt slag)"
                r"|\bdet\s+b[äa]sta\s+(?:valet|alternativet)", re.I),
     "SUPERLATIV utan mätvärde"),
    (re.compile(r"\bfri\s+frakt\b|\bsnabb\s+leverans\b|\bleverans\s+inom\b", re.I),
     "LEVERANSLÖFTE"),
    (re.compile(r"\bartikelnummer\b|\bmodellreferens\b|\bartikelnr\b"
                r"|\breferens:", re.I),
     "ARTIKELNUMMER-ETIKETT — numret hör hemma på mappningen"),
]

# ☠️ KATEGORIKLYSCHAN. "Lyser upp trädgården" är familjens standardpåstående
#    och 40–200 lm bär det inte. Men `db933c3c` skriver med flit "det lyser
#    INTE upp en tomt" — en blank spärr hade fällt precis den mening som gör
#    sidan ärlig. Grinden ursäktar därför en negerad träff, som `loftestraff`.
KLYSCHA = re.compile(r"lyser upp|belyser (?:hela|gården|tomten)"
                     r"|ger ljus [åa]t hela", re.I)


def talen(pid):
    """Varje tal som spec-tabellen faktiskt bär, som strängar."""
    ut = set()
    for _, v in T.SPEC[pid]:
        ut |= set(re.findall(r"\d+(?:,\d+)?", v))
    return ut


def granska(pid):
    html = T.bygg(pid)
    syn = G.synlig_meningstext(html)
    fel = []

    for m, etikett in FORBJUDET:
        for t in m.finditer(syn):
            fel.append("%s: %r" % (etikett, G.mening_kring(syn, t.start())[:90]))

    for t in KLYSCHA.finditer(syn):
        mening = G.mening_kring(syn, t.start())
        if G.NEGATION.search(mening):
            continue
        fel.append("KATEGORIKLYSCHA: %r" % mening[:90])

    for ord_ in TYSKA:
        if re.search(r"\b" + re.escape(ord_), syn, re.I):
            fel.append("TYSKT ORD: %s" % ord_)

    if G.JARGONG.search(syn):
        fel.append("JARGONG: intern rundbeteckning i kundtext")
    for txt, var in [(T.NAMN[pid], "namn"), (T.TITEL[pid], "titel"),
                     (T.META[pid], "meta"), (syn, "brödtext")]:
        h = G.homoglyfer(txt)
        if h:
            fel.append("HOMOGLYF i %s: %s" % (var, h))
        if G.ARTNR.search(txt):
            fel.append("ARTIKELNUMMER i %s" % var)

    fel += ["NAMN: " + x for x in G.granska_namn(T.NAMN[pid])]

    # ☠️ SKU:n RÄKNAS ur husregeln, den skrivs inte av. Fyra av utkasten delar
    #    redan `FP-solar-laterne` — krocken uppstår i den KAPADE strängen.
    vantat = "FP-" + G.sku_bas(T.SLUG[pid])
    if T.SKU[pid] != vantat:
        fel.append("SKU: filen säger %r, regeln ger %r" % (T.SKU[pid], vantat))

    # ☠️ FLIKRADEN LÄSES SOM STRUKTUR, inte som närvaro — och räknas, för en
    #    dubblerad beskrivning ger två <h2> med samma namn.
    for flik in G.FLIKAR_SOM_KRAVS:
        n = len(re.findall(r"<h2>" + re.escape(flik) + r"</h2>", html))
        if n != 1:
            fel.append("FLIKRUBRIK %r förekommer %d gånger" % (flik, n))
    if "Montering och skötsel" in html:
        fel.append("DÖD RUBRIK: 'Montering och skötsel' matchar ingen flik")

    # ☠️ ALLT SOM SKA LIGGA I BRÖDTEXTEN MÅSTE STÅ FÖRE FÖRSTA FLIKRUBRIKEN.
    forsta = html.index("<h2>Tekniska specifikationer</h2>")
    for rubrik in (T.SOL_RUBRIK, "Passar inte den här?"):
        if html.index("<h2>%s</h2>" % rubrik) > forsta:
            fel.append("BLOCKET %r ligger EFTER första flikrubriken" % rubrik)

    # Sifferstil: aldrig kommalista av tal med enheten sist.
    for t in re.finditer(r"\d+(?:,\d+)?, \d", syn):
        fel.append("KOMMALISTA av tal: %r" % G.mening_kring(syn, t.start())[:70])

    # ☠️ VARJE TAL I BRÖDTEXTEN MÅSTE FINNAS I SPEC-TABELLEN. Undantagen är
    #    utskrivna jämförelsetal som grinden känner igen — de är mätta
    #    (en 40 W-glödlampa ger ~450 lm) och står inte i produktens spec.
    # ☠️ EN MENING MED LÄNK ÄR ETT PÅSTÅENDE OM SYSKONET, inte om den här
    #    sidan (runda 64). Första utkastet fällde SJUTTON korrekta
    #    korslänkar — varenda en namngav grannens höjd, som den ska.
    #
    #    Men den får inte bara HOPPAS ÖVER: en korslänk som anger grannens
    #    höjd FEL är precis den defekt uppgift #480 handlar om. Talet prövas
    #    därför mot MÅLETS spec-tabell i stället för mot den egna.
    JAMFOR = {"40", "450", "2700", "3", "1", "2", "4", "6", "8", "5", "15", "60"}
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

    for mal, mening in kors:
        facit = set()
        for m in mal:
            syskon = next((k for k, v in T.SLUG.items() if v == m), None)
            if syskon is None:
                fel.append("KORSLÄNK till okänd slug %r" % m)
                continue
            facit |= talen(syskon)
        _provala(mening, facit | JAMFOR, "korslänk")
    return fel


if __name__ == "__main__":
    kfel = G._kallkodsgrind_sku()
    sfel, antal = G._sjalvtest()
    tfel = G.tvillingsvep()
    print("grindar._sjalvtest(): %d fall, %d fel" % (antal, len(sfel)))
    for x in sfel + kfel + tfel:
        print("  ☠️", x)

    summa = len(sfel) + len(kfel) + len(tfel)
    for pid in T.NAMN:
        f = granska(pid)
        summa += len(f)
        print(("  FEL " if f else "  OK  ") + pid)
        for x in f:
            print("        ☠️", x)
    print("\n%d produkter, %d fel" % (len(T.NAMN), summa))
    sys.exit(1 if summa else 0)
