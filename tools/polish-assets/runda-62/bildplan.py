# -*- coding: utf-8 -*-
"""Runda 62 — svenska alt-texter till alla 40 bilder.

Bildordningen är identisk på alla åtta: 1 produkt mot vitt · 2 miljöbild ·
3 måttritning · 4 detalj eller miljö · 5 närbild. Texterna beskriver vad
bilden VISAR, inte vad produkten heter — och de nämner varken husmärke,
avsändarland eller något leverantören inte belagt.
"""

D = [
    "%s knästol sedd snett framifrån, med böjda medar i ljus plywood",
    "%s",
    "Måttritning av den %s knästolen: 55 cm bred, 85 cm djup, 55 cm hög, sits 41 cm",
    "%s",
    "%s",
]

G = [
    "%s knästol i björk sedd snett framifrån, med sits och två knädynor",
    "%s",
    "Måttritning av den %s knästolen: 51 cm bred, 69 cm djup, 58 cm hög, sits 39 × 30 cm",
    "%s",
    "%s",
]

BOJD = {"Ljusgrå": "ljusgrå", "Grå": "grå", "Krämfärgad": "krämfärgade",
        "Mörkgrå": "mörkgrå", "Blå": "blå", "Svart": "svarta"}

PLAN = {
    # ---- modell D ----
    "67bd3628": ("Ljusgrå", [
        None,
        "Person sitter på den ljusgrå knästolen vid ett skrivbord, med smalbenen mot knädynan",
        None,
        "Knästolen står framför ett skrivbord i ett ljust arbetsrum",
        "Närbild på sittdynans kant och plywoodramens limmade lager",
    ]),
    "b97ac1d8": ("Grå", [
        None,
        "Den grå knästolen vid ett skrivbord med bärbar dator",
        None,
        "Närbild på medens böjda plywood och skruvförbandet mot ramen",
        "En hand trycker ned sittdynan för att visa stoppningen",
    ]),
    "b5d8eb9c": ("Krämfärgad", [
        None,
        "Den krämfärgade knästolen vid ett hörnskrivbord",
        None,
        "Närbild på den krämfärgade sittdynan uppifrån",
        "Närbild på knädynan och den böjda meden",
    ]),
    # ---- modell G ----
    "6d64de9b": ("Krämfärgad", [
        None,
        "Den krämfärgade knästolen framför ett skrivbord",
        None,
        "Knästolen i ett vardagsrum bredvid en hylla",
        "Sittdynan sedd uppifrån, med den framåtlutande vinkeln",
    ]),
    "9d626528": ("Mörkgrå", [
        None,
        "Person läser sittande på den mörkgrå knästolen vid ett skrivbord",
        None,
        "Den mörkgrå knästolen i ett vardagsrum bredvid en hylla",
        "Närbild på den mörkgrå sittdynan och björkramen",
    ]),
    "c3e0af3f": ("Blå", [
        None,
        "Person sitter på den blå knästolen med händerna på skrivbordet",
        None,
        "Närbild på den blå sittdynan och björkramen",
        "Närbild på de två blå knädynorna",
    ]),
    "05cc1f9c": ("Svart", [
        None,
        "Person sitter på den svarta knästolen med händerna på skrivbordet",
        None,
        "Närbild på den svarta sittdynan och björkramen",
        "Närbild på de två svarta knädynorna",
    ]),
    "9e656e81": ("Ljusgrå", [
        None,
        "Person sitter på den ljusgrå knästolen med händerna på skrivbordet",
        None,
        "Närbild på den ljusgrå sittdynan och björkramen",
        "Närbild på de två ljusgrå knädynorna",
    ]),
}

MODELL = {"67bd3628": "D", "b97ac1d8": "D", "b5d8eb9c": "D",
          "6d64de9b": "G", "9d626528": "G", "c3e0af3f": "G",
          "05cc1f9c": "G", "9e656e81": "G"}


def alt_texter(kort):
    farg, egna = PLAN[kort]
    mall = D if MODELL[kort] == "D" else G
    ut = []
    for i in range(5):
        if egna[i] is not None:
            ut.append(egna[i])
        elif "%s" in mall[i]:
            # Bild 1 inleder meningen (versal färg), bild 3 böjer den i bestämd form.
            ut.append(mall[i] % (BOJD[farg] if i == 2 else farg))
        else:
            ut.append(mall[i])
    return ut


def granska():
    """Grindar på alt-texterna. Tom lista = godkänt."""
    import re
    fel = []
    FORBJUDET = ["HOMCOM", "Vinsetto", "Aosom", "Tyskland", "Kina", "ergonomisch",
                 "Kniestuhl", "Kniehocker", "kontorsstol", "lindrar", "hälsa",
                 "justerbar", "höjdjusterbar"]
    sedda = {}
    for kort in PLAN:
        for i, a in enumerate(alt_texter(kort), 1):
            if len(a) > 125:
                fel.append("%s bild %d: %d tecken (max 125)" % (kort, i, len(a)))
            for f in FORBJUDET:
                if re.search(re.escape(f), a, re.I):
                    fel.append("%s bild %d: förbjudet ord '%s'" % (kort, i, f))
            if re.search(r"\d+\.\d", a):
                fel.append("%s bild %d: decimalpunkt" % (kort, i))
            if re.search(r"\d\s*x\s*\d", a):
                fel.append("%s bild %d: 'x' i stället för '×'" % (kort, i))
            # ☠️ Två produkter får inte dela alt-text: ögat kan inte skilja fem
            #    knästolar åt, och en delad text betyder att fel bild kan hamna
            #    på fel sida utan att någon märker det.
            if a in sedda and sedda[a] != kort:
                fel.append("DELAD alt-text mellan %s och %s: '%s'" % (sedda[a], kort, a[:50]))
            sedda[a] = kort
    return fel


if __name__ == "__main__":
    f = granska()
    for kort in sorted(PLAN):
        for i, a in enumerate(alt_texter(kort), 1):
            print("%s %d  %3d  %s" % (kort, i, len(a), a))
    print()
    if f:
        for x in f:
            print("FEL " + x)
        raise SystemExit(1)
    print("40 alt-texter, alla unika och inom gränserna.")
