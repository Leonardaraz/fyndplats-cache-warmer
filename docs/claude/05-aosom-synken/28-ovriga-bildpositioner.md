### De andra positionerna hämtas för granskning (2026-09-30)

Poleringen stryker det som bär tysk text, ett märke eller en logga. Därför stod
222 publicerade sidor med två eller tre bilder den 2026-09-30, 48 av dem med två.
Leonards beslut: sådana sidor ska få fler rena bilder ur leverantörens egen
uppsättning, inte egna kort.

Ingen hade sett position 4–7, och det gick inte att titta. Bildlistan finns bara i
feeden, och Wix minns inte varifrån bilderna kom: filerna på produkterna är Wix
egna kopior, och originalen är bortstädade (uppmätt: `get-files` på kopians
`sourceUrl` svarar med en tom lista).

Workflowen **"Bilder — hämta leverantörens övriga bilder för granskning"** →
`/api/admin/aosom-bildkandidater` → `lib/aosom/bildkandidater.ts` laddar upp de
begärda positionerna (default 4–7) till Media Manager utan att röra produkten.
Svaret ger Wix fil-id och wixstatic-adress per position. En människa tittar på
bilderna, och de rena skrivs med **"Polering — skriv bara bilderna"**
(`bildplan.json` ur `tools/polish-gates/bygg-bildplan.py` →
`/api/admin/polish-bilder` → `lib/polish/bildplan.ts`). Den skriver bara
bildlistan, med skrivplanens eget mediesteg, så en polerad sidas text skickas
aldrig igen.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Svaret bär aldrig artikelnummer eller leverantörens adresser.** Ett
   uppladdningsfel räknas per position utan felmeddelande, eftersom
   `importMediaByUrl` skriver källadressen i sitt.
2. ☠️ **Filnamnet byggs av Wix-id och position** (`kandidat-<id>-<pos>.jpg`),
   aldrig av källadressen eller titeln.
3. ☠️ **Positionerna tas exakt.** `valjBilder` släpper igenom hela listan när ingen
   önskad position finns. Det är rätt vid en import men fel här.
4. **Torrkörning är default.** Den säger hur många bilder feeden har.

⚠️ **Bilder som ingen väljer städas bort av nattens bildstädning** (03:50 UTC),
eftersom de bär en leverantörsadress i `sourceUrl`. Sedan 2026-10-14 först när
de varit oanvända i tre dygn (karenstiden), så en vald bild måste sitta på sin
produkt inom tre dygn. En omkörning laddar upp på nytt.

☠️ **Utfallet, uppmätt 2026-09-30: position 4–7 är nästan aldrig rena.** Alla 184
bilder på de 46 sidorna med två bilder granskades. 181 var tyska säljgrafiker
med rubrik och bildtexter. Tre var miljöfoton utan grafik, och två av dem bar
läsbar text eller ett riktigt märke på rekvisitan (burkar, flaskor). En enda
bild klarade runbookens regler, soffbordets miljöfoto. Den ligger på sidan sedan
samma dag (`runda-bilder-1-skriv`), läst tillbaka ur Wix och sedd på den
publicerade sidan. Ingen sida kom upp i två nya rena bilder.
Granskningen står per bild i `tools/polish-assets/runda-bilder-1/granskning.tsv`.
Mätningen från 2026-08-27 (4 av 90 rena på position 4–6) stod sig alltså, och
den gäller även de sidor poleringen redan tömt.

⚠️ **Feeden har tio bilder, inte nio.** 45 av 46 artiklar bar tio den 2026-09-30.
Taket i verktyget var nio fram till samma dag och slängde position 10 tyst ur
begäran. Det är sedan dess femton, en marginal över feedens högsta position. Det
är inte Wix tak: en produkt tar 50 bilder (uppmätt 2026-10-21, `lib/wix/limits.ts`).

