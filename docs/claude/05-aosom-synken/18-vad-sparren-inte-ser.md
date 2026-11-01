### Vad spärren INTE ser

Dubblettspärren nyckar på `supplierProductId` och fångar varje omkörning. Den
fångar **inte** de ~586 produkter vi redan säljer som är Aosom-varor inköpta via
AliExpress — de bär ett AE-listnings-id och ser för spärren ut som något helt
annat. Att para ihop dem kräver mått, produkttyp och bildjämförelse (så gjordes
de 33 i leverantörsjämförelsen 2026-08-27); en automatisk gissning skulle slå
ihop varor som inte är samma. De dubbletterna hanteras i poleringen, där en
människa ändå läser varje produkt.

#### ☠️ Men AE-listningen bär Aosoms artikelnummer i klartext (2026-09-06)

Raden ovan säger att hopparningen kräver mått, produkttyp och bildjämförelse.
Det stämmer för BILDEN och måtten — men det finns en exakt nyckel som ingen
letat efter, och den ligger i AliExpress egen produktbeskrivning:

```
● material: pu (60% polyurethane, 40% base fabric), foam, mdf, metal
● total measurements: 41x47x92 cm (wxdxh)
● maximum load: 130 kg
● reference: ‹artikelnumret›          ← Aosoms artikelnummer
```

Uppmätt på `1005012777765014` (`ae_item_base_info_dto.detail`, via
`debugRawProductGet`). Aosom skriver alltså sitt eget artikelnummer i den text
de laddar upp till AliExpress. Går fältet att läsa på fler rader blir
ommappningen ett EXAKT uppslag mot feeden i stället för en bildjämförelse —
och `/api/admin/aosom-remap` tar redan emot paret (wix-id, artikelnummer).

⚠️ **Det är EN mätning, inte en regel än.** Nästa steg är billigt och namnges
här så det inte behöver återupptäckas: `freight-check`-workflowen med
`raw=true` tar ett AE-produkt-id och dumpar hela `ds.product.get`; sök
`reference:` i svaret. Håller mönstret över ett tiotal Aosom-ES-listningar är
det värt en grep-baserad extraktion. Håller det inte, är fältet en
bekvämlighet och inte en nyckel — och en ommappning som gissar är precis vad
`MIN_REMAP_MARGIN_PCT` och de sex hindren finns för att stoppa.

☠️ **Numret får ALDRIG följa med in i produkttexten.** Det är samma sträng
dealproffsen.se publicerar som `sku`/`mpn` — se poleringsavsnittet. Det hör
hemma på `supplierProductId` och ingen annanstans.

⚠️ **Och en träff i beskrivningen är inte en träff i feeden.** Barstolen
finns hos aosom.de som KONSUMENTvara (77,90 € inkl. MwSt) men
har **noll träffar i B2B-feedens 6 067 rader** — varken den färgen eller någon
annan färg av samma modell. Aosoms egen guide säger att artiklar med lågt saldo plockas
bort tillfälligt, så frånvaron är ett lagerbesked lika gärna som ett
sortimentsbesked: sök om senare (`aosom-feed-search`, feeden uppdateras 3
ggr/dygn) innan slutsatsen dras.

#### ☠️ Och en TREDJE klass: Aosoms EGEN feed bär samma vara två gånger (2026-09-12)

Raden ovan namnger EN blind fläck — de ~586 AE-inköpta Aosom-varorna. Det finns
två. Aosoms feed har mer än en artikelrad för samma fysiska produkt, och
dubblettspärren nycklar på `supplierProductId`: två artikelnummer är två nycklar,
alltså importeras båda. Spärren gör precis vad den ska och ser ändå ingenting.

Uppmätt på hörnsoffan `69c5e15c` (publicerad) mot utkastet `34341c4f`:

| | behålls | dubbletten |
|---|---:|---:|
| leverantör | **aosom** | **aosom** |
| pris | 8 499 kr | 8 769 kr |
| fraktandel | 0,424 | 0,49 |
| saldo | 101 | 12 |

Att kostnaderna SKILJER är vad som gör klassen svår: två feedrader med olika
grossistpris och olika viktbaserad SE-frakt ser i varje kostnadsjämförelse ut som
två olika varor. Måtten är identiska (242 cm, 198 cm sittbredd, 400 kg), men
måttjämförelsen är redan uppmätt otillräcklig som ensam grund.

☠️ **Facit är BILDERNA, och de är byte-identiska.** Aosom levererar samma
fotofiler för samma artikel, så en md5 räcker — ingen bildlikhet, ingen gissning:

```
huvudbild    385 707 byte   435459f872fa0158   BÅDA
miljöbild  1 068 103 byte   c527549810410717   BÅDA
```

Två av två delade positioner identiska på bitnivå. Detaljbilderna skiljer (olika
positioner hämtades hem), men konstruktionen är densamma på varje foto.

⚠️ **Har sidan vi behåller saldo räcker pensioneringen** (`draftStatus:
"rejected"`, `needsAiPolish: false`), som för hörnsoffan. Husets regel *"äkta
dubbletter mappas om till Aosom"* antog tyst att sidan vi behåller är en AE-rad.

✅ **Är sidans artikel slut medan utkastets finns i lager byter sidan artikel**
(sedan 2026-09-30, Leonards beslut om soptunnan `300a9113`, vars utkast
`43ea33bd` hade 48 i lager). `aosom-remap` tar då en sida som redan är Aosom,
men bara mot ett opolerat Aosom-utkast som bär artikeln: ange utkastet som
dubblett och lämna `sku` tomt. Sidan behåller adress, text, bilder och
recensioner, och utkastet pensioneras. Sidans gamla artikel sparas i
`importSparr`, annars skapar nattens import samma vara igen. Priset rörs inte
av bytet, men synken räknar om det efter den nya artikelns kostnad. Hindren:
`redan_aosom` (ingen sådan dubblett), `dubbletten_inte_utkast` (dubbletten är
polerad), `samma_artikel` och `importsparr_upptagen`.

⚠️ **Klassens STORLEK är omätt — en rad är inte en mätning.** Den billiga vägen
är namngiven här så den inte behöver återupptäckas: Wix filbeskrivare bär ett
`hash`-fält (`lib/wix/media-audit.ts` räknar redan byte-identiska filer med det),
så en gruppering av Aosom-produkter på huvudbildens hash kräver NOLL
bildnedladdningar. Rapporten som finns svarar på "vad kostar dubbletterna i
lagring", inte på "vilka två produkter är samma vara" — det är en ny gruppering
över samma data, inte ett nytt svep.
