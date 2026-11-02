### Miljöbilden ska vara andra bilden (2026-10-01)

Leonard: feedens position 2 är (nästan) alltid ett rent miljöfoto, och den ska vara
andra bilden på varje publicerad Aosom-sida. På en sammanslagen sida ska varje färg ha
sin egen artikels miljöbild, länkad till färgen och som andra bild i det butiken visar
för färgen (galleriets ordning, filtrerad som `synligaBilder` i butikens
`lib/variant-bilder.ts`, med valets första bild först).

Workflowen **"Bilder — miljöbilden (feedens position 2) som andra bild på varje
Aosom-sida"** → `/api/admin/aosom-livsbild` → `lib/aosom/livsbild.ts` har fyra lägen:
`rapport` (status per sida eller färg), `kandidater` (laddar upp position 2 för
granskning), `plan` och `skriv`. En flytt (`<wix-id>[:<val-id>]:flytta`) behöver ingen
granskning; en infogning (`<wix-id>[:<val-id>]:<fil-id>`) tar bara en kandidat som en
människa godkänt.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **`saknas` betyder att varje galleribild är spårad** till sin källa
   (`aosomBildFiler`, annars Wix `sourceUrl`). Går någon inte att spåra blir det
   `okand`, så att miljöbilden inte läggs dit två gånger.
2. ☠️ **Huvudbilden och färgens första bild rörs aldrig**, och ingen bild faller ur
   galleriet. En sida där miljöbilden är huvudbild (`ar_huvudbild`) lämnas.
3. ☠️ **Skrivningen går stegvis som färgbilderna** (galleriet ensamt, sedan länkarna
   med options + variantsInfo ordagrant och `visible`, sedan återläsning), kräver
   planens sha och stannar vid första sida som inte läser tillbaka.
4. ☠️ **Svaret bär bara Wix egna id och adresser.** Godkända kandidater måste skrivas
   inom karenstiden, tre dygn efter att bildstädningen (03:50 UTC) först såg dem
   oanvända.

⚠️ **Feedens position 2 är inte alltid ett miljöfoto** (2026-10-19). På
barnnattduksbordet `2c63cfbc` och barnskrivborden `426d88ab` och `2d92a681` är den
ett amatörfoto från lagret med smutsigt golv, och nattduksbordet står upp och ned.
På skrivborden är position 3 samma sorts foto, och position 10 på alla tre.
Leonard: amatörfotona ska bort helt. De är borttagna och ersatta med utsnitt ur
leverantörens collage (`tools/polish-assets/runda-bilder-barn-utsnitt/`), så `plan`
svarar inte längre `har_som_tva` för de tre sidorna. Lägg inte tillbaka position 2.
Fotona är liggande bilder inramade med vita band upptill och nedtill, och det
syns bara på bilden.

Samma dag svepte `tools/polish-gates/lagerfoto-svep.py` hela katalogen efter den
formen: ett foto inramat med vita band, som går kant i kant. Underlaget är butikens
Google-flöde (4 944 sidor, 28 162 bilder) och en miniatyr per bild. Kollen fällde alla
fem kända lagerfoton och ingen av de nio andra bilderna på barnmöblerna. Av 110
inramade bilder i katalogen var tolv lagerfoton, och resten var stående miljöbilder,
renderingar och kort. Se därför varje träff med ögonen.

Andrabilden var ett lagerfoto på fem sidor till: barn-UTV:n `0f94d65c`, wigglebilen
`98672b0d` och gokartarna `39a377f6` (rosa), `08bdee9f` (röd) och `ea640f31` (vit).
Fotot flyttades först sist (`runda-bilder-lagerfoto-sist`). Leonard ville sedan ha
lagerfotona borta och ersatta med proffsiga bilder, som på barnmöblerna. Lägg inte
tillbaka dem, och kör inte livsbildens `flytta` på sidorna.

- UTV:n och wigglebilen fick ett utsnitt ur leverantörens måttbild. Den tyska
  texten, den infällda sitsbilden och pojken ligger utanför, och måtten i bilden är
  samma som sidans (`runda-bilder-lagerfoto-ersatt`).
- Springcykeln `115d3831` hade två lagerfoton (plats 5 och 6). Båda är borta, och
  sidan fick ett utsnitt ur en miljöbild.
- Väggvärmaren `d05fd29f` hade lagerfotot på plats 4 och inga rena leverantörsbilder
  kvar. Den enda miljöbilden med värmaren har tysk text över varans överkant. Fotot
  är ersatt med ett eget spec-kort byggt ur sidans spec-tabell
  (`runda-bilder-vaggvarmare-kort`).
- Den vita Vespa-scootern `69042231` är en sammanslagen sida i tre färger. Fotot var
  länkat till Vit och är borttaget med `bilder-bort.yml`. Bildkandidaterna vägrar en
  sida med flera artiklar (`flera_artiklar`), så ingen ersättning hämtades.
- Gokartarnas artikel saknades i flödet 2026-10-19 till 2026-10-22, och av importens
  filer fanns bara lagerfotona kvar i Wix. Lagerfotona är ersatta med ett eget
  detaljkort per färg (`runda-bilder-gokart-kort`): ratten, sitsen med bältet,
  bakhjulet Ø 28 cm och framhjulet Ø 22 cm, utsnitt ur sidans egen huvudbild.
  Kortet byggs med `bygg-kort.py`, som sedan dess läser `paneler.tsv`. Den vita har
  tre bilder och de andra två fyra. Kör `aosom-bildkandidater` med positionerna 3–10
  när artikeln är tillbaka, för fler riktiga foton.

☠️ **Kollen ser bara inramade foton.** Springcykelns andra foto (6:5) och Vespans
(4:3) var inte inramade. De hittades först när alla 671 bilder i katalogen som inte
är kvadratiska granskades med ögonen.
