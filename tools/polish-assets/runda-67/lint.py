# -*- coding: utf-8 -*-
"""Grindar för runda 67. Körs mot texter.py INNAN något skrivs till Wix.

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
from texter import PRODUKTER, bygg                                    # noqa: E402

FEL = []


def fal(kort, vad):
    FEL.append("%s  %s" % (kort, vad))


# ------------------------------------------------------- rundans fakta ---
B = {"04feb176", "6a4e92c4"}      # reclinerfåtölj, lös fotpall, 130°
C = {"ceae31c1", "1b39b14e"}      # tv-fåtölj i chenille, inbyggt fotstöd
D = {"7f437bac", "87262869"}      # vilfåtölj, fotpall med förvaring
E = {"9794b6df", "9946e1eb"}      # relaxfåtölj, 160 kg / 20 kg

# ☠️ Varje lasttal som FÅR stå på produkten. Fotpallens tal hör hit också —
#    E:s 20 kg är rundans farligaste siffra och måste gå att pröva.
MAXLAST = {}
for _k in B | C:
    MAXLAST[_k] = {"150 kg"}
for _k in D:
    MAXLAST[_k] = {"120 kg", "100 kg"}
for _k in E:
    MAXLAST[_k] = {"160 kg", "20 kg"}

# ☠️ Färgen är AVLÄST UR FOTOT, inte ur källans Farbe-kolumn. Källan säger
#    "Hellgrau" om ceae31c1 (matt chenille, mätt L 43 % — en vanlig mellangrå)
#    och "Cremeweiß" om 1b39b14e (mätt L 73 % mot syskonens L 85–94 %).
FARG = {
    "04feb176": {"svart", "mörkbrun"},
    "6a4e92c4": {"gräddvit", "mörkbrun"},
    "ceae31c1": {"grå"},
    "1b39b14e": {"beige"},
    "7f437bac": {"mörkgrå", "ljusbrun"},
    "87262869": {"gräddvit", "ljusbrun"},
    "9794b6df": {"svart", "mörkbrun"},
    "9946e1eb": {"gräddvit", "mörkbrun"},
}

# Alla åtta väger 24 kg utom C-paret. Talet finns i importraden OCH stöds av
# paketmåtten, så det får publiceras.
VIKT = {}
for _k in B | D | E:
    VIKT[_k] = "24 kg"
for _k in C:
    VIKT[_k] = "44,3 kg"

# ☠️ Påståenden som MÅSTE nå kunden, ordagrant.
MASTE_STA = {}
for _k in B:
    MASTE_STA[_k] = ["40 cm", "130°"]        # väggavstånd + ryggvinkel
for _k in C:
    MASTE_STA[_k] = ["30 cm", "190 cm"]      # väggavstånd + kroppslängd
for _k in D:
    MASTE_STA[_k] = ["40 × 34", "6 cm"]      # förvaringsfackets yta och djup
for _k in E:
    MASTE_STA[_k] = ["20 kg"]                # ☠️ fotpallens last

# Bara C har sidofickor, gungfunktion och inbyggt fotstöd.
MED_FICKOR = set(C)
MED_GUNGNING = set(C)
# Bara B och C har fjäderkärna.
MED_FJADERKARNA = B | C
# Bara D har förvaring i fotpallen.
MED_FORVARING = set(D)
# ☠️ Bara B, C och D har en uppmätt 360°. E:s källa säger "i alla riktningar".
MED_360 = B | C | D

SLUG2KORT = {p["slug"]: p["kort"] for p in PRODUKTER}
SLUGGAR = {p["slug"]: p for p in PRODUKTER}


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

        for mening in egna + [rubrikfalt]:
            for tal in re.findall(LAST_RE, mening.lower()):
                if tal not in MAXLAST[k]:
                    fal(k, "maxlast %s finns inte i facit %s"
                        % (tal, sorted(MAXLAST[k])))
        for mal_sluggar, mening in kors:
            mkn = [s2 for s2 in (SLUG2KORT.get(x) for x in mal_sluggar) if s2]
            if not mkn:
                continue
            facit = set().union(*(MAXLAST[m] for m in mkn))
            for tal in re.findall(LAST_RE, mening.lower()):
                if tal not in facit:
                    fal(k, "korshänvisning påstår %s om %s, facit %s"
                        % (tal, "/".join(mkn), sorted(facit)))

        # Vikten — exakt ett tal per produkt, och inga andra kg utan täckning.
        if VIKT[k].lower() not in allt:
            fal(k, "vikt %s saknas" % VIKT[k])
        for annan in set(VIKT.values()) - {VIKT[k]}:
            # ☠️ ORDGRÄNS. Utan den matchar "24 kg" inuti "124 kg".
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
            mkn = [s2 for s2 in (SLUG2KORT.get(x) for x in mal_sluggar) if s2]
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
        for tr, mening in pastaenden(meningstext,
                                     re.compile(r"äkta sammet|äkta linne|"
                                                r"äkta chenille", re.I)):
            fal(k, "äkta naturmaterial påstås: %.70s" % mening)

        # ☠️ Hälsopåståenden. Källan säljer C mot "spänningar efter en
        #    stressig dag"; ingenting av det får följa med.
        if re.search(r"spänningar|värk|smärt|lindrar|botar|läker|terapeut|"
                     r"sömnstörn|insomn|ammande|amning|förebygger|blodcirk",
                     allt):
            fal(k, "hälsopåstående")
        if re.search(r"\bmassage", allt):
            fal(k, "massage påstås — ingen produkt i rundan har det")

        # ☠️ Utrustningsgrinden måste vara KORSHÄNVISNINGSMEDVETEN, precis som
        #    färg- och lastgrinden. Runda 67 byggde den först på hela texten
        #    och fick fyra falsklarm: "…och gungar dessutom" i en LÄNKAD mening
        #    är ett påstående om syskonet, inte om den här produkten. En grind
        #    som fyrar på en korrekt text lär mottagaren att sluta läsa.
        #
        # ⚠️ Stammen måste tåla BÖJNING. Första versionen sökte "sidoficka" och
        #    missade "sidofickor" — grinden sa "nämns inte" om en text där de
        #    står i varje stycke.
        def utrustningsgrind(stam, agare, vad):
            egen = any(stam in m.lower() for m in egna + [rubrikfalt])
            if egen and k not in agare:
                fal(k, "%s påstås men produkten har ingen" % vad)
            if k in agare and not egen:
                fal(k, "%s nämns inte trots att den är säljargumentet" % vad)
            for mal_sluggar, mening in kors:
                mkn = [s2 for s2 in (SLUG2KORT.get(x) for x in mal_sluggar) if s2]
                if mkn and stam in mening.lower() and not (set(mkn) & agare):
                    fal(k, "korshänvisningen påstår %s om %s, som inte har det"
                        % (vad, "/".join(mkn)))

        utrustningsgrind("sidofick", MED_FICKOR, "sidofickor")
        utrustningsgrind("gungar", MED_GUNGNING, "gungfunktion")
        utrustningsgrind("fjäderkärna", MED_FJADERKARNA, "fjäderkärna")
        utrustningsgrind("förvaringsfack", MED_FORVARING, "förvaring")
        # ☠️ 360° bara där källan anger en gradsiffra. E:s källa säger bara
        #    "i alla riktningar" — en gradsiffra där vore påhittad precision.
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

        # Svensk sifferstil
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
