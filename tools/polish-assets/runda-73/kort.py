# -*- coding: utf-8 -*-
"""Runda 73 — DATAN till de åtta egna korten. Bygget bor i ../kortbygge.py.

Rubriken är det enda bygget inte kan kontrollera: den ska bäras av
HJÄLTEBILDEN. Varje rad nedan är vald mot bild 1 på `hjaltar.jpg`.

☠️ De två som ser ut som samma modell är det INTE. `b1e98da4` står på två
   RUNDA fötter, `b67fdc2b` på två KRYSSFÖTTER AV TRÄ — och det syns i båda
   hjältebilderna. Artikelnumren (833-360 mot 833-359) säger samma sak.
   Rubrikerna skiljer dem åt på just den detaljen, så en kund som ser de två
   korten bredvid varandra kan se vilken som är vilken.

⚠️ `b72f093d` och `acb1f904` bär BÅDA en mugghållare i armstödet, och båda
   syns på fotot. Rubrikerna säger olika saker om dem ändå: den ena har
   fotstödet ute i bilden, den andra har mugghållaren infälld i armstödet.
"""
import json
import os
import sys

HAR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HAR))
sys.path.insert(0, HAR)

from kortbygge import bygg                                            # noqa: E402
from texter import PRODUKTER                                          # noqa: E402

KORT = {
    # ☠️ Rubriken sa först "Tät möbelväv med synlig struktur" — och kortet
    #    MJUKAS UPP 0,9 px för att rymmas under takgränsen, alltså suddar
    #    bygget bort precis det rubriken pekade på. En rubrik måste bäras av
    #    fotot SOM DET BLIR, inte som råbilden såg ut. Fotot: bred sits,
    #    kraftigt rundade armstöd, fotstödet infällt i fronten.
    "969d9ec9": ("Fåtölj i tät väv, ljusgrå",
                 "Bred sits med rundade armstöd",
                 [("Mått", 0), ("Tillbakalutad", 1), ("Sittyta", 2),
                  ("Ryggvinkel", 7), ("Rotation", 8), ("Maxlast", 9)]),
    # Fotot: fotstödet utfällt, mugghållare i höger armstöd, svart vridfot.
    "b72f093d": ("Gungande tv-fåtölj, gråbrun",
                 "Fotstödet ute och mugghållare i armstödet",
                 [("Mått", 0), ("Tillbakalutad", 1), ("Sittyta", 2),
                  ("Sitthöjd", 3), ("Ryggvinkel", 6), ("Maxlast", 7)]),
    # Fotot: den grå draghandtaget syns i sitsens framkant, fotdelen ute.
    "54cf1f44": ("Reclinerfåtölj, grå",
                 "Handtaget sitter i sitsens framkant",
                 [("Mått", 0), ("Utfälld", 1), ("Sittyta", 2),
                  ("Sitthöjd", 3), ("Stomme", 8), ("Maxlast", 6)]),
    # Fotot: svart mugghållare infälld i det gräddvita armstödet.
    "acb1f904": ("Tv-fåtölj med sidoficka, gräddvit",
                 "Mugghållaren är infälld i armstödet",
                 [("Mått", 0), ("Tillbakalutad", 1), ("Sittyta", 2),
                  ("Ryggvinkel", 7), ("Rotation", 8), ("Maxlast", 9)]),
    # Fotot: hög, tjock ryggkudde över hela ryggen, rullade armstöd.
    "e57125fb": ("Väggnära fåtölj, brun",
                 "Tjock ryggkudde över hela ryggen",
                 [("Mått", 0), ("Tillbakalutad", 1), ("Sittyta", 2),
                  ("Ryggvinkel", 6), ("Väggavstånd", 7), ("Maxlast", 8)]),
    # Fotot: stol OCH pall står var för sig på en rund skiva.
    "b1e98da4": ("Snurrfåtölj med fotpall, ljusgrå",
                 "Stol och pall på var sin runda fot",
                 [("Mått", 0), ("Tillbakalutad", 1), ("Sittyta", 2),
                  ("Fotpall", 5), ("Rotation", 6), ("Maxlast", 7)]),
    # Fotot: två ljusa träkryss, knappad rygg.
    "b67fdc2b": ("Vilfåtölj med fotpall, gråbrun",
                 "Kryssfot av trä under stol och pall",
                 [("Mått", 0), ("Liggläge", 1), ("Sittyta", 2),
                  ("Förvaringsfack", 6), ("Ryggvinkel", 7), ("Maxlast", 9)]),
    # Fotot: madrassen ligger hoprullad bakom ryggen, ljus metallram.
    "7eee41b6": ("Bäddfåtölj 65 cm, grå",
                 "Bädden ligger hoprullad bakom ryggen",
                 [("Mått", 0), ("Bädd", 1), ("Sittyta", 2),
                  ("Sitthöjd", 3), ("Ryggens lägen", 4), ("Maxlast", 5)]),
}

# Radien följer överskottet, ~0,5 px per 15 kB. Fylls i när bygget mätt korten.
MJUKA = {"969d9ec9": 0.9, "e57125fb": 0.5, "7eee41b6": 0.8}

if __name__ == "__main__":
    namn, facit = bygg(HAR, PRODUKTER, KORT, MJUKA)
    with open(os.path.join(HAR, "kort-facit.json"), "w", encoding="utf-8") as f:
        json.dump(facit, f, ensure_ascii=False, indent=1)
    for n in namn:
        print("%-20s %7d byte" % (n, os.path.getsize("jpg/%s.jpg" % n)))
