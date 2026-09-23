# Runda 126 Steg 1–5 — det man arbetar PÅ, inte det man rullar

## Steg 1: det rättade utkastfiltret fördubblade familjen

Runda 125 räknade familjen till ~13 kvarvarande utkast och namngav åtta.
Med `/[åÅ]/` som utkastdiskriminator (uppgift #465) och ett svep över hela
katalogen — `avhuggen: false`, 57 sidor, **5 623 produkter** (2 546 publicerade,
3 077 utkast) — blev talet **39**.

De elva som runda 125 inte kunde se alls: `ed44170a`, `3afe7275`, `4a8e7f21`,
`bc2e7191`, `1db06f83`, `f2495eee`, `1654dd75`, `fc6fdd63`, `b920d526`,
`d9965552`, `6df0ce88`.

### Vad som räknades bort ur de 39

| bort | varför |
|---|---|
| `aff28a71` | bevisad dubblett av publicerade `8723db20` (uppgift #466) |
| `a389ddaa` | bevisad dubblett av publicerade `5b27721d` (uppgift #453) |
| `d16f677e` Fußballtor *"inkl. Werkzeug"* | huvudordsregeln |
| `fecc1b3f` `11282914` `7df00a4a` `cf7595fe` `35af025a` `a4e3545d` | bodfamiljen (runda 86–87) |
| `f768f9ff` `db663f78` `6588ac81` | skrivbord, inte verkstad |
| tolv Aktenschrank/Rollcontainer + åtta rullande verktygsskåp | egna rundor — se sist |

## ☠️ BEVISAD DUBBLETT: `349b7403` ÄR publicerade `cef0d96a`

Starkare bevis än runda 125:s. **TRE byte-identiska bildpar**, inte två:

```
349b7403 pos1  ↔  cef0d96a pos1   0.00
349b7403 pos2  ↔  cef0d96a pos2   0.00
349b7403 pos3  ↔  cef0d96a pos3   0.00
```

Och runbookens fyra tal stämmer alla på decimalen:

| | utkastet `349b7403` | publicerade `cef0d96a` |
|---|---|---|
| Mått utfälld | **110 × 32 × 50** | **110 × 32 × 50** |
| Mått hopfälld | **77 × 32 × 16** | **77 × 32 × 16** |
| Vikt | **4,8 kg** | **4,8 kg** |
| Maxlast | **150 kg** | **150 kg** |
| Material | aluminiumlegering | aluminiumlegering |
| **Pris** | **1 049 kr** | **819 kr** |

**Poleras INTE.** Utkastet är 230 kr DYRARE än sidan som redan ligger ute.
Lämnat till Leonard som ett affärsbeslut.

## ☠️ Och den hittades bara för att SÖKORDSSVEPET kördes på svenska ord

Familjesvepet matchar leverantörens TYSKA ord (uppgift #421) — det hittade
`349b7403` som `Arbeitsplattform`. Men den PUBLICERADE syskonsidan heter
`arbetsplattform-hopfallbar-aluminium` på svenska, och mitt första svenska
filter hade `arbetsbänk|sågbock|verkstad|verktyg` — **inte `arbetsplattform`
och inte `arbetsbock`**. Tre publicerade konkurrenter låg utanför:

| publicerad | pris | vad |
|---|--:|---|
| `cef0d96a` `arbetsplattform-hopfallbar-aluminium` | 819 | ☠️ dubbletten |
| `1a8c63b2` `arbetsbock-hopfallbar-2-pack` | 799 | äkta konkurrent |
| `e1584981` `sagbockar-2-pack-hopfallbara-stal` | 619 | äkta konkurrent |

**Regeln: sökordssvepet måste köras på SLUGGENS stam, inte på en lista
huvudord man skrivit i förväg.** En `^(stodbock|arbetsplattform|sagbock|
arbetsbock|kapsagstativ|verkstadsbank)`-prefixmatchning över alla 5 623
slugs hittade alla tre på en gång; ordlistan hittade en.

## ⚠️ Och en som INTE är dubblett, mätt

`3afe7275` mot publicerade `1a8c63b2` såg farligt nära ut på talen — **68 cm
bred på båda, 200 kg på båda**, hopfällt 68 × 15 × 80 mot 68 × 16 × 84.
Pixeljämförelsen avgjorde: **lägsta avstånd 35,55 %**, alltså helt olika
foton. Djupet skiljer (56 mot 58), höjden är teleskopisk 80–130 mot fast 80,
och färgen är svart mot blå.

Det är precis runbookens varning: *"Vid standardmått ger ±2 cm på tre axlar
falska träffar."* Två av tre tal stämde och produkten var ändå en annan.

## Rundans sex

| # | id | pris | vad det ÄR | färg | mått | last |
|---|---|--:|---|---|---|---|
| 1 | `3afe7275` | 869 | **stödbockar 2-pack**, teleskop | svart + förzinkad | 68 × 56 × 80–130, hopfällt 68 × 15 × 80 | 200 kg |
| 2 | `17e683e0` | 1 229 | **sågbockar 2-pack**, 4 höjdlägen | **orange** + svart | 93 × 50 × 71–85,5, hopfällt 93 × 14 × 10,5 | 250 kg/st |
| 3 | `ed44170a` | 1 499 | **arbetsbockar 2-pack**, 7 höjdlägen, EVA-topp | **röd** + svart | 116 × 64 × 64–81, hopfällt 90 × 7 × 14 | 580 kg/st |
| 4 | `4a8e7f21` | 1 499 | **kapsågstativ** med två rullstöd | svart + silver | 73 × 96 × 123,5–245, hopfällt 44 × 34,5 × 123,5 | 150 kg |
| 5 | `941867cb` | 1 549 | **verkstadsbänk på hjul**, viks till 9 cm | svart | 115 × 62 × 143,5 | 120 tot / 100 skiva / 20 hålplank |
| 6 | `9e9c78b9` | 1 749 | **verkstadsbänk 155 cm** med låda + 2 hyllplan | svart stål + MDF | 80 × 40,5 × 155 | 240 tot / 100 skiva / 50 per hylla |

## SKU:n räknad i Steg 1, som regeln kräver

Kontrollerad mot hela katalogen: **noll slug-krockar, noll SKU-krockar**,
alla sex unika och ≤ 24 tecken.

| id | slug | SKU | tecken |
|---|---|---|--:|
| `3afe7275` | `stodbockar-2-pack-80-130-cm` | `FP-stodbockar-2-pack-80` | 23 |
| `17e683e0` | `sagbockar-2-pack-orange-250-kg` | `FP-sagbockar-2-pack` | 19 |
| `ed44170a` | `arbetsbockar-2-pack-580-kg` | `FP-arbetsbockar-2-pack` | 22 |
| `4a8e7f21` | `kapsagstativ-rullstod-245-cm` | `FP-kapsagstativ-rullstod` | 24 |
| `941867cb` | `verkstadsbank-pa-hjul-hopfallbar` | `FP-verkstadsbank-pa-hjul` | 24 |
| `9e9c78b9` | `verkstadsbank-155-cm-med-lada` | `FP-verkstadsbank-155-cm` | 23 |

☠️ **Första utkastet gav en SKU-krock som INTE syntes i sluggen.**
`sagbockar-2-pack-…` och `sagbockar-2-pack-580-kg` är två olika slugs, men
`FP-` + hela tokens kapar båda vid `FP-sagbockar-2-pack` — **samma sträng**.
Löst genom att byta huvudord på den ena (`arbetsbockar`), inte genom att
skjuta in en kvalificerare som ändå faller utanför 24 tecken. Samma sak
mellan de två verkstadsbänkarna: båda kapade till `FP-verkstadsbank`.

**Regeln: kontrollera SKU-krocken mot den KAPADE strängen, inte mot sluggen.**

## Steg 2 — laglighetsgrinden: ingen stoppklass

Verkstadsutrustning i stål och aluminium. Inga djur, ingen el, ingen
barnprodukt, inget livsmedel. Bindande påståenden är **bärigheterna** och
**höjdlägena**, båda ur leverantörens spec och skrivna ordagrant.

⚠️ Ett verkligt säkerhetsansvar finns ändå, och det är rundans egen text:
`4a8e7f21` bär en **såg** och `17e683e0`/`ed44170a` bär **virke som sågas**.
Leverantörens egen not — *"Bitte stellen Sie sicher, dass Sie die untere
Rollenbasis um 4 cm herum strecken, um ein Herunterfallen beim Falten zu
vermeiden"* — hör hemma på sidan, inte i papperskorgen.

## Steg 5 — nio fynd som hade nått kund

1. ☠️ **`349b7403` är publicerade `cef0d96a`.** Se ovan.
2. ☠️ **`ed44170a` bild 4 OCH 5 bär STOR TYSK TEXT i pixlarna**:
   *4 VERSTELLBARE STÜTZARME · Passend für 2x6 Holz* respektive
   *RUTSCHFESTE DETAILS · EVA-Oberfläche · Rutschfeste Fußpolster*.
   **Båda plockas bort** — sidan behåller tre bilder.
3. ☠️ **`17e683e0`s tyska `Technische Daten` bär `Artikelnummer: <numret>`.**
   Leverantörens EGEN text, mitt i det poleringen översätter. Det är källan
   till de fyra publicerade sidor som läcker numret (uppgift #470).
   Numret får aldrig nå sidan, spec-tabellen eller det här repot.
4. ☠️ **Färgen motsäger sig själv på TRE sidor — och åt OLIKA håll:**

   | id | tyska `Technische Daten` | svenska spec-blocket | bilden | vem har rätt |
   |---|---|---|---|---|
   | `349b7403` | Schwarz | Schwarz | **gul + aluminium** | **ingen** |
   | `4a8e7f21` | Schwarz+Silber | **Blau, Rot, Weiß** | svart + silver | tyskan |
   | `17e683e0` | **Schwarz** | orange, schwarz | orange + svart | svenskan |

   ☠️ **Det är inte så att ett av fälten är opålitligt — BÅDA är det, och de
   ljuger åt olika håll i samma runda.** Enda facit är bilden. Samma slutsats
   som runda 124:s `22bedfb0` och runda 125:s `5447468e`, men nu bevisad i
   båda riktningarna samtidigt.
5. ☠️ **`9e9c78b9` påstår att pulverlackerat stål är `rostbeständig`.**
   Rostfri-lögnen, tredje rundan i rad. Lacken skyddar tills den skadas.
6. ☠️ **`9e9c78b9`s spec säger `Färg: Schwarz`** men de två hyllplanen är
   omålad ljus MDF på varje bild. Halva färgen, som runda 125:s tre.
7. ⚠️ **`3afe7275` har TVÅ vikter** — 8 kg i den tyska brödtexten, 8,8 kg i
   spec-blocket. Runda 66:s klass. Sidan säger `cirka 8,8 kg per bock` (det
   högre talet, så kunden inte blir överraskad vid lyft).
8. ⚠️ **`3afe7275`s `Lieferumfang` är på ENGELSKA** (`2 x Lifting bracket`)
   medan produktnamnet är i singular. Bilden visar två. Det ÄR ett tvåpack.
9. ⚠️ **`ed44170a`s namn säger `bis 1160 kg`** — det är PARETS summa.
   Per bock är det 580 kg. Sidan säger båda talen och vilket som är vilket;
   runda 124:s lärdom om att leverantörens namn räknar fel (uppgift #462).

## Lämnas till Leonard

1. ☠️ **`349b7403` mot publicerade `cef0d96a`** — samma vara, samma foton,
   utkastet 230 kr dyrare. Vilken som pensioneras är hans beslut.
2. ⚠️ **`9e9c78b9` bild 5 bär TRE läsbara tredjepartsmärken** i scenen —
   en BOSCH-slip, en byggradio och en kabelvinda. Inte på varan, utan i
   miljön. Läggs till uppgift #461 så beslutet blir ett och inte fem.
3. ⚠️ **`3afe7275` bär en liten vit logotyp fysiskt på tvärslån.** Den är
   oläsbar även vid 6× förstoring, alltså ingen läcka — och den sitter på
   VARAN, så Leonards regel säger att den lämnas orörd.

## Kvar i familjen efter den här rundan

**Tolv arkivskåp och rullcontainrar** (`709f7aac`, `66866eb7`, `4d5b3bb5`,
`521aec3c`, `9ba9af92`, `9b8c7308`, `21a12739`, `3273d2ee`, `6df0ce88`,
`5a0f9799`, `beeada22`, `81c123fa`) — ☠️ varav **fyra bär EXAKT samma namn**
(`Rollcontainer mit 3 Schubladen mobiler Aktenschrank mit Rollen`) och två
par till delar namn. Den gruppen kräver en intern dubblettmätning FÖRE
batchvalet, precis som runbooken kräver.

**Åtta rullande verktygsskåp** (`1db06f83`, `f2495eee`, `1654dd75`,
`fc6fdd63`, `b920d526`, `d9965552`, `bc2e7191`, `88eb3627`) — samma klass som
runda 123 och 125 polerade, så de ska måttjämföras mot de fjorton publicerade
familjesidorna innan något skrivs.
