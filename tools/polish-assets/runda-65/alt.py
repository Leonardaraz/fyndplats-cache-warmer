# -*- coding: utf-8 -*-
"""Alt-texter per BILD, inte per produkt.

Importen sätter samma tyska sträng på alla fem bilderna. En alt-text ska
beskriva DEN bilden — det är hela nyttan, både för skärmläsaren och för
Google Images.

☠️ 2823c605 bild 4 bär tysk text inbränd i pixlarna ("ROBUSTES GEBÄUDE",
"Gebogener Holzsockel", "Fußpads zum Schutz") och plockas ur galleriet.
"""
import io
import json

BORT = {("2823c605", 4)}

ALT = {
    "db645ff8": [
        "Golvfåtölj i blått med ryggen uppfälld, sedd snett framifrån",
        "Blå golvfåtölj uppställd på en matta i ett vardagsrum",
        "Måttskiss över golvfåtöljen: 55 × 71 × 53,5 cm uppställd, 108 cm utfälld",
        "Golvfåtöljen helt utfälld och platt mot golvet",
        "Golvfåtöljen i ett halvfällt läge med en kopp bredvid på golvet",
    ],
    "88425b27": [
        "Fåtölj med grå dyna och ram i ljus böjd träfanér, med lös fotpall",
        "Fåtöljen och fotpallen uppställda vid ett fönster i ett vardagsrum",
        "Måttskiss: fåtölj 66,5 × 80 × 99 cm och fotpall 51 × 45 × 40 cm",
        "Fotpallens grå dyna sedd uppifrån",
        "Närbild på den böjda träfanéren där ram och sarg möts",
    ],
    "03c9d570": [
        "Liten gråbeige fåtölj i chenille med fyra svarta metallben",
        "Den lilla fåtöljen placerad vid ett sminkbord i ett sovrum",
        "Måttskiss: 60 × 57 × 83 cm, sitthöjd 50 cm, maxlast 120 kg",
        "Fåtöljen använd som stol vid ett sminkbord",
        "Fåtöljen använd vid ett matbord med en kaffekopp på bordet",
    ],
    "bb7b7bd4": [
        "Loungefåtölj med gräddvit dyna och fjädrande ram i björkfanér",
        "Loungefåtöljen i ett ljust rum med en person som läser i den",
        "Måttskiss: 67 × 83 × 105 cm, sits 55 × 45 cm, armstöd 51 cm över golv",
        "Loungefåtöljen sedd från sidan med den svängda fanérramen synlig",
        "Närbild där en hand trycker ned den 12 cm tjocka sittdynan",
    ],
    "89c89322": [
        "Armlös snurrfåtölj i grågrön melerad chenille med tjock sittdyna",
        "Snurrfåtöljen i ett vardagsrum med en person som läser under en filt",
        "Måttskiss: 70 × 90 × 70 cm, sits 70 × 59 cm, sitthöjd 41 cm",
        "Snurrfåtöljen sedd framifrån med hela sittbredden synlig",
        "Snurrfåtöljen i ett rum med bokhylla i bakgrunden",
    ],
    "3dab61f0": [
        "Reclinerfåtölj i svart konstläder med lös fotpall på rund fot",
        "Reclinerfåtöljen och fotpallen uppställda intill ett litet sidobord",
        "Måttskiss: fåtölj 78 × 67 × 98 cm, fotpall 43 × 38 × 41,5 cm",
        "Reclinerfåtöljen sedd snett bakifrån med den runda fotplattan synlig",
        "Närbild på det stoppade ryggstödet och nackpartiet",
    ],
    "eb400961": [
        "Fåtölj i svart konstläder på silverfärgade stålmedar",
        "Fåtöljen placerad på en matta i ett vardagsrum",
        "Måttskiss: 80 × 79 × 84 cm, sits 64 × 53 cm, maxlast 120 kg",
        "Fåtöljen sedd från sidan där medarnas svep mot golvet syns",
        "Fåtöljen använd av en person som läser en bok",
    ],
    "2823c605": [
        "Reclinerfåtölj i grått konstläder med snurrfot i böjt trä och fotpall",
        "Reclinerfåtöljen och fotpallen uppställda i ett vardagsrum",
        "Måttskiss: 76 × 85 × 104 cm upprätt och 117 cm djup fullt fälld",
        None,
        "Närbild på det grå konstlädret och sömmarna i ryggstödet",
    ],
}

if __name__ == "__main__":
    ut = {}
    for k, rader in ALT.items():
        ut[k] = [{"n": i + 1, "alt": t} for i, t in enumerate(rader)
                 if (k, i + 1) not in BORT]
        assert all(r["alt"] for r in ut[k]), k
    io.open("alt.json", "w", encoding="utf-8").write(
        json.dumps({"alt": ut, "bort": sorted("%s-%d" % b for b in BORT)},
                   ensure_ascii=False, indent=1))
    for k, rader in ut.items():
        print("%s  %d alt-texter" % (k, len(rader)))
