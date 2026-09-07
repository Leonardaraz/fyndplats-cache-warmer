# -*- coding: utf-8 -*-
"""Runda 86 — mutationstest av ALT-GRINDEN i media.py.

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
    ("syskonets maxlast i kortets alt-text",
     '"c9a24404": "Faktakort: trädgårdsskåp i trä 115 cm, mått, hyllplan, "\n'
     '                "maxlast och material"',
     '"c9a24404": "Faktakort: trädgårdsskåp i trä 115 cm, 20 kg maxlast"'),
    ("en maxlast på skåpet vars källa inte anger någon",
     '4: "Närbild på en korg med redskap och rep på en av hyllorna"',
     '4: "Närbild på en korg med redskap och rep på en hylla som bär 20 kg"'),
    ("syskonets färg i alt-texten",
     '1: "Trädgårdsskåp i naturfärgad gran med två lamelldörrar"',
     '1: "Trädgårdsskåp med grå stomme och två lamelldörrar"'),
    ("bygglovspåstående i alt-texten",
     '2: "Det smala trädgårdsskåpet står mot ett plank med klätterväxter"',
     '2: "Det bygglovsfria skåpet står mot ett plank med klätterväxter"'),
    ("husmärke i alt-texten",
     '1: "Brett trädgårdsskåp med grå stomme, vita kryss på båda dörrarna "',
     '1: "Brett Outsunny-trädgårdsskåp med grå stomme, vita kryss "'),
    ("attribution — mot kunden är VI leverantören",
     '5: "Närbild på skåpets överkant och den lodräta panelen på sidan"',
     '5: "Leverantörens närbild på skåpets överkant"'),
    ("tyskt ord i alt-texten",
     '1: "Trädgårdsskåp i naturfärgad gran med två lamelldörrar"',
     '1: "Ett Gartenschrank i naturfärgad gran med två lamelldörrar"'),
    ("två bilder får samma alt-text",
     '5: "Närbild på skåpets svarta takyta",\n'
     '        3: "Måttritning: skåpet är 139 cm brett',
     '5: "Närbild underifrån på takets utskjutande kant",\n'
     '        3: "Måttritning: skåpet är 139 cm brett'),
    ("syskonets mått i måttritningens alt-text",
     '3: "Måttritning: skåpet är 87 cm brett, 46,5 cm djupt och 160 cm högt"',
     '3: "Måttritning: skåpet är 78 cm brett, 46,5 cm djupt och 160 cm högt"'),
    ("ett mått faller bort ur måttritningens alt-text",
     '3: "Måttritning: skåpet är 79 cm brett, 49 cm djupt och 191,5 cm högt"',
     '3: "Måttritning: skåpet är 79 cm brett och 191,5 cm högt"'),
    ("ett tal i alt-texten som inte står i produktens egen spec",
     '2: "Det breda trädgårdsskåpet står öppet på en gräsmatta med redskap "',
     '2: "Det breda trädgårdsskåpet med 0,43 m² golvyta står öppet med redskap "'),
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
