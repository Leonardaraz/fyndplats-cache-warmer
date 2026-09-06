# -*- coding: utf-8 -*-
"""Grindar för runda 75. Körs mot texter.py INNAN något skrivs till Wix.

De REGLER som gäller varje runda importeras från ../grindar.py — de får inte
finnas i en kopia här. Det som står i den här filen är rundans egna FAKTA.

☠️ RUNDANS TRE EGNA GRINDAR, utöver de delade:

  1. HÄLSOPÅSTÅENDEN. Källan säger ordagrant att fotstödet *"die Durchblutung
     fördert"* och att ryggen *"stützt Ihre Wirbelsäule optimal"*. Inget av det
     får överleva till svenska. `HALSA_RE` fäller på cirkulation, ryggsmärta,
     hållningslöften och varje form av "lindrar/botar/förebygger".

  2. ARBETSSTOL. Ingen av de sju får säljas som stol för en ARBETSPLATS.
     Leverantören namnger ingen standard, och "Zertifiziert" utan norm är ingen
     certifiering. `ARBETSSTOL_RE` fäller på arbetsstol, EN 1335, arbetsmiljö,
     "godkänd för" och "certifierad".

  3. HJUL PÅ MODELL C. `348ee535` och `4d83eca6` står på en FAST fyrstjärnig
     fot. Ordet "hjul" får bara stå i en nekande sats på dem — en stol som
     påstås rulla och inte gör det är ett löfte kunden upptäcker vid uppackning.

☠️ OCH ETT MÅTT SOM MEDVETET SAKNAS: ryggstödets bredd på modell C. `348ee535`
   säger 65 cm, `4d83eca6` säger 50 cm, allt annat är identiskt. Ett av talen
   är fel; `FORBJUDNA_MATT` gör båda otillåtna på båda sidorna.
"""
import glob
import json
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from grindar import (TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR,   # noqa: E402
                     ANKARE, FARGORD, LAGERFRAS, pastaenden, strip_taggar,
                     sku_bas, dela_pa_ankare, synlig_meningstext,
                     pastar_i_listan)
from texter import PRODUKTER, bygg                                    # noqa: E402

FEL = []


def fal(kort, vad):
    FEL.append("%s  %s" % (kort, vad))


# ------------------------------------------------------- rundans fakta ---
D = {"10235819", "4fa0ae0a"}                 # chefsstol, fotstöd, nedfällbar
E = {"143f9b2d", "6e05f8b7", "4293c5ce"}     # nätrygg, kompakt, max 170 cm
F = {"a5454821", "0f7021fb", "ce10bfe8"}     # teddytyg, låg rygg, vippfunktion
ALLA = D | E | F


def _ext(farg, drag=(), last=(), grad=()):
    return dict(farg=set(farg), drag=set(drag), last=set(last), grad=set(grad),
                kalla="wix 2026-09-06")


# ⚠️ Ingen av de tre modellerna har ett publicerat syskon. Dubblettgrinden i
#    STEG1.md mätte alla tre mot 47 publicerade kontorsstolar: D och F har
#    ingenting inom ±5 cm, E ingenting inom ±2. Dikten är alltså TOM med
#    flit — inte glömd.
EXTERN = {}

# Alla åtta bär samma last. Det är inget sammanträffande utan samma
# gaslyftsklass i tre olika stolar.
MAXLAST = {k: {"120 kg"} for k in ALLA}

# ☠️ Det ENDA gradtalet i rundan är VRIDNINGEN — 360° gäller alla åtta.
#    Ingen av stolarna har en RYGGVINKEL i grader: modell D fälls till ett
#    MÅTT (148 cm), inte till ett gradtal. Att 360° står i facit betyder
#    alltså att just det talet är belagt och att varje ANNAT gradtal fälls.
GRADER = {k: {"360°"} for k in ALLA}

