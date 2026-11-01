### Aosom beställs i klump, inte via API (`lib/aosom/bulk-order.ts`)

☠️ **`place-order.ts` är HELT AliExpress och vägrar numera allt annat.** Den
hämtar produkten ur DS-API:t, matchar varianten mot en AE-SKU och lägger ordern
via `aliexpress.ds.order.create`. En Aosom-mappning bär ett artikelnummer i formen "DDD-DDDLL" i exakt
samma fält, så utan grinden hade artikelnumret skickats rakt in i AE:s API — ett
uppslag som aldrig kan träffa, med ett felmeddelande som pekar åt fel håll.
Grinden är `isAliExpressMapping` i `placeOrderForTask`, och meddelandet pekar på
bulkordern så den som ser felet i `/admin` inte börjar leta i AE-loggarna. En rad
UTAN `supplier`-fält räknas fortfarande som AliExpress — annars hade hela den
befintliga katalogen slutat gå att beställa.

Aosoms egen väg kräver inget API. `/api/admin/aosom-order` bygger filen som
`aosom.de/bulkordering` tar emot: **varje rad är en order** — en kundadress med
upp till tjugo artikelnummer. Utan `?format=csv` svarar rutten med planen, så
man ser vad som kommer med innan något laddas upp.

Gränserna är **Aosoms, inte våra** (guiden, avsnitt 5), och en batch som spränger
någon av dem avvisas först efter uppladdningen — därför delas ordrarna i förväg:

| | |
|---|---:|
| Ordrar per omgång | 100 |
| Artikelnummer per rad | 20 |
| Olika artikelnummer per batch | 200 |
| Enheter per batch | 1 000 |

Två egenskaper som inte ska tas bort:

1. ☠️ **En order delas ALDRIG mellan två batchar.** Raden ÄR ordern, med en
   adress och en betalning. Splittad blir det två leveranser, två fraktavgifter
   och en kund som får halva sin beställning. En order som ensam spränger ett tak
   flaggas som `omojlig` och lämnas till en människa.
2. **En kunds rader slås ihop till EN rad.** Kön är radbaserad
   (`taskId` = `${orderId}:${lineItemId}`), Aosoms fil är orderbaserad. Tre rader
   hade blivit tre leveranser med varsin fraktavgift — och frakten är redan den
   dyraste delen av en Aosom-order.

⚠️ **Adresskolumnernas rubriker är inte verifierade.** Guiden anger bara att
kolumn A är artikelnumren och kolumn B antalen; adressfälten beskrivs som "one
customer address" utan namn. Ladda ner deras formulär en gång och rätta
`CSV_KOLUMNER` — datan i raderna är rätt oavsett.
