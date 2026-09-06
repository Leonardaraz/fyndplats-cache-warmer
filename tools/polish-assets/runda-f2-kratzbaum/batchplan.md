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

## Läget: texterna skrivna och grindade, två av åtta i Wix

Alla åtta svenska texter är skrivna till fil och maskinellt grindade — noll
avvikelser på husmärken, artikelnummer, tyska rester, homoglyfer, ogiltiga
fetstilsspann och de tre obligatoriska flikarna. `seo.tsv`, `namn.tsv`,
`nyckelord.tsv` och SKU:erna är grindade mot Steg 8:s längdtak och en
siffergrind som kräver att varje tal i SEO-texten finns i produktens egen
källtext.

`68f7d530` och `a65a39f1` är skrivna till Wix (text, namn, slug, seoData) och
**återlästa mot källfilen** — identiska. Båda står kvar som `visible: false`.

`patch-B.json`, `patch-C.json` och `patch-D.json` ligger färdiga för de sex
återstående.

### Kvar i rundan

1. Sex textskrivningar (B, C, D) med återläsning.
2. Bilderna: ta bort de två tyska PawHut-grafikerna på `d82beee4` och
   `70f4481a`, skriv svenska alt-texter på alla, lägg måttritningen sist.
3. ☠️ **SKU:erna är fortfarande tyska** — `68f7d530` bär `FP-kratzbaum-192-cm`.
   Steg 8 skriver dem på BÅDA sidorna.
4. Kategori (`Husdjur` + `Lek & Tillbehör för husdjur`, samma som F1).
5. Egna kort, publicering, stämpling, live-grind.

☠️ **Ordningen är inte valfri.** Text medan produkten är utkast; SKU och
publicering SIST och i samma skrivning, eftersom en `variantsInfo`-PATCH
publicerar ett utkast och en sen text-PATCH utan `variantsInfo` speglar ner
variantens `visible` till false — det var så 31 sidor blev oköpbara.

## ☠️ `variantsInfo.variants[].media` går INTE att sätta efter skapandet (mätt 2026-09-06)

Steg 8 skriver `variantsInfo` för att byta SKU. Varje sådan skrivning **nollar
variantens `media`**, och fältet går inte att skriva tillbaka. Fem former
provade mot skarpa V3, alla på `ab6c0b93`:

| form som skickades | utfall |
|---|---|
| variantobjekt utan `media` | fältet borta |
| `media: {id}` | fältet borta |
| `media: {id, altText, mediaType}` | fältet borta |
| `media: {…hela blobben verbatim…}` via `bulk/products/update` | fältet borta |
| samma blobb via `PATCH /products/{id}` + `fieldMask` | fältet borta |

☠️ **Alla fem svarade 200 med `totalSuccesses: 1`.** Wix avvisar inte fältet,
den släpper det. Tionde gången samma familj: ett svar utan fel är inget kvitto.

Runda F1:s publicerade sidor BÄR fältet, så det sätts vid `createProduct` (som
`lib/wix/client.ts` gör) — eller så återhärleds det av Wix senare. Vilket av
dem är inte mätt.

⚠️ **Konsekvensen är inert HÄR men inte i allmänhet.** Dessa produkter har EN
variant och `choices: []`: det finns ingen variantväljare, galleriet kommer ur
`media.itemsInfo` och huvudbilden ur `media.main` — båda orörda. På en
FLERVARIANTSPRODUKT är samma skrivning en tyst förlust av varje variantbild.
Den som någon gång skriver `variantsInfo` över en sådan katalog ska mäta först.

**Vad som INTE ska göras:** skicka med blobben ändå "för säkerhets skull".
Fem mätningar säger att den ignoreras, och en cargo-cult-rad i kroppen är en
rad nästa läsare tror betyder något.
