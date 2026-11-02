### Pensionerade utkast raderas efter fjorton dygn (2026-09-28)

Leonards fråga: ska de pensionerade sidorna finnas kvar, eller raderas ur Wix
tillsammans med bilderna som inte används? De ligger kvar i fjorton dygn och
raderas sedan med ett verktyg. Ingenting raderas för hand, varken produkter eller
filer i Media Manager.

Skälet att radera är lagringen. Den 2026-09-28 bar 327 publicerade Aosom-sidor
524 sammanslagna val, och varje givare ligger kvar som ett dolt utkast med sina
bilder. Så länge produkten finns räknar bildstädningen bilderna som använda.
Skälet att vänta är det som stod här förut: en felaktig matchning ska gå att
backa, och fjorton dygn räcker för att den ska synas.

Workflowen **"Dubbletter — radera pensionerade utkast ur Wix"** (`plan` ·
`stampla` · `radera`) → `/api/admin/pensionerade` → `lib/aosom/pensionerade.ts`.
Torrt som default.

| en produkt raderas bara om | skäl |
|---|---|
| raden är en Aosom-rad med `draftStatus: rejected` och inte redan märkt | pensionerad, inte polerad |
| den pensionerades för minst fjorton dygn sedan (`reviewedAt`) | en felmatchning hinner synas |
| produkten är dold, läst färskt ur Wix precis före raderingen | `rejected` betyder inte dold |
| ingen order bär produktens id eller dess SKU | beställningen läser mappningen |
| ingen köad eller pågående auktion gäller den | |
| ingen omdirigering pekar på dess adress | en 301 till en 404 |
| utkastet bär ingen egen artikel, eller dess artikel säljs på en levande sida | annars försvinner varan ur katalogen, och det kräver `egna=ja` |

Nio egenskaper som inte ska tas bort:

1. ☠️ **Mappningsraden raderas aldrig.** Den märks (`wixRaderad`), artikeln
   flyttas till `importSparr` och `supplierProductId` töms. `importSparr` läses
   bara av Aosom-importens dubblettspärr; utan den hade nattens import skapat
   samma utkast igen. Synken, bildfixen, prisjämförelsen och konkurrentpriset
   hoppar över en rad utan artikel, och Google-tilläggsfeeden hoppar över en
   märkt rad.
2. ☠️ **Filerna raderas av bildstädningen, inte här.** Kör `bildstadning-torr`
   och sedan `bildstadning` efter en radering. En färg som slagits ihop delar fil
   med givaren (samma fil-id i båda gallerierna, uppmätt 2026-09-28), och den
   filen ligger kvar så länge sidan använder den.
3. ☠️ **Filerna kontrolleras före och efter varje radering.** Wix dokumentation
   säger inte vad en produktradering gör med filerna. Ligger en fil som var OK
   före inte kvar efteråt stoppas körningen (`filkontroll`), även när ingen annan
   använder filen, för då håller inte antagandet verktyget vilar på. Produkter
   som inte delar någon fil raderas först, så att mätningen är gjord innan en
   delad fil står på spel. `get-files` utelämnar ett okänt id utan fel (uppmätt
   2026-09-28), så bara filer som var OK före räknas.
4. ☠️ **En radering räknas först när en läsning svarar 404.** En obekräftad
   radering märker inte raden, och tre i följd stoppar körningen.
5. ☠️ **Underlaget vägras om svepet kan ha tappat något** (503). Ett svep som
   inte blev klart, färre än 500 produkter eller fler än fem färre än butikens
   räknare. En produkt som saknas i svepet hade sett raderad ut, och en fil vars
   andra användare saknas hade sett ut att bara tillhöra utkastet.
6. **Utan tidsstämpel raderas ingenting.** Poleringens stämpel satte ingen
   `reviewedAt` före 2026-09-28. Läget `stampla` startar klockan på de raderna
   när det körs, och stämpeln sätter tiden sedan dess.
7. ☠️ **Godkännandet är planens antal.** Första varvet kräver `bekrafta` =
   planens exakta antal. Följande varv skickar det som återstod som tak (`hogst`)
   med första varvets klocka (`per`), så planen får krympa men aldrig växa. `per`
   får bara ligga bakåt i tiden, och `hogst` kräver den.
