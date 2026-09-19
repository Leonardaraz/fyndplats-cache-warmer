# -*- coding: utf-8 -*-
"""Runda 89 — lint. Rundans egna grindar plus husets delade.

☠️ ORDLISTAN SJÄLVTESTAS MOT VÅR EGEN TEXT INNAN NÅGON GRIND KÖRS. En grind
   som fäller korrekt svenska lär mottagaren att ignorera den.

☠️ `\\b` FÅR INTE ANVÄNDAS I EN GRIND SOM OCKSÅ KÖRS I JAVASCRIPT. Runda 88
   mätte upp att JS:s `\\b` är ASCII-only, så `\\bder\\b` matchar inne i
   "väder". GRANS nedan är en explicit klass och beter sig likadant i båda.
"""
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)
import texter                                                        # noqa: E402
from grindar import (TYSKA, HUSMARKEN, LANDORD, LAGERFRAS, ATTRIBUTION, ARTNR,
                     ANKARE, NEKORD, strip_taggar, synlig_meningstext,
                     meningar, dela_pa_ankare)                       # noqa: E402

# ── Rundans fakta, en gång, per produkt ───────────────────────────────────
MODELL = {"c4375606": "A2", "79186373": "A2",
          "479e9c2e": "D", "d9239c8e": "D",
          "4fd26086": "F", "89deaca7": "F"}

# ☠️ Alla tre klarar 100 kg. Runda 88:s modeller klarar 50. Att låna DIT
#    hade halverat bärigheten i texten; att låna HIT hade fördubblat den.
MAXLAST = {"A2": 100, "D": 100, "F": 100}

# ☠️ Styrhöjden är rundans egentliga åldersuppgift. A2:s LÄGSTA läge (92 cm)
#    är högre än D:s HÖGSTA (80 cm), och båda anges "från 5 år".
STYRE = {"A2": "92–100", "D": "75–80", "F": "88–94"}
LANGD = {"A2": "143", "D": "120", "F": "135"}

# ☠️ Tal som FÅR stå per modell. Allt annat är påhittat.
TAL_OK = {
    "A2": {"143 cm", "58 cm", "56 cm", "36 cm", "12 cm", "11 cm", "100 kg",
           "92 cm", "100 cm", "16 tum", "10,6 kg", "99 cm", "17 cm", "52 cm",
           "5", "139 cm"},
    "D": {"120 cm", "58 cm", "75 cm", "80 cm", "100 kg", "8,2 kg", "12 tum",
          "30 cm", "5", "7", "88 cm", "94 cm"},
    "F": {"135 cm", "58 cm", "88 cm", "94 cm", "100 kg", "9,5 kg", "41 cm",
          "30 cm", "5", "16 tum", "12 tum"},
}

GRANS = r"[\wåäöÅÄÖ]"          # aldrig \b — Python och JS är oense

TYSKA_BANK = ["tretroller", "kickroller", "kickscooter", "cityroller",
              "kinderroller", "kinderscooter", "lenker", "bremse", "reifen",
              "trittbrett", "belastbar", "höhenverstellbar", "hinterrad",
              "fußstütze", "ständer", "gestell", "korb", "becherhalter",
              "schutzblech", "gummireifen", "fahrspaß", "geschwister",
              "luftbereifung", "pulverbeschichtung", "fußballdesign",
              "vorderrad", "bremssystem", "rostbeständig"]

# ☠️ RUNDANS SIGNATURGRIND: fotbollsmönstret finns inte i någon bild.
FOTBOLL_RE = re.compile(r"fotboll|f[uo]tball|bollm[öo]nster", re.I)

# ☠️ Alla sex har LUFTDÄCK. Runda 88:s hade massiva EVA-hjul, och dess
#    skötselråd ("ingenting att pumpa") är rakt fel här.
# ☠️ Delad i TVÅ, och det är inte en förfining — det är skillnaden mellan en
#    grind som biter och en som fäller korrekt text.
#
#    HÅRD: påståenden som bara kan handla om DEN HÄR produkten. Kopieras
#    runda 88:s skötselråd hit fyrar de, och de har ingen ursäkt.
MASSIV_HARD_RE = re.compile(r"punkteringsfri|EVA[- ]|slangl[öo]s|"
                            r"ing(?:enting|et) att pumpa|"
                            r"beh[öo]ver aldrig pumpas|utan innerslang", re.I)

