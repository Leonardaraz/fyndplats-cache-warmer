# -*- coding: utf-8 -*-
"""Runda 85 — mutationstest av ALT-GRINDEN i media.py.

En grind som aldrig fällt är ingen grind. Varje mutation nedan är ett fel
som FAKTISKT kunde ha skrivits, och testet kräver att media.py avslutar med
nollskild kod för var och en.

☠️ Mutation 7 är den som byggde den sista grinden. "Syskonets mått i
   ritningsalt" SLAPP FÖRST IGENOM: b10b80ee:s 45,8 cm byttes mot syskonets
   40 cm, och 40 cm finns i den produktens PAKETMÅTT — alltså i dess egen
   spec, alltså godkänt av grinden "talet står i produktens egen spec".
   Måttritningen påstår sig återge en BESTÄMD rad, så den jämförs numera med
   just den raden i stället för med hela specen.
"""
import os
import subprocess
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
MAL = os.path.join(HAR, "media.py")

MUTATIONER = [
    ("syskonets volym i kortets alt-text",
     '"17fb1869": "Faktakort: soptunna med två fack 30 liter',
     '"17fb1869": "Faktakort: soptunna med två fack 56 liter'),
    ("fel stommaterial i alt-texten",
     '"a00882ed": {\n        1: "Vit soptunna med två fack',
     '"a00882ed": {\n        1: "Vit soptunna i rostfri plåt med två fack'),
    ("husmärke i alt-texten",
     '2: "Soptunnan i silver står intill en köksö',
     '2: "Homcom-soptunnan i silver står intill en köksö'),
    ("attribution — mot kunden är VI leverantören",
     '5: "De två svarta innerhinkarna lyfta',
     '5: "Leverantörens två svarta innerhinkar lyfta'),
    ("tyskt ord i alt-texten",
     '2: "Den utdragbara soptunnan halvvägs utdragen ur ett vitt köksskåp"',
     '2: "Den utdragbara soptunnan i ett Küche-skåp"'),
    ("två bilder får samma alt-text",
     '5: "Två låga soptunnor med två fack står intill en köksbänk i trä"',
     '5: "Låg soptunna med två fack i mörk borstad stålyta, sedd snett "\n'
     '           "framifrån med de två fotpedalerna"'),
    ("syskonets mått i måttritningens alt-text",
     '3: "Måttritning: soptunnan i silver är 45,8 cm bred',
     '3: "Måttritning: soptunnan i silver är 40 cm bred'),
    ("ett mått faller bort ur måttritningens alt-text",
     '3: "Måttritning: den vita soptunnan är 48,8 cm bred, 39,5 cm djup och "\n'
     '           "67 cm hög"',
     '3: "Måttritning: den vita soptunnan är 48,8 cm bred och 67 cm hög"'),
    ("rammåttet i stället för yttermåttet på den utdragbara",
     '"8, och mäter 48 × 34,3 × 35,1 cm utdragen"',
     '"8, och mäter 47 × 33 × 32 cm utdragen"'),
]

if __name__ == "__main__":
    orig = open(MAL, encoding="utf-8").read()
    fangade = 0
    try:
        for namn, a, b in MUTATIONER:
            if a not in orig:
                print("%-52s ☠️ MUTATIONEN MATCHAR INTE KÄLLAN" % namn)
                continue
            open(MAL, "w", encoding="utf-8").write(orig.replace(a, b, 1))
            r = subprocess.run([sys.executable, MAL], capture_output=True,
                               text=True, cwd=HAR)
            ok = r.returncode != 0
            fangade += ok
            print("%-52s %s" % (namn, "FÅNGAD" if ok else "☠️ SLAPP IGENOM"))
    finally:
        open(MAL, "w", encoding="utf-8").write(orig)
    print("%d/%d fångade" % (fangade, len(MUTATIONER)))
    if fangade != len(MUTATIONER):
        raise SystemExit(1)
