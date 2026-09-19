# Runda F2 — åtta klösträd och kattorn, 879–1 549 kr

Åtta tyska Aosom-utkast polerade, publicerade och live-verifierade
2026-09-06. Familjen är klösträd/kattorn, samma kategori som runda F1.

| kort | produkt | pris | SKU |
|---|---|--:|---|
| 68f7d530 | Kattorn 192 cm, två hålor, två hängmattor, ramp | 1 549 | FP-kattorn-192-ljusgra |
| a65a39f1 | Kattorn 206 cm för hörnet, två hus, klösbräda | 1 369 | FP-kattorn-206-morkgra |
| 39ec9d58 | Takspänt klösträd 240–260 cm | 1 279 | FP-klostrad-240-260-morkgra |
| 0801a975 | Kattorn 148 cm, håla och bädd | 1 079 | FP-kattorn-148-beige |
| 55dc854b | Takspänt klösträd 220–265 cm, fem plan | 999 | FP-klostrad-220-265-morkgra |
| d82beee4 | Kattorn 160 cm, hängmatta och stege | 949 | FP-kattorn-160-beige |
| 70f4481a | Kattorn 140 cm, hängmatta och stege | 899 | FP-kattorn-140-beige |
| ab6c0b93 | Höjdställbart klösträd 202–242 cm, jute | 879 | FP-klostrad-202-242-gron |

## Kvitton, mätta och inte antagna

| kontroll | utfall |
|---|---|
| Prisgrind före poleringen | 8/8 grön |
| Saldo före poleringen | 8/8 IN_STOCK |
| Text diffad mot källfil | 8/8 identisk |
| Steg 8 + publicering (samma skrivning) | 8/8, variant `visible:true` |
| Mappningsraderna stämplade | 8/8 gröna workflow-körningar |
| Kategori (Husdjur + Lek & Tillbehör) | 8/8 `totalSuccesses` |
| Egna kort på position 3 | 8/8, måttskissen kvar sist |
| Live-grind (orddiff, homoglyf, alt, SEO, flikar, kategori) | 8/8 REN, diff 0 |
| Köpbarhet live (JSON-LD) | 8/8 `InStock`, noll `OutOfStock` |

## Tre saker rundan lärde sig

1. ☠️ **`variantsInfo.variants[].media` går inte att sätta efter skapandet.**
   Fem former över två endpoints, alla svarade 200 och släppte fältet tyst.
   Se `batchplan.md`. Inert här (en variant, inga val) men inte i allmänhet.
2. ☠️ **`55dc854b` sa emot sig själv om antalet plan** — brödtexten räknade
   fyra "utöver kattboxen", FAQ:n svarade "Fem, plus kattboxen". Fotot
   avgjorde: fyra plan plus boxen. Samma sida saknade dessutom hängmattan
   och de två bollarna som syns på bilden. Båda rättade.
3. ⚠️ **`gate-kort.py` fällde min egen kortrubrik.** "20 cm lägre" är ett tal
   jag räknade fram ur skillnaden mellan syskonen, inte ett tal som står i
   produktens källtext. Grinden kan inte veta att det är sant — och det är
   precis rätt beteende. Rubriken skrevs om i stället för att grinden
   luckrades upp.

⚠️ `68f7d530` har bara fyra leverantörsbilder (mot fem för de flesta) —
bildreparationens område, inte poleringens.
