# Runda H3 — åtta gåbilar och sparkbilar för 1–3 år, 759–1 199 kr

Samma familj som H2, en åldersgrupp ner. Julklappar till 1–3-åringar.

## ☠️ Första dubblettanalysen var FEL — den jämförde paketmått mot produktmått

Utkastens spec-tabell bär `Paketmått` sist, och min regex tog den FÖRSTA
måtttripeln den hittade. För ett utkast blev det ofta paketmåttet, för en
publicerad polerad sida produktmåttet. Jämförelsen gick alltså mellan två
olika saker, och den felade åt BÅDA hållen:

| | första analysen | efter omräkning |
|---|---|---|
| `1a3ac422` | **vald** | ☠️ **dubblett** av publicerade `a78da864` — 67,5 × 38 × 44 och sitsen 28 × 16 × 3, siffra för siffra |
| `b34517e3` `b9f6dc30` `41be5a7a` | stoppade som "samma som `1a212456`" | **inte dubbletter** — 65 × 28 × 39 mot 63,5 × 28 × 36, ingen delad tripel |
| `a6b24d45` `58690dbb` | stoppade som "samma som publicerad G350" | **inte dubbletter** — 83 × 40 × 90 mot 85,5 × 40,5 × 95 |

Analysen görs nu mekaniskt: **varje** måtttripel plockas ur varje produkt,
utkast som publicerad, och alla 27 korsjämförs. Två produkter som delar en
tripel flaggas. Det tar bort både etiketten och min bedömning ur ekvationen.

## ☠️ Två PUBLICERADE sidor är samma produkt

`973743f8` (1 259 kr) och `e6134e61` (1 129 kr) delar **alla tre** tripplarna:
85,5 × 40,5 × 95, sitsen 25 × 16 × 25 och förvaringen 23 × 16,5 × 10. Båda är
Mercedes G350-gåbilar. Det är en intern dubblett som redan ligger ute, med
130 kr mellan sig. Ingen av dem rörs i den här rundan — det är Leonards beslut
vilken som ska bort.

## ⚠️ Två publicerade sidor går inte att jämföra alls

`c86aefc6` och `9afb5483` (båda 499 kr, "Sparkbil för barn 1–3 år") har
**noll mått** i sin spec-tabell — bara ålder, maxvikt, material, hjulantal och
funktioner. En tidigare poleringsrunda skrev en spec utan dimensioner, och de
sidorna är därmed permanent omöjliga att dubblettpröva. Samma problem som
#146 i sin dyraste form.

De två beskrivs dessutom nästan identiskt: 22 kg, PP-plast, fyra hjul,
musikratt, förvaring under sitsen, ryggstöd och tippskydd. **De kan mycket väl
vara samma produkt som varandra.**

## Dubbletter av publicerade sidor — fyra utkast stoppas

| utkast | pris | publicerad motsvarighet | delad tripel |
|---|--:|---|---|
| `88140d98` | 1 239 | `973743f8` / `e6134e61` | 85,5 × 40,5 × 95 + 23 × 16,5 × 10 |
| `d55a25f4` | 1 059 | `973743f8` / `e6134e61` | 85,5 × 40,5 × 95 + 23 × 16,5 × 10 |
| `1a3ac422` | 729 | `a78da864` (949 kr) | 67,5 × 38 × 44 + 28 × 16 × 3 |
| `2b890006` | 759 | `a78da864` (949 kr) | 67,5 × 38 × 44 + 28 × 16 × 3 |

## Färgsyskon inom utkasten — en vald per kluster

| tripel | utkast | priser | vald |
|---|---|---|---|
| 63 × 28,5 × 38, Porsche | `7a595f49` `efd63441` `2e12de07` | 959 / 959 / 929 | **`2e12de07`** |
| 65 × 28 × 39, C-Class | `b34517e3` `b9f6dc30` `41be5a7a` | 869 / 869 / 799 | **`41be5a7a`** |
| 91 × 40 × 83, C-Class 2-i-1 | `f87c0ccb` `834cbe61` | 999 / 999 | **`f87c0ccb`** |
| 83 × 40 × 90, Mercedes 3-i-1 | `a6b24d45` `58690dbb` | 1 199 / 1 199 | **`a6b24d45`** |
| 65,5 × 28 × 42, Land Rover | `1e5eac85` `6152ca30` | 839 / 839 | **`1e5eac85`** |
| 74 × 39 × 48, motorcykelform | `382f99ee` `8eaf3ecc` | 759 / 799 | **`382f99ee`** |

Den billigaste i klustret väljs.

## De åtta

| # | id | modell | pris | produktmått |
|--:|---|---|--:|---|
| 1 | `a6b24d45` | 3-i-1 gåbil med skjutstång och skyddsbåge | 1 199 | 83 × 40 × 90 |
| 2 | `7d243274` | 3-i-1 gåbil med avtagbar sufflett | 1 099 | 96 × 39 × 90 |
| 3 | `f87c0ccb` | Mercedes-Benz C-klass 2-i-1 med skjutstång | 999 | 91 × 40 × 83 |
| 4 | `5a4f16a3` | Lamborghini 2-i-1 med riktig ratt | 999 | 86,5 × 40 × 89,5 |
| 5 | `2e12de07` | Porsche sparkbil med tuta och strålkastare | 929 | 63 × 28,5 × 38 |
| 6 | `1e5eac85` | Land Rover Discovery sparkbil | 839 | 65,5 × 28 × 42 |
| 7 | `41be5a7a` | Mercedes-Benz C-klass sparkbil | 799 | 65 × 28 × 39 |
| 8 | `382f99ee` | Sparkfordon i motorcykelform, utan pedaler | 759 | 74 × 39 × 48 |

⚠️ **Nummer 3 och 7 är samma bil med och utan skjutstång.** De delar
förvaringsfacket 21,5 × 6,5 × 9,5 cm men inte kroppsmåttet — 91 × 40 × 83 med
stången monterad mot 65 × 28 × 39 utan. Det är ett verkligt köpval (en
förälder som vill kunna skjuta mot en som inte vill), och priserna skiljer
200 kr. Båda tas med, men texterna ska säga rakt ut vad skillnaden är.

⚠️ **Nummer 8 är den enda utan pedaler.** Publicerade `d771d12f` är en
trehjuling i motorcykelform MED pedaler, 71 × 40 × 51. Ingen delad tripel, och
funktionen skiljer.

☠️ **Fyra av åtta är licensierade modeller** — Mercedes-Benz C-klass (två),
Lamborghini och Porsche, plus Land Rover Discovery. Märkena hör till produkten
och står kvar; det är LEVERANTÖRENS husmärken som stryks, aldrig biltillverkarens.

## Redovisning

Tjugo utkast, alla mätta mekaniskt: **åtta valda**, **tolv stoppade** — fyra
som dubbletter av publicerade sidor (`88140d98` `d55a25f4` `1a3ac422`
`2b890006`) och åtta som färgsyskon (`7a595f49` `efd63441` `b34517e3`
`b9f6dc30` `834cbe61` `58690dbb` `6152ca30` `8eaf3ecc`).
