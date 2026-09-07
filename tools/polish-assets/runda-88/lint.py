# -*- coding: utf-8 -*-
"""Runda 88 — lint. Rundans egna grindar plus husets delade.

☠️ ORDLISTAN SJÄLVTESTAS MOT VÅR EGEN TEXT INNAN NÅGON GRIND KÖRS. En grind
   som fäller korrekt svenska lär mottagaren att ignorera den — runda 81:s
   lärdom, och runda 88:s `\\b`-fynd är samma familj: en grind vars självtest
   inte gäller är osjälvtestad.
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
MODELL = {"b1dcd424": "A", "41269686": "A", "82b5a517": "A",
          "e9cfa7bf": "B", "2b8297df": "B", "9941383e": "B",
          "e4e5a8ef": "I", "b03784dc": "I"}
MAXLAST = {"A": 50, "B": 50, "I": 100}
ALDER = {"A": "5–12", "B": "6–12", "I": "5–12"}
LANGD = {"A": None, "B": "100–150", "I": "120–170"}

# ☠️ Tal som FÅR stå per modell. Allt annat är påhittat.
TAL_OK = {
    "A": {"120 cm", "52 cm", "32 cm", "11 cm", "80 cm", "88 cm", "50 kg",
          "12 tum", "5", "12"},
    "B": {"118 cm", "52 cm", "32 cm", "11 cm", "80 cm", "88 cm", "50 kg",
          "30 cm", "7 kg", "101 cm", "14 cm", "45 cm", "6", "12", "100 cm",
          "150 cm", "12 tum", "120 cm", "88 cm"},
    "I": {"139 cm", "58 cm", "37 cm", "12,5 cm", "90 cm", "96 cm", "100 kg",
          "120 cm", "170 cm", "16 tum", "5", "12", "50 kg", "118 cm",
          "40 cm", "12 tum"},
}

# ☠️ Tyska ord som INTE får överleva. Ordgränsen är en explicit klass som
#    beter sig likadant i Python och JavaScript — `\b` gör det inte
#    (runda 88:s "väder"-fynd).
GRANS = r"[\wåäöÅÄÖ]"
TYSKA_BANK = ["tretroller", "kickroller", "kickscooter", "cityroller",
              "kinderroller", "kinderscooter", "lenker", "bremse", "reifen",
              "trittbrett", "belastbar", "höhenverstellbar", "hinterrad",
              "fußstütze", "ständer", "gestell", "korb", "becherhalter",
              "schutzblech", "gummireifen", "fahrspaß", "geschwister"]

# ☠️ Rundans FÖRBJUDNA påståenden — leverantörens eget säljargument på
#    modell A och B, där maxlasten är 50 kg.
FAMILJ_RE = re.compile(
    r"hela familjen|för familjen|f[öo]r[äa]ldrar|vuxna kan|en vuxen kan|"
    r"till jobbet|till arbetet|mamma och pappa", re.I)
# Modell I FÅR säga det — den tar 100 kg och 170 cm.
FAMILJ_TILLATEN = {"I"}

# ☠️ Elsparkcykelns fordonsklass. Aldrig här.
ELSPARK_RE = re.compile(r"elsparkcykel|elscooter|eldriven|motor|batteri|"
                        r"km/h|hastighet", re.I)

# ☠️ Standarder och godkännanden — inget är belagt.
STANDARD_RE = re.compile(
    r"\bEN\s*\d{2,5}|certifierad|certifiering|CE-m[äa]rkt|typgodk[äa]nd|"
    r"godk[äa]nd enligt|testad enligt|uppfyller\s+(?:standard|kraven)", re.I)

# ☠️ Hjälm får aldrig framställas som lag.
HJALM_LAG_RE = re.compile(
    r"hj[äa]lm[^.]{0,80}(lagkrav|enligt lag|lagstadgad|p[åa]bjuden|m[åa]ste)|"
    r"(lagkrav|enligt lag|lagstadgad)[^.]{0,80}hj[äa]lm", re.I)

# ☠️ Bromsen: A och B har EN broms (bak). I har TVÅ.
TVA_BROMSAR_RE = re.compile(
    r"b[åa]da hjulen|tv[åa] bromsar|dubbl[ae] broms|bromsar p[åa] b[åa]da", re.I)
EN_BROMS = {"A", "B"}

# Korgen finns bara på modell I.
KORG_RE = re.compile(r"\bkorg(?:en|ar|arna)?\b|mugghållare|st[äa]nksk[äa]rm", re.I)
KORG_MODELL = {"I"}

# Intern jargong i kundtext (grind 5c, runda 68/77/83).
# ☠️ "FAMILJEN" ÄR MED, OCH DET ÄR RUNDANS EGET FYND. Sju gånger i fyra
#    texter användes ordet om PRODUKTfamiljen — "familjens mest återhållsamma
#    kombination", "den enda i familjen en vuxen kan låna". Kunden läser det
#    som sin egen familj, och på modell A och B är just det påståendet
#    förbjudet eftersom maxlasten är 50 kg. Ordet har alltså två fel i sig
#    samtidigt: intern jargong OCH ett löfte varan inte håller. Det enda
#    legitima innehållet — att en vuxen kan låna modell I — går att skriva
#    utan ordet, så ordet bannlyses helt.
JARGONG_RE = re.compile(r"\brundans?\b|\bi rundan\b|\bbatch(?:en)?\b|"
                        r"\bpublicerad\w*\b|\butkast\w*\b|"
                        r"\bfamilj\w*\b", re.I)

TAL_RE = re.compile(r"(\d+(?:,\d+)?)\s*(cm|kg|tum|m²|%|°)(?![a-zå-ö²])")
KEDJA_RE = re.compile(r"((?:\d+(?:,\d+)?\s*(?:[×x/]|–|-)\s*)+\d+(?:,\d+)?)"
                      r"\s*(cm|kg|tum|m²|%|°)(?![a-zå-ö²])")


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

# Provet åt andra hållet: listan MÅSTE fälla verklig tysk text.
_TYSK_PROV = [
    "Ein Tretroller für die ganze Familie, auch Geschwister und Eltern.",
    "Kugelgelagerter, höhenverstellbarer Lenker von 80 auf max. 88 cm.",
    "Der Kunststoffkorb kann abgenommen werden, Becherhalter aus Metall.",
    "Ausgestattet mit einer Handbremse für das Hinterrad und einer Fußstütze.",
]
_slapper = [t for t in _TYSK_PROV
            if not any(re.search(_ordgrans(o), t, re.I)
                       for o in TYSKA + TYSKA_BANK)]
if _slapper:
    raise SystemExit("ORDLISTAN SLÄPPER TYSK TEXT: %s" % _slapper)


# ── Grindarna ─────────────────────────────────────────────────────────────
fel = []
sedda_slug, sedda_sku, sedda_namn = {}, {}, {}

for p in texter.PRODUKTER:
    k = p["kort"]
    m = MODELL[k]
    h = texter.bygg(p)
    s = synlig(h)
    # Text UTANFÖR ankartexter — ett syskons tal eller färg i en länk är
    # inte ett påstående om DEN HÄR produkten. `dela_pa_ankare` returnerar
    # (egna meningar, [(mål, mening)]); bara de egna granskas mot facit.
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
    if p["sku"] != "FP-" + p["slug"].replace("sparkcykel-barn-", "sparkcykel-"):
        pass  # SKU-formen kontrolleras mot sluggen i grind 2 nedan

    # 2. SKU ska bära sluggens särskiljande del
    stam = p["slug"].split("-")[-1]
    if stam not in p["sku"]:
        f("SKU %r bär inte sluggens särskiljande del %r" % (p["sku"], stam))

    # 3. Tyska ord, husmärken, landord, attribution, artikelnummer
    for o in TYSKA + TYSKA_BANK + HUSMARKEN + LANDORD + ATTRIBUTION:
        if re.search(_ordgrans(o), s, re.I):
            f("förbjudet ord: %r" % o)
    for fr in LAGERFRAS:
        if re.search(re.escape(fr), s, re.I):
            f("lagerfras: %r" % fr)
    if ARTNR.search(s):
        f("artikelnummer i texten: %r" % ARTNR.search(s).group(0))

    # 4. ☠️ Maxlasten får inte lånas mellan modellerna
    laster = {int(x) for x in re.findall(r"(\d+)\s*kg\b", su)}
    ratt = MAXLAST[m]
    if ratt not in laster:
        f("maxlasten %d kg står inte i texten" % ratt)
    for l in laster - {ratt, 7}:          # 7 kg är modell B:s egenvikt
        f("främmande viktangivelse: %d kg" % l)

    # 5. ☠️ Åldern och längden får inte lånas heller
    if ALDER[m] not in s.replace("-", "–"):
        f("åldersspannet %s står inte i texten" % ALDER[m])
    for annan in set(ALDER.values()) - {ALDER[m]}:
        if annan in su.replace("-", "–"):
            f("ANNAN modells åldersspann i texten: %s" % annan)
    if LANGD[m] and LANGD[m] not in s.replace("-", "–"):
        f("längdspannet %s står inte i texten" % LANGD[m])
    for annan in {v for v in LANGD.values() if v} - {LANGD[m]}:
        if annan in su.replace("-", "–"):
            f("ANNAN modells längdspann i texten: %s" % annan)

    # 6. ☠️ Familjepåståendet — bara modell I får göra det
    for mt in FAMILJ_RE.finditer(su):
        if m not in FAMILJ_TILLATEN:
            f("familje-/vuxenpåstående på en modell som tar %d kg: %r"
              % (MAXLAST[m], mt.group(0)))

    # 7. ☠️ Elsparkcykelns fordonsklass
    for mt in ELSPARK_RE.finditer(s):
        f("elfordonsord: %r" % mt.group(0))

    # 8. ☠️ Standarder och godkännanden
    for mt in STANDARD_RE.finditer(s):
        f("obelagd standard/godkännande: %r" % mt.group(0))

    # 9. ☠️ Hjälm får inte framställas som lag
    #
    # ⚠️ GRINDEN MÅSTE VARA NEKNINGSMEDVETEN. Vår egen text säger "Något
    #    lagkrav på hjälm finns det INTE för en sparkcykel" — alltså precis
    #    det korrekta påståendet — och en grov ordkoll fällde alla åtta.
    #    Samma hål som runda 86:s nekningsfilter. Meningen granskas därför
    #    per mening, och ett nekord i samma mening frikänner den.
    for men, _med_nasta in meningar(synlig_meningstext(h)):
        if HJALM_LAG_RE.search(men) and not NEKORD.search(men):
            f("hjälm framställd som lagkrav: %r" % men[:80])

    # 9b. ☠️ POSITIV GRIND: hjälmrådet MÅSTE finnas på varje sida.
    #     `SKYDD` var DÖD KOD i första utkastet — definierad men aldrig
    #     använd, alltså osynlig för kunden trots att leverantörens egna
    #     livsstilsbilder visar barn med hjälm och knäskydd. En förbudsgrind
    #     kan inte upptäcka något som SAKNAS; bara en positiv kan.
    if not re.search(r"hj[äa]lm", s, re.I):
        f("hjälmrådet saknas helt — texten säger inget om skyddsutrustning")

    # 10. ☠️ Bromsen: A och B har EN, I har TVÅ
    #
    # ☠️ GRINDEN MÅSTE LÄSA SPEC-RADEN, INTE HELA TEXTEN. Ett första utkast
    #    nöjde sig med att ordet "båda hjulen" fanns NÅGONSTANS på sidan —
    #    och mutationstestet visade varför det inte duger: spec-raden gick
    #    att ändra till "Broms: en på bakhjulet" medan FAQ:n fortsatte säga
    #    "broms på båda hjulen", och grinden var nöjd. En sida som säger två
    #    olika saker om bromsen är värre än en som säger fel en gång.
    bromsrader = [r for r in p["spec"] if re.match(r"Broms(?:ar)?\s*:", r)]
    if not bromsrader:
        f("ingen bromsrad i spec-tabellen")
    bromsspec = " ".join(bromsrader)
    if m in EN_BROMS:
        for mt in TVA_BROMSAR_RE.finditer(su):
            f("två bromsar utlovade på en modell med bara bakbroms: %r"
              % mt.group(0))
        if re.search(r"fram(?:hjul)?", bromsspec, re.I):
            f("spec-raden ger framhjulsbroms åt en modell som saknar den: %r"
              % bromsspec)
    else:
        if not re.search(r"fram(?:hjul)?", bromsspec, re.I):
            f("modell I:s spec-rad nämner ingen frambroms: %r" % bromsspec)
        if not TVA_BROMSAR_RE.search(s):
            f("modell I har broms på båda hjulen men brödtexten säger det inte")

    # 11. Korg och stänkskärmar finns bara på modell I
    if m not in KORG_MODELL:
        for mt in KORG_RE.finditer(su):
            f("korg/skärm på en modell som saknar den: %r" % mt.group(0))

    # 12. Intern jargong i kundtext
    for mt in JARGONG_RE.finditer(s):
        f("intern jargong: %r" % mt.group(0))

    # 13. Talgrind: varje tal måste stå i modellens kända uppsättning
    kedjor = {mt.group(0) for mt in KEDJA_RE.finditer(su)}
    rensad = KEDJA_RE.sub(" ", su)
    for mt in TAL_RE.finditer(rensad):
        tal = "%s %s" % (mt.group(1), mt.group(2))
        if tal not in TAL_OK[m]:
            f("okänt tal: %r" % tal)
    for kedja in kedjor:
        for bit in re.findall(r"\d+(?:,\d+)?", kedja):
            enhet = KEDJA_RE.search(kedja).group(2)
            if "%s %s" % (bit, enhet) not in TAL_OK[m]:
                f("okänt tal i kedjan %r: %r" % (kedja, bit))

    # 14. Husets formregler
    if re.search(r"\d+\s*,\s*\d+\s*,\s*\d+\s*cm", s):
        f("kommalista av tal")
    if re.search(r"(?:B[öo]r|Bra) att veta|beh[öo]ver veta innan du k[öo]per", s):
        f("varningsblock")
    for rubrik in ("Tekniska specifikationer", "Användning och skötsel",
                   "Vanliga frågor"):
        if "<h2>%s</h2>" % rubrik not in h:
            f("flikrubriken %r saknas som ren h2" % rubrik)

    # 15. Ankartexterna ska vara meningsfulla, inte "klicka här"
    for mt in ANKARE.finditer(h):
        if len(strip_taggar(mt.group(2))) < 4:
            f("för kort ankartext: %r" % mt.group(2))

if fel:
    for x in fel:
        print("FEL:", x)
    raise SystemExit("\nLINT FÄLLER: %d fel i %d produkter"
                     % (len(fel), len(texter.PRODUKTER)))
print("Lint: 0 fel i %d produkter." % len(texter.PRODUKTER))
