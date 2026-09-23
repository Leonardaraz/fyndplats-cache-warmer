# -*- coding: utf-8 -*-
"""Runda 136 — textgrinden. Körs FÖRE varje skrivning till Wix.

☠️ SKRIV TEXTEN I EN FIL OCH GRINDA DEN — uppmätt 9 fel mot 0 (2026-09-04).

☠️ TRE NYA GRINDAR I DEN HÄR RUNDAN, alla åt samma håll: en TOM ruta i facit
   får inte fyllas av texten.

   1. `maxlast is None` → ingen bärförmåga får påstås. Fanns i runda 135.
   2. `kattvikt is None` → ingen kattvikt får påstås. NY — `4a5acc7d` anger
      ingen alls, och runda 135:s grind kontrollerade bara den POSITIVA
      riktningen (att ett tal som finns också står i texten).
   3. `antal_katter is None` → inget kattantal får påstås. NY — `860b6eb9`
      marknadsförs för tre katter utan att någon totallast anges, och
      `ae1c848f` och `f8528666` anger inget antal alls.

   Grind 3 fångade ett verkligt fel i den här rundans egen första text:
   "två katter kan använda tunnan samtidigt" på `860b6eb9`. Det är samma
   obelagda påstående som prosans "tre katter", bara i mindre format.

☠️ TYPORDET ÄR EN LISTA, inte ett ord. Rundan bär TRE olika produkttyper —
   klöstunna, klöstorn och klösträd — och leverantörens namn kallar de två
   första för samma sak ("Katzenturm"). Facit bär därför (rätt, [förbjudna])
   och alla förbjudna prövas (#462).
"""
import re
import sys
import os

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HAR, ".."))
sys.path.insert(0, HAR)
import grindar as G                                              # noqa: E402
import texter as T                                               # noqa: E402
import matt as M                                                 # noqa: E402


def _vikt(ord_):
    """Huvudordet som regex där varje ä/å/ö också matchar sin ASCII-form."""
    par = {"ä": "[äa]", "å": "[åa]", "ö": "[öo]"}
    return re.compile("".join(par.get(t, re.escape(t)) for t in ord_), re.I)


