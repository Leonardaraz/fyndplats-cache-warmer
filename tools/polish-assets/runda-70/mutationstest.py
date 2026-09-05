# -*- coding: utf-8 -*-
"""Mutationstest för runda 70.

☠️ En grind som säger "0 fel" har bevisat ingenting förrän den bevisligen kan
FÄLLA. Varje rad nedan inför EN defekt och kräver att rätt grind fyrar.

⚠️ En mutation måste vara EN ÄKTA DEFEKT. Runda 65 hade fyra som tog bort ett
   faktum från EN bärare medan tre andra hade kvar det — grinden svarade rätt
   och mutationen var fel. Därför finns `falt="*"` och `kort="*"`.

☠️ Och den måste BITA HELT. `.replace` är versalkänsligt, och runda 66, 69 och
   den här rundan har alla gått i samma fälla: "Fotpall" i spec-tabellen
   överlever en mutation av "fotpall". Muteras ett ord som förekommer med både
   versal och gemen: byt en STAM som är gemen i båda ("otpall", "kärna",
   "räfot", "ålfot").

☠️ Rundans egna två grindar är de sista i listan och de viktigaste:
   familj P får INGEN gradtalssiffra alls, och "sammet" får aldrig stå naket.
"""
import copy
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

import lint                                                           # noqa: E402
import texter                                                         # noqa: E402

