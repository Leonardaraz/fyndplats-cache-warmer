# Runda 127 — Steg 3, 4 och 5

## Steg 3 — lager och prisgrind

Prisgrinden kördes via `polish-mapping.yml` läge `las`, Actions **2509–2516**,
åtta `success`. Workflowen `exit 1`:ar på `stammer: false` och `EJ AVGORBAR`,
så grön körning ÄR grindens dom.

Lagret lästes ur BUTIKEN (`inventory-items/search`), inte ur mappningen —
samma skäl som `jamforelsePris`: mappningen är vad vi TROR, Wix är vad kunden
möter.

| id | lager |
|---|--:|
| `709f7aac` | 197 |
| `4d5b3bb5` | 94 |
| `66866eb7` | **10** |
| `521aec3c` | 96 |
| `9ba9af92` | **11** |
| `3273d2ee` | 82 |
| `9b8c7308` | 76 |
| `21a12739` | 80 |

Alla över noll. **Ingen hålls tillbaka.**

## Steg 4 — bilderna

Granskade positionerna 3, 4 och 5 (feedens 3, 8 och 9). Position 1 och 2 är
huvudbild och livsstilsbild och hoppas över enligt runbooken.

| id | bort | orsak |
|---|--:|---|
| `709f7aac` | — | rena |
| `4d5b3bb5` | **4** | *"KLEINE, KOMPAKTE GRÖSSE — Passt leicht unter Schreibtische"* |
| `66866eb7` | **4** | *"PASST UNTER SCHREIBTISCHE — Kompakte Größe…"* |
| `521aec3c` | — | rena |
| `9ba9af92` | — | rena |
| `9b8c7308` | **5** | ☠️ **HOMCOM-LOGOTYP** inbränd uppe till vänster |
| `21a12739` | **4** | engelsk *"SAFETY DESIGN — It is only possible to open a drawer at a time"* |
| `3273d2ee` | **4** | *"NUR DIE ROLLEN MONTIEREN"* |

☠️ **Logotypen på `9b8c7308` är uppgift #282/#461 igen.** Den sitter som
overlay på en livsstilsbild, inte fysiskt på varan — Leonards regel
(*"om märket sitter fysiskt på varan så gör vi inget åt det"*) gäller alltså
INTE här. Bilden plockas bort.

### ☠️ RÄTTAT under rundan: en kontaktkarta avgör inte vad en bild BEVISAR

Första läsningen av `9b8c7308` bild 4 — gjord i en nedskalad kontaktkarta —
sa att alla tre lådor står öppna samtidigt, och drog slutsatsen att det
motsäger spärren som `21a12739`:s overlay påstår.

**Fel.** I originalupplösning svävar lådfronterna i olika vinklar; den översta
lutar nedåt på ett sätt en fastskruvad front inte kan, och lådorna syns som
separata svarta boxar. Det är en komponerad bild som visar INNEHÅLLET i varje
låda, inte ett foto av tre utdragna lådor. Bilden säger ingenting om spärren,
varken för eller emot.

⚠️ **Regeln: en kontaktkarta duger för att HITTA text i pixlarna, aldrig för
att avgöra vad en bild bevisar.** Zooma till originalet innan en bild används
som källa.

## Steg 5 — leverantörens påståenden

### ☠️ 1. `709f7aac` kan inte bära en skrivare — och heter så

Leverantörens namn: *"Mobiler Aktenschrank mit 3 offenen Fächern,
**Druckerablage** auf Rollen"*. Måttritningen och `Technische Daten` säger:

```
Belastbarkeit: 9 kg (gesamt), 3 kg (je Regalboden)
```

En vanlig bordsskrivare väger 5–10 kg. **Hyllplanet tål 3.** Att sälja den som
skrivarhylla vore ett påstående produkten inte klarar — och den kund som
ställer dit sin skrivare belastar ett spånskivefack tre gånger över taket.

Sidan säljer den därför som det bilderna visar: en **smal kubhylla på hjul**
för pärmar, papper och småsaker vid skrivbordet eller sängen. Lasten står
utskriven, båda talen.

### ☠️ 2. `521aec3c` har TVÅ lådor, och lasttalen går inte ihop

Leverantörens namn nämner inget antal. Bilden visar två lådor, och
`Technische Daten` ger EN lådinnermått (32 × 44,5 × 24) — alltså två lika
djupa lådor, inte en grund och en djup.

```
Belastbarkeit: 40 kg (insgesamt), 5 kg (Schublade)
```

