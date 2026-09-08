# Runda 104 — läge

## Publicerat och kvitterat

| id8 | sida | pris | stämplad | live-grind | eget kort | kategori |
|---|---|--:|---|---|---|---|
| `f15febb2` | `elbil-barn-12v-utv-fjarrkontroll-rosa` | 2 229 | ✅ | ✅ | ✅ | ✅ |
| `3d9dff8a` | `elbil-barn-12v-utv-fjarrkontroll-orange` | 2 069 | ✅ | ✅ | ✅ | ✅ |
| `2f6ff71c` | `elbil-barn-12v-utv-fjarrkontroll-bla` | 2 159 | ✅ | ✅ | ✅ | ✅ |
| `c0abfddd` | `maserati-granturismo-folgore-elbil-barn-12v-gra` | 1 879 | ✅ | ✅ 21/21 | ✅ | ✅ |
| `ed84746c` | `kawasaki-teryx-krx-elbil-barn-12v-vit` | 2 099 | ✅ | ✅ | ✅ | ✅ |
| `3b992525` | `kawasaki-teryx-krx-elbil-barn-12v-beige` | 2 019 | ✅ | ✅ | ✅ | ✅ |

⚠️ **De två sista kolumnerna fylldes i EFTER publiceringen.** Sju sidor gick
live utan eget Fyndplats-kort, utan kategori och med måttritningen på plats 3
i stället för sist, och fyra av dem bar kvar leverantörens tyska SKU. Allt är
åtgärdat — hela genomgången står i `STEG8-9-10.md`, inklusive varför rundans
egen grind inte fångade det som runbooken redan bar.

## Avförd — dubblett, inte produkt

| id8 | utfall |
|---|---|
| `9308a7dc` | ☠️ BEVISAD dubblett av publicerade `4e85a6b7`. Den publicerade sidan ommappad till `aosom:370-402V90MX`, utkastet pensionerat. Se `STEG1-DUBBLETT.md`. |

## Kvar i rundan

| id8 | vad | känt hinder |
|---|---|---|
| `60ab2042` | Kawasaki-UTV turkosblå | ✅ polerad, kort inlagt, SKU rättad — men `OUT_OF_STOCK`. ☠️ **Publiceringen måste sätta `visible: true` på BÅDE produkt och variant**: bild- och SKU-PATCH:arna bar `visible: false`, och Wix speglar ned det på varianten. En publicerad produkt vars variant är osynlig går inte att lägga i varukorgen. |

Rundans övriga tre utkast är klara och publicerade — se `STEG-REST.md`:

| id8 | sida | pris |
|---|---|--:|
| `5e9cc2d2` | `aprilia-elmotorcykel-barn-12v-vit` | 1 759 |
| `1e27f7e0` | `aprilia-elmotorcykel-barn-12v-svart-gul` | 1 799 |
| `883db249` | `elfyrhjuling-barn-12v-back-mp3-orange` | 3 079 |

Alla sex var måttsvepta mot 54 publicerade barnfordonssidor — noll dubbletter
(`STEG1-MATTSVEP.md`) — och de tre sista dessutom mot 18 sidor i sina egna
familjer med sorterad nyckel, också noll.

## Öppet för Leonard

1. ☠️ **Ingen laddare i leverantörens innehållsförteckning** — varken på
   polisbilen eller Maseratin. Sidorna påstår därför ingenting om en laddare.
   Om bilarna faktiskt skickas utan måste det stå på sidan. **Fråga Aosom.**
2. De fyra punkter den adversariella granskningen lyfte och som är
   affärsbeslut, inte textbeslut: returkostnaden vid distansköp,
   produktansvaret, GPSR art. 19–20 för de ~946 redan publicerade sidorna, och
   förpackningsproducentansvaret.
