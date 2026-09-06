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
A = {"75f6c433", "7ab2f8aa", "60c803f0"}     # bouclé, nackstöd, hjul
B = {"cc81673d", "0945e4dd"}                 # snöflanell, fotstöd, hjul
C = {"348ee535", "4d83eca6"}                 # sammetslook, FAST fyrfot, INGA hjul
ALLA = A | B | C


def _ext(farg, drag=(), last=(), grad=()):
    return dict(farg=set(farg), drag=set(drag), last=set(last), grad=set(grad),
                kalla="wix 2026-09-06")


# ☠️ Det publicerade syskonet till modell B. Facit LÄST LIVE ur sidan: den
#    matchar utkasten på ÅTTA mått och bär färgordet mörkgrå.
EXTERN = {
    "kontorsstol-fotstod-sammet":
        _ext({"mörkgrå"}, {"fotstöd", "tre lägen"}, {"120 kg"}),
}

# Alla sju bär samma last. Det är inget sammanträffande — det är samma
# gaslyftsklass och samma stålfot i tre olika stolar.
MAXLAST = {k: {"120 kg"} for k in ALLA}

# ☠️ Det ENDA gradtalet i rundan är VRIDNINGEN, och den är sann för alla sju:
#    varje stol snurrar 360° på sin pelare. Ingen av dem har en RYGGVINKEL —
#    modell B låser ryggen i LÄGEN, inte i grader, och källan anger inga tal.
#    Att 360° står i facit är alltså inte en uppmjukning: det säger att just
#    det talet är belagt och att varje ANNAT gradtal fortfarande fälls.
GRADER = {k: {"360°"} for k in ALLA}

FARG = {
    "75f6c433": {"benvit"},    # källan: Hellgrau — L 80 %, S 14 %, H 43°
    "7ab2f8aa": {"ljusgrå"},   # källan: Dunkelgrau — L 58 %, TVÅ steg fel
    "60c803f0": {"ljusbrun"},  # källan: Braun — L 60 %, S 29 %, H 29°
    "cc81673d": {"gräddvit"},  # källan: Cremeweiß — L 80 %, S 22 %, H 35°
    "0945e4dd": {"brun"},      # källan: Braun — L 39 %, S 17 %, H 24°
    "348ee535": {"grå"},
    "4d83eca6": {"benvit"},    # källan: Cremeweiß — L 85 %, S 13 %, H 36°
}

# ☠️ Färgord som ETT ANNAT syskon äger ordagrant — inklusive det PUBLICERADE.
#    `mörkgrå` är låst av kontorsstol-fotstod-sammet och får inte skrivas av
#    någon i rundan; det var den färgen `501ba88f` bar, och den produkten är
#    utesluten just därför.
RESERVERADE = set()
for _f in FARG.values():
    RESERVERADE |= _f
for _e in EXTERN.values():
    RESERVERADE |= _e["farg"]

VIKT = {}
for _k in A:
    VIKT[_k] = "22,6 kg"
for _k in B:
    VIKT[_k] = "19,5 kg"
for _k in C:
    VIKT[_k] = "15,5 kg"

MASTE_STA = {}
for _k in A:
    MASTE_STA[_k] = ["120 kg", "47,5–55,5 cm", "6,5 cm", "bouclé"]
for _k in B:
    MASTE_STA[_k] = ["120 kg", "152 cm", "tre lägen", "34 × 21"]
for _k in C:
    MASTE_STA[_k] = ["120 kg", "46–54 cm", "utan hjul"]
# ☠️ Färgordet måste stå ORDAGRANT. Syskonen delar all annan text, så ett
#    tappat kvalificerande led gör två sidor omöjliga att skilja åt.
for _k, _ord in FARG.items():
    MASTE_STA[_k].extend(sorted(_ord))

# Modell B låser ryggen i tre lägen — det ÄR en ryggjustering och måste få
# beskrivas. A och C har fast rygg respektive vippfunktion.
LUTAR = set(B)
LUT_RE = re.compile(r"fäller ryggen|ryggen fälls|ryggen ställs|tillbakalutad|"
                    r"ryggvinkel|ryggen låses|ryggen lutas", re.I)