#    KONTRAST: ordet "massiv" om ett hjul är TILLÅTET — men bara i en mening
#    som ställer det MOT vårt luftdäck ("uppblåsbara gummidäck, inte massiva
#    plasthjul"). Utan kontrastmarkör är samma ord ett påstående om varan.
MASSIV_KONTRAST_RE = re.compile(r"massiv[ta]?\s+(?:skum|hjul|d[äa]ck|plasthjul)", re.I)
#    ⚠️ Markören måste stå PRECIS FÖRE ordet, inte bara någonstans i
#       meningen. "där" och "som ett" är för vanliga för att frikänna en hel
#       mening; en grind som gör det slutar vara en grind.
KONTRASTORD = re.compile(r"(?:\binte\b|till skillnad|\bmedan\b|\bd[äa]r\b|"
                         r"\bsom ett\b|\bsom en\b|\b[äa]n ett\b|\b[äa]n en\b|"
                         r"\bmot ett\b|\bmot en\b|\bsnarare\b)[^.]{0,20}$", re.I)
KONTRASTFONSTER = 44

ELSPARK_RE = re.compile(r"elsparkcykel|elscooter|eldriven|motor|batteri|"
                        r"km/h|hastighet", re.I)
STANDARD_RE = re.compile(r"\bEN\s*\d{2,5}|certifierad|certifiering|CE-m[äa]rkt|"
                         r"typgodk[äa]nd|godk[äa]nd enligt|testad enligt|"
                         r"uppfyller\s+(?:standard|kraven)", re.I)
HJALM_LAG_RE = re.compile(r"hj[äa]lm[^.]{0,80}(lagkrav|enligt lag|lagstadgad|"
                          r"p[åa]bjuden|m[åa]ste)|"
                          r"(lagkrav|enligt lag|lagstadgad)[^.]{0,80}hj[äa]lm", re.I)

# ☠️ Alla tre har broms på BÅDA hjulen. En text som säger "bara bakbroms"
#    eller "en broms" beskriver runda 88:s modeller, inte den här rundans.
EN_BROMS_RE = re.compile(r"bara\s+bakbroms|endast\s+bakbroms|en\s+enda\s+broms|"
                         r"broms\s+bara\s+p[åa]\s+bakhjulet|"
                         r"handbroms\s+p[åa]\s+bakhjulet", re.I)

JARGONG_RE = re.compile(r"\brundans?\b|\bi rundan\b|\bbatch(?:en)?\b|"
                        r"\bpublicerad\w*\b|\butkast\w*\b", re.I)

# Färgen i texten måste stå i spec-radens färgangivelse.
# ☠️ RUNDANS TREDJE SIGNATURGRIND, mätt i Steg 4 2026-09-07. Texten påstod
#    "röd fälg" om `479e9c2e` — och en förstoring av framhjulet visar en
#    SILVERFÄRGAD ekerfälg. Bara GAFFELN är röd. Alla sex har silverfälg,
#    alltså är varje färgord före "fälg" ett omätt påstående. Grinden är
#    tight just därför: "ekerfälg" innehåller inget färgord och passerar.
FALG_FARG_RE = re.compile(
    r"(?:r[öo]d|bl[åa]|gr[öo]n|rosa|orange|turkos|svart|vit|lila|gul)\w*\s+"
    r"f[äa]lg", re.I)

FARG_ORD = ["svart", "rosa", "turkos", "orange", "röd", "vit", "blå", "grön"]

TAL_RE = re.compile(r"(\d+(?:,\d+)?)\s*(cm|kg|tum)\b")
KEDJA_RE = re.compile(r"\d+(?:,\d+)?(?:\s*[×x–-]\s*\d+(?:,\d+)?)+\s*(cm|kg|tum)\b")


def synlig(h):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", h)).strip()


def _ordgrans(ord_):
    return r"(?<!%s)%s(?!%s)" % (GRANS, re.escape(ord_), GRANS)


# ── SJÄLVTEST: ordlistan mot VÅR EGEN text, före allt annat ───────────────
_egen = " ".join(synlig(texter.bygg(_p)) for _p in texter.PRODUKTER)
_traff = sorted({_o for _o in TYSKA + TYSKA_BANK + HUSMARKEN + ATTRIBUTION
                 if re.search(_ordgrans(_o), _egen, re.I)})
if _traff:
    raise SystemExit("ORDLISTAN TRÄFFAR VÅR EGEN TEXT: %s — en grind som "
                     "fäller korrekt svenska lär mottagaren att sluta läsa"
                     % ", ".join(_traff))

