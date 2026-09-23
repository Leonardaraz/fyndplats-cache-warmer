# -*- coding: utf-8 -*-
"""Mutationstest för runda 73.

☠️ En grind som säger "0 fel" har bevisat ingenting förrän den bevisligen kan
FÄLLA. Varje rad nedan inför EN defekt och kräver att rätt grind fyrar.

⚠️ En mutation måste vara EN ÄKTA DEFEKT. Runda 65 hade fyra som tog bort ett
   faktum från EN bärare medan tre andra hade kvar det — grinden svarade rätt
   och mutationen var fel. Därför finns `falt="*"` och `kort="*"`.

☠️ Och den måste BITA HELT. `.replace` är versalkänsligt, och runda 66, 69 och
   72 har alla gått i samma fälla: "Fotpall" i spec-tabellen överlever en
   mutation av "fotpall". Muteras ett ord som förekommer med både versal och
   gemen: byt en STAM som är gemen i båda ("otpall", "ryssfot", "red").

☠️ RUNDANS EGNA GRINDAR ligger sist och är de viktigaste:

   1. FÄRGEN. Fem av åtta färgord är RÄTTADE mot källan, och varje rättning
      går åt det håll där ett publicerat syskon redan äger ordet. Mutationen
      som skriver tillbaka källans ord MÅSTE fällas — annars är hela
      pixelmätningen oskyddad.
   2. `massage`. Källan kallar `b1e98da4` "Massagestuhl". Ingen produkt i
      rundan har massage.
   3. TOMMA GRADMÄNGDER. `54cf1f44` och `7eee41b6` får INGET gradtal alls;
      `b72f093d` vrider men har inget tal för vridningen.
   4. FOTPALLENS lägre last på de två som har en pall.
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

# ☠️ Och LÄNKMÅLET måste skyddas av samma skäl (runda 72). Att mutera
#    "fotpall" skrev om href:en i en korshänvisning.
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
    # --- maxlast: fyra olika tal, och två delade laster -------------------
    ("A får C:s last", "969d9ec9", "*", "120 kg", "150 kg", "maxlast"),
    ("B tappar sina 150 kg", "b72f093d", "*", "150 kg", "120 kg", "maxlast"),
    ("C tappar sina 150 kg", "54cf1f44", "*", "150 kg", "100 kg", "maxlast"),
    ("D får C:s last i stället för sina 100", "acb1f904", "*",
     "100 kg", "150 kg", "maxlast"),
    ("E får B:s last", "e57125fb", "*", "120 kg", "150 kg", "maxlast"),
    ("H får B:s last", "7eee41b6", "*", "120 kg", "150 kg", "maxlast"),
    ("☠️ F:s FOTPALL får stolens last — precis felet varningen finns för",
     "b1e98da4", "*", "100 kg", "120 kg", "100 kg"),
    ("☠️ G:s fotpall får stolens last", "b67fdc2b", "*", "100 kg", "120 kg",
     "100 kg"),
    ("korshänvisningen påstår fel last om en publicerad sida",
     "b67fdc2b", "faq", "samma modell finns i",
     "samma modell bär 150 kg och finns i", "korshänvisning"),

    # --- gradtalen -------------------------------------------------------
    ("A får E:s ryggvinkel", "969d9ec9", "*", "135°", "150°", "gradtalet 150°"),
    ("B får G:s ryggvinkel", "b72f093d", "*", "135°", "145°", "gradtalet 145°"),
    ("D får G:s ryggvinkel", "acb1f904", "*", "135°", "145°", "gradtalet 145°"),
    ("E får A:s ryggvinkel", "e57125fb", "*", "150°", "135°", "gradtalet 135°"),
    ("G får A:s ryggvinkel", "b67fdc2b", "*", "145°", "135°", "gradtalet 135°"),
    ("☠️ C får ett gradtal — källan ger ingen ryggvinkel alls", "54cf1f44",
     "eg", "Fotdelen fälls ut med ryggen", "Ryggen fälls till 135°", "135"),
    ("☠️ H får ett gradtal — den har lägen, inte grader", "7eee41b6", "eg",
     "Ryggen har fem lägen", "Ryggen fälls till 135°", "135"),
    ("☠️ B påstås vrida 360° — källan ger inget tal för vridningen",
     "b72f093d", "eg", "Stålram", "Sitsen vrider 360°", "360"),
    ("☠️ C påstås vrida 360° — den står stilla", "54cf1f44", "eg",
     "Stomme av stål", "Sitsen vrider 360°", "360"),
    ("☠️ E påstås vrida 360°", "e57125fb", "eg", "Metallstomme",
     "Sitsen vrider 360°", "360"),
    ("☠️ H påstås vrida 360°", "7eee41b6", "eg", "Pulverlackerad metallram",
     "Sitsen vrider 360°", "360"),
    ("A:s vridfot tystas ner", "969d9ec9", "*", "360", "180", "360"),
    ("D:s vridfot tystas ner", "acb1f904", "*", "360", "180", "360"),

    # --- FÄRGEN: rundans största fynd, mutationen skriver tillbaka källan --
    ("☠️ B:s gråbrun skrivs som källans 'Hellbraun' → ljusbrun", "b72f093d",
     "*", "gråbrun", "ljusbrun", "gråbrun"),
    ("☠️ B:s gråbrun skrivs som beige — krockar med ett publicerat syskon",
     "b72f093d", "*", "gråbrun", "beige", "gråbrun"),
    ("☠️ C:s grå skrivs som källans 'Hellgrau' → ljusgrå", "54cf1f44", "*",
     "grå", "ljusgrå", "grå"),
    ("☠️ E:s brun skrivs som källans 'Dunkelbraun' → mörkbrun", "e57125fb",
     "*", "brun", "mörkbrun", "brun"),
    ("☠️ F:s ljusgrå skrivs som källans 'Grau' → grå", "b1e98da4", "*",
     "ljusgrå", "grå", "ljusgrå"),
    ("☠️ G:s gråbrun skrivs som källans 'Braun' → brun", "b67fdc2b", "*",
     "gråbrun", "brun", "gråbrun"),
    ("A:s ljusgrå blir grå", "969d9ec9", "*", "ljusgrå", "grå", "ljusgrå"),
    ("D:s gräddvit blir beige", "acb1f904", "*", "gräddvit", "beige",
     "gräddvit"),
    ("H:s grå blir beige", "7eee41b6", "*", "grå", "beige", "grå"),
    ("korshänvisningens färgord blir fel", "b1e98da4", "faq",
     ">svart<", ">mörkblå<", "korshänvisningens"),

    # --- utrustning ------------------------------------------------------
    ("☠️ A påstås ha en lös fotpall", "969d9ec9", "eg",
     "Bär 120 kg", "Lös fotpall ingår", "otpall"),
    ("☠️ C påstås ha en lös fotpall", "54cf1f44", "eg",
     "Stomme av stål", "Lös fotpall ingår", "otpall"),
    ("☠️ H påstås ha en lös fotpall", "7eee41b6", "eg",
     "Väger 19,5 kg", "Lös fotpall ingår", "otpall"),
    ("☠️ C påstås gunga — bara A och B gör det", "54cf1f44", "eg",
     "Stomme av stål", "Stolen gungar mjukt", "gung"),
    ("☠️ F påstås gunga", "b1e98da4", "eg", "Rund fot, Ø 60 cm",
     "Stolen gungar mjukt", "gung"),
    ("A tappar sin gungfunktion", "969d9ec9", "*", "ungar", "vrider",
     "gungfunktion"),
    ("☠️ A påstås ha mugghållare — bara B och D har det", "969d9ec9", "eg",
     "Bär 120 kg", "Mugghållare i armstödet", "mugghållare"),
    ("☠️ G påstås ha mugghållare", "b67fdc2b", "eg", "Knappad rygg",
     "Mugghållare i armstödet", "mugghållare"),
    ("D tappar sin mugghållare", "acb1f904", "*", "ugghållare", "ugghylla",
     "mugghållare"),
    ("☠️ B påstås ha sidoficka — bara D har det", "b72f093d", "eg",
     "Stålram", "Sidoficka på sidan", "sidoficka"),
    ("D tappar sin sidoficka", "acb1f904", "*", "idoficka", "idohylla",
     "sidoficka"),
    ("☠️ C påstås vara väggnära — bara E är det", "54cf1f44", "eg",
     "Stomme av stål", "Väggnära mekanism", "väggnära"),
    ("☠️ F påstås ha ett dolt förvaringsfack — bara G har det", "b1e98da4",
     "eg", "Rund fot, Ø 60 cm", "Dolt förvaringsfack under sitsen",
     "förvaringsfack"),
    ("G tappar sitt förvaringsfack", "b67fdc2b", "*", "örvaringsfack",
     "örvaringsutrymme", "förvaringsfack"),
    ("☠️ F påstås stå på en kryssfot — den har en RUND fot", "b1e98da4", "eg",
     "Rund fot, Ø 60 cm", "Kryssfot av trä under stolen", "ryssfot"),
    ("G tappar sin kryssfot", "b67fdc2b", "*", "ryssfot", "undfot", "ryssfot"),
    ("☠️ A påstås ha knappad rygg — bara G har det", "969d9ec9", "eg",
     "Bär 120 kg", "Knappad rygg", "knappad"),
    ("☠️ A påstås ha ett låsvred — bara F har det", "969d9ec9", "eg",
     "Bär 120 kg", "Ryggen låses med ett vred", "vred"),
    ("F tappar sitt vred", "b1e98da4", "*", "vred", "reglage", "vred"),
    ("☠️ A påstås ha fem lägen — bara H har det", "969d9ec9", "eg",
     "Bär 120 kg", "Ryggen har fem lägen", "fem lägen"),
    ("H tappar sina fem lägen", "7eee41b6", "*", "fem lägen", "flera lägen",
     "fem lägen"),
    ("☠️ C påstås bli en bädd — bara H gör det", "54cf1f44", "eg",
     "Stomme av stål", "Blir en bädd på 185 cm", "bädd"),

    # --- materialet ------------------------------------------------------
    ("☠️ D:s konstläder skrivs som läder", "acb1f904", "*",
     "konstläder", "läder", "läder"),
    ("☠️ F:s konstläder skrivs som skinn", "b1e98da4", "eg",
     "Sitsen vrider 360°", "Klädsel i skinn", "skinn"),
    ("☠️ G:s konstläder skrivs som läder", "b67fdc2b", "*",
     "konstläder", "läder", "läder"),
    ("☠️ B:s linnelook skrivs som äkta linne", "b72f093d", "*",
     "linnelook", "linne", "linne"),
    ("☠️ C:s linnelook skrivs som äkta linne", "54cf1f44", "*",
     "linnelook", "linne", "linne"),
    ("☠️ E:s linnelook skrivs som äkta linne", "e57125fb", "*",
     "linnelook", "linne", "linne"),
    ("☠️ H:s väv skrivs som bomull", "7eee41b6", "eg",
     "Pulverlackerad metallram", "Klädsel i bomull", "bomull"),
    ("☠️ G:s träfot skrivs som massivt trä", "b67fdc2b", "eg",
     "Knappad rygg", "Fot av massivt trä", "massiv"),

    # --- rundans egen grind: massage --------------------------------------
    ("☠️ källans 'Massagestuhl' slinker in på F", "b1e98da4", "eg",
     "Sitsen vrider 360°", "Massage i ryggen", "massage"),
    ("☠️ massage påstås på en annan produkt i rundan", "b67fdc2b", "faq",
     "Trä, under både fåtöljen och fotpallen.",
     "Trä, och ryggen har massage.", "massage"),

    # --- hälsopåståendet källan gör ---------------------------------------
    ("☠️ källans 'für stillende Mütter' slinker in", "b72f093d", "eg",
     "Stålram", "Bra för ammande mammor", "hälsopåstående"),

    # --- vikten ----------------------------------------------------------
    ("A får B:s vikt", "969d9ec9", "*", "45 kg", "50 kg", "vikt"),
    ("F får G:s vikt", "b1e98da4", "*", "18 kg", "24 kg", "vikt"),
    ("H får D:s vikt", "7eee41b6", "*", "19,5 kg", "22,5 kg", "vikt"),

    # --- måtten som MÅSTE nå kunden --------------------------------------
    ("☠️ C får spec-tabellens felaktiga 90 i stället för ritningens 87",
     "54cf1f44", "*", "87 cm", "90 cm", "87 cm"),
    ("A tappar vävens vikt", "969d9ec9", "*", "310 g/m²", "tät väv",
     "310 g/m²"),
    ("E tappar sitt väggavstånd", "e57125fb", "*", "15 cm", "25 cm", "15 cm"),
    ("F tappar fotpallens mått", "b1e98da4", "*", "43 × 38", "40 × 40",
     "43 × 38"),
    ("G tappar förvaringsfackets mått", "b67fdc2b", "*", "40 × 34", "45 × 35",
     "40 × 34"),
    ("H tappar bäddens längd", "7eee41b6", "*", "185,5", "180", "185,5"),

    # --- husreglerna -----------------------------------------------------
    ("tyskt ord slinker in", "54cf1f44", "eg",
     "Stomme av stål", "Hocker ingår i leveransen", "tysk"),
    ("husmärket kommer tillbaka", "b1e98da4", "name",
     "Snurrfåtölj i", "HOMCOM Snurrfåtölj i", "husmärke"),
    ("avsändarlandet skrivs ut", "e57125fb", "eg",
     "Levereras omonterad", "Tillverkad i Tyskland", "land"),
    ("☠️ attributionen kommer tillbaka — mot kunden är VI leverantören",
     "b72f093d", "faq", "Gungfunktionen är gjord för",
     "Tillverkaren anvisar att gungfunktionen är gjord för", "attribution"),
    ("artikelnumret läcker", "b67fdc2b", "spec",
     "Vikt: 24 kg", "Artikelnummer: 833-359V00CW", "artikelnummer"),
    ("lagerfras i texten", "acb1f904", "eg",
     "Levereras omonterad", "Skickas från vårt EU-lager", "lagerfras"),
    ("länk till en slug som ingen har skrivit", "969d9ec9", "faq",
     "tv-fatolj-grabrun-gungande", "tv-fatolj-grabrun-gungand",
     "slug", True),
    ("länk till sig själv", "acb1f904", "faq",
     "reclinerfatolj-gra-150-kg", "tv-fatolj-sidoficka-graddvit",
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
            print("MISSAD  %-56s %s" % (m[0][:56], problem))
    print("\n%d/%d mutationer fångade." % (len(MUTATIONER) - missar,
                                           len(MUTATIONER)))
    lint.PRODUKTER = texter.PRODUKTER
    lint.SLUG2KORT = {p["slug"]: p["kort"] for p in texter.PRODUKTER}
    lint.SLUGGAR = {p["slug"]: p for p in texter.PRODUKTER}
    lint.FEL = []
    rent = lint.kor()
    for f in rent:
        print("FEL PÅ ORÖRD TEXT  " + f)
    print("Orörd text: %d fel." % len(rent))
    sys.exit(1 if (missar or rent) else 0)
