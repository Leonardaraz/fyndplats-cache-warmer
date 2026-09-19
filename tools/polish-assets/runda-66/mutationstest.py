# -*- coding: utf-8 -*-
"""Mutationstest för runda 66.

☠️ En grind som säger "0 fel" har bevisat ingenting förrän den bevisligen kan
FÄLLA. Varje rad nedan inför EN defekt och kräver att rätt grind fyrar.

⚠️ En mutation måste vara EN ÄKTA DEFEKT. Runda 65 hade fyra som tog bort ett
   faktum från EN bärare medan tre andra hade kvar det — grinden svarade rätt
   och mutationen var fel. Därför finns `falt="*"` och `kort="*"`: de tar bort
   påståendet ur ALLA fält respektive ALLA produkter.
"""
import copy
import os
import re
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

import lint                                                           # noqa: E402
import texter                                                         # noqa: E402

SKYDDADE = {"kort", "id"}


def byt_i(v, gammalt, nytt):
    """Byter rekursivt i strängar, listor och tupler."""
    if isinstance(v, str):
        return v.replace(gammalt, nytt)
    if isinstance(v, list):
        return [byt_i(x, gammalt, nytt) for x in v]
    if isinstance(v, tuple):
        return tuple(byt_i(x, gammalt, nytt) for x in v)
    return v


def satt(p, falt, gammalt, nytt):
    if falt == "*":
        for f in p:
            if f not in SKYDDADE:
                p[f] = byt_i(p[f], gammalt, nytt)
    else:
        p[falt] = byt_i(p[falt], gammalt, nytt)


# (beskrivning, kort, fält, gammalt, nytt, ord som MÅSTE stå i felet)
MUTATIONER = [
    # --- färgen, rundans dyraste fynd ---
    ("74f261ea kallas svart, som källan felaktigt säger",
     "74f261ea", "*", "stålgrå", "svart", "färgord"),
    ("da6d086a kallas grå, som den svenska spec-raden felaktigt säger",
     "da6d086a", "*", "beige", "grå", "färgord"),
    ("824301a4 kallas svart",
     "824301a4", "*", "gråbrun", "svart", "färgord"),
    ("5b16fea8 kallas grön",
     "5b16fea8", "*", "mörkblå", "grön", "färgord"),
    ("korshänvisningen ger 74f261ea fel färg",
     "e11ad5cc", "*", ">stålgrå<", ">svart<", "korshänvisningens"),

    # --- lasttal ---
    ("kluster A får 180 kg i maxlast", "*", "*", "150 kg", "180 kg", "maxlast"),
    ("da6d086a får trions maxlast", "da6d086a", "*", "120 kg", "150 kg", "maxlast"),

    # --- vikt utan täckning ---
    ("trions ogrundade egenvikt publiceras",
     "77a79db3", "spec", "Montering: cirka", "Vikt: 50 kg, Montering: cirka",
     "utan täckning"),
    ("da6d086a:s ogrundade egenvikt publiceras",
     "da6d086a", "spec", "Färg: beige", "Vikt: 50,4 kg", "utan täckning"),
    ("kluster A tappar sin BELAGDA vikt", "*", "*", "22 kg", "", "vikt 22 kg saknas"),

    # --- säkerhetsrelevanta villkor som måste nå kunden ---
    ("väggavståndet försvinner ur kluster A", "*", "*", "50 cm", "", "'50 cm'"),
    # ⚠️ Mutationen måste PARAFRASERA, inte radera. Raderas meningen helt
    #    fångas det av MASTE_STA; det realistiska felet är att någon skriver
    #    om den, och det är den omskrivningen grinden ska se.
    ("gungsparren parafraseras i villkorsblocket",
     "c1f860c1", "villkor", texter.GUNGSPARR,
     "Gungfunktionen går bra att använda i alla lägen.", "ordagranna"),
    ("gungsparren parafraseras i FAQ:n",
     "5b16fea8", "faq", texter.GUNGSPARR,
     "Gungfunktionen fungerar även med ryggen nerfälld.", "ordagranna"),

    # --- material ---
    ("konstlädret kallas läder", "*", "*", "konstläder", "läder", "läder påstås"),
    ("sammetslooken kallas äkta sammet",
     "da6d086a", "*", "sammetslook", "äkta sammet", "äkta naturmaterial"),
    ("plywooden kallas massivt trä",
     "e11ad5cc", "*", "plywood", "massivt trä", "massivt trä"),

    # --- hälsopåståenden, det källan faktiskt säger ---
    ("källans sömnpåstående följer med",
     "77a79db3", "eg", "Snurrar runt och gungar mjukt fram och tillbaka",
     "Gungningen hjälper vid sömnstörningar", "hälsopåstående"),
    ("källans amningspåstående följer med",
     "c1f860c1", "ingress", "Den snurrar", "Perfekt för ammande mödrar. Den snurrar",
     "hälsopåstående"),
    ("massage påstås", "da6d086a", "eg", "Snurrar 360° och gungar mjukt",
     "Inbyggd massage i ryggen", "massage"),

    # --- utrustning som inte finns ---
    ("mugghållare påstås på en fåtölj utan",
     "e11ad5cc", "eg", "Halkfria tassar under sockeln skyddar golvet",
     "Mugghållare i båda armstöden", "har inga"),
    # ☠️ .replace är versalkänsligt: "Mugghållare:" i spec-tabellen överlevde,
    #    så grinden såg ordet kvar och hade RÄTT. Mutationen bet bara halvt.
    ("trions mugghållare försvinner helt",
     "77a79db3", "*", "ugghållare", "idoficka", "nämns inte"),

    # --- husets ordlistor ---
    ("tyskt ord i texten", "e11ad5cc", "eg", "Bär 150 kg", "Belastbarkeit 150 kg", "tyskt ord"),
    ("husmärke i texten", "77a79db3", "ingress", "En djupt", "En HOMCOM-djupt", "husmärke"),
    ("land utskrivet", "12e50842", "ingress", "En reclinerfåtölj",
     "Skickas från Tyskland. En reclinerfåtölj", "land utskrivet"),
    ("attribution mot kunden", "da6d086a", "faq", "Nej, det är sammetslook",
     "Leverantören uppger att det är sammetslook", "attribution"),
    ("artikelnummer i texten", "824301a4", "spec", "Montering: krävs",
     "Artikelnummer: 839-835V01CG", "artikelnummer"),

    # --- struktur och SEO ---
    ("två produkter får samma slug",
     "12e50842", "slug", "reclinerfatolj-morkgra-konstlader",
     "reclinerfatolj-graddvit-konstlader", "krockar"),
    ("slugen får svenska tecken", "c1f860c1", "slug", "gungande-tv-fatolj-gra",
     "gungande-tv-fåtölj-grå", "ASCII"),
    ("titeln blir identisk med namnet", "5b16fea8", "title",
     "Gungande tv-fåtölj med mugghållare, mörkblå | Fyndplats",
     "Gungande tv-fåtölj med två mugghållare och fotstöd – mörkblå", "identisk"),
    ("metan blir för kort", "e11ad5cc", "meta",
     "Reclinerfåtölj i gräddvit konstläder med ryggen fällbar till 135°, "
     "utfällbart fotstöd och 360° snurrfot. Bär 150 kg. Behöver 50 cm bakom sig.",
     "Reclinerfåtölj i konstläder.", "meta"),
    ("namnet blir för långt", "da6d086a", "name",
     "Reclinerfåtölj i sammetslook med 360° snurr och gungning – beige",
     "Reclinerfåtölj i sammetslook med 360° snurr och gungning samt fjäderkärna "
     "under sitsen och utdragbart fotstöd – beige", "max 80"),
    ("montering nämns inte", "*", "*", "Montering", "Leverans", "monteringen nämns inte"),
    ("länk till sig själv", "e11ad5cc", "faq",
     "reclinerfatolj-stalgra-konstlader", "reclinerfatolj-graddvit-konstlader",
     "sig själv"),
    ("länk ut ur batchen", "77a79db3", "faq",
     "gungande-tv-fatolj-gra", "nagon-annan-produkt", "utanför batchen"),
    ("decimalpunkt i stället för komma", "da6d086a", "spec",
     "49,5 cm", "49.5 cm", "decimalpunkt"),
]