✅ **Feeden har högst tio bilder per artikel, mätt på hela färgurvalet (2026-10-22).**
Leonards fråga var om det finns rena bilder på position 11–15. Verktyget tar
positionerna 1–15, så åtkomsten var inte gränsen. Torrkörningen av
`aosom-fargtillagg` (`kandidater`, `skarp` av, `positioner=11,12,13,14,15`) över
alla 442 sidor i `aosom-ordning.tsv` fann **0 av 1 160 färger med en bild bortom
position 10** (28 färger saknas i flödet). Kontrollkörningen med positionerna 8–12
på 50 jämnt spridda sidor fann position 10 för 125 av 127 färger och position 11
och 12 för 0, så kollen kan fälla. Feeden har alltså inget på 11–15 att hämta.

☠️ **Men taket ligger i feeden, inte på aosom.de** (Leonard 2026-10-22, skärmbilder av
sidan för fåtöljen `f44642e5`, Ljusgrå: galleriet visar **13 bilder**, och 11/13 och
12/13 syntes). Det som mättes var feedens bildlista, och slutsatsen att Aosom har
högst tio bilder per vara stämde inte. Feedens tio bilder för samma färg laddades upp
och lades bredvid skärmbilderna, och ingen av de två finns bland dem. 12/13 är en
textfri grafik med massagepunkter och värmezon (feedens position 5 är den tyska
versionen med text), och 11/13 är ett foto av fåtöljen i en annan vinkel än feedens
första bild. Båda såg rena ut.

☠️ **Vi kommer inte åt dem härifrån, och de går inte att gissa.** aosom.de svarar 403 på
curl och WebFetch (startsidan, produktsidan och sitemapen), medan bildservern
`img.aosomcdn.com` svarar 200. Filnamnen där är slumpade
(`/100/product/<år>/<månad>/<dag>/<slumpsträng>.jpg`, mätt på en adress), så
extrabilderna går inte att hitta på adressen. Det som saknas är bara listan. Två vägar,
ingen är gjord:

1. Be Aosom om alla bilder (en feed med fler bilder, eller ett bildarkiv). Det ger också
   nya importer fler bilder att välja bland.
2. Läsa bildlistan ur sidorna i en riktig webbläsare, i Leonards Chrome som med
   recensionerna (2026-09-16). Det kräver en session med Claude in Chrome, och
   `annan_kalla` i `lib/aosom/fargtillagg.ts` släpper idag bara igenom en källa som är en
   position i färgens egen artikel, så verktyget måste lära sig ta emot adresser som
   inte står i feeden.

Skriv inte "Aosom har högst tio bilder" som om det gällde sidorna. Det gäller feeden.

✅ **Position 10 är den som lönar sig.** Den granskades samma dag på de 45 sidorna:
24 var rena miljöfoton. 21 ströks, och alla för text på rekvisitan: etiketter på
burkar, påsar och flaskor i kök och badrum, bokryggar, en tavla med ett ord och en
klocka på en datorskärm. Flera av de strukna bar ett riktigt märke.
Textigenkänning i full upplösning och i dubbel förstoring pekade ut var texten satt,
men varje bild bedömdes med ögat. Märken och dekaler som sitter på själva varan fick
stå kvar, som runbooken säger. Granskningen står per bild i
`runda-bilder-1/granskning.tsv`.

De 24 bilderna sitter på sina sidor sedan samma dag (`runda-bilder-1-pos10`). Alla
24 skrevs och lästes tillbaka ur Wix i en separat läsning, och alla 24 publicerade
sidor visar bilden med sin alt-text. Av de 48 sidorna med två bilder har alltså 25
nu tre, men ingen fick två nya. 21 har ingen ren bild kvar i feeden, eftersom alla
deras bilder är granskade. För två gick det inte att hämta bilder: en sammanslagen
sida med flera artiklar (`flera_artiklar`) och en artikel som saknades i feeden.

✅ **Beskärning gav 23 bilder till på 13 av de 22 sidorna (2026-09-30).** Leonard:
*"fler än bara 2 måste ju gå att använda, eller klippa snyggt på nått sätt"*. För de 22
sidor som fortfarande hade två bilder granskades alla tio positioner igen, nu för att se
vad som går att skära fram. Rubriker, bildtexter, ikoner och rekvisita med text skars bort,
och varan skars aldrig i. Runbooken förbjöd beskärning (Leonard 2026-09-27), och
undantaget för sidor med två bilder står nu där. Utsnitten görs med Wix egen crop-adress
och laddas upp som nya filer, så ingen leverantörsbild läggs i det publika repot. Varje fil
är md5-parad mot sitt utsnitt, eftersom uppladdningens svar inte säger vilket id som hör
till vilken adress. Metoden står i `docs/polish/bildmetoder.md` (*Beskärning*),
granskningen per bild i `runda-bilder-1-klipp/granskning.tsv`.

