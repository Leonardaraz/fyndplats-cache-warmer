# Uppblåsbart campingtält med kaminhål — rättat efter tillverkarens manual

Leonard bad 2026-09-28 att produkten skulle stämma helt mot tillverkarens
bruksanvisning (modell ZJXYCQZ-9M, storleken 3 × 3 m). Det är en AliExpress-sida med
tre storlekar. Skrivworkflowen klarar bara sidor med en variant (`stegSku` och
`stegVerifiera` kräver exakt en), så skrivningen gick direkt mot Wix med
kontrollsumman i samma anrop, som före 2026-09-24.

| id | namn | slug | pris | saldo |
|---|---|---|---:|---:|
| `9a911ab5` | Uppblåsbart campingtält – lufttält med pump och kaminhål, 3 × 2 till 4 × 3 m | `uppblasbart-campingtalt` (oförändrad) | 3 699 / 4 899 / 5 339 kr | 13 / 4 / 17 |

Kategorierna Sport & Fritid och Friluftsliv & Resa ligger kvar. SKU:erna är oförändrade.
Inget produktsäkerhetsavsnitt, eftersom produkten kommer från AliExpress.

## Källorna

Allt står i `kallor.json`:

- **Bruksanvisningen** (3 × 3 m): delar (pump, 20 tältpinnar, lagningssats,
  förvaringsväska), montering, lufttrycket 5–7 psi, nedpackningen och säkerhetsreglerna.
- **Tillverkarens produktsidor för de tre storlekarna** (3–5, 4–6 och 5–8 personer):
  - mått, takhöjd, vikt, dörrar och fönster;
  - kaminhålet på Ø 10 cm och pumpen på 1500 cc;
  - AC-porten, som bara finns i 3 × 3 m.
