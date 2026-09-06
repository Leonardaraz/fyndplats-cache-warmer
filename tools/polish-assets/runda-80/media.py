# -*- coding: utf-8 -*-
"""Runda 80 — medialistan per produkt.

☠️ TRE BILDER PLOCKAS BORT, alla på position 4, alla med TYSK TEXT INBRÄND i
   pixlarna. Den går inte att polera bort och kan inte visas för en svensk
   kund. `BORT` är därför ett uttryckligt beslut per produkt, inte en regel
   som råkar träffa rätt.

⚠️ KORTET LÄGGS PÅ POSITION 3, efter huvudbilden och livsstilsbilden. Det är
   först där en kund som scrollar möter något som är VÅRT.

☠️ `media.main` skickas ALDRIG — den är read-only i V3 och gav en extra
   omimport av huvudbilden (mätt 2026-08-28).
"""
import json

BILDER = json.load(open("bilder.json", encoding="utf-8"))
KORT = {
    "b9ab45db": "b379ce_a1f440d112f745509bf1c15313270a87~mv2.jpg",
    "0fe80797": "b379ce_92d0da92567f4046b100bc1e5e42e2d0~mv2.jpg",
    "57ae1ddf": "b379ce_ca6c5a9752284273be4c7c0bdc03ef3f~mv2.jpg",
    "558eb67a": "b379ce_9863d1d224d84134a901565cf351c4de~mv2.jpg",
    "7046314f": "b379ce_eabe0201017a4d6bb40f5855ace2db16~mv2.jpg",
    "2cae1147": "b379ce_e6b265a6b1af4c40bc8b195398fa7775~mv2.jpg",
    "5302daf2": "b379ce_3220d491c66d4f77b2404e54fd0ad580~mv2.jpg",
    "bd554433": "b379ce_c2a1f122def04736939ae6078f9cc20f~mv2.jpg",
}

# position (1-indexerad) som stryks, med skälet skrivet ut
BORT = {
    "b9ab45db": (4, "ROBUSTER METALLFUSS — tysk text inbränd"),
    "0fe80797": (4, "GEEIGNET FÜR EINE VIELZAHL VON RÄUMEN — tysk text inbränd"),
    "5302daf2": (4, "Für alle Bodenarten geeignet — tysk text inbränd"),
}

ALT = {
    "b9ab45db": "Ljusgrå snurrfåtölj i linnelookat tyg på rund kromad fot",
    "0fe80797": "Mörkgrå snurrfåtölj i linnelookat tyg på rund kromad fot",
    "57ae1ddf": "Svart snurrfåtölj i linnelookat tyg på rund kromad fot",
    "558eb67a": "Svart reclinerfåtölj i konstläder med matchande fotpall",
    "7046314f": "Rosa skrivbordsstol med hjärtformad rygg och vit fot med hjul",
    "2cae1147": "Gräddvit kontorsstol i bouclétyg med svart femarmad fot",
    "5302daf2": "Antracitgrå kontorsstol med bred sits och kromat femarmat kryss",
    "bd554433": "Svart kontorsstol i linnelookat tyg med dubbel stoppning",
}
KORTALT = {
    "b9ab45db": "Faktakort: snurrfåtölj ljusgrå, mått, sits, sitthöjd och maxlast",
    "0fe80797": "Faktakort: snurrfåtölj mörkgrå, mått, sits, sitthöjd och maxlast",
    "57ae1ddf": "Faktakort: snurrfåtölj svart, mått, sits, sitthöjd och maxlast",
    "558eb67a": "Faktakort: reclinerfåtölj med fotpall, mått och maxlast",
    "7046314f": "Faktakort: skrivbordsstol med hjärtrygg, mått och maxlast",
    "2cae1147": "Faktakort: kontorsstol i bouclé, mått, sitthöjd och maxlast",
    "5302daf2": "Faktakort: kontorsstol med bred sits, mått och maxlast",
    "bd554433": "Faktakort: kontorsstol med dubbel stoppning, mått och maxlast",
}

plan = {}
for k, ids in BILDER.items():
    kvar = [(i + 1, m) for i, m in enumerate(ids)]
    if k in BORT:
        pos, _ = BORT[k]
        kvar = [(i, m) for i, m in kvar if i != pos]
    rader = [{"id": m, "altText": "%s (%d)" % (ALT[k], i)} for i, m in kvar]
    rader.insert(2, {"id": KORT[k], "altText": KORTALT[k]})
    plan[k] = rader

if __name__ == "__main__":
    json.dump(plan, open("media-plan.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    for k, r in plan.items():
        strykt = " — stryker bild %d (%s)" % BORT[k] if k in BORT else ""
        print("%s  %d bilder, kortet på plats 3%s" % (k, len(r), strykt))
