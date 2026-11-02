### Auditen: driften är 20 rader, inte 1 611 (2026-08-29)

Raden ovan uppskattade skadan ur ett stickprov på sex. Det höll inte som mått —
hela katalogen är nu jämförd rad för rad, mappningens `grossSek` mot Wix faktiska
pris, och två oberoende mätningar ger samma tal:

| | |
|---|---:|
| Aosom-mappningar | 4 445 |
| Stämmer exakt mot Wix | **4 425** |
| **Drivit isär** | **20** |
| Summan av `prisUppdaterade` i audit-loggens fem körningar | **20** (11+4+1+2+2) |

Att de två talen möts är kvittot: varje drivande rad räknas exakt en gång, för
nästa körning ser mappningens nya tal och hoppar över den.

☠️ **Alla 20 är `visible:false`** — opolerade utkast som svarar 404 och inte ligger
i sitemapen. **Ingen kund har sett ett fel pris**, och auktionen kan inte gå på en
opublicerad produkt. Ingen av de tre där Wix ligger LÄGRE än mappningen säljs under
inköp (tunnast är `ad390a36` på 10,9 % mot husets 17 %). De övriga sjutton är för
DYRA i butiken — det kostar sålda varor, inte pengar.

**Skadan är alltså inte akut. Fällan är publiceringen:** poleringen säger uttryckligen
"rör inte priset", så den som polerar en av de tjugo publicerar det gamla priset utan
att märka något.

**Skrivfixen biter.** Kontrollerat mot skarpa Wix på alla 4 445 mappningar: varenda
en bär både `wixVariantId` och ett Wix-`sku` (`FP-…`), och noll rader bär feedens
artikelnummer i variantens `sku`-fält. Reproducerad matchning på 25 produkter: 25
skulle skriva, noll skulle falla.

⚠️ **Kostnadsargumentet mot att jämföra med Wix var fel**, och det var det som höll
de tjugo kvar. Raden påstod att en sådan jämförelse kostar "ett Wix-anrop per granskad
produkt". Det gör den inte: `POST /stores/v3/products/query` ger **100 produkter med
pris per anrop** — hela katalogen på 5 397 produkter är 54 anrop, ett par sekunder av
ruttens 240. `limit`-resonemanget i punkt 4 föll alltså INTE, och jämförelsen är
byggd sedan 2026-09-02 (`listV3ProductPrices` → `jamforelsePris`). De tjugo rättas
av nästa körning, utan engångsavstämning — en sådan hade dessutom bara skrivit
priset EN gång och lämnat orsaken kvar.

☠️ **Priset per variant kommer med i standardprojektionen — begär inte `fields`.**
Uppmätt mot skarpa V3 2026-09-02: `actualPriceRange.minValue/maxValue` och
`variantSummary.variantCount` ligger i svaret utan att efterfrågas.

☠️ **Och frågan ställs UTAN synlighetsvillkor, med flit.** Alla tjugo är
`visible:false` — en fråga som tyst filtrerat bort utkast hade gett en fix som
aldrig når det den skulle laga. Mätt samma dag: utkastet `3a6988b8` returneras
med `visible:false` och pris ifyllt av en fråga som inte nämner synlighet alls.
V3 lägger alltså inte på något implicit `visible:true`. Lägg inte till ett. Det är motsatsen
till `getProductMedia`, som MÅSTE begära `MEDIA_ITEMS_INFO` för att få sina bilder —
och den asymmetrin är just varför båda är mätta i stället för antagna.

**Regeln, sjunde gången: ett svar utan fel är inget kvitto.** Och de två nya:
**två fält som heter `sku` men betyder olika saker ska inte ha samma typ** — och
**ett stickprov är ingen skadeuppskattning.** Sex rader sa "litet"; hela katalogen
sa "tjugo, och inga av dem syns". Det är skillnaden mellan en oro och ett beslut.
