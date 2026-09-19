# Runda N8 — nio produkter 1 029–1 039 kr

Urvalet fortsätter **billigast uppåt** bland produkter där vi är billigare än
dealproffsen (Leonards regel). N2 täckte 599–699 kr, N3 699–879, N4 899–939,
N5 949–969, N6 979–999, N7 1 019–1 029, den här 1 029–1 039.

| kort | vårt | deras | gap | produkt |
| :-- | --: | --: | --: | :-- |
| 967d53e2 | 1 029 | 1 059 | +30 | Plyo Box i bokträ, tre höjder |
| 618b1de9 | 1 029 | 1 059 | +30 | Sensorsoptunna 50 liter, svart |
| 46f280f7 | 1 029 | 1 069 | +40 | Sittbänk 100 cm med förvaring |
| 3835cd29 | 1 039 | 1 799 | **+760** | Kontorsstol med nätrygg |
| 9a81088f | 1 039 | 1 399 | +360 | Vibrationsplatta med Bluetooth |
| 3f6f548f | 1 039 | 1 199 | +160 | Sensorsoptunna 55 liter, rostfri |
| 265b9257 | 1 039 | 1 179 | +140 | 3D-väggdekor med cirklar, metall |
| 8aa0bb6c | 1 039 | 1 139 | +100 | Trappklättrande säckkärra |
| a389ddaa | 1 039 | 1 099 | +60 | Verktygsvagn i tre plan |

De tre på 1 029 kr är N7:s reserver, alltså hela den nivån. På 1 039 finns
femton rena kandidater och sex valdes på gapets storlek.

## Urvalet kom ur en FULLSTÄNDIG mätning

Prisjämförelsen kördes med `fran_pris=1030` och slutade på **0 prefix kvar**
redan i varv 2 — alltså är "de säljer den inte" ett besked och inte ett golv.
**2 669 produkter i katalogen där vi är billigare.**

## Dubblettskärmen: 2 835 publicerade, noll krockar

Två oberoende grindar, båda rena:

| grind | omfattning | fynd |
|---|--:|--:|
| Vid måtttrippel (≥ 2 delade tripplar) | 2 835 publicerade sidor | **0** |
| Byte-identisk huvudbild (Wix `hash`) | 2 835 publicerade huvudbilder | **0** |

⚠️ **Bildhashens noll är ett ÄKTA negativt, inte en trasig metod** — den ser
bara den byte-identiska klassen, och Aosom fotograferar samma vara flera
gånger. Måtten är facit, precis som huset redan skrivit ned.

☠️ **Svepet gick OFILTRERAT och filtrerades i koden.** `filter` på kroppens
toppnivå kastas bort tyst, och inuti `search` avvisas markören med
`400 SE-1141` — ett flersidigt filtrerat svep går alltså inte att göra
(uppmätt 2026-09-16, se CLAUDE.md). Talet 2 835 publicerade mot 2 913 utkast
är kvittot att filtreringen faktiskt skedde: N7:s första svep kallade alla
5 748 publicerade.

## Tre bortvalda, och skälen är olika

