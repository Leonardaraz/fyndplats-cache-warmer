# -*- coding: utf-8 -*-
"""Grindar för runda 65. Körs mot texter.py INNAN något skrivs till Wix.

De REGLER som gäller varje runda importeras från ../grindar.py — de får inte
finnas i en kopia här. Det som står i den här filen är rundans egna FAKTA.
"""
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from grindar import (TYSKA, HUSMARKEN, LANDORD, ATTRIBUTION, ARTNR, ANKARE,   # noqa: E402
                     FARGORD, pastaenden, strip_taggar, sku_bas,
                     dela_pa_ankare, synlig_meningstext)
from texter import PRODUKTER, bygg                                            # noqa: E402

FEL = []


def fal(kort, vad):
    FEL.append("%s  %s" % (kort, vad))


# ------------------------------------------------------- rundans fakta ---
MAXLAST = {
    "db645ff8": {"120 kg"},
    "88425b27": {"120 kg", "30 kg"},     # stol respektive fotpall
    "03c9d570": {"120 kg"},
    "bb7b7bd4": {"120 kg"},
    "89c89322": {"120 kg"},
    "3dab61f0": {"120 kg", "100 kg"},    # stol respektive fotpall
    "eb400961": {"120 kg"},
    "2823c605": {"150 kg"},
}
# ☠️ 88425b27 anger 10,4 kg i brödtexten och 12 kg i spec-tabellen. Det som
#    är förbjudet är att publicera NÅGOT av de två talen som produktens vikt —
#    inte ordet "väger", som också kan gälla kunden ("om du väger under 30 kg").
VIKT_FORBJUDEN = {"88425b27": ["10,4 kg", "12 kg"]}
VIKT = {
    "db645ff8": "7 kg", "03c9d570": "11 kg", "bb7b7bd4": "10 kg",
    "89c89322": "19,5 kg", "3dab61f0": "18 kg", "eb400961": "19,5 kg",
    "2823c605": "26 kg",
}
# Fåtöljer UTAN justerbar rygg — får inte påstå att ryggen fälls.
UTAN_LIGG = {"88425b27", "03c9d570", "bb7b7bd4", "89c89322", "eb400961"}
FARDIGMONTERAD = {"db645ff8"}

# ☠️ Färgen är avläst ur FOTOT, inte ur feedens Farbe-kolumn (runda 64).
FARG = {
    "db645ff8": {"blå"},
    "88425b27": {"grå"},
    "03c9d570": {"gråbeige", "svart"},
    "bb7b7bd4": {"gräddvit"},
    "89c89322": {"grågrön"},
    "3dab61f0": {"svart"},
    "eb400961": {"svart", "silverfärgad"},
    "2823c605": {"grå"},
}

# ☠️ Påståenden som MÅSTE nå kunden, ordagrant. Det är rundans köpavgörande
#    respektive säkerhetsrelevanta tal.
MASTE_STA = {
    "db645ff8": ["inte en sovplats"],       # 108 cm utfälld är ingen säng
    "88425b27": ["fotpallen 30 kg"],        # två laster, inte en
    "89c89322": ["72 timmar"],              # skummet expanderar efter uppackning
    "3dab61f0": ["100 kg"],                 # ovanligt stark fotpall
    "2823c605": ["80 cm"],                  # väggavståndet är köpavgörande
}

SLUGGAR = {p["slug"]: p for p in PRODUKTER}
SLUG2KORT = {p["slug"]: p["kort"] for p in PRODUKTER}