# Mätt ur pixlarna, inte hämtat ur källan. Se `farg.py` och STEG2-5.md.
FARG = {
    "10235819": {"ljusgrå"},    # källan: Hellgrau   — L 65 %, S 6 %
    "4fa0ae0a": {"grå"},        # källan: Dunkelgrau — L 45 %, ETT steg fel
    "143f9b2d": {"turkos"},     # källan: Grün       — H 184°, FEL FÄRGFAMILJ
    "6e05f8b7": {"rosa"},       # källan: Rosa       — H 4°, S 37 %
    "4293c5ce": {"ljusgrå"},    # källan: Grau       — L 69 %, ETT steg fel
    "a5454821": {"rosa"},       # källan: Rosa       — H 2°, S 46 %
    "0f7021fb": {"grå"},        # källan: Grau       — L 60 %, S 2 %
    "ce10bfe8": {"gräddvit"},   # källan: Cremeweiß  — H 57°, S 29 %, L 88 %
}

RESERVERADE = set()
for _f in FARG.values():
    RESERVERADE |= _f
for _e in EXTERN.values():
    RESERVERADE |= _e["farg"]

VIKT = {}
for _k in D:
    VIKT[_k] = "23 kg"
for _k in E:
    VIKT[_k] = "8,5 kg"
for _k in F:
    VIKT[_k] = "9,5 kg"

MASTE_STA = {}
for _k in D:
    MASTE_STA[_k] = ["120 kg", "46–54 cm", "148 cm", "80 cm"]
for _k in E:
    # ☠️ 170 cm är Steg 2-grindens egen rad: leverantörens angivna maximum
    #    för användarens längd MÅSTE nå kunden.
    MASTE_STA[_k] = ["120 kg", "44–56 cm", "170 cm", "8,5 kg"]
for _k in F:
    MASTE_STA[_k] = ["120 kg", "46–56 cm", "76–86 cm", "teddytyg"]
# ☠️ Färgordet måste stå ORDAGRANT. Syskonen delar all annan text.
for _k, _ord in FARG.items():
    MASTE_STA[_k].extend(sorted(_ord))

# Modell D är den ENDA som fälls bakåt. E och F har vippfunktion respektive
# fast rygg — ingen av dem får beskrivas som nedfällbar.
LUTAR = set(D)
LUT_RE = re.compile(r"fäller ryggen|ryggen fälls|nedfälld|nedfällt|"
                    r"fälls (?:bakåt|till)|tillbakalutad|ryggvinkel", re.I)

MED_FOTSTOD = set(D)
MED_NATRYGG = set(E)
MED_TEDDY = set(F)
MED_VIPP = set(F)
MED_HJUL = set(ALLA)             # alla åtta rullar
MED_ARMSTOD = set(ALLA)          # alla åtta har armstöd, mätt på ritningarna

# ☠️ RYGGSTÖDETS MÅTT PÅ MODELL E. Källan säger 52 cm brett på ett 48 cm
#    brett chassi. Båda talen spärras på E:s tre sidor.
FORBJUDNA_MATT = {k: [r"rygg(?:stöd|en)[^.]{0,40}\b(?:44|52)\s*cm",
                      r"\b(?:44|52)\s*cm[^.]{0,20}rygg"] for k in E}

# ☠️ HÄLSOPÅSTÅENDEN — en möbel får inte lova en medicinsk effekt.
HALSA_RE = re.compile(
    r"blodcirkulation|cirkulation(?:en)?\b|genomblödning|"
    r"ryggsmärt|ryggont|nacksmärt|smärtlindr|lindrar|botar|läker|"
    r"förebygger|motverkar\s+(?:värk|smärta|ont)|"
    r"avlastar\s+ryggraden|stödjer\s+ryggraden|stöttar\s+ryggraden|"
    r"rätt\s+hållning|korrekt\s+hållning|hälsosam", re.I)

# ☠️ ARBETSSTOL — ingen av de åtta är provad mot EN 1335.
ARBETSSTOL_RE = re.compile(
    r"arbetsstol|arbetsmiljö|EN\s*1335|EN1335|BIFMA|"
    r"certifierad|certifiering|godkänd\s+för|uppfyller\s+(?:krav|standard)|"
    r"kontorsarbete\s+heltid|åtta\s+timmar", re.I)

# ☠️ `ergonomisk` står i tre av de tyska modellnamnen. Det är varken ett mått
#    eller en norm — formen får beskrivas, effekten inte utlovas.
ERGONOMI_RE = re.compile(r"ergonomisk\w*", re.I)

