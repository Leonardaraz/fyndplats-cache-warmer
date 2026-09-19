# -*- coding: utf-8 -*-
"""Runda 130 — textgrinden, körd på FILEN före varje skrivning.

☠️ INGEN REGEL DEFINIERAS OM HÄR. `grindar.py` äger jargongen, homoglyferna,
   artikelnummerformen, aktörsorden, landorden, butikstvätten, negationen och
   SKU-regeln; `tvillingsvep()` i samma fil fäller om en runda skriver en egen
   kopia. Det som ÄR rundans eget står nedan och ingenting annat.

☠️ ORDLISTAN ÄR VALD FÖR DEN HÄR FAMILJEN, och en post som funkade i runda 129
   gör det inte här. `Sand` är leverantörens färgord för `ef0c374b` OCH ett
   vanligt svenskt ord — hade det stått i listan hade grinden fällt rundans
   enda korrekta färgbeskrivning. Samma sak med `Solar`, `Metall` och `Panel`.
   Kvar står tyska ord utan svensk tvilling, var och en med ordgräns i BÖRJAN
   så böjda former fastnar men `re·gelb·undet`-fällan undviks.

☠️ "VATTENTÄT" ÄR NEGATIONSGRINDAD HÄR, INTE BLANKT FÖRBJUDEN — och det är
   skillnaden mot runda 129. Den rundans texter UNDVEK ordet; den här rundans
   texter FÖRNEKAR det med flit, eftersom `5ffb91a2`:s tyska källa skriver
   `Wasserdicht gemäß IP44`. En blank spärr hade fällt exakt de meningar som
   gör sidorna ärliga — runda 53:s `härdat glas`-lärdom, ordagrant.
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

# ☠️ INGA ord som finns i svenskan: `Sand`, `Solar`, `Panel`, `Metall`,
#    `Lampe`, `Montage`. Varje post nedan saknar svensk tvilling.
TYSKA = ["Rattan", "Solarlampe", "Solarleuchte", "Stehlampe", "Stehleuchte",
         "Gartenleuchte", "Gartenlampe", "Außenlampe", "Aussenlampe",
         "Außenleuchte", "Aussenleuchte", "Lichtsensor", "Dämmerung",
         "Damm" + "erung", "Witterung", "Schutzart", "wetterfest",
         "wasserdicht", "Spritzwasser", "Beistelltisch", "Erdspieß",
         "Erdspiess", "Lieferumfang", "Technische", "Gesamtabmessung",
         "Abmessungen", "Ladezeit", "Leuchtdauer", "Batterietyp", "Farbe",
         "Kunststoff", "Geflecht", "Standfuß", "Stahlsockel", "Schwarz",
         "Gelb", "Grau", "Bedienungsanleitung", "Beschreibung", "Zertifi"]

# ☠️ NEGATIONSGRINDADE. `loftestraff` ursäktar en träff som förnekas i sin
#    EGNA mening — "den är inte vattentät" släpps, "den är vattentät" fälls.
NEGERBART = [
    (re.compile(r"vattent[äa]t\w*", re.I), "VATTENTÄT — IP44 är stänkskydd"),
    (re.compile(r"\bregnt[äa]t\w*", re.I), "REGNTÄT — samma fel som vattentät"),
    (re.compile(r"\bsidobord\w*|\bavlastningsbord\w*", re.I),
     "BORD — lyktorna har ingen angiven maxlast och locket är solcellen"),
]

# Blanka spärrar: ingen av rundans texter förnekar något av det här.
FORBJUDET = [
    (re.compile(r"t[åa]l\w*\s+(?:h[öo]gtryck|vattenstr[åa]l)", re.I),
     "LOVAR MER ÄN IP44"),
    (re.compile(r"\bCE-?m[äa]rkt\w*|\bCE-?certifi", re.I),
     "CERTIFIERINGSPÅSTÅENDE — CE står bara på fyra av sex i källan"),
    (re.compile(r"\b[äa]kta\s+rotting|\bnaturrotting|\bmassiv\w*\s+rotting", re.I),
     "NATURMATERIAL — flätningen är PE, alltså konstrotting"),
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
    # ☠️ `JAMFOR_OMATT` (runda 58): en jämförelse mot något vi inte mäter.
    (re.compile(r"samma\s+(?:ljus|styrka|volym|storlek)\s+som"
                r"|lika\s+(?:starkt?|ljus\w*|stor\w*)\s+som"
                r"|motsvarar\s+en\b", re.I),
     "JÄMFÖRELSE mot något som inte är mätt"),
]

# ☠️ KATEGORIKLYSCHAN. "Erhellen Sie Ihren Garten" är leverantörens egen
#    ingress på fyra av sex, och 15 lm bär den inte. Negerad träff ursäktas —
#    rundans texter säger med flit "lyser INTE upp gången omkring sig".
KLYSCHA = re.compile(r"lyser upp|belyser (?:hela|g[åa]rden|tomten)"
                     r"|ger ljus [åa]t hela|g[åa]ngbelysning", re.I)


def talen(pid):
    """Varje tal som spec-tabellen faktiskt bär, som strängar."""
    ut = set()
    for _, v in T.SPEC[pid]:
        ut |= set(re.findall(r"\d+(?:,\d+)?", v))
    return ut


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

    t = G.loftestraff(KLYSCHA, syn)
    if t:
        fel.append("KATEGORIKLYSCHA: %r" % G.mening_kring(syn, t.start())[:90])

    for ord_ in TYSKA:
        if re.search(r"\b" + re.escape(ord_), syn, re.I):
            fel.append("TYSKT ORD: %s" % ord_)

    # ☠️ AKTÖRSORD, LANDORD OCH LAGERFRASER LÄSES BARA I VÅR EGEN TEXT.
    #    Butikens EU-lager-rad är butikens (runda 58); i källäget ÄR hela
    #    html:en vår, i live-läget har `egna_meningar` redan strukit grannarna.
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

    # ☠️ SKU:n RÄKNAS ur husregeln, den skrivs inte av. TRE av utkasten delar
    #    `FP-solar-stehlampe-rattan` — krocken uppstår i den KAPADE strängen.
    vantat = "FP-" + G.sku_bas(T.SLUG[pid])
    if T.SKU[pid] != vantat:
        fel.append("SKU: filen säger %r, regeln ger %r" % (T.SKU[pid], vantat))

    # ☠️ HÄRIFRÅN OCH NED LÄSER GRINDEN KÄLLANS STRUKTUR. Live-läget stannar
    #    här och lägger i stället på `G.flikfel`, som läser `<summary>`.
    if live:
        return fel + ["FLIKFEL: %s" % p for p in G.flikfel(html)]

    for flik in G.FLIKAR_SOM_KRAVS:
        n = len(re.findall(r"<h2>" + re.escape(flik) + r"</h2>", html))
        if n != 1:
            fel.append("FLIKRUBRIK %r förekommer %d gånger" % (flik, n))
    if "Montering och skötsel" in html:
        fel.append("DÖD RUBRIK: 'Montering och skötsel' matchar ingen flik")

    # ☠️ ALLT SOM SKA LIGGA I BRÖDTEXTEN MÅSTE STÅ FÖRE FÖRSTA FLIKRUBRIKEN.
    forsta = html.index("<h2>Tekniska specifikationer</h2>")
    for rubrik in (T.RUBRIK[pid], T.SOL_RUBRIK[pid], T.VADER_RUBRIK[pid],
                   "Passar inte den här?"):
        if html.index("<h2>%s</h2>" % rubrik) > forsta:
            fel.append("BLOCKET %r ligger EFTER första flikrubriken" % rubrik)

    # Sifferstil: aldrig kommalista av tal med enheten sist.
    for t in re.finditer(r"\d+(?:,\d+)?, \d", syn):
        fel.append("KOMMALISTA av tal: %r" % G.mening_kring(syn, t.start())[:70])

    # ☠️ VARJE TAL I BRÖDTEXTEN MÅSTE FINNAS I SPEC-TABELLEN, och en mening
    #    med LÄNK prövas mot MÅLETS spec-tabell — en korslänk som anger
    #    grannens höjd fel är precis defekten i uppgift #480.
    JAMFOR = {"1", "2", "3", "4", "5", "6", "8", "25", "15", "0"}
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
            if syskon is not None:
                facit |= talen(syskon)
                continue
            if m in M.SYSKON_129.values():
                # Runda 129:s spec-tabeller bor i den rundans texter.py.
                facit |= _syskon129_tal(m)
                continue
            fel.append("KORSLÄNK till okänd slug %r" % m)
        _provala(mening, facit | JAMFOR, "korslänk")
    return fel


_R129 = {}


def _syskon129_tal(slug):
    """Talen i runda 129:s spec-tabell för en publicerad grannsida."""
    if not _R129:
        import importlib.util
        p = os.path.join(HAR, "..", "runda-129", "texter.py")
        spec = importlib.util.spec_from_file_location("t129", p)
        mod = importlib.util.module_from_spec(spec)
        sys.modules["t129"] = mod
        spec.loader.exec_module(mod)
        for pid, s in mod.SLUG.items():
            ut = set()
            for _, v in mod.SPEC[pid]:
                ut |= set(re.findall(r"\d+(?:,\d+)?", v))
            _R129[s] = ut
    return _R129.get(slug, set())


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
