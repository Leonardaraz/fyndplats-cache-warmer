# -*- coding: utf-8 -*-
"""Mutationstest för runda 75.

☠️ En grind som säger "0 fel" har bevisat ingenting förrän den bevisligen kan
FÄLLA. Varje rad nedan inför EN defekt och kräver att rätt grind fyrar.

☠️ RUNDANS TYNGDPUNKT ÄR STEG 2-GRINDARNA. Kontorsstolar är den första
   familjen där texten kan bli OLAGLIG snarare än bara fel: ett återinfört
   hälsopåstående eller ett "certifierad" utan norm är inte ett skrivfel utan
   ett påstående vi inte får göra. Mutationerna nedan återinför dem ett i
   taget och kräver att rätt grind fyrar.

☠️ OCH HJULEN. Två av sju står på en FAST fot. En stol som påstås rulla och
   inte gör det upptäcks vid uppackning, inte i en textgranskning — därför
   muteras hjulen i BÅDA riktningarna.

⚠️ En mutation måste vara EN ÄKTA DEFEKT. Därför `falt="*"` och `kort="*"`.
☠️ Och den måste BITA HELT: `.replace` är versalkänsligt, så muteras ett ord
   som förekommer med både versal och gemen byts en STAM som är gemen i båda.
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
    ("☠️ källans blodcirkulation återinförs", "cc81673d", "skotsel",
     "Fotstödet dras ut", "Fotstödet främjar blodcirkulationen och dras ut",
     "hälsopåstående"),
    ("☠️ ryggraden 'stöttas optimalt' återinförs", "75f6c433", "ingress",
     "Sitsen har 13 cm stoppning", "Ryggen stöttar ryggraden och sitsen har 13 cm stoppning",
     "hälsopåstående"),
    ("☠️ stolen påstås förebygga något", "348ee535", "eg",
     "Vippfunktion mot fjäder", "Förebygger ryggont vid långa pass",
     "hälsopåstående"),
    ("☠️ 'rätt hållning' smyger in", "0945e4dd", "skotsel",
     "Snöflanell är en tät", "Ger rätt hållning. Snöflanell är en tät",
     "hälsopåstående"),

    # --- Steg 2-grind 2: arbetsstol och standard ---------------------------
    ("☠️ stolen säljs som ARBETSSTOL", "7ab2f8aa", "*",
     "kontorsstol", "arbetsstol", "arbetsstols"),
    ("☠️ EN 1335 påstås utan belägg", "60c803f0", "eg",
     "Bär 120 kg", "Uppfyller EN 1335", "arbetsstols"),
    ("☠️ 'certifierad' utan norm", "4d83eca6", "eg",
     "Bär 120 kg", "Certifierad för dagligt bruk", "arbetsstols"),
    ("☠️ heltidslöfte om åtta timmar", "cc81673d", "ingress",
     "Sitsen är 15 cm tjock", "Gjord för åtta timmar om dagen. Sitsen är 15 cm tjock",
     "arbetsstols"),

    # --- Steg 2-grind 3: hjulen -------------------------------------------
    ("☠️ den FASTA foten får hjul i egenskaperna", "348ee535", "eg",
     "Fyrstjärnig fast fot — inga hjul", "Fem PU-hjul och 360 graders vridning",
     "hjul"),
    ("☠️ den FASTA fotens spec påstår hjul", "4d83eca6", "spec",
     "Fot: fyrstjärnig fast fot, utan hjul", "Hjul: fem PU-hjul", "hjul"),
    ("☠️ en stol SOM HAR hjul påstås sakna dem", "75f6c433", "eg",
     "Fem PU-hjul och 360 graders vridning", "Fyrstjärnig fot utan hjul", "hjul"),
    ("☠️ FAQ:ns nekande svar vänds till ett ja", "348ee535", "faq",
     "Nej. Foten är fyrstjärnig och fast, så stolen står kvar där du "
     "ställer den.", "Ja, fem PU-hjul.", "hjul"),

    # --- måttet källan motsäger sig själv om -------------------------------
    ("☠️ ryggstödets omtvistade bredd skrivs ut", "348ee535", "spec",
     "Armstöd: 18 cm över sitsen",
     "Ryggstöd: 65 cm brett. Armstöd: 18 cm över sitsen", "motsäger"),
    ("☠️ det ANDRA omtvistade talet skrivs ut", "4d83eca6", "spec",
     "Armstöd: 18 cm över sitsen",
     "Ryggstöd: 50 cm brett. Armstöd: 18 cm över sitsen", "motsäger"),

    # --- maxlast ----------------------------------------------------------
    ("lasten höjs till ett tal källan inte ger", "75f6c433", "*",
     "120 kg", "150 kg", "120 kg"),
    ("lasten sänks", "cc81673d", "*", "120 kg", "100 kg", "120 kg"),
    ("lasten byts på snurrstolen", "4d83eca6", "*", "120 kg", "180 kg", "120 kg"),

    # --- gradtal: bara 360° är belagt --------------------------------------
    ("☠️ en RYGGVINKEL uppfinns", "cc81673d", "eg",
     "Ryggen låses i tre lägen", "Ryggen fälls till 135°", "135"),
    ("☠️ vridningen blir ett annat tal", "75f6c433", "meta",
     "360° vridbar", "270° vridbar", "270"),

    # --- utrustning -------------------------------------------------------
    ("☠️ bouclé-stolen får ett fotstöd den inte har", "7ab2f8aa", "eg",
     "Bär 120 kg", "Utdragbart fotstöd", "fotstöd"),
    # ☠️ Stammen är GEMEN I BÅDA formerna. Ordet står som "Fotstöd" i
    #    specraden och "fotstöd" i brödtexten, och `.replace` är
    #    versalkänsligt — muterar man hela ordet överlever specraden och
    #    grinden ser säljargumentet stå kvar. Filens egen docstring varnar
    #    för just det; den här raden är fällan i skarpt läge.
    ("☠️ fotstödsstolen tappar sitt fotstöd HELT", "0945e4dd", "*",
     "otstöd", "itsstöd", "fotstöd"),
    ("☠️ snurrstolen får ett nackstöd", "348ee535", "eg",
     "360 graders vridning", "Justerbart nackstöd", "nackstöd"),
    ("☠️ bouclé-stolen tappar sitt nackstöd HELT", "60c803f0", "*",
     "ackstöd", "uvudkudde", "nackstöd"),
    ("☠️ fotstödsstolen påstås ha bouclé", "cc81673d", "spec",
     "Klädsel: snöflanell, 100 % polyester", "Klädsel: bouclé, 100 % polyester",
     "bouclé"),
    ("☠️ vippfunktionen påstås på en stol utan den", "0945e4dd", "eg",
     "Bär 120 kg", "Vippfunktion mot fjäder", "vippfunktion"),

    # --- vikt -------------------------------------------------------------
    ("vikten byts mot ett syskonmodells", "75f6c433", "spec",
     "Vikt: 22,6 kg", "Vikt: 19,5 kg", "vikt"),
    ("den lätta snurrstolen får den tunga modellens vikt", "4d83eca6", "*",
     "15,5 kg", "22,6 kg", "vikt"),

    # --- husregler --------------------------------------------------------
    ("☠️ avsändarlandet skrivs ut", "60c803f0", "skotsel",
     "Stolen kommer i delar", "Stolen skickas från Tyskland och kommer i delar",
     "land"),
    ("☠️ husmärket smyger in", "cc81673d", "ingress",
     "En kontorsstol i", "En HOMCOM-kontorsstol i", "husmärke"),
    ("☠️ attribution till tillverkaren", "348ee535", "skotsel",
     "Foten är fast", "Tillverkaren anger att foten är fast", "attribution"),
    ("☠️ artikelnumret läcker in i specen", "7ab2f8aa", "spec",
     "Vikt: 22,6 kg", "Artikelnummer: 839-455V00BU", "artikelnummer"),
    ("☠️ lagerfras i texten", "0945e4dd", "eg",
     "Levereras omonterad", "Skickas från vårt EU-lager", "lagerfras"),

    # --- korshänvisningar -------------------------------------------------
    ("☠️ länk till en slug som inte finns", "75f6c433", "faq",
     "kontorsstol-ljusgra-boucle", "kontorsstol-mellangra-boucle",
     "utanför batchen", True),
    ("☠️ den publicerade sidans färgord byts i ankartexten", "cc81673d", "faq",
     ">mörkgrå<", ">svart<", "färgord"),
]

# ☠️ Varje färgsyskon måste kunna FÄLLAS mot varje annat INOM sin modell — och
#    mot den publicerade sidans ord. En handskriven lista hade täckt de par jag
#    råkade tänka på; den här genererar alla.
for _grupp in (A, B, C):
    for _a in _grupp:
        for _b in _grupp:
            if _a == _b or FARG[_a] == FARG[_b]:
                continue
            MUTATIONER.append(
                ("färgparet %s→%s" % (FARG[_a], FARG[_b]), _a, "*",
                 FARG[_a], FARG[_b], "'%s'" % FARG[_a]))

# ☠️ Och mot den PUBLICERADE mörkgrå sidan, som `501ba88f` bar och som är
#    skälet till att den produkten inte finns i rundan.
for _a in A + B + C:
    MUTATIONER.append(
        ("☠️ %s tar den publicerade sidans färgord" % FARG[_a], _a, "*",
         FARG[_a], "mörkgrå", "mörkgrå"))


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