_TYSK_PROV = [
    "Ein Tretroller für die ganze Familie mit Luftbereifung und V-Bremsen.",
    "Kugelgelagerter, höhenverstellbarer Lenker von 92 auf max. 100 cm.",
    "Langlebige aufblasbare Gummiräder im Fußballdesign, drinnen und draußen.",
    "Stahlrahmen mit rostbeständiger Pulverbeschichtung für den Langzeiteinsatz.",
    "Duales Bremssystem für Vorderrad und Hinterrad, rutschfestes Trittbrett.",
]
_slapper = [t for t in _TYSK_PROV
            if not any(re.search(_ordgrans(o), t, re.I)
                       for o in TYSKA + TYSKA_BANK)]
if _slapper:
    raise SystemExit("ORDLISTAN SLÄPPER TYSK TEXT: %s" % _slapper)


# ── Grindarna ─────────────────────────────────────────────────────────────
fel = []
sedda_slug, sedda_sku, sedda_namn = {}, {}, {}

# Sluggens SÄRSKILJANDE del räknas fram ur syskonen, den antas inte ligga
# sist — runda 88 mätte upp att den antagandet gick sönder på modell I.
_TOKENS = {p["kort"]: set(p["slug"].split("-")) for p in texter.PRODUKTER}
SARSKILJANDE = {}
for _p in texter.PRODUKTER:
    _syskon = [q["kort"] for q in texter.PRODUKTER
               if MODELL[q["kort"]] == MODELL[_p["kort"]] and q["kort"] != _p["kort"]]
    _delade = set.intersection(*[_TOKENS[x] for x in _syskon]) if _syskon else set()
    SARSKILJANDE[_p["kort"]] = _TOKENS[_p["kort"]] - _delade


def _spannformer(spann):
    """Ett styrhöjdsspann skrivs i TVÅ former i texten, och grinden måste se
    båda. Spec-raden säger "75–80 cm", punktlistan "75 till 80 cm över
    marken". Mutationstestet fångade luckan: ett lånat spann i den utskrivna
    formen slapp förbi styrgrinden och fälldes bara av talgrinden — alltså
    på fel regel, med ett felmeddelande som pekade åt fel håll."""
    lo, hi = spann.split("–")
    return [spann, "%s till %s" % (lo, hi)]


def _vansterord(ord_):
    """Ordgräns bara till VÄNSTER — böjningen får hänga kvar till höger.

    "röd" ska träffa "röda" och "svart" ska träffa "svarta", men inget av
    dem får träffa inne i ett annat ord."""
    return r"(?<!%s)%s" % (GRANS, re.escape(ord_))


