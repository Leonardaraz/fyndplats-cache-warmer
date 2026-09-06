# Runda E3 — tio Akzentsessel

⚠️ **DELVIS PUBLICERAD 2026-09-06, och rundan slutade i en KOLLISION.**

| grupp | vad som hände |
|---|---|
| **A1** (6 manchesterfåtöljer) | publicerade — men med **den andra sessionens** text, namn, slug, alt och kort. Mitt arbete på dem är överskrivet och kastat. Se nedan. |
| **A2** (2 hopfällbara bokfåtöljer) | publicerade med MIN text, checksummeverifierad, stämplade och live-grindade |
| **A3** (2 björkvilstolar) | stoppade sedan tidigare — dubbletter av publicerad sida (#140) |

## ☠️ Två sessioner skrev till samma sex produkter inom två minuter

Uppmätt på revisionerna och tidsstämplarna, inte gissat:

```
10:52–10:56  jag: text (checksummeverifierad), 30 alt-texter, 6 unika SKU:er, publicering
10:58:02     den andra sessionen: text, namn, slug, alt-texter + ett Fyndplats-kort som bild 3
```

Det som ligger på sidorna nu är **deras** — 4 415 tecken mot mina 2 955–2 982,
namnen `Manchesterfåtölj med fotpall i ‹färg› – vingrygg 101 cm, 150 kg`,
slugarna `fatolj-‹färg›-manchester-fotpall`. Det enda som är mitt är SKU:erna
(`FP-manchesterfatolj-‹färg›`), som de inte rörde.

**Jag har medvetet INTE skrivit tillbaka min text.** Deras är nyare och
komplett; två konkurrerande texter är sämre än en, och att skriva över dem
hade varit samma misstag en tredje gång. Tillståndet är sammanhängande, inte
halvt: priserna är orörda (2 499 / 2 329 / 2 319 / 2 269 / 2 199 / 2 059) och
sidorna är hela.

☠️ **Fördelningen säger att de sex är MINA.** `FORDELNING.md` rad 17 ger den
andra sessionen `^Relaxsessel` — ankrad i början. Rad 98 säger uttryckligen
*"Fyll på till åtta ur `^Akzentsessel` (10 st) om det behövs"*, i min del av
dokumentet. De sex heter `Akzentsessel mit Hocker, Relaxsessel in Cord-Optik…`
och matchar alltså inte `^Relaxsessel`.

Antingen lästes regeln som "innehåller Relaxsessel" i stället för "börjar
med", eller så är dokumentet otydligt. **En regel som går att läsa på två sätt
är ingen fördelning** — och en markering på mappningsraden medan en session
arbetar hade gjort kollisionen omöjlig i stället för olycklig. Se #144.

⚠️ Klockan 11:00:53 stod `needsAiPolish: true` kvar på `e1c41327` trots att
sidan var publicerad. Jag stämplade den INTE: att lägga en tredje skrivare på
samma rader är precis det som orsakade kollisionen. Blir de sex inte stämplade
står de kvar i poleringskön fast de ligger ute.

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

## ☠️ STOPP FÖR A3 — stolen ligger redan ute TVÅ gånger

Upptäckt efter att rundan förberetts, i måttsvepet inför nästa familj.

`vilstol-bjork-femstegs-fotstod` (1 169 kr) är inte den enda publicerade
sidan för den stolen. Det finns en till:

| publicerad sida | pris | mått |
|---|---:|---|
| `fatolj-fotstod-5-lagen-bjork` | **1 729 kr** | 66,5 × 94 × 100, sits 55,5 × 51,5 × 40, ryggstöd 75 × 55 × 71, fotstöd 55,5 × 33 i fem lägen, stomme 60 × 22 mm, 120 kg |
| `vilstol-bjork-femstegs-fotstod` | **1 169 kr** | identiskt på varje tal |

**Samma stol, två av våra egna sidor, 560 kronor isär — 48 %.** Den dyrare
anger dessutom *"Färg: svart eller grå"*, alltså täcker den båda kulörerna.

☠️ **`7e00970f` (grå) ska därför INTE publiceras.** Grått är redan sålt på
`fatolj-fotstod-5-lagen-bjork`. Att lägga till en tredje grå sida för samma
stol är att göra ett befintligt problem värre.

⚠️ `84082d41` (brun) är en färg ingen av de två publicerade har, men den bör
inte heller gå ut förrän de två existerande sidorna är avgjorda — annars blir
det tre sidor för en stol som redan har två för många.

**A3 hålls alltså i sin helhet.** Rundan är 8 produkter, inte 10, tills
dubbletten är löst. Se uppgift #140.

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
| Prisgrind (körning 1372–1379) | **8 gröna** |
| Saldokoll i Wix | **8 köpbara** (197, 197, 169, 39, 197, 14, 14, 54) |
| Filgrind (mönster + tal) | **0 fynd i 10 filer** |
| Mutationstest av grinden | 4 injicerade fel → 5 fynd, 0 falska |
| Egen granskning (ögon, inte grind) | 1 härlett tal i bokstäver + 3 obelagda formuleringar → alla borttagna |
| Bildgranskning | 50 bilder, **noll tyska grafiker** |
| Färgmätning | 10 mätta, 4 etiketter motbevisade, 1 gränsfall avgjort med ögon |
| Checksumma efter skrivning | **8/8 identiska** mot filerna |
| Alt-texter | **40 skrivna**, 0 tomma, 0 tyska, 5 unika per produkt |
| SKU:er | 8 delade TVÅ SKU:er → 8 unika skrivna, priser orörda |
| Stämpling | **2 gröna** (mina A2). De sex A1 lämnades till den andra sessionen |
| Live-grind | **2/2 REN**, 0 orddiffar (bara A2 — A1 bär inte min text) |

