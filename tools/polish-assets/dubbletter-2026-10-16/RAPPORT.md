# Publicerade dubbletter och färgsyskon — genomgång 2026-10-16

Underlag: en sökning över hela den publicerade katalogen (text, mått och måttsymboler per sida) mot alla sidor jag publicerat i rundorna N181–N249 och T33–T49, följt av en bildjämförelse av varje träffpar (samma foto på bitnivå och på färgnivå, sedan ögon på kontaktark). Ingenting har dolts, ändrats eller omdirigerats av den här genomgången.

- **32 par är exakta dubbletter:** samma vara i samma färg på två publicerade sidor.
- **39 par är färgsyskon:** samma vara i olika färg (eller utförande) på två sidor.
- **70 par granskades och är olika varor** (delar bara mått eller ord). De behöver ingen åtgärd.

## Varför de finns

Min lokala dubblettkoll jämförde varje ny sida bara med sidor jag hade i en lokal cache (rundornas texter och ett register). De äldre sidorna från juni–augusti fanns inte där, så en ny sida för samma vara såg ut att vara ny. Åtgärden i arbetsgången är gjord: före varje ny runda körs nu hela katalogsökningen (`tools/polish-gates/dubblettsvep-bevis.js`) på kandidaterna, och mappningsraden läses (en pensionerad dubblett har tomt artikelnummer och avvisad status). Kandidater med stark träff publiceras inte; färgsyskon går till en T-runda.

## Vad som behövs för att rätta dem

- **Färgsyskon (B):** finns verktyg. En T-runda lägger den ena sidan som färg på den andra, kopierar omdömena, skriver 301 från den gamla adressen och döljer den lagda sidan. Leonards regel från 2026-09-27 (samma vara i flera färger = en sida med färgval) gäller redan.
- **Exakta dubbletter (A):** inget verktyg. Polerings-skrivningen sätter alltid `visible: true`, ommappningen vägrar en polerad dubblett (`dubbletten_inte_utkast`), och en omdirigeringsrad verkar bara på en adress som svarar 404, alltså först när sidan är dold. Det behövs en liten rutt som döljer en sida och skriver 301 i samma körning (torrt som default, id-lista som kvittens, återläsning efter skrivningen). Se `FLAGGADE.md`, *Publicerad dubblett utan verktyg*.

**Vilken sida som behålls** (förslag): den med flest omdömen, vid lika den som skapades först. Den andra döljs och får 301 till den behållna. Där båda har omdömen kopieras den döljda sidans omdömen över.

## Tillägg: fem av sidorna är pensionerade utkast

Efter den första versionen visade en kontroll av rundornas sidor mot motorns GPSR-rutt och mappningen att fem av de publicerade sidorna är utkast som redan var pensionerade som dubbletter. De saknar artikelnummer i mappningen (kontrollerat med det krypterade leverantörslänkverktyget), Aosom-synken har inte rört dem sedan 2026-08-31 respektive 2026-10-06, 2026-10-10 och 2026-10-11, så saldot är gammalt, och fliken Produktsäkerhet saknar tillverkare och ansvarig i EU. Ingen order finns på någon av dem.

| Pensionerad och publicerad | Dubblett av (behålls) |
|---|---|
| `781c2837` (N210) | `0d09a845` |
| `aa926303` (N204) | `6ae821eb` |
| `989dbf87` (N248) | `479f7291` |
| `fefd7223` (N213) | `f9c6992d` |
| `f65d68e2` (N214) | `2c1d652d` |

De tre första ligger redan i tabellerna nedan. De två sista, hexhantlarna, missades av sökningen och är tillagda i `par.tsv` (klass `DUP`), vilket gör 34 exakta dubbletter. Se `tools/polish-gates/FLAGGADE.md`, Lärdomar N181–N258 (2).

## A. Exakta dubbletter