def kor():
    sedda_sku, sedda_slug = {}, {}

    for p in PRODUKTER:
        k = p["kort"]
        html = bygg(p)
        synlig = strip_taggar(html)
        # ☠️ Påstående-grindarna läser den BLOCKDELADE texten. Utan den blir
        #    hela <ul>-listan en mening, och ett "ingen montering" i en punkt
        #    skuggar varje påstående i alla de andra.
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
        if "artikelnr" in allt or "modellreferens" in allt:
            fal(k, "artikelnummer-etikett")

        # ☠️ En mening med länk är ett påstående om den LÄNKADE produkten.
        #    Lasttal och färgord granskas därför mot RÄTT produkts facit.
        egna, kors = dela_pa_ankare(html)
        rubrikfalt = " ".join([p["name"], p["title"], p["meta"]])
        LAST_RE = r"(?:bär|maxlast|last)[^.]{0,40}?(\d+ kg)"

        for mening in egna + [rubrikfalt]:
            for tal in re.findall(LAST_RE, mening.lower()):
                if tal not in MAXLAST[k]:
                    fal(k, "maxlast %s finns inte i facit %s" % (tal, MAXLAST[k]))
        for mal_sluggar, mening in kors:
            mkn = [SLUG2KORT[s] for s in mal_sluggar if s in SLUG2KORT]
            if not mkn:
                continue
            # ☠️ En mening som länkar till FLERA syskon får nämna allas tal.
            facit = set().union(*(MAXLAST[m] for m in mkn))
            for tal in re.findall(LAST_RE, mening.lower()):
                if tal not in facit:
                    fal(k, "korshänvisning påstår %s om %s, vars facit är %s"
                        % (tal, "/".join(mkn), sorted(facit)))

        # ☠️ Vikten förbjuds bara som ETT TAL. Att uttryckligen avstå från att
        #    ange den är inte samma sak som att ange den.
        if k in VIKT_FORBJUDEN:
            for tal in VIKT_FORBJUDEN[k]:
                if tal.lower() in allt:
                    fal(k, "vikten %s publicerad trots att källan motsäger sig" % tal)
            if any(r.lower().startswith("vikt:") for r in p["spec"]):
                fal(k, "Vikt-rad i spec trots att källan motsäger sig")
        elif VIKT[k].lower() not in allt:
            fal(k, "vikt %s saknas" % VIKT[k])

        if k in UTAN_LIGG and re.search(r"\bfälls till\b|\bliggläge\b|\bfälla ryggen\b", allt):
            fal(k, "påstår liggfunktion utan att ha någon")

        pastar = " ".join(p["eg"] + p["spec"]).lower()
        if k in FARDIGMONTERAD:
            if not re.search(r"färdig|ingen montering|inga verktyg", pastar):
                fal(k, "färdigmonterad nämns inte i egenskaper eller spec")
        elif not re.search(r"monter", pastar):
            fal(k, "monteringen nämns inte i egenskaper eller spec")

        def farggrind(text, facit, agare, varifran):
            for ord_ in FARGORD:
                if ord_ in facit:
                    continue
                # ☠️ Bara HUVUDET i en sammansatt färg får släppas igenom.
                #    `ord_ in b` var för snällt: facit `grågrön` innehåller
                #    `grå`, så salviagröna 89c89322 hade fått kallas grå — och
                #    det är precis felet den här rundan hittade med ögonen.
                #    En sammansättnings SISTA led ÄR färgen; det första
                #    modifierar. `ljusgrå` får alltså kallas grå, `gråbeige`
                #    får kallas beige, men `grågrön` får inte kallas grå.
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

        # ☠️ Rundans egna materialfällor. Ett FÖRNEKANDE är tillåtet.
        for tr, mening in pastaenden(meningstext, re.compile(r"\bbomull\w*", re.I)):
            fal(k, "bomull påstås: %.70s" % mening)
        for tr, mening in pastaenden(meningstext, re.compile(r"massivt trä|massiv björk", re.I)):
            fal(k, "massivt trä påstås om en fanérram: %.70s" % mening)
        # ☠️ 3dab61f0:s egen tekniska not kallar den massagestol. Ingen produkt
        #    i rundan har massagefunktion.
        if re.search(r"\bmassage", allt):
            fal(k, "massage påstås — ingen produkt i rundan har det")
        # ☠️ db645ff8 är 108 cm utfälld. Ett sängpåstående är utelämnat.
        for tr, mening in pastaenden(meningstext, re.compile(r"\b(säng|sovplats|bädd)\w*", re.I)):
            fal(k, "sovplats påstås: %.70s" % mening)
        # Hälsopåstående
        if re.search(r"ryggsm[äa]rt|lindrar|botar|förebygger", allt):
            fal(k, "hälsopåstående")

        for kravd in MASTE_STA.get(k, []):
            if kravd.lower() not in synlig.lower():
                fal(k, "%r saknas i texten" % kravd)

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
        for falt in ("name", "title", "meta"):
            if huvud.lower() not in p[falt].lower():
                fal(k, "fokusordet '%s' saknas i %s" % (huvud, falt))

        vantad = "FP-" + sku_bas(p["slug"])
        if p["sku"] != vantad:
            fal(k, "SKU %s ska vara %s" % (p["sku"], vantad))
        if len(p["sku"]) > 40:
            fal(k, "SKU längre än 40 tecken")
        if p["sku"] in sedda_sku:
            fal(k, "SKU krockar med %s" % sedda_sku[p["sku"]])
        sedda_sku[p["sku"]] = k
        if p["slug"] in sedda_slug:
            fal(k, "slug krockar med %s" % sedda_slug[p["slug"]])
        sedda_slug[p["slug"]] = k

        if len(p["title"]) > 60:
            fal(k, "title %d tecken (max 60)" % len(p["title"]))
        if not (110 <= len(p["meta"]) <= 160):
            fal(k, "meta %d tecken (110–160)" % len(p["meta"]))

    return FEL


if __name__ == "__main__":
    fel = kor()
    for f in fel:
        print("FEL  " + f)
    print("\n%d fel i %d produkter" % (len(fel), len(PRODUKTER)))
    sys.exit(1 if fel else 0)
