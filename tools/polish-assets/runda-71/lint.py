# -*- coding: utf-8 -*-
"""Grindar för runda 71. Körs mot texter.py INNAN något skrivs till Wix.

De REGLER som gäller varje runda importeras från ../grindar.py — de får inte
finnas i en kopia här. Det som står i den här filen är rundans egna FAKTA.

☠️ NYTT I DEN HÄR RUNDAN: korshänvisningarna pekar UT ur batchen. Tre av
   fyra familjer stänger en grupp som runda 69 började, så "samma modell finns
   i …" länkar till redan PUBLICERADE sidor. Runda 69:s grind hade fällt varje
   sådan länk som "slug utanför batchen" — och att bara ta bort den kontrollen
   hade lämnat påståendet OGRANSKAT, vilket är värre: en korshänvisning är ett
   påstående om MÅLET. `EXTERN` bär därför målens facit (last, gradtal, färg,
   utrustning) precis som batchens egna, och `KANDA_SLUGGAR` läser tidigare
   rundors `skrivning.json` så att en felstavad slug fortfarande fälls.
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
R = {"d760fffc", "79eaab59", "4b2a7407", "1a1d04f7"}   # konstläder 130°, 360°
S = {"99492092"}                                        # fjäderkärna 145°, 73 cm
T = {"79690bf4"}                                        # smal 69 cm, 135°
U = {"89273d39"}                                        # sammetslook + fotpall, 130°
V = {"9c1889f1"}                                        # gungar, konstläder + fotpall

# ☠️ Tidigare rundors sidor som den här rundan länkar till. Facit hämtat ur
#    deras publicerade spec (runda-70/skrivning.json), inte ur minnet.
EXTERN = {
    "konstladerfatolj-beige-145-grader":
        dict(last={"120 kg"}, grad={"145°", "360°"}, farg={"beige"},
             drag={"inbyggt", "360", "träfot", "lut"}),
    "konstladerfatolj-ljusgra-145-grader":
        dict(last={"120 kg"}, grad={"145°", "360°"}, farg={"ljusgrå"},
             drag={"inbyggt", "360", "träfot", "lut"}),
    "konstladerfatolj-morkgra-145-grader":
        dict(last={"120 kg"}, grad={"145°", "360°"}, farg={"mörkgrå"},
             drag={"inbyggt", "360", "träfot", "lut"}),
}

# ☠️ HELA KVARTETTEN BÄR 120 kg, trots att tre av fyra tyska specar säger 150.
#    De fyra är bevisat samma konstruktion (ordagrant samma brödtext, samma
#    mått ned till ryggstödets 15 mm, samma 22 kg, samma paket), och den enda
#    bild i kvartetten som bär en lastsiffra i pixlarna säger 120 kg. Källan
#    motsäger sig själv → det svagare påståendet gäller, och det är dessutom
#    den enda säkra riktningen på ett bärighetstal. Löser #289.
MAXLAST = {}
for _k in R | S | T:
    MAXLAST[_k] = {"120 kg"}
for _k in U | V:
    MAXLAST[_k] = {"150 kg"}

GRADER = {}
for _k in R:
    GRADER[_k] = {"130°", "360°"}
for _k in S:
    GRADER[_k] = {"145°"}
for _k in T | V:
    GRADER[_k] = {"135°"}
for _k in U:
    GRADER[_k] = {"130°"}

# ☠️ Färgen är AVLÄST UR PIXLARNA. `1a1d04f7` heter "Schwarz" och ÄR svart —
#    men medianen (30 %) hade sagt mörkgrå. Mörkaste decilen (15 %) säger
#    svart, och det är den som mäter materialet på ett blankt läder. Se farg.py.
FARG = {
    "d760fffc": {"beige"},
    "79eaab59": {"grå"},
    "4b2a7407": {"gräddvit"},
    "1a1d04f7": {"svart"},
    "99492092": {"gräddvit"},
    "79690bf4": {"ljusgrå"},
    "89273d39": {"mörkgrå"},
    "9c1889f1": {"gräddvit", "mörkröd"},   # klädseln respektive träfoten
}

# ☠️ Färgord som ETT ANNAT syskon i batchen äger ordagrant. Utan den här raden
#    släpper den delade grinden igenom HUVUDET i en sammansättning — "grå" när
#    facit säger "mörkgrå" — och kvartettens grå blir omöjlig att skilja från
#    rundans mörkgrå och ljusgrå. Runda 70:s lagning, oförändrad.
RESERVERADE = set()
for _f in FARG.values():
    RESERVERADE |= _f

VIKT = {}
for _k in R:
    VIKT[_k] = "22 kg"
VIKT["99492092"] = "27,5 kg"
VIKT["79690bf4"] = "26 kg"
VIKT["89273d39"] = "21 kg"
VIKT["9c1889f1"] = "22 kg"

# ☠️ Påståenden som MÅSTE nå kunden, ordagrant.
MASTE_STA = {}
for _k in R:
    MASTE_STA[_k] = ["130°", "120 kg", "134 cm"]
for _k in S:
    MASTE_STA[_k] = ["145°", "185 cm", "158 cm"]
for _k in T:
    MASTE_STA[_k] = ["135°", "69 cm", "156,5 cm"]
for _k in U:
    MASTE_STA[_k] = ["130°", "150 kg", "114 cm"]
for _k in V:
    MASTE_STA[_k] = ["135°", "150 kg", "107 cm"]

LUTAR = R | S | T | U | V
LUT_RE = re.compile(r"fäller ryggen|ryggen fälls|tillbakalutad|ryggvinkel|"
                    r"ryggen låses|ryggen ställs", re.I)

MED_FOTPALL = U | V              # ☠️ bara U och V har en LÖS pall
MED_INBYGGT = R | S | T          # …och de tre andra har fotstödet i stolen
MED_FJADERKARNA = set(S)
MED_360 = set(R)                 # källan ger vridfot bara för kvartetten
MED_VAGG80 = set(R)              # ☠️ R har 80 cm, U och V har 50 — olika tal
MED_VAGG50 = U | V
MED_GUNG = set(V)                # bara V:s källa säger `Schaukelbewegung`
MED_TRAFOT = set(V)              # V:s mörkröda underrede; J-sidorna via EXTERN

TILLATEN_LADER = re.compile(r"konstläder\w*|läderlook\w*|likna(?:r)? läder", re.I)
TILLATEN_SAMMET = re.compile(r"sammetslook\w*|sammetens\b|sammet av naturfiber",
                             re.I)


def kanda_sluggar():
    """Sluggar tidigare rundor faktiskt skrev. En felstavad länk ska fällas."""
    ut = {}
    for f in sorted(glob.glob(os.path.join(os.path.dirname(HAR),
                                           "runda-*", "skrivning.json"))):
        # ☠️ Hoppa över DEN EGNA rundan. skrivning.py skriver hit, så en
        #    andra körning hade annars fällt varenda slug som "redan skriven
        #    i runda-71" — grinden förgiftar sig själv precis som
        #    byggfiltret i vercel.json gjorde. En grind som lyser rött på
        #    korrekt arbete lär läsaren att sluta läsa den.
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
    """Facit för en korshänvisning — batchens egna OCH de publicerade."""
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
    """Har NÅGOT av länkmålen den här egenskapen?"""
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

    # ☠️ Facit för en PUBLICERAD sida är värdelöst om sidan inte finns. Varje
    #    EXTERN-nyckel måste kunna kvitteras mot en tidigare rundas
    #    skrivning.json — annars är korshänvisningen en länk till ingenting,
    #    och grinden hade granskat ett påstående om en sida som aldrig skrevs.
    for s in sorted(EXTERN):
        if s not in KANDA:
            fal("EXTERN", "%s står i EXTERN men ingen runda har skrivit den" % s)

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

        # ☠️ En mening med länk är ett påstående om den LÄNKADE produkten.
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

        # Vikten
        if VIKT[k].lower() not in allt:
            fal(k, "vikt %s saknas" % VIKT[k])
        for annan in set(VIKT.values()) - {VIKT[k]}:
            # ☠️ ORDGRÄNS. Utan den matchar "20 kg" inuti "120 kg".
            if re.search(r"(?<![\d,])%s" % re.escape(annan.lower()), allt):
                fal(k, "annan produkts egenvikt %s publicerad" % annan)

        # Färgorden — bara HUVUDET i en sammansättning får släppas igenom.
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

        # ☠️ Materialfällor. Ett FÖRNEKANDE är tillåtet.
        for tr, mening in pastaenden(TILLATEN_LADER.sub(" ", meningstext),
                                     re.compile(r"\bläder|\bskinn", re.I)):
            fal(k, "läder eller skinn påstås om en väv: %.70s" % mening)
        for tr, mening in pastaenden(TILLATEN_SAMMET.sub(" ", meningstext),
                                     re.compile(r"\bsammet", re.I)):
            fal(k, "sammet påstås naket om en sammetslook-väv: %.70s" % mening)
        for tr, mening in pastaenden(meningstext,
                                     re.compile(r"massivt trä|massiv ", re.I)):
            fal(k, "massivt trä påstås: %.70s" % mening)
        for tr, mening in pastaenden(meningstext,
                                     re.compile(r"\bbomull|äkta linne|"
                                                r"äkta sammet|äkta chenille", re.I)):
            fal(k, "naturmaterial påstås: %.70s" % mening)

        # Hälsopåståenden
        if re.search(r"spänningar|värk|smärt|lindrar|botar|läker|terapeut|"
                     r"sömnstörn|insomn|ammande|amning|förebygger|blodcirk",
                     allt):
            fal(k, "hälsopåstående")
        if re.search(r"\bmassage", allt):
            fal(k, "massage påstås — ingen produkt i rundan har det")

        # ☠️ Utrustningsgrinden är KORSHÄNVISNINGSMEDVETEN (runda 67) och
        #    sedan runda 70 också MEDVETEN OM PUBLICERADE MÅL.
        def utrustningsgrind(stam, agare, drag, vad):
            egen = (pastar_i_listan(egna, stam)
                    or stam in rubrikfalt.lower())
            if egen and k not in agare:
                fal(k, "%s påstås men produkten har ingen" % vad)
            if k in agare and not egen:
                fal(k, "%s nämns inte trots att den är säljargumentet" % vad)
            for mal_sluggar, mening in kors:
                if not kant_mal(mal_sluggar):
                    continue
                if stam in mening.lower() and not har_drag(mal_sluggar, drag,
                                                           agare):
                    fal(k, "korshänvisningen påstår %s om %s, som inte har det"
                        % (vad, "/".join(kant_mal(mal_sluggar))))

        for mening in egna:
            if LUT_RE.search(mening) and k not in LUTAR:
                fal(k, "ryggfällning påstås men produkten har fast rygg: %.60s"
                    % mening)
        if k in LUTAR and not any(LUT_RE.search(m) for m in egna):
            fal(k, "ryggfällningen nämns inte trots att den är säljargumentet")
        for mal_sluggar, mening in kors:
            if not kant_mal(mal_sluggar):
                continue
            if LUT_RE.search(mening) and not har_drag(mal_sluggar, "lut", LUTAR):
                fal(k, "korshänvisningen påstår ryggfällning om %s, som har "
                       "fast rygg" % "/".join(kant_mal(mal_sluggar)))

        utrustningsgrind("fotpall", MED_FOTPALL, "fotpall", "lös fotpall")
        utrustningsgrind("inbyggt", MED_INBYGGT, "inbyggt", "inbyggt fotstöd")
        utrustningsgrind("fjäderkärna", MED_FJADERKARNA, "fjäderkärna",
                         "fjäderkärna")
        utrustningsgrind("360", MED_360, "360", "360° vridfot")
        # ☠️ TVÅ väggavstånd i samma runda: 80 cm för kvartetten, 50 cm för de
        #    två med fotpall. En gemensam "väggavstånd"-grind hade godkänt fel
        #    tal på rätt produkt — talet ÄR påståendet här.
        # ⚠️ STAMMEN MÅSTE VARA "N cm fritt", inte "N cm". Familj U har ett
        #    ryggstöd som ÄR 80 cm högt, och en grind på bara talet fällde den
        #    för ett väggavstånd den aldrig påstod. Talet ensamt är inte
        #    påståendet — det är talet PLUS vad det mäter.
        utrustningsgrind("80 cm fritt", MED_VAGG80, "80 cm fritt",
                         "80 cm väggavstånd")
        utrustningsgrind("50 cm fritt", MED_VAGG50, "50 cm fritt",
                         "50 cm väggavstånd")
        utrustningsgrind("gungar", MED_GUNG, "gungar", "gungfunktion")
        utrustningsgrind("träfot", MED_TRAFOT, "träfot", "träfot")

        # Monteringen ska nämnas på alla åtta.
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
                # ☠️ Facit finns — men sidan måste också bevisligen finnas.
                if mal not in KANDA:
                    fal(k, "EXTERN-slug som ingen runda har skrivit: %s" % mal)
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
            fal(k, "titeln är identisk med namnet — storefronten lägger på suffix")
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
