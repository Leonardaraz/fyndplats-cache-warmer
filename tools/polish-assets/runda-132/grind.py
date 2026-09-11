# -*- coding: utf-8 -*-
"""Runda 132 — textgrinden, körd på FILEN före varje skrivning.

☠️ INGEN REGEL DEFINIERAS OM HÄR. `grindar.py` äger jargongen, homoglyferna,
   artikelnummerformen, aktörsorden, landorden, negationen och SKU-regeln.
   Formen är runda 131:s med flit — uppgift #491: live-grinden drev isär i
   fem rundor för att varje runda skrev sin egen.

☠️ RUNDANS HUVUDREGEL ÄR SISALEN. Tre av tio produkter nämner sisal i
   leverantörens brödtext; BILDEN visade sisal på bara två. Den tredje
   (`762cc411`) har stolpar klädda i samma bouclé som stegen. En sida som
   lovar något att klösa på, när varan inte har det, är ett felköp för just
   den kund som köper för den saken. `sisal` i matt.py är facit, och grinden
   fäller åt BÅDA hållen.

☠️ MAXLASTGRINDEN ÄR DEN ANDRA, OCH DEN ÄR NEGATIV. Fyra av tio produkter
   saknar angiven maxlast. Att räkna fram en ur vikten eller ur ett syskon
   vore ett påhittat tal på en sida som handlar om att bära ett djur.

☠️ MONTERINGSGRINDEN ÄR OCKSÅ NEGATIV, men tvärtemot runda 131: här KRÄVER
   fem produkter montering och fem gör det inte.

☠️ FÄRGGRINDEN: sex av tio är färgsyskon i tre par. Att skriva syskonets färg
   på sin egen sida är precis den förväxling färgpar föder.
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

# ☠️ INGA ord som finns i svenskan. Varje post saknar svensk tvilling.
TYSKA = ["Hundetreppe", "Haustiertreppe", "Katzentreppe", "Tiertreppe",
         "Kletterstufen", "Kratzbaum", "Sisalseil", "Belastbarkeit",
         "Lieferumfang", "Technische", "Beschreibung", "Gesamtma",
         "Stufenh", "Schrittgr", "Spanplatte", "Kurzpl", "Wildleder",
         "Vlies", "Schaumstoff", "Klettverschluss", "Hochflor",
         "Stauraum", "Schwarz", "Braun", "Grau", "Dunkelbraun",
         "Naturholz", "Tierschutzgitter", "Anleitung", "Haustier",
         "stufig", "Faltbares"]

# ☠️ TYPGRIND. Hela rundan är TRAPPOR, och familjen säljer ÄVEN ramper. Ordet
#    "ramp" får inte stå i de fyra fält kunden möter i sökresultatet.
KRAVS = re.compile(r"trapp", re.I)
# ☠️ BAR `ramp`, INTE `\bramp`: i "Hundramp" är d och r båda
#    ordtecken, så \b matchar inte. Runda 131 gick på exakt samma
#    mina med `\bramp` — självtestet fångade den där också.
FORBJUDEN_TYP = re.compile(r"ramp", re.I)

NEGERBART = [
    (re.compile(r"\bvattent[äa]t\w*|\bv[äa]derbest[äa]ndig\w*", re.I),
     "VÄDERPÅSTÅENDE — ingen av de tio källorna anger något väderskydd"),
    (re.compile(r"\bh[öo]jdjusterbar\w*|\bst[äa]llbar\s+h[öo]jd", re.I),
     "JUSTERBAR HÖJD — ingen av trapporna går att höjdjustera"),
]

PER_PRODUKT = [
    # ☠️ En regel som gäller EN produkt ska gälla DEN, inte rundan — runda
    #    131 fällde sex korrekta sidor på motsatsen.
    (re.compile(r"\bsisal\w*", re.I),
     "SISAL påstås men bilden visar boucléklädda stolpar",
     lambda pid: not M.TRAPPOR[pid].get("sisal")),
    (re.compile(r"\bskruva\w*|\bmonter\w*|\bdra\s+[åa]t\s+alla", re.I),
     "MONTERING beskrivs men produkten kräver ingen",
     lambda pid: not M.TRAPPOR[pid].get("montering")),
    (re.compile(r"b[äa]r\s+upp\s+till\s+\d", re.I),
     "MAXLAST skrivs ut men produkten har ingen angiven",
     lambda pid: M.TRAPPOR[pid].get("last") is None),
    (re.compile(r"\bf[öo]rvaring\w*", re.I),
     "FÖRVARING påstås men produkten har ingen",
     lambda pid: not M.TRAPPOR[pid].get("forvaring")),
]

FORBJUDET = [
    (re.compile(r"\bCE-?m[äa]rkt\w*|\bCE-?certifi|\btestad\s+enligt", re.I),
     "CERTIFIERINGSPÅSTÅENDE — ingen källa anger någon norm"),
    (re.compile(r"\bmassivt?\s+tr[äa]\b|\b[äa]kta\s+tr[äa]\b", re.I),
     "MASSIVT TRÄ — källorna säger spånskiva och MDF"),
    (re.compile(r"\bmarknadens\b|\bbranschens\b|\bstarkast\w*\b"
                r"|\bb[äa]st(?:a|e)?\s+(?:i|p[åa]|av)\s+"
                r"(?:marknaden|klassen|sortimentet|sitt slag)"
                r"|\bdet\s+b[äa]sta\s+(?:valet|alternativet)", re.I),
     "SUPERLATIV utan mätvärde"),
    (re.compile(r"\b(?:h[öo]gst|l[äa]gst|mest|st[öo]rst|minst|tyngst|"
                r"l[äa]ttast)\w*\b[^.]{0,40}\b(?:uppsättning\w*|batch\w*|"
                r"de\s+tio\b|rundan\w*|sortimentet)", re.I),
     "BATCHSUPERLATIV — mät mot katalogen, inte mot rundan"),
    (re.compile(r"\bfri\s+frakt\b|\bsnabb\s+leverans\b|\bleverans\s+inom\b", re.I),
     "LEVERANSLÖFTE"),
    (re.compile(r"\bartikelnummer\b|\bmodellreferens\b|\bartikelnr\b"
                r"|\breferens:", re.I),
     "ARTIKELNUMMER-ETIKETT — numret hör hemma på mappningen"),
    # ☠️ RASNAMN är ett viktpåstående utan mätvärde — MEN leverantören anger
    #    själv tre raser som storleksexempel för 7-kilosmodellerna, och det
    #    är en KÄLLUPPGIFT. Grinden fäller raser som INTE står i källan.
    (re.compile(r"\b(?:labrador|golden\s*retriever|husky|dalmatiner|"
                r"bullterrier|sch[äa]fer|border\s*collie|rottweiler)\w*", re.I),
     "RASNAMN utan källa — ett rasnamn är ett viktpåstående"),
]

# Rundans egna laster. Ingen produkts text får bära en ANNANS.
LASTER = {p: (str(M.TRAPPOR[p]["last"]) if M.TRAPPOR[p].get("last") else None)
          for p in T.NAMN}

# Syskonets färg får inte stå på den egna sidan.
SYSKONFARG = {}
for _p, _d in M.TRAPPOR.items():
    _s = _d.get("syskon")
    SYSKONFARG[_p] = (M.TRAPPOR[_s].get("farg") or "") if _s else ""


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


def utan_korslankar(html, pid):
    """HTML:en MINUS korslänksblocket.

    ☠️ `dela_pa_ankare` räcker INTE: ankarens etikett ("samma trappa i
       mörkbrunt") stannar i den egna strängen, så grannens färg och
       grannens tal såg ut att stå i vår egen text. Uppmätt i runda 132 på
       sex av tio sidor. Blocket skärs därför bort på rubriknivå.
    """
    start = html.find("<h2>" + T.KORS_INGRESS[pid] + "</h2>")
    slut = html.find("<h2>Tekniska specifikationer</h2>")
    if start == -1 or slut == -1 or slut < start:
        return html
    return html[:start] + html[slut:]


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

    # ☠️ PER_PRODUKT läser den EGNA zonen, inte hela sidan.
    syn_eget = G.synlig_meningstext(utan_korslankar(html, pid)) if not live else syn
    for m, etikett, galler in PER_PRODUKT:
        if not galler(pid):
            continue
        t = G.loftestraff(m, syn_eget)
        if t:
            fel.append("%s: %r"
                       % (etikett, G.mening_kring(syn_eget, t.start())[:90]))

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
    for txt, var in ((T.NAMN[pid], "namn"), (T.TITEL[pid], "titel"),
                     (T.SLUG[pid], "slug"), (T.META[pid], "meta")):
        if not KRAVS.search(txt):
            fel.append("TYP: %s saknar ordet trappa" % var)
        if FORBJUDEN_TYP.search(txt):
            fel.append("TYP: %s bär ordet ramp — rundan är trappor" % var)

    # --------------------------------------------------------- sisalgrind --
    if M.TRAPPOR[pid].get("sisal") and not re.search(r"sisal", syn, re.I):
        fel.append("SISAL finns på bilden men nämns inte på sidan")

    # ---------------------------------------------------------- lastgrind --
    egen_last = LASTER[pid]
    if egen_last:
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

    # ☠️ SKU:n RÄKNAS ur husregeln. Nio av tio handskrivna var fel i runda 132.
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
                   T.KORS_INGRESS[pid]):
        if html.index("<h2>%s</h2>" % rubrik) > forsta:
            fel.append("BLOCKET %r ligger EFTER första flikrubriken" % rubrik)

    # ☠️ HREF-FORMEN. Uppmätt i runda 132 mot skarpa Wix: en rotrelativ
    #    href ("/produkt/x") skrivs om till "https:/produkt/x" — med ETT
    #    snedstreck, alltså en adress vars VÄRDNAMN blir "produkt". Felet
    #    syns inte i PATCH-svaret; det syntes bara som +6 tecken per länk
    #    i återläsningen. Runda 131 råkade använda den absoluta formen och
    #    klarade sig. Grinden gör det till en regel i stället för tur.
    for t in re.finditer(r'href="([^"]*)"', html):
        adr = t.group(1)
        if not adr.startswith("https://www.fyndplats.se/produkt/"):
            fel.append("HREF ej absolut butiksadress: %r" % adr)

    for t in re.finditer(r"\d+(?:,\d+)?, \d", syn):
        fel.append("KOMMALISTA av tal: %r" % G.mening_kring(syn, t.start())[:70])

    # ------------------------------------------------- zonindelad talgrind --
    JAMFOR = {"1", "2", "3", "4", "7"}   # 7 kg är leverantörens hundviktsmått
    egna, kors = G.dela_pa_ankare(html)
    brod_slut = "Tekniska specifikationer"

    def _provala(text, kanda, var):
        for t in re.finditer(r"\d+(?:,\d+)?", text):
            if t.group() not in kanda:
                fel.append("OHÄRLETT TAL %s (%s): %r"
                           % (t.group(), var,
                              G.mening_kring(text, t.start())[:70]))

    egen_text = G.synlig_meningstext(utan_korslankar(html, pid))
    if brod_slut in egen_text:
        egen_text = egen_text[:egen_text.index(brod_slut)]
    _provala(egen_text, talen(pid) | JAMFOR, "egen text")

    # ☠️ SYSKONETS FÄRG prövas BARA i den egna texten — korslänken får nämna
    #    grannen, det är hela dess uppgift.
    syskonfarg = SYSKONFARG.get(pid) or ""
    if syskonfarg:
        stam = syskonfarg.split()[0]
        if re.search(r"\b%s" % re.escape(stam), egen_text, re.I):
            fel.append("SYSKONETS FÄRG %r i egen text" % stam)

    # ☠️ ANNANS LAST prövas BARA i den egna texten.
    for annan, last in LASTER.items():
        if annan == pid or not last or last == egen_last:
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
    """Rundans EGNA grindar prövas här, inte bara i mutation.py."""
    fel, antal = [], 0

    def prov(namn, villkor):
        nonlocal antal
        antal += 1
        if not villkor:
            fel.append(namn)

    # Typgrinden åt båda hållen.
    prov("typ kräver trappa", bool(KRAVS.search("Hundtrappa 3 steg")))
    prov("typ fäller ramp", bool(FORBJUDEN_TYP.search("Hundramp 90 cm")))
    prov("typ släpper 'trampa'", bool(KRAVS.search("Husdjurstrappa")))
    # ☠️ Den som föll: \bramp matchar inte "Hundramp".
    prov("typ fäller 'Hundramp' (ordgräns-fällan)",
         bool(FORBJUDEN_TYP.search("Hundramp för bil")))
    prov("typ fäller 'rampen'", bool(FORBJUDEN_TYP.search("rampen är 90 cm")))

    # ☠️ Korslänksstrykningen: grannens ord får inte nå den egna zonen.
    _h = utan_korslankar(T.bygg("f384c51d"), "f384c51d")
    prov("korslänk struken", "hundtrappa-morkbrun-4-steg" not in _h)
    prov("egen text kvar efter strykning",
         "Tekniska specifikationer" in _h and "Det här får du" in _h)
    prov("grannens färg struken", "mörkbrunt" not in _h)

    # Sisalspärren gäller RÄTT produkt och bara den.
    m, _, galler = PER_PRODUKT[0]
    prov("sisal gäller 762cc411 (bouclé)", galler("762cc411"))
    prov("sisal gäller INTE 8f6147b5 (har sisal)", not galler("8f6147b5"))
    prov("sisal gäller INTE 4c25eb86 (har sisal)", not galler("4c25eb86"))
    prov("sisal gäller 71e8e879 (skum)", galler("71e8e879"))
    prov("mönstret fäller ordet", bool(m.search("Stolpar i sisalrep.")))

    # Monteringsspärren.
    m, _, galler = PER_PRODUKT[1]
    prov("montering gäller 96d2803c", galler("96d2803c"))
    prov("montering gäller INTE f384c51d", not galler("f384c51d"))
    prov("montering gäller INTE 03715963", not galler("03715963"))
    prov("mönstret fäller 'skruvas'", bool(m.search("skruvas ihop")))
    prov("mönstret fäller 'monteras'", bool(m.search("måste monteras")))

    # Maxlastspärren.
    m, _, galler = PER_PRODUKT[2]
    prov("maxlast gäller 03715963 (ingen last)", galler("03715963"))
    prov("maxlast gäller INTE 8f6147b5 (50 kg)", not galler("8f6147b5"))
    prov("mönstret fäller 'bär upp till 30'",
         bool(m.search("Den bär upp till 30 kg.")))
    prov("mönstret släpper utan tal",
         not m.search("Den bär upp till taket."))

    # Förvaringsspärren.
    m, _, galler = PER_PRODUKT[3]
    prov("förvaring gäller 8f6147b5", galler("8f6147b5"))
    prov("förvaring gäller INTE 03715963", not galler("03715963"))
    prov("förvaring gäller INTE c38f929e", not galler("c38f929e"))

    # Batchsuperlativet.
    m = next(x[0] for x in FORBJUDET if "BATCHSUPERLATIV" in x[1])
    for s in ("Den högsta trappan i den här uppsättningen.",
              "Den bär mest av de tio varorna i sortimentet."):
        prov("batchsuperlativ: %s" % s[:26], bool(m.search(s)))
    prov("batchsuperlativ släpper vanligt 'högst'",
         not m.search("Trappan når som högst 59 centimeter."))

    # Rasnamn.
    m = next(x[0] for x in FORBJUDET if "RASNAMN" in x[1])
    prov("rasnamn fäller labrador", bool(m.search("Passar en labrador.")))
    prov("rasnamn släpper hund", not m.search("Passar en hund."))
    prov("rasnamn släpper källans egna raser",
         not m.search("som foxterrier, welsh corgi och cockerspaniel"))

    # Laster: sex har en, fyra har ingen.
    prov("sex produkter har last",
         sum(1 for v in LASTER.values() if v) == 6)
    prov("fyra saknar last",
         sum(1 for v in LASTER.values() if not v) == 4)

    # Syskonparen är ömsesidiga och bär varandras färg.
    for a, b in (("f384c51d", "3ff2bc32"), ("03715963", "c38f929e"),
                 ("96d2803c", "11436227")):
        prov("syskonfärg %s" % a, bool(SYSKONFARG[a]))
        prov("syskonfärg %s" % b, bool(SYSKONFARG[b]))
        prov("%s länkar till %s" % (a, b),
             T.SLUG[b] in [s for s, _ in T.KORSLANK[a]])
        prov("%s länkar till %s" % (b, a),
             T.SLUG[a] in [s for s, _ in T.KORSLANK[b]])

    # ☠️ HREF-formen: absolut butiksadress, aldrig rotrelativ.
    for pid in T.NAMN:
        for a in re.findall(r'href="([^"]*)"', T.bygg(pid)):
            prov("absolut href %s" % a[:46],
                 a.startswith("https://www.fyndplats.se/produkt/"))
    prov("rotrelativ href fälls",
         not "/produkt/x".startswith("https://www.fyndplats.se/produkt/"))

    # Granntalen går att slå upp för varje korslänk.
    for pid in T.NAMN:
        for mal, _ in T.KORSLANK[pid]:
            prov("granntal för %s" % mal, _granntal(mal) is not None)
    return fel, antal


if __name__ == "__main__":
    kfel = G._kallkodsgrind_sku()
    sfel, santal = G._sjalvtest()
    rfel, rantal = sjalvtest()
    print("grindar._sjalvtest(): %d fall, %d fel" % (santal, len(sfel)))
    print("grind.sjalvtest():    %d fall, %d fel" % (rantal, len(rfel)))
    for x in sfel + rfel + kfel:
        print("  ☠️", x)

    summa = len(sfel) + len(rfel) + len(kfel)
    for pid in T.NAMN:
        f = granska(pid)
        summa += len(f)
        print(("  FEL " if f else "  OK  ") + pid)
        for x in f:
            print("        ☠️", x)
    print("\n%d produkter, %d fel" % (len(T.NAMN), summa))
    sys.exit(1 if summa else 0)
