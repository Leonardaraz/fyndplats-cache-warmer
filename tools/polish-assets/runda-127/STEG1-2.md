# Runda 127 — Steg 1 och 2

Familjen är de **tolv kvarvarande kontorsförvarings-utkasten** plus åtta
rullande verktygsskåp. Runda 126:s LAGE.md flaggade att fyra delar identiskt
namn och två par till delar namn, och att de därför kräver en INTERN
dubblettmätning före batchurvalet. Den är gjord och den ändrade batchen.

## Katalogsvepet

| | |
|---|--:|
| Sidor | 57 |
| `avhuggen` | **false** |
| Publicerade | 2 552 |
| Utkast | 3 097 |
| Känd publicerad sida hittad | ja (`verktygsvagn-…`) |
| Träffar på familjens stammar | 60 |

☠️ **Svepet gick på sluggens STAM, inte på en handskriven ordlista** — runda
126:s lärdom, där en ordlista missade `arbetsplattform` och därmed dolde just
den publicerade sida som dubbletten måste mätas mot.

## ☠️ Fyra identiskt NAMNGIVNA rullhurtsar är TRE olika modeller

Alla fyra heter *"Rollcontainer mit 3 Schubladen mobiler Aktenschrank mit
Rollen"* och skiljer sig med 130 kr. Leverantörens namn separerar dem inte alls.

| id | modell | färg | H | stor låda | vikt | pris |
|---|---|---|--:|--:|--:|--:|
| `9ba9af92` | **M1** läppgrepp | vit | **60** | **24** | 21 | 1 629 |
| `9b8c7308` | **M2** ovalt infällt grepp | vit | 59 | 23,8 | 22 | 1 749 |
| `21a12739` | **M2** | svart | 59 | 23,8 | 22 | 1 759 |
| `3273d2ee` | **M3** springgrepp | vit | 59 | 23,8 | 22 | 1 729 |

Alla fyra delar bredd 39, djup 48, lådbredd 32,6 × 43,2, last 50/15 kg och
paketmått 47 × 56 × 64.

### ☠️ FEM tal på decimalen räckte INTE — bilden avgjorde

`9b8c7308` och `3273d2ee` är båda **vita**, och stämmer på varenda tal:
39 × 48 × 59, små lådor 32,6 × 43,2 × 7, stor låda 32,6 × 43,2 × 23,8,
50/15 kg, 22 kg, paket 47 × 56 × 64. Efter runda 126:s regel — *"stämmer fyra
tal på decimalen är det samma vara"* — var de en bevisad dubblett.

**De är det inte.** Bilderna visar två olika skåp:

| | `9b8c7308` | `3273d2ee` |
|---|---|---|
| hörn | **rundade**, svart kantlist | **raka** |
| grepp | **ovalt infällt handtag** i varje front | **greppfritt**, tunn springa |
| yta | blank | matt |

⚠️ **Regeln behöver en gräns: fyra tal räcker inte i en STANDARDISERAD
kategori.** En kontorshurts på 39 × 48 × 59 cm med en hängmappslåda på
32,6 × 43,2 är branschens standardformat — varje tillverkare träffar det.
Talen är då ingen fingeravtryck, utan en norm. Runda 126:s regel gäller
fortfarande när talen är UDDA (110 × 32 × 50, 4,8 kg); den gäller inte när de
är runda mått på ett standardformat.

### ☠️ Och pixelgrinden är STRUKTURELLT BLIND över en färgändring

dHash jämför ljushetsgradienter. Färgar man om varan från vit till svart
INVERTERAS de, så samma skåp i två färger får högt avstånd. Uppmätt:

| jämförelse | dHash-snitt | sanning |
|---|--:|---|
| `9ba9af92` (vit) mot publicerade `66c9f2b5` (svart) | 38,59 % | **SAMMA modell** |
| `3273d2ee` (annan modell) mot samma publicerade | 43,83 % | olika modell |

Fem procentenheter skiljer "samma vara" från "olika vara". Det är brus, inte
bevis. **Pixelgrinden bevisar bara LIKHET (0,00), aldrig OLIKHET** — och den
kan inte användas alls när färgen skiljer. Där är spec-talen plus ögonen det
enda som biter.

## ☠️ `9ba9af92` är FÄRGSYSKON till en PUBLICERAD sida

`hurts-hjul-tre-lasbara-lador` (`66c9f2b5`, **1 559 kr**, svart) bär:

```
Yttermått: 39 × 48 × 60 cm
Små lådor invändigt: 32,6 × 43,2 × 7 cm (2 st)
Stor låda invändigt: 32,6 × 43,2 × 24 cm
Material: pulverlackerat kallvalsat stål
Hjul: fyra länkhjul varav två med broms, plus ett tippskydd
```

