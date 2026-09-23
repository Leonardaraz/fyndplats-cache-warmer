# -*- coding: utf-8 -*-
"""Mutationstest för runda 64.

Varje mutation ska fällas av EN NAMNGIVEN grind. Ett test som bara kräver
"någon brist" provar inte grinden du tror (runda 53). Och en mutation som inte
ändrar något provar ingenting alls — därför tas ett avtryck före och efter.

☠️ Avtrycket måste täcka VARJE fält grinden läser. Runda 63 hade ett hål just
där: fingeravtrycket saknade `slug`, så en slug-mutation räknades som tom.
"""
import re
import sys
import copy

import texter
import lint


def avtryck(batch):
    return "\x1f".join(
        "\x1e".join([p["kort"], p["name"], p["title"], p["meta"], p["slug"],
                     p["sokord"], p["sku"], texter.bygg(p)])
        for p in batch)


def kor_grindar(batch):
    lint.FEL = []
    lint.PRODUKTER = batch
    lint.SLUGGAR = {p["slug"]: p for p in batch}
    return lint.kor()


def satt(p, falt, gammal, ny):
    """Byter i ett strängfält eller i en lista av strängar/par."""
    v = p[falt]
    if isinstance(v, str):
        p[falt] = v.replace(gammal, ny)
    elif falt == "faq":
        p[falt] = [(f.replace(gammal, ny), s.replace(gammal, ny)) for f, s in v]
    else:
        p[falt] = [r.replace(gammal, ny) for r in v]


