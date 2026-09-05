# -*- coding: utf-8 -*-
"""Grindar för runda 66. Körs mot texter.py INNAN något skrivs till Wix.

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
                     sku_bas, dela_pa_ankare, synlig_meningstext)
from texter import PRODUKTER, bygg, GUNGSPARR                          # noqa: E402

FEL = []


def fal(kort, vad):
    FEL.append("%s  %s" % (kort, vad))


# ------------------------------------------------------- rundans fakta ---
KLUSTER_A = {"e11ad5cc", "74f261ea", "824301a4", "12e50842"}
TRION = {"77a79db3", "c1f860c1", "5b16fea8"}

MAXLAST = {k: {"150 kg"} for k in KLUSTER_A | TRION}
MAXLAST["da6d086a"] = {"120 kg"}

# ☠️ Färgen är AVLÄST UR FOTOT, inte ur feedens Farbe-kolumn. Källan säger
#    "Schwarz" om 74f261ea (mätt L 45 %, alltså mellangrå), "Braun" om
#    824301a4 (L 44 % vid 4 % mättnad) och "Grau" om da6d086a (som är beige).
FARG = {
    "e11ad5cc": {"gräddvit", "ljusbrun"},     # sockeln är ljust orangebrun
    "74f261ea": {"stålgrå", "ljusbrun"},
    "824301a4": {"gråbrun", "brun"},          # klädsel gråbrun, sockel rödbrun
    "12e50842": {"mörkgrå", "ljusbrun"},
    "77a79db3": {"beige"},
    "c1f860c1": {"grå"},
    "5b16fea8": {"mörkblå"},
    "da6d086a": {"beige"},
}

# Vikten får publiceras bara där den har täckning. Trion och da6d086a har den
# BARA i den svenska importraden, utan andra källa — de talen förbjuds.
VIKT = {k: "22 kg" for k in KLUSTER_A}
VIKT_FORBJUDEN = {k: ["50 kg"] for k in TRION}
VIKT_FORBJUDEN["da6d086a"] = ["50,4 kg", "50 kg"]

# ☠️ Påståenden som MÅSTE nå kunden, ordagrant.
MASTE_STA = {k: ["50 cm"] for k in KLUSTER_A}          # väggavståndet
for _k in TRION:
    MASTE_STA[_k] = [GUNGSPARR]                        # ordagrant lika på alla tre
MASTE_STA["da6d086a"] = ["120 kg"]

# Bara trion har mugghållare.
MED_MUGGHALLARE = set(TRION)

SLUG2KORT = {p["slug"]: p["kort"] for p in PRODUKTER}
SLUGGAR = {p["slug"]: p for p in PRODUKTER}


def kor():
    sedda_sku, sedda_slug = {}, {}
    gungtexter = set()

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
        LAST_RE = r"(?:bär|maxlast|last)[^.]{0,40}?(\d+ kg)"

        for mening in egna + [rubrikfalt]:
            for tal in re.findall(LAST_RE, mening.lower()):
                if tal not in MAXLAST[k]:
                    fal(k, "maxlast %s finns inte i facit %s" % (tal, MAXLAST[k]))
        for mal_sluggar, mening in kors:
            mkn = [s2 for s2 in (SLUG2KORT.get(x) for x in mal_sluggar) if s2]
            if not mkn:
                continue
            facit = set().union(*(MAXLAST[m] for m in mkn))
            for tal in re.findall(LAST_RE, mening.lower()):
                if tal not in facit:
                    fal(k, "korshänvisning påstår %s om %s, facit %s"
                        % (tal, "/".join(mkn), sorted(facit)))

        # Vikten
        if k in VIKT:
            if VIKT[k].lower() not in allt:
                fal(k, "vikt %s saknas" % VIKT[k])
        for tal in VIKT_FORBJUDEN.get(k, []):
            # ☠️ ORDGRÄNS. Utan den matchar "50 kg" inuti "150 kg", och grinden
            #    fäller trions maxlast som om den vore en förbjuden egenvikt.
            #    Ett falsklarm som alltid fyrar är lika illa som ett fel ingen ser.
            if re.search(r"(?<![\d,])%s" % re.escape(tal.lower()), allt):
                fal(k, "vikten %s publicerad utan täckning" % tal)

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
            mkn = [s2 for s2 in (SLUG2KORT.get(x) for x in mal_sluggar) if s2]
            if mkn:
                # En mening som länkar till flera syskon får nämna allas färger.
                farggrind(mening, set().union(*(FARG[m] for m in mkn)),
                          "/".join(mkn), "korshänvisningens ")

        # ☠️ Materialfällor. Ett FÖRNEKANDE är tillåtet — "Nej, det är
        #    konstläder" är motsatsen till ett läderpåstående.
        for tr, mening in pastaenden(meningstext, re.compile(r"(?<!konst)\bläder", re.I)):
            fal(k, "läder påstås om en konstläderklädsel: %.70s" % mening)
        for tr, mening in pastaenden(meningstext, re.compile(r"massivt trä|massiv ", re.I)):
            fal(k, "massivt trä påstås: %.70s" % mening)
        for tr, mening in pastaenden(meningstext, re.compile(r"äkta sammet|äkta linne", re.I)):
            fal(k, "äkta naturmaterial påstås: %.70s" % mening)

        # ☠️ Hälsopåståenden. Källan säljer trion mot sömnstörningar och
        #    ammande mödrar; ingenting av det får följa med.
        if re.search(r"sömnstörn|insomn|ammande|amning|lindrar|botar|"
                     r"ryggsm[äa]rt|förebygger|terapeut", allt):
            fal(k, "hälsopåstående")
        if re.search(r"\bmassage", allt):
            fal(k, "massage påstås — ingen produkt i rundan har det")

        # Mugghållare bara där de finns
        if "mugghållare" in allt and k not in MED_MUGGHALLARE:
            fal(k, "mugghållare påstås men produkten har inga")
        if k in MED_MUGGHALLARE and "mugghållare" not in allt:
            fal(k, "mugghållarna nämns inte trots att de är säljargumentet")

        # Monteringen ska nämnas
        pastar = " ".join(p["eg"] + p["spec"]).lower()
        if not re.search(r"monter", pastar):
            fal(k, "monteringen nämns inte i egenskaper eller spec")

        for kravd in MASTE_STA.get(k, []):
            if kravd.lower() not in synlig.lower():
                fal(k, "%r saknas i texten" % kravd[:40])

        # ☠️ Gungsparren ska stå ORDAGRANT likadant på alla tre syskon.
        #    Grinden letar efter VARJE mening som nämner gungfunktionen och
        #    kräver att den bär formuleringen ordagrant. En första version
        #    jämförde meningarna med varandra och fällde på att FAQ-frågan
        #    stod före svaret — den mätte satsgränser, inte formuleringen.
        if k in TRION:
            for m in re.split(r"(?<=[.?!])\s+", synlig):
                if "ungfunktionen" in m and GUNGSPARR not in m:
                    gungtexter.add((k, m.strip()[:90]))

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

        # Svensk sifferstil
        if re.search(r"\d+\.\d", " ".join([p["name"], p["title"], p["meta"], synlig])):
            fal(k, "decimalpunkt i stället för decimalkomma")
        if re.search(r"\d,\s*\d+\s+och\s+\d+\s*(cm|kg|°)", synlig):
            fal(k, "kommalista av tal med enheten sist — använd snedstreck")

    for kort, m in sorted(gungtexter):
        FEL.append("%s  gungfunktionen nämns utan den ordagranna "
                   "formuleringen: %r" % (kort, m))
    return FEL


if __name__ == "__main__":
    fel = kor()
    for f in fel:
        print("FEL  " + f)
    print("\n%d fel i %d produkter" % (len(fel), len(PRODUKTER)))
    sys.exit(1 if fel else 0)
