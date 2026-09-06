# -*- coding: utf-8 -*-
"""Mutationstest för runda 74.

☠️ En grind som säger "0 fel" har bevisat ingenting förrän den bevisligen kan
FÄLLA. Varje rad nedan inför EN defekt och kräver att rätt grind fyrar.

☠️ RUNDANS TYNGDPUNKT ÄR FÄRGEN. Sex av åtta är samma modell och delar all
   text utom färgordet — en förväxling mellan två av dem syns inte i något
   annat tal, och den sjunde färgen är PUBLICERAD. Trettio av mutationerna
   nedan byter ett färgord mot ett annat i familjen, inklusive mot den
   publicerade beige-sidans ord.

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


CORD = ["e1c41327", "58fb3025", "66adcdff", "4a9c33d2", "791e7292", "bc220489"]
FARG = {"e1c41327": "petrolblå", "58fb3025": "ljusgrå", "66adcdff": "gul",
        "4a9c33d2": "gråbeige", "791e7292": "senapsgul", "bc220489": "orange"}

MUTATIONER = [
    # --- maxlast: stolens 150 och pallens 80 ------------------------------
    ("stolens last blir björkvilstolens", "e1c41327", "*", "150 kg", "120 kg",
     "150 kg"),
    ("☠️ PALLENS last får stolens — felet varningen finns för", "58fb3025",
     "*", "80 kg", "150 kg", "80 kg"),
    ("☠️ pallens last får björkstolens", "bc220489", "*", "80 kg", "120 kg",
     "80 kg"),
    ("björkvilstolen får manchesterfåtöljens last", "84082d41", "*",
     "120 kg", "150 kg", "maxlast"),
    ("korshänvisningen påstår fel last om den publicerade sidan", "66adcdff",
     "faq", "samma modell finns i", "samma modell bär 120 kg och finns i",
     "korshänvisning"),

    # --- gradtal: INGEN produkt i rundan har ett ---------------------------
    ("☠️ manchesterfåtöljen får ett gradtal", "e1c41327", "eg",
     "Levereras omonterad", "Ryggen fälls till 135°", "135"),
    ("☠️ björkvilstolen får ett gradtal", "7e00970f", "eg",
     "Bär 120 kg", "Ryggen fälls till 145°", "145"),

    # --- FÄRGEN: rundans tyngdpunkt ---------------------------------------
    ("☠️ petrolblå skrivs som källans 'blå'", "e1c41327", "*",
     "petrolblå", "blå", "petrolblå"),
    ("☠️ ljusgrå skrivs som källans 'grå'", "58fb3025", "*",
     "ljusgrå", "grå", "ljusgrå"),
    ("☠️ gråbeige skrivs som den PUBLICERADE sidans 'beige'", "4a9c33d2", "*",
     "gråbeige", "beige", "gråbeige"),
    ("☠️ gråbeige skrivs som källans 'ljusbrun'", "4a9c33d2", "*",
     "gråbeige", "ljusbrun", "gråbeige"),
    ("☠️ senapsgul skrivs som källans 'orange'", "791e7292", "*",
     "senapsgul", "orange", "senapsgul"),
    ("☠️ orange skrivs som källans 'brun'", "bc220489", "*",
     "orange", "brun", "orange"),
    ("☠️ gul och senapsgul byter plats", "66adcdff", "*",
     "gul", "senapsgul", "'senapsgul'"),
    ("björkvilstolens gråbrun skrivs som källans 'brun'", "84082d41", "*",
     "gråbrun", "brun", "gråbrun"),
    ("björkvilstolens grå blir ljusgrå", "7e00970f", "*",
     "grå", "ljusgrå", "'ljusgrå'"),
    ("korshänvisningens färgord blir fel", "e1c41327", "faq",
     ">beige<", ">mörkblå<", "korshänvisningens"),

    # --- utrustning -------------------------------------------------------
    ("☠️ björkvilstolen påstås ha en LÖS fotpall", "84082d41", "eg",
     "Bär 120 kg", "Lös fotpall ingår", "otpall"),
    ("manchesterfåtöljen tappar sin fotpall", "e1c41327", "*",
     "otpall", "otstol", "otpall"),
    ("☠️ manchesterfåtöljen påstås ha fotstöd i hack", "58fb3025", "eg",
     "Levereras omonterad", "Fotstödet ställs i fem lägen", "fotstöd"),
    ("björkvilstolen tappar sitt fotstöd", "7e00970f", "*",
     "otstöd", "otdyna", "fotstöd"),
    ("☠️ björkvilstolen påstås ha vingrygg", "7e00970f", "eg",
     "Bär 120 kg", "Vingrygg som går upp i 101 cm", "vingrygg"),
    ("manchesterfåtöljen tappar sin vingrygg", "66adcdff", "*",
     "ingrygg", "ygghörna", "vingrygg"),
    ("☠️ björkvilstolen påstås ha ben i massiv bok", "84082d41", "eg",
     "Bär 120 kg", "Ben av massiv bok", "massiv bok"),
    ("manchesterfåtöljen tappar boken", "791e7292", "*",
     "assiv bok", "assiv al", "massiv bok"),
    ("☠️ manchesterfåtöljen påstås ha björkram", "bc220489", "eg",
     "Levereras omonterad", "Ram i böjd björk", "björk"),
    ("☠️ manchesterfåtöljen påstås ha fem lägen", "4a9c33d2", "eg",
     "Levereras omonterad", "Fotstödet ställs i fem lägen", "fem lägen"),
    ("björkvilstolen tappar sina fem lägen", "84082d41", "*",
     "fem lägen", "flera lägen", "fem lägen"),
    ("☠️ björkvilstolen påstås ha justerbara golvskydd", "7e00970f", "eg",
     "Bär 120 kg", "Justerbara golvskydd under benen", "golvskydd"),

    # --- materialet -------------------------------------------------------
    ("☠️ manchestern skrivs som naken sammet", "e1c41327", "eg",
     "Klädsel i manchester, 100 % polyester", "Klädsel i sammet", "sammet"),
    ("☠️ manchestern skrivs som läder", "58fb3025", "eg",
     "Levereras omonterad", "Klädsel i läder", "läder"),
    ("☠️ björkdynan skrivs som bomull", "84082d41", "eg",
     "Bär 120 kg", "Dyna i bomull", "bomull"),
    ("☠️ boken skrivs som ek", "66adcdff", "eg",
     "Ben i massiv bok med inbyggd stålram", "Ben i massiv ek", "ek"),

    # --- rundans egna grindar --------------------------------------------
    ("☠️ källans 'Esszimmerstuhl' slinker in som matstol", "7e00970f", "eg",
     "Bär 120 kg", "Fungerar som matstol", "matstol"),
    ("☠️ massage påstås", "791e7292", "eg",
     "Levereras omonterad", "Massage i ryggen", "massage"),
    ("hälsopåstående slinker in", "4a9c33d2", "eg",
     "Levereras omonterad", "Lindrar värk i ryggen", "hälsopåstående"),

    # --- vikten -----------------------------------------------------------
    ("manchesterfåtöljen får björkvilstolens vikt", "e1c41327", "*",
     "19,7 kg", "10,3 kg", "vikt"),
    ("björkvilstolen får manchesterfåtöljens vikt", "7e00970f", "*",
     "10,3 kg", "19,7 kg", "vikt"),

    # --- måtten som MÅSTE nå kunden --------------------------------------
    ("ryggens höjd tappas", "58fb3025", "*", "101 cm", "111 cm", "101 cm"),
    ("sitsdynans tjocklek tappas", "bc220489", "*", "11 cm", "13 cm", "11 cm"),
    ("fotpallens mått tappas", "791e7292", "*", "65 × 43 × 38", "60 × 40 × 35",
     "65 × 43 × 38"),
    ("björkramens profil tappas", "84082d41", "*", "60 × 22 mm", "50 × 20 mm",
     "60 × 22 mm"),

    # --- husreglerna ------------------------------------------------------
    ("tyskt ord slinker in", "66adcdff", "eg",
     "Levereras omonterad", "Hocker ingår i leveransen", "tysk"),
    ("husmärket kommer tillbaka", "4a9c33d2", "name",
     "Manchesterfåtölj", "HOMCOM Manchesterfåtölj", "husmärke"),
    ("avsändarlandet skrivs ut", "bc220489", "eg",
     "Levereras omonterad", "Tillverkad i Tyskland", "land"),
    ("attributionen kommer tillbaka", "e1c41327", "faq",
     "Massiv bok, med justerbara", "Leverantören anger massiv bok, med justerbara",
     "attribution"),
    ("artikelnumret läcker", "7e00970f", "spec",
     "Vikt: 10,3 kg", "Artikelnummer: 833-041V80", "artikelnummer"),
    ("lagerfras i texten", "58fb3025", "eg",
     "Levereras omonterad", "Skickas från vårt EU-lager", "lagerfras"),
    ("länk till en slug som ingen har skrivit", "66adcdff", "faq",
     "fatolj-orange-manchester-fotpall", "fatolj-orange-manchester-fotpal",
     "slug", True),
    ("länk till sig själv", "bc220489", "faq",
     "fatolj-gul-manchester-fotpall", "fatolj-orange-manchester-fotpall",
     "sig själv", True),
]

# ☠️ Varje färgsyskon måste kunna FÄLLAS mot varje annat. En handskriven lista
#    hade täckt de par jag råkade tänka på; den här genererar alla trettio.
for _a in CORD:
    for _b in CORD:
        if _a == _b:
            continue
        MUTATIONER.append(
            ("färgparet %s→%s" % (FARG[_a], FARG[_b]), _a, "*",
             FARG[_a], FARG[_b], "'%s'" % FARG[_b]))


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
