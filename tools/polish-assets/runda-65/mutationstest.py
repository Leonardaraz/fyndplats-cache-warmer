# -*- coding: utf-8 -*-
"""Mutationstest för runda 65. Varje mutation ska fällas av EN NAMNGIVEN grind.

Ett test som bara kräver "någon brist" provar inte grinden du tror (runda 53),
och en mutation som inte ändrar något provar ingenting alls — därför tas ett
avtryck före och efter, och det täcker VARJE fält grinden läser (runda 63).
"""
import copy
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

import texter                                                    # noqa: E402
import lint                                                      # noqa: E402


def avtryck(batch):
    return "\x1f".join(
        "\x1e".join([p["kort"], p["name"], p["title"], p["meta"], p["slug"],
                     p["sokord"], p["sku"], texter.bygg(p)])
        for p in batch)


def kor_grindar(batch):
    lint.FEL = []
    lint.PRODUKTER = batch
    lint.SLUGGAR = {p["slug"]: p for p in batch}
    lint.SLUG2KORT = {p["slug"]: p["kort"] for p in batch}
    return lint.kor()


# ☠️ EN MUTATION MÅSTE TA BORT VARJE BÄRARE AV FAKTUMET (runda 63:s regel).
#    Fyra av runda 65:s första mutationer rapporterades som MISSADE grindar och
#    var i själva verket dåliga mutationer: "vikten försvinner" tog bort
#    `Vikt: 10 kg` ur spec medan meta, ingress, en egenskapspunkt OCH ett
#    FAQ-svar fortfarande bar samma tal. Grinden hade rätt; provet var fel.
#    Därför finns `falt="*"` (varje fält) och `kort="*"` (varje produkt).
SKYDDADE = {"kort", "id"}          # bär identiteten — muteras aldrig


def byt_i(v, gammal, ny):
    if isinstance(v, str):
        return v.replace(gammal, ny)
    if isinstance(v, tuple):
        return tuple(byt_i(x, gammal, ny) for x in v)
    if isinstance(v, list):
        return [byt_i(x, gammal, ny) for x in v]
    return v


def satt(p, falt, gammal, ny):
    for f in (sorted(set(p) - SKYDDADE) if falt == "*" else [falt]):
        p[f] = byt_i(p[f], gammal, ny)


