#### En bild per kombination: revisionen av alla sidor med två val (Leonard 2026-10-23, 13:12 svensk tid)

Leonards skärmbilder av bokhyllan `79ab08fe` (och Wix-panelen): den lilla och den stora hyllan syntes under båda höjderna och båda färgerna. *"gör audit för att lösa det här problemet"*. Underlaget och lösningen står i
`tools/polish-assets/tva-axlar-revision-2026-10-23/` (README, `sidor.tsv`, `klass.tsv`, `givare.tsv`).

Av 49 publicerade sidor med två val visar **16 bilder av fel storlek eller färg tydligt** (bokhyllan, katt- och hundtrappan, hindersetet, verktygslådan, förvaringsmöbeln, hamsterburen, väggspegeln, sensorsoptunnan, skrivbordet `3b868848`,
tre hundgrindar, två hundbäddar och vedboden), 14 där storlekarna ser likadana ut på fotona och 17 som är rätt (13 klädsidor och 4 där varje färg bara finns i en storlek).

☠️ **Orsaken är två, och ingen av dem går att laga med länkar.** Butiken ger varje bild EN ägare, det första val som kopplar den, och visar den under alla val i den andra optionen. Och sammanslagningen och färgbildsverktyget kopplar
givarens bilder till färgen eller storleken, aldrig båda, så varje ny storlek i en befintlig färg hamnar under den gamla. Rättningarna i natt (ägarlistor och kort per storlek, se ovan) kunde bara flytta bilder mellan ägare.

Lösningen, i ordning:

