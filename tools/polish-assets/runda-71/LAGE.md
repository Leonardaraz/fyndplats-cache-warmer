# Runda 71 — åtta fåtöljer, publicerade och live-verifierade

**Klar 2026-09-06.** Åtta produkter genom alla fjorton steg: text → grindar →
kort → Wix-skrivning → SKU → bilder → kategori → prisgrind → publicering →
stämpling → live-grind. Priserna är orörda.

| id8 | slug | SKU | pris | maxlast |
|---|---|---|--:|--:|
| d760fffc | `vridfatolj-beige-130-grader` | `FP-vridfatolj-beige-130` | 2 359 | 120 kg |
| 79eaab59 | `vridfatolj-gra-130-grader` | `FP-vridfatolj-gra-130` | 3 239 | 120 kg |
| 4b2a7407 | `vridfatolj-graddvit-130-grader` | `FP-vridfatolj-graddvit-130` | 2 899 | 120 kg |
| 1a1d04f7 | `vridfatolj-svart-130-grader` | `FP-vridfatolj-svart-130` | 2 949 | 120 kg |
| 99492092 | `fjaderfatolj-graddvit-145-grader` | `FP-fjaderfatolj-graddvit` | 2 859 | 120 kg |
| 79690bf4 | `smalfatolj-ljusgra-135-grader` | `FP-smalfatolj-ljusgra-135` | 2 729 | 120 kg |
| 89273d39 | `sammetsfatolj-morkgra-med-fotpall` | `FP-sammetsfatolj-morkgra` | 2 999 | 150 kg |
| 9c1889f1 | `gungfatolj-graddvit-135-grader` | `FP-gungfatolj-graddvit-135` | 3 039 | 150 kg |

Live-grinden: **8/8 `200`, alla byte-identiska mot facit**, eget kort i
sidkällan på alla åtta, noll landsnamn, noll artikelnummer, noll tyska ord,
noll husmärken. Prisgrinden grön på alla åtta (`las`-körning 1262–1269).

## ☠️ Bildskrivningens svar säger `5 → 0` och LJUGER

Den PATCH som satte bildlistan svarade `bilder=5→0` på varenda produkt. Det ser
ut som att skrivningen precis raderade hela katalogens bilder. Den gjorde inte
det — återläsningen med `?fields=MEDIA_ITEMS_INFO` visar **sex bilder på alla
åtta**, kortet på position 3 och noll tomma alt-texter.

Orsaken är den redan kända: `media.itemsInfo.items` ligger inte i
standardprojektionen. Det som är NYTT är att regeln gäller **PATCH-svaret**
också, inte bara `getProductMedia` — och där är den farligare, för ett svar som
säger noll bilder efter en skrivning läses som en katastrof. Den självklara
reaktionen är att skriva om bilderna en gång till, och då får produkten
dubbletter.

☠️ **Läs alltid tillbaka med fältet uttryckligen begärt innan du tror på ett
antal.** Nionde gången samma familj, men åt andra hållet: här är det inte ett
svar utan fel som saknar kvitto — det är ett svar som ser ut som ett FEL utan
att vara det. Ett falsklarm ur ett API är lika dyrt som en tyst miss.

## ☠️ En `products/v3`-PATCH KRÄVER `revision`

`product.revision must not be empty` — 400 på första försöket. Siffran i
`bilder.json` är dessutom gammal så fort något annat rört produkten, så
revisionen hämtas FÄRSKT i samma anrop (`GET` direkt före `PATCH`) i stället för
att läsas ur en sparad fil.

## ☠️ Slug-grinden förgiftade sig själv på en omkörning

`kanda_sluggar()` läser varje rundas `skrivning.json` för att fälla en slug som
redan är skriven. Den läste också **sin egen**, som `skrivning.py` just hade
skrivit — så andra körningen fällde alla åtta med *"slug … är redan skriven i
runda-71"*. Grinden gjorde inget fel första gången; den var bara inte
idempotent.

Exakt samma form som byggfiltret i `vercel.json` (2026-09-05): en mekanism vars
egen framgång skapar felet. Lagat med tre rader — hoppa över den egna katalogen.
En grind som lyser rött på korrekt arbete lär läsaren att sluta läsa den, och då
är även det äkta larmet borta.

## Rundans sakfynd

Båda står utförligt i commit `2fc91b7`:

- **#289 är löst av mätningen.** Lederoptik-kvartetten bär två olika maxlaster i
  källan (tre säger 150 kg, en säger 120) trots ordagrant identisk tysk text och
  identiska mått. Den enda bilden i kvartetten som bär en lastsiffra i pixlarna
  säger **120 kg**. Alla fyra skrivs 120.
- **På ett blankt material mäter medianen studioljuset, inte färgen.** Mörkaste
  decilen mäter materialet. Kalibrerat mot fem publicerade sidor: tre svarta på
  10–19 %, två mörkgrå på 25–26 %. `farg.py` rapporterar båda sedan nu.

## Vad familjen har kvar

Ungefär **fjorton** manuella utkast, plus de två färgsyskonen i #293
(`b67fdc2b` brun, `b1e98da4` grå) som ska poleras mot sina publicerade syskons
text i stället för mot den tyska källan.

#295 står kvar orörd: fyra publicerade sidor från runda 69 har ofullständiga
"finns i fler färger"-listor sedan runda 70 stängde familjerna.