for p in texter.PRODUKTER:
    k = p["kort"]
    m = MODELL[k]
    h = texter.bygg(p)
    s = synlig(h)
    # Text UTANFÖR ankartexter. Ett syskons tal eller färg i en länk är
    # inte ett påstående om DEN HÄR produkten.
    egna, _lankade = dela_pa_ankare(h)
    su = synlig(" ".join(egna))

    def f(txt):
        fel.append("%s (%s): %s" % (k, m, txt))

    # 1. Unika identiteter
    for falt, karta in (("slug", sedda_slug), ("sku", sedda_sku),
                        ("name", sedda_namn)):
        if p[falt] in karta:
            f("%s krockar med %s" % (falt, karta[p[falt]]))
        karta[p[falt]] = k

    # 2. SKU ska bära sluggens särskiljande del
    sar = SARSKILJANDE[k]

    def _bar(t, u):
        return len(t) >= 3 and len(u) >= 3 and (t.startswith(u) or u.startswith(t))
    if sar and not any(_bar(t, u) for t in sar for u in p["sku"].split("-")):
        f("SKU %r bär ingen av sluggens särskiljande delar %r"
          % (p["sku"], sorted(sar)))

    # 3. Tyska ord, husmärken, landord, attribution, artikelnummer
    for o in TYSKA + TYSKA_BANK + HUSMARKEN + LANDORD + ATTRIBUTION:
        if re.search(_ordgrans(o), s, re.I):
            f("förbjudet ord: %r" % o)
    for fr in LAGERFRAS:
        if re.search(re.escape(fr), s, re.I):
            f("lagerfras: %r" % fr)
    if ARTNR.search(s):
        f("artikelnummer i texten: %r" % ARTNR.search(s).group(0))

    # 4. ☠️ Maxlasten får inte lånas. Runda 88:s modeller tog 50 kg; de här
    #    tar 100. Ett lånat tal åt något håll är halverad eller fördubblad
    #    bärighet på en sida ett barn ska stå på.
    # ⚠️ DECIMALEN MÅSTE MED I MÖNSTRET. `(\d+)` mot "10,6 kg" fångar "6",
    #    inte "10,6" — och grinden anmälde egenvikten som en främmande
    #    viktangivelse på fyra av sex produkter. Ett falsklarm som alltid
    #    fyrar lär mottagaren att sluta läsa.
    laster = set(re.findall(r"(\d+(?:,\d+)?)\s*kg" + r"(?!%s)" % GRANS, su))
    ratt = "%d" % MAXLAST[m]
    if ratt not in laster:
        f("maxlasten %s kg står inte i texten" % ratt)
    egenvikt = {t[:-3] for t in TAL_OK[m] if t.endswith(" kg")}
    for l in laster - {ratt} - egenvikt:
        f("främmande viktangivelse: %s kg" % l)

    # 5. ☠️ Längden får inte lånas mellan modellerna
    # ⚠️ Längden skrivs som "120 × 58 × 75–80 cm" i spec-raden, alltså utan
    #    ett eget "cm". Grinden fick inte kräva en form texten inte använder.
    if not re.search(r"(?<!%s)%s\s*(?:cm|×)" % (GRANS, LANGD[m]), s):
        f("längden %s cm står inte i texten" % LANGD[m])
    for annan in set(LANGD.values()) - {LANGD[m]}:
        if re.search(r"(?<!%s)%s\s*(?:cm|×)" % (GRANS, annan), su):
            f("ANNAN modells längd i egen text: %s" % annan)

    # 6. ☠️ Styrhöjden är rundans egentliga åldersuppgift, och den är den
    #    lättaste att låna: A2:s lägsta läge (92) ligger ÖVER D:s högsta (80),
    #    så ett lånat spann flyttar produkten en hel storleksklass.
    if not any(x in s.replace("-", "–") for x in _spannformer(STYRE[m])):
        f("styrhöjden %s cm står inte i texten" % STYRE[m])
    for annan in set(STYRE.values()) - {STYRE[m]}:
        if any(x in su.replace("-", "–") for x in _spannformer(annan)):
            f("ANNAN modells styrhöjd i egen text: %s" % annan)

    # 7. ☠️ Elsparkcykelns fordonsklass — en trampad sparkcykel är ett
    #    lekfordon, en eldriven är det inte.
    for mt in ELSPARK_RE.finditer(s):
        f("elfordonsord: %r" % mt.group(0))

    # 8. ☠️ Standarder och godkännanden vi inte har sett ett intyg på
    for mt in STANDARD_RE.finditer(s):
        f("obelagd standard/godkännande: %r" % mt.group(0))

    # 9. ☠️ Hjälm får inte framställas som lag. Nekningsmedveten per mening:
    #    vår egen text säger att lagkrav INTE finns, alltså det korrekta.
    for men, _med_nasta in meningar(synlig_meningstext(h)):
        if HJALM_LAG_RE.search(men) and not NEKORD.search(men):
            f("hjälm framställd som lagkrav: %r" % men[:80])

    # 9b. ☠️ POSITIV GRIND: en förbudsgrind kan inte se det som SAKNAS.
    if not re.search(r"hj[äa]lm", s, re.I):
        f("hjälmrådet saknas helt — texten säger inget om skyddsutrustning")

    # 10. ☠️ Alla tre modellerna bromsar fram OCH bak. Grinden läser
    #     SPEC-RADEN, inte hela sidan: runda 88 mätte upp att en sida kan
    #     säga två olika saker om bromsen och ändå slippa förbi.
    bromsrader = [r for r in p["spec"] if re.match(r"Broms(?:ar)?\s*:", r)]
    if not bromsrader:
        f("ingen bromsrad i spec-tabellen")
    bromsspec = " ".join(bromsrader)
    if not re.search(r"fram", bromsspec, re.I):
        f("spec-raden nämner ingen frambroms: %r" % bromsspec)
    for mt in EN_BROMS_RE.finditer(s):
        f("bara EN broms utlovad på en modell som har två: %r" % mt.group(0))
    if not re.search(r"broms", s, re.I):
        f("brödtexten nämner ingen broms alls")

    # 11. ☠️ RUNDANS SIGNATURGRIND. Modell F:s feedtext lovar hjul i
    #     "Fußballdesign". Tio bilder granskade i Steg 4 — INGEN visar ett
    #     bollmönster. Det är rundans enda påstående där leverantören lovar
    #     något bilden motsäger, och det får aldrig skrivas av.
    for mt in FOTBOLL_RE.finditer(s):
        f("OBELAGT FOTBOLLSMÖNSTER: %r" % mt.group(0))

    # 12. ☠️ RUNDANS ANDRA SIGNATURGRIND, och den är INVERTERAD mot runda 88.
    #     Där var hjulen massiva EVA och rådet "inget att pumpa". Här har
    #     ALLA SEX luftdäck. Kopieras runda 88:s skötselråd hit får kunden
    #     veta att hen aldrig behöver pumpa ett däck som går platt.
    for mt in MASSIV_HARD_RE.finditer(s):
        f("MASSIVT-HJUL-PÅSTÅENDE PÅ EN MODELL MED LUFTDÄCK: %r" % mt.group(0))
    for men, _med_nasta in meningar(synlig_meningstext(h)):
        for mt in MASSIV_KONTRAST_RE.finditer(men):
            fore = men[max(0, mt.start() - KONTRASTFONSTER):mt.start()]
            if not KONTRASTORD.search(fore):
                f("massivt hjul UTAN kontrastmarkör före sig — läses som ett "
                  "påstående om varan: %r" % men[:90])
    # ⚠️ Kravet ligger på SKÖTSELBLOCKET, inte på hela sidan. Orden
    #    "luftdäck" och "uppblåsbar" står i spec-raden och är i praktiken
    #    omöjliga att tappa; det som VERKLIGEN kan falla bort är LUFT-stycket
    #    ur `skotsel`-listan — och då står kunden utan det enda råd som
    #    skiljer luftdäck från runda 88:s massiva hjul.
    if not re.search(r"pumpa|tryck|luftd[äa]ck", " ".join(p["skotsel"]), re.I):
        f("skötselblocket säger inget om däcktrycket — LUFT-rådet saknas")

    # 13. Intern jargong i kundtext
    for mt in JARGONG_RE.finditer(s):
        f("intern jargong: %r" % mt.group(0))

    # 14. Talgrind: varje tal måste stå i modellens kända uppsättning
    kedjor = {mt.group(0) for mt in KEDJA_RE.finditer(su)}
    rensad = KEDJA_RE.sub(" ", su)
    for mt in TAL_RE.finditer(rensad):
        tal = "%s %s" % (mt.group(1), mt.group(2))
        if tal not in TAL_OK[m]:
            f("okänt tal: %r" % tal)
    for kedja in kedjor:
        enhet = KEDJA_RE.search(kedja).group(1)
        for bit in re.findall(r"\d+(?:,\d+)?", kedja):
            if "%s %s" % (bit, enhet) not in TAL_OK[m]:
                f("okänt tal i kedjan %r: %r" % (kedja, bit))

    # 15. Husets formregler
    if re.search(r"\d+\s*,\s*\d+\s*,\s*\d+\s*cm", s):
        f("kommalista av tal")
    if re.search(r"(?:B[öo]r|Bra) att veta|beh[öo]ver veta innan du k[öo]per", s):
        f("varningsblock")
    for rubrik in ("Tekniska specifikationer", "Användning och skötsel",
                   "Vanliga frågor"):
        if "<h2>%s</h2>" % rubrik not in h:
            f("flikrubriken %r saknas som ren h2" % rubrik)

    # 16. ☠️ Färghederlighet. Namnet är det kunden ser i listningen; färgen
    #     där MÅSTE stå i spec-tabellens Färg-rad. Sex produkter i tre par
    #     där bara färgen skiljer är exakt läget där en kopierad spec-rad
    #     skickar fel färg hem.
    fargrader = [r for r in p["spec"] if r.startswith("Färg:")]
    if not fargrader:
        f("ingen Färg-rad i spec-tabellen")
    fargspec = " ".join(fargrader)
    namnfarger = [c for c in FARG_ORD
                  if re.search(_vansterord(c), p["name"], re.I)]
    if not namnfarger:
        f("namnet nämner ingen färg: %r" % p["name"])
    for c in namnfarger:
        if not re.search(_vansterord(c), fargspec, re.I):
            f("färgen %r står i namnet men inte i Färg-raden %r" % (c, fargspec))

    # 17. ☠️ Fälgfärgen — se FALG_FARG_RE ovan
    for mt in FALG_FARG_RE.finditer(s):
        f("OMÄTT FÄLGFÄRG: %r — alla sex har silverfärgad ekerfälg"
          % mt.group(0))

    # 18. Ankartexterna ska vara meningsfulla, inte "klicka här"
    for mt in ANKARE.finditer(h):
        if len(strip_taggar(mt.group(2))) < 4:
            f("för kort ankartext: %r" % mt.group(2))

if fel:
    for x in fel:
        print("FEL:", x)
    raise SystemExit("\nLINT FÄLLER: %d fel i %d produkter"
                     % (len(fel), len(texter.PRODUKTER)))
print("Lint: 0 fel i %d produkter." % len(texter.PRODUKTER))
