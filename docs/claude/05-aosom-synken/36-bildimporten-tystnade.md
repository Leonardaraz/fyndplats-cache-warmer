### Bildimporten tystnade — 397 av 675 produkter fick noll bilder

Första skarpa svepet (2026-08-27) importerade 675 produkter. **397 fick NOLL
bilder** och 87 fick färre än fem, medan körningen rapporterade `failed: 0` hela
tiden: produkten skapades ju, det var bara bilderna som föll bort.

Två tysta fel i `lib/wix/media.ts` samverkade:

1. `importMediaUrls` körde `Promise.allSettled` och **filtrerade bort allt som
   rejectade**. Ingen logg, ingen räknare, inget returvärde som skvallrade —
   kommentaren påstod "med varning i konsolen", och det fanns ingen sådan.
2. `importMediaByUrl` hade **inget återförsök alls**. Wix svarar 429 vid för hög
   takt, och fem bilder parallellt per produkt × 129 produkter per varv är ~2,7
   uppladdningar i sekunden. Därför blev det värre över tid: de sist importerade
   fick noll.

Lagat: uppladdningarna går **en i taget** med paus (`MEDIA_UPLOAD_DELAY_MS`,
default 150 ms), återförsök med backoff på 429/5xx/nätverksfel (1 s, 3 s, 8 s,
följer `Retry-After`), och varje miss rapporteras via `onMiss` →
`ImportResult.missadeBilder`. En trasig adress (404) ger däremot upp direkt —
den blir inte bra av att frågas igen.

Samma klass av bugg som recensionsbilderna hade (2026-08-22). Regeln bakom båda:
**en misslyckad uppladdning som ingen kan upptäcka är värre än en som kastar.**

☠️ **`getProductMedia` MÅSTE begära `fields=MEDIA_ITEMS_INFO`.** Utan det
returnerar V3 en produkt med `media.main` ifylld men `media.itemsInfo.items`
TOM — inte ett fel, bara en tystare projektion. Uppmätt 2026-08-27 på en produkt
med fem bilder: 0 utan fältet, 5 med. Två saker gick sönder på det, båda tyst:
bildreparationens torrkörning såg alla 744 Aosom-produkter som bildlösa, och
knappen **"ta bort bild" i `/admin/queue`** filtrerade en tom lista, såg ingen
skillnad och anropade därför aldrig Wix — den hade aldrig gjort något. Ett test
i `client-media.test.ts` fäller om fältet försvinner igen.

`/api/cron/aosom-image-repair` städar upp efteråt (`lib/aosom/image-repair.ts`,
workflow-lägena `bildfix-torr` och `bildfix`). Den **läser tillbaka och räknar** efter
varje skrivning — se nästa avsnitt för varför. Den laddar om ALLA fem bilderna på
en produkt som har för få — en wixstatic-adress avslöjar inte vilken källbild den
kom från, så det går inte att veta vilka som saknas. Två spärrar:

- Skriver **aldrig en tommare lista** än den som redan ligger där. Går
  uppladdningen dåligt igen lämnas produkten orörd till nästa runda i stället för
  att göras sämre.
- Bara `media`, via `setProductMedia` med `fieldMask: ["media"]`. Synlighet,
  varianter, priser och texter är orörda — ett utkast kan inte råka publiceras.
