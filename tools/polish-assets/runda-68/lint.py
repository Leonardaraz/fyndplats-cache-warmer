# -*- coding: utf-8 -*-
"""Grindar för runda 68. Körs mot texter.py INNAN något skrivs till Wix.

De REGLER som gäller varje runda importeras från ../grindar.py — de får inte
finnas i en kopia här. Det som står i den här filen är rundans egna FAKTA.
"""
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
F = {"8ca7b3c3", "79797c9a"}      # loungefåtölj, LUTAR INTE, 120 kg
G = {"9a2f6417", "dfb7fcbe"}      # läsfåtölj 160°, inbyggt fotstöd, ingen pall
H = {"fbba0de8", "99e2d675"}      # gungfåtölj 135° + fotpall, gungar
I = {"07d52f21", "ed930c42"}      # biofåtölj 130° + fotpall, 360°, 80 cm vägg

MAXLAST = {}
for _k in F:
    MAXLAST[_k] = {"120 kg"}
for _k in G | H | I:
    MAXLAST[_k] = {"150 kg"}

# ☠️ RUNDANS FARLIGASTE GRIND. Källan ger familj F INGEN ryggvinkel — den är
#    en loungefåtölj med fast rygg. De tre andra familjerna ÄR recliners, så
#    ett gradtal på F vore lätt att skriva och omöjligt att upptäcka i efterhand.
#    Grinden listar varje gradtal som får stå, och 360° är en SNURR, inte en lutning.
GRADER = {}
for _k in F:
    GRADER[_k] = {"360°"}
for _k in G:
    GRADER[_k] = {"160°"}
for _k in H:
    GRADER[_k] = {"135°"}
for _k in I:
    GRADER[_k] = {"130°", "360°"}

# ☠️ Färgen är AVLÄST UR FOTOT, inte ur källans Farbe-kolumn. Fyra av åtta
#    skiljer sig: se LAGE.md för mätningen bakom var och en.
FARG = {
    "8ca7b3c3": {"ljusgrå", "svart"},     # källan: Cremeweiß (mätt neutral)
    "79797c9a": {"blå", "svart"},
    "9a2f6417": {"grå"},                  # källan: Dunkelgrau (mätt L 59 %)
    "dfb7fcbe": {"ljusbeige"},            # källan: Beige (mätt L 90 %)
    "fbba0de8": {"gräddvit", "ljusbrun"},
    "99e2d675": {"svart", "ljusbrun"},
    "07d52f21": {"svart", "ljusbrun"},
    "ed930c42": {"gråbrun", "mörkbrun"},  # källan: Braun (mätt H 20 vid S 4 %)
}

VIKT = {}
for _k in F:
    VIKT[_k] = "23,5 kg"
for _k in G:
    VIKT[_k] = "43 kg"
for _k in H:
    VIKT[_k] = "22 kg"
VIKT["07d52f21"] = "26 kg"
VIKT["ed930c42"] = "23,5 kg"    # ⚠️ samma tal som familj F — och det är rätt.

# ☠️ Påståenden som MÅSTE nå kunden, ordagrant.
MASTE_STA = {}
for _k in F:
    MASTE_STA[_k] = ["120 kg", "41–45 cm"]
for _k in G:
    MASTE_STA[_k] = ["160°", "185 cm"]
for _k in H:
    MASTE_STA[_k] = ["50 cm", "135°"]
for _k in I:
    MASTE_STA[_k] = ["80 cm", "130°"]

# ☠️ Gradtalsgrinden räcker INTE. Runda 68:s mutationstest visade att familj F
#    kunde påstå "fäller ryggen bakåt" helt utan siffra — och vara lika falsk.
#    Den här grinden tar själva HANDLINGEN. Mönstret är avsiktligt snävt: bara
#    de påstående-formerna, så att F:s egna "går ryggen att fälla?" och "vill du
#    ha en rygg som går att fälla" inte fastnar. De är fråga och hänvisning,
#    inte påståenden om den här stolen.
LUTAR = G | H | I
LUT_RE = re.compile(r"fäller ryggen|ryggen fälls|tillbakalutad|ryggvinkel", re.I)

MED_FOTPALL = F | H | I          # ☠️ G har inbyggt fotstöd och INGEN lös pall
MED_GUNGNING = set(H)
MED_FJADERKARNA = set(G)
MED_360 = F | I

SLUG2KORT = {p["slug"]: p["kort"] for p in PRODUKTER}
SLUGGAR = {p["slug"]: p for p in PRODUKTER}
GRAD_RE = re.compile(r"\d+°")


