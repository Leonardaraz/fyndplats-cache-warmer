# Runda F2 — åtta höga klösträd och kattorn

Fortsättning på F1. Urvalet är gjort på HUVUDORDET (`^Kratzbaum` bland
osynliga utkast), inte på förekomst — `Kratzbaum` står som produkttyp i alla
åtta, inte som egenskap.

Batchen stänger det HÖGA segmentet: de tre kvarvarande takspända träden plus
de fem högsta fristående tornen. Priserna är hämtade ur F1:s `matt.tsv`.

| kort-id | pris | vad |
|---|--:|---|
| 68f7d530 | 1 549 | Kattorn 192 cm med håla, sisalstammar, stor plattform |
| a65a39f1 | 1 369 | Kattorn 206 cm med håla, två spelbollar, sisalstammar |
| 39ec9d58 | 1 279 | Takspänt 240–260 cm med plyschbollar |
| 0801a975 | 1 079 | Kattorn 148 cm med håla och fyra leksaker |
| 55dc854b |   999 | Takspänt 220–265 cm med spelbollar |
| d82beee4 |   949 | Kattorn 160 cm med hängmatta, stege, håla |
| 70f4481a |   899 | Kattorn 140 cm med hängmatta, stege, håla |
| ab6c0b93 |   879 | Höjdställbart 202–242 cm, halkfritt, jutestolpar |

## Innan en enda text skrivs

1. ☠️ **Prisgrinden per produkt** (workflowen *Polering — läs och stämpla
   mappningsraden*, läge `las`). Uppgift **#107** säger att tre Aosom-utkast
   har fel pris och inte får poleras förrän frakten är kollad, och VILKA tre
   står ingenstans. Grinden är enda sättet att veta att den här produkten
   inte är en av dem — samma slutsats som runda D3 kom till.
2. **Saldot.** En sida för en vara ingen kan köpa är slöseri i båda ändar,
   och `Prisgrind.slutsald` finns just för att saldot annars upptäcks av en
   bieffekt (CLAUDE.md 2026-09-06).
3. **Dubblettkollen på måttritningen** (bild 3), samma metod som D1–D3 och F1.
   Åtta torn i samma höjdspann är precis där en intern dubblett göms.

## Klart-kriteriet grindas maskinellt

`tools/polish-gates/livegrind.py` efter publicering: orddiff mot källfilen,
homoglyfer, husmärke/artikelnummer/fraktland/tyska rester i sida OCH
alt-texter, SEO-taggarna mot `seo.tsv`, de tre flikarna ordagrant, kategorin
i brödsmulan — och sedan 2026-09-06 **köpbarheten** (`OutOfStock` på en
publicerad sida).

## Förkontrollerna är körda — 8 av 8 klara

| kontroll | utfall |
|---|---|
| Prisgrind (workflow `las`, en körning per produkt) | **8/8 gröna** |
| Saldo | **8/8 `IN_STOCK`** |
| Fortfarande utkast (`visible:false`) | **8/8** |
| En variant per produkt | **8/8** |

☠️ **Grönt jobb = grön grind, och det är verifierat i workflow-filen, inte
antaget.** `polish-mapping.yml` gör `exit 1` på `EJ AVGORBAR` (rad 99) och på
de fallerande grenarna (149, 154); `stammer: true` är enda vägen till
"OK: priset stammer mot regeln". Alltså är **ingen av de åtta** en av
uppgift #107:s tre felprissatta utkast.

⚠️ **Men slutsåld FÄLLER INTE jobbet** — den är en `::warning::` (rad 121),
precis som CLAUDE.md föreskriver. Saldot är därför kollat separat mot Wix,
i ETT anrop för hela rundan.

Uppmätt på 68f7d530: `landedCostSek 1284,13` → förväntat 1549 → faktiskt
1549, `aosomFreightShare 0,31`, saldo 197.

## Vad som återstår innan text

**Dubblettkollen på måttritningen** (bild 3) mot publicerade sidor. Åtta
torn i samma höjdspann är precis där en intern dubblett göms, och F1:s
klösträd ligger redan publicerade i samma kategori.

☠️ Två saker som ALDRIG får nå texten, båda syns i råmaterialet:
husmärket **PawHut** (står i leverantörens URL) och artikelnumret
(`D30-907V00LG` på 68f7d530). Numret hör hemma på `supplierProductId` och
ingen annanstans.