1. **Butiken** (`butik-kopplingar.patch`, PR #770 mot `headless-site` med Leonards ja 2026-10-23, mergas natten till 2026-10-24): en bild syns när den, i varje option som kopplar den, är kopplad till det valda valet; inom en option räcker ett av valen. Kombinationens
   första bild är bilden som passar kombinationen och är kopplad i flest optioner. Ingen publicerad sida har i dag en bild kopplad till två optioner (0 av 5 116), så tvåaxliga sidor ser ut som förut tills de länkas om. På 30 sidor med
   ett val, där en bild är kopplad till flera val, syns bilden under alla de valen i stället för bara under det första. Projektordukens storleksbilder börjar synas (etiketten "85 tum (216 cm)" mot väljarens "85 tum").
2. **Länka om** FEL-sidorna en i taget, varje bild till sin färg OCH sin storlek, med visuell kontroll och givaren som facit. ☠️ Inte före butiksändringen: med en ägare per bild visar en dubbelkopplad bild under alla färger i storleken.
3. **Fyll** kombinationer som hamnar under fyra bilder ur kombinationens egen artikel (vit bokhylla 136 cm har bara packshoten och kortet).
4. **Motorn:** varukorgens bild per variant (Wix tar alltid färgens första bild) och sammanslagningen kopplar en ny storlek i en befintlig färg till båda.

✅ **Status 2026-10-24:** steg 1 mergades 00:33 UTC (butikens produktionsbygge READY 00:38) och steg 2 är gjort för 17 av de 18 sidorna (hamsterburen hålls), se *Efter butiksmergen* nedan. Steg 3 väntar på Cowork-raderna för de 16 kombinationer som fortfarande visar färre än fyra bilder, och steg 4 (motorn) är inte påbörjat.

☠️ **En givare är en kombination, och dess pris avgör vilken.** En dold givare är en Aosom-artikel med variantens pris, så `givare.tsv` ger bildens storlek utan att någon räknar steg. Hunden på den vita kattrappan (`acf527`)
räknades först som tre steg; bilden kommer från fyrstegsartikeln och har fyra steg i förstoring.

**Verktygen för steg 2 (2026-10-23).** `bygg-agare.py` tar en lista som ägare (`["Vit", "136 cm"]` är en bild av den vita hyllan på 136 cm), och flera val i samma option betyder "något av dem" (`["Svart", "50 × 70 cm", "60 × 90 cm"]`). Torrkörningen svarar med
`kombinationer`: butikens vy per variant med den nya regeln, kombinationens första bild och Wix variantbild efter en namn-skrivning med färgen först (`varukorg`, `varukorgPassar`). `kolla-agare.py` och
`katalogkontroll-tva-axlar-bilder.py` läser sidans `imageKopplingar` när butiksändringen är ute och räknar vyn som butiken; saknas fältet gäller den gamla regeln, och en lista i planen räknas då som en avvikelse.
Planerna för bokhyllan (`agare-79ab08fe.json`) och projektorduken (`agare-926ec7a2.json`) ligger i revisionsmappen. De är torrkörda mot Wix och mot butiksändringens egen kod, med samma vyer och samma första bild
på alla sju kombinationerna:

| sida | kombination | bilder | första bild | varukorgen (färgens första) |
| :-- | :-- | --: | :-- | :-- |
| bokhyllan | brun × 109 cm | 5 | brun 109-packshot | rätt |
| | brun × 136 cm | 4 | brun 136-packshot | brun 109-packshot, som i dag |
| | vit × 109 cm | 5 | vit 109-packshot | rätt |
| | vit × 136 cm | **2** | vit 136-packshot | vit 109-packshot, som i dag |
| projektorduken | vit × 85 tum | 8 | 85-packshot | rätt |
| | svart × 99 tum | 5 | svart packshot | rätt (de två vita närbilderna syns inte längre här) |
| | vit × 99 tum | 9 | vit 99-packshot | rätt |

☠️ **Bokhyllans Storlek står före Färg.** Med den gamla butiken ägs en dubbelkopplad bild av storleken och visas under båda färgerna, så planen skrivs först när butiksändringen är ute och sidan bär
`imageKopplingar` (`kolla-agare.py` skriver vilket). Bokhyllans plan skriver bara Storlek (109 cm: 1 → 7 länkar, 136 cm: 1 → 3); färgernas listor är redan rätt. Vit × 136 cm får två bilder och fylls i steg 3.
⚠️ Varukorgens bild är färgens första bild för alla storlekar så länge varianterna skrivs med färgen först. Med två färger och två storlekar går det att ge varje variant sin egen bild (två varianter med
färgen först, två med storleken först), men nattens `variantbild` skriver om alla med färgen först. Det kräver motorändringen i steg 4.

☠️ **Spärren sitter i verktyget.** En plan med flera ägare på en bild byggs inte skarpt förrän butikens sida bär `imageKopplingar`: `bygg-agare.py` hämtar planens `slug` och vägrar annars, och
`lank-om-bilder.js` länkar en bild från ett val till i samma option bara när `bygg-agare.py` slår på `FLERA_I_OPTION`. Prövad åt tre håll: utan slug, mot dagens butik och mot en sida som bär fältet.
Spärren gäller NYA länkar: en dubbelkoppling som redan finns får stå kvar eller minska (2026-10-23, prövat åt båda hållen i en torrkörning).

**Före mergen: trädgårdspallen och parkbänken (2026-10-23 13:52 UTC, Leonards ja).** Två av de 30 sidorna med ett val hade en bild kopplad till ett val den inte hör till, och den nya regeln
hade visat den där. Pallen `d886ce9e`: miljöfotot med den gröna pallen är borta från Blå, och korten står kvar på båda färgerna. Bänken `e4aec6ef`: fotot på rosenbänken hör till 40 tum enligt
måttbilderna (46 tum har rutmönstrat ryggstöd och 50 tum svängt) och är länkat bara dit; förut låg det på alla sex modeller och var varukorgens bild för dem alla, även träbänkarna. Båda lästes
tillbaka utan avvikelse, och `variantbild.yml` rättade varukorgens bild. De andra 28 sidorna visar bilden rätt under varje val som länkar den (`delade-lankar.tsv`), så de 15 AliExpress-sidor som väntade
på `avlank-delade.js` (lärdom 163) löses av själva mergen.

**Planerna för alla 16 sidor med fel (2026-10-23, eftermiddag).** `agare-<id8>.json` i revisionsmappen finns för de 16 FEL-sidorna, projektorduken och matstationen, och bär `slug`. De är torrkörda mot Wix
(18 av 18: varje bild hittades och ingenting skrevs) och korskörda genom butiksändringens egen kod: samma bilder och samma första bild i alla 81 kombinationer. `ordning` (nytt fält) lägger packshoten för varje
storlek först i färgens lista, eftersom kombinationens första bild är den första bilden i färgens lista som passar och är kopplad i flest optioner. Tre saker som planerna inte löser:

- ☠️ **Fem kombinationer i lager har inget eget foto:** skrivbordet `3b868848` Vit × 63 cm (110 st; de vita fotona är 80 cm-bordet, mätt sida vid sida i samma scen), spegeln `c438d4ba` Guld × 50 × 110 cm (35),
  järngrinden `233c83cf` Vit × 74–87 (60), Vit × 74–80 (52) och Svart × 74–80 (29). De visar sin färgs foton från de andra storlekarna, som i dag, i stället för ett enda kort. Ett eget foto per
  kombination kräver Cowork-rader eller ett verktyg som hämtar feedens bilder per variant (`aosom-fargtillagg` tar färgens första artikel).
- **Varukorgens bild är färgens första bild för alla storlekar:** 32 av de 81 kombinationerna får en bild av en annan storlek i varukorgen, som i dag. Hamsterburen `13fe619f` blir sämre på en punkt:
  Mörkgrå × 85 × 45 visar i dag sin egen bur i varukorgen (Mörkgrå har inga länkar, så Wix tar storlekens första bild), och efter planen 100-burens packshot.
- **Kombinationer under fyra bilder** med egna foton (dörrgrindarna, hundbäddarna, kattrappan i tre steg, verktygslådan med fyra röda lådor) visar färre bilder än i dag, men bara rätt bilder. De fylls i steg 3.
