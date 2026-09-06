# -*- coding: utf-8 -*-
"""Grindar för runda 74. Körs mot texter.py INNAN något skrivs till Wix.

De REGLER som gäller varje runda importeras från ../grindar.py — de får inte
finnas i en kopia här. Det som står i den här filen är rundans egna FAKTA.

☠️ RUNDANS SÄRDRAG: SEX AV ÅTTA ÄR SAMMA MODELL. Deras texter är därför nästan
   ordagrant lika, och det enda som skiljer dem är FÄRGORDET. Det gör
   färggrinden till rundans viktigaste — en förväxling mellan två av de sex
   syns inte i något annat tal.

☠️ OCH DEN SJUNDE FÄRGEN ÄR PUBLICERAD. `manchesterfatolj-med-fotpall-beige`
   äger ordet BEIGE, och `4a9c33d2` ligger på samma nyans (H 28° mot 29°) tio
   ljushetssteg under. `RESERVERADE` gör därför beige otillåtet på alla sex.
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
CORD = {"e1c41327", "58fb3025", "66adcdff", "4a9c33d2", "791e7292", "bc220489"}
BJORK = {"84082d41", "7e00970f"}


def _ext(farg, drag=(), last=(), grad=()):
    return dict(farg=set(farg), drag=set(drag), last=set(last), grad=set(grad),
                kalla="wix 2026-09-06")


# ☠️ De två publicerade syskonen. Facit LÄST LIVE ur deras egna sidor, inte
#    hämtat ur minnet — `kalla` säger det, och grinden kräver markören.
EXTERN = {
    "manchesterfatolj-med-fotpall-beige":
        _ext({"beige"}, {"fotpall", "manchester", "vingrygg"},
             {"150 kg", "80 kg"}),
    "vilstol-bjork-femstegs-fotstod":
        _ext({"svart"}, {"fotstöd", "fem lägen", "björk"}, {"120 kg"}),
}

MAXLAST = {}
for _k in CORD:
    # ☠️ BÅDA talen, av samma skäl som runda 73: fotpallens lägre last måste
    #    få passera, annars fälls den mening som finns för att kunden inte ska
    #    sätta sig på pallen.
    MAXLAST[_k] = {"150 kg", "80 kg"}
for _k in BJORK:
    MAXLAST[_k] = {"120 kg"}

# ☠️ INGEN produkt i rundan har ett gradtal. Manchesterfåtöljen har fast rygg
#    och björkvilstolen ställer FOTSTÖDET i hack, inte ryggen i grader. Tomma
#    mängder är ett AKTIVT beslut — samma spärr som runda 73:s två.
GRADER = {k: set() for k in CORD | BJORK}

FARG = {
    "e1c41327": {"petrolblå"},   # källan: Blau — H 201°, cyan
    "58fb3025": {"ljusgrå"},     # källan: Grau — L 68 %
    "66adcdff": {"gul"},
    "4a9c33d2": {"gråbeige"},    # källan: Hellbraun OCH Khaki — L 67 %, S 19 %
    "791e7292": {"senapsgul"},   # källan: Orange — H 41°
    "bc220489": {"orange"},      # källan: Braun — H 27°, S 54 %
    "84082d41": {"gråbrun"},     # källan: Braun — L 40 %, S 12 %
    "7e00970f": {"grå"},
}

# ☠️ Färgord som ETT ANNAT syskon äger ordagrant — inklusive de PUBLICERADE.
#    Utan den här mängden släpper den delade grinden igenom HUVUDET i en
#    sammansättning: "grå" när facit säger "ljusgrå", "beige" när facit säger
#    "gråbeige". Sex av åtta är samma modell, så det är exakt den förväxling
#    som inte syns i något annat tal.
RESERVERADE = set()
for _f in FARG.values():
    RESERVERADE |= _f
for _e in EXTERN.values():
    RESERVERADE |= _e["farg"]

VIKT = {}
for _k in CORD:
    VIKT[_k] = "19,7 kg"
for _k in BJORK:
    VIKT[_k] = "10,3 kg"

MASTE_STA = {}
for _k in CORD:
    # ☠️ "80 kg" ordagrant: både 150 och 80 är giltiga tal för produkten, så
    #    maxlast-grinden kan inte se om pallens tal byts mot stolens. Runda
    #    73:s lärdom, tillämpad direkt.
    MASTE_STA[_k] = ["150 kg", "80 kg", "101 cm", "11 cm", "65 × 43 × 38"]
for _k in BJORK:
    MASTE_STA[_k] = ["120 kg", "fem lägen", "60 × 22 mm", "10,3 kg"]
# ☠️ Färgordet måste stå ORDAGRANT. Sex av åtta delar all annan text, så ett
#    tappat kvalificerande led gör två syskon omöjliga att skilja åt.
for _k, _ord in FARG.items():
    MASTE_STA[_k].extend(sorted(_ord))

# Ingen produkt lutar ryggen: manchesterfåtöljen har fast rygg, björkvilstolen
# ställer fotstödet.
LUTAR = set()
LUT_RE = re.compile(r"fäller ryggen|ryggen fälls|ryggen ställs|tillbakalutad|"
                    r"ryggvinkel|ryggen låses|ryggen lutas", re.I)

MED_FOTPALL = set(CORD)          # lös pall — bara manchesterfamiljen
MED_FOTSTOD = set(BJORK)         # fotdel i hack — bara björkvilstolen
MED_VINGRYGG = set(CORD)
MED_BOK = set(CORD)
MED_BJORK = set(BJORK)
MED_FEM_LAGEN = set(BJORK)
MED_GOLVSKYDD = set(CORD)

TILLATEN_LADER = re.compile(r"konstläder\w*|läderlook\w*|likna(?:r)? läder", re.I)
# ☠️ "sammetens familj" är en LIKNELSE om manchester och måste få stå; naket
#    "sammet" om en manchesterväv är ett materialpåstående.
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

        if re.search(r"spänningar|värk|smärt|lindrar|botar|läker|terapeut|"
                     r"sömnstörn|insomn|ammande|amning|förebygger|blodcirk",
                     allt):
            fal(k, "hälsopåstående")
        if re.search(r"\bmassage", allt):
            fal(k, "massage påstås — ingen produkt i rundan har det")
        # ☠️ Källan kallar björkvilstolen "Esszimmerstuhl" mitt i texten. Den
        #    är en vilstol med fotstöd i fem lägen; en matstol är något annat
        #    och skulle sälja fel produkt. Samma klass som runda 73:s massage.
        if re.search(r"matstol|matsalsstol|köksstol", allt):
            fal(k, "matstol påstås — källans klipp-och-klistra-rest")

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

        utrustningsgrind("fotpall", MED_FOTPALL, "fotpall", "lös fotpall")
        utrustningsgrind("fotstöd", MED_FOTSTOD, "fotstöd", "fotstöd i hack")
        utrustningsgrind("vingrygg", MED_VINGRYGG, "vingrygg", "vingrygg")
        utrustningsgrind("massiv bok", MED_BOK, "bok", "ben av massiv bok")
        utrustningsgrind("björk", MED_BJORK, "björk", "björkram")
        utrustningsgrind("fem lägen", MED_FEM_LAGEN, "fem lägen",
                         "fotstöd i fem lägen")
        utrustningsgrind("golvskydd", MED_GOLVSKYDD, "golvskydd",
                         "justerbara golvskydd")

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