`9ba9af92`:s tyska `Technische Daten` säger samma sak, ord för ord, i vitt:
39L × 48B × 60H, 32,6 × 43,2 × 7 och × 24, *"korrosionsbeständigem,
pulverbeschichtetem Stahl"*, *"4 multidirektionale Rollen … 2 davon mit Bremse
und ein zusätzliches Rad als Kippschutz"*. Bilderna visar samma kropp: raka
hörn, läppgrepp över hela fronten, femte hjulet synligt.

**Det är alltså inte en dubblett utan ett färgsyskon** — samma mönster som
runda 90 och 91. Sidan poleras mot den publicerade systerns text och de två
korslänkas åt BÅDA håll.

⚠️ Priserna skiljer 70 kr (1 559 svart mot 1 629 vit). Det är leverantörens
pris per färg och **rörs inte** — men det ska stå klart på båda sidor att det
är samma skåp i två färger, annars ser det ut som ett fel.

## Rundans åtta

| # | id | produkt | mått (B × D × H) | pris |
|---|---|---|---|--:|
| 1 | `709f7aac` | skrivarhylla på hjul, tre öppna fack, spånskiva | 33,5 × 33,5 × 111 | 979 |
| 2 | `4d5b3bb5` | smal rullhurts, 3 lådor + pennfack, stål | 37 × 43,5 × 60 | 1 419 |
| 3 | `66866eb7` | smal rullhurts, 2 lådor | 37 × 43,5 × 67,5 | 1 599 |
| 4 | `9ba9af92` | rullhurts M1 **vit** — färgsyskon till `66c9f2b5` | 39 × 48 × 60 | 1 629 |
| 5 | `3273d2ee` | rullhurts M3, greppfri **vit** | 39 × 48 × 59 | 1 729 |
| 6 | `521aec3c` | rullhurts med mellanvägg och centrallås, **vit** | 39 × 48 × 67 | 1 729 |
| 7 | `9b8c7308` | rullhurts M2, infällt handtag, **vit** | 39 × 48 × 59 | 1 749 |
| 8 | `21a12739` | rullhurts M2, infällt handtag, **svart** | 39 × 48 × 59 | 1 759 |

☠️ **Sex nästan identiska trelådors-hurtsar hamnar live samtidigt** (fem nya
plus den publicerade). Runbokens svar på det är inte att låta bli utan att
lägga en KVALIFICERARE i namn, slug OCH titel. De som finns och är sanna:

| id | kvalificerare |
|---|---|
| `9ba9af92` | vit · 60 cm · tippskydd |
| `9b8c7308` | vit · infällt handtag · rundade hörn |
| `21a12739` | **svart** · infällt handtag |
| `3273d2ee` | vit · **greppfri front** |
| `4d5b3bb5` | **smal 37 cm** · pennfack |
| `66866eb7` | smal 37 cm · **2 lådor** |
| `521aec3c` | **mellanvägg** · centrallås · 67 cm |

## Kvar till runda 128

- **Fyra höga metallskåp**: `6df0ce88` (80 × 40 × 92,5, grå),
  `5a0f9799` + `beeada22` (75 × 33 × 110, vit/svart — **färgsyskon**,
  identisk text ord för ord), `81c123fa` (75 × 40 × 180, svart, 3 769 kr).
- **Åtta rullande verktygsskåp**: `1db06f83`, `f2495eee`, `1654dd75`,
  `fc6fdd63`, `b920d526`, `d9965552`, `bc2e7191`, `88eb3627`.
  ☠️ `b920d526` och `d9965552` är **färgsyskon** (röd/blå), identiska på
  61,5 × 33 × 113 och 41,7 kg. Familjen har **fjorton publicerade
  konkurrenter** (`verktygsvagn-*`, `verktygsskap-*`) och kräver en
  måttjämförelse mot alla fjorton före batchurval.

## Steg 2 — laglighetsgrind

Ingen blockerare. Kontorsförvaring i stål är inte reglerad produkt: ingen
CE-märkning, inget barnnormskrav, inga elektriska delar.

Tre saker som ändå måste hanteras i texten:

1. ☠️ **`81c123fa` bär ett LEVERANSLÖFTE i leverantörens egen text**:
   *"WICHTIG: Wir liefern Ihnen den Artikel kostenfrei bis Bordsteinkante."*
   Fri leverans till trottoarkant är Aosoms villkor mot OSS, inte vårt mot
   kunden. Samma klass som uppgift #423. Får inte nå sidan — och produkten
   ligger i runda 128, så noteringen följer med dit.
2. ⚠️ **Tippskydd hör till texten på varje hurts.** En trelådors hurts med
   en utdragen hängmappslåda har tyngdpunkten utanför hjulbasen. Fyra av de
   åtta har ett femte hjul just för det; de som inte har det ska inte utlova
   det.
3. ⚠️ **Maxlasten är PER LÅDA och TOTALT**, och de två talen är olika
   (50/15, 40/5, 30/5). Den som skriver bara det ena talet lovar fel.
