# -*- coding: utf-8 -*-
"""Mutationstest för runda 72.

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

☠️ Rundans egna grindar är de sista i listan och de viktigaste: `dbbe7253`
   får INGET gradtal alls (den fälls inte, vrider inte), "massivt trä" får
   bara 8f6636e4 säga, "linne," utan "look" bara dbbe7253, och fotpallens
   LÄGRE maxlast måste finnas kvar på de tre som har en delad last.
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

# ☠️ `slug` är SKYDDAD i en `*`-mutation. Ett ordbyte skrev annars om sluggen
#    också, och då fälldes länkgrinden i stället för den grind mutationen
#    skulle pröva — mutationen såg ut att fånga något, men den fångade sin
#    egen skada. Runda 69:s lärdom, ordagrant.
SKYDDADE = {"kort", "pris", "slug"}


# ☠️ En mutation får inte skada sin egen ställning. Runda 69 lärde att `slug`
#    måste skyddas; runda 72 lärde att LÄNKMÅLET måste det också. Att mutera
#    "fotpall" skrev om href:en i en korshänvisning, och då fällde länkgrinden
#    i stället för den grind mutationen prövade — mutationen såg ut att fånga
#    något och fångade sin egen skada.
_HREF = re.compile(r'href="[^"]*"')


def byt_i(v, gammalt, nytt, ror_lankar=False):
    if isinstance(v, str):
        if ror_lankar:
            return v.replace(gammalt, nytt)
        bitar, sist = [], 0
        for m in _HREF.finditer(v):
            bitar.append(v[sist:m.start()].replace(gammalt, nytt))
            bitar.append(m.group(0))          # href:en lämnas ORÖRD
            sist = m.end()
        bitar.append(v[sist:].replace(gammalt, nytt))
        return "".join(bitar)
    if isinstance(v, list):
        return [byt_i(x, gammalt, nytt, ror_lankar) for x in v]
    if isinstance(v, tuple):
        return tuple(byt_i(x, gammalt, nytt, ror_lankar) for x in v)
    return v


def satt(p, falt, gammalt, nytt, ror_lankar=False):
    if falt == "*":
        for f in p:
            if f not in SKYDDADE:
                p[f] = byt_i(p[f], gammalt, nytt, ror_lankar)
    else:
        p[falt] = byt_i(p[falt], gammalt, nytt, ror_lankar)


# (beskrivning, kort, fält, gammalt, nytt, ord som MÅSTE stå i felet)
MUTATIONER = [
    # --- maxlast: fyra olika tal i rundan, plus tre delade laster ---------
    ("golvfåtöljen får en annan lastsiffra", "64856235", "*",
     "120 kg", "150 kg", "maxlast"),
    ("X:s stol får Y:s last", "f192540f", "*", "120 kg", "150 kg", "maxlast"),
    ("Y tappar sina 150 kg", "78cb09ba", "*", "150 kg", "130 kg", "maxlast"),
    ("Z får Y:s last i stället för sina 130", "8f6636e4", "*",
     "130 kg", "150 kg", "maxlast"),
    ("AA tappar sina 150 kg", "b8001a1b", "*", "150 kg", "120 kg", "maxlast"),
    ("AE tappar sina 150 kg", "dbbe7253", "*", "150 kg", "120 kg", "maxlast"),
    ("☠️ X:s FOTPALL får stolens last — precis felet varningen finns för",
     "f192540f", "*", "60 kg", "120 kg", "60 kg"),
    ("☠️ Z:s fotpall får stolens last", "8f6636e4", "*", "80 kg", "130 kg",
     "80 kg"),
    ("☠️ AA:s fotpall får stolens last", "b8001a1b", "*", "80 kg", "150 kg",
     "80 kg"),
    ("korshänvisningen påstår fel last om en publicerad sida",
     "64856235", "faq", "samma modell finns i",
     "samma modell bär 150 kg och finns i", "korshänvisning"),

    # --- gradtalen -------------------------------------------------------
    ("W får X:s ryggvinkel", "64856235", "*", "120°", "135°", "'120°'"),
    ("X får Y:s ryggvinkel", "f192540f", "*", "135°", "132°", "'135°'"),
    ("Y får X:s ryggvinkel", "78cb09ba", "*", "132°", "135°", "'132°'"),
    ("Z får Y:s ryggvinkel", "8f6636e4", "*", "135°", "132°", "'135°'"),
    ("AA får Y:s ryggvinkel", "b8001a1b", "*", "135°", "132°", "'135°'"),
    ("☠️ AE får ett gradtal — den har ingen vinkel alls", "dbbe7253", "eg",
     "Svängd rygg med knappad stoppning", "Ryggen fälls till 135°", "135"),
    ("☠️ Y påstås snurra 360° — källan ger ingen vridfot", "78cb09ba", "eg",
     "Vippfunktion — stolen gungar mjukt i fästet", "Sitsen vrider 360°",
     "360"),
    ("☠️ AE påstås snurra 360°", "dbbe7253", "eg",
     "Liten golvyta: 67 × 67 cm", "Sitsen vrider 360°", "360"),
    ("W:s vridfot tystas ner", "35872574", "*", "360", "180", "360"),
    ("X:s vridfot tystas ner", "f192540f", "*", "360", "180", "360"),

    # --- färgen ----------------------------------------------------------
    ("☠️ petrolblå skrivs som källans 'blå'", "35872574", "*",
     "petrolblå", "blå", "petrolblå"),
    ("W:s grå blir beige", "64856235", "*", "grå", "beige", "grå"),
    ("W:s beige blir grå", "4f6bef7d", "*", "beige", "grå", "beige"),
    ("☠️ Z:s ljusgrå blir grå — syskonet Y äger det ordet", "8f6636e4", "*",
     "ljusgrå", "grå", "ljusgrå"),
    ("Y:s grå blir ljusgrå", "78cb09ba", "*", "grå", "ljusgrå", "grå"),
    ("X:s svart blir grå", "f192540f", "*", "svart", "grå", "svart"),
    ("AA:s svart blir mörkgrå", "b8001a1b", "*", "svart", "mörkgrå", "svart"),
    ("AE:s beige blir gräddvit", "dbbe7253", "*", "beige", "gräddvit", "beige"),

    # --- utrustning ------------------------------------------------------
    ("☠️ W påstås ha en lös fotpall", "64856235", "eg",
     "Bär 120 kg", "Lös fotpall ingår", "otpall"),
    ("☠️ AE påstås ha en lös fotpall", "dbbe7253", "eg",
     "Väger 11 kg", "Lös fotpall ingår", "otpall"),
    # ☠️ "ägaren tappar fotpallen" går INTE att mutera: alla fyra ägares SLUG
    #    innehåller ordet och sluggen är skyddad, så påståendet överlever i
    #    rubrikfältet. Grinden har rätt. Riktningen "någon annan påstår den"
    #    är täckt ovan; här prövas två andra ägargrindar i stället.
    ("☠️ AA påstås ha vippfunktion", "b8001a1b", "eg",
     "Sitsen vrider 360°", "Vippfunktion i fästet", "vippfunktion"),
    ("☠️ W påstås ha träfot", "64856235", "eg",
     "Bär 120 kg", "Träfot under sockeln", "räfot"),
    ("☠️ X påstås ha vippfunktion — bara Y har den", "f192540f", "eg",
     "Pulverlackerad stålram", "Vippfunktion i fästet", "vippfunktion"),
    ("Y tappar sin vippfunktion", "78cb09ba", "*", "ippfunktion", "ungfunktion",
     "vippfunktion"),
    ("☠️ Y påstås ha träfot — den står på stål", "78cb09ba", "eg",
     "Halkskyddade fötter", "Träfot under stolen", "räfot"),
    ("Z tappar sin träfot", "8f6636e4", "*", "räfot", "tålfot", "räfot"),
    ("☠️ X påstås ha massivt trä", "f192540f", "eg",
     "Pulverlackerad stålram", "Fot av massivt trä", "massiv"),
    # ☠️ Stammen är "assiv", inte "massiv": FAQ:n börjar med versal
    #    "Massivt trä, under…" och en versalkänslig replace hade
    #    lämnat den kvar. Runda 66 och 69 gick i samma fälla.
    ("Z tappar sitt massiva trä", "8f6636e4", "*", "assiv", "ackerad",
     "massiv"),
    ("☠️ Y påstås ha justerbart nackstöd — bara AA har det", "78cb09ba", "eg",
     "Halkskyddade fötter", "Nackstödet ställs 10 cm", "nackstöd"),
    ("AA tappar sitt nackstöd", "b8001a1b", "*", "ackstöd", "ackkudde",
     "nackstöd"),

    # --- väggavstånd: två olika tal, och talet ensamt är inte påståendet --
    ("☠️ Y påstås behöva X:s 60 cm", "78cb09ba", "*",
     "50 cm fritt", "60 cm fritt", "60 cm"),
    ("☠️ X påstås behöva Y:s 50 cm", "f192540f", "*",
     "60 cm fritt", "50 cm fritt", "50 cm"),
    ("X tappar sitt väggavstånd", "f192540f", "*", "60 cm fritt",
     "60 cm bakom", "60 cm"),

    # --- materialet ------------------------------------------------------
    ("☠️ konstläder skrivs som läder", "f192540f", "*",
     "konstläder", "läder", "läder"),
    ("☠️ AA:s konstläder skrivs som skinn", "b8001a1b", "eg",
     "Ryggen fälls till 135° med ett grepp", "Klädsel i skinn", "skinn"),
    ("☠️ W:s linnelook skrivs som äkta linne", "64856235", "*",
     "linnelook", "linne,", "linne"),
    ("☠️ W:s sammetslook skrivs som sammet", "35872574", "*",
     "sammetslook", "sammet", "sammet"),
    ("AE tappar sitt linne", "dbbe7253", "*", "inne,", "äv,", "linne"),

    # --- vikten ----------------------------------------------------------
    ("W får AA:s vikt", "64856235", "*", "11 kg", "31,6 kg", "vikt"),
    ("X får Y:s vikt", "f192540f", "*", "22 kg", "25 kg", "vikt"),
    ("AA får Z:s vikt", "b8001a1b", "*", "31,6 kg", "25 kg", "vikt"),

    # --- måtten som MÅSTE nå kunden --------------------------------------
    ("W tappar sitthöjden", "4f6bef7d", "*", "37 cm", "45 cm", "37 cm"),
    ("W tappar antalet ryggvinklar", "35872574", "*", "fem lägen",
     "flera lägen", "fem lägen"),
    ("X tappar sin bredd", "f192540f", "*", "75 cm", "80 cm", "75 cm"),
    ("Z tappar fotpallens två höjder", "8f6636e4", "*", "36 eller 40 cm",
     "38 cm", "36 eller 40 cm"),
    ("AA tappar sitt utfällda djup", "b8001a1b", "*", "118 cm", "108 cm",
     "118 cm"),
    ("AE tappar sin golvyta", "dbbe7253", "*", "67 × 67 cm", "70 × 70 cm",
     "67 × 67 cm"),

    # --- husreglerna -----------------------------------------------------
    ("tyskt ord slinker in", "78cb09ba", "eg",
     "Halkskyddade fötter", "Hocker ingår i leveransen", "tysk"),
    ("husmärket kommer tillbaka", "b8001a1b", "name",
     "Fåtölj i svart", "HOMCOM Fåtölj i svart", "husmärke"),
    ("avsändarlandet skrivs ut", "8f6636e4", "eg",
     "Levereras omonterad", "Tillverkad i Tyskland", "land"),
    ("artikelnumret läcker", "dbbe7253", "spec",
     "Vikt: 11 kg", "Artikelnummer: 839-423V00BG", "artikelnummer"),
    ("lagerfras i texten", "f192540f", "eg",
     "Levereras omonterad", "Skickas från vårt EU-lager", "lagerfras"),
    ("länk till en slug som ingen har skrivit", "78cb09ba", "faq",
     "fatolj-ljusgra-fotpall-trafot", "fatolj-ljusgra-fotpall-trafo",
     "slug", True),
    ("länk till sig själv", "8f6636e4", "faq",
     "fatolj-svart-fotpall-nackstod", "fatolj-ljusgra-fotpall-trafot",
     "sig själv", True),
]


def kor_en(beskrivning, kort, falt, gammalt, nytt, vantat,
           ror_lankar=False):
    prod = copy.deepcopy(texter.PRODUKTER)
    rord = False
    for p in prod:
        if kort not in ("*", p["kort"]):
            continue
        fore = repr(p)
        satt(p, falt, gammalt, nytt, ror_lankar)
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