FORBJUDET = [
    (re.compile(r"\bCE-?m[äa]rkt\w*|\bCE-?certifi|\btestad\s+enligt"
                r"|\bEN\s*71\b|\bklass\s*E1\b", re.I),
     "CERTIFIERINGSPÅSTÅENDE — ingen källa anger någon norm vi kan kontrollera"),
    (re.compile(r"\bmassivt?\s+tr[äa]\b|\b[äa]kta\s+tr[äa]\b", re.I),
     "MASSIVT TRÄ som helhetsutsaga — stommen är spånskiva"),
    # ☠️ TIPPSKYDDET. Två av de åtta lovar en rem respektive ett "inbyggt"
    #    tippskydd i PROSAN, men ingen leveranslista nämner något sådant.
    #    Lieferumfang är kontraktet (#468, #423).
    (re.compile(r"\btippskydd\w*|\bv[äa]ggrem\w*|\btakspänn\w*|\bv[äa]ltar\s+inte"
                r"|\bkan\s+inte\s+v[äa]lta|\bf[äa]st\w*\s+i\s+v[äa]ggen", re.I),
     "TIPPSKYDD — ingen av de åtta levereras med rem eller spänne"),
    (re.compile(r"\bv[äa]ger\s+\d|\begenvikt\w*|\bvikt:\s*\d", re.I),
     "VARUVIKT — okänd för alla åtta, spec-blockets tal är fraktvikten"),
    # ⚠️ `ae1c848f`:s materialrad säger "30 % Nitril" — ett gummi, ingen
    #    textilfiber, och nästan säkert en felöversatt akrylfiber.
    (re.compile(r"\bnitril\w*|\bkaschmir\w*|\bkashmir\w*|\bkashmere\b", re.I),
     "OBELAGD FIBER — källans materialrad går inte att lita på här"),
    # ⚠️ `7f8e495b`:s `Schilfrohr` är VASS, inte kaveldun och inte rotting.
    (re.compile(r"\bkaveldun\w*|\brotting\w*|\bbambu\w*", re.I),
     "FEL NATURMATERIAL — källan säger vass (Schilfrohr)"),
    (G.JARGONG, "INTERN JARGONG i kundtext"),
    (re.compile(r"\brundans?\b|\bbatchen\b|\butkast\w*\b", re.I),
     "INTERN JARGONG — ord ur arbetsprocessen"),
    (re.compile(r"\bmarknadens\b|\bbranschens\b|\bstarkast\w*\b", re.I),
     "SUPERLATIV utan mätvärde"),
    # ☠️ `vi har` SAKNADES I LISTAN, och Steg 12 fick fånga det med ögon:
    #    "det här den smalaste höga modellen vi har" passerade varenda
    #    mekanisk grind. Ett superlativ mot hela katalogen är lika ogrundat
    #    vare sig det står "vi säljer" eller "vi har".
    (re.compile(r"\b(?:h[öo]gst|l[äa]gst|mest|st[öo]rst|minst|tyngst|"
                r"l[äa]ttast|rymligast|smalast|bredast|djupast)\w*\b"
                r"[^.]{0,45}\b(?:vi\s+(?:s[äa]ljer|har|f[öo]r)|i\s+(?:v[åa]rt\s+)?"
                r"sortiment\w*|hos\s+oss|i\s+butiken|i\s+familjen"
                r"|av\s+v[åa]ra)", re.I),
     "SORTIMENTSSUPERLATIV — ogrundad jämförelse mot hela butiken"),
    # ☠️ GENUSFEL PÅ NEUTRUM. Steg 12 hittade TVÅ i den här rundan — "en smal
    #    fotavtryck" och "en smal fogmunstycke" — och batchen bar samtidigt
    #    den rätta formen ("ett smalt fogmunstycke") på en annan produkt.
    #    Att båda formerna fanns samtidigt är beviset att det är slarv och
    #    inte stil. Listan är rundans EGNA neutrumord, inte en allmän ordlista.
    (re.compile(r"\ben\s+(?:\w+[^t\s]\s+)?(?:fotavtryck|munstycke|fogmunstycke"
                r"|m[öo]belmunstycke|borstmunstycke|utrymme|element|material"
                r"|naturmaterial|sn[öo]re|h[åa]l|golv|rum|tecken|l[äa]ge"
                r"|st[äa]lle|m[åa]tt|plan|tak|hus)\b", re.I),
     "GENUSFEL — ordet är neutrum och tar `ett`, inte `en`"),
    # ☠️ `Tunnen` är varken bestämd form av `tunna` (tunnan) eller av
    #    `tunnel` (tunneln). Steg 12 hittade den i en ingress där samma
    #    produkt skrev `Tunneln` rätt tre gånger längre ned.
    (re.compile(r"\btunnen\b", re.I),
     "FELSTAVNING — bestämd form är `tunnan` eller `tunneln`"),
    (re.compile(r"\bleverant[öo]ren\s+(?:anger|uppger|s[äa]ger)", re.I),
     "MOT KUNDEN ÄR VI LEVERANTÖREN"),
    (re.compile(r"PawHut|HOMCOM|Outsunny|Aiyaplay|Aosom|AliExpress", re.I),
     "LEVERANTÖRS- ELLER HUSMÄRKE"),
    (re.compile(r"\bskickas\s+fr[åa]n\b|\bfr[åa]n\s+(?:Tyskland|Kina|Polen)\b"
                r"|\bTyskland\b|\btyska\b", re.I),
     "AVSÄNDARLAND"),
    (re.compile(r"Kratz|Katzen|H[öo]hle\b|Liegefl|Sisalmatte|Spanplatte"
                r"|Pl[üu]sch\b|Wei[ßs]\b|Hellbraun|Hellgrau|Schilfrohr"
                r"|Gesamtabmessung|Lieferumfang|Belastung|Rasse\b|Gewicht\b",
                re.I),
     "TYSKT ORD kvar i texten"),
]

# ☠️ REGLER OM SVENSKAN GÄLLER ÄVEN KORSLÄNKARNAS ANKARTEXT — den är en
#    sträng VI skriver, om än om en annan produkt (runda 135:s `giraffform`).
SVENSKAN = [
    (G.TREKONSONANT, "TRE LIKA KONSONANTER — svenskan förenklar till två"),
]

