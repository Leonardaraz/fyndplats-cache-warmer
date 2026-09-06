# -*- coding: utf-8 -*-
"""Runda 76 — muterar texten och kräver att RÄTT grind fäller.

☠️ En grind som aldrig fällt är ett påstående, inte en grind. Varje
   mutation här återinför ett fel som rundan faktiskt riskerar, och testet
   kräver inte bara att NÅGON grind fäller utan att den grind som är tänkt
   att fånga just det felet gör det — meddelandet läses, inte bara utfallet.

☠️ MUTERA GENOM ATT LÄGGA TILL, inte byta ut. Runda 75 mätte varför: en
   mutation som ERSATTE ett uppmätt värde fälldes av måttgrinden i stället
   för den grind som prövades, och den prövade grinden kunde ha varit helt
   avväpnad utan att testet märkte något.

⚠️ `.replace` är skiftlägeskänsligt. Spec-raderna börjar med versal
   ("Fotstöd", "Armstöd"), så mutationer mot dem muterar gemena STAMMAR
   ("otstöd", "rmstöd") — runda 75 tappade två mutationer på just det.
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

SKYDDADE = {"kort", "pris", "slug"}
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


A = ["75f6c433", "7ab2f8aa", "60c803f0"]
B = ["cc81673d", "0945e4dd"]
C = ["348ee535", "4d83eca6"]
FARG = {"75f6c433": "benvit", "7ab2f8aa": "ljusgrå", "60c803f0": "ljusbrun",
        "cc81673d": "gräddvit", "0945e4dd": "brun",
        "348ee535": "grå", "4d83eca6": "benvit"}

MUTATIONER = [
    # --- Steg 2-grind 1: hälsopåståenden -----------------------------------
    ("☠️ blodcirkulationen smyger in", "10235819", "skotsel",
     "Mikrofibertyg är tätt vävt", "Fotstödet främjar blodcirkulationen. Mikrofibertyg är tätt vävt",
     "hälsopåstående"),
    ("☠️ ryggraden 'stöttas'", "4fa0ae0a", "ingress",
     "Ryggen mäter 80 cm", "Ryggen stöttar ryggraden och mäter 80 cm",
     "hälsopåstående"),
    ("☠️ stolen påstås förebygga något", "143f9b2d", "eg",
     "Bär 120 kg", "Förebygger ryggont vid långa pass",
     "hälsopåstående"),
    ("☠️ 'rätt hållning' smyger in", "a5454821", "skotsel",
     "Teddytyg är en lugg", "Ger rätt hållning. Teddytyg är en lugg",
     "hälsopåstående"),
    ("☠️ nacksmärta utlovas bort", "0f7021fb", "ingress",
     "Sitsen är 45 cm bred", "Slut på nacksmärta. Sitsen är 45 cm bred",
     "hälsopåstående"),

    # --- Steg 2-grind 2: arbetsstol, standard, certifiering ----------------
    ("☠️ stolen säljs som ARBETSSTOL", "6e05f8b7", "*",
     "skrivbordsstol", "arbetsstol", "arbetsstols"),
    ("☠️ EN 1335 påstås utan belägg", "4293c5ce", "eg",
     "Bär 120 kg", "Uppfyller EN 1335", "arbetsstols"),
    ("☠️ 'certifierad' utan norm", "ce10bfe8", "eg",
     "Bär 120 kg", "Certifierad för dagligt bruk", "arbetsstols"),
    ("☠️ heltidslöfte om åtta timmar", "10235819", "ingress",
     "Ryggen mäter 80 cm", "Gjord för åtta timmar om dagen. Ryggen mäter 80 cm",
     "arbetsstols"),

    # --- Steg 2-grind 3: ergonomi som utlovad effekt -----------------------
    ("☠️ 'ergonomisk' återinförs ur det tyska modellnamnet", "4fa0ae0a", "eg",
     "Bär 120 kg", "Ergonomisk form som avlastar", "ergonomipåstående"),
    ("☠️ ergonomi i ingressen", "143f9b2d", "ingress",
     "Hela stolen är 55 cm bred", "Ergonomiskt formad. Hela stolen är 55 cm bred",
     "ergonomipåstående"),

    # --- Steg 5-grind: ryggstödsmåttet på modell E -------------------------
    ("☠️ E:s spärrade ryggstödsbredd 52 cm skrivs ut", "143f9b2d", "eg",
     "Bär 120 kg", "Ryggstödet är 52 cm brett", "motsäger sig själv"),
    ("☠️ E:s spärrade ryggstödshöjd 44 cm skrivs ut", "6e05f8b7", "spec",
     "Maxlast: 120 kg", "Ryggstöd: 44 cm", "motsäger sig själv"),

    # --- utrustning som produkten inte har ---------------------------------
    ("fotstöd påstås på en stol utan", "4293c5ce", "eg",
     "Bär 120 kg", "Utdragbart fotstöd under sitsen", "fotstöd"),
    ("nätrygg påstås på teddystolen", "0f7021fb", "eg",
     "Bär 120 kg", "Rygg i nätväv som släpper igenom luft", "rygg i nätväv"),
    ("teddytyg påstås på chefsstolen", "10235819", "eg",
     "Bär 120 kg", "Klädsel i teddytyg", "teddytyg"),
    ("vippfunktion påstås på modell D", "4fa0ae0a", "eg",
     "Bär 120 kg", "Vippfunktion — sitsen gungar mjukt bakåt", "vippfunktion"),
    ("☠️ ryggfällning påstås på en stol med fast rygg", "6e05f8b7", "eg",
     "Bär 120 kg", "Ryggen fälls bakåt till ett viloläge", "ryggfällning"),
    ("☠️ hjul FÖRNEKAS på en stol som rullar", "ce10bfe8", "eg",
     "Bär 120 kg", "Levereras utan hjul", "hjul förnekas"),

    # --- måtten -------------------------------------------------------------
    ("uppdiktat mått i ingressen", "a5454821", "eg",
     "Bär 120 kg", "Ryggen är 64 cm hög", "inte är uppmätt"),
    ("☠️ mått lånat från en ANNAN modell i rundan", "4293c5ce", "eg",
     "Bär 120 kg", "Ryggen är 80 cm hög", "inte är uppmätt"),
    ("uppdiktat gradtal", "10235819", "eg",
     "Bär 120 kg", "Ryggen fälls 135°", "gradtal"),
    ("☠️ fel maxlast", "0f7021fb", "spec",
     "Maxlast: 120 kg", "Maxlast: 150 kg", "maxlast"),
    ("fel vikt", "143f9b2d", "*",
     "8,5 kg", "12 kg", "vikt"),
    ("☠️ 170 cm-gränsen försvinner ur texten", "4293c5ce", "*",
     "170 cm", "180 cm", "'170 cm'"),

    # --- husregler ----------------------------------------------------------
    ("☠️ leverantören omnämns", "a5454821", "skotsel",
     "Teddytyg är en lugg", "Leverantören anger att teddytyg är en lugg",
     "attribution"),
    ("☠️ landsnamn i texten", "ce10bfe8", "skotsel",
     "Stolen kommer i delar", "Stolen skickas från Tyskland och kommer i delar",
     "land utskrivet"),
    ("☠️ lagerfras i texten", "0f7021fb", "ingress",
     "Sitsen är 45 cm bred", "Skickas från vårt EU-lager. Sitsen är 45 cm bred",
     "lagerfras"),
    ("☠️ husmärket smyger in", "10235819", "eg",
     "Bär 120 kg", "Tillverkad av HOMCOM", "husmärke"),
    ("☠️ artikelnumret läcker", "4fa0ae0a", "spec",
     "Maxlast: 120 kg", "Artikelnummer: 921-884V00CW", "artikelnummer"),
    ("☠️ tyskt ord blir kvar", "6e05f8b7", "eg",
     "Bär 120 kg", "Rückenlehne i nätväv", "tyskt"),
    ("decimalpunkt i stället för komma", "143f9b2d", "ingress",
     "8,5 kg", "8.5 kg", "decimalpunkt"),
    ("kommalista av tal med enheten sist", "a5454821", "eg",
     "Bär 120 kg", "Måtten är 56, 61 och 76 cm", "kommalista"),
    ("monteringen tas bort", "ce10bfe8", "*",
     "onter", "levereras klar", "monteringen"),

    # --- färgorden ----------------------------------------------------------
    ("☠️ turkos blir grön igen — källans fel återinförs", "143f9b2d", "*",
     "turkos", "grön", "färgord"),
    ("☠️ D:s ljusgrå kallas mörkgrå", "10235819", "*",
     "ljusgrå", "mörkgrå", "färgord"),
    ("☠️ E:s ljusgrå kallas grå — ett steg fel, som källan", "4293c5ce", "*",
     "ljusgrå", "grå", "färgord"),
    ("☠️ F:s gräddvit kallas vit", "ce10bfe8", "*",
     "gräddvit", "vit", "gräddvit"),
    ("☠️ syskonets färgord används på fel produkt", "a5454821", "*",
     "rosa", "grå", "färgord"),
    ("☠️ D-syskonens två färger byter plats", "4fa0ae0a", "*",
     "grå", "ljusgrå", "färgord"),

    # --- korshänvisningarna -------------------------------------------------
    ("☠️ länken pekar på en sida som inte finns", "143f9b2d", "faq",
     "skrivbordsstol-rosa-natrygg", "skrivbordsstol-lila-natrygg", "slug",
     True),
    ("☠️ syskonlänkens ankartext ljuger om färgen", "6e05f8b7", "faq",
     ">turkos<", ">lila<", "färgord", True),
]

def kor_en(beskrivning, kort, falt, gammalt, nytt, vantat, ror_lankar=False):
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
            print("MISSAD  %-52s %s" % (m[0][:52], problem))
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
