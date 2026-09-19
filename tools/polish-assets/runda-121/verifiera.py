"""Mekanisk kvittering av Steg 7: läser tillbaka och jämför den SYNLIGA texten.

☠️ Wix skriver om markup vid sparning (`<strong>` blir ett `<span>`), men den
   SYNLIGA texten är oförändrad — därför är `ordsumma` över den strippade
   texten jämförbar, och därför fångar den både en kapad och en DUBBLERAD
   beskrivning. Runda 119:s `5d1696db` fick sin text två gånger för att den
   skrevs av för hand; filen var rätt och avskriften fel.

    python3 verifiera.py <pid> '<ordsumma från Wix>' '<antal h2>'
"""
import json
import sys

d = json.load(open("skrivning.json"))
pid, summa, h2 = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
v = d[pid]
vantat_h2 = v["html"].count("<h2>")
fel = []
if summa != v["ordsumma"]:
    fel.append(f"ORDSUMMA {summa} mot väntade {v['ordsumma']} "
               f"(diff {summa - v['ordsumma']})")
if h2 != vantat_h2:
    fel.append(f"ANTAL <h2> {h2} mot väntade {vantat_h2}")
print(("FEL  " if fel else "OK   ") + pid + "  " + "; ".join(fel))
sys.exit(1 if fel else 0)
