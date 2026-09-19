# Runda 145 — Steg 1–2: familjeval, prisgrind, legal grind

## ☠️ Nytt fynd: `/api/admin/mapping` kräver FULLT wixProductId, inte 8-teckensprefixet

Alla tio första `las`-anropen (workflowen `polish-mapping.yml`) kördes med bara
det åtta tecken långa pid-prefixet (`"wix_product_id": "97f5f728"` osv, samma
korta form som används genomgående i dokumentationen och Wix-produktsöket).
Samtliga tio föll med samma fel:

```
##[error]Varken mappning eller produkt finns för 97f5f728. Id:t är alltså
inte en föräldralös produkt utan en felaktig referens — kontrollera var det
kom ifrån. Ingenting att polera.
```

Produkterna finns bevisligen (samma prefix slog exakt en träff via
`products/search` med `$startsWith` i samma andetag). Skillnaden är att
`/stores/v3/products/search` stöder prefix-matchning, men
`/api/admin/mapping?wixProductId=` gör uppenbarligen en EXAKT jämförelse —
ett åtta-teckensprefix matchar då aldrig ett fullt UUID.

**Fixat genom att slå upp alla tio fulla UUID:n** (`products/search` med
`$startsWith` + `cursorPaging.limit:2`, en träff per prefix) och köra om
samtliga tio `las`-anrop med det fulla `wixProductId`. Alla tio gav
`conclusion: success` andra gången.

**Regel för nästa runda: `wix_product_id`-inputet till `polish-mapping.yml`
måste vara det FULLA UUID:t, aldrig det korta pid-prefixet.** Prefixet duger
för `ExecuteWixAPI`s egna `$startsWith`-sökningar, men inte för den här
workflowen.

## Steg 1 — nästa batch ur växthusfamiljen

Efter runda 144 (åtta växthus) återstår ~74 kärnväxthus av de 82 som fanns
efter den korrigerade svepningen (82 kärna, 8 reservdukar/Abdeckungen
exkluderade, 5 Hochbeet-hybrider exkluderade). Tio kandidater plockades ut
spridda över konstruktionstyp och pris; alla tio klarade prisgrinden
(`stämmer: true`), men en (`b5ba12b8`) har `aosomSyncedQty: 0` — slutsåld hos
Aosom just nu — och utesluts därför ur rundan. Ingen text är skriven för den;
den tas upp igen när lagret kommer tillbaka, ingen "publicera när lager
kommer tillbaka"-post behövs eftersom den aldrig polerades.

**Nio produkter går vidare**, sex-sju distinkta konstruktioner:

| pid | wixProductId | pris | konstruktion | supplierProductId |
|---|---|--:|---|---|
| `0fc3c252` | 0fc3c252-94d2-4c05-b916-bfaf7e1ae356 | 1 519 | hyllförsett foliehus, rullbar dörr, 198×275×191 | aosom:84H-542V00WT |
| `97f5f728` | 97f5f728-d291-45ed-8435-dfdec4a9f0a3 | 1 699 | pop-up-foliehus, sadeltak, två dragkedjedörrar | aosom:84H-536V00GN |
| `9cdca665` | 9cdca665-a1e0-4809-b719-11a6bdb81c83 | 2 299 | stor genomskinlig tunnel, 40 clips, vindklass 5 | aosom:84H-443V01CR |
| `f5f02f8a` | f5f02f8a-ef76-414f-8d59-1a82071c601b | 3 169 | XL-tunnel med solskyddsnät, rullbara sidoväggar | aosom:84H-198V03GN |
| `601ae5f5` | 601ae5f5-8945-4182-a018-b799b8badb50 | 1 019 | litet portabelt växthus, 9,4 kg | aosom:845-775V00WT |
| `dd97fbc9` | dd97fbc9-1fd8-4ec2-abf4-a1956f6cd39b | 1 769 | 3-plans drivbänksskåp trä/PC, två låsbara dörrar | aosom:845-502 |
| `62d2071e` | 62d2071e-96ee-48e7-aa23-709992fdfc92 | 1 249 | budget-foliehus, 3 plan trådhyllor | aosom:845-302V01GN |
| `a7d1a29b` | a7d1a29b-81c4-4890-bf58-6a0a99b53e0c | 1 819 | genomskinlig gångtunnel, 40 clips, vindklass 5 | aosom:84H-011V00CR |
| `2da078c9` | 2da078c9-71c8-4929-9e39-6379163dfec5 | 1 019 | väggmonterat lutande växthus, plast/stål | aosom:84H-195V01WT |

Två observationer om diversiteten innan Steg 5:

- `9cdca665` och `a7d1a29b` är båda genomskinliga tunnlar med 40 clips och
  vindklass 5 — men golvytan skiljer nästan på hälften (297×395 cm mot
  300×200 cm), så de är verkliga syskon i olika storlek, inte samma produkt
  två gånger. `a7d1a29b`s spec-block har dessutom en känd anomali
  (`Mått: Mittelgröße` i stället för siffror) — Lieferumfang/Technische
  Daten bär de riktiga måtten, så texten skrivs mot dem, inte mot
  spec-blocket. Ingen egen prosa upprepar "Mittelgröße".
- `dd97fbc9` är samma breda konstruktionsklass som runda 144:s `c816963e`
  (trä + polykarbonat-skåp), men betydligt större (132 cm mot 78 cm högt),
  tre hyllplan mot två, och med LÅSBARA dörrar — en verklig storlekssyskon,
  inte en dubblett.

## Steg 2 — legal grind: samma familj, samma regler, omprövad

Samma växthusfamilj som runda 50 och 144. Materialen i de nio produkternas
källtext (avläst i prisgrindens `sourceUrl`/produktnamn, fullständigt
verifieras i Steg 5): förzinkat stål, PE-folie, aluminium/stål med
pulverlack, massivt trä, polykarbonat, plast — **ingen nämner glas eller
härdat glas**. Vindklasserna (Windfestigkeitsstufe 4/5) är leverantörens
egen skala, inte en EN/ISO-standard, och citeras som sådan i Steg 7 (samma
regel som runda 144). Inget bygglovspåstående läggs till i kundtexten.

Regeln håller oförändrad; ingen ny motivering behövs utöver vad runda 50 och
144 redan lade fast.

## Steg 4/5 — nästa steg

Full källäsning (Beschreibung/Technische Daten/Lieferumfang tre gånger per
produkt) och bildgranskning görs i nästa fil innan text skrivs.