MUTATIONER = [
    # --- korshänvisningen: rundans nya grind -------------------------------
    ("korshänvisning påstår FEL last om målet", "3dab61f0", "faq",
     "fälls till 130° och bär 150 kg", "fälls till 130° och bär 200 kg",
     "korshänvisning"),
    ("korshänvisning påstår FEL färg om målet", "2823c605", "faq",
     "reclinerfåtölj i svart konstläder", "reclinerfåtölj i blå konstläder",
     "korshänvisningens"),
    ("egen mening får målets lasttal", "eb400961", "eg",
     "Bär 120 kg", "Bär 150 kg", "maxlast"),

    # --- färgen läses ur FOTOT ---------------------------------------------
    # ☠️ Båda de här färgerna var FEL i första utkastet och rättades mot bilden:
    #    89c89322 är salviagrön, inte grå; 03c9d570 är gråbeige, inte ljusbrun.
    ("salviagröna stolen kallas grå", "89c89322", "*",
     "grågrön", "grå", "färgord"),
    ("gråbeige stolen kallas ljusbrun", "03c9d570", "*",
     "gråbeige", "ljusbrun", "färgord"),

    # --- rundans egna materialfällor ---------------------------------------
    ("massagestol återinförs", "3dab61f0", "eg",
     "Ryggen låses steglöst med ett vred",
     "Massagefunktion i ryggen", "massage"),
    ("säng påstås om golvfåtöljen", "db645ff8", "eg",
     "Fälls helt platt till 108 × 55 cm, 12 cm tjock",
     "Blir en säng på 108 cm", "sovplats"),
    ("massivt trä påstås om fanérramen", "bb7b7bd4", "eg",
     "Fjädrande ram i björkfanér", "Ram i massivt trä", "massivt trä"),
    ("bomull påstås", "88425b27", "spec",
     "Material: linnelook (100 % polyester), böjd träfanér, skum",
     "Material: bomull, böjd träfanér, skum", "bomull"),
    ("hälsopåstående", "03c9d570", "ingress",
     "Ryggen är låg", "Ryggen förebygger ryggsmärta och är låg", "hälsopåstående"),

    # --- vikten som motsäger sig -------------------------------------------
    ("förbjuden vikt publiceras", "88425b27", "spec",
     "Paketmått: 73 × 58 × 27 cm", "Vikt: 12 kg", "vikt"),
    # Varje bärare: meta, ingress, en egenskapspunkt, spec-raden och FAQ-svaret.
    ("vikten försvinner där den finns", "bb7b7bd4", "*",
     "10 kg", "9,5 kg", "vikt"),

    # --- artikelnumret ------------------------------------------------------
    ("artikelnummer med BOKSTAV i första ledet", "89c89322", "spec",
     "Maxlast: 120 kg", "Maxlast: 120 kg — art. 83B-912V00GY", "artikelnummer"),
    ("etiketten Modellreferens", "eb400961", "spec",
     "Färg: svart med silverfärgad ram", "Modellreferens: 845-030CG",
     "artikelnummer"),

    # --- språk, märke, land, attribution ------------------------------------
    ("tyskt ord", "2823c605", "spec",
     "Material: konstläder, skum, böjt trä",
     "Material: Kunstleder, Schaumstoff, Holz", "tyskt ord"),
    ("husmärke", "db645ff8", "ingress", "Ryggen låses", "HOMCOM-ryggen låses",
     "husmärke"),
    ("avsändarland", "03c9d570", "faq",
     "Ja, benen skruvas på.", "Ja, benen skruvas på efter frakt från Tyskland.",
     "land"),
    ("attribution", "89c89322", "skotsel",
     "Räkna med upp till 72 timmar",
     "Leverantören anger upp till 72 timmar", "attribution"),

    # --- påståenden som MÅSTE nå kunden -------------------------------------
    ("sovplatsförnekandet försvinner", "db645ff8", "*",
     "inte en sovplats i full längd", "kort", "sovplats"),
    ("fotpallens 30 kg försvinner", "88425b27", "eg",
     "Stolen bär 120 kg, fotpallen 30 kg", "Stolen bär 120 kg",
     "fotpallen 30 kg"),
    ("72-timmarsnotisen försvinner", "89c89322", "*",
     "72 timmar", "en tid", "72 timmar"),
    ("väggavståndet försvinner", "2823c605", "*",
     "80 cm", "gott om plats", "80 cm"),

    # --- montering ----------------------------------------------------------
    ("monteringen försvinner ur egenskaperna", "eb400961", "eg",
     "Monteras på omkring tio minuter", "Snabb att komma igång med", "monter"),
    ("färdigmonterad försvinner", "db645ff8", "eg",
     "Kommer färdig — ingen montering", "Levereras i kartong", "färdigmonterad"),

    # --- liggfunktion --------------------------------------------------------
    ("liggfunktion påstås utan att finnas", "bb7b7bd4", "eg",
     "Hög rygg, 105 cm över golv", "Ryggen fälls till 140°", "liggfunktion"),

    # --- länkar --------------------------------------------------------------
    ("relativ länk", "db645ff8", "faq",
     "https://www.fyndplats.se/produkt/liten-fatolj-60-cm-chenille",
     "/produkt/liten-fatolj-60-cm-chenille", "länk"),
    ("länk utanför batchen", "03c9d570", "faq",
     "https://www.fyndplats.se/produkt/snurrfatolj-armlos-35-cm-dyna",
     "https://www.fyndplats.se/produkt/loungefatolj-sherpafleece-graddvit",
     "utanför batchen"),
    ("länk till sig själv", "89c89322", "faq",
     "https://www.fyndplats.se/produkt/liten-fatolj-60-cm-chenille",
     "https://www.fyndplats.se/produkt/snurrfatolj-armlos-35-cm-dyna",
     "sig själv"),

    # --- SKU och slug --------------------------------------------------------
    ("SKU bryter 24-teckenregeln", "03c9d570", "sku",
     "FP-liten-fatolj-60-cm", "FP-liten-fatolj-60-cm-chenille", "SKU"),
    ("SKU krockar inom batchen", "bb7b7bd4", "sku",
     "FP-loungefatolj-bjorkfaner", "FP-liten-fatolj-60-cm", "SKU"),
    # ☠️ Den här mutationen var TOM i sak: `reclinerfatolj-med-snurrfot-grader`
    #    ger SAMMA sku_bas (fogeordet faller bort, `grader` ryms inte ändå), så
    #    SKU-grinden hade inget att invända. Och den byttes bara i EN produkt,
    #    så syskonets länk pekade på en slug som inte längre fanns — jobbet föll
    #    på länkgrinden i stället. Nu byts slugen i HELA batchen (länkarna följer
    #    med) till en som faktiskt ger en annan bas.
    ("slug byts utan att SKU följer med", "*", "*",
     "reclinerfatolj-snurrfot-130-grader", "snurrfatolj-recliner-130-grader",
     "SKU"),

    # --- SEO-fälten ----------------------------------------------------------
    ("fokusordet lämnar titeln", "89c89322", "title",
     "Armlös snurrfåtölj, 35 cm dyna", "Armlös vilmöbel, 35 cm dyna",
     "fokusordet"),
    ("meta blir för kort", "db645ff8", "meta",
     "Golvfåtölj i blått med ryggen låsbar i 13 lägen. Fälls helt platt till 108 × 55 cm, väger 7 kg och bär 120 kg.",
     "Golvfåtölj i blått med 13 lägen.", "meta"),
    ("title blir för lång", "eb400961", "title",
     "Fåtölj på medar, 22 cm sittdyna | Fyndplats",
     "Fåtölj på stålmedar med 22 cm tjock sittdyna i konstläder | Fyndplats",
     "title"),
]


def main():
    rent = kor_grindar(copy.deepcopy(texter.PRODUKTER))
    if rent:
        print("AVBRYTER: grindarna är inte gröna på den riktiga texten")
        for f in rent:
            print("  " + f)
        return 1

    fangade, missade, tomma = 0, [], []
    for namn, kort, falt, gammal, ny, vantat in MUTATIONER:
        batch = copy.deepcopy(texter.PRODUKTER)
        fore = avtryck(batch)
        for p in batch:
            if kort in ("*", p["kort"]):
                satt(p, falt, gammal, ny)
        if avtryck(batch) == fore:
            tomma.append(namn)
            continue
        fel = kor_grindar(batch)
        if [f for f in fel if vantat.lower() in f.lower()]:
            fangade += 1
        else:
            missade.append((namn, vantat, fel[:3]))

    kor_grindar(copy.deepcopy(texter.PRODUKTER))
    print("%d av %d mutationer fångades av RÄTT grind" % (fangade, len(MUTATIONER)))
    for namn in tomma:
        print("TOM MUTATION (ändrade ingenting): %s" % namn)
    for namn, vantat, fel in missade:
        print("MISSAD: %s — väntade '%s', fick %s" % (namn, vantat, fel or "inga fel"))
    return 1 if (tomma or missade) else 0


if __name__ == "__main__":
    sys.exit(main())
