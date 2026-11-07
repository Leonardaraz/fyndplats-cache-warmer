# runda-vevor-leksak-9b: parkerade utkast med AE-tvilling

Fem VEVOR-utkast vars text är skriven och grindad i runda leksak-9 men **inte skriven till Wix**, eftersom
varje utkast är samma vara som en publicerad AE-sida från VEVOR:s egen AE-butik
(`FLAGGADE-VEVOR.md` (je) och (jf)). De får inte publiceras som egna sidor innan Leonard har svarat.

| utkast | AE-sida | vara | att lösa före skrivning |
|---|---|---|---|
| `e12189ca` | `9afb5483` | åkbil för småbarn med musikratt | ommappa AE-sidan (hundvagnsreceptet) |
| `71468dce` | `d1eaec20` | aktivitetsbord med rymdtema för baby | ommappa; åldern (6–18 mot 6–36 månader) och höjden (20 mot 31,8 cm) skiljer |
| `b547ab50` | `583cd7c0` | golfspel för trädgården | flera utföranden (3, 6 och 9 hål) på AE-sidan: ommappas inte |
| `1907df26` | `2239b907` | rosa utklädningsgarderob | ommappa AE-sidan |
| `709bbeaa` | `a86a2e9a` | utklädningsgarderob i trä | ommappa AE-sidan |

Filerna är rundans vanliga rotfiler (`<id8>.html`, `namn.tsv`, `kallor.json`, `skrivplan.json` med flera). Skrivplanen
bär utkastens id och duger inte mot AE-sidorna: efter en ommappning byggs en ny runda där `ids.tsv`, `lager.tsv`,
`variant.tsv` och `skrivplan.json` läses ur AE-sidan, medan texten, alt-texterna och källblocken kopieras härifrån
(`vevor.md`, *Är VEVOR-dubbletten ett osynligt utkast: ommappa AE-sidan och polera den som en VEVOR-sida*).
Kategorierna i `kategori.tsv` är planerade för sidorna: `Barn & Familj` med `Leksaker & Spel`, `Baby & Småbarn`,
`Utelek & Spel` eller `Barnmöbler`; importens egen `Leksaker & Spel` tas bort med engångsskriptet (`kategori-bort/`)
när en ny kategori har lagts till.
