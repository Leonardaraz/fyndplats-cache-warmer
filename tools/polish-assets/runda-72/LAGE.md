# Runda 72 — åtta fåtöljer, publicerade och live-verifierade

**Klar 2026-09-06.** Åtta produkter genom alla fjorton steg: text → grindar →
kort → Wix-skrivning → SKU → bilder → kategori → prisgrind → publicering →
stämpling → live-grind. Priserna är orörda.

| id8 | slug | SKU | pris | maxlast |
|---|---|---|--:|--:|
| 64856235 | `golvfatolj-gra-fem-lagen` | `FP-golvfatolj-gra-fem-lagen` | 1 299 | 120 kg |
| 35872574 | `golvfatolj-petrolbla-fem-lagen` | `FP-golvfatolj-petrolbla-fem` | 1 249 | 120 kg |
| 4f6bef7d | `golvfatolj-beige-fem-lagen` | `FP-golvfatolj-beige-fem` | 1 299 | 120 kg |
| f192540f | `stalfatolj-svart-med-fotpall` | `FP-stalfatolj-svart-fotpall` | 2 359 | 120 kg |
| 78cb09ba | `fatolj-gra-fotpall-vippfunktion` | `FP-fatolj-gra-fotpall` | 3 179 | 150 kg |
| 8f6636e4 | `fatolj-ljusgra-fotpall-trafot` | `FP-fatolj-ljusgra-fotpall` | 3 599 | 130 kg |
| b8001a1b | `fatolj-svart-fotpall-nackstod` | `FP-fatolj-svart-fotpall` | 4 159 | 150 kg |
| dbbe7253 | `liten-fatolj-67-cm-knappad-rygg` | `FP-liten-fatolj-67-cm` | 1 359 | 150 kg |

Live-grinden: **8/8 `200`, alla byte-identiska mot facit**, eget kort i
sidkällan på alla åtta, noll landsnamn, noll artikelnummer, noll tyska ord,
noll husmärken. Prisgrinden grön på alla åtta (`las`-körning 1315–1322),
stämplingen grön på alla åtta (`stampla`-körning 1323–1330).

## ☠️ Måtten HITTAR en familj — artikelnumrets bas AVGÖR den

Fem golvfåtöljer i katalogen mäter 62 × 70 × 95 cm och väger 11 kg, identiskt
ned till kilot, men bär två olika artikelnummerbaser (`839-423…` mot
`83B-380…`). Regeln sedan runda 70 — att måtten grupperar — är fortfarande rätt
för att SÖKA men fel för att BESLUTA. Kör båda: måtten först, basen sist.

## ☠️ Ett publicerat syskon är en REFERENS, inte ett facit

`golvfatolj-360-grader-fem-lagen` beskriver på två ställen basen som "en låg,
rund stålbas". Uppmätt på fem foton över tre färger: den är en tygklädd,
FYRSIDIG sockel som smalnar av mot golvet. Hade trions text speglat syskonets
rakt av hade felet spridits till tre sidor till. Syskonets påståenden ska
verifieras mot bilderna precis som källans egna. Rättelsen av den publicerade
sidan är uppgift #298.

## ☠️ Bildlistans alt-text ligger på ITEM-nivå — och `image` som omslag är 400

Första bild-PATCH:en skickade `items:[{image:{id, altText}}]` och fick
`400 REQUIRED_ONE_OF_FIELD: id or url must not be empty` på varenda rad.
Formen är `items:[{id, altText}]`; item-nivån speglas ned över `image` av sig
själv. Runbokens Steg 9 säger det redan — felet var att läsa *läs*-formen och
skriva tillbaka den.

Läsningen efteråt bekräftar runda 71:s fynd en gång till: PATCH-svaret bär
inte media i standardprojektionen, så återläsningen görs med
`?fields=MEDIA_ITEMS_INFO`. Alla åtta kom tillbaka med rätt antal, kortet på
position 3 och noll tomma alt-texter.

## ☠️ b8001a1b tappade en källbild — tyskan låg i PIXLARNA

Bild 4 bär fyra tyska etiketter inritade över fotot ("Gepolsterte Armlehne",
"Robuster Stahlrahmen", "Schützendes Fußpolster", "Passender Hocker"). Den
plockades bort, så den produkten har fem bilder i stället för sex. En `grep`
över källkoden svarar grönt medan kundens öga läser tyska — samma klass som
logotypen i runda 64. Övriga 39 källbilder är rena, och noll bär
leverantörslogotyp.

## Kategori: toppnivån är rätt nivå här

Trädet lästes före kopplingen (53 kategorier). Under **Hem & Inredning** finns
Badrum & Hemtextil, Belysning, Dekoration & Prydnad, Förvaring &
Organisering, Hushållsapparater, Kalas & Fest och Verktyg & Hemmafix —
**inget möbellöv**. Runbokens egen regel gäller då: finns inget löv som passar
räcker toppkategorin. Alla åtta ligger på `Hem & Inredning`, `totalSuccesses: 1`
per produkt.
