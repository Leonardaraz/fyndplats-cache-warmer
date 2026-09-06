# Runda D3 — sju bäddfåtöljer, FÖRBEREDD men inte publicerad

Sista rundan i familj D. **Texterna är skrivna och filgrindade, men
ingenting är skrivet till Wix** — GitHubs MCP-server låg nere när rundan
gjordes, och utan den går varken prisgrinden (`las`) eller stämplingen
(`stampla`) att köra.

| id | slug | pris | vad det är |
|---|---|---:|---|
| `57ba0224` | baddfatolj-190-cm-ljusgra | 3 199 kr | 190 cm-familjen |
| `6a204d58` | baddfatolj-hjul-181-cm-cremevit | 3 199 kr | hjul, sidofickor |
| `583577bc` | baddfatolj-190-cm-cremevit | 2 959 kr | 190 cm-familjen |
| `0317a03e` | baddfatolj-90-cm-oeko-tex | 2 749 kr | 90 cm bädd, S-fjädrar |
| `6efbe712` | baddfatolj-98-cm-armstod-ljusbrun | 2 639 kr | 98 cm bred bädd |
| `02925ee6` | baddfatolj-186-cm-armstod-gra | 2 239 kr | armstöd, 10 min montering |
| `c46bda54` | golvmadrass-203-cm | 1 969 kr | trefaldig, 240 kg |

## ☠️ Varför inget är skrivet till Wix

Prisgrinden är inte valfri. Den läser mappningsradens `landedCostSek` och
kontrollerar att butikens pris är `1,20 × kostnaden` avrundat `charm99`;
workflowen avslutar med `exit 1` på både `stammer: false` och
`EJ AVGÖRBAR`. Kostnaden finns bara i Postgres, nåbar via
`/api/admin/mapping` med `CRON_SECRET` — alltså bara genom workflowen.

Och uppgift **#107** säger uttryckligen att tre Aosom-utkast har fel pris
och **inte får poleras** förrän frakten är kollad. Vilka tre står inte
skrivet. Att skriva text till en av dem vore att gå emot en stående
instruktion på en gissning.

**En grind man inte kan köra är en grind som inte har godkänt.**

## Dubblettkollen — och ett fynd som växte

Alla sju avgjordes på måttritningarna (bild 3), samma metod som i D1 och D2.
Fem är egna produkter. Två är färgsyskon — och det är där det växte.

### ☠️ 190 cm-stolen är FEM av våra sidor

`57ba0224` och `583577bc` har måttritningar som är identiska i varje tal med
den publicerade `baddfatolj-190-cm` och med `baddfatolj-190-cm-beige` som
publicerades i runda D2 samma kväll. Hela familjen:

| id | färg | pris | status |
|---|---|---:|---|
| `667ca8f9` | mörkgrön | 2 519 kr | publicerad sedan tidigare |
| `a6eb718c` | mörkgrön | 2 499 kr | **hålls — äkta dubblett (#128)** |
| `0559bbb2` | beige | 2 619 kr | publicerad i D2 |
| `583577bc` | cremevit | 2 959 kr | den här rundan |
| `57ba0224` | ljusgrå | 3 199 kr | den här rundan |

**Fyra äkta färger, en äkta dubblett.** Färgerna är mätta, inte antagna:
`583577bc` skiljer sig från `0559bbb2` med 8–39 per kanal över tre
beskärningar. Jämför med `a6eb718c` mot `667ca8f9`, som var identiska till
siffran — det är så en riktig dubblett ser ut.

⚠️ **Men prisspannet är 2 499 → 3 199 kr för samma stol.** 700 kronor, 28 %.
Regeln (`1,20 × landedCostSek`) ger det utfallet därför att inköpspriset
skiljer mellan färgerna, så mekaniskt är det korrekt. För kunden som ser
fyra rutor med samma stol är det svårare att förklara. Leonards beslut.

## ☠️ Steg 2 — tre fynd, alla siffror som inte kan stämma

### 1. Maxlasten igen (`57ba0224`)

Underlaget säger **150 kg** och anger `Stahlrahmen`. De tre andra i familjen
säger **120 kg** och `Metallrahmen`. En stålram som bär mer är en
sammanhängande förklaring — men den vilar på ett enda ordval i en tysk spec,
och måttritningen är identisk på alla fyra.

Samma avvägning som i D2: för lågt kostar en försäljning, för högt betyder
att någon sätter sig på en möbel som inte bär dem. **120 kg skrivs.**

### 2. En bädd kan inte vara 74 cm tjock (`c46bda54`)

`Bettgröße: 80B x 203T x 74H cm`. 74 är soffans höjd (`80 x 75 x 74`) som
kopierats in i bädd-raden; ritningen visar 203 × 80 och ingen 74:a på
bädden. **Bädden skrivs som 203 × 80 cm och höjden utelämnas** — ett mått vi
inte vet är bättre otryckt än fel.

### 3. Ryggstödets mått är omkastade (`6efbe712`)

`Rückenlehne Größe: 48B x 98T x 9H` påstår 48 cm bredd på en möbel vars bädd
och liggyta båda är 98 cm breda och vars sits är 95 cm. Ett 48 cm brett
ryggstöd i en 102 cm bred soffa är orimligt. **Skrivs som 98 cm brett,
48 cm högt, 9 cm tjockt.**

## En upplysning som BEHÖLLS

`6a204d58`: *"die Rückseite des Sofas ist mit Polyesterstoff und nicht mit
Chenille bezogen"*. Baksidan är alltså inte chenille. Det är en nackdel, och
den står i texten — möbeln kan stå fritt i ett rum, och då syns den.

`0317a03e`: tyget anges som certifierat enligt **OEKO-TEX Standard 100,
klass II**. Till skillnad från C2:s "verlässliche Zertifizierungen", som inte
namngav någon och därför inte fördes vidare, är den här specifik och
namngiven. Skriven ordagrant som källan anger den.

## Grindarna

| grind | utfall |
|---|---|
| Filgrind (mönster + tal) | **0 fynd i 7 filer** |
| Mutationstest av grinden | 3 injicerade fel → 3 fynd, 0 falska |
| Prisgrind | ⏸ **går inte att köra — GitHub nere** |
| Skrivning till Wix | ⏸ **hålls tills prisgrinden godkänt** |

## Vad som återstår när GitHub är uppe

1. Prisgrind (`las`) på alla sju — sju körningar.
2. Skriv text + namn + slug till Wix med `visible:false`, checksumma mot filerna.
3. Alt-texter (35 bilder) efter granskning av kontaktark.
4. Egna svenska SKU:er — kolla först vilka som delas.
5. Publicera, stämpla, live-grinda.