# ☠️ REGLER SOM BARA GÄLLER VÅR KÄLLTEXT, aldrig en renderad sida. Butiken
#    skriver SJÄLV ut priset på varje publicerad produktsida.
ENDAST_KALLTEXT = [
    (re.compile(r"\b\d+\s*(?:kr|SEK|:-)\b|\bpris(?:et|er)?\s+[äa]r\b", re.I),
     "PRIS i kundtext"),
]

TAL = re.compile(r"(?<![\w,.])(\d+(?:[,.]\d+)?)(?![\w])")
TAL_UNDANTAG = {1, 2, 3, 4}

# ☠️ KAPACITETSPÅSTÅENDET — "passar N katter", inte varje mening där ordet
#    katt och en siffra råkar mötas. Den smala formen är med flit: `63a586da`
#    skriver "Har du två katter är ett klösträd med flera plan ett bättre
#    val", vilket är en HÄNVISNING och inte en utsaga om den här varan. En
#    bred grind hade fällt den, och en grind som fäller korrekt text lär
#    mottagaren att sluta läsa.
KAPACITET = re.compile(
    r"\b(?:passar|rymmer|byggd\s+f[öo]r|plats\s+f[öo]r|f[öo]r)\s+"
    r"(?:upp\s+till\s+)?(\d+(?:\s*[–-]\s*\d+)?|en|ett|tv[åa]|tre|fyra|flera)"
    r"\s+katt(?:er|en|erna)?\b(?!\s+(?:som|med|vars|vid|i\b|p[åa]\b))", re.I)

KATTVIKT = re.compile(r"katt\w*[^.]{0,60}\d+\s*kg|\d+\s*kg[^.]{0,40}katt", re.I)


def falt(pid):
    """Varje kundsynligt fält, namngivet — talgrinden gäller alla."""
    return [
        ("namn", T.NAMN[pid]),
        ("titel", T.TITEL[pid]),
        ("meta", T.META[pid]),
        ("slug", T.SLUG[pid].replace("-", " ")),
        ("brödtext", G.synlig_meningstext(T.bygg(pid))),
    ]


def utan_korslankar(html, pid):
    """Texten MINUS korslänksblocket — grannarnas namn är inte våra påståenden."""
    return re.split(r"<h2>\s*Passar inte den h[äa]r\?\s*</h2>", html)[0] + \
        html.split("<h2>Tekniska specifikationer</h2>", 1)[-1]


