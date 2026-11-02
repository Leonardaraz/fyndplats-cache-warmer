### ☠️ Lagerskrivningen sprang ihjäl sig mot Wix edge-spärr (2026-09-02)

Hittad genom att KÖRA synken skarpt, inte av ett larm. Torrkörningen kan inte
se det här — den skriver aldrig, så den vet inte vilka skrivningar som skulle
falla.

| försökta lagerskrivningar | fel |
|---:|---:|
| 40 | **0** |
| 1 150 | **521** |
| 2 095 | **1 190** |

Alla fel är `429` med en **HTML-kropp**, alltså Wix EDGE-spärr och inte
API-nivåns JSON-fel — samma tvåa som media-städningen redan mätt upp
(2026-08-28). Skillnaden mot media-städningen är att synken inte hade
NÅGONTING: ingen paus, inget återförsök. Den skrev ett `bulk-update-inventory`
per produkt så fort den kunde, och Wix kapade efter ~600.

Två lagningar, och den andra är den som biter:

1. **Återförsök med backoff** i `bulkUpdateInventoryQuantities` (1/3/8 s, följer
   `Retry-After`). Fångar API-nivåns 429, 5xx och nätverksfel. ☠️ `wixHeaders()`
   ligger UTANFÖR loopen — ett saknat token är inte övergående, och inuti
   try-blocket gjordes det om fyra gånger och rapporterades som "nätverksfel".
   Ett test fångade just det.
2. ☠️ **Pacing (`AOSOM_WRITE_DELAY_MS`, default 120 ms).** Det är den här som
   håller edge-spärren borta, för den går enligt husets egen mätning **inte att
   vänta ut** inom ruttens 300 sekunder. Samma medicin som
   `MEDIA_UPLOAD_DELAY_MS` och `FREIGHT_CALL_DELAY_MS`: den billigaste kuren mot
   en strypning som utlöses av tempo är att inte springa.

☠️ **Och felet var osynligt i audit-raden.** `misslyckade` stod inte i den, och
raden skrevs bara när något LYCKADES — så en körning som inte kunde skriva
någonting alls såg ut exakt som en körning där allt redan stämde. Rutten svarar
dessutom 200. Nionde gången samma lärdom: ett svar utan fel är inget kvitto.

**Verifierat i drift samma dag**, i den ordning som gör talen meningsfulla:

| körning | lager skrivna | priser | fel |
|---|---:|---:|---:|
| skarpt svep FÖRE pacing | 905 | 17 | **1 190** |
| skarpt svep EFTER pacing | 1 110 | 15 | **1** |
| torrkörning direkt efteråt | **1** | **0** | 0 |

Sista raden är kvittot: 4 514 mappningar granskade, och bara den enda produkt
som föll på en övergående 429 vill fortfarande skrivas. **Noll priser** vill
skrivas — mappningen och butiken är i fas över hela katalogen, vilket är exakt
vad `jamforelsePris` byggdes för.

⚠️ **En hypotes som mätningen slog ihjäl.** Innan felen var kända såg det ut som
att cronen svälter svansen: en torrkörning visade 2 095 väntande lagerskrivningar
och 100 % täthet i de sista varven, vilket pekade på att `limit` alltid förbrukas
i början av artikelnummer-ordningen. Så var det inte. Ryggsäcken var de
MISSLYCKADE skrivningarna — en produkt vars skrivning föll ser ut att "vilja
skrivas" vid varje ny granskning. Med skrivningarna lagade konvergerade katalogen
på fyra varv, och punkt 4 ovan står oemotsagd. Mät innan du bygger om.

⚠️ **Massfel fäller svepet, en enstaka miss varnar.** Både golv (10 st) och andel
(2 %) krävs, samma form som `MASSFEL_ANDEL`/`MASSFEL_GOLV` i migreringens
verdikt. Ett rött jobb vid varje svep — och en övergående 429 av tusen
skrivningar är att vänta — lär mottagaren att sluta läsa, och då är även det
äkta larmet borta. Missen är ändå aldrig tyst: grupperad på orsak i loggen, i
audit-raden och i svaret.
