# ✅ Runda 110 LIVE — sex vikskärmar i tre konstruktioner, 6 av 6 gröna

| id | slug | grupp | paneler | utfällt | pris |
|---|---|:-:|--:|---|--:|
| `a999f2b1` | `rumsavdelare-180-vit` | A | 4 | 180 × 1,7 × 180 cm | 1 199 |
| `c35f9d4f` | `rumsavdelare-180-grabrun` | A | 4 | 180 × 1,7 × 180 cm | 1 099 |
| `d72bde5e` | `rumsavdelare-180-bambu` | B | 4 | 180 × 1,7 × 180 cm | 1 179 |
| `316f9945` | `rumsavdelare-180-svart` | B | 4 | 180 × 1,9 × 180 cm | 1 179 |
| `f8fd1b62` | `rumsavdelare-160-bambu` | C | 4 | 160 × 1,8 × 170 cm | 1 339 |
| `309076e2` | `rumsavdelare-120-bambu` | C | 3 | 120 × 1,8 × 170 cm | 1 299 |

Grupp A är **polypropenväv på tallram**, B **bambu på tallram**, C **helbambu**.
Tre konstruktioner, tre texter — ingen delad brödtext.

## Kvittona

| Steg | Utfall |
|---|---|
| 7 · text | 6 av 6 `LEN ok · HASH ok · namn · slug · titel · meta` |
| 8 · SKU | båda halvorna, båda krockarna borta, sex unika |
| 12 · kategori | `Hem & Inredning` + `All Products` på alla sex |
| 13 · stämpel | sex `stampla`-körningar, `needsAiPolish:false` + `draftStatus:published` |
| 14 · live | **6 av 6 gröna** |

Stämplingen är läst i loggen och inte antagen: körning 2274–2279 bär ett
produkt-id var, alla sex `success`, patchen ordagrant
`{"needsAiPolish":false,"draftStatus":"published"}`.

## ☠️ Kategoriläsningen såg ut som sex misslyckade skrivningar — felet var MITT

Första kontrollen av Steg 12 gjorde `GET /products/{id}` utan fältparameter och
fick `directCategoriesInfo: {}` på **alla sex**. Det ser ut som att
kategoriskrivningen inte tagit — och det är precis fel slutsats.

```
GET /products/{id}                                  → kategorier: 0   ← projektionen
GET /products/{id}?fields=DIRECT_CATEGORIES_INFO    → kategorier: 2   ← sanningen
```

`directCategoriesInfo` ligger **inte i standardprojektionen**. Runbookens
Steg 12 skriver ut hela GET:en med fältet, och raden gäller — den som kortar
den får ett tomt svar som ser ut som ett fynd.

☠️ Det är samma familj som `getProductMedia` utan `MEDIA_ITEMS_INFO` och som
`/api/tracking-events` mot en tömd kollektion: **ett svar som blir TOMT ser
likadant ut som ett svar som är tomt.** Och till skillnad från uppgift #357:s
negativa lögn försvinner den här inte av att man väntar.

⚠️ Priset för den här sortens fel är inte läsningen — det är åtgärden. Ett
"kategorierna saknas" hade lett till sex omskrivningar av något som redan satt
rätt, och `ALREADY_EXISTS` hade sedan sett ut som ännu ett fel.

## ☠️ Fyra redaktionella fel som INGEN faktagrind kunde se

Alla fyra var SANNA påståenden på fel sida, fångade mellan generering och
skrivning. En grind som prövar tal mot `matt.py` släpper igenom varenda en.

1. **Två meningar i rad sa samma sak** — "vilar på golvet utan att skruvas
   fast" stod både i det valfria blocket och i nästa. → slogs ihop, och grinden
   har nu en upprepad-mening-kontroll.
2. **`Gångjärn: gångjärn`** i spec-tabellen. Leverantören säger bara "Durch
   Scharniere verbunden" om `d72bde5e`, alltså finns inget värde. → raden
   utelämnas när innehållet är okänt, hellre än fylls med sin egen etikett.
3. **`Material: flätad bambu, gångjärn i metall` bredvid `Gångjärn: metall`.**
   → ny grind: ett spec-VÄRDE får inte bära en annan spec-RADS etikett.
4. ☠️ **"Träet är obehandlat" på en HELBAMBU-produkt.** Ett delat FAQ-svar som
   är sant på fyra av sex sidor. → `FAQ_UTE` per grupp, plus `FORBJUDET_ORD["C"]`
   som fäller ordet trä på grupp C.

