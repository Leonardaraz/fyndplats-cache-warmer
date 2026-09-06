# -*- coding: utf-8 -*-
"""Mutationstest för runda 71.

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
    # --- rundans egen fråga: maxlasten på kvartetten ----------------------
    ("☠️ kvartetten får tillbaka källans 150 kg", "d760fffc", "*",
     "120 kg", "150 kg", "maxlast"),
    ("☠️ ett enda syskon får 150 kg — precis felet #289 beskrev",
     "1a1d04f7", "*", "120 kg", "150 kg", "maxlast"),
    ("U tappar sina 150 kg till kvartettens tal", "89273d39", "*",
     "150 kg", "120 kg", "maxlast"),
    ("korshänvisningen påstår fel last om en PUBLICERAD sida",
     "79eaab59", "faq", "går till 145°", "går till 145° och bär 150 kg",
     "korshänvisning påstår"),

    # --- gradtalen: fem familjer, fyra vinklar ----------------------------
    ("R får S:s ryggvinkel", "d760fffc", "*", "130°", "145°", "'130°'"),
    ("S får R:s ryggvinkel", "99492092", "*", "145°", "130°", "'145°'"),
    ("T får U:s ryggvinkel", "79690bf4", "*", "135°", "130°", "'135°'"),
    ("U får V:s ryggvinkel", "89273d39", "*", "130°", "135°", "'130°'"),
    ("V får S:s ryggvinkel", "9c1889f1", "*", "135°", "145°", "'135°'"),
    ("☠️ S påstås snurra 360° — det gör bara kvartetten", "99492092", "eg",
     "Fjäderkärna med fickfjädrar i sitsen", "Sitsen snurrar 360°", "360"),
    ("☠️ V påstås snurra 360°", "9c1889f1", "eg",
     "Gungar mjukt fram och tillbaka", "Sitsen snurrar 360°", "360"),
    ("kvartettens vridfot tystas ner", "79eaab59", "*", "360", "180",
     "360° vridfot nämns inte"),

    # --- färgen -----------------------------------------------------------
    ("☠️ 1a1d04f7 kallas mörkgrå — vad medianen ensam hade sagt",
     "1a1d04f7", "*", "svart", "mörkgrå", "färgord"),
    ("☠️ beige och gräddvit blandas ihop i kvartetten",
     "d760fffc", "*", "beige", "gräddvit", "färgord"),
    ("4b2a7407 kallas beige", "4b2a7407", "*", "gräddvit", "beige", "färgord"),
    ("79eaab59 kallas ljusgrå", "79eaab59", "*", "grå", "ljusgrå", "färgord"),
    ("89273d39 kallas svart", "89273d39", "*", "mörkgrå", "svart", "färgord"),
    ("79690bf4 kallas grå utan ljus-", "79690bf4", "*", "ljusgrå", "beige",
     "färgord"),
    ("V:s mörkröda träfot blir svart", "9c1889f1", "*", "mörkröd", "svart",
     "färgord"),
    ("korshänvisningen ger länkmålet i batchen fel färg",
     "89273d39", "faq", "gräddvit fåtölj", "brun fåtölj", "korshänvisningens"),
    ("korshänvisningen ger en PUBLICERAD sida fel färg",
     "d760fffc", "faq", "beige fåtölj i konstläder", "grön fåtölj i konstläder",
     "korshänvisningens"),

    # --- utrustning som inte finns ----------------------------------------
    ("☠️ R påstås ha en lös fotpall", "4b2a7407", "eg",
     "Fotstödet är inbyggt och fälls ut ur framkanten",
     "Lös fotpall ingår i leveransen", "lös fotpall påstås"),
    ("☠️ S påstås ha en lös fotpall", "99492092", "eg",
     "Fotstödet är inbyggt och låses genom att tryckas ned med benen",
     "Lös fotpall ingår i leveransen", "lös fotpall påstås"),
    ("☠️ U påstås ha fotstödet inbyggt", "89273d39", "eg",
     "Lös fotpall, 48 × 40 cm och 37 cm hög",
     "Fotstödet är inbyggt i stolen", "inbyggt fotstöd påstås"),
    ("U:s lösa fotpall tystas ner", "89273d39", "*", "otpall", "otstöd",
     "lös fotpall nämns inte"),
    ("☠️ R påstås ha fjäderkärna", "1a1d04f7", "eg",
     "Sitsen snurrar 360°", "Fjäderkärna med fickfjädrar i sitsen",
     "fjäderkärna påstås"),
    ("☠️ U påstås ha fjäderkärna", "89273d39", "eg",
     "Träram med metallben och halkskydd",
     "Fjäderkärna med fickfjädrar i sitsen", "fjäderkärna påstås"),
    ("S:s fjäderkärna tystas ner", "99492092", "*", "kärna", "block",
     "fjäderkärna nämns inte"),
    ("☠️ S påstås behöva 80 cm väggavstånd", "99492092", "eg",
     "Bär 120 kg", "Behöver 80 cm fritt bakom stolen",
     "80 cm väggavstånd påstås"),
    ("☠️ U får kvartettens väggavstånd i stället för sitt eget",
     "89273d39", "*", "50 cm fritt", "80 cm fritt", "väggavstånd"),
    ("R:s väggavstånd tystas ner", "d760fffc", "*", "80 cm fritt",
     "60 cm fritt", "80 cm väggavstånd nämns inte"),
    ("☠️ U påstås gunga — det gör bara V", "89273d39", "eg",
     "Träram med metallben och halkskydd", "Stolen gungar mjukt",
     "gungfunktion påstås"),
    ("V:s gungfunktion tystas ner", "9c1889f1", "*", "ungar", "urrar",
     "gungfunktion nämns inte"),
    ("☠️ R påstås stå på träfot — den står på ett galvaniserat underrede",
     "4b2a7407", "eg", "Blankt galvaniserat underrede i ett stycke",
     "Böjd träfot under stolen", "träfot påstås"),
    ("V:s träfot tystas ner", "9c1889f1", "*", "räfot", "räben",
     "träfot nämns inte"),

    # --- material ---------------------------------------------------------
    ("☠️ U:s sammetslook kallas sammet rakt ut", "89273d39", "eg",
     "53 cm bred sits på 48 cm höjd, 15 cm tjock", "Klädsel i mjuk sammet",
     "sammet påstås naket"),
    ("☠️ R:s konstläder kallas skinn", "79eaab59", "eg",
     "Blankt galvaniserat underrede i ett stycke", "Klädsel av mjukt skinn",
     "läder eller skinn påstås"),
    ("☠️ V:s konstläder kallas läder", "9c1889f1", "eg",
     "Gungar mjukt fram och tillbaka", "Klädsel i mjukt läder",
     "läder eller skinn påstås"),
    ("☠️ linnelooken kallas äkta linne", "79690bf4", "eg",
     "Stålstomme", "Klädsel i äkta linne", "naturmaterial påstås"),
    ("☠️ träfoten kallas massivt trä", "9c1889f1", "eg",
     "Underrede i mörkrött trä med halkskydd", "Underredet är massivt trä",
     "massivt trä påstås"),

    # --- vikt --------------------------------------------------------------
    ("R får S:s egenvikt", "d760fffc", "*", "22 kg", "27,5 kg", "vikt"),
    ("U får T:s egenvikt", "89273d39", "*", "21 kg", "26 kg", "vikt"),

    # --- villkor som MÅSTE nå kunden ---------------------------------------
    ("R:s utfällda djup försvinner", "1a1d04f7", "*", "134 cm", "130 cm",
     "134 cm"),
    ("S:s kroppslängd försvinner", "99492092", "*", "185 cm", "180 cm",
     "185 cm"),
    ("T:s bredd försvinner", "79690bf4", "*", "69 cm", "68 cm", "69 cm"),
    ("U:s utfällda djup försvinner", "89273d39", "*", "114 cm", "110 cm",
     "114 cm"),
    ("V:s utfällda djup försvinner", "9c1889f1", "*", "107 cm", "100 cm",
     "107 cm"),

    # --- husreglerna --------------------------------------------------------
    ("☠️ leverantörens artikelnummer smiter in", "79690bf4", "spec",
     "Vikt: 26 kg", "Artikelnummer: 839-863V80GY", "artikelnummer"),
    ("☠️ etiketten Modellreferens används", "99492092", "spec",
     "Vikt: 27,5 kg", "Modellreferens: 839-863", "artikelnummer"),
    ("☠️ avsändarlandet skrivs ut", "d760fffc", "ingress",
     "blankt runt underrede", "blankt runt underrede från Tyskland",
     "land utskrivet"),
    ("☠️ husmärket smiter in", "89273d39", "ingress", "En fåtölj i",
     "En HOMCOM fåtölj i", "husmärke"),
    ("☠️ attribution mot leverantören", "9c1889f1", "villkor",
     "Fåtöljen gungar mjukt", "Leverantören anger att fåtöljen gungar mjukt",
     "attribution"),
    ("☠️ tyskt ord kvar i texten", "1a1d04f7", "eg", "Bär 120 kg",
     "Belastbarkeit 120 kg", "tyskt ord"),
    ("☠️ hälsopåstående", "99492092", "villkor", "Fåtöljen är 27,5 kg",
     "Fåtöljen lindrar värk i ländryggen och är 27,5 kg", "hälsopåstående"),
    ("☠️ massage påstås", "79690bf4", "eg", "Stålstomme",
     "Inbyggd massage i ryggen", "massage"),

    # --- SEO-fälten och länkarna ---------------------------------------------
    ("titeln görs identisk med namnet", "79690bf4", "title",
     "Smal fåtölj 69 cm, 135° rygg, ljusgrå | Fyndplats",
     "Smal fåtölj 69 cm med fotstöd, rygg till 135° – ljusgrå",
     "identisk med namnet"),
    ("metan blir för kort", "9c1889f1", "meta",
     "Gungande fåtölj i gräddvit konstläder med lös fotpall och mörkröd "
     "träfot. Ryggen ställs med ett vred på sidan, upp till 135°. "
     "Bär 150 kg.", "Gungande fåtölj.", "meta"),
    ("decimalpunkt i stället för komma", "99492092", "spec", "27,5", "27.5",
     "decimalpunkt"),
    ("två produkter får samma slug", "4b2a7407", "slug",
     "vridfatolj-graddvit-130-grader", "vridfatolj-beige-130-grader",
     "krockar"),
    ("☠️ sluggen är redan skriven i en tidigare runda", "99492092", "slug",
     "fjaderfatolj-graddvit-145-grader", "biofatolj-gra-160-grader",
     "är redan skriven"),
    ("en länk pekar på en slug utan facit", "89273d39", "faq",
     "gungfatolj-graddvit-135-grader", "nagon-annan-produkt", "utan facit"),
    ("en relativ länk smiter in", "9c1889f1", "faq",
     "https://www.fyndplats.se/produkt/", "/produkt/", "relativ"),
    ("☠️ korshänvisningen pekas om till en sida som saknar det den påstår",
     "d760fffc", "faq", "konstladerfatolj-beige-145-grader",
     "konstladerfatolj-morkgra-145-grader", "korshänvisningens"),
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