def granska(pid, html=None, live=False):
    """Returnerar en lista fel. Tom lista = grön."""
    f = M.FACIT[pid]
    huvudord, forbjudna_ord = M.TYP[pid]
    html = html if html is not None else T.bygg(pid)
    if live:
        # ☠️ LIVE-LÄGET FÅR INTE LÄSA HELA SIDAN — runda 134 mätte 3 942
        #    "fel" på sex KORREKTA sidor när underlaget var den tvättade men
        #    OTOLKADE HTML:en. Rätt underlag är sidans EGNA meningar plus
        #    rundans egna fält.
        egna, _ = G.egna_meningar(html, T.SLUG[pid], T.NAMN[pid])
        syn = G.synlig_meningstext(
            "<p>%s</p><p>%s</p><p>%s</p><p>%s</p><p>%s</p>"
            % (egna, T.NAMN[pid], T.TITEL[pid], T.META[pid], T.SOKORD[pid]))
        eget = syn
    else:
        syn = G.synlig_meningstext(html)
        eget = G.synlig_meningstext(utan_korslankar(html, pid))
    fel = []

    for namn, text in falt(pid):
        if live and namn != "brödtext":
            continue
        provtext = eget if namn == "brödtext" else text
        listor = FORBJUDET if live else FORBJUDET + ENDAST_KALLTEXT
        for monster, skal in listor:
            for m in monster.finditer(provtext):
                fel.append("%s: %s — %r"
                           % (namn, skal, G.mening_kring(provtext, m.start())[:110]))
        # Språkreglerna läser HELA texten, alltså även korslänkarna.
        heltext = syn if namn == "brödtext" else text
        for monster, skal in SVENSKAN:
            for m in monster.finditer(heltext):
                fel.append("%s: %s — %r"
                           % (namn, skal, G.mening_kring(heltext, m.start())[:110]))
        for h in G.homoglyfer(text):
            fel.append("%s: HOMOGLYF %r" % (namn, h))
        if not live:
            for ord_, sammanhang in G.versalfel(text):
                fel.append("%s: VERSAL MITT I ORD %r — %r"
                           % (namn, ord_, sammanhang))
        for m in G.ARTNR.finditer(text):
            fel.append("%s: ARTIKELNUMMER %r" % (namn, m.group(0)))

    for namn, text in falt(pid)[:4]:
        if live:
            break
        if not _vikt(huvudord).search(text):
            fel.append("%s: saknar huvudordet %r" % (namn, huvudord))
        for forbjudet in forbjudna_ord:
            if _vikt(forbjudet).search(text):
                fel.append("%s: FÖRBJUDET TYPORD %r — varan är en %s"
                           % (namn, forbjudet, huvudord))

    # ☠️ LIVE-LÄGET SLUTAR HÄR. Allt nedanför prövar RUNDANS KÄLLTEXT mot
    #    facit, och på en LIVE-sida finns butikens egna tal: priset,
    #    telefonnumret, Google-betyget, bloggänkens årtal.
    if live:
        return fel + ["FLIKFEL: %s" % p for p in G.flikfel(html)]

    for namn, text in falt(pid):
        provtext = eget if namn == "brödtext" else text
        for m in TAL.finditer(provtext):
            v = float(m.group(1).replace(",", "."))
            if v in TAL_UNDANTAG or v in f["tal"] or int(v) in f["tal"]:
                continue
            fel.append("%s: OHÄRLETT TAL %s — %r"
                       % (namn, m.group(1), G.mening_kring(provtext, m.start())[:100]))

    # ☠️ MAXLAST ÄR BARA `Maximale Belastung`. `Maximales Katzengewicht` och
    #    `Empfohlenes Haustiergewicht` är KATTENS vikt — ett annat påstående.
    harm = re.search(r"\b(?:b[äa]r|t[åa]l|maxlast)\w*\b[^.]{0,20}?(\d+)\s*kg",
                     eget, re.I)
    if harm and f["maxlast"] is None:
        fel.append("MAXLAST påstådd men källan har ingen: %r" % harm.group(0))
    if f["maxlast"] is not None:
        if not harm:
            fel.append("MAXLAST %s kg finns i källan men står inte i texten"
                       % f["maxlast"])
        elif int(harm.group(1)) != f["maxlast"]:
            fel.append("MAXLAST i texten är %s kg, facit säger %s"
                       % (harm.group(1), f["maxlast"]))

    # ☠️ KATTVIKTEN, BÅDA RIKTNINGARNA. Runda 135 krävde bara att ett tal som
    #    FINNS också står i texten. `4a5acc7d` har inget alls, och då är den
    #    farliga riktningen den motsatta.
    har_kattvikt = KATTVIKT.search(eget)
    if f["kattvikt"] and not har_kattvikt:
        fel.append("KATTVIKT %r finns i källan men står inte i texten"
                   % f["kattvikt"])
    if not f["kattvikt"] and har_kattvikt:
        fel.append("KATTVIKT påstådd men källan har ingen: %r"
                   % har_kattvikt.group(0)[:70])

    # ☠️ KATTANTALET. Se KAPACITET ovan för varför mönstret är smalt.
    antal = KAPACITET.search(eget)
    if f["antal_katter"] is None and antal:
        fel.append("KATTANTAL påstått men källan belägger inget: %r"
                   % antal.group(0))
    if f["antal_katter"] is not None and not antal:
        fel.append("KATTANTAL %r finns i källan men står inte i texten"
                   % f["antal_katter"])

    rubriker = re.findall(r"<h2>([^<]+)</h2>", html)
    for kravd in G.FLIKAR_SOM_KRAVS:
        if rubriker.count(kravd) != 1:
            fel.append("RUBRIK %r förekommer %d gånger, ska vara 1"
                       % (kravd, rubriker.count(kravd)))
    if "Passar inte den här?" in rubriker and \
            rubriker.index("Passar inte den här?") > \
            rubriker.index("Tekniska specifikationer"):
        fel.append("KORSLÄNKSBLOCKET ligger EFTER spec-fliken — "
                   "det hamnar då inne i den fliken")

    # ☠️ KORSLÄNKEN MÅSTE VARA ABSOLUT. En href som börjar på "/produkt/"
    #    skrivs om av Wix till "https:/produkt/…" — ETT snedstreck, alltså
    #    värden "produkt", alltså död länk.
    for m in G.ANKARE.finditer(html):
        if not m.group(1).startswith("https://www.fyndplats.se/"):
            fel.append("RELATIV LÄNK %r — Wix gör den till https:/…"
                       % m.group(1))

    for x in G.granska_namn(T.NAMN[pid]):
        fel.append("NAMN: %s" % x)

    # ☠️ SKU:N MÅSTE VARA HEL. `sku_bas` kapar vid 24 tecken på hel ordgräns,
    #    och ett tappat token är osynligt i sluggen (#473, #483, #489).
    hel = "-".join(d for d in T.SLUG[pid].split("-") if d not in G.FOGEORD)
    if G.sku_bas(T.SLUG[pid]) != hel:
        fel.append("SKU KAPAD: %r av sluggen %r"
                   % (T.SKU[pid], T.SLUG[pid]))

    return fel