- **Golvet i alla tre storlekar** (kontrollerat 2026-09-28, när en kund frågade om golvet
  sitter fast). Tillverkaren har själv svarat i frågor och svar på sina egna sidor:
  - 3 × 3 m: "The tent has a fixed floor that cannot be removed."
    ([vevor.com](https://www.vevor.com/yurt-tent-c_10246/inflatable-tent-for-camping-4-6-person-glamping-tent-with-pump-easy-set-up-p_010642133135))
  - 4 × 3 m: "The groundsheet is sewn in."
    ([vevor.co.uk](https://www.vevor.co.uk/yurt-tent-c_10246/vevor-inflatable-tent-for-camping-5-8-person-glamping-tent-with-pump-easy-set-up-p_010324590712)),
    och "It comes with a floor, but it is not removable" på samma sida hos vevor.com.au.
  - 3 × 2 m: inget svar från tillverkaren. Huvudbilden visar tröskeln vid dörren, förpackningen
    har inget löst golv, och en verifierad kundrecension för den storleken skriver att
    hörnbalkarna sitter fast i tältgolvet med kardborre.
  - Kunder skriver att golvet är tunt (en fick lite fukt igenom) och rekommenderar en
    presenning under tältet. Det står inte i texten, eftersom tillverkaren inte säger det.
- **Bilderna.** Huvudbilden visar storleken 3 × 2 m med skärmtak, 18 pinnar och 6 linor.
  Dörrens tröskel visar att golvet sitter fast.

## Det som var fel på sidan

- **"3–5 personer"** stod i namnet, SEO-titeln och på ett kort. Det gäller bara den minsta
  storleken, och tillverkaren anger 3–5, 4–6 och 5–8 personer. Namnet anger nu golvytan.
- **"2 fönster"** gäller bara 3 × 2 m. De två större storlekarna har fyra.
- **"Eluttag"** var fel: det är en AC-port, en öppning för slangen till en portabel
  luftkonditionering, och den finns bara i 3 × 3 m.
- **Kaminhålet beskrevs för vintereldning** ("värma tältet vintertid", "camping året runt").
  Bruksanvisningen tillåter ingen öppen eld i eller nära tältet och ingen påfyllning av
  kaminer, värmare eller lyktor inne i tältet. Texten beskriver nu hålet som en genomföring
  för rökrör och återger reglerna. Kaminhålet togs först bort ur namnet och SEO-titeln,
  men är tillbaka sedan revision 20 (se *Kaminhålet tillbaka i namnet*).
- **"15 psi" på ett kort.** Tältet ska pumpas till 5–7 psi, och pumpen är märkt 29 psi.
- **Påståenden utan källa är borta:** "vattentät", "reflekterande linor", "SBS-blixtlås"
  och "lampkrokar".
- **Storlekskorten** bar fotnoten "Mått och vikter enligt leverantören", och antalet
  tältpinnar och linor för 3 × 2 och 4 × 3 m saknade källa.
- **Texten hade ett kyrilliskt tecken** (städningen 2026-09-27). Den är nyskriven.

## Bilderna

Galleriet gick från 8 till 6 bilder (`bilder-fore.tsv`, `bilder-fore-bort.tsv`, `galleri.tsv`):

- **Behållna:** plats 1 och 2, huvudbilden och fotot med pumpen.
- **Ersatta med nya kort:** miljökortet och de tre storlekskorten.
- **Strukna:** spec-kortet och egenskapskortet.

Storleksvalen pekar på de nya storlekskorten. Korten byggs ur `kortrader.tsv` med
`bygg-kortrader.py`, som grindar texten först med `gatelib`. `bygg-kort.py` gör bara ett
kort per produkt. Filerna är nedladdade från wixstatic och md5-kontrollerade mot rundans
kopior (`uppladdning.tsv`).

Huvudbilden bär märket på bärväskan och taket. Märket är tryckt på varan, så bilden behålls
enligt de fasta reglerna, och märket skrivs aldrig i texten.

## Grindarna

Allt är rent utom tre vikter: 12,3, 17,3 och 18,5 kg är tillverkarens 12.30, 17.30 och
18.47 kg avrundade till en decimal. Siffergrinden jämför strängar och fäller dem i
`gate.py` och `gate-alt.py`. De är kvitterade i `grind-undantag.txt` och `avrundat.tsv`.

## Skrivningen

1. **Text, namn och SEO** gick igenom i första anropet.
2. **Galleriet avvisades** i samma anrop med `404 PRODUCT_MEDIA_NOT_EXIST`, "Products must
   include media files linked to choices". Wix vägrar en bildlista som tappar en bild som
   ett val pekar på.
3. **Andra anropet** skickade media, options med nya `linkedMedia`, `variantsInfo` ordagrant
   och `visible` i en och samma PATCH, vilket gav revision 19.

Varianternas id, SKU, pris och synlighet är oförändrade, liksom lagret (13, 4 och 17).
`variantsInfo.variants[].media` pekar nu på huvudbilden för alla tre storlekar. Fältet är
en skrivskyddad ögonblicksbild, och det är valens `linkedMedia` som byter bild på sidan.

Den separata återläsningen stämde på allt:

- textens hash (`vantat-hash.tsv`);
- namnet och SEO (två taggar, inga nyckelord);
- bilderna, alt-texterna och valens kort.

## Kaminhålet tillbaka i namnet (revision 20)

Leonard ville ha tillbaka det som togs bort ur titlarna. Före rundan hette produkten
"Uppblåsbart campingtält 3–5 personer – lufttält med pump och kaminhål".

- **Kaminhålet är tillbaka** i namnet, SEO-titeln och metabeskrivningen (`namn.tsv`,
  `seo.tsv`). Det är ett ord som kunder söker på, och det stämmer för alla tre storlekar.
- **"3–5 personer" är inte tillbaka.** Det gäller bara 3 × 2 m. Tillverkaren anger 4–6
  personer för 3 × 3 m och 5–8 för 4 × 3 m.

Skrivningen gällde bara `name` och `seoData`, med kontrollsumman i samma anrop. Den
separata återläsningen visade:

- namnet och SEO-titeln som i filerna;
- två SEO-taggar och inga nyckelord;
- texten, bilderna, valens kort och varianterna (SKU, pris, synlighet) oförändrade.

Namnet är 76 tecken och SEO-titeln 57, och `gate-seo.py` är ren.

## Nästa session bör veta

- **Variantnamnen `3x2.1m`, `3x3.1m` och `4x3.1m` säger 2,1 och 3,1 m** där tillverkaren
  säger 3 × 2, 3 × 3 och 4 × 3 m. De rättas inte, av två skäl:
  - Ett namn går bara att byta genom att bygga om optionen, och då får varianterna nya id.
  - Ingen rutt kan i dag peka om mappningens `wixVariantId`: allowlistan i
    `/api/admin/mapping` tar bara `needsAiPolish`, `draftStatus` och SKU.
- **Priserna i Wix var 4 129 / 5 459 / 5 969 kr tidigare samma morgon och 3 699 / 4 899 /
  5 339 kr vid skrivningen.** Något annat ändrade dem, och priset rördes inte.
- **Alla bilder visar 3 × 2 m med skärmtak.** Tillverkaren har två modeller i den storleken,
  med och utan skärmtak, och vi ser inte vilken leverantören skickar. Texten nämner inget
  skärmtak, men fotot gör det.
- **Lagningssatsen står bara för 3 × 3 m,** eftersom bruksanvisningen gäller den storleken.
  Paketet för 3 × 2 m är belagt av huvudbilden. För 4 × 3 m är pumpen och väskan belagda av
  tillverkarens produktsida, men inte pinnarna och linorna.
