# -*- coding: utf-8 -*-
"""Mutationstest för runda 69.

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

# ☠️ `slug` är SKYDDAD i runda 69. En `*`-mutation som byter ett ord skrev
#    annars om sluggen också, och då fälldes "länk till slug utanför batchen"
#    i stället för den grind mutationen skulle pröva. Mutationen såg ut att
#    fånga något — den fångade sin egen skada.
SKYDDADE = {"kort", "pris", "slug"}


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
    # --- rundans farligaste: fyra likartade recliners, fyra ryggvinklar ---
    ("J får K:s ryggvinkel", "37e5dfcf", "*", "145°", "135°", "'145°'"),
    ("K får J:s ryggvinkel", "fd16efbc", "*", "135°", "145°", "'135°'"),
    ("L får N:s ryggvinkel", "7702de01", "*", "160°", "155°", "'160°'"),
    ("N får L:s ryggvinkel", "afab8a41", "*", "155°", "160°", "'155°'"),
    ("☠️ L påstås snurra 360° — det gör bara J och K",
     "e818cf7e", "eg", "Fjäderkärna med fickfjädrar i sitsen",
     "Foten snurrar 360°", "360"),
    ("☠️ N påstås snurra 360°", "75e5fa26", "eg",
     "Fjäderkärna med fickfjädrar i sitsen", "Foten snurrar 360°", "360"),

    # --- färgen, fyra omskrivningar mot fotot ----------------------------
    ("☠️ 37e5dfcf kallas svart, som källan felaktigt säger",
     "37e5dfcf", "*", "mörkgrå", "svart", "färgord"),
    ("dd5553fa kallas grå utan ljus-", "dd5553fa", "*", "ljusgrå", "beige", "färgord"),
    ("4c1f5303 kallas brun som sitt syskon",
     "4c1f5303", "*", "ljusgrå", "brun", "färgord"),
    ("a9c0fc05 kallas mörkgrå", "a9c0fc05", "*", "svart", "mörkgrå", "färgord"),
    ("7702de01 kallas beige", "7702de01", "*", "gräddvit", "beige", "färgord"),
    ("korshänvisningen ger N fel färg",
     "7702de01", "faq", "beige vilfåtölj", "grön vilfåtölj", "korshänvisningens"),
    # ⚠️ Mutationen var först ">svart<", och grinden hade RÄTT som släppte den:
    #    4c1f5303 står på en SVART fot, så ordet finns i dess facit. Ett
    #    färgfacit är ord, inte kroppsdelar. Mutationen använder syskonets
    #    egen färg i stället, som aldrig kan gälla målet.
    ("syskonlänken ger fel färg",
     "fd16efbc", "faq", '>ljusgrå<', '>brun<', "korshänvisningens"),

    # --- lasttal ---------------------------------------------------------
    ("J får N:s maxlast", "37e5dfcf", "*", "120 kg", "150 kg", "maxlast"),
    ("N får de andras maxlast", "a9c0fc05", "*", "150 kg", "120 kg", "maxlast"),
    ("L får N:s maxlast", "e818cf7e", "*", "120 kg", "150 kg", "maxlast"),
    ("korshänvisningen påstår fel last om N",
     "e818cf7e", "faq", "bär 150 kg", "bär 120 kg", "korshänvisning påstår"),

    # --- utrustning som inte finns ---------------------------------------
    ("☠️ J påstås ha en lös fotpall", "37e5dfcf", "eg",
     "Fotstödet är inbyggt och fälls ut ur stolens framkant",
     "Lös fotpall ingår i leveransen", "lös fotpall påstås"),
    ("☠️ L påstås ha en lös fotpall", "7702de01", "eg",
     "Fotstödet är inbyggt och fälls ut ur framkanten",
     "Lös fotpall ingår i leveransen", "lös fotpall påstås"),
    ("☠️ K påstås ha fotstödet inbyggt", "4c1f5303", "eg",
     "Lös fotpall, 47 × 43 cm och 37 cm hög",
     "Fotstödet är inbyggt i stolen", "inbyggt fotstöd påstås"),
    # ⚠️ Muterar STAMMEN "otpall", inte "fotpall". Ordet står med versal både i
    #    spec-tabellen ("Fotpall (B × D × H)") och i FAQ:n ("Fotpallen har en
    #    egen fot"), och `.replace` är versalkänsligt — grinden hade rätt båda
    #    gångerna. Tredje gången samma fälla i den här rundan.
    ("K:s lösa fotpall tystas ner", "fd16efbc", "*", "otpall", "otstöd",
     "lös fotpall nämns inte"),
    ("☠️ J påstås ha fjäderkärna", "dd5553fa", "eg",
     "Foten snurrar 360°", "Fjäderkärna med fickfjädrar i sitsen",
     "fjäderkärna påstås"),
    ("☠️ K påstås ha fjäderkärna", "4c1f5303", "eg",
     "Foten snurrar 360°", "Fjäderkärna med fickfjädrar i sitsen",
     "fjäderkärna påstås"),
    # ⚠️ Muterar STAMMEN "kärna", inte "fjäderkärna": ordet står med versal i
    #    egenskapslistan, och `.replace` är versalkänsligt. Grinden hade rätt
    #    första gången — mutationen bet bara halva texten.
    ("L:s fjäderkärna tystas ner", "e818cf7e", "*", "kärna", "block",
     "fjäderkärna nämns inte"),
    ("☠️ N påstås behöva 80 cm väggavstånd — källan ger det bara till L",
     "afab8a41", "eg", "Bär 150 kg", "Behöver 80 cm fritt bakom stolen",
     "80 cm väggavstånd påstås"),
    ("L:s väggavstånd tystas ner", "7702de01", "*", "80 cm", "60 cm",
     "80 cm väggavstånd nämns inte"),

    # --- material ---------------------------------------------------------
    ("☠️ K:s mikrofiber kallas läder rakt ut", "fd16efbc", "eg",
     "Mikrofiber med matt yta i läderlook", "Klädsel i mjukt läder",
     "läder eller skinn påstås"),
    ("☠️ J:s konstläder kallas skinn", "dd5553fa", "eg",
     "Böjd träfot och träklädda armstödsfronter", "Klädsel av mjukt skinn",
     "läder eller skinn påstås"),
    ("☠️ linnelooken kallas äkta linne", "75e5fa26", "eg",
     "18 cm stoppning i sitsen och 21 cm i ryggen",
     "Klädsel i äkta linne", "naturmaterial påstås"),
    ("☠️ träfoten kallas massivt trä", "37e5dfcf", "eg",
     "Böjd träfot och träklädda armstödsfronter", "Foten är massivt trä",
     "massivt trä påstås"),

    # --- vikt --------------------------------------------------------------
    ("J får N:s egenvikt", "37e5dfcf", "*", "21,5 kg", "26 kg", "vikt"),
    ("☠️ K:s syskon får varandras vikt", "4c1f5303", "*", "24,4 kg", "24 kg",
     "vikt 24,4 kg saknas"),

    # --- villkor som MÅSTE nå kunden ----------------------------------------
    ("L:s kroppslängd försvinner", "e818cf7e", "*", "185 cm", "180 cm", "185 cm"),
    ("N:s kroppslängd försvinner", "75e5fa26", "*", "195 cm", "190 cm", "195 cm"),
    ("J:s utfällda djup försvinner", "dd5553fa", "*", "151 cm", "150 cm", "151 cm"),
    ("K:s fotpallsmått försvinner", "fd16efbc", "*", "47 × 43 cm", "47 x 43 cm",
     "47 × 43 cm"),

    # --- husreglerna --------------------------------------------------------
    ("☠️ leverantörens artikelnummer smiter in", "75e5fa26", "spec",
     "Vikt: 26 kg", "Artikelnummer: 839-863V80GY", "artikelnummer"),
    ("☠️ etiketten Modellreferens används", "afab8a41", "spec",
     "Vikt: 26 kg", "Modellreferens: 839-863", "artikelnummer"),
    ("☠️ avsändarlandet skrivs ut", "37e5dfcf", "ingress",
     "böjd träfot", "böjd träfot från Tyskland", "land utskrivet"),
    ("☠️ husmärket smiter in", "fd16efbc", "ingress", "En hög TV-fåtölj",
     "En hög HOMCOM TV-fåtölj", "husmärke"),
    ("☠️ attribution mot leverantören", "afab8a41", "villkor",
     "Den här modellen är", "Leverantören anger att den här modellen är",
     "attribution"),
    ("☠️ tyskt ord kvar i texten", "a9c0fc05", "eg",
     "Bär 150 kg", "Belastbarkeit 150 kg", "tyskt ord"),
    ("☠️ hälsopåstående", "7702de01", "villkor", "Ryggen fälls bakåt",
     "Ryggen lindrar värk i ländryggen och fälls bakåt", "hälsopåstående"),
    ("☠️ massage påstås", "4c1f5303", "eg", "Foten snurrar 360°",
     "Inbyggd massage i ryggen", "massage"),

    # --- SEO-fälten ----------------------------------------------------------
    ("titeln görs identisk med namnet", "e818cf7e", "title",
     "Smal biofåtölj 64 cm, 160° rygg, grå | Fyndplats",
     "Biofåtölj 64 cm bred med fjäderkärna, rygg till 160° – grå",
     "identisk med namnet"),
    ("metan blir för kort", "a9c0fc05", "meta",
     "Vilfåtölj i svart linnelook med fjäderkärna i sitsen. Ryggen "
     "fälls till 155° och fotstödet fälls ut. Bär 150 kg och "
     "passar kroppslängd upp till 195 cm.", "Vilfåtölj i svart.", "meta"),
    ("decimalpunkt i stället för komma", "4c1f5303", "spec", "82,5", "82.5",
     "decimalpunkt"),
    ("två produkter får samma slug", "dd5553fa", "slug",
     "konstladerfatolj-ljusgra-145-grader", "konstladerfatolj-morkgra-145-grader",
     "krockar"),
    ("en länk pekar utanför batchen", "75e5fa26", "faq",
     "biofatolj-graddvit-160-grader", "nagon-annan-produkt", "utanför batchen"),
    ("en relativ länk smiter in", "afab8a41", "faq",
     "https://www.fyndplats.se/produkt/", "/produkt/", "relativ"),
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
