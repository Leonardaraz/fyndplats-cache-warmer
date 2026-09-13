# Steg 9 — bilder: ordning, egna kort och alt-texter

## Galleriet

| pid | bilder | ordning | borttaget |
|---|--:|---|---|
| 1467588a | 6 | hjälte · miljö · **kort** · detalj · detalj · ritning | — |
| 27b607dc | 6 | samma | — |
| 3a96740e | 6 | samma | — |
| 3addfbf8 | 5 | hjälte · miljö · **kort** · detalj · detalj | ritningen (tysk MODELL-INFO) |
| 4faf9f4c | 6 | samma som ovan + ritning | — |
| 8d074911 | 4 | hjälte · miljö · **kort** · miljö | infografik + leverantörsreklam |
| 90573e36 | 5 | hjälte · miljö · **kort** · miljö · ritning | miljöbild med tysk tavla |
| a4d8feca | 6 | hjälte · miljö · **kort** · detalj · detalj · ritning | — |
| b04b5375 | 6 | samma | — |
| b813d037 | 6 | samma | — |

Fyra leverantörsbilder bort, 46 av 50 kvar, tio egna kort in → 56 bilder.

☠️ **De två som tappade sin måttritning är de två vars kort BÄR måtten.**
`3addfbf8` fick `Mått · Toppbädd · Mellanplan · Rund bädd · Klösbräda` och
`8d074911` fick `Mått, klösstolpen · Antal delar · Håla · Mjuk stege ·
Kattbädd`. Radvalet är där måttbärande, inte illustrativt.

## Korten

Byggda med `kortrunda`/`kortbygge`, ett per produkt (Leonards regel
2026-08-26). Alla tio under 215 kB-taket.

☠️ **Kontaktarket fällde en rubrik.** `b813d037` stod *"Rund bas, fyra plan
ovanpå"* medan brödtexten räknar basen SOM ett av de fyra planen — kortet och
sidan hade motsagt varandra i samma ögonkast. Ingen textgrind kan se det: båda
talen är härledda och inget ord är förbjudet. Det är RÄKNINGEN. Ny rubrik:
*"Fyra plan, underst en rund platta"*.

⚠️ **`MJUKA` nycklas på PRODUKT-ID, inte på kortnamnet.** `mjuka_upp(k, …)`
anropas med `k`, medan verktyget skriver ut `a4d8feca_spec`. Fel nyckel är en
TYST no-op — samma utfall som runda 130:s döda kod, och verktyget skrev ut
"MJUKA UPP FOTOT" båda gångerna. Med rätt nyckel: 233 632 → 211 536 byte.

## Uppladdningen

Via GRENEN, inte base64: tio `raw.githubusercontent.com`-adresser i ETT anrop
efter att korten pushats. Pushen låg FÖRE anropet — GitHub serverar bara det
som finns i grenen, och alla tio svarade `200` innan uppladdningen.

☠️ **`success: true` är inget kvitto — `operationStatus` var `PENDING` på alla
tio.** Två kontroller efteråt:

1. **Redoflaggan:** `…/v1/fill/w_400,h_400,al_c,q_80/f.jpg` svarar 200 när
   filen är klar, 403 när den inte är det. 10/10 svarade 200.
2. ☠️ **Kopplingen bevisas på md5, inte på ORDNINGEN i svaret.** Varje
   wixstatic-fil laddades ner och matchades mot det lokala kortets md5:
   `md5-par: 10, omatchade: inga`. Hade svaret kommit i annan ordning hade
   fel kort hamnat på fel produkt — tyst.

## Alt-texterna

56 stycken, en per bild. ☠️ **De passerar ingen av Steg-grindarna** — `grind.py`
läser `texter.py`, och alt-texterna finns inte där. `altgrind.py` kör därför
RUNDANS EGEN `FORBJUDET`-lista mot dem, plus husets ARTNR, trekonsonant,
husmärken, LANDORD och LAGERFRAS, och en stajlingsgrind (djur och människor i
leverantörens iscensatta miljöbild är inte produktinformation).

Grinden fann två verkliga fel i mitt eget utkast:

| fynd | vad |
|---|---|
| **Sju saknade ritningens alt-text** | Galleriet har 6 bilder men jag skrev 5 — måttritningen sist var oskriven på sju av tio |
| **Två delade samma miljömening** | En alt-text som passar två produkter beskriver ingendera |

⚠️ **Och grinden KRASCHADE först i stället för att fälla.** `grindar.LANDORD`
bär färdigkompilerade mönster medan `grind.FORBJUDET` bär strängar;
`re.search(kompilerat, s, re.I)` kastar `ValueError`. Ett dött självtest ser i
en logg ut precis som ett tyst. Grinden hanterar nu båda formerna och har ett
eget självtest (2/2) som fäller på det den finns för.

Slutresultat: `självtest 2/2 ok · alt-texter: 56 · GRIND: 0 fel`.

## Skrivningen och kvittot

`media.itemsInfo.items` ersätts i sin helhet, så varje item bar `altText` —
även de som bara flyttade plats. `media.main` skickades INTE (readOnly; Wix
ignorerar då tyst hela `media`), och fältet är `media.itemsInfo.items`, aldrig
`media.items` (tömmer galleriet). `visible: false` skickades explicit.

Kvittot är en EGEN GET per produkt — PATCH-svaret bär inget `?fields` och
returnerar `media.itemsInfo` tomt (#457):

```
kvitto: 10/10
1467588a 6 bilder, kort#3, ritning sist   …   8d074911 4 bilder, kort#3, ingen ritning
```

Kontrollerat per produkt: antal bilder, kortet på plats 3, noll bilder utan
alt-text, noll TYSKA alt-texter kvar, `media.main` = första bilden, och
`visible` fortfarande `false`.
