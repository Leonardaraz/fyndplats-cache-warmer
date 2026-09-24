# Runda N6 — nio produkter 979–999 kr

Urvalet fortsätter **billigast uppåt** bland produkter där vi är billigare än
dealproffsen (Leonards regel). N2 täckte 599–699 kr, N3 699–879, N4 899–939,
N5 949–969, den här 979–999.

| kort | vårt | deras | gap | produkt |
| :-- | --: | --: | --: | :-- |
| 03207c35 | 979 | 999 | +20 | Hundgrind i trä, fällbar, med stödfötter |
| c7c74ab2 | 979 | 1 119 | +140 | Köksset: vattenkokare och brödrost, 7 lägen |
| e2932b74 | 979 | 1 089 | +110 | Barnkök i MDF med 15 tillbehör |
| 0783b515 | 999 | 1 019 | +20 | Hundvagn upp till 10 kg, hopfällbar |
| 1c883b87 | 999 | 1 869 | +870 | Hantel i gjutjärn, 20 kg |
| 2d308bc1 | 999 | 1 089 | +90 | Skrivarställ i tre plan med förvaring |
| 8f1b8163 | 999 | 1 069 | +70 | Fotpall i skandinavisk stil, 68 cm |
| 949ffbb1 | 999 | 1 019 | +20 | Klädd bänk med förvaring, sammetslook |
| cb57e1dc | 999 | 1 049 | +50 | Gunghäst med musik, 57 cm |

## Urvalet kom ur en FULLSTÄNDIG mätning

Prisjämförelsen kördes med `fran_pris=970` och slutade på **0 prefix kvar** i
tre varv — alltså är "de säljer den inte" ett besked och inte ett golv. 2 635
produkter i katalogen där vi är billigare.

## ☠️ Måttskärmen fällde SJU av 31 — och tre av dem mot sidor vi nyss skrev

Hela den publicerade katalogen är genomsvept: **2 817 sidor**, markören tömd
(`klar: true`), inte ett stickprov. Tröskeln är två delade måtttripplar — en
delad komponent är inte samma produkt.

| kandidat | krockar med | delade tripplar |
|---|---|---:|
| `980dd9a1` köksset | `6f79738d` brödrost + vattenkokare | **5** |
| `d7fea466` köksset | `6f79738d` | **5** |
| `98e09361` hundvagn | `f0ee6c6a` hundvagn med vändbart handtag | **4** |
| `834cbe61` rutschbil | `f87c0ccb` Mercedes-Benz C-klass gåbil | **3** |
| `eb19eca6` köksset | `0ab3483a` + `b330de9c` frukostset | 2 mot vardera |
| `c47838e6` kontorsstol teddyfleece | `3c8fe7db` — **runda N5, samma dag** | 2 |
| `4ab77ce5` kattlåda rostfritt | `8ef08765` kattlåda med höga kanter | 2 |

☠️ **`980dd9a1` och `d7fea466` är dessutom samma vara som varandra** — sex av
sex identiska tripplar och byte-identiskt namn. Tredje gången huset möter
klassen: Aosoms egen feed bär samma fysiska produkt under två artikelnummer,
och dubblettspärren nycklar på artikelnumret, så den ser ingenting.

⚠️ **`c47838e6` är det dyraste fyndet.** Den hade blivit en andra sida för den
teddyfleece-stol som publicerades i N5 för en timme sedan — exakt den interna
dubblett Google straffar. Skärmen måste alltså köras mot en katalog som
inkluderar det man nyss skrev, inte mot gårdagens.

## Sex föll på säsong

Mitten av september. `316c55d1` häcksax, `6972a328` solsängsdyna, `2a3d2495`
och `cb828049` odlingslådor, `a98acbab` trädgårdsbord, `bd28eeea` blomtrappa.
En utegrupp som poleras nu får sin första besökare om sju månader.

## En föll på lagret

`137403f6` solpanel 100 W är **OUT_OF_STOCK**. Lagergrinden ligger före texten
med flit: en sida för en vara ingen kan köpa är slöseri i båda ändar.

## Fyra kan skärmen inte pröva (#274)

`1dc4b1ba`, `4444ab0f`, `50d8807a` och `6972a328` har bara EN måtttrippel i
källan, och tröskeln är två. Grinden svarar "inga krockar" utan att ha kunnat
jämföra. De räknas som **OGRANSKADE, inte som rena** — samma skillnad som
mellan `utanTraff` och `viBilligare` i prisjämförelsen. Tre av dem är
konstväxter, och rundorna L1–L4 täckte just den familjen tätt.

## ⚠️ En närmiss som inte fälldes men är värd att veta

`15d40f17` är en fristående hundgrind på **185 × 71 cm**. Runda N4 publicerade
`f4136218` *"Hundgrind 183 cm, fristående, fyra paneler"*. Skärmen hittar noll
delade tripplar, alltså är de mätt olika — men två centimeter isär i en
familj vi redan säljer är nära nog att den väntar till nästa runda och tas
med ögon på fotot, inte på ett mönster.

## Lagergrinden

| kort | saldo |
|---|---:|
| 03207c35 | 42 |
| c7c74ab2 | 62 |
| e2932b74 | 19 |
| 0783b515 | 103 |
| 1c883b87 | 92 |
| 2d308bc1 | 124 |
| 8f1b8163 | 129 |
| 949ffbb1 | 67 |
| **cb57e1dc** | **4** |

Nio av nio köpbara, noll utan lagerrader. ⚠️ Gunghästen har bara fyra kvar —
den kan hinna ta slut innan sidan hunnit få sin första besökare.

## ☠️ Och sökningen BÄR plainDescription — 28 anrop i stället för 2 800