Två lådor à 5 kg är 10 kg. Var de övriga 30 kilona tar vägen står ingenstans —
det finns ingen `Tischplatte`-rad som på syskonen. **Sidan skriver därför bara
det tal som är entydigt och som kunden faktiskt behöver: 5 kg per låda.**
Totalen utelämnas hellre än gissas.

⚠️ Jämför `4d5b3bb5`, där samma leverantör räknar rätt: *"Gesamt: 30 kg,
Tischplatte: 15 kg, Schublade: 5 kg"* — 15 + 3 × 5 = 30. Att den ena stämmer
är vad som gör den andras fel synligt.

### ☠️ 3. `521aec3c`:s spec-block bär MÅTTEN i materialfältet

```
Material: 39L x 48B x 67H cm
```

Importen har fyllt `Material` med måttsträngen. Den som bygger spec-tabellen ur
den råa får *"Material: 39L x 48B x 67H cm"* rakt ut till kund. **Spec-tabellen
byggs om, aldrig av.** Materialet är stål enligt `Technische Daten`.

### ☠️ 4. `66866eb7`:s axelbeteckningar motsäger sig själva

```
Gesamtabmessungen:          37L  x 43,5B x 67,5H cm
Schublade Innenabmessungen: 40,5B x 30,5T x 24H  cm
```

Lådans "B" (40,5) är BREDARE än skåpets "L" (37). Leverantören använder
L/B/T löst och inkonsekvent. Bilden avgör: **37 cm är fronten (bredden),
43,5 cm är djupet** — skåpet är smalt och djupt, byggt för att stå under en
skrivbordsskiva. Lådans 40,5 ligger alltså längs djupled.

⚠️ Samma fälla som uppgift #462: leverantörens egen beteckning är ingen källa.

### ☠️ 5. Lådspärren är OVERIFIERAD och skrivs inte ut

`21a12739`:s bild 4 påstår på engelska att bara en låda kan öppnas åt gången —
ett äkta tippskydd om det stämmer. Men:

- den tyska brödtexten nämner den inte, för VARKEN `21a12739` eller
  `9b8c7308` (samma modell M2);
- det enda tippskydd båda texterna nämner är *"1 Rad unter der
  Aktenschublade verhindert ein Umkippen"* — ett femte hjul, en annan sak;
- syskonets bild 4 är en komponerad render och bevisar ingenting.

**En overlay på en bild är för tunt underlag för ett säkerhetspåstående.**
Ingen av de två sidorna skriver ut spärren. Det femte hjulet skrivs ut, för
det står i texten.

### 6. `3273d2ee`: monteringen är bara hjulen

Bild 4 säger *"NUR DIE ROLLEN MONTIEREN"*. Bilden plockas bort (tysk text i
pixlarna) men **faktumet följer med till texten** — det är en verklig fördel
och det motsäger den lösa läsningen av `Montage erforderlich` som "skåpet
kommer i delar".

### 7. `9b8c7308` bär TVÅ vikter

`Technische Daten` säger *"Nettogewicht: 19,5 kg"*, spec-blocket säger 22 kg.
Samma klass som runda 126:s `3afe7275` (8 / 8,8 kg). **Sidan anger det högre
talet** — den som ska bära upp skåpet ensam ska inte bli överraskad.

### 8. ☠️ `9ba9af92` är färgsyskon till en publicerad sida

Se `STEG1-2.md`. Poleras mot `hurts-hjul-tre-lasbara-lador` (`66c9f2b5`,
svart, 1 559 kr) och korslänkas åt båda håll.

### 9. Lådorna är svarta invändigt på de vita skåpen

Uppmätt på bilderna för `9ba9af92`, `9b8c7308` och `3273d2ee`: stommen och
fronterna är vita, lådlådorna svarta. Det syns i kundens bilder och står inte
i någon text. Nämns i brödtexten så att det inte blir en överraskning.

## Vad som lämnas till Leonard

| | |
|---|---|
| Sortiment | Sex nästan identiska trelådors-hurtsar live samtidigt (fem nya + publicerade `66c9f2b5`). Kvalificerare finns i namn/slug/titel, men det är ett sortimentsbeslut om de ska vara sex sidor eller färre. |
| #461 | `9b8c7308` bild 5 bar HOMCOM-logotypen — ett fall till i logotypsvepet. |
| #478 | `81c123fa` (runda 128) bär *"kostenfrei bis Bordsteinkante"* i leverantörens text. |

## Steg 9, 10 och 12 — kvitton

### Steg 9 — bilderna och alt-texterna