8. ☠️ **Svaret bär bara wix-id och räknare.** Utkastens namn och adresser är
   Aosoms tyska titlar, och loggen är publik.
9. ☠️ **Ett utkast med egen artikel raderas bara med `egna=ja`.** Sammanslagna
   givare och ommappade dubbletter bär ingen artikel längre, för den bor på
   sidan vi behåller. Ett utkast som fortfarande bär en artikel som ingen levande
   sida säljer är något annat: avvisat i kön, en dubblett med eget
   Aosom-nummer, eller ett färgsyskon som parkerades innan sammanslagningen
   fanns. Raderas det försvinner varan ur katalogen, och spärren hindrar att den
   importeras igen. Planen listar dem (`egnaArtiklarIds`). Granska listan och
   kör sedan med `egna=ja`.

   ☠️ **Listan räknas över ALLA pensionerade** (sedan 2026-09-30), även de som
   är för unga eller stoppas av ett annat hinder. Den räknades först bara bland
   de annars raderbara, och då syntes ett utkast med egen artikel först samma
   dag det kunde raderas. `hinder.egenArtikel` räknar fortfarande bara de rader
   där den egna artikeln är det som stoppar, och `aldstaPensionering` gäller
   också alla pensionerade med tidsstämpel, inte bara de raderbara.

10. ☠️ **Ett ja gäller planen en människa läste, och planen växer med tiden**
    (2026-10-14). Åldern räknas mot nu, så en plan som godkändes kvällen
    2026-10-13 (16 raderbara, klockan 20:09 UTC) hade 207 raderbara nästa
    morgon: 191 pensionerade utkast hade passerat fjorton dygn under natten.
    Workflowens input `per` låser klockan till den tid planen räknades
    (`2026-10-13T20:09:16Z`). Rutten räknar då åldern mot den, ger en mindre
    plan och aldrig en större, och `bekrafta` är planens antal vid den
    klockan. Resten väntar på ett eget ja. `per` får bara ligga bakåt i
    tiden, och workflowen vägrar en tid som inte slutar på `Z`.

**Första körningen 2026-09-28.** Planen gav 580 pensionerade: 11 raderbara, 547
för unga, 20 utan tidsstämpel (de fick den samma dag) och 2 synliga. Svepet tog
under en minut. De 11 raderades med noll obekräftade och noll märkningsfel, och
filkontrollen stoppade ingenting. 55 filer lästes före och efter, och alla låg
kvar. **En produktradering i Wix lämnar filerna i Media Manager**, och det är
mätt, inte antaget. Nio av de elva var bevisade dubbletter. Den tionde,
`66cf81fe`, var den beiga kontorsstolen vars svarta syskon `4871d041` är
publicerat, alltså ett färgsyskon som borde ha blivit ett färgval. Det är fallet
punkt 9 finns för, och spärren lades till samma kväll. För den elfte
(`6e7a50cf`, ett bistroset) står inget skäl i rundornas filer.

⚠️ **Bildstädningen läser `WIX_SITE_ID` när den är satt, raderingen läser
butikens sajt.** Pekar de på olika sajter tar städningen inte de filer
raderingen frigör. Svaret säger det i `sammaSajtSomBildstadningen`; läs fältet
vid första körningen.

⚠️ **Planen säger vad som är raderbart i dag** (`raderbara`) och när nästa blir
det (`nastaRaderbar`). Givarna från de första sammanslagningarna 2026-09-27 blir
raderbara 2026-10-11, men en rad som avvisades i kön före 2026-09-14 kan redan
vara det. Ordningen är `plan`, `stampla` om planen har rader utan tidsstämpel,
`radera` och sist bildstädningen. Kör `stampla` så snart verktyget ligger på
`main`, för de raderna blir raderbara fjorton dygn efter att klockan startats.
Både `stampla` och `radera` stannar på en tidsbudget. Säger `stampla` att rader
är `kvar`, kör planen och `stampla` igen med planens nya antal.