# ☠️ PÅHITTADE MÅTT. Runbokens Steg 1 säger "hitta inte på siffror" — och
#    regeln stod utan grind: runda 75:s lint spärrade bara NAMNGIVNA tal
#    (`FORBJUDNA_MATT`) och krävde vissa (`MASTE_STA`). Ett tal som varken
#    var spärrat eller krävt kunde skrivas fritt. Uppmätt i runda 76:s
#    mutationstest: "Ryggen är 64 cm hög" på en stol vars rygg är 37 cm
#    passerade varje grind.
#
#    Facit är rundans MÄTTA tal, ett per grupp. Grinden plockar varje tal med
#    enhet ur HELA texten — namn, titel, meta, brödtext, spec och FAQ — och
#    fäller på allt som inte står här. Ett intervall räknas som sina två
#    ändpunkter, för det är så det skrivs: "120–128 cm" är 120 och 128.
def _tal(cm=(), kg=(), grad=()):
    ut = set("%s cm" % t for t in cm)
    ut |= set("%s kg" % t for t in kg)
    ut |= set("%s°" % t for t in grad)
    return ut


TILLATNA_TAL = {}
for _k in D:
    TILLATNA_TAL[_k] = _tal(
        cm=("74", "65", "120", "128", "148", "93", "101", "53", "52",
            "46", "54", "60", "80", "19", "36", "20", "86", "38"),
        kg=("120", "23"), grad=("360",))
for _k in E:
    TILLATNA_TAL[_k] = _tal(
        cm=("55", "48", "82,5", "94,5", "45", "40", "44", "56", "11",
            "170", "52", "50", "23"),
        kg=("120", "8,5"), grad=("360",))
for _k in F:
    TILLATNA_TAL[_k] = _tal(
        cm=("56", "61", "76", "86", "45", "47", "46", "51", "37", "17",
            "72", "40"),
        kg=("120", "9,5"), grad=("360",))

TAL_RE = re.compile(r"(\d+(?:,\d+)?)(?:\s*[–-]\s*(\d+(?:,\d+)?))?\s*(cm|kg|°)")


def tal_i(text):
    ut = set()
    for a, b, enhet in TAL_RE.findall(text):
        ut.add("%s%s" % (a, enhet if enhet == "°" else " " + enhet))
        if b:
            ut.add("%s%s" % (b, enhet if enhet == "°" else " " + enhet))
    return ut


TILLATEN_LADER = re.compile(r"konstläder\w*|läderlook\w*|likna(?:r)? läder", re.I)
TILLATEN_SAMMET = re.compile(r"sammetslook\w*|sammetens\b", re.I)

def kanda_sluggar():
    """Sluggar tidigare rundor faktiskt skrev. En felstavad länk ska fällas."""
    ut = {}
    for f in sorted(glob.glob(os.path.join(os.path.dirname(HAR),
                                           "runda-*", "skrivning.json"))):
        # ☠️ Hoppa över DEN EGNA rundan — annars förgiftar grinden sig själv.
        if os.path.dirname(os.path.abspath(f)) == HAR:
            continue
        try:
            d = json.load(open(f, encoding="utf-8"))
        except Exception:
            continue
        for q in (d if isinstance(d, list) else d.get("produkter", [])):
            if q.get("slug"):
                ut[q["slug"]] = os.path.basename(os.path.dirname(f))
    return ut


KANDA = kanda_sluggar()
SLUG2KORT = {p["slug"]: p["kort"] for p in PRODUKTER}
SLUGGAR = {p["slug"]: p for p in PRODUKTER}
GRAD_RE = re.compile(r"\d+°")


def facit(mal_sluggar, falt, egen_dict):
    ut, kanda_mal = set(), []
    for s in mal_sluggar:
        if s in SLUG2KORT:
            ut |= egen_dict[SLUG2KORT[s]]
            kanda_mal.append(SLUG2KORT[s])
        elif s in EXTERN:
            ut |= EXTERN[s][falt]
            kanda_mal.append(s[:22])
    return ut, kanda_mal


def har_drag(mal_sluggar, drag, agare):
    for s in mal_sluggar:
        if s in SLUG2KORT and SLUG2KORT[s] in agare:
            return True
        if s in EXTERN and drag in EXTERN[s]["drag"]:
            return True
    return False


def kant_mal(mal_sluggar):
    return [s for s in mal_sluggar if s in SLUG2KORT or s in EXTERN]