def sjalvtest():
    """Returnerar (fel-lista, antal fall). ☠️ KONTRAKTET ÄR EN TVÅTUPEL."""
    fel, fall = [], 0

    def pa(text, vantat, vad):
        nonlocal fall
        fall += 1
        traff = any(m.search(text) for m, _ in FORBJUDET + SVENSKAN)
        if traff != vantat:
            fel.append("%s: väntat %s, fick %s (%r)" % (vad, vantat, traff, text))

    pa("Ett klöstorn i massivt trä", True, "massivt trä fälls")
    pa("Stammarna är lindade i jute", False, "jute är OK")
    pa("Levereras med tippskydd mot väggen", True, "tippskydd fälls")
    pa("Ställ den mot en vägg", False, "väggplacering är OK")
    pa("Någon väggrem följer inte med", True, "ordet väggrem fälls oavsett riktning")
    pa("Kojan är flätad av vass", False, "vass är rätt material")
    pa("Kojan är flätad av kaveldun", True, "kaveldun fälls")
    pa("Kojan är flätad av rotting", True, "rotting fälls")
    pa("Klädd i kaschmirimitation", True, "obelagd fiber fälls")
    pa("70 % polyester och 30 % nitril", True, "nitril fälls")
    pa("En hoppplattform i sisal", True, "tre konsonanter fälls")
    pa("En hopplattform i sisal", False, "rättad form är grön")
    pa("Se www.fyndplats.se", False, "www är ingen sammansättning")
    pa("Klädd i Plüsch", True, "tyskt ord fälls")
    pa("Klädd i plysch", False, "svenska ordet är grönt")
    pa("Rasse — American Shorthair", True, "bildrutans tyska fälls")
    pa("Testad enligt EN 71", True, "certifieringspåstående fälls")
    pa("Varan väger 9 kg", True, "varuvikt fälls")

    # ── Kapacitetsgrinden: smal med flit ──────────────────────────────────
    fall += 1
    if not KAPACITET.search("Passar 1–3 katter under 5 kg"):
        fel.append("KAPACITET missar ett intervall")
    fall += 1
    if not KAPACITET.search("Byggd för en katt"):
        fel.append("KAPACITET missar 'byggd för en katt'")
    fall += 1
    if KAPACITET.search("Har du två katter är ett klösträd med flera plan bättre"):
        fel.append("KAPACITET fäller en HÄNVISNING, inte ett påstående")
    fall += 1
    if KAPACITET.search("Passar katter upp till 6 kg"):
        fel.append("KAPACITET fäller en kattVIKT som inte är ett antal")
    # ☠️ UPPMÄTT FALSKLARM I DEN HÄR RUNDAN. `f8528666` skriver "lätt att
    #    acceptera för en katt som är försiktig med slutna utrymmen" — ett
    #    obestämt "en katt" som beskriver VILKEN SORTS katt, inte hur många.
    #    Grinden fällde den, och en grind som fäller korrekt text lär
    #    mottagaren att sluta läsa. Utesluts på relativsatsen efter ordet.
    fall += 1
    if KAPACITET.search("lätt att acceptera för en katt som är försiktig"):
        fel.append("KAPACITET fäller en BESKRIVNING av vilken katt")
    fall += 1
    if not KAPACITET.search("Det finns plats för tre katter."):
        fel.append("KAPACITET missar ett äkta antal efter inskränkningen")

    # ── Talgrinden mot facit ──────────────────────────────────────────────
    fall += 1
    if any("OHÄRLETT" in x for x in granska("4a5acc7d")):
        fel.append("talgrinden fäller en korrekt text")

    # ── De tre tomma rutorna: varje påstående som inte har källa ska fällas ─
    fall += 1
    if not any("MAXLAST påstådd" in x for x in
               granska("4a5acc7d",
                       html=T.bygg("4a5acc7d") + "<p>Den bär 40 kg.</p>")):
        fel.append("maxlastgrinden fångar inte ett påhittat tal")
    fall += 1
    if not any("KATTVIKT påstådd" in x for x in
               granska("4a5acc7d",
                       html=T.bygg("4a5acc7d")
                       + "<p>Passar katter upp till 7 kg.</p>")):
        fel.append("kattviktsgrinden fångar inte en påhittad kattvikt")
    fall += 1
    if not any("KATTANTAL påstått" in x for x in
               granska("860b6eb9",
                       html=T.bygg("860b6eb9")
                       + "<p>Det finns plats för tre katter.</p>")):
        fel.append("kattantalsgrinden fångar inte ett påhittat antal")

    # ── Typordet är en LISTA ──────────────────────────────────────────────
    fall += 1
    if not any("FÖRBJUDET TYPORD" in x for x in granska(
            "860b6eb9", html=T.bygg("860b6eb9"))) is False:
        pass
    fall += 1
    spar = T.NAMN["860b6eb9"]
    try:
        T.NAMN["860b6eb9"] = "Klösträd 101 cm med tre hålor"
        traffar = [x for x in granska("860b6eb9") if "FÖRBJUDET TYPORD" in x]
        if not traffar:
            fel.append("typgrinden ser inte 'klösträd' på en klöstunna")
    finally:
        T.NAMN["860b6eb9"] = spar

    fall += 1
    spar = T.NAMN["4a5acc7d"]
    try:
        T.NAMN["4a5acc7d"] = "Klösträd 100 cm med tre hålor"
        traffar = [x for x in granska("4a5acc7d") if "FÖRBJUDET TYPORD" in x]
        if not traffar:
            fel.append("typgrinden ser inte 'klösträd' på ett klöstorn")
    finally:
        T.NAMN["4a5acc7d"] = spar

    # ── Den relativa länken ───────────────────────────────────────────────
    fall += 1
    if not any("RELATIV LÄNK" in x for x in granska(
            "4a5acc7d",
            html=T.bygg("4a5acc7d") + '<p><a href="/produkt/x">x</a></p>')):
        fel.append("länkgrinden ser inte en rotrelativ href")

    # ── SKU-kapningen ─────────────────────────────────────────────────────
    fall += 1
    spar = T.SLUG["4a5acc7d"]
    try:
        T.SLUG["4a5acc7d"] = "klostorn-100-cm-tre-halor"
        if not any("SKU KAPAD" in x for x in granska("4a5acc7d")):
            fel.append("SKU-grinden ser inte en kapad slug")
    finally:
        T.SLUG["4a5acc7d"] = spar

    return fel, fall


def kor(pids=None):
    pids = pids or list(T.NAMN)
    tot = 0
    for pid in pids:
        f = granska(pid)
        tot += len(f)
        print("%-9s %s" % (pid, "OK" if not f else "%d FEL" % len(f)))
        for x in f:
            print("     ☠️", x)
    print("\n%d produkter, %d fel" % (len(pids), tot))
    return tot


if __name__ == "__main__":
    sfel, santal = sjalvtest()
    print("grind.sjalvtest(): %d fall, %d fel" % (santal, len(sfel)))
    for x in sfel:
        print("   ☠️", x)
    sys.exit(1 if kor() or sfel else 0)
