# -*- coding: utf-8 -*-
"""Runda 133 — textgrinden, körd på FILEN före varje skrivning.

☠️ INGEN REGEL DEFINIERAS OM HÄR. `grindar.py` äger jargongen, homoglyferna,
   artikelnummerformen, aktörsorden, landorden, negationen och SKU-regeln.
   Formen är runda 132:s med flit — uppgift #491: live-grinden drev isär i
   fem rundor för att varje runda skrev sin egen.

☠️ RUNDANS HUVUDREGEL ÄR ANTALET INGÅNGAR. `e7a9abb7` och `f2e06b7a` delar
   mått, vikt, paketmått OCH ordagrant samma tyska punktlista — men fotot
   visar TRE respektive TVÅ ingångar (uppgift #504). Leverantörens text kan
   alltså inte avgöra det, och en sida som lovar tre hålor på en vara med två
   är ett felköp för just den kund som köper för den saken. `ingangar` i
   matt.py är facit, och grinden fäller åt BÅDA hållen: rätt tal måste stå,
   fel tal får inte stå.

☠️ MAXLASTGRINDEN ÄR NEGATIV. FEM av tio saknar angiven maxlast. Att räkna
   fram en ur fraktvikten eller ur ett syskon vore ett påhittat tal på en
   möbel ett djur klättrar i.

☠️ VIKTGRINDEN ÄR HELT NEGATIV, och det är nytt för den här rundan. INGEN av
   de tio har ett `Gewicht` i tyskan. Spec-tabellens `Vikt` är FRAKTVIKTEN
   (uppgift #488), alltså inte varans. Varans vikt är okänd för alla tio och
   får därför inte stå någonstans.

☠️ MONTERINGSGRINDEN ÄR OCKSÅ NEGATIV, men åt andra hållet än last: ÅTTA av
   tio säger uttryckligen att ingen montering behövs. De två som INTE säger
   något (b6bf627f, a33447f9) får inte påstå det.
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
TYSKA = ["Kratzbaum", "Kratztonne", "Katzentonne", "Katzenbaum", "Katzenfass",
         "Katzenkratz", "Kletterbaum", "Katzenturm", "Kratzfl", "Kratzteppich",
         "Kratzs", "Sisalseil", "Belastbarkeit", "Lieferumfang", "Technische",
         "Beschreibung", "Gesamtma", "Gesamtabmess", "Spanplatte", "Pl[üu]sch",
         "H[öo]hlenbereich", "Ebenen", "Sitzstange", "H[äa]ngematte",
         "Anleitung", "Handbuch", "Montage", "erforderlich", "Hellgrau",
         "Cremewei", "Khaki\\+", "T[üu]rloch", "Innenloch", "Schlafh",
         "Samtpfote", "st[öo]ckige", "Oberbett"]

# ☠️ TYPGRIND. Hela rundan är TUNNOR, och familjen säljer ÄVEN klösträd med
#    pelare och plattformar — 43 publicerade sidor av den sorten. Ordet
#    "träd" får inte stå i de fyra fält kunden möter i sökresultatet.
KRAVS = re.compile(r"kl[öo]stunna", re.I)
# ☠️ BAR `tr[äa]d`, INTE `\btr[äa]d`: i "klösträd" är s och t båda ordtecken,
#    så \b matchar inte. Exakt samma mina som runda 131 och 132 gick på med
#    `\bramp` — självtestet fäller den här också.
FORBJUDEN_TYP = re.compile(r"tr[äa]d", re.I)

RAKNEORD = {1: "en", 2: "två", 3: "tre", 4: "fyra"}

NEGERBART = [
    (re.compile(r"\bvattent[äa]t\w*|\bv[äa]derbest[äa]ndig\w*|\butomhus\w*", re.I),
     "VÄDERPÅSTÅENDE — alla tio är inomhusmöbler i spånskiva och tyg"),
    (re.compile(r"\bh[öo]jdjusterbar\w*|\btakspänn\w*|\bst[äa]llbar\s+h[öo]jd", re.I),
     "JUSTERBAR HÖJD — ingen av tunnorna går att höjdjustera"),
    (re.compile(r"\btippskydd\w*|\bv[äa]ggf[äa]st\w*|\bv[äa]ggmonter\w*", re.I),
     "TIPPSKYDD — ingen av tunnorna har väggfäste eller takspänne"),
]

PER_PRODUKT = [
    # ☠️ En regel som gäller EN produkt ska gälla DEN, inte rundan — runda
    #    131 fällde sex korrekta sidor på motsatsen.
    (re.compile(r"\bmonter\w*|\bskruva\w*|\bdra\s+[åa]t\b", re.I),
     "MONTERING nämns men källan säger ingenting om den",
     lambda pid: M.TUNNOR[pid].get("montering") is None),
    (re.compile(r"b[äa]r\s+\d|t[åa]l\s+\d|maxlast", re.I),
     "MAXLAST skrivs ut men produkten har ingen angiven",
     lambda pid: M.TUNNOR[pid].get("last") is None),
    (re.compile(r"\bsj[öo]gr[äa]s\w*|\bfl[äa]tad?e?\b|\bkorgbindning\w*", re.I),
     "SJÖGRÄS påstås men produkten är klädd i sisal och plysch",
     lambda pid: "sjögräs" not in M.TUNNOR[pid]["material"]),
    # ☠️ BAR `leksak`, INTE `\bleksak`: i "musleksak" är s och l båda
    #    ordtecken, så `\b` matchar inte — samma mina som `\btr[äa]d`
    #    och runda 131:s `\bramp`. Hittad av alt-textgrindens
    #    mutationstest, som INTE föll där det skulle.
    (re.compile(r"leksak\w*|\bmustips\w*|\bh[äa]ngande\b", re.I),
     "LEKSAK påstås men produkten har inga",
     lambda pid: not M.TUNNOR[pid].get("leksaker")),
    (re.compile(r"\btv[äa]ttbar\w*|\bmaskintv[äa]tt\w*|\bavtagbar\w*\s+b[äa]dd", re.I),
     "TVÄTTBAR BÄDD påstås men produkten har ingen",
     lambda pid: not M.TUNNOR[pid].get("badd")),
]

FORBJUDET = [
    (re.compile(r"\bCE-?m[äa]rkt\w*|\bCE-?certifi|\btestad\s+enligt"
                r"|\bEN\s*71\b", re.I),
     "CERTIFIERINGSPÅSTÅENDE — ingen källa anger någon norm"),
    (re.compile(r"\bmassivt?\s+tr[äa]\b|\b[äa]kta\s+tr[äa]\b", re.I),
     "MASSIVT TRÄ — källorna säger spånskiva och MDF"),
    # ☠️ VIKTGRINDEN. Ingen av de tio har en känd varuvikt; spec-tabellens
    #    tal är FRAKTVIKTEN (uppgift #488). Formen "väger N kg" är alltså
    #    alltid ett påhittat tal här — till skillnad från "tål N kg".
    (re.compile(r"\bv[äa]ger\s+\d|\begenvikt\w*|\bvikt:\s*\d", re.I),
     "VARUVIKT — okänd för alla tio, spec-tabellens tal är fraktvikten"),
    (re.compile(r"\bmarknadens\b|\bbranschens\b|\bstarkast\w*\b"
                r"|\bb[äa]st(?:a|e)?\s+(?:i|p[åa]|av)\s+"
                r"(?:marknaden|klassen|sortimentet|sitt slag)"
                r"|\bdet\s+b[äa]sta\s+(?:valet|alternativet)", re.I),
     "SUPERLATIV utan mätvärde"),
    # ☠️ SORTIMENTSSUPERLATIVET ÄR SAMMA FEL MED ANNAN ADRESS. Runda 133 skrev
    #    "den smalaste öppningen i vårt sortiment" — det evaderade mönstret
    #    nedan genom att peka på BUTIKEN i stället för på rundan, och är
    #    värre: rundans tio går att räkna, de 43 publicerade klösträden har
    #    ingen av oss mätt. Hittat med ögon vid Steg 12, inte av grinden.
    (re.compile(r"\b(?:h[öo]gst|l[äa]gst|mest|st[öo]rst|minst|tyngst|"
                r"l[äa]ttast|rymligast|smalast|bredast|djupast)\w*\b[^.]{0,45}\b"
                r"(?:uppsättning\w*|batch\w*|de\s+tio\b|rundan\w*|"
                r"sortiment\w*|katalog\w*|hos\s+oss|vi\s+har|butik\w*)", re.I),
     "OMÄTT SUPERLATIV — mot rundan ELLER mot sortimentet, båda ogrundade"),
    (re.compile(r"\bfri\s+frakt\b|\bsnabb\s+leverans\b|\bleverans\s+inom\b", re.I),
     "LEVERANSLÖFTE"),
    (re.compile(r"\bartikelnummer\b|\bmodellreferens\b|\bartikelnr\b"
                r"|\breferens:", re.I),
     "ARTIKELNUMMER-ETIKETT — numret hör hemma på mappningen"),
    (re.compile(r"\brasnamn\b|\bmaine\s*coon\w*|\bbengal\w*|\bragdoll\w*"
                r"|\bperser\w*|\bsiames\w*", re.I),
     "KATTRAS utan källa — ett rasnamn är ett viktpåstående"),
]

LASTER = {p: (str(M.TUNNOR[p]["last"]) if M.TUNNOR[p].get("last") else None)
          for p in T.NAMN}

# Färgsyskonens färger, per produkt: de ANDRAS färger får inte stå i den
# egna texten. Hämtas ur matt.FARGSYSKON så listan inte kan glida isär.
SYSKONFARG = {p: [] for p in T.NAMN}
for _grupp in M.FARGSYSKON:
    for _a in _grupp:
        SYSKONFARG[_a] = [M.TUNNOR[_b]["farg"] for _b in _grupp if _b != _a]


def talen(pid):
    """Varje tal som produktens EGNA spec-tabell bär, som strängar."""
    ut = set()
    for _, v in T.SPEC[pid]:
        ut |= set(re.findall(r"\d+(?:,\d+)?", v))
    return ut


def _granntal(slug):
    for k, s in T.SLUG.items():
        if s == slug:
            return talen(k)
    return None


def utan_korslankar(html, pid):
    """HTML:en MINUS korslänksblocket — inklusive färgraden.

    ☠️ `dela_pa_ankare` räcker INTE: ankarets etikett ("samma modell i
       ljusbrunt") stannar i den egna strängen, så grannens färg såg ut att
       stå i vår egen text. Uppmätt i runda 132 på sex av tio sidor.
       Färgraden ligger i SAMMA stycke som länkarna, alltså skärs blocket
       bort på RUBRIKNIVÅ och inte på ankarnivå.
    """
    start = html.find("<h2>" + T.KORS_INGRESS[pid] + "</h2>")
    slut = html.find("<h2>Tekniska specifikationer</h2>")
    if start == -1 or slut == -1 or slut < start:
        return html
    return html[:start] + html[slut:]


def utan_fargrad(text, pid):
    """Texten MINUS rundans egen färg-/storleksrad för `pid`.

    Raden beskriver SYSKONET ("…finns även som 79 cm hög med tre hålor").
    Den är sann och ska stå kvar på sidan — den får bara inte räknas som
    ett påstående om DEN HÄR varans antal ingångar.
    """
    rad = T.FARGRAD.get(pid)
    return text.replace(rad, " ") if rad else text


def granska(pid, html=None, live=False):
    """Rundans domänregler. EN uppsättning, två indata."""
    if html is None:
        html = T.bygg(pid)
    fel = []

    if live:
        egna, _ = G.egna_meningar(html, T.SLUG[pid], T.NAMN[pid])
        syn = G.synlig_meningstext(
            "<p>%s</p><p>%s</p><p>%s</p><p>%s</p><p>%s</p>"
            % (egna, T.NAMN[pid], T.TITEL[pid], T.META[pid], T.SOKORD[pid]))
    else:
        syn = G.synlig_meningstext(html)

    for m, etikett in FORBJUDET:
        for t in m.finditer(syn):
            fel.append("%s: %r" % (etikett, G.mening_kring(syn, t.start())[:90]))

    for m, etikett in NEGERBART:
        t = G.loftestraff(m, syn)
        if t:
            fel.append("%s: %r" % (etikett, G.mening_kring(syn, t.start())[:90]))

    # ☠️ FÄRGRADEN ÄR ETT PÅSTÅENDE OM SYSKONET, inte om den här varan.
    #    Offline faller den bort med korslänksblocket; LIVE gör den inte
    #    det, för `egna_meningar` stryker grannmeningar på SLUG och NAMN
    #    och "Samma serie finns även som 79 cm hög med tre hålor" bär
    #    varken. Steg 14 fällde därför b6bf627f och a33447f9 för sin egen
    #    korrekta syskonrad — uppgift #384 och #437:s klass, tredje
    #    gången. Strykningen är av en KÄND EGEN sträng, aldrig en
    #    heuristik, och görs i BÅDA lägena så de inte kan glida isär
    #    (uppgift #491): offline är den redan borta, alltså en no-op.
    syn_eget = G.synlig_meningstext(utan_korslankar(html, pid)) if not live else syn
    syn_eget = utan_fargrad(syn_eget, pid)
    for m, etikett, galler in PER_PRODUKT:
        if not galler(pid):
            continue
        t = G.loftestraff(m, syn_eget)
        if t:
            fel.append("%s: %r"
                       % (etikett, G.mening_kring(syn_eget, t.start())[:90]))

    for ord_ in TYSKA:
        if re.search(r"\b" + ord_, syn, re.I):
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
            fel.append("TYP: %s saknar ordet klöstunna" % var)
        if FORBJUDEN_TYP.search(txt):
            fel.append("TYP: %s bär ordet träd — rundan är tunnor" % var)

    # ------------------------------------------------------- ingångsgrind --
    # ☠️ RUNDANS HUVUDREGEL, uppgift #504. Rätt tal MÅSTE stå i namn och
    #    meta; ANNAT tal får inte stå intill ordet håla/ingång någonstans
    #    i den egna texten.
    n = M.TUNNOR[pid]["ingangar"]
    ratt = RAKNEORD[n]
    for txt, var in ((T.NAMN[pid], "namn"), (T.META[pid], "meta")):
        if not re.search(r"\b(%s|%d)\b" % (ratt, n), txt, re.I):
            fel.append("INGÅNGAR: %s saknar antalet (%s)" % (var, ratt))
    for annat, ordet in RAKNEORD.items():
        if annat == n:
            continue
        m = re.compile(r"\b(?:%s|%d)\s+(?:h[åa]lor|ing[åa]ngar|[öo]ppningar)"
                       % (ordet, annat), re.I)
        t = m.search(syn_eget)
        if t:
            fel.append("INGÅNGAR: fel antal (%s) i egen text — facit är %s: %r"
                       % (ordet, ratt, G.mening_kring(syn_eget, t.start())[:80]))

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

    vantat = "FP-" + G.sku_bas(T.SLUG[pid])
    if T.SKU[pid] != vantat:
        fel.append("SKU: filen säger %r, regeln ger %r" % (T.SKU[pid], vantat))

    if live:
        return fel + ["FLIKFEL: %s" % p for p in G.flikfel(html)]

    # ---------------------------------------------- källans egen struktur --
    for flik in G.FLIKAR_SOM_KRAVS:
        antal = len(re.findall(r"<h2>" + re.escape(flik) + r"</h2>", html))
        if antal != 1:
            fel.append("FLIKRUBRIK %r förekommer %d gånger" % (flik, antal))

    forsta = html.index("<h2>Tekniska specifikationer</h2>")
    for rubrik in (T.RUBRIK[pid], T.KATT_RUBRIK[pid], T.BRUK_RUBRIK[pid],
                   T.KORS_INGRESS[pid]):
        if html.index("<h2>%s</h2>" % rubrik) > forsta:
            fel.append("BLOCKET %r ligger EFTER första flikrubriken" % rubrik)

    # ☠️ HREF-FORMEN. Uppmätt i runda 132 mot skarpa Wix: en rotrelativ href
    #    ("/produkt/x") skrivs om till "https:/produkt/x" — ETT snedstreck,
    #    alltså en adress vars VÄRDNAMN blir "produkt".
    for t in re.finditer(r'href="([^"]*)"', html):
        adr = t.group(1)
        if not adr.startswith("https://www.fyndplats.se/produkt/"):
            fel.append("HREF ej absolut butiksadress: %r" % adr)

    for t in re.finditer(r"\d+(?:,\d+)?, \d", syn):
        fel.append("KOMMALISTA av tal: %r" % G.mening_kring(syn, t.start())[:70])

    # ------------------------------------------------- zonindelad talgrind --
    # Tal som får stå utan att finnas i den egna spec-tabellen: räkneord för
    # plan och hålor, samt kattviktsgränserna ur källan.
    JAMFOR = {"1", "2", "3", "4", "5", "6"}
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

    # ☠️ SYSKONETS FÄRG prövas BARA i den egna texten — korslänken och
    #    färgraden får nämna grannen, det är hela deras uppgift.
    # ☠️ BARA DET SOM SKILJER. Grupp C:s tre tunnor är alla "ljusgrå" eller
    #    "ljusbrun" i grunden och skiljs åt av KANTFÄRGEN. En grind som
    #    jämförde syskonets FÖRSTA ord fällde bd0d7f9e och efa9c03e för att
    #    de skrev sin EGEN grundfärg — ett falsklarm på korrekt text, och
    #    det värsta slaget: det lär en att sluta läsa grinden.
    egna_ord = set(re.findall(r"\w+", M.TUNNOR[pid]["farg"].lower()))
    for farg in SYSKONFARG.get(pid, []):
        for ord_ in re.findall(r"\w+", farg.lower()):
            if len(ord_) < 4 or ord_ in egna_ord:
                continue
            if re.search(r"\b%s" % re.escape(ord_), egen_text, re.I):
                fel.append("SYSKONETS FÄRGORD %r i egen text" % ord_)

    for annan, last in LASTER.items():
        if annan == pid or not last or last == egen_last:
            continue
        if re.search(r"\b%s\s*kg" % re.escape(last), egen_text, re.I):
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
    prov("typ kräver klöstunna", bool(KRAVS.search("Klöstunna 70 cm")))
    prov("typ kräver klöstunna i sluggen", bool(KRAVS.search("klostunna-70-cm")))
    prov("typ fäller klösträd", bool(FORBJUDEN_TYP.search("Klösträd 170 cm")))
    # ☠️ Den som föll i runda 131 och 132: \b matchar inte inuti ordet.
    prov("typ fäller 'klösträd' (ordgräns-fällan)",
         bool(FORBJUDEN_TYP.search("Klösträd med grotta")))
    prov("typ fäller 'trädet'", bool(FORBJUDEN_TYP.search("trädet är högt")))
    prov("typ släpper 'tunna' utan träd",
         not FORBJUDEN_TYP.search("Klöstunna i sisal"))

    # ☠️ INGÅNGSGRINDEN — rundans huvudregel.
    prov("facit: e7a9abb7 har tre", M.TUNNOR["e7a9abb7"]["ingangar"] == 3)
    # ☠️ STOD "två" HÄR TILL STEG 9, och självtestet LÅSTE FEL FACIT.
    #    Måttritningen visar tre; bild 1 och bild 2 visar två VAR, men inte
    #    samma två. Ett självtest kan bara bevisa att koden gör det datan
    #    säger — aldrig att datan är sann.
    prov("facit: f2e06b7a har tre", M.TUNNOR["f2e06b7a"]["ingangar"] == 3)
    prov("facit: de två delar mått",
         M.TUNNOR["e7a9abb7"]["matt"] == M.TUNNOR["f2e06b7a"]["matt"])
    prov("facit: de två är färgsyskon",
         ("e7a9abb7", "f2e06b7a") in M.FARGSYSKON)
    prov("ingen av de tio bär Ø på en fyrkantig ingång",
         all("Ø" not in M.TUNNOR[p]["oppning"]
             for p in ("e7a9abb7", "f2e06b7a")))
    _m3 = re.compile(r"\b(?:tre|3)\s+(?:h[åa]lor|ing[åa]ngar|[öo]ppningar)", re.I)
    _m2 = re.compile(r"\b(?:två|2)\s+(?:h[åa]lor|ing[åa]ngar|[öo]ppningar)", re.I)
    prov("mönstret fäller 'tre ingångar'", bool(_m3.search("Den har tre ingångar.")))
    prov("mönstret fäller 'två hålor'", bool(_m2.search("Två hålor i sisal.")))
    prov("mönstret släpper 'tre katter'", not _m3.search("Plats för tre katter."))
    # Ingen av de tio bär fel antal i sin egen text.
    for _p in T.NAMN:
        _n = M.TUNNOR[_p]["ingangar"]
        _fel_ord = "tre" if _n == 2 else "två"
        _mm = re.compile(r"\b%s\s+(?:h[åa]lor|ing[åa]ngar|[öo]ppningar)"
                         % _fel_ord, re.I)
        _eg = G.synlig_meningstext(utan_korslankar(T.bygg(_p), _p))
        prov("%s bär inte fel antal (%s)" % (_p, _fel_ord),
             not _mm.search(_eg))

    # Färgraden följer FARGSYSKON — den som saknar syskon får ingen rad.
    prov("e7a9abb7 HAR färgrad", "e7a9abb7" in T.FARGRAD)
    prov("f2e06b7a HAR färgrad", "f2e06b7a" in T.FARGRAD)
    prov("e43b623c har ingen färgrad", "e43b623c" not in T.FARGRAD)
    prov("varje färgsyskon har en färgrad",
         all(p in T.FARGRAD for g in M.FARGSYSKON for p in g))
    # ☠️ Färgradsstrykningen: den ska ta syskonraden och INGET annat.
    _fr = T.FARGRAD["b6bf627f"]
    prov("färgraden stryks", _fr not in utan_fargrad("A " + _fr + " B",
                                                     "b6bf627f"))
    prov("resten står kvar",
         utan_fargrad("A " + _fr + " B", "b6bf627f").startswith("A "))
    prov("ett ÄKTA felantal överlever strykningen",
         "tre hålor" in utan_fargrad(
             "Tunnan har tre hålor. " + _fr, "b6bf627f"))
    prov("produkt utan färgrad rörs inte",
         utan_fargrad("oförändrad", "e43b623c") == "oförändrad")
    prov("bd0d7f9e HAR färgrad", "bd0d7f9e" in T.FARGRAD)

    # Korslänksstrykningen: grannens ord får inte nå den egna zonen.
    _h = utan_korslankar(T.bygg("bd0d7f9e"), "bd0d7f9e")
    prov("korslänk struken", "klostunna-70-cm-ljusbrun" not in _h)
    prov("färgraden struken med", "ljusbrunt" not in _h)
    prov("egen text kvar efter strykning",
         "Tekniska specifikationer" in _h and "Det här får du" in _h)

    # Monteringsspärren — negativ, gäller de TVÅ som källan tiger om.
    m, _, galler = PER_PRODUKT[0]
    prov("montering gäller b6bf627f (källan tiger)", galler("b6bf627f"))
    prov("montering gäller a33447f9 (källan tiger)", galler("a33447f9"))
    prov("montering gäller INTE e7a9abb7", not galler("e7a9abb7"))
    prov("montering gäller INTE d85ade1b", not galler("d85ade1b"))
    prov("mönstret fäller 'monteras'", bool(m.search("måste monteras")))

    # Maxlastspärren.
    m, _, galler = PER_PRODUKT[1]
    prov("maxlast gäller bd0d7f9e (ingen last)", galler("bd0d7f9e"))
    prov("maxlast gäller INTE e43b623c (10 kg)", not galler("e43b623c"))
    prov("mönstret fäller 'bär 20'", bool(m.search("Den bär 20 kg.")))
    prov("mönstret fäller 'tål 10'", bool(m.search("Den tål 10 kg.")))
    prov("mönstret släpper utan tal", not m.search("Den bär katten."))

    # Sjögrässpärren.
    m, _, galler = PER_PRODUKT[2]
    prov("sjögräs gäller e7a9abb7 (har inget)", galler("e7a9abb7"))
    prov("sjögräs gäller INTE b6bf627f (har)", not galler("b6bf627f"))
    prov("sjögräs gäller INTE a33447f9 (har)", not galler("a33447f9"))

    # Leksaks- och bäddspärren.
    m, _, galler = PER_PRODUKT[3]
    prov("leksak gäller bd0d7f9e (har inga)", galler("bd0d7f9e"))
    prov("leksak gäller INTE d85ade1b", not galler("d85ade1b"))
    m, _, galler = PER_PRODUKT[4]
    prov("bädd gäller e43b623c (har ingen)", galler("e43b623c"))
    prov("bädd gäller INTE ec29ad45", not galler("ec29ad45"))

    # Viktgrinden — helt negativ.
    m = next(x[0] for x in FORBJUDET if "VARUVIKT" in x[1])
    prov("viktgrind fäller 'väger 8,6 kg'", bool(m.search("Den väger 8,6 kg.")))
    prov("viktgrind fäller 'Vikt: 10'", bool(m.search("Vikt: 10 kg")))
    prov("viktgrind släpper 'tål 20 kg'", not m.search("Den tål 20 kg."))
    prov("ingen av de tio har känd varuvikt",
         all("vikt" not in d for d in M.TUNNOR.values()))

    # Superlativgrinden — mot rundan OCH mot sortimentet.
    m = next(x[0] for x in FORBJUDET if "OMÄTT SUPERLATIV" in x[1])
    prov("fäller 'rymligast i rundan'", bool(m.search("Den rymligaste i rundan.")))
    # ☠️ Den som ÖGONEN hittade och grinden släppte igenom i första utkastet.
    prov("fäller 'smalaste i vårt sortiment'",
         bool(m.search("den smalaste öppningen i vårt sortiment av klöstunnor")))
    prov("fäller 'smalaste öppningen vi har'",
         bool(m.search("det är den smalaste öppningen vi har")))
    prov("fäller 'störst i katalogen'", bool(m.search("Störst i katalogen.")))
    prov("släpper vanligt 'högst'",
         not m.search("Tunnan är som högst 96 centimeter."))
    prov("släpper 'en smal öppning'", not m.search("Ø14 cm, alltså en smal öppning."))

    # Laster: fem har en, fem har ingen.
    prov("fem produkter har last", sum(1 for v in LASTER.values() if v) == 5)
    prov("fem saknar last", sum(1 for v in LASTER.values() if not v) == 5)

    # Färgsyskonen är ömsesidiga.
    for grupp in M.FARGSYSKON:
        for a in grupp:
            prov("%s känner sina syskons färger" % a,
                 len(SYSKONFARG[a]) == len(grupp) - 1)

    # ☠️ Syskonfärgsgrinden får INTE fälla den egna grundfärgen. Grupp C är
    #    tre tunnor som alla bär "ljusgrå"/"ljusbrun" och skiljs åt av
    #    kantfärgen; den gamla formen (syskonets FÖRSTA ord) gav falsklarm
    #    på två av tre korrekta sidor.
    _delade = set(re.findall(r"\w+", M.TUNNOR["bd0d7f9e"]["farg"].lower())) & \
              set(re.findall(r"\w+", M.TUNNOR["efa9c03e"]["farg"].lower()))
    prov("grupp C delar grundfärgsordet", "ljusgrå" in _delade)
    prov("bd0d7f9e får skriva sin egen grundfärg",
         not any("SYSKONETS FÄRGORD" in f for f in granska("bd0d7f9e")))
    prov("efa9c03e får skriva sin egen grundfärg",
         not any("SYSKONETS FÄRGORD" in f for f in granska("efa9c03e")))
    # ...men syskonets SÄRSKILJANDE ord ska fortfarande fällas.
    prov("mörkgrå är särskiljande för efa9c03e",
         "mörkgrå" in " ".join(SYSKONFARG["bd0d7f9e"]).lower())

    return fel, antal


if __name__ == "__main__":
    rfel, rantal = sjalvtest()
    print("grind.sjalvtest(): %d fall, %d fel" % (rantal, len(rfel)))
    for f in rfel:
        print("  ✗", f)
    gfel, gantal = G._sjalvtest()
    print("grindar._sjalvtest(): %d fall, %d fel" % (gantal, len(gfel)))
    for f in gfel:
        print("  ✗", f)
    print()
    total = len(rfel) + len(gfel)
    for pid in T.NAMN:
        f = granska(pid)
        total += len(f)
        print("%-10s %-58s %d fel" % (pid, T.SLUG[pid], len(f)))
        for x in f:
            print("     -", x)
    print()
    print("SUMMA: %d produkter, %d fel" % (len(T.NAMN), total))
    sys.exit(1 if total else 0)
