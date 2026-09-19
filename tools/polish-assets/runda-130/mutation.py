# -*- coding: utf-8 -*-
"""Runda 130 — mutationstest: bevisar att VARJE grind kan fälla, och att det
är RÄTT grind som fäller.

☠️ MUTERA GENOM ATT LÄGGA TILL, INTE BYTA UT (runda 55). Ett utbyte tar bort
   ett uppmätt värde, så måttgrinden fäller först och den grind man tror sig
   testa kan vara helt avväpnad utan att testet märker något.

☠️ VARJE MUTATION PÅSTÅR ATT DEN LANDADE. Runda 47: en mutation som inte tog
   rapporterades som "grinden fyrar inte".

☠️ VARJE MUTATION PÅSTÅR VILKEN GRIND SOM SKA FÄLLA. Runda 47: sökords-
   grinden låg före krockgrinden och maskerade den — testet såg "någon
   brist" och godkände en oprövad kontroll.
"""
import sys

import grind as GR
import texter as T

PID = "65e3c24f"
PID_B = "a8cf27cd"

MUTATIONER = [
    ("tyskt ord", PID, "INTRO", " Der Rattanschirm ist handgewebt.", "TYSKT ORD"),
    ("vattentät utan negation", PID, "INTRO",
     " Lampan är vattentät.", "VATTENTÄT"),
    ("äkta rotting", PID, "INTRO",
     " Skärmarna är gjorda av äkta rotting.", "NATURMATERIAL"),
    ("bordspåstående", PID, "INTRO",
     " Den fungerar också som sidobord på dagen.", "BORD"),
    ("aktörsord", PID, "INTRO",
     " Leverantören anger höjden till 144 centimeter.", "AKTÖRSORD"),
    ("land", PID, "INTRO", " Lampan kommer från Tyskland.", "LAND"),
    ("lagerfras", PID, "INTRO", " Den skickas från vårt lager.", "LAGERFRAS"),
    ("husmärke", PID, "INTRO", " Tillverkad av Outsunny.", "HUSMÄRKE"),
    ("superlativ", PID, "INTRO",
     " Det är marknadens finaste solcellslampa.", "SUPERLATIV"),
    ("leveranslöfte", PID, "INTRO",
     " Vi har fri frakt på den här lampan.", "LEVERANSLÖFTE"),
    ("artikelnummeretikett", PID, "INTRO",
     " Artikelnummer finns i kartongen.", "ARTIKELNUMMER-ETIKETT"),
    ("kategoriklyscha", PID, "INTRO",
     " Lampan lyser upp hela uteplatsen.", "KATEGORIKLYSCHA"),
    ("jämförelse utan mätning", PID, "INTRO",
     " Den ger samma ljus som en stearinljuslåga.", "JÄMFÖRELSE"),
    ("ohärlett tal", PID, "INTRO",
     " Skärmarna sitter 63 centimeter isär.", "OHÄRLETT TAL 63"),
    ("kommalista av tal", PID, "INTRO",
     " Skärmarna sitter på 40, 80 och 144 centimeter.", "KOMMALISTA"),
    ("CE-påstående", PID_B, "INTRO", " Lyktan är CE-märkt.", "CERTIFIERINGS"),
    ("lovar mer än IP44", PID_B, "INTRO",
     " Den tål högtryckstvätt.", "LOVAR MER ÄN IP44"),
]


def _kor(namn, pid, falt, tillagg, vantad):
    d = getattr(T, falt)
    orig = d[pid]
    d[pid] = orig + tillagg
    try:
        assert tillagg.strip() in T.bygg(pid), "mutationen landade inte"
        fel = GR.granska(pid)
        if not fel:
            return "SLÄPPER IGENOM"
        if not any(vantad in f for f in fel):
            return "FEL GRIND föll: %s" % fel[0][:70]
        return None
    finally:
        d[pid] = orig


if __name__ == "__main__":
    # Kontrollprov: orörd text ska vara ren i BÅDA riktningarna.
    rent = sum(len(GR.granska(p)) for p in T.NAMN)
    print("kontrollprov, orörd text: %d fel (ska vara 0)" % rent)

    miss = []
    for namn, pid, falt, tillagg, vantad in MUTATIONER:
        r = _kor(namn, pid, falt, tillagg, vantad)
        print("  %-28s %s" % (namn, "FÅNGAD" if r is None else "☠️ " + r))
        if r is not None:
            miss.append(namn)

    # Kontrollprov igen: mutationerna ska ha städats bort.
    efter = sum(len(GR.granska(p)) for p in T.NAMN)
    print("\nkontrollprov efter: %d fel (ska vara 0)" % efter)
    print("%d mutationer, %d missade" % (len(MUTATIONER), len(miss)))
    sys.exit(1 if (miss or rent or efter) else 0)