Husets anteckning säger att `plainDescription` saknas i produktens
standardprojektion och måste begäras med `?fields=PLAIN_DESCRIPTION`. Det
sade ingenting om SÖK-endpointen, och de två familjerna svarar mätbart olika
på samma kroppsform förr.

Uppmätt på skarpa V3 samma dag, samma filter, tre produkter:

```
POST /stores/v3/products/search  utan fields       -> plainDescription SAKNAS (29 nycklar)
POST /stores/v3/products/search  fields:["PLAIN_DESCRIPTION"] -> 3 544 tecken
```

`fields` ligger på KROPPENS toppnivå, inte inuti `search`. Det gör den
katalogomfattande måttskärmen till ~28 anrop i stället för ett GET per
produkt — alltså körbar i en session i stället för att behöva delas upp.

## Rundan stängd — kvittokedjan hela vägen

| steg | facit | utfall |
|---|---|---|
| källorna ordagranna | kontrollsumma räknad server-side | **9/9** |
| artikelnummer i källfilerna (#257) | grep på `NNN-NNNXX` | **0** |
| lagersaldo | Wix inventory | 9/9 köpbara (4–129) |
| bildhash mot publicerade | md5 på huvudbilden | 0 träffar (äkta negativt) |
| måttskärm | den vida trippeln, 2 817 sidor | 7 krockar bortvalda |
| åtta filgrindar + kortgrinden | `tools/polish-gates/` | REN |
| kortens parning vid uppladdning | md5 hemhämtat mot lokal kopia | **10/10** |
| textskrivning | kontrollsumma i SAMMA anrop | 9/9, **ett avbrott** (se nedan) |
| media | `fieldMask: ["media"]`, ensam | **54 poster, 0 utan alt** |
| kategori | bulk-svarets `itemMetadata` per rad | **17/17** |
| variantsInfo | sist och ensam | 9/9, variantens `visible` kvar |
| stämpling | rutten läser tillbaka, 500 om värdet inte sitter | **9/9 gröna** |
| återläsning | SEPARAT anrop, `aterlas.js` | **9/9 LIKA**, alla synliga |
| kortens parning i BUTIKEN | Wix-mediaid **och** filnamn, samma post | **9/9**, kortet sist |
| **live-grind** | publicerad sida mot källfil | **9/9 REN, orddiff 0** |

Live-hämtningen gav `age` 102 s mot en paus på 90 — alltså den rendering den
varma träffen utlöste, inte en äldre cachad sida.

## ☠️ Transkriberingsspärren FÄLLDE, och gjorde rätt

Fjärde textanropet avbröts på **ett tecken av 2 704** i fotpallens brödtext:

```
{"AVBRUTET":"transkriberingsfel — ingenting skrivet",
 "avvik":[{"kort":"8f1b8163","fick":350727435,"vantat":246246014,"tecken":2703}]}
```

Ingenting skrevs — varken fotpallen eller skrivarstället, som låg i samma
anrop. Det är med flit: en delvis skriven batch är det dyra utfallet, för Wix
stryker ogiltig markup TYST och rapporterar framgång.

Filen på disk räknade 2 704 tecken och stämde mot facit, alltså satt felet i
kopieringen in i anropet — precis där spärren finns för att leta. Efter
rättelsen gick samma två produkter igenom utan avbrott.

⚠️ **Och det NÄSTA försöket föll på något annat:** `revision must not be empty`.
En fältmask-PATCH mot V3 kräver revisionen i kroppen. Båda produkterna fick
400 och ingenting skrevs — felet kostade ett anrop, inte en halvskriven sida.
Revisionen läses nu per produkt i samma anrop som skrivningen.

## ☠️ Spärren utvidgad till ALT-TEXTERNA

Regeln säger *skriv i en fil först*, och den gäller varje fält som når kunden —
inte bara brödtexten. 54 mediaposter är lika mycket en avskrift som en
brödtext är, och alt-texterna är precis där tyska rester överlevt en felfri
textpolering förr.

Mediaskrivningen bär därför samma spärr: kontrollsumman räknas per produkt på
`id + "|" + altText` sammanfogat, i SAMMA anrop som skrivningen, med facit ur
`media-hash.tsv`. Nio av nio stämde på första försöket.

## ⚠️ En kvarleva ur N5 stängd på köpet

N5 dömde `5ae05b43` som samma fällbara skrivbord som `3b868848` (4 av 4
delade måtttripplar) och sade *pensionera*. Det blev aldrig gjort: `las`-körningen
skickades med det KORTA id:t i stället för hela UUID:t, rutten svarade
*"varken mappning eller produkt finns"* och jobbet blev rött utan att någon
följde upp.

Hela id:t är `5ae05b43-6052-4d93-893e-720b53ed0ef5` — hittat genom att sikta
sökningen på id-prefixet, inte genom att gissa namnet. Raden bär nu
`draftStatus: "rejected"` och `needsAiPolish: false`. Utkastet raderas inte;
det kostar ingenting medan det ligger, och en radering går inte att ångra.

☠️ **Ett rött jobb som ingen läser är samma sak som inget jobb.** Det enda som
hittade den här var att en granskning av körlistan frågade vad den enda röda
raden var.

## ☠️ Grenraderingen var GRÖN och hade inte raderat något

`branch-cleanup.yml` har `mode` med default `scan`. Utelämnad input → torrkörning,
som skriver *"Finns kvar och kan raderas: 1"* och avslutar med 0. Jobbet blir
alltså grönt av att INTE ha gjort något.

Husets regel bar hela lasten: raderingen verifieras genom att LÄSA FJÄRREN, inte
genom workflowens exit-kod. `git ls-remote origin 'refs/heads/kort-*'` svarade
fortfarande med grenen. Med `mode: apply` svarar den tomt.

Samma familj som resten: **ett svar utan fel är inget kvitto.**