# ☠️ `slug` är SKYDDAD i en `*`-mutation. Ett ordbyte skrev annars om sluggen
#    också, och då fälldes länkgrinden i stället för den grind mutationen
#    skulle pröva — mutationen såg ut att fånga något, men den fångade sin
#    egen skada. Runda 69:s lärdom, ordagrant.
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
    # --- gradtalen: tre familjer med varsin vinkel, och en HELT UTAN --------
    ("J får Q:s ryggvinkel", "73112149", "*", "145°", "135°", "'145°'"),
    ("L får J:s ryggvinkel", "84e3794d", "*", "160°", "145°", "'160°'"),
    ("Q får J:s ryggvinkel", "9bd6d1d4", "*", "135°", "145°", "'135°'"),
    ("☠️ P får en ryggvinkel — källan anger ingen", "021a268e", "ingress",
     "Stolen tar 71 × 69 cm", "Ryggen fälls till 145° och stolen tar 71 × 69 cm",
     "gradtalet 145°"),
    ("☠️ P påstås snurra 360°", "266c5e75", "eg",
     "Sitsen snurrar på stålfoten", "Foten snurrar 360°", "360"),
    ("☠️ P får en vinkel i ORD i stället för i siffror", "d2409a95", "eg",
     "Ryggen fälls bakåt och fotpallen flyttas fritt",
     "Ryggen fälls trettio grader bakåt", "gradtal i ord"),
    ("☠️ L påstås snurra 360° — det gör bara J och Q", "84e3794d", "eg",
     "Fjäderkärna med fickfjädrar i sitsen", "Foten snurrar 360°", "360"),

    # --- färgen: rundans största fynd, två "Cremeweiß" som inte är samma ----
    ("☠️ 73112149 kallas gräddvit, som källan felaktigt antyder",
     "73112149", "*", "beige", "gräddvit", "färgord"),
    ("☠️ 021a268e kallas beige — den andra 'Cremeweiß'",
     "021a268e", "*", "gräddvit", "beige", "färgord"),
    ("d2409a95 kallas grå som sitt syskon", "d2409a95", "*", "mörkgrå", "grå",
     "färgord"),
    ("266c5e75 kallas mörkgrå som sitt syskon", "266c5e75", "*", "grå",
     "mörkgrå", "färgord"),
    ("566c7702 kallas mörkgrå", "566c7702", "*", "svart", "mörkgrå", "färgord"),
    ("5c0e83d1 kallas beige som sitt syskon", "5c0e83d1", "*", "brun", "beige",
     "färgord"),
    ("korshänvisningen ger en PUBLICERAD syskonsida fel färg",
     "84e3794d", "faq", ">gräddvit<", ">beige<", "korshänvisningens"),
    ("korshänvisningen ger länkmålet i batchen fel färg",
     "9bd6d1d4", "faq", "grå fåtölj med fotpall", "brun fåtölj med fotpall",
     "korshänvisningens"),

    # --- lasttal -----------------------------------------------------------
    ("J får P:s maxlast", "73112149", "*", "120 kg", "150 kg", "maxlast"),
    ("P får Q:s maxlast", "266c5e75", "*", "150 kg", "140 kg", "maxlast"),
    ("Q får J:s maxlast", "566c7702", "*", "140 kg", "120 kg", "maxlast"),
    ("☠️ korshänvisningen påstår fel last om en PUBLICERAD sida",
     "84e3794d", "faq", "bär 150 kg", "bär 120 kg", "korshänvisning påstår"),
    ("☠️ korshänvisningen ger en PUBLICERAD sida fel ryggvinkel",
     "73112149", "faq", "till 135°", "till 145°", "korshänvisning påstår"),

    # --- utrustning som inte finns -----------------------------------------
    ("☠️ J påstås ha en lös fotpall", "73112149", "eg",
     "Fotstödet är inbyggt och fälls ut ur stolens framkant",
     "Lös fotpall ingår i leveransen", "lös fotpall påstås"),
    ("☠️ Q påstås ha en lös fotpall", "9bd6d1d4", "eg",
     "Fotstödet är inbyggt och fälls ut ur framkanten",
     "Lös fotpall ingår i leveransen", "lös fotpall påstås"),
    ("☠️ P påstås ha fotstödet inbyggt", "d2409a95", "eg",
     "Lös fotpall, 42 × 43 cm och 35–40 cm hög",
     "Fotstödet är inbyggt i stolen", "inbyggt fotstöd påstås"),
    ("P:s lösa fotpall tystas ner", "021a268e", "*", "otpall", "otstöd",
     "lös fotpall nämns inte"),
    ("☠️ P påstås ha fjäderkärna", "266c5e75", "eg",
     "Sitsen snurrar på stålfoten", "Fjäderkärna med fickfjädrar i sitsen",
     "fjäderkärna påstås"),
    ("☠️ Q påstås ha fjäderkärna", "566c7702", "eg",
     "8 cm tjock ryggkudde", "Fjäderkärna med fickfjädrar i sitsen",
     "fjäderkärna påstås"),
    ("L:s fjäderkärna tystas ner", "84e3794d", "*", "kärna", "block",
     "fjäderkärna nämns inte"),
    ("☠️ P påstås behöva 80 cm väggavstånd — källan ger det inte",
     "021a268e", "eg", "Bär 150 kg — fotpallen 50 kg",
     "Behöver 80 cm fritt bakom stolen", "80 cm väggavstånd påstås"),
    ("Q:s väggavstånd tystas ner", "9bd6d1d4", "*", "80 cm", "60 cm",
     "80 cm väggavstånd nämns inte"),
    ("☠️ P påstås stå på träfot — den står på stål", "266c5e75", "eg",
     "Rund stålfot, 55 cm i diameter",
     "Rund träfot, 55 cm i diameter", "träfot påstås"),
    ("☠️ Q påstås stå på stålfot — den står på trä", "566c7702", "eg",
     "Böjda armstöd i eukalyptusträ", "Rund stålfot under stolen",
     "rund stålfot påstås"),
    ("Q:s träfot tystas ner", "9bd6d1d4", "*", "räfot", "räben",
     "träfot nämns inte"),
    ("P:s stålfot tystas ner", "d2409a95", "*", "ålfot", "ålben",
     "rund stålfot nämns inte"),

    # --- material -----------------------------------------------------------
    ("☠️ P:s sammetslook kallas sammet rakt ut", "266c5e75", "eg",
     "47 cm bred sits på 45 cm höjd", "Klädsel i mjuk sammet",
     "sammet påstås naket"),
    ("☠️ P:s mikrofiber kallas läder", "021a268e", "eg",
     "47 cm bred sits på 45 cm höjd", "Klädsel i mjukt läder",
     "läder eller skinn påstås"),
    ("☠️ J:s konstläder kallas skinn", "5c0e83d1", "eg",
     "Böjd träfot och träklädda armstödsfronter", "Klädsel av mjukt skinn",
     "läder eller skinn påstås"),
    ("☠️ linnelooken kallas äkta linne", "566c7702", "eg",
     "8 cm tjock ryggkudde", "Klädsel i äkta linne", "naturmaterial påstås"),
    ("☠️ eukalyptusfoten kallas massivt trä", "9bd6d1d4", "eg",
     "Böjda armstöd i eukalyptusträ", "Foten är massivt trä",
     "massivt trä påstås"),

    # --- vikt ---------------------------------------------------------------
    ("J får Q:s egenvikt", "73112149", "*", "21,5 kg", "21 kg", "vikt"),
    ("☠️ P:s syskon får varandras vikt", "021a268e", "*", "22 kg", "20 kg",
     "vikt 22 kg saknas"),

    # --- villkor som MÅSTE nå kunden ----------------------------------------
    ("L:s kroppslängd försvinner", "84e3794d", "*", "185 cm", "180 cm", "185 cm"),
    ("J:s utfällda djup försvinner", "5c0e83d1", "*", "151 cm", "150 cm",
     "151 cm"),
    ("☠️ P:s svepdjup försvinner — talet stolen behöver runt om",
     "d2409a95", "*", "93 cm", "83 cm", "93 cm"),
    ("P:s fotdiameter försvinner", "021a268e", "*", "55 cm", "50 cm", "55 cm"),
    ("Q:s maxlast försvinner ur texten", "566c7702", "*", "140 kg", "150 kg",
     "maxlast"),

    # --- husreglerna ---------------------------------------------------------
    ("☠️ leverantörens artikelnummer smiter in", "9bd6d1d4", "spec",
     "Vikt: 21 kg", "Artikelnummer: 839-863V80GY", "artikelnummer"),
    ("☠️ etiketten Modellreferens används", "266c5e75", "spec",
     "Vikt: 20 kg", "Modellreferens: 839-863", "artikelnummer"),
    ("☠️ avsändarlandet skrivs ut", "73112149", "ingress",
     "böjd träfot", "böjd träfot från Tyskland", "land utskrivet"),
    ("☠️ husmärket smiter in", "021a268e", "ingress", "En fåtölj i",
     "En HOMCOM fåtölj i", "husmärke"),
    ("☠️ attribution mot leverantören", "9bd6d1d4", "villkor",
     "Foten snurrar 360°", "Leverantören anger att foten snurrar 360°",
     "attribution"),
    ("☠️ tyskt ord kvar i texten", "84e3794d", "eg", "Bär 120 kg",
     "Belastbarkeit 120 kg", "tyskt ord"),
    ("☠️ hälsopåstående", "566c7702", "villkor", "Foten snurrar 360° på plats",
     "Foten lindrar värk i ländryggen och snurrar 360° på plats",
     "hälsopåstående"),
    ("☠️ massage påstås", "d2409a95", "eg", "Sitsen snurrar på stålfoten",
     "Inbyggd massage i ryggen", "massage"),

    # --- SEO-fälten och länkarna ----------------------------------------------
    ("titeln görs identisk med namnet", "84e3794d", "title",
     "Smal biofåtölj 64 cm, 160° rygg, svart | Fyndplats",
     "Biofåtölj 64 cm bred med fjäderkärna, rygg till 160° – svart",
     "identisk med namnet"),
    ("metan blir för kort", "566c7702", "meta",
     "Fåtölj i svart linnelook på vridbar träfot i eukalyptus. Ryggen "
     "låses steglöst till 135° och fotstödet fälls ut ur stolen. "
     "Bär 140 kg.", "Fåtölj i svart.", "meta"),
    ("decimalpunkt i stället för komma", "73112149", "spec", "21,5", "21.5",
     "decimalpunkt"),
    ("två produkter får samma slug", "266c5e75", "slug",
     "snurrfatolj-gra-stalfot", "snurrfatolj-graddvit-stalfot", "krockar"),
    ("☠️ sluggen är redan skriven i en tidigare runda", "84e3794d", "slug",
     "biofatolj-svart-160-grader", "biofatolj-gra-160-grader",
     "är redan skriven"),
    ("en länk pekar på en slug utan facit", "9bd6d1d4", "faq",
     "snurrfatolj-gra-stalfot", "nagon-annan-produkt", "utan facit"),
    ("en relativ länk smiter in", "021a268e", "faq",
     "https://www.fyndplats.se/produkt/", "/produkt/", "relativ"),
    ("☠️ korshänvisningen pekas om till en sida som saknar det den påstår",
     "73112149", "faq", "tv-fatolj-ljusgra-med-fotpall",
     "biofatolj-gra-160-grader", "korshänvisningen påstår"),
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
