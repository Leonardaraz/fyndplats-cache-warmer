# Runda E3 — tio Akzentsessel

⏸ **FÖRBEREDD, INTE PUBLICERAD.** Texterna är skrivna och filgrindade, Wix är
orört. Prisgrinden går genom GitHub-workflowen och servern är fortfarande
nere — samma läge och samma beslut som D3 och E2: **en grind man inte kan
köra är en grind som inte har godkänt.**

Med den här rundan är `^Akzentsessel` slut (10 av 10).

## ☠️ Åtta av tio är färgsyskon till sidor vi redan säljer

Hittat på MÅTT. Ingen namnjämförelse hade sett något av dem — utkasten heter
`Akzentsessel`, de publicerade heter `manchesterfatolj` och `vilstol`.

| grupp | utkast | publicerad motsvarighet | bevis |
|---|---:|---|---|
| **A1** | 6 st, 2 059–2 499 kr | `manchesterfatolj-med-fotpall-beige` (2 639) | 72 × 80 × 101, pall 65 × 43 × 38, sits 46 × 53 på 45, dyna 11 cm, 150/80 kg, bok — **och vikt 19,7 kg + paketmått 74 × 40 × 72** |
| **A3** | 2 st, 1 259–1 299 kr | `vilstol-bjork-femstegs-fotstod` (1 169) | 66,5 × 94 × 100, rygg 75 × 55 × 71, sits 55,5 × 51,5 × 40, fotdel 55,5 × 33, ram 60 × 22 mm — **och vikt 10,3 kg + paketmått 81 × 60 × 23** |
| **A2** | 2 st, 1 259–1 399 kr | *ingen* | hopfällbar bokstol, 71 × 89 × 96, viks till 14 cm — de publicerade trästolarna är 72 × 95 × 93 (adirondack) och 158 × 61 × 70 (akacia) |

Vikt och paketmått är det som gör bevisningen tät: två olika möbler kan råka
dela ett yttermått, men inte vikten på hektogrammet OCH kartongens tre sidor.

⚠️ **A1 blir därmed en SJUFÄRGSFAMILJ** — de sex plus den publicerade beigen,
i spannet 2 059–2 639 kr. Det är 580 kronor, 28 %, för samma stol. Samma
fråga som #131 (190 cm-bäddfåtöljen, fem sidor) och #122 (sex
öronlappsfåtöljer). Regeln räknar rätt — inköpspriset skiljer mellan
kulörerna — men kunden ser sju rutor med samma stol. **Leonards beslut.**

☠️ **Slugarna är därför lagda i de befintliga familjerna**
(`manchesterfatolj-med-fotpall-…`, `vilstol-bjork-femstegs-fotstod-…`), inte
under påhittade nya namn. En sjunde manchesterfåtölj som heter något annat är
en sida kunden inte hittar från de sex andra.

## ☠️ Fyra av tio färgetiketter är FEL mot fotot

Det här är rundans egentliga fynd, och det är en ny regel.

| utkast | tysk etikett | uppmätt i bild 1 | vad det faktiskt är |
|---|---|---|---|
| `791e7292` | **Orange** | (190, 147, 56) | senapsgul |
| `bc220489` | **Braun** | (206, 127, 59) | orange |
| `1e6872c7` | **Hellgrau** | (148, 163, 171) | gråblå |
| `45512a52` | **Braun** | (199, 177, 128) | khaki |

Etiketterna är alltså inte bara oprecisa — på `791e7292` och `bc220489` är de
**utbytta mot varandra**. Hade jag skrivit färgen från etiketten skulle den
senapsgula stolen heta orange och tvärtom, på två sidor som ligger bredvid
varandra i samma familj.

**Regeln: färgetiketten i feeden är inte ett bevis. Fotot är.** Samma familj
av misstag som `to-product.ts`-etiketterna och de omkastade måtten — det är
alltid leverantörens METADATA som ljuger, aldrig bilden.

⚠️ Och ett gränsfall som krävde ögon, inte bara tal: `4a9c33d2` (etiketten
säger omväxlande *Hellbraun* och *Khaki*) mäter (195,179,163) mot den
publicerade beigens (222,204,188) — 14–43 mörkare per kanal över tre
beskärningar, alltså en verklig men NÄRLIGGANDE färg. Sida vid sida är den
publicerade varmt gräddbeige och utkastet svalt gråbeige. Den heter därför
**gråbeige**, inte beige, så att de två går att skilja på ett produktkort.

## ⚠️ En divergens mot en publicerad sida som bör stämmas av

Den publicerade `manchesterfatolj-med-fotpall-beige` skriver
*"Stomme: Stålram med skumstoppning"*. Källan för de sex nya säger bara
`Buche, Schaumstoff, Kord` — **inget stål**. Eftersom det är samma stol kan
bara den ena vara rätt.

Jag har skrivit det källan bär (bok med skumstoppning) och inte propagerat
stålramen. Sju sidor i samma familj bör inte säga olika saker om stommen —
det behöver avgöras, inte gissas.

## ☠️ Steg 2 — och ett fel siffergrinden inte kunde se

Första utkastet av A1-texten skrev: *"sitthöjden på fåtöljen är 45 cm, så
pallen ligger **sju** centimeter lägre."* Sjuan är 45 − 38, uträknad av mig —
och eftersom den står med BOKSTÄVER är siffergrinden blind för den.

Det är E2:s *"5 cm lägre"* en gång till, men i en form grinden inte fångar.
Texten anger nu båda talen och drar inte ifrån.

Övriga fynd:

- **A2 anger ingen maxlast.** Inget lyft, ingen gissning — en bärighet är ett
  kundlöfte och skrivs bara när den finns.
- **A2 byter mått med läget.** Tre lägen ger tre yttermått (71 × 89 × 96,
  71 × 80 × 103, 71 × 95,5 × 88). Alla tre står i specen, för den som mäter
  sin plats behöver det djupaste.
- **A3:s fotdel är INBYGGD.** Vår publicerade fåtölj i böjd träfanér har en
  lös fotpall som bär 30 kg. Skillnaden står i texten.

## Grindarna

| grind | utfall |
|---|---|
| Prisgrind | ⏸ **går inte att köra — GitHub nere** |
| Filgrind (mönster + tal) | **0 fynd i 10 filer** |
| Mutationstest av grinden | 4 injicerade fel → 5 fynd, 0 falska |
| Egen granskning (ögon, inte grind) | 1 härlett tal i bokstäver + 3 obelagda formuleringar → alla borttagna |
| Bildgranskning | 50 bilder, **noll tyska grafiker** |
| Färgmätning | 10 mätta, 4 etiketter motbevisade, 1 gränsfall avgjort med ögon |
| Checksumma, alt-texter, live-grind | ⏸ väntar på publicering |

## Kvar när GitHub är uppe

Prisgrind ×10 → skriv texterna → checksumma → alt-texter → SKU + publicera →
stämpla → live-grinda. Underlaget ligger här; inget behöver göras om.
