# Runda 106 — smådjursstall i trä

## Steg 1 — svepet

| | |
|---|---:|
| Utkast lästa | 3 149 |
| Unika id | 3 149 |
| `avhuggen` | `false` |
| Träffar på huvudordet | **47** |
| …varav trähus/hagar för utomhusbruk | **39** |
| …varav inomhusburar i metall/plast/akryl (annan familj) | 8 |
| Alla 47 har | 5 bilder, 1 variant |
| I lager | 46 av 47 (`d93d729a` slut) |
| Prisspann på de 39 | 799 – 4 269 kr |

Publicerade sidor lästa: **2 404**, unika 2 404, `avhuggen: false`. Sexton av dem
ligger i samma domän (kanin, marsvin, smådjur) och står i `matt.py → PUBLICERADE`.

### ☠️ Måttgrindens FÖRSTA version var trasig — och "noll krockar" var ett svepfel

Första svepet läste bara en märkt spec-rad (`Mått:</span>`) och hittade en
måtttrippel på **285 av 2 404** publicerade sidor. Det gav *noll* krockar.

Kontrollmätningen fällde det: två sidor som med säkerhet är publicerade och
bär sina mått — `27dc50ae` (110 × 50 × 86) och `f3fdcd4a` (90 × 53 × 59) —
returnerade **tom måttrad**. Orsaken är att en POLERAD sida skriver måtten i
löptext (*"Måtten 110 x 50 x 86 cm ger plats för 1–2 kaniner"*) och i en
spec-tabell vars etikett heter `Yttermått:`, inte `Mått:`.

Lagat genom att söka ALLA tripplar i hela texten i stället för en märkt rad:
**1 977 av 2 404** sidor bär nu en läsbar trippel, kontrollen hittar båda de
kända sidorna — och svepet hittar en krock som den trasiga versionen missade.

> Runbookens regel bet exakt som skriven: *"kräv att svepet hittar minst en känd
> publicerad sida innan du litar på ett 'noll'"*. Utan kontrollmätningen hade
> rundan publicerat en dubblett av en levande sida.

### ☠️ `a8a4c7f1` är en BEVISAD dubblett av publicerade `1ba178fa`

Sex oberoende mått stämmer exakt mot *"Marsvinshydda 90 cm med två plan – ramp,
asfalttak och bricka"*:

| | utkastet `a8a4c7f1` | publicerade `1ba178fa` |
|---|---|---|
| Yttermått | 90 × 45 × 80 cm | 90 × 45 × 80 cm |
| Rastgård | 80 × 40 × 40 cm | 80 × 40 × 40 cm — 0,32 m² |
| Fönster | 43 × 28 cm | 43 × 28 cm |
| Trälucka | 25 × 28 cm | 25 × 28 cm |
| Bricka | 40 × 80 cm | 80 × 40 cm |
| Ramp | 60 × 17 cm | 60 × 17 cm |

**Poleras inte.** Syskonet `5d79afbe` (90 × 45 × 90, 1 219 kr) delar fönster,
lucka och bricka men är 10 cm högre och anger TVÅ av varje dörr — troligen en
annan modell i samma familj, men det är inte bevisat åt något håll, och dess
spec-block saknar varje delytehöjd. Lämnas.

### ⚠️ Tre PUBLICERADE sidor delar mått exakt — en levande intern dubblett

`14a20f23` + `80fbb644` (*"Kaninbur 90 cm på hjul med ramp"*, grå och gul) och
`f3fdcd4a` (*"Marsvinsbur inomhus i trä 90 × 53 × 59 cm"*) har samma yttermått,
samma sovhus 49 × 34 × 20, samma öppning 16 × 14, samma ramp 42 × 13,6, samma
dörr 46,5 × 19,4, samma bricka 85,5 × 50,8 och samma material. `f3fdcd4a` anger
dessutom *"Färg: brun/vit eller grå/vit"* — alltså båda färgsidornas färger.

Samma produkt på tre URL:er under två djurnamn. Inte rundans att laga, men det
är exakt den interna dubblett Google straffar.

## Steg 2 — L80-grinden

Tabellerna är hämtade ORDAGRANT ur SJVFS 2019:15 bilaga 1:3 (kaniner) och 1:4
(gnagare) och kontrollerade mot författningstexten i den här rundan, inte
återanvända ur minnet.

Grinden räknar **bara bottenplanet** och **bara delytor som själva klarar både
höjd- och sidokravet**. Åtta kontrollmätningar i `l80-grind.py` bevisar att den
kan både fälla och släppa igenom.

| djur | krav (yta / kortaste sida / höjd) | klarar av 39 |
|---|---|---:|
| kanin 2–3,5 kg | 0,7 m² / 0,6 m / 0,6 m | **0** |
| dvärgkanin ≤2 kg | 0,5 m² / 0,5 m / 0,5 m | 5 |
| marsvin | 0,30 m² / 0,40 m / 0,25 m | 31 |
| degu | 0,30 m² / 0,40 m / 0,40 m | 26 |
| brun råtta | 0,18 m² / 0,30 m / 0,30 m | 35 |
| guldhamster | 0,12 m² / 0,25 m / 0,20 m | 36 |

☠️ **Noll av 39 räcker till en normalstor sällskapskanin.** Trettiofyra av de
39 heter ändå *Hasenstall*, *Kaninchenstall* eller *Kaninchenkäfig*, och fem
säger uttryckligen ett kaninantal:

