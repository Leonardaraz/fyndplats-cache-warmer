### Bilderna: bara position 1, 2, 3, 8 och 9 hämtas hem

**46 % av feedens bilder bär TYSK TEXT INBRÄND i pixlarna** ("HOCHWERTIGES
MATERIAL", "Empfohlenes Alter: 3-8 Jahre"). Den går inte att polera bort och kan
inte visas för en svensk kund. Mätt 2026-08-27 på 30 produkter — tio ur vardera
tredjedel av feeden — och 269 handgranskade bilder:

| pos | rena | vad det är |
|---|---:|---|
| 1 | **30/30** | huvudbild, vit botten |
| 2 | **30/30** | livsstilsbild |
| 3 | 23/30 | måttritning; oftast bara siffror, ibland tysk rubrik |
| 4–6 | 4/90 | tyska funktionsgrafiker |
| 7 | 6/30 | oftast tysk |
| 8 | 24/30 | detaljfoto: material, gångjärn, tyg |
| 9 | 27/29 | detaljfoto |

`RENA_BILDPOSITIONER = [1,2,3,8,9]` i `to-product.ts` räddar **134 av 144 rena
bilder (93 %)** och släpper in 15 tyska (10 % av det som behålls). Att också ta
7 hade gett 97 % rena men 22 % skräp; att kapa vid 3 hade gett bara 58 %.

Mönstret är **oberoende av var i feeden produkten ligger** (49/46/45 % tyska i
början, mitten, slutet) — regeln behöver inte justeras per sortimentsdel.
Tysk text sitter alltså i 3, 8 och 9, men poleringen granskar alla fem: varumärken
på rekvisita sitter i miljöbilden på position 2 (i runda B19 på de flesta), och
position 1 och 2 blir huvudbild och delningsbild. `?bilder=alla` tar hem allt.

Sidoeffekt: importen går från 50 018 till ~27 800 bilder — nästan en halvering
av det som är hela svepets flaskhals.