| kort | skäl |
|---|---|
| `7c55e53e` | steppbräda — bara **EN** måtttrippel, grinden kan aldrig fälla (#274) |
| `129b3a06` | sensorsoptunna 50 L rostfri rund — samma sak, en trippel |
| `34a43113` | sittdynor för TERRASSMÖBLER — fel säsong i mitten av september |
| `294cfb55` | **färgsyskon** till `618b1de9`, se nedan — Leonards beslut |

### ⚠️ Två sensorsoptunnor är samma vara i två färger, inte en dubblett

`618b1de9` (1 029 kr) och `294cfb55` (1 039 kr) bär **identiskt tyskt namn**,
identiska mått, identiskt paketmått, samma volym, samma sensorräckvidd, samma
batteri och samma vikt:

| | `618b1de9` | `294cfb55` |
|---|---|---|
| mått | 26,5 × 35,5 × 68 | **samma** |
| paketmått | 42 × 32 × 75 | **samma** |
| volym · sensor · batteri · vikt | 50 L · 15 cm · 4×AA · 5,6 kg | **samma** |
| **färg** | Schwarz | **Dunkelgrün, Schwarz** |
| **material** | Metall, ABS | **Eisen**, ABS |

☠️ **Det är alltså INTE den tredje dubblettklassen** (samma artikel två gånger
i feeden) utan ett FÄRGSYSKON, och bildhashen stödjer det: olika hash, olika
filstorlek — det är genuint olika foton, för produkterna ser olika ut.

Den billigare tas in; den mörkgröna lämnas som Leonards beslut, samma hållning
som huset redan har för färgsyskon (#156, #207, #220). Att publicera båda vore
två nästan identiska texter på två URL:er.

⚠️ **Och en tredje sensorsoptunna står kvar i bandet** — `129b3a06`, 50 L men
rund och rostfri (32,5 × 32,5 × 85). Den är genuint en annan vara; den faller
på måttskärmen, inte på familjen. `3f6f548f` (55 L, 32 × 30 × 78,5) tas in och
är en annan storlek och form än `618b1de9`.

## Källorna är BEVISADE ordagranna

Nio av nio: kontrollsumman räknad lokalt ur filen och en gång till **server-side
ur Wix** ger samma tal, och teckentalen stämmer exakt. En källfil som inte är
byte-identisk gör siffergrinden till en vana i stället för en grind — den skulle
godkänna tal som inte står i den verkliga källan.

☠️ **Och artikelnummergrinden föll först på MIN EGEN regexp.** Jag skrev
`\b\d{3}-\d{3}[A-Z0-9]{0,6}\b` i skriptet i stället för att importera
`gatelib.ARTNR`, och den fällde två KORREKTA rader:

```
3835cd29   107-121H     höjdintervall, inte artikelnummer
9a81088f   220-240V     spänningsintervall, inte artikelnummer
```

Det är exakt de två falsklarmsklasser huset redan mätt bort och skrivit ned i
`gatelib.py` — den gamla raden var ordagrant den jag råkade skriva. **En andra
definition ÄR tvillingen**, även när den bara lever i ett engångsskript, och
riktningen är den dyra: ett falsklarm som ser ut som en läcka av leverantörens
artikelnummer lär mottagaren att sluta läsa just den grinden.

## Lagersaldo

Nio av nio köpbara, en lagerrad var:

| kort | saldo |
|---|---:|
| 3835cd29 | **6** |
| 8aa0bb6c | 28 |
| 967d53e2 | 44 |
| 46f280f7 | 50 |
| 265b9257 | 136 |
| a389ddaa | 142 |
| 9a81088f | 163 |
| 3f6f548f | 180 |
| 618b1de9 | 197 |

⚠️ Kontorsstolen har bara **sex** kvar.

⚠️ **Och kontorsstolen är den mest mättade familjen i katalogen.** Husets egen
mätning rankar fåtölj/kontorsstol SIST på gap per publicerad sida (336 kr mot
soffans 1 051). Måttskärmen är ändå ren mot alla 2 835 publicerade sidor, och
gapet är bandets största med god marginal — men familjen är värd att hålla
ögonen på i kommande rundor.

---

## KVITTOKEDJAN — rundan är stängd 2026-09-16

| steg | utfall |
|---|---|
| Filgrindar (nio st) | **0 fynd** i samtliga |
| Skrivning 1 — text, namn, slug, seoData, visible | **9/9**, revision 1–4 → 2–5 |
| Skrivning 2 — media ENSAM (`fieldMask: media`) | **9/9**, 51 poster, kortet sist |
| Skrivning 3 — kategorier | **17/17 per rad**, 0 fel |
| Skrivning 4 — `variantsInfo` SIST och ENSAM | **9/9**, variantens `visible` bevarad |
| Stämpling (`polish-mapping.yml`, ref = arbetsgrenen) | **9/9 gröna**, körning 3133–3141 |
| Separat återläsning en stund senare | **9 av 9 LIKA** |
| Live-grind på publicerade sidor, age 102–108 s | **9/9 REN, orddiff 0** |
| Korten, md5 hemhämtad mot lokal | **9/9 byte-identiska** |
| Korten på mottagarsidan, två oberoende handtag | **9/9**, kortet sist, huvudbilden ett foto |
| `kort-n8-tmp` raderad | bekräftat genom att LÄSA fjärren: 0 kvar |

Återläsningen kollade också varje sidokrav: alla nio `visible: true`, alla med
**två** SEO-taggar (inte fem), noll bilder utan alt-text, alla varianter
synliga och alla nio med sin svenska SKU.

## ☠️ TVÅ SKRIVNINGAR SOM SKREV NOLL — och båda var MIN kuvertform

Bägge stoppades av ett **400**, inte av tystnad. Det är den billiga
riktningen att fela åt, och skillnaden mot `fontagen-weight`, som Wix strök
tyst och rapporterade som framgång.

1. **Kroppen låg under `data`, inte `body`.** Hjälparen kastar bort `data`
   utan att säga något, så Wix fick en tom produkt och svarade *"revision must
   not be empty"* — trots att revisionen lästes korrekt i samma anrop.
   `bygg-skrivning.py` genererade `body`; jag skrev om det till `data` när jag
   anpassade anropet. **Generatorn hade rätt, avskriften fel** — samma
   asymmetri som H3 mätte upp på SEO-fälten.

   Uppmätt med husets egen medicin, en skrivning vars enda ändring är ingen
   ändring: `body` → revision 1 → 2 med namnet oförändrat, `data` → samma 400.

2. **Media-itemet har `id` och `altText` på TOPPNIVÅN, inte inuti `image`.**
   Läsningen viker ut ett `image`-objekt bredvid dem, och jag tog svarets form
   för skrivningens. Itemets nycklar är
   `["id","altText","image","mediaType","uploadId"]`.

✅ **Kontrollsumman gjorde exakt sitt jobb tre gånger.** Den passerade i alla
tre anropen, alltså var transkriberingen byte-exakt varje gång. Felen låg i
kuvertet, aldrig i texten — och spärren skilde de två åt utan att jag behövde
gissa.

**Regeln som följer: läs svarets form som ett SVAR, inte som en mall.** En
läsning viker ut bekvämlighetsfält (`image`, `uploadId`) som skrivningen inte
tar emot. Mät skrivformen mot dokumentationen eller mot en no-op-skrivning.