Alla 23 skrevs och lästes tillbaka ur Wix i en separat läsning (`runda-bilder-1-klipp`),
och alla 13 publicerade sidor visar dem med sina alt-texter. Två utsnitt ströks: en klocka
med ett ord som gick att läsa i full storlek, och en importörsetikett med adress som inte
gick att skära bort utan att kapa hjulet den satt vid. Nio sidor fick ingenting. På åtta
står texten på varans egna hyllor, i dess fack eller bakom dess glasdörrar, alltså inne i
det som inte får skäras bort. Den nionde saknas i feeden. För de nio är leverantörens
bilder uttömda.

✅ **En andra genomgång samma dag gav sju bilder till.** Leonard frågade om sidorna med två
eller tre bilder hade fler att ge. Alla tio positioner på de 13 sidorna granskades igen, och
sju utsnitt höll (`runda-bilder-1-klipp2`). Tre visar en utdragen låda där förpackningarna
med text skurits utanför, och de andra är ett köksskåp i sitt kök, ett mikrovågsfack,
insidan av ett badrumsskåp och sparkbilen på ett kalas. Alla sju skrevs och lästes tillbaka
ur Wix i en separat läsning, och alla sju sidorna visar dem live. Nu har fyra av de 22
sidorna kvar två bilder: `138a24b0`, `3a27aabe`, `9dc0f858` och `fbcf5899`. Resten
stoppades av text på varan eller på sakerna i den, och av collagepaneler under 700 px på
kortsidan, som ger en suddig huvudbild. Metoden står i `docs/polish/bildmetoder.md`.

Den första genomgången kallade leverantörens bilder uttömda för nio sidor, men fem av dem
fick bilder i den andra. Mät var texten slutar innan en bild stryks.

✅ **Sidorna med tre bilder granskas i rundor om sju till nio sidor (2026-09-30).** Leonard:
*"dom som har 3 och 2 bilder måste vi lösa … ta dom i omgångar några i taget o gör noggrant"*.
Den färska räkningen gav 48 sidor med två bilder och 172 med tre. Varje runda hämtar alla tio
positioner och granskar dem med samma regler och samma beskärning som ovan. Rundorna 2–7
(kontorsstolar, fåtöljer, soffor, bord, badrumsskåp och trädgård) granskade 52 sidor, och 44 av
dem fick sammanlagt 89 bilder. Alla är skrivna, lästa tillbaka ur Wix och sedda på de publicerade
sidorna. Skälet per bild står i `runda-bilder-N/granskning.tsv`, och fällorna står i
`docs/polish/bildmetoder.md` (*Beskärning*).

☠️ **Butikens galleri visar VARJE bild som en kvadrat ur mitten, inte bara huvudbilden**
(uppmätt 2026-09-30: `.gallery .gmain img` har `aspect-ratio: 1` och `object-fit: cover`, och
adressen är Wix `fill … al_c`). Ett avlångt utsnitt där varan fyller hela höjden visas alltså
kapat. Nio av 76 icke-kvadratiska utsnitt från rundorna 1–6 gör det, bland dem en garderob, ett
TV-stativ och en lyftfåtölj. Listan står i bildmetoderna. De ligger kvar tills Leonard valt
mellan att ta bort dem och att låta galleriet visa hela bilden.

✅ **Text på rekvisitan är okej sedan 2026-09-30.** Leonard, om köksskåpet `fbcf5899`: *"text
som är på produkter på det viset är okej"*. Förpackningar, burkar och böcker med text i en
miljöbild stryks inte längre, även när ett märke går att läsa i full storlek. Tysk säljgrafik,
leverantörens logotyp och fel färg stryks som förut. Bilder som ströks bara av det gamla skälet
får läggas tillbaka, och skälet står per bild i rundornas `bilder-bort.tsv` och
`granskning.tsv`. Regeln står i runbooken under *Behåll*.
