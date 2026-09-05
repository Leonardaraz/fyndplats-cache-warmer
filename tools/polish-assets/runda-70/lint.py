# -*- coding: utf-8 -*-
"""Grindar för runda 70. Körs mot texter.py INNAN något skrivs till Wix.

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
J = {"73112149", "5c0e83d1"}                 # konstläder 145°, 360° träfot
L = {"84e3794d"}                             # biofåtölj 160°, fjäderkärna
P = {"021a268e", "266c5e75", "d2409a95"}     # LÖS fotpall, stålfot, INGA grader
Q = {"9bd6d1d4", "566c7702"}                 # 135° steglöst, 360° träfot

# ☠️ Tidigare rundors sidor som den här rundan länkar till. Facit är hämtat ur
#    deras publicerade spec, inte ur minnet — se runda-69/LAGE.md.
EXTERN = {
    "konstladerfatolj-morkgra-145-grader":
        dict(last={"120 kg"}, grad={"145°", "360°"}, farg={"mörkgrå"},
             drag={"inbyggt", "360", "träfot", "lut"}),
    "konstladerfatolj-ljusgra-145-grader":
        dict(last={"120 kg"}, grad={"145°", "360°"}, farg={"ljusgrå"},
             drag={"inbyggt", "360", "träfot", "lut"}),
    "tv-fatolj-brun-med-fotpall":
        dict(last={"120 kg"}, grad={"135°", "360°"}, farg={"brun"},
             drag={"fotpall", "360", "träfot", "lut"}),
    # ⚠️ Den ljusgrå TV-fåtöljen står på en SVART fot, inte på trä — runda 69
    #    mätte upp att syskonen skiljer sig där. Därför inget "träfot" här.
    "tv-fatolj-ljusgra-med-fotpall":
        dict(last={"120 kg"}, grad={"135°", "360°"}, farg={"ljusgrå", "svart"},
             drag={"fotpall", "360", "lut"}),
    "biofatolj-graddvit-160-grader":
        dict(last={"120 kg"}, grad={"160°"}, farg={"gräddvit"},
             drag={"inbyggt", "fjäderkärna", "80 cm", "lut"}),
    "biofatolj-gra-160-grader":
        dict(last={"120 kg"}, grad={"160°"}, farg={"grå"},
             drag={"inbyggt", "fjäderkärna", "80 cm", "lut"}),
    "vilfatolj-svart-155-grader":
        dict(last={"150 kg"}, grad={"155°"}, farg={"svart"},
             drag={"inbyggt", "fjäderkärna", "lut"}),
}

MAXLAST = {}
for _k in J | L:
    MAXLAST[_k] = {"120 kg"}
for _k in P:
    MAXLAST[_k] = {"150 kg", "50 kg"}
for _k in Q:
    MAXLAST[_k] = {"140 kg"}

# ☠️ FAMILJ P HAR EN TOM MÄNGD, OCH DET ÄR HELA POÄNGEN. Källan anger ingen
#    lutningsvinkel och inget varvtal för den — varken i brödtexten, i
#    spec-listan eller i måttritningen. Vilket gradtal som helst i P:s text är
#    alltså påhittat. Samma spärr som runda 68:s familj F.
GRADER = {}
for _k in J:
    GRADER[_k] = {"145°", "360°"}
for _k in L:
    GRADER[_k] = {"160°"}
for _k in P:
    GRADER[_k] = set()
for _k in Q:
    GRADER[_k] = {"135°", "360°"}

# ☠️ Färgen är AVLÄST UR FOTOT, inte ur källans Farbe-kolumn. Två av åtta
#    skiljer sig, och de bär BÅDA namnet "Cremeweiß" i källan.
FARG = {
    "73112149": {"beige"},                  # källan: Cremeweiß (R−B 48, sand)
    "5c0e83d1": {"brun"},
    "84e3794d": {"svart"},                  # median 39 — mörkare än runda 69:s
    "021a268e": {"gräddvit", "svart"},      # källan: Cremeweiß + matt svart fot
    "266c5e75": {"grå"},                    # blank förkromad fot, inget färgord
    "d2409a95": {"mörkgrå", "svart"},       # källan: Dunkelgrau + svart fot
    "9bd6d1d4": {"grå"},
    "566c7702": {"svart"},
}

# ☠️ FÄRGORD SOM ETT ANNAT SYSKON ÄGER ORDAGRANT. Den delade grinden släpper
#    igenom HUVUDET i en sammansättning — "grå" godkänns när facit säger
#    "mörkgrå" — och det är rätt så länge ingen annan produkt heter just det
#    ordet. Familj P har BÅDE en "grå" och en "mörkgrå", och då gör undantaget
#    de två syskonsidorna omöjliga att skilja åt för kunden. Mätt: utan den
#    här raden passerar mutationen "d2409a95 kallas grå som sitt syskon".
RESERVERADE = set()
for _f in FARG.values():
    RESERVERADE |= _f

VIKT = {}
for _k in J:
    VIKT[_k] = "21,5 kg"
VIKT["84e3794d"] = "24 kg"
VIKT["021a268e"] = "22 kg"          # ⚠️ mikrofibersyskonet väger 2 kg mer
VIKT["266c5e75"] = "20 kg"
VIKT["d2409a95"] = "20 kg"
for _k in Q:
    VIKT[_k] = "21 kg"

# ☠️ Påståenden som MÅSTE nå kunden, ordagrant.
MASTE_STA = {}
for _k in J:
    MASTE_STA[_k] = ["145°", "151 cm"]
for _k in L:
    MASTE_STA[_k] = ["160°", "80 cm", "185 cm"]
for _k in P:
    MASTE_STA[_k] = ["150 kg", "93 cm", "55 cm"]
for _k in Q:
    MASTE_STA[_k] = ["135°", "140 kg", "80 cm"]

# Alla åtta fäller ryggen — grinden kräver att var och en SÄGER det.
LUTAR = J | L | P | Q
LUT_RE = re.compile(r"fäller ryggen|ryggen fälls|tillbakalutad|ryggvinkel|"
                    r"ryggen låses", re.I)

MED_FOTPALL = set(P)             # ☠️ bara P har en LÖS pall i Lieferumfang
MED_INBYGGT = J | L | Q          # ☠️ …och de tre andra har fotstödet i stolen
MED_FJADERKARNA = set(L)
MED_360 = J | Q                  # ☠️ P snurrar, men källan ger inget varvtal
MED_VAGG = L | Q                 # källan ger 80 cm väggavstånd bara för L och Q
MED_TRAFOT = J | Q
MED_STALFOT = set(P)

# ☠️ "läder" får stå — men bara i sammansättning. J ÄR konstläder; ingen annan
#    familj i rundan har något lädernära material alls. Ett naket "läder" eller
#    "skinn" som PÅSTÅENDE är fel om alla åtta. Grinden neutraliserar de
#    tillåtna formerna först och kör sedan påstående-regeln på resten, så att
#    ett förnekande ("Nej, det är konstläder") fortfarande går fritt.
TILLATEN_LADER = re.compile(r"konstläder\w*|läderlook\w*|likna(?:r)? läder", re.I)

# ☠️ SAMMA REGEL FÖR SAMMET, och den är rundans andra materialfynd. Källan
#    säger TVÅ olika saker om samma tyg: spec-kolumnen "Samt(100% Polyester)"
#    och brödtexten "Stoffbezug in Samtoptik". När källan motsäger sig själv
#    gäller det svagare påståendet — alltså sammetsLOOK, aldrig sammet.
TILLATEN_SAMMET = re.compile(r"sammetslook\w*|sammetens\b|sammet av naturfiber",
                             re.I)


def kanda_sluggar():
    """Sluggar tidigare rundor faktiskt skrev. En felstavad länk ska fällas."""
    ut = {}
    for f in sorted(glob.glob(os.path.join(os.path.dirname(HAR),
                                           "runda-*", "skrivning.json"))):
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
        # ☠️ Familj P får inte heller bära gradtalet UTSKRIVET.
        if k in P and re.search(r"\d+\s*grader|\bgrader\b", allt):
            fal(k, "gradtal i ord — källan anger ingen vinkel för den här")

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
        utrustningsgrind("80 cm", MED_VAGG, "80 cm", "80 cm väggavstånd")
        utrustningsgrind("träfot", MED_TRAFOT, "träfot", "träfot")
        utrustningsgrind("stålfot", MED_STALFOT, "stålfot", "rund stålfot")

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
