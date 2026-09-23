# -*- coding: utf-8 -*-
"""Mutationstest för runda 67.

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
    # --- färgen, rundans dyraste fynd -------------------------------------
    ("ceae31c1 kallas ljusgrå, som källans Farbe-kolumn felaktigt säger",
     "ceae31c1", "*", "grå", "ljusgrå", "färgord"),
    ("1b39b14e kallas gräddvit, som källan felaktigt säger",
     "1b39b14e", "*", "beige", "gräddvit", "färgord"),
    ("korshänvisningen ger ceae31c1 fel färg",
     "04feb176", "*", "grå tv-fåtölj", "beige tv-fåtölj", "korshänvisningens"),

    # --- lasttal, och rundans farligaste siffra ---------------------------
    ("☠️ E:s fotpall påstås bära 200 kg i stället för 20",
     "9794b6df", "*", "20 kg", "200 kg", "maxlast"),
    ("☠️ E:s 20 kg-gräns försvinner helt ur texten",
     "9946e1eb", "*", "20 kg", "en lätt last", "'20 kg'"),
    ("D får syskonens maxlast", "7f437bac", "*", "120 kg", "150 kg", "maxlast"),
    ("B får 180 kg i maxlast", "04feb176", "*", "150 kg", "180 kg", "maxlast"),
    ("korshänvisningen påstår fel last om E",
     "6a4e92c4", "*", "bär 160 kg", "bär 150 kg", "korshänvisning påstår"),

    # --- villkor som MÅSTE nå kunden --------------------------------------
    ("väggavståndet försvinner ur B", "6a4e92c4", "*", "40 cm", "", "'40 cm'"),
    ("väggavståndet försvinner ur C", "ceae31c1", "*", "30 cm", "", "'30 cm'"),
    ("förvaringsfackets djup försvinner ur D",
     "87262869", "*", "6 cm", "", "'6 cm'"),
    ("kroppslängdsgränsen försvinner ur C",
     "1b39b14e", "*", "190 cm", "", "'190 cm'"),
    ("ryggvinkeln på B blir 145° som syskonfamiljerna",
     "04feb176", "*", "130°", "145°", "'130°'"),

    # --- hälsopåståenden, det källan faktiskt säger -----------------------
    ("källans spänningslöfte följer med på C",
     "ceae31c1", "ingress", "En bred tv-fåtölj",
     "Den löser spänningar efter en stressig dag. En bred tv-fåtölj",
     "hälsopåstående"),
    ("massage påstås", "7f437bac", "eg", "Knappdekor i ryggen",
     "Inbyggd massage i ryggen", "massage"),

    # --- material ---------------------------------------------------------
    ("konstlädret kallas läder", "*", "*", "konstläder", "läder", "läder påstås"),
    ("stommen kallas massivt trä",
     "7f437bac", "*", "Stomme i trä", "Stomme i massivt trä", "massivt trä"),
    ("chenillen kallas äkta",
     "ceae31c1", "*", "Tyget är chenille", "Tyget är äkta chenille",
     "äkta naturmaterial"),

    # --- utrustning som inte finns, och som finns -------------------------
    ("sidofickor påstås på en fåtölj utan",
     "04feb176", "eg", "Halkfria tassar under foten skyddar golvet",
     "Två sidofickor i armstöden", "sidofickor påstås"),
    # ☠️ "gungar" och "Gungar" är olika strängar. Stammen "ung" är gemen i båda.
    ("C:s gungfunktion försvinner ur texten",
     "1b39b14e", "*", "ung", "vil", "gungfunktion nämns inte"),
    ("fjäderkärna påstås på D",
     "87262869", "eg", "Mjukt stoppad sits, rygg och armstöd",
     "Fjäderkärna i sitsen", "fjäderkärna påstås"),
    ("förvaringsfack påstås på E",
     "9794b6df", "eg", "Fot i böjträ", "Förvaringsfack under fotpallen",
     "förvaring påstås"),
    ("☠️ 360° påstås om E, som källan bara säger snurrar i alla riktningar",
     "9946e1eb", "ingress", "snurrar runt på sin fot",
     "snurrar 360° på sin fot", "360° påstås"),
    ("B:s 360° försvinner", "6a4e92c4", "*", "360", "ett helt varv",
     "360° nämns inte"),
    ("korshänvisningen tillskriver C ett förvaringsfack",
     "04feb176", "faq", "och gungar dessutom", "och har ett förvaringsfack",
     "korshänvisningen påstår"),

    # --- husets ordlistor --------------------------------------------------
    ("tyskt ord i texten", "9794b6df", "eg", "Fåtöljen bär 160 kg",
     "Belastbarkeit 160 kg", "tyskt ord"),
    ("husmärke i texten", "04feb176", "ingress", "En reclinerfåtölj",
     "En HOMCOM-reclinerfåtölj", "husmärke"),
    ("land utskrivet", "7f437bac", "ingress", "En vilfåtölj i",
     "Skickas från Tyskland. En vilfåtölj i", "land utskrivet"),
    ("attribution mot kunden", "ceae31c1", "faq", "Ja, båda.",
     "Leverantören uppger att båda fungerar.", "attribution"),
    ("artikelnummer i texten", "9946e1eb", "spec", "Vikt: 24 kg",
     "Vikt: 24 kg, modell 839-835V01CG", "artikelnummer"),

    # --- vikten ------------------------------------------------------------
    ("C får syskonfamiljernas egenvikt",
     "ceae31c1", "spec", "Vikt: 44,3 kg", "Vikt: 24 kg",
     "annan produkts egenvikt"),
    ("C:s egenvikt försvinner", "1b39b14e", "*", "44,3 kg", "",
     "vikt 44,3 kg saknas"),
    ("decimalpunkt i stället för komma", "ceae31c1", "spec",
     "Vikt: 44,3 kg", "Vikt: 44.3 kg", "decimalpunkt"),

    # --- struktur och SEO ---------------------------------------------------
    ("två produkter får samma slug", "9946e1eb", "slug",
     "relaxfatolj-graddvit-med-fotpall", "relaxfatolj-svart-med-fotpall",
     "krockar"),
    ("slugen får svenska tecken", "7f437bac", "slug",
     "vilfatolj-morkgra-med-fotpall", "vilfåtölj-mörkgrå-med-fotpall", "ASCII"),
    ("titeln blir identisk med namnet", "ceae31c1", "title",
     "Tv-fåtölj i chenille med fotstöd, grå | Fyndplats",
     "Tv-fåtölj i chenille med inbyggt fotstöd och gungning – grå", "identisk"),
    ("metan blir för kort", "9794b6df", "meta",
     "Relaxfåtölj i svart konstläder med stålram och fot i böjträ. Ryggen "
     "fälls manuellt till 145° och fåtöljen bär 160 kg. Fotpallen är gjord "
     "för 20 kg.", "Relaxfåtölj i konstläder.", "meta"),
    ("namnet blir för långt", "1b39b14e", "name",
     "Tv-fåtölj i chenille med inbyggt fotstöd och gungning – beige",
     "Tv-fåtölj i chenille med inbyggt fotstöd, gungfunktion, två sidofickor "
     "och fjäderkärna i sitsen – beige", "max 80"),
    # ☠️ "Montering" räcker inte som mutation: "Levereras omonterad" i
    #    egenskaperna bär också stammen `monter`, och grinden hade haft RÄTT.
    ("monteringen nämns inte", "*", "*", "onter", "everan",
     "monteringen nämns inte"),
    ("länk till sig själv", "04feb176", "faq",
     "reclinerfatolj-graddvit-med-fotpall", "reclinerfatolj-svart-med-fotpall",
     "sig själv"),
    ("länk ut ur batchen", "87262869", "faq",
     "reclinerfatolj-graddvit-med-fotpall", "nagon-annan-produkt",
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
