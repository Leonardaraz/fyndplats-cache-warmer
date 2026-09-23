# Runda 146 — Steg 1–2: familjeval, prisgrind, legal grind

## Steg 1 — nästa batch ur växthusfamiljen

Efter runda 145 (nio växthus) återstår ~65 kärnväxthus av de tidigare
~74. Tio kandidater plockades ut spridda över konstruktionstyp och pris,
filtrerat bort camping-/husdjurs-/leksakstunnlar (`Tunnelzelt`,
`Katzentunnel`, `Hunde-Agility`, `Krokodil Spieltunnel`), reservdukar
(`Gewächshausfolie`/`Ersatzfolie`/`Ersatz-…abdeckung`) och
Hochbeet-hybrider (`Hochbeet mit Gewächshaus-…`) enligt samma regel som
runda 144/145 använde.

Alla tio klarade prisgrinden (`stämmer: true`). `b5ba12b8` — samma produkt
som uteslöts i runda 145 för `aosomSyncedQty: 0` — har nu **27 i lager** och
går med i rundan.

**Tio produkter går vidare**, åtta-nio distinkta konstruktioner:

| pid | wixProductId | pris | konstruktion | supplierProductId | frakt/inköp |
|---|---|--:|---|---|--:|
| `be595bfd` | be595bfd-afc4-4929-bd9d-8ed575294271 | 959 | foliehus med nätfönster, rullbar dörr | aosom:[artikelnr] | 0,395 |
| `d99cc578` | d99cc578-edfc-41da-829b-db886df6e508 | 1 649 | 2,7×2×2 m foliehus med hyllor, rullbart | aosom:[artikelnr] | 0,371 |
| `5556a448` | 5556a448-00b5-4566-983b-4f41aed116d7 | 1 469 | genomgångsbar polytunnel, förzinkat stål | aosom:[artikelnr] | 0,422 |
| `eadb1015` | eadb1015-5084-4a4d-a743-cc04780a29e3 | 849 | väggmonterat, tillgängligt växthus | aosom:[artikelnr] | 0,426 |
| `ed4fd2a9` | ed4fd2a9-bba9-469a-a116-7c5fff7c9b22 | 959 | portabelt växthus, stålram | aosom:[artikelnr] | 0,431 |
| `2b5c2a89` | 2b5c2a89-bc91-4e05-aafa-eb558c5e7559 | 1 339 | foliehus med fönster+dörr, stål | aosom:[artikelnr] | 0,37 |
| `94ee540a` | 94ee540a-843b-438b-b83d-9350345d999b | 859 | miniväxthus med hyllor, UV-beständigt nätfönster | aosom:[artikelnr] | 0,47 |
| `6e60b45a` | 6e60b45a-a303-47f3-ae1d-6e9c9ac5f394 | 879 | drivbänk trä/polykarbonat, 90×46×40 | aosom:[artikelnr] | 0,41 |
| `f837b05d` | f837b05d-99cc-4c72-9c0d-5b5bd63a0a9a | 859 | tomatväxthus med nätfönster | aosom:[artikelnr] | 0,465 |
| `b5ba12b8` | b5ba12b8-7b0f-416e-8077-15785ec32f85 | 6 029 | premiumväxthus, takfönster, skjutdörr, transparent | aosom:[artikelnr] | 0,219 |

Två supplierProductId-par delade samma pris (859 kr: `94ee540a`/`f837b05d`;
959 kr: `be595bfd`/`ed4fd2a9`) — löst genom att köra `las`-anropen sekventiellt
(en i taget, inte parallellt) för de fyra produkterna tills varje
supplierProductId kunde knytas till exakt ett wixProductId, i stället för
att gissa utifrån triggerordning. Samma landmina som gjorde att runda 145
inte kunde lita på triggerordning för `stampla`-anropen — här gällde det
`las`-anropens ordning i stället.

Ingen produkt behövde uteslutas den här rundan.

## Steg 2 — legal grind: samma familj, samma regler, omprövad

Samma växthusfamilj som runda 50, 144 och 145. Preliminär läsning av
produktnamnen visar samma materialklasser som tidigare (förzinkat stål,
PE-folie, polykarbonat, aluminium/stål) — full verifiering görs i Steg 5
mot Beschreibung/Technische Daten. Ingen produkt heter något som antyder
glas eller härdat glas. Vindklasser (där de förekommer) citeras som
leverantörens egen skala, inget bygglovspåstående läggs till.

Regeln håller oförändrad; ingen ny motivering behövs utöver vad runda 50,
144 och 145 redan lade fast.