| Behåll | Pris | Omd. | Dölj + 301 | Pris | Omd. |
|---|--:|--:|---|--:|--:|
| `0562a1a2` Miniväxthus med fyra hyllplan och plastöverdrag – 69 × 50 × 165 cm | 499 kr | 4 | `807231e0` Litet växthus med 4 hyllor, rullhjul och dragkedja | 699 kr | 0 |
| `0cf208aa` Benmaskin för benspark och bencurl – 32 startlägen, tar 60 kg skivor | 3659 kr | 0 | `fe84e88c` Benträningsmaskin med 32 startlägen för benspark och bencurl | 3479 kr | 0 |
| `0d09a845` Hopfällbar knäpall – vänds till sittpall, verktygsväska ingår | 499 kr | 5 | `781c2837` Knäbänk och trädgårdspall 2-i-1, hopfällbar, med verktygsficka och … | 499 kr | 0 |
| `0f77925e` Hängstol för två i PE-rattan med stativ och dynor – 170 × 100 × 185 cm | 4179 kr | 4 | `1837f27b` Hängfåtölj för två i konstrotting med solskydd, hopfällbar – 170 × … | 4519 kr | 3 |
| `1397a340` Byrå med tyglådor – 3 hopfällbara lådor, öppen hylla och avlastning… | 1269 kr | 0 | `2fe9b265` Förvaringsskåp med tre tyglådor och två hyllor, rustikbrunt, 44 × 2… | 659 kr | 0 |
| `23940121` LED-spegel för badrum 50 × 70 cm – raka hörn, touchknapp och IP44 | 939 kr | 1 | `3a31f4cc` LED-badrumsspegel 50 × 70 cm med antiimma, tre ljusfärger och minne… | 999 kr | 0 |
| `329184c4` Fotbollsmål 300 × 200 cm med nät och 7 markpinnar | 1699 kr | 0 | `f095ca87` Fotbollsmål 300 × 120 × 200 cm med skumskydd och PVC-klädda stolpar | 1849 kr | 0 |
| `479f7291` Elbil barn SUV 12V – svart åkbil med fjärrkontroll, MP3 och bälte, … | 2419 kr | 12 | `989dbf87` Elbil i SUV-modell för barn 3–6 år med fjärrkontroll, säkerhetsbält… | 2169 kr | 0 |
| `570bd52c` Campingbord med förvaringskorg 93 cm – hoprullbar skiva och bärväska | 1119 kr | 0 | `d38f7805` Hopfällbart picknickbord i aluminium med rullskiva och nät – 93 × 5… | 799 kr | 0 |
| `654961bd` Hundgrind 300 cm med 5 paneler – vikbar till hage, självstängande dörr | 1589 kr | 0 | `476aab20` Hundgrind och valphage i ett – 300 cm bred, fem paneler, svart stål | 1059 kr | 0 |
| `67eecc74` Loungeset 4 delar i HDPE – soffa, två fåtöljer och bord | 5699 kr | 0 | `6e96e32e` Loungegrupp i HDPE med träoptik – tvåsitssoffa, två fåtöljer och so… | 2199 kr | 0 |
| `76e7ac68` Campingsäng med tält 193 cm – dubbelbrits, luftmadrass och pump ingår | 3099 kr | 0 | `ea7ac3f5` Fältsäng med tält och luftmadrass för två – campingset med fotpump … | 2519 kr | 0 |
| `77143464` Loungeset 4 delar med dynor – L-form 247 cm, flyttbara moduler | 12859 kr | 0 | `621e63e8` Hörnsoffgrupp för trädgården – två tvåsitssoffor, enkelsits och bor… | 4669 kr | 0 |
| `7ca63a31` Lekmatta baby 150 × 180 cm – vändbar, vattentät och hopfällbar | 599 kr | 0 | `e0cead19` Babylekmatta 176,5 × 148 cm med bokstäver och djur – dubbelsidig, h… | 529 kr | 0 |
| `7f304255` Matbord för 6–8 personer, utdragbart 140–180 cm – ben i svart stål | 2429 kr | 0 | `04f05fad` Utdragbart matbord 140–180 × 80 cm för sex till åtta personer, svar… | 2539 kr | 0 |
| `81f85c3f` Spelbord 3 i 1 – biljard, airhockey och fotbollsspel, 102,5 cm | 1839 kr | 0 | `c90227ec` Vridbart 3-i-1-spelbord med biljard, luftishockey och bordsfotboll … | 2159 kr | 0 |
| `8b2555a5` Reservöverdrag tunnelväxthus 6×3×2 m – PE-duk med 12 fönster, stomm… | 1399 kr | 1 | `d17733fd` Ersättningsduk till tunnelväxthus 600 × 300 × 200 cm, tolv fönster … | 959 kr | 0 |
| `9412d8eb` Skärmhöjare för två skärmar – justerbar 80–117 cm med tre förvaring… | 579 kr | 4 | `ba919174` Skärmstöd i svart för två skärmar – bredd 80–117 cm, bär 15 kg | 459 kr | 0 |
| `a5f552e2` Sängbord med laddstation 2-pack – 2 eluttag, USB-A och USB-C | 999 kr | 0 | `e6315714` Smala nattduksbord i vitt, set om två, med laddstation och dolt skåp | 879 kr | 0 |
| `b18ec555` Golvlampa med hyllor 156 cm – två skärmar, svart | 1239 kr | 3 | `24c2d1e6` Golvlampa med två hyllor, mönstrad skärm och kedjebrytare, 156 cm | 739 kr | 0 |
| `b250bfcf` Rullvagn bambu 3 hyllplan – smal förvaringsvagn 55x20x75 cm med hjul | 499 kr | 0 | `451cbfa5` Serveringsvagn i bambu med tre hyllor och fyra hjul – 55 × 20 × 75 cm | 579 kr | 0 |
| `b50a2c94` Skärmtak 110 × 60 cm i polykarbonat — två väggkonsoler, ingen stolpe | 649 kr | 0 | `2c75317b` Entrétak i polykarbonat med gråa fästen – 110 × 60 cm, går att komb… | 699 kr | 0 |
| `bb919be8` Golvlampa med bord – modern golvlampa med 2 runda avlastningsbord, … | 1499 kr | 2 | `d8b45bf1` Golvlampa med två runda hyllor i bambu och vit tygskärm – 162 cm hög | 979 kr | 0 |
| `d3d1d2ae` 3-sitssoffa i manchester 202 cm – 65 cm djup sits, beige | 6259 kr | 0 | `8f8b67f6` 3-sitssoffa i beige manchester med breda armstöd – 202 × 90 × 76 cm | 5199 kr | 0 |
| `dcd122c9` Reservhölje till växthus – växthusöverdrag i PE (utan stomme) | 499 kr | 0 | `a108a5d4` Ersättningsöverdrag till växthus – vit plast, 140 × 143 × 190 cm | 529 kr | 0 |
| `de3f65ff` Hantelset i bärväska – tre par färgkodade hexagonhantlar på 1, 2 oc… | 599 kr | 2 | `6fe35798` Hantelset med sex hexagonhantlar i bärkoffert – tre par på 1, 1,5 o… | 499 kr | 0 |
| `ed342378` Odlingslåda i metall 240 × 60 cm – galvaniserat stål med öppen botten | 999 kr | 0 | `282ddb69` Odlingslåda i mörkgrått stål utan botten, 240 × 60 × 30 cm | 899 kr | 0 |
| `f6ab1dd4` Agilityset med tunnel för hund – slalom, hinder och startfält, blåt… | 799 kr | 5 | `bfa9f520` Agilityset för hund med tunnel, slalom, hopphinder och startfält, b… | 899 kr | 0 |
| `f6da9a00` Barnsäng 70 × 140 cm i rosa och vitt med moln på huvudgaveln och lå… | 1019 kr | 0 | `77460b11` Barnsäng 140x70 med molngavel – 17 cm hög ram, för 3–6 år | 1449 kr | 0 |
| `f8efe733` Uppresningsfåtölj med pocketfjädrar – liggläge till 150° och två si… | 4599 kr | 2 | `142b3ad9` Uppresningsfåtölj i blågrå sammet med fjärrkontroll och liggläge ti… | 5149 kr | 0 |
| `fd90d931` Växthus 244 × 180 cm med hyllställ – 18 hyllplan och ståhöjd | 1859 kr | 5 | `95ef0ac5` Växthus av plastfolie med hyllor på båda sidor – 244 × 180 × 210 cm | 1249 kr | 0 |
| `ffb9505c` Industriellt konsolbord med 2 lådor och hylla – brun, 100 cm | 1799 kr | 0 | `ba2a1ab2` Konsolbord i industristil med två lådor, öppen hylla och metallstomme | 869 kr | 0 |

