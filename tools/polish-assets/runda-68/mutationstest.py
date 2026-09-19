# -*- coding: utf-8 -*-
"""Mutationstest för runda 68.

☠️ En grind som säger "0 fel" har bevisat ingenting förrän den bevisligen kan
FÄLLA. Varje rad nedan inför EN defekt och kräver att rätt grind fyrar.

⚠️ En mutation måste vara EN ÄKTA DEFEKT. Runda 65 hade fyra som tog bort ett
   faktum från EN bärare medan tre andra hade kvar det — grinden svarade rätt
   och mutationen var fel. Därför finns `falt="*"` och `kort="*"`.

☠️ Och den måste BITA HELT. Runda 66 mätte att `.replace` är versalkänsligt:
   "Mugghållare:" i spec-tabellen överlevde en mutation som bytte "mugghållare",
   grinden såg ordet kvar och hade RÄTT. Muteras ett ord som förekommer med
   både versal och gemen: byt en STAM som är gemen i båda ("ung", "onter").
"""
import copy
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

import lint                                                           # noqa: E402
import texter                                                         # noqa: E402

SKYDDADE = {"kort", "pris"}


def byt_i(v, gammalt, nytt):
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
    # --- rundans farligaste: familj F LUTAR INTE ------------------------
    ("☠️ loungefåtöljen får en ryggvinkel den inte har",
     "8ca7b3c3", "eg", "Snurrar 360° på stålfoten",
     "Ryggen fälls bakåt till 135°", "gradtalet"),
    ("☠️ 'ingen fällbar rygg' skrivs om till att den fälls — UTAN gradtal",
     "79797c9a", "villkor", "Den här fåtöljen har ingen fällbar rygg.",
     "Den här fåtöljen fäller ryggen bakåt.", "ryggfällning påstås"),
    ("G får H:s ryggvinkel", "9a2f6417", "*", "160°", "135°", "'160°'"),
    ("I får H:s ryggvinkel", "07d52f21", "*", "130°", "135°", "'130°'"),

    # --- färgen, fyra omskrivningar mot fotot ---------------------------
    ("8ca7b3c3 kallas gräddvit, som källan felaktigt säger",
     "8ca7b3c3", "*", "ljusgrå", "gräddvit", "färgord"),
    ("9a2f6417 kallas ljusgrå", "9a2f6417", "*", "grå", "ljusgrå", "färgord"),
    ("dfb7fcbe kallas gräddvit", "dfb7fcbe", "*", "ljusbeige", "gräddvit", "färgord"),
    ("ed930c42 kallas svart som sitt syskon",
     "ed930c42", "*", "gråbrun", "svart", "färgord"),
    ("korshänvisningen ger H fel färg",
     "8ca7b3c3", "faq", "gräddvit gungfåtölj", "blå gungfåtölj", "korshänvisningens"),

    # --- lasttal --------------------------------------------------------
    ("loungefåtöljen får de andras maxlast",
     "79797c9a", "*", "120 kg", "150 kg", "maxlast"),
    ("H får loungefåtöljens maxlast", "fbba0de8", "*", "150 kg", "120 kg", "maxlast"),
    ("korshänvisningen påstår fel last om H",
     "dfb7fcbe", "faq", "gräddvit gungfåtölj",
     "gräddvit gungfåtölj som bär 120 kg", "korshänvisning påstår"),

    # --- villkor som MÅSTE nå kunden ------------------------------------
    ("fotpallens höjdintervall försvinner ur F",
     "8ca7b3c3", "*", "41–45 cm", "", "'41–45 cm'"),
    ("kroppslängdsgränsen försvinner ur G",
     "dfb7fcbe", "*", "185 cm", "", "'185 cm'"),
    ("väggavståndet försvinner ur H", "99e2d675", "*", "50 cm", "", "'50 cm'"),
    ("☠️ I:s åttio centimeter blir femtio",
     "ed930c42", "*", "80 cm", "50 cm", "'80 cm'"),

    # --- material -------------------------------------------------------
    ("konstlädret kallas läder", "*", "*", "konstläder", "läder", "läder påstås"),
    ("källans bomullspåstående följer med på F",
     "79797c9a", "eg", "26 cm stoppning i ryggen",
     "Rygg i bomull med 26 cm stoppning", "naturmaterial"),
    ("källans linnepåstående följer med på G",
     "9a2f6417", "eg", "Hög rygg med utsvängda sidor",
     "Klädsel i äkta linne", "naturmaterial"),
    ("stommen kallas massivt trä",
     "fbba0de8", "*", "Ram i trä", "Ram i massivt trä", "massivt trä"),

    # --- utrustning som finns och inte finns ----------------------------
    ("☠️ G påstås ha en lös fotpall — och det är ett JA, inget förnekande",
     "9a2f6417", "faq", "Nej, och den behövs inte: fotstödet sitter i stommen",
     "Ja, en lös fotpall ingår och fotstödet sitter i stommen",
     "lös fotpall påstås"),
    ("fjäderkärna påstås på F",
     "8ca7b3c3", "eg", "Svängd rygg och breda, inbyggda armstöd",
     "Fjäderkärna under sittdynan", "fjäderkärna påstås"),
    ("G:s fjäderkärna försvinner",
     "dfb7fcbe", "*", "jäderkärn", "kumblock", "fjäderkärna nämns inte"),
    ("gungfunktion påstås på I",
     "07d52f21", "eg", "Snurrar 360° på foten",
     "Gungar mjukt fram och tillbaka", "gungfunktion påstås"),
    ("H:s gungfunktion försvinner", "99e2d675", "*", "ung", "vil",
     "gungfunktion nämns inte"),
    ("360° påstås på H", "fbba0de8", "eg", "Gungar mjukt fram och tillbaka",
     "Snurrar 360° på foten", "360° påstås"),
    ("F:s 360° försvinner", "79797c9a", "*", "360", "ett helt varv",
     "360° nämns inte"),
    ("korshänvisningen tillskriver I en fjäderkärna den inte har",
     "fbba0de8", "faq", "och snurrar 360°", "och har fjäderkärna",
     "korshänvisningen påstår"),

    # --- husets ordlistor ------------------------------------------------
    ("tyskt ord i texten", "07d52f21", "eg", "Bär 150 kg",
     "Belastbarkeit 150 kg", "tyskt ord"),
    ("husmärke i texten", "8ca7b3c3", "ingress", "En bred loungefåtölj",
     "En bred HOMCOM-loungefåtölj", "husmärke"),
    ("land utskrivet", "9a2f6417", "ingress", "En läsfåtölj i",
     "Skickas från Tyskland. En läsfåtölj i", "land utskrivet"),
    ("attribution mot kunden", "99e2d675", "faq", "Nej, det är konstläder",
     "Leverantören uppger att det är konstläder", "attribution"),
    ("artikelnummer i texten", "ed930c42", "spec", "Vikt: 23,5 kg",
     "Vikt: 23,5 kg, modell 839-835V01CG", "artikelnummer"),

    # --- vikten ----------------------------------------------------------
    ("I:s två syskon får varandras egenvikt",
     "07d52f21", "spec", "Vikt: 26 kg", "Vikt: 43 kg",
     "annan produkts egenvikt"),
    ("G:s egenvikt försvinner", "9a2f6417", "*", "43 kg", "", "vikt 43 kg saknas"),
    ("decimalpunkt i stället för komma", "ed930c42", "spec",
     "Vikt: 23,5 kg", "Vikt: 23.5 kg", "decimalpunkt"),

    # --- hälsopåstående och struktur -------------------------------------
    ("hälsopåstående smyger in", "dfb7fcbe", "ingress", "En läsfåtölj i",
     "Lindrar värk i ryggen. En läsfåtölj i", "hälsopåstående"),
    ("massage påstås", "99e2d675", "eg", "Gungar mjukt fram och tillbaka",
     "Inbyggd massage i ryggen", "massage"),
    ("två produkter får samma slug", "79797c9a", "slug",
     "loungefatolj-bla-med-fotpall", "loungefatolj-ljusgra-med-fotpall",
     "krockar"),
    ("slugen får svenska tecken", "9a2f6417", "slug",
     "lasfatolj-gra-160-grader", "läsfåtölj-grå-160-grader", "ASCII"),
    ("titeln blir identisk med namnet", "fbba0de8", "title",
     "Gungfåtölj med fotpall, 135°, gräddvit | Fyndplats",
     "Gungfåtölj med fotpall i konstläder, 135° – gräddvit", "identisk"),
    ("metan blir för kort", "07d52f21", "meta",
     "Biofåtölj i svart konstläder med lös fotpall, 56 cm bred sits och 360° "
     "snurrfot i böjträ. Ryggen fälls till 130°. Bär 150 kg. Behöver 80 cm "
     "bakom sig.", "Biofåtölj i konstläder.", "meta"),
    ("namnet blir för långt", "dfb7fcbe", "name",
     "Läsfåtölj med inbyggt fotstöd, ryggen fälls till 160° – ljusbeige",
     "Läsfåtölj med inbyggt fotstöd som fälls ut med hälarna och en rygg som "
     "går ända till 160 grader – ljusbeige", "max 80"),
    ("monteringen nämns inte", "*", "*", "onter", "everan",
     "monteringen nämns inte"),
    ("länk till sig själv", "8ca7b3c3", "faq",
     "loungefatolj-bla-med-fotpall", "loungefatolj-ljusgra-med-fotpall",
     "sig själv"),
    ("länk ut ur batchen", "ed930c42", "faq",
     "gungfatolj-graddvit-med-fotpall", "nagon-annan-produkt",
     "utanför batchen"),
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
            print("MISSAD  %-54s %s" % (m[0][:54], problem))
    print("\n%d/%d mutationer fångade." % (len(MUTATIONER) - missar, len(MUTATIONER)))
    lint.PRODUKTER = texter.PRODUKTER
    lint.SLUG2KORT = {p["slug"]: p["kort"] for p in texter.PRODUKTER}
    lint.SLUGGAR = {p["slug"]: p for p in texter.PRODUKTER}
    lint.FEL = []
    rent = lint.kor()
    for f in rent:
        print("FEL PÅ ORÖRD TEXT  " + f)
    print("Orörd text: %d fel." % len(rent))
    sys.exit(1 if (missar or rent) else 0)