def kor_en(beskrivning, kort, falt, gammalt, nytt, vantat):
    prod = copy.deepcopy(texter.PRODUKTER)
    rord = False
    for p in prod:
        if kort not in ("*", p["kort"]):
            continue
        fore = repr(p)
        satt(p, falt, gammalt, nytt)
        if repr(p) != fore:
            rord = True
    if not rord:
        return "MUTATIONEN BET INTE — texten innehåller inte %r" % gammalt
    lint.PRODUKTER = prod
    lint.SLUG2KORT = {p["slug"]: p["kort"] for p in prod}
    lint.SLUGGAR = {p["slug"]: p for p in prod}
    lint.FEL = []
    fel = lint.kor()
    if not fel:
        return "INGEN GRIND FÄLLDE"
    if not any(vantat.lower() in f.lower() for f in fel):
        return "fel grind fällde: %s" % "; ".join(f[:70] for f in fel[:3])
    return None


if __name__ == "__main__":
    missar = 0
    for m in MUTATIONER:
        problem = kor_en(*m)
        if problem:
            missar += 1
            print("MISSAD  %-52s %s" % (m[0][:52], problem))
    print("\n%d/%d mutationer fångade." % (len(MUTATIONER) - missar, len(MUTATIONER)))
    # Grindarna måste vara rena på den ORÖRDA texten också.
    lint.PRODUKTER = texter.PRODUKTER
    lint.SLUG2KORT = {p["slug"]: p["kort"] for p in texter.PRODUKTER}
    lint.SLUGGAR = {p["slug"]: p for p in texter.PRODUKTER}
    lint.FEL = []
    rent = lint.kor()
    for f in rent:
        print("FEL PÅ ORÖRD TEXT  " + f)
    print("Orörd text: %d fel." % len(rent))
    sys.exit(1 if (missar or rent) else 0)