`galleri.py` byggde 35 alt-texter och plockade bort fem bilder. Grinden körde
**2 självtest + 35 texter, 0 fel** (förbudslistan + tongrindarna ur `grind.py`,
max 125 tecken, måste namnge produkten, ingen dubblett, homoglyfkoll, och två
egna grindar: SKRIVARE och LÅDSPÄRR).

| id | bilder före | efter | utan alt | alt stämmer | id stämmer | synlig efter |
|---|--:|--:|--:|:-:|:-:|:-:|
| `709f7aac` | 5 | 5 | 0 | ✓ | ✓ | false |
| `4d5b3bb5` | 5 | **4** | 0 | ✓ | ✓ | false |
| `66866eb7` | 5 | **4** | 0 | ✓ | ✓ | false |
| `521aec3c` | 5 | 5 | 0 | ✓ | ✓ | false |
| `9ba9af92` | 5 | 5 | 0 | ✓ | ✓ | false |
| `3273d2ee` | 5 | **4** | 0 | ✓ | ✓ | false |
| `9b8c7308` | 5 | **4** | 0 | ✓ | ✓ | false |
| `21a12739` | 5 | **4** | 0 | ✓ | ✓ | false |

⚠️ **Skrivaren står i två livsstilsbilder och nämns i ingen alt-text.**
`521aec3c` pos 2 och `3273d2ee` pos 2 visar båda en skrivare ovanpå skåpet.
Ingen av de två sidorna anger last för TOPPSKIVAN — bara per låda — så en
alt-text som skrev ut skrivaren hade gjort ett belastningspåstående sidan inte
backar upp. Samma avvägning som fällde `709f7aac`:s "Druckerablage" i Steg 5.
Grinden är `SKRIVARE` i `galleri.py`, inte en vana.

### ☠️ `wix.request` bär kroppen under `body` — `data` slukas TYST

Första skrivförsöket gav **400 `product.revision must not be empty`** på en
kropp som bevisligen bar `revision: "4"`. Felet var nyckeln: kroppen låg under
`data`, och den slukas. Wix får då en TOM `product`, och protobuf-validatorn
rapporterar första saknade obligatoriska fältet — `revision`.

☠️ **Felmeddelandet pekar alltså på fel sak.** Det säger "revision saknas" när
sanningen är "hela kroppen saknas", och den som tror på det börjar felsöka
revisionsläsningen — som är korrekt. Mätt båda vägarna på samma produkt i
samma minut:

| nyckel | utfall |
|---|---|
| `data: {product: {…, revision: "4"}, fieldMask}` | **400** `revision must not be empty` |
| `body: {product: {…, revision: "4"}, fieldMask}` | **200**, revision 4 → 5 |

Samma familj som `media.items` mot `media.itemsInfo.items`: ett fältnamn som
inte finns läses som TOMT, inte som fel.

### Steg 10 — kategorierna

Butiken har **inget löv för kontorsmöbler**. Facit är därför det publicerade
färgsyskonet `66c9f2b5` (`hurts-hjul-tre-lasbara-lador`), som ligger i
`Förvaring & Organisering` + `Hem & Inredning`. Rundans åtta fick exakt samma
två — `totalSuccesses: 2, totalFailures: 0` på alla åtta.

☠️ **Läst TVÅ gånger** (uppgift #357: en återläsning direkt efter en
kategoriskrivning kan ljuga NEGATIVT). Båda läsningarna ger samma svar på alla
åtta: `05e96cd6` (All Products), `1632eeea`, `3ed832b7`.

### Steg 12 — avskriftskvittot

Räknat på det som FAKTISKT ligger i Wix (`?fields=PLAIN_DESCRIPTION`,
taggstrippat och blanksteksnormaliserat) mot `skrivning.json`:

| id | tecken | teckenkodsumma | ord | namn · slug · titel · meta · SKU | synlig | märke |
|---|--:|--:|--:|:-:|:-:|:-:|
| `709f7aac` | 1 927 | 217 364 | 364 | ✓ | false | null |
| `4d5b3bb5` | 1 911 | 216 471 | 344 | ✓ | false | null |
| `66866eb7` | 1 738 | 177 394 | 327 | ✓ | false | null |
| `521aec3c` | 1 628 | 176 704 | 303 | ✓ | false | null |
| `9ba9af92` | 1 943 | 212 477 | 347 | ✓ | false | null |
| `3273d2ee` | 2 010 | 232 224 | 363 | ✓ | false | null |
| `9b8c7308` | 1 928 | 210 361 | 341 | ✓ | false | null |
| `21a12739` | 1 905 | 200 275 | 340 | ✓ | false | null |

**8 produkter, 0 avvikelser.**