def kor():
    sedda_sku, sedda_slug = {}, {}

    for s in sorted(EXTERN):
        if s not in KANDA and not EXTERN[s].get("kalla"):
            fal("EXTERN", "%s står i EXTERN utan bevis att sidan finns" % s)

    for p in PRODUKTER:
        k = p["kort"]
        html = bygg(p)
        synlig = strip_taggar(html)
        meningstext = synlig_meningstext(html)
        allt = " ".join([p["name"], p["title"], p["meta"], synlig]).lower()

        for o in TYSKA:
            if re.search(r"\b%s\b" % re.escape(o), allt):
                fal(k, "tyskt ord: %s" % o)
        if ARTNR.search(" ".join([p["name"], p["title"], p["meta"], synlig])):
            fal(k, "artikelnummer i texten")
        for o in HUSMARKEN:
            if re.search(r"\b%s\b" % o, allt):
                fal(k, "husmärke: %s" % o)
        for o in LANDORD:
            if re.search(r"\b%s\b" % o, allt):
                fal(k, "land utskrivet: %s" % o)
        for o in ATTRIBUTION:
            if re.search(r"\b%s\b" % o, allt):
                fal(k, "attribution: %s" % o)
        for f in LAGERFRAS:
            if f in allt:
                fal(k, "lagerfras: %s" % f)
        if "artikelnr" in allt or "modellreferens" in allt:
            fal(k, "artikelnummer-etikett")

        egna, kors = dela_pa_ankare(html)
        rubrikfalt = " ".join([p["name"], p["title"], p["meta"]])
        LAST_RE = r"(?:bär|maxlast|last|märkt för|gjord för)[^.]{0,40}?(\d+ kg)"

        for mening in egna + [rubrikfalt]:
            for tal in re.findall(LAST_RE, mening.lower()):
                if tal not in MAXLAST[k]:
                    fal(k, "maxlast %s finns inte i facit %s"
                        % (tal, sorted(MAXLAST[k])))
            for grad in GRAD_RE.findall(mening):
                if grad not in GRADER[k]:
                    fal(k, "gradtalet %s finns inte i facit %s"
                        % (grad, sorted(GRADER[k])))
        for mal_sluggar, mening in kors:
            if not kant_mal(mal_sluggar):
                continue
            lfacit, mkn = facit(mal_sluggar, "last", MAXLAST)
            for tal in re.findall(LAST_RE, mening.lower()):
                if tal not in lfacit:
                    fal(k, "korshänvisning påstår %s om %s, facit %s"
                        % (tal, "/".join(mkn), sorted(lfacit)))
            gfacit, _ = facit(mal_sluggar, "grad", GRADER)
            for grad in GRAD_RE.findall(mening):
                if grad not in gfacit:
                    fal(k, "korshänvisning påstår %s om %s, facit %s"
                        % (grad, "/".join(mkn), sorted(gfacit)))

        if VIKT[k].lower() not in allt:
            fal(k, "vikt %s saknas" % VIKT[k])
        for annan in set(VIKT.values()) - {VIKT[k]}:
            if re.search(r"(?<![\d,])%s" % re.escape(annan.lower()), allt):
                fal(k, "annan produkts egenvikt %s publicerad" % annan)

        def farggrind(text, fc, agare, varifran):
            for ord_ in FARGORD:
                if ord_ in fc:
                    continue
                if (any(b.endswith(ord_) and ord_ != b for b in fc)
                        and ord_ not in (RESERVERADE - fc)):
                    continue
                if re.search(r"(?<![a-zåäö])%s(?![a-zåäö])" % ord_, text.lower()):
                    fal(k, "%sfärgord '%s' stämmer inte mot %s facit %s"
                        % (varifran, ord_, agare, sorted(fc)))

        for mening in egna + [rubrikfalt]:
            farggrind(mening, FARG[k], k, "")
        for mal_sluggar, mening in kors:
            ffacit, mkn = facit(mal_sluggar, "farg", FARG)
            if mkn:
                farggrind(mening, ffacit, "/".join(mkn), "korshänvisningens ")

        for tr, mening in pastaenden(TILLATEN_LADER.sub(" ", meningstext),
                                     re.compile(r"\bläder|\bskinn", re.I)):
            fal(k, "läder eller skinn påstås om en väv: %.70s" % mening)
        for tr, mening in pastaenden(TILLATEN_SAMMET.sub(" ", meningstext),
                                     re.compile(r"\bsammet", re.I)):
            fal(k, "sammet påstås naket om en manchesterväv: %.70s" % mening)
        for tr, mening in pastaenden(meningstext,
                                     re.compile(r"\bbomull|äkta linne|"
                                                r"äkta sammet|\bek\b|\bvalnöt|"
                                                r"\bläderklädd", re.I)):
            fal(k, "naturmaterial påstås: %.70s" % mening)

        # ☠️ RUNDANS EGEN GRIND 1 — hälsopåståenden. Källan lovar att
        #    fotstödet främjar blodcirkulationen och att ryggen stöttar
        #    ryggraden "optimalt". Ingen av dem har ett underlag.
        if HALSA_RE.search(allt):
            fal(k, "hälsopåstående: %s" % HALSA_RE.search(allt).group(0))
        if re.search(r"spänningar|värk|smärt|terapeut|sömnstörn|insomn",
                     allt):
            fal(k, "hälsopåstående (bredare formen)")
        if re.search(r"\bmassage", allt):
            fal(k, "massage påstås — ingen produkt i rundan har det")
        # ☠️ RUNDANS EGEN GRIND 2 — arbetsstol och standard. Uppgift #123.
        if ARBETSSTOL_RE.search(allt):
            fal(k, "arbetsstols-/standardpåstående: %s"
                % ARBETSSTOL_RE.search(allt).group(0))
        # ☠️ RUNDANS EGEN GRIND 3 — måtten som källan motsäger sig själv om.
        for m in FORBJUDNA_MATT.get(k, []):
            if re.search(m, synlig, re.I):
                fal(k, "mått som källan motsäger sig själv om: %s" % m)

        def utrustningsgrind(stam, agare, drag, vad):
            egen = (pastar_i_listan(egna, stam) or stam in rubrikfalt.lower())
            if egen and k not in agare:
                fal(k, "%s påstås men produkten har ingen" % vad)
            if k in agare and not egen:
                fal(k, "%s nämns inte trots att den är säljargumentet" % vad)
            for mal_sluggar, mening in kors:
                if not kant_mal(mal_sluggar):
                    continue
                if stam in mening.lower() and not har_drag(mal_sluggar, drag, agare):
                    fal(k, "korshänvisningen påstår %s om %s, som inte har det"
                        % (vad, "/".join(kant_mal(mal_sluggar))))

        for mening in egna:
            if LUT_RE.search(mening) and k not in LUTAR:
                fal(k, "ryggfällning påstås men produkten har fast rygg: %.60s"
                    % mening)

        utrustningsgrind("fotstöd", MED_FOTSTOD, "fotstöd", "utdragbart fotstöd")
        utrustningsgrind("nätväv", MED_NATRYGG, "nätrygg", "rygg i nätväv")
        utrustningsgrind("teddytyg", MED_TEDDY, "teddytyg", "teddytyg")
        utrustningsgrind("vippfunktion", MED_VIPP, "vippfunktion", "vippfunktion")
        utrustningsgrind("armstöd", MED_ARMSTOD, "armstöd", "armstöd")

        # ☠️ HJUL. Till skillnad från runda 75 har ALLA åtta stolar hjul, så
        #    den farliga riktningen är den omvända: en text som NEKAR hjul på
        #    en stol som rullar. Grinden behålls ändå åt båda hållen, för
        #    `MED_HJUL` är rundans påstående och inte en evig sanning — nästa
        #    runda kan ha en fast fot igen.
        # ☠️ En FRÅGA påstår ingenting — "Har den hjul?" är inte ett löfte.
        #    FAQ:n prövas därför som PAR: frågan och svaret läses ihop, så att
        #    ett nekande i svaret räknas. Utan hopparningen fällde grinden sin
        #    egen korrekta text i runda 75, och en grind som fäller rätt svar
        #    lär mottagaren att stänga av den.
        UTAN_HJUL = set()
        NEKAR = re.compile(r"(?:utan|inga|inte)\s+(?:några\s+)?hjul|"
                           r"\bnej\b.{0,80}\bfast\b|\brullar inte\b", re.I)
        bitar = [m for m in egna if not m.rstrip().endswith("?")]
        bitar += ["%s %s" % (f, sv) for f, sv in p["faq"]]
        for mening in bitar:
            if not re.search(r"\bhjul", mening, re.I):
                continue
            nekad = NEKAR.search(mening)
            if k in UTAN_HJUL and not nekad:
                fal(k, "hjul påstås på en stol med FAST fot: %.60s" % mening)
            if k in MED_HJUL and nekad:
                fal(k, "hjul förnekas på en stol som HAR hjul: %.60s" % mening)

        # ☠️ `ergonomisk` är varken mått eller norm — se docstringen.
        if ERGONOMI_RE.search(allt):
            fal(k, "ergonomipåstående utan mått bakom: %s"
                % ERGONOMI_RE.search(allt).group(0))

        for t in sorted(tal_i(allt) - TILLATNA_TAL[k]):
            fal(k, "tal som inte är uppmätt för den här stolen: %s" % t)

        pastar = " ".join(p["eg"] + p["spec"]).lower()
        if not re.search(r"monter", pastar):
            fal(k, "monteringen nämns inte i egenskaper eller spec")

        for kravd in MASTE_STA.get(k, []):
            if kravd.lower() not in synlig.lower():
                fal(k, "%r saknas i texten" % kravd[:40])

        for href, txt in ANKARE.findall(html):
            if not href.startswith("https://www.fyndplats.se/produkt/"):
                fal(k, "relativ eller främmande länk: %s" % href)
                continue
            mal = href.rsplit("/", 1)[-1]
            if mal == p["slug"]:
                fal(k, "länk till sig själv")
            elif mal in SLUGGAR:
                pass
            elif mal in EXTERN:
                if mal not in KANDA and not EXTERN[mal].get("kalla"):
                    fal(k, "EXTERN-slug utan bevis att sidan finns: %s" % mal)
            else:
                fal(k, "länk till slug utanför batchen och utan facit: %s" % mal)

        huvud = p["sokord"].split()[0]
        if huvud.lower() not in p["name"].lower():
            fal(k, "fokusordet '%s' saknas i name" % huvud)
        for falt in ("title", "meta"):
            if huvud.lower() not in p[falt].lower():
                fal(k, "fokusordet '%s' saknas i %s" % (huvud, falt))

        vantad = "FP-" + sku_bas(p["slug"])
        if len(vantad) > 40:
            fal(k, "SKU längre än 40 tecken")
        if vantad in sedda_sku:
            fal(k, "SKU %s krockar med %s" % (vantad, sedda_sku[vantad]))
        sedda_sku[vantad] = k
        if p["slug"] in sedda_slug:
            fal(k, "slug krockar med %s" % sedda_slug[p["slug"]])
        sedda_slug[p["slug"]] = k
        if p["slug"] in KANDA:
            fal(k, "slug %s är redan skriven i %s" % (p["slug"], KANDA[p["slug"]]))
        if not re.match(r"^[a-z0-9-]+$", p["slug"]):
            fal(k, "slug är inte ren ASCII-gemener: %s" % p["slug"])

        if len(p["name"]) > 80:
            fal(k, "name %d tecken (max 80)" % len(p["name"]))
        if p["title"] == p["name"]:
            fal(k, "titeln är identisk med namnet")
        if len(p["title"]) > 60:
            fal(k, "title %d tecken (max 60)" % len(p["title"]))
        if not (110 <= len(p["meta"]) <= 160):
            fal(k, "meta %d tecken (110–160)" % len(p["meta"]))

        if re.search(r"\d+\.\d", " ".join([p["name"], p["title"], p["meta"], synlig])):
            fal(k, "decimalpunkt i stället för decimalkomma")
        if re.search(r"\d,\s*\d+\s+och\s+\d+\s*(cm|kg|°)", synlig):
            fal(k, "kommalista av tal med enheten sist — använd snedstreck")

    return FEL


if __name__ == "__main__":
    fel = kor()
    for f in fel:
        print("FEL  " + f)
    print("\n%d fel i %d produkter" % (len(fel), len(PRODUKTER)))
    sys.exit(1 if fel else 0)