## B. Färgsyskon

| Värd (behålls) | Pris | Omd. | Läggs som färg | Pris | Omd. |
|---|--:|--:|---|--:|--:|
| `08b40e95` Golvlampa med fjärrkontroll och fotströmbrytare – höjd 133–168 cm, … | 1099 kr | 1 | `8549cda0` Golvlampa med fjärrkontroll och tygskärm, höjdjusterbar 133–168 cm | 1119 kr | 0 |
| `17470e43` Tvättkorg i bambu med lock – 100 L, 2 fack, tvättsorterare | 629 kr | 1 | `1fb02371` Oval tvättkorg i bambu med två fack och lock – 100 liter, 62,5 × 37… | 449 kr | 0 |
| `1fd11824` Bäddfåtölj i manchester utan armstöd — bädd 193 × 82 cm, tre ryggvi… | 3399 kr | 7 | `c424b8c0` Bäddfåtölj i mörkgrön manchesterlook med ryggstöd i tre lägen | 3899 kr | 0 |
| `2071f140` Tomatväxthus 400 × 120 × 170 cm – välvt tak med vattentät duk och j… | 669 kr | 4 | `5b2164f3` Tomatväxthus med välvt tak och öppna sidor – 400 × 120 × 170 cm | 769 kr | 0 |
| `343a913e` Odlingslåda med tre nivåer och spaljé för klätterväxter – 95 × 95 ×… | 719 kr | 4 | `a564244b` Odlingslåda med spaljé – 3 plan i granträ för grönsaker, brun | 1169 kr | 0 |
| `364bc564` Trädgårdsskåp 160 cm med lamelldörrar – tre fack och 20 kg per fack | 2529 kr | 2 | `28e8ba14` Trädgårdsskåp i granträ med lamelldörrar och tre hyllor – 87 × 46,5… | 2329 kr | 0 |
| `38c00989` Väggklösträd 4 delar – plattformar, stege och korg | 1199 kr | 0 | `44663e99` Klättervägg för katt i fyra delar – beige, med klösställ, hängmatta… | 839 kr | 0 |
| `394de213` Barbord med hylla och två pallar 80 cm – vit ram, skiva i ekoptik | 1049 kr | 3 | `3393a208` Barset med bord, två barpallar och hylla – 80 × 50 × 90 cm | 899 kr | 0 |
| `4791575c` Barnfåtölj med fällbart ryggstöd – blå, fälls ut till 90 cm, bär 65 kg | 1199 kr | 4 | `87b86ba8` Barnfåtölj i rosa konstläder med lutande ryggstöd och fotstöd för b… | 1339 kr | 0 |
| `4c94aa56` Väggmonterad slangvinda 10 m för trädgård – automatisk upprullning | 919 kr | 7 | `c56892d5` Väggmonterad slangvinda med 10 m slang och sprutmunstycke – svänger… | 699 kr | 0 |
| `4f21c7c1` Tvåsitssoffa i sammetslook med träben – 117 cm | 2079 kr | 0 | `fcb0b18d` Tvåsitssoffa i skandinavisk retrodesign med grå klädsel och furuben | 2199 kr | 0 |
| `4fdd5a7f` Svart tyggarderob på hjul – 10 fack och 2 hängutrymmen, 166x42,5x16… | 899 kr | 0 | `874d78ac` Tygskåp på hjul med två klädstänger och tio fack, grått – 166 × 42,… | 699 kr | 0 |
| `51611305` Vägghängt sängbord 2-pack – svävande nattduksbord med RGB-LED och a… | 1099 kr | 10 | `016e2623` Två väggmonterade sängbord med RGB-LED-belysning, låda och öppet fa… | 879 kr | 0 |
| `5a6ea7f3` Relaxfåtölj med massage och fotpall – tio vibrationspunkter, bär 15… | 3739 kr | 5 | `74074760` Massagefåtölj med fotpall och tio vibrationspunkter i grått konstläder | 3869 kr | 0 |
| `5f627d89` Smalt badrumsskåp 20 cm – högskåp 180 cm med två skåp och en låda | 779 kr | 0 | `3218ee4d` Smalt badrumsskåp i grönt med skåp, låda och öppna hyllor – 20 × 20… | 899 kr | 0 |
| `67d2d4f6` Elmotorcykel barn 24 V för 8–12 år – 8 eller 16 km/h, luftdäck och … | 3219 kr | 6 | `3b83c51d` Elmotorcykel för barn 8–12 år, 24 V med tre fartlägen, skivbroms oc… | 3579 kr | 0 |
| `6ae821eb` Tvättkorg i bambu 72 liter med lock och tygpåse – 40 × 30 × 60 cm | 459 kr | 5 | `aa926303` Tvättkorg i bambu med lock och avtagbar tvättpåse – 72 liter, 40 × … | 479 kr | 0 |
| `718fb6d0` Runt matbord Ø120 cm för fyra – korsben i pulverlackerat stål | 1319 kr | 5 | `49a3bbfb` Runt matbord Ø 120 cm för fyra personer, vit träimitation med X-ben… | 1749 kr | 0 |
| `834c66fd` Metallskjul med skjutdörrar och ventilationsöppningar – 277 × 195 ×… | 3899 kr | 3 | `646720e3` Plåtbod 277 × 195 cm – 4,8 m² invändigt, skjutdörrar, brun | 5039 kr | 0 |
| `87ceed8d` Odlingstunnel 295 × 100 × 80 cm – tre upprullbara luckor, grön PE-duk | 749 kr | 2 | `15dee6da` Tunnelväxthus med tre rullbara dragkedjedörrar och stålram – 295 × … | 549 kr | 1 |
| `88425b27` Fåtölj med fotpall i böjd träfanér – linnelook, sitthöjd 39 cm | 1229 kr | 5 | `76738f85` Fåtölj med fotpall i ljusgrå linnelook och ram av böjt flerskiktsträ | 999 kr | 0 |
| `89dbec6d` Vilfåtölj med integrerat fotstöd – 12 cm dyna, björkstomme | 1899 kr | 0 | `b1c75875` Loungefåtölj i mörkgrå linnelook med förlängt fotstöd och ram i böj… | 1459 kr | 0 |
| `8c49e7cc` Förvaringsbänk 95 cm med 58 liter under sitsen | 1029 kr | 3 | `801a4fe8` Förvaringsbänk i grå bouclé med knappad sits och svarta ben | 859 kr | 0 |
| `a414b5b5` Metallskjul med skjutdörrar och ventilationsöppningar – 213 × 130 ×… | 2899 kr | 5 | `cd628af2` Plåtbod 213 × 130 cm – smal bod 2,4 m² med takfönster | 5369 kr | 0 |
| `a7aa9370` Bänkdyna med rygg för trädgårdsbänk – 8 cm tjock, med knytband | 539 kr | 3 | `c519b4fe` Bänkdyna med ryggdel för upp till tre personer – 150 × 98 × 8 cm | 639 kr | 0 |
| `af699783` Massagefåtölj i manchester – åtta massagepunkter, värme och eldrive… | 3599 kr | 2 | `b837faf5` Eldriven massagefåtölj i grå sammet med ländvärme och minnesfunktion | 3659 kr | 0 |
| `b8002629` Skärmtak för dörr och fönster, 100 × 75 cm – polykarbonat med UV-skikt | 699 kr | 4 | `f4452d93` Entrétak med polykarbonatskivor och gråa fästen av plast – 100 × 75 cm | 649 kr | 0 |
| `b8002629` Skärmtak för dörr och fönster, 100 × 75 cm – polykarbonat med UV-skikt | 699 kr | 4 | `263c4aa7` Entrétak i polykarbonat med svarta armar – 100 × 75 cm för dörr och… | 599 kr | 0 |
| `bf4298b2` Skumklossar 4 delar – ramp, trappa, tunnel och halvcylinder | 1429 kr | 1 | `638f2110` Klätterset i skum med ramp, trappa, tunnelblock och halvcylinder fö… | 1429 kr | 0 |
| `c23dab52` Fällbord med hyllor – matbord för små utrymmen, 20 cm djupt hopfällt | 1369 kr | 1 | `f49f7d80` Hopfällbart matbord med hyllor för små utrymmen, vitt – 78,5 × 91 ×… | 1549 kr | 0 |
| `ce167a07` Plåtbod 240 × 206 cm – snölast 30 kg/m², lås och 9 stödpelare | 6199 kr | 0 | `0cd2dc1a` Redskapsbod i teakfärgad plåt med sadeltak och dubbeldörrar – 240 ×… | 6249 kr | 0 |
| `d3cf8ebc` Sparkcykel för barn 2–6 år – trehjulig med LED-hjul, justerbar och … | 819 kr | 0 | `1dd5c81e` Sparkcykel för barn 2–6 år med lysande hjul och justerbart styre, lila | 679 kr | 0 |
| `d78f7211` Paviljong 3 × 3,6 m – dubbeltak och myggnät, träeffekt | 4499 kr | 0 | `dabd19d7` Paviljong 3 × 3,6 m med dubbeltak och myggnät – plats för åtta pers… | 3759 kr | 0 |
| `e7a451ab` Klaffbord med förvaring 120 cm – två lådor, skåp och sex hjul | 1819 kr | 2 | `a67f4999` Hopfällbart matbord på hjul med två lådor och skåp – 120 × 60 × 76,… | 1399 kr | 0 |
| `eb1e475e` Bäddfåtölj med armstöd i gummiträ – fem ryggvinklar, liggyta 185 × … | 1869 kr | 36 | `c671cd37` Bäddfåtölj i grön sammetslook med ryggstöd i fem lägen och kudde | 2429 kr | 0 |
| `ed5d6b85` Trehjulig sparkcykel 3-i-1 för barn – avtagbar sits och föräldrahan… | 969 kr | 0 | `28a708af` 5-i-1 sparkcykel med avtagbart säte och skjutstång för barn från 18… | 799 kr | 0 |
| `f1878c34` Tvåsitssoffa med förvaring under sitsen – knappad rygg, 117 cm bred | 2099 kr | 5 | `6c20c70b` Tvåsitssoffa i blått med förvaring under sitsen och djuphäftad rygg | 2049 kr | 0 |
| `f523b18d` Frukostset i grått – vattenkokare 1,7 liter och brödrost för fyra s… | 919 kr | 0 | `b1de577c` Frukostset med vattenkokare 1,7 liter och brödrost för två skivor –… | 799 kr | 0 |
| `fd221e07` Golvlampa med tre hyllor, 160 cm – tygskärm och kulkedja | 659 kr | 5 | `05652710` Svart golvlampa med tre öppna hyllor och slät vit tygskärm – 26 × 2… | 619 kr | 0 |

