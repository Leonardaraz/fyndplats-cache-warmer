# Runda 131 Steg 4 — bildgenomgången, och den kullkastade fyra produkttyper

35 bilder hämtade i 1 200 px, tre kontaktark, fyra zoomar. **Ingen siffra och
ingen produkttyp avgjord på arket** — bara i förstoring.

## ☠️ FYRA AV SJU ÄR TRAPPOR, INTE RAMPER — och BÅDA texterna ljög

Rundan valdes som "sju husdjursramper". Bilderna säger något annat:

| id8 | titeln säger | `Lieferumfang` säger | BILDEN visar |
|---|---|---|---|
| `2166c50f` | Hunderampe | `1 x Hunderampe` | **TRAPPA**, 8 steg |
| `9a513e9a` | Hunderampe | `1 x Hunderampe` | **TRAPPA**, 8 steg |
| `c2be0f30` | Hunderampe | `1 x Hunderampe` | **TRAPPA**, 8 steg |
| `15e4c7a7` | Haustier**treppe** | `1 x Haustier-**Rampe**` | **TRAPPA**, 6 steg |
| `ed1ea8dc` | Haustierrampe | `1 x Haustier-Rampe` | ramp ✅ |
| `935cd17b` | Haustierrampe | `1 x Haustierrampe` | ramp ✅ |
| `1b64abde` | Haustierrampe | `1 x Haustierrampe` | ramp ✅ |

☠️ **RUNBOKENS REGEL RÄCKTE INTE, OCH JAG GICK PÅ DEN.** Regeln lyder
*"`Lieferumfang` är kontraktet — titeln är marknadsföring"*, och i Steg 3 lät
jag den avgöra att `15e4c7a7` var en ramp. Den var fel. Felet finns i BÅDA
riktningarna i samma batch:

- På de tre biltrapporna säger titeln OCH `Lieferumfang` *"Rampe"* — och varan
  har åtta steg med sättsteg och fyra gula halkplattor.
- På `15e4c7a7` säger titeln *"Treppe"* och `Lieferumfang` *"Rampe"* — och
  varan har sex steg.

**Den skärpta regeln: `Lieferumfang` är auktoritativt om vad som ligger i
KARTONGEN — antalet och tillbehören. SUBSTANTIVET det använder är
leverantörens eget marknadsföringsord och är inte mer tillförlitligt än
titelns. En produktTYP avgörs bara av bilden.**

⚠️ Beviset fanns dessutom i `Technische Daten` hela tiden, och jag läste förbi
det: biltrappornas spec har raden **`Trittgröße: 34,5L x 8B cm`** — *steg*mått.
En ramp har ingen stegstorlek. Fältet motsäger `Lieferumfang` i samma block.

Det spelar roll för kunden, inte bara för ordvalet: en **ramp** rekommenderas
för hundar med ledbesvär just för att den slipper stegen. Att sälja en trappa
som ramp skickar fel vara till den kund som behöver skillnaden mest.

## ☠️ Leverantörens egen grafik motsäger sin egen maxlast

Biltrappornas bild 3 säger **"GEEIGNET FÜR MITTELGROSSE & GROSSE HUNDE"** och
**"Maximales Gewicht < 25 kg"** i samma bild — och illustrerar med
Siberian Husky, Dalmatiner och Bullterrier, raser som normalt väger 20–38 kg.
Sidan skriver **25 kg**, och beskriver aldrig produkten som "för stora hundar".

## Bildbeslut: 11 av 35 bilder bort

| id8 | behålls | tas bort | skäl |
|---|---|---|---|
| `2166c50f` | 1, 2, 4 | **3, 5** | 3 = tysk rasgrafik · 5 = varumärkesbanner |
| `9a513e9a` | 1, 2, 4 | **3, 5** | samma |
| `c2be0f30` | 1, 2 | **3, 4, 5** | 4 = tysk instruktion "LASSEN SIE IHREN HUND…" |
| `ed1ea8dc` | 1, 2 | **3, 4, 5** | 3 = påklistrad varumärkesbricka · 4, 5 tyska |
| `15e4c7a7` | **1–5** | — | alla fem rena |
| `935cd17b` | **1–5** | — | alla fem rena |
| `1b64abde` | 1, 2, 4, 5 | **3** | tysk storleksrad `Katze / Groß / Mittel / Klein` |

## ☠️ Två varumärkesmärken, TVÅ olika svar

Leonards regel: *"om märket sitter fysiskt på varan så gör vi inget åt det,
det är så produkten ser ut."* Rundan innehåller båda fallen, och de går bara
att skilja åt i förstoring:

- **`c2be0f30` bild 1:** märket är **ingjutet i plasten** på trappans övre
  plattform, i samma perspektiv som ytan. Det ÄR varan. **Bilden behålls.**
- **`ed1ea8dc` bild 3:** märket ligger i en **vit rundad bricka klistrad över
  fotot**, svävande ovanför en soffa, utan perspektiv. Det är en vattenstämpel
  på bilden, inte på varan. **Bilden tas bort.**

⚠️ Skillnaden syns INTE på kontaktarket — båda ser ut som "en logotyp uppe till
vänster". Den syns i zoomen, på om märket följer ytans perspektiv.

## ⚠️ En delad hash som visade sig vara ofarlig

Pixelgrinden över alla 35 bilder gav **34 unika md5 och en delad**:
`2166c50f-05` och `9a513e9a-05` är byte-identiska. De är varumärkesbannern —
samma generiska reklambild på två färgsidor, inte ett produktfoto. Båda tas
bort ändå. **Ingen bild återanvänds mellan de tre färgsyskonen**, alltså är de
omfotade per färg och färgen på varje sida är belagd.
