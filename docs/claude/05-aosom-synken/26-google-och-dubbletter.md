### Kan Google se att det är dubbletter? (Leonards fråga 2026-08-27)

Två skilda problem, med olika svar.

**Utkast är osynliga — mätt, inte antaget.** En produkt med `visible:false`
svarar **404** på sin produkt-URL och ligger inte i sitemapen (1 064 `loc` mot
946 synliga produkter). 5 566 tyska utkast kan alltså inte indexeras. Hela
risken ligger i publiceringsögonblicket, inte i importen.

**Vi läcker inga leverantörsspår.** Kontrollmätt på en publicerad sida:
noll träffar på `aliexpress`, `alicdn`, `aosom` eller något husmärke i HTML:en;
alla 230 bilder på `static.wixstatic.com`; JSON-LD:ns `sku` är Wix eget UUID;
inget `mpn`, inget `gtin`. Feedens `EAN`-kolumn är dessutom tom i 100 % av
raderna, så det finns ingen produktidentifierare att joina på. Husmärkena
(HOMCOM, Outsunny, PawHut, Aiyaplay) stryks vid poleringen — bara 6 av 952
produkter bär dem, och alla sex är opolerade utkast.

☠️ **Men den mätningen ser bara HTML:en, och namnet kan ligga i PIXLARNA.**
Uppmätt 2026-09-05 i runda 64: en bild på ett Aosom-utkast bär
**`HOMCOM by Aosom` inbränt uppe till vänster** — husmärket och leverantören i
samma logotyp. En `grep` över källkoden svarar grönt medan kundens öga läser
leverantörens namn, och en logotyp leder till hela deras katalog på samma sätt
som artikelnumret leder till dealproffsens sida.

Stycket ovan är alltså riktigt om HTML:en och ofullständigt om SIDAN. Rundans
Steg 4 granskar sedan dess bildernas övre vänstra hörn; av sexton granskade bar
en logotyp, och den bilden plockades bort. **Hur många av de publicerade
sidorna som bär en är inte mätt** — det är en bildmätning, inte en textmätning,
och den görs i städningen tillsammans med kategoriträdet (Leonards
sekvensering 2026-09-05: polera färdigt först, rätta strukturen sedan).

**Det Google DÄREMOT ser är bilderna.** Att flytta hem dem till wixstatic byter
adress, inte innehåll. Google Images matchar på bildinnehåll, och Aosoms foton
är byte-identiska hos varenda återförsäljare som kör samma feed. Skyddet är
inte hemflytten — det är egen text (och, tills 2026-10-27, egna kort: vi bygger inga
Fyndplats-kort längre).

**Den farliga dubbletten är intern.** `FyndplatsMappings` har **595 av 1 004
rader** från "byaosom ES (EU) Store" — 59 % av katalogen är redan Aosom-varor,
köpta via AliExpress. Feed-importen kan inte se dem (de bär AE-listnings-id) och
skapar därför en ANDRA sida för samma fysiska produkt. Två egna URL:er med samma
foton är den dubblett Google faktiskt straffar. Fångas i poleringen, inte av
spärren.