☠️ **Självtestet för fyra kördes först mot en grupp A-sida och gick igenom** —
korrekt, för grinden gäller bara grupp C. En mutation som prövas på fel sida
bevisar att grinden finns, inte att den biter. Den körs mot en grupp C-sida nu.

Samma klass som runda 64:s mätning: **skriv texten i en FIL först.** Alla fyra
hittades av `grep` mot filen, ingen av dem hade synts i ett API-svar — det ekar
tillbaka exakt det man skrev.

## ☠️ Sex kortuppladdningar rapporterades lyckade och var det inte

`UploadImageToWixSite` svarade `success: true, PENDING` på alla sex. Läst i
Wix efteråt: `operationStatus: FAILED`, `sizeInBytes: -1`.

Orsaken är en rad i en `.gitignore` som ingen letar i:

```
tools/polish-assets/.gitignore:83   jpg/
```

Korten byggs i `jpg/` och laddades upp därifrån — filen fanns aldrig i grenen,
så `raw.githubusercontent.com` svarade 404 och Wix importerade ett tomt svar.
Publicerade från `kort/` i stället (byte-identiska, md5-verifierat) blev alla
sex `READY`, 1600 × 1600, med rätt byte-storlek.

☠️ **`PENDING` från uppladdningsverktyget är INGET kvitto.** Nionde gången
huset lär sig samma sak, och den här gången ligger felet en katalog bort från
koden som gör det.

## ☠️ Och återläsningen efter media-PATCHen ljög åt BÅDA hållen

| läsning | sa | sanningen |
|---|---|---|
| direkt efter | 4 av 6 orörda, 2 ok | alla sex var skrivna |
| andra | `d72bde5e` rev 4, 5 bilder, tom alt | rev 5, 6 bilder, alt satt |
| tredje | 6 bilder | stämde |
| sista | allt rätt på alla sex | ✅ |

**Alla sex skrivningarna tog vid första försöket.** Det var mätningen som var
instabil, inte skrivningen. Uppgift #316 säger att en återläsning kan ljuga åt
fel håll; det här är första gången den mätts ljuga åt BÅDA i samma session.

⚠️ Praktisk följd: räkna aldrig en media-PATCH som misslyckad på EN läsning.
Vänta, läs om, och låt kontrollmätningen (hjältebildens id i HTML:en) avgöra.

## Oskärpan mättes per kort — tre vävar, tre svar

| radie | kort |
|--:|---|
| 0 | `309076e2` (205 903 byte) |
| 1 | `a999f2b1` · `f8fd1b62` |
| 2 | `c35f9d4f` · `d72bde5e` · `316f9945` |

`316f9945` landar 1 170 byte under `TAK_BYTE`. Det är UNDER — och exakt därför
radien mäts per kort i stället för att avrundas uppåt för hela rundan.

## Steg 5: åtta fynd

Står i `STEG3-5.md`. Det största: **grupp A:s väv är polypropen medan importens
svenska spec-block bara sa `Kiefernholz`.** En kontroll-grep visade att runda
108/109:s åtta live-sidor redan säger "polypropenväv på tallram" — **ingen
publicerad sida beskriver plast som trä.**

Tre av Steg 1:s färg- och måttpåståenden rättades mot zoomar och måttritningar,
och en flaggad självmotsägelse på `316f9945` (1,9 mot 7,6/5,5) visade sig inte
finnas: 4 × 1,9 = 7,6 hopfällt, och 5,5 är fothöjden.

## Steg 14, ordagrant

```
OK  rumsavdelare-180-vit      152417 tecken  cache=HIT age=20
OK  rumsavdelare-180-grabrun  153856 tecken  cache=HIT age=20
OK  rumsavdelare-180-bambu    150237 tecken  cache=HIT age=20
OK  rumsavdelare-180-svart    150588 tecken  cache=HIT age=21
OK  rumsavdelare-160-bambu    150706 tecken  cache=HIT age=20
OK  rumsavdelare-120-bambu    150678 tecken  cache=HIT age=20

6 av 6 sidor gröna
```

`age` under en halv minut mot en sida som byggdes om av grindens egen första
hämtning: det är den färska renderingen som mäts, inte förra timmens.

## Kvar

- **`a8a4c7f1` ska INTE poleras** — bevisad dubblett av publicerade `1ba178fa`.
- Grupp **D** (naturholz × 3, mått saknas i spec-blocket), **E** (papper × 2)
  och **F** (polyester/metall × 2, en med 12 hjul) behöver var sitt eget Steg 2.