| id | leverantörens påstående | vad L80 ger |
|---|---|---|
| `f75b26c4` | "Geeignet für 2-4 Kaninchen" | högst **2 dvärgkaniner ≤2 kg** |
| `a2acfed0` `d40ec79e` `8acfd813` | "Geeignet für 2 Zwergkaninchen" | **noll** — löpgården är 44,5 cm hög mot kravets 50 |
| `1d344d6d` | avstår själv: "Der Käufer muss die Anzahl der Tiere bestimmen" | marsvin (3) |

Tre stall klarar **inget** djur i tabellerna: `0d75b83d`, `5d79afbe`, `efe14f20`
— och skälet är i alla tre fall att leverantören inte anger en enda delytehöjd.

## Rundans batch — sex låga markhagar

Valda för att de är familjens största bottenytor, den enda undergrupp där
verdikten är entydig, och två färgpar som ger naturliga korslänkar.

| id | pris | yttermått | godkänd bottenyta | lagligt för |
|---|---:|---|---:|---|
| `edc81021` | 1 899 | 123 × 120 × 52 | 1,48 m² | dvärgkanin (4), marsvin (9) |
| `a4c0595f` | 1 499 | 181 × 100 × 48 | 1,81 m² | marsvin (12), degu (12) |
| `7eebd0eb` | 1 339 | 181 × 100 × 48 | 1,81 m² | marsvin (12), degu (12) |
| `b54e7a23` | 1 649 | 125,5 × 100 × 49 | 0,72 m² | marsvin (4), degu (4) |
| `1f7ebf33` | 1 659 | 125,5 × 100 × 49 | 0,72 m² | marsvin (4), degu (4) |
| `117691b5` | 1 259 | 110 × 105 × 50 | 1,16 m² | dvärgkanin (3), marsvin (7) |

## Steg 13 — publicerat

Prisgrinden lästes för alla sex (`polish-mapping.yml`, läge `las`) och alla sex
gav `stammer: true` mot `x1.2 · charm99`. Därefter stämpel (`needsAiPolish:
false`, `draftStatus: published`, SKU per `wixVariantId`) och en avslutande
PATCH med `visible: true` på **både** produkt och variant i samma anrop.

| id | slug | pris | SKU | mappningens variant |
|---|---|---:|---|---|
| `a4c0595f` | `smadjurshage-181-natur` | 1 499 | `FP-smadjurshage-181-natur` | `676a8c71…` |
| `7eebd0eb` | `smadjurshage-181-gra` | 1 339 | `FP-smadjurshage-181-gra` | `ee59caf6…` |
| `b54e7a23` | `smadjurshage-125-gra` | 1 649 | `FP-smadjurshage-125-gra` | `cecfb9b3…` |
| `1f7ebf33` | `smadjurshage-125-natur` | 1 659 | `FP-smadjurshage-125-natur` | `cc70125c…` |
| `edc81021` | `smadjurshage-123-cm-hus` | 1 899 | `FP-smadjurshage-123-cm-hus` | `a4e3fd8c…` |
| `117691b5` | `hopfallbar-hage-110-cm` | 1 259 | `FP-hopfallbar-hage-110-cm` | `f0c7d1a6…` |

## ☠️ Steg 14 — ALT-TEXTEN ligger utanför varje grind, och fem av sex lovade kanin

Live-grinden gav **1 av 6** på första körningen. Inte på brödtexten, som är
grindad — på **alt-texterna**, som `grind.py` aldrig ser. Den läser `html`,
`namn`, `titel` och `meta` ur `texter.py`; alt-texterna skrivs i Steg 9 rakt in
i Wix media och passerar därför ingen grind alls.

Vad som stod på fem av sex sidor, i samma andetag som brödtexten säger att hagen
inte säljs som kaninbostad:

| id | bild | alt-texten löd |
|---|---:|---|
| `7eebd0eb` | 2 | "…i en trädgård **med två kaniner inuti**" |
| `b54e7a23` | 2 | "…**med kaniner i löpgården** och huset öppet mot dem" |
| `1f7ebf33` | 2 | "…framför ett trästaket **med kaniner i löpgården**" |
| `edc81021` | 2 | "…i en trädgård **med kaniner inuti** och husets lucka öppen" |
| `117691b5` | 2 | "…där ett barn sitter bredvid och **håller en kanin**" |

☠️ **Det är det farligaste stället att skriva det på.** Alt-texten är vad Google
och skärmläsaren läser, alltså exakt den yta där ett löfte vi inte kan hålla
väger tyngst — och den enda kundtext ingen grind i huset granskar. Runbookens
regel om att en grind ska täcka HELA ytan regeln gäller (Steg 13, sifferstilen)
träffar alltså här också: `grind.py` påstod "ren sida" om en sida vars
tillgänglighetslager sa motsatsen.

Rättat på alla fem: djuret är borttaget, varje verifierad detalj om VARAN står
kvar ("locken nedfällda", "löpgården vänd mot kameran", "husets lucka öppen").
Skrivningen skickar `id` och aldrig `url` — en wixstatic-adress hade fått Wix att
importera om filen till en ny kopia — och läses tillbaka med en EGEN GET,
eftersom PATCH-svaret utelämnar `media.itemsInfo`. Kvitto: `kvarKanin: 0` på alla
fem, oförändrat bildantal, `visible: true` kvar.

⚠️ **Kvar och inte rundans att avgöra: FOTOT visar fortfarande kaniner.** Det är
leverantörens egen livsstilsbild, och den ligger på position 2 på fem av de sex
sidorna. Våra ord säger inte längre kanin; bilden gör det. Att plocka bort
bilden är ett beslut om vilka foton en sida får sakna — samma klass som
logotypsvepet Leonard sekvenserade till städningen, inte till poleringen.