# (namn, kort, fält, gammal, ny, ord som ska stå i felmeddelandet)
MUTATIONER = [
    # --- påstående mot förnekande: den svåraste, och den som lagades sist ---
    ("bomull blir ett PÅSTÅENDE", "beacff5a", "faq",
     "Nej, den är polyester. Ramen är björk.",
     "Ja, klädseln är bomull. Ramen är björk.", "bomull"),
    ("gummi blir ett PÅSTÅENDE", "ca92e3ce", "faq",
     "Nej, den är gummiträ.", "Ja, den är gummi.", "gummi"),
    ("gummi smyger in i skötseln", "ca92e3ce", "skotsel",
     "Det är alltså trä, inte gummi", "Det är alltså mjukt gummi", "gummi"),

    # --- artikelnumret, husets farligaste läcka ---
    ("artikelnummer i spec", "b09d20b7", "spec",
     "Maxlast: 120 kg", "Maxlast: 120 kg — art. 83F-028V00GY", "artikelnummer"),
    ("artikelnummer i namnet", "5e2dee74", "name",
     "Reclinerfåtölj", "Reclinerfåtölj 830-701V02WT", "artikelnummer"),
    ("etiketten Modellreferens", "beacff5a", "spec",
     "Maxlast: 120 kg", "Modellreferens: 845-030CG", "artikelnummer"),

    # --- attribution: mot kunden är VI leverantören ---
    ("leverantören anger", "17620f5b", "faq",
     "Den är avsedd för benen", "Leverantören anger att den är avsedd för benen",
     "attribution"),
    ("enligt tillverkaren", "90caeb9d", "eg",
     "Bär 250 kg", "Bär 250 kg enligt tillverkaren", "attribution"),

    # --- tyska rester ---
    ("tyskt ord i specen", "e76002c1", "spec",
     "Material: mikrofiber, skum", "Material: Mikrofaser, Schaumstoff", "tyskt ord"),
    ("tyskt ord i ingressen", "b01d8af2", "ingress",
     "Fotpallen är lös", "Der Hocker är lös", "tyskt ord"),

    # --- husmärke och land ---
    ("husmärke", "ca92e3ce", "ingress", "68 cm bred", "HOMCOM 68 cm bred",
     "husmärke"),
    ("avsändarland", "90caeb9d", "faq",
     "Den kommer färdig", "Den kommer färdig från Tyskland", "land"),

    # --- siffror ---
    ("fel maxlast", "b09d20b7", "eg", "bär 120 kg", "bär 150 kg", "maxlast"),
    ("vikt på den som motsäger sig", "b01d8af2", "spec",
     "Benhöjd: 33 cm", "Vikt: 16 kg", "vikt"),
    ("vikten försvinner", "5e2dee74", "spec", "Vikt: 42,6 kg", "Höjd: 42,6 cm",
     "vikt"),

    # --- produktkategori ---
    ("öronlappsfåtölj med låg rygg", "b09d20b7", "name",
     "Snurrfåtölj", "Öronlappsfåtölj", "öronlapp"),
    ("kallas matstol", "beacff5a", "eg",
     "Armstöd för stöd", "Fungerar även som matstol", "matstol"),
    ("liggfunktion utan liggfunktion", "ca92e3ce", "eg",
     "Bär 120 kg", "Ryggen fälls till 140°", "liggfunktion"),

    # --- montering ---
    # ☠️ Mutationen måste ta bort faktumets BÄRARE. Ett första utkast tog bort
    # ordet ur FAQ-svaret och lämnade egenskapsraden kvar — grinden läser
    # egenskaper och spec, så den mutationen provade ingenting.
    ("monteringen försvinner ur egenskaperna", "17620f5b", "eg",
     "Monteras — stålramen skruvas ihop", "Pulverlackerad stålram",
     "monter"),
    ("färdigmonterad försvinner", "90caeb9d", "eg",
     "Levereras färdigmonterad — inga verktyg", "Levereras i en kartong",
     "färdigmonterad"),

    # --- länkar ---
    ("relativ länk", "5e2dee74", "faq",
     "https://www.fyndplats.se/produkt/tv-fatolj-mugghallare-135",
     "/produkt/tv-fatolj-mugghallare-135", "länk"),
    ("länk utanför batchen", "beacff5a", "faq",
     "https://www.fyndplats.se/produkt/djup-fatolj-250-kg-manchesterlook",
     "https://www.fyndplats.se/produkt/loungefatolj-sherpafleece-graddvit",
     "utanför batchen"),
    ("länk till sig själv", "90caeb9d", "faq",
     "https://www.fyndplats.se/produkt/vilstol-bjork-femstegs-fotstod",
     "https://www.fyndplats.se/produkt/djup-fatolj-250-kg-manchesterlook",
     "sig själv"),

    # --- SKU och slug ---
    ("SKU bryter 24-teckenregeln", "beacff5a", "sku",
     "FP-vilstol-bjork-femstegs", "FP-vilstol-bjork-femstegs-fotstod", "SKU"),
    ("SKU krockar inom batchen", "ca92e3ce", "sku",
     "FP-fatolj-skandinavisk-stil", "FP-djup-fatolj-250-kg", "SKU"),
    ("slug byts utan att SKU följer med", "b01d8af2", "slug",
     "sammetsfatolj-fotpall-33-cm-ben", "sammetsfatolj-med-lös-pall", "SKU"),

    # --- färgen: specen sa Braun, fotot säger grått ---
    ("brun återinförs från feedens färgkolumn", "e76002c1", "spec",
     "Färg: gråbeige", "Färg: brun", "färgord"),
    ("fel färg i meta", "b01d8af2", "meta",
     "i ljusgrått", "i beige", "färgord"),

    # --- SEO-fälten ---
    ("fokusordet lämnar titeln", "e76002c1", "title",
     "Tv-fåtölj med mugghållare, 135°", "Bekväm stol med hållare, 135°",
     "fokusordet"),
    ("meta blir för kort", "b09d20b7", "meta",
     "Snurrfåtölj i grå chenille med fotpall som ställs steglöst mellan 40 och 47 cm. Båda delarna snurrar 360°. Bär 120 kg.",
     "Snurrfåtölj i grå chenille. Bär 120 kg.", "meta"),
    ("title blir för lång", "17620f5b", "title",
     "Reclinerfåtölj med fotpall, 130° | Fyndplats",
     "Reclinerfåtölj med fotpall och 360° snurrfot i mörkgrå mikrofiber | Fyndplats",
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
            if p["kort"] == kort:
                satt(p, falt, gammal, ny)
        if avtryck(batch) == fore:
            tomma.append(namn)
            continue
        fel = kor_grindar(batch)
        traffar = [f for f in fel if vantat.lower() in f.lower()]
        if traffar:
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