def kor():
    sedda_sku, sedda_slug = {}, {}

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

        def malen(mal_sluggar):
            return [s2 for s2 in (SLUG2KORT.get(x) for x in mal_sluggar) if s2]

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
            mkn = malen(mal_sluggar)
            if not mkn:
                continue
            facit = set().union(*(MAXLAST[m] for m in mkn))
            for tal in re.findall(LAST_RE, mening.lower()):
                if tal not in facit:
                    fal(k, "korshänvisning påstår %s om %s, facit %s"
                        % (tal, "/".join(mkn), sorted(facit)))
            gfacit = set().union(*(GRADER[m] for m in mkn))
            for grad in GRAD_RE.findall(mening):
                if grad not in gfacit:
                    fal(k, "korshänvisning påstår %s om %s, facit %s"
                        % (grad, "/".join(mkn), sorted(gfacit)))

        # Vikten
        if VIKT[k].lower() not in allt:
            fal(k, "vikt %s saknas" % VIKT[k])
        for annan in set(VIKT.values()) - {VIKT[k]}:
            # ☠️ ORDGRÄNS. Utan den matchar "22 kg" inuti "122 kg".
            if re.search(r"(?<![\d,])%s" % re.escape(annan.lower()), allt):
                fal(k, "annan produkts egenvikt %s publicerad" % annan)

        # Färgorden — bara HUVUDET i en sammansättning får släppas igenom.
        def farggrind(text, facit, agare, varifran):
            for ord_ in FARGORD:
                if ord_ in facit:
                    continue
                if any(b.endswith(ord_) and ord_ != b for b in facit):
                    continue
                if re.search(r"(?<![a-zåäö])%s(?![a-zåäö])" % ord_, text.lower()):
                    fal(k, "%sfärgord '%s' stämmer inte mot %s facit %s"
                        % (varifran, ord_, agare, sorted(facit)))

        for mening in egna + [rubrikfalt]:
            farggrind(mening, FARG[k], k, "")
        for mal_sluggar, mening in kors:
            mkn = malen(mal_sluggar)
            if mkn:
                farggrind(mening, set().union(*(FARG[m] for m in mkn)),
                          "/".join(mkn), "korshänvisningens ")

        # ☠️ Materialfällor. Ett FÖRNEKANDE är tillåtet.
        for tr, mening in pastaenden(meningstext,
                                     re.compile(r"(?<!konst)\bläder", re.I)):
            fal(k, "läder påstås om en konstläderklädsel: %.70s" % mening)
        for tr, mening in pastaenden(meningstext,
                                     re.compile(r"massivt trä|massiv ", re.I)):
            fal(k, "massivt trä påstås: %.70s" % mening)
        # ☠️ Källan kallar F:s rygg `Baumwoll…` och G:s tyg `Baumwoll-Leinen`,
        #    men båda materialraderna är helsyntet. Inget bomulls- eller
        #    linnepåstående får följa med.
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

        # ☠️ Utrustningsgrinden är KORSHÄNVISNINGSMEDVETEN (runda 67).
        #    Stammen måste tåla böjning: "fotpall" täcker "fotpallen/fotpallar".
        def utrustningsgrind(stam, agare, vad):
            # ☠️ Ett FÖRNEKANDE är inget påstående. Familj G har ingen lös
            #    fotpall och säger det rakt ut i sin FAQ; den meningen får
            #    inte fälla grinden. Regeln delas med materialgrinden.
            # ⚠️ `rubrikfalt` får INTE ligga i samma lista som meningarna.
            #    Den blir då "nästa mening" efter en avslutande FAQ-fråga och
            #    ger frågan ett sammanhang som inte finns — samma fel som
            #    ovan, en nivå upp. Namn, titel och meta är påståendeytor
            #    utan förnekanden och prövas för sig.
            egen = (pastar_i_listan(egna, stam)
                    or stam in rubrikfalt.lower())
            if egen and k not in agare:
                fal(k, "%s påstås men produkten har ingen" % vad)
            if k in agare and not egen:
                fal(k, "%s nämns inte trots att den är säljargumentet" % vad)
            for mal_sluggar, mening in kors:
                mkn = malen(mal_sluggar)
                if mkn and stam in mening.lower() and not (set(mkn) & agare):
                    fal(k, "korshänvisningen påstår %s om %s, som inte har det"
                        % (vad, "/".join(mkn)))

        # ☠️ Bara de tre reclinerfamiljerna får påstå att ryggen fälls.
        for mening in egna:
            if LUT_RE.search(mening) and k not in LUTAR:
                fal(k, "ryggfällning påstås men produkten har fast rygg: %.60s"
                    % mening)
        if k in LUTAR and not any(LUT_RE.search(m) for m in egna):
            fal(k, "ryggfällningen nämns inte trots att den är säljargumentet")
        for mal_sluggar, mening in kors:
            mkn = malen(mal_sluggar)
            if mkn and LUT_RE.search(mening) and not (set(mkn) & LUTAR):
                fal(k, "korshänvisningen påstår ryggfällning om %s, som har "
                       "fast rygg" % "/".join(mkn))

        utrustningsgrind("fotpall", MED_FOTPALL, "lös fotpall")
        utrustningsgrind("gungar", MED_GUNGNING, "gungfunktion")
        utrustningsgrind("fjäderkärna", MED_FJADERKARNA, "fjäderkärna")
        utrustningsgrind("360", MED_360, "360°")

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
            if mal not in SLUGGAR:
                fal(k, "länk till slug utanför batchen: %s" % mal)
            elif mal == p["slug"]:
                fal(k, "länk till sig själv")

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