Familjer med fler än två sidor: skärmtaken (`b8002629` finns i två par, och `2c75317b`/`b50a2c94` är en exakt dubblett inom samma familj).

## C. Granskade och olika

Par där bilderna eller texten visade olika varor: `02b743ce:40d0af10`, `033529fe:cc4aad40`, `0927ea10:2b7ddfc8`, `0e2d3be0:ec7c8ea5`, `141a4624:4cc04232`, `1bcd1cfa:0c07eb82`, `1df32c29:72ac915f`, `1f89f67b:477de9da`, `208e2018:45d4cbd7`, `26e5897c:944c3385`, `2f734f34:34fadb7d`, `30162f21:4cf74321`, `30703220:13cb9eb5`, `315d571c:0c07eb82`, `32e265e0:1ee398af`, `4375404d:f4ed1264`, `46f8279a:7ccc27f7`, `485086d2:c62d1496`, `53225be6:6594e610`, `5be87e2b:68911c57`, `5e48ce3b:b07189d2`, `5eda1981:be52938b`, `5f181a0c:d3c91eb3`, `5f7abda8:0fc17126`, `61008b48:4be084cc`, `64af4d96:6e4bb0a4`, `70632f9e:477de9da`, `72dc5144:c35f9d4f`, `7c18b805:c0c2822f`, `7e796983:9cfc2f50`, `817e1869:5efe45d0`, `8b8ca20d:9c1889f1`, `8cca1ae9:19f7c013`, `8dba2f32:b07189d2`, `90060b2d:7f304255`, `90b6a606:1674a1a9`, `91e7d09a:4e58a5de`, `97ae916c:efb9b9b5`, `9aad3c55:702c7795`, `a235537d:cc952c3b`, `a26e3503:3e6fe711`, `a55a2ce7:3627023e`, `a706542f:3e6fe711`, `a84ebcf5:7910a37d`, `a887e594:b07189d2`, `a9281120:a04185b6`, `aa56054f:2dbea163`, `ad49c6d5:d018014a`, `ae508a90:c40a2b10`, `bd90f229:ee19a8c8`, `c10a65c0:3563d029`, `c1cbc863:be52938b`, `c8589714:89346042`, `c94c727e:6640dd3c`, `cd089ce6:4588a393`, `d4433240:45822d9c`, `d46032c6:3f7fbf5d`, `d99ca95f:1366a476`, `dc79274c:329184c4`, `de94d315:0a5d10dc`, `ded83a68:0ea635df`, `e3a3a2bb:46c4d9b2`, `e6458b57:b5a60aae`, `e804e271:00a83f2f`, `e88f5d9c:9dd510a8`, `eaa37062:4362ebd1`, `eff308d4:6d064139`, `f4f8512a:22dbd372`, `f631e89c:1ee398af`, `fb6e1c00:87b9e4d8`.