MED_NACKSTOD = set(A)
MED_BOUCLE = set(A)
MED_FOTSTOD = set(B)
MED_TRE_LAGEN = set(B)
MED_HJUL = A | B                 # ☠️ C har INGA hjul
MED_FAST_FOT = set(C)
MED_VIPP = set(C)

# ☠️ Ryggstödets bredd på modell C: källan säger 65 cm på den ena och 50 cm på
#    den andra, samma modell. Båda talen är otillåtna på båda sidorna.
FORBJUDNA_MATT = {k: [r"ryggstöd[^.]{0,40}\b(?:50|65)\s*cm",
                      r"\b(?:50|65)\s*cm[^.]{0,20}ryggstöd"] for k in C}

# ☠️ HÄLSOPÅSTÅENDEN — rundans egen grind. Se docstringen.
HALSA_RE = re.compile(
    r"blodcirkulation|cirkulation(?:en)?\b|genomblödning|"
    r"ryggsmärt|ryggont|nacksmärt|smärtlindr|lindrar|botar|läker|"
    r"förebygger|motverkar\s+(?:värk|smärta|ont)|"
    r"avlastar\s+ryggraden|stödjer\s+ryggraden|stöttar\s+ryggraden|"
    r"rätt\s+hållning|korrekt\s+hållning|hälsosam", re.I)

# ☠️ ARBETSSTOL / STANDARD — rundans egen grind. Se docstringen.
ARBETSSTOL_RE = re.compile(
    r"arbetsstol|arbetsmiljö|EN\s*1335|EN1335|BIFMA|"
    r"certifierad|certifiering|godkänd\s+för|uppfyller\s+(?:krav|standard)|"
    r"kontorsarbete\s+heltid|åtta\s+timmar", re.I)

TILLATEN_LADER = re.compile(r"konstläder\w*|läderlook\w*|likna(?:r)? läder", re.I)
# "sammetslook" är en YTLIKNELSE och måste få stå; naket "sammet" om en
# polyesterväv är ett materialpåstående.
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

        utrustningsgrind("nackstöd", MED_NACKSTOD, "nackstöd", "justerbart nackstöd")
        utrustningsgrind("bouclé", MED_BOUCLE, "bouclé", "bouclé")
        utrustningsgrind("fotstöd", MED_FOTSTOD, "fotstöd", "utdragbart fotstöd")
        utrustningsgrind("tre lägen", MED_TRE_LAGEN, "tre lägen", "rygg i tre lägen")
        utrustningsgrind("vippfunktion", MED_VIPP, "vippfunktion", "vippfunktion")
        utrustningsgrind("fast fot", MED_FAST_FOT, "fast fot", "fyrstjärnig fast fot")

        # ☠️ HJUL PÅ MODELL C. Ordet får bara stå i en NEKANDE sats på de två
        #    stolar som har en fast fot. `utrustningsgrind` duger inte här:
        #    den kan inte skilja "fem PU-hjul" från "utan hjul", och just den
        #    skillnaden är hela poängen — en stol som påstås rulla och inte
        #    gör det är ett löfte kunden upptäcker vid uppackning.
        # ☠️ En FRÅGA påstår ingenting — "Har den hjul?" är inte ett löfte om
        #    hjul. FAQ:n prövas därför som PAR: frågan och svaret läses ihop,
        #    så att nekandet i svaret räknas. Utan hopparningen fällde grinden
        #    sin egen korrekta text, och en grind som fäller rätt svar lär
        #    mottagaren att stänga av den.
        NEKAR = re.compile(r"(?:utan|inga|inte)\s+(?:några\s+)?hjul|"
                           r"\bnej\b.{0,80}\bfast\b|\brullar inte\b", re.I)
        bitar = [m for m in egna if not m.rstrip().endswith("?")]
        bitar += ["%s %s" % (f, sv) for f, sv in p["faq"]]
        for mening in bitar:
            if not re.search(r"\bhjul", mening, re.I):
                continue
            nekad = NEKAR.search(mening)
            if k in MED_FAST_FOT and not nekad:
                fal(k, "hjul påstås på en stol med FAST fot: %.60s" % mening)
            if k in MED_HJUL and nekad:
                fal(k, "hjul förnekas på en stol som HAR hjul: %.60s" % mening)

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
