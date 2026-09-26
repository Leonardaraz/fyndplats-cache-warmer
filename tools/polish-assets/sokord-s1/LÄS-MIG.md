# Sökordspass S1 — produktsidor på plats 11–30 (2026-09-24)

Leonards beslut 2026-09-24 ("Kör båda") gällde två saker: att N57 och senare
rundor väljer sökord på Semrush-data, och ett pass över redan publicerade
sidor som rankar på plats 11–30, där ett skarpare namn, en skarpare titel och
en skarpare metabeskrivning kan lyfta dem till sida 1. Det här är det andra.

## Underlaget

Semrush `resource_organic`, databas `se`, mål `www.fyndplats.se/produkt/`,
position 11–30, sorterat på volym, 100 rader (1 000 enheter). Efter att dubbla
rader för samma sökord och sida slagits ihop blev det **97 sökord på 71
sidor**. Allt står i `baslinje-2026-09-24.tsv`, som är facit för
ommätningen.

## Det som mättes: premissen höll för 5 sidor av 67, inte för 30

Namnet, SEO-titeln och metabeskrivningen lästes för alla 71 sidor. 67 fanns i
katalogen. **Nästan alla bär redan sitt rankande sökord först i både namn och
titel**, eftersom poleringen redan satt huvudordet först. Exempel:
`uppblåsbart tält` (3 600/mån, plats 28) har namnet "Uppblåsbart tält för 2–3
personer …" och titeln "Uppblåsbart tält 2–3 personer …". Att skriva om 30
sådana titlar hade flyttat ord som redan står rätt.

För de sidorna är det alltså inte titeln som håller dem kvar på sida 2–3.
Kvar står innehållets djup, interna länkar och sidans auktoritet.

Fem sidor hade ett verkligt glapp mellan sökfrågan och sidans ord, och bara
de skrevs om:

| sida | sökfråga (sökningar/mån, plats) | glappet |
|---|---|---|
| `cea8abf6` volleybollnät | volleybollnät med stolpar (720, 24) | namnet sa "Volleybollnätset med stålstolpar" |
| `bfbc4587` spaljé | spalje metall (480, 24), spalje i metall (390, 23), spalje till/för rosor (260 + 260) | varken "i metall" eller "rosor" stod i namnet |
| `3c0f58f1` högskåp med tvättkorg | badrumsskåp med tvättkorg (320, 22) | titeln sa "med inbyggd tvättkorg" |
| `e9771aa9` eldstadsverktyg | eldgaffel (590, 25) | ordet saknades i titeln |
| `a212833b` stödben | stödben till husbil (720, 28), stödben husbil (590, 24), stödben till/husvagn (390 + 390) | titeln sa "Stödben husvagn & husbil" |

Ändringarna står i `plan.tsv`. Slugarna är orörda, och brödtexten likaså.
Namnet ändrades på fyra sidor. På högskåpet ändrades bara titeln och
metatexten, eftersom namnet leder med "Högskåp badrum".

Talen i de nya texterna finns alla på den publicerade sidan (`live/`).
`gate-seo.py` gav 0 fynd, och språkgrindarna i `gatelib` gav 0 fynd på
namnen.

## Så skrevs det

ExecuteWixAPI, en PATCH per sida med `fieldMask` `name` + `seoData` (bara
`seoData` på högskåpet) och en färsk revision. Kontrollsumman (FNV-1a på namn,
titel och metatext, `vantad-summa.tsv`) räknades om i SAMMA anrop som
skrivningen, och en avvikelse hade avbrutit alla fem. SEO-datan har två
taggar och tomma nyckelord, samma form som skrivrutten.

Utfall: 5 av 5 skrivna, revisionen steg ett steg på varje sida, och
synligheten var `true` både före och efter.

En separat återläsning några minuter senare gav samma kontrollsumma på
alla fem. Varje sida har två SEO-taggar och noll nyckelord, alla
varianter är synliga, och slugarna är oförändrade.

## Ett fynd utanför passet: en rankande adress leder till `/alla-produkter`

Fyra rankande adresser fanns inte längre i katalogen. Alla fyra svarar 308:

| gammal slug | leder till | rankar för |
|---|---|---|
| `sladdlos-handdammsugare-bil` | ny produktadress | handdammsugare bil (390, 18) |
| `skrivbord-120-cm` | ny produktadress | skrivbord 120 (260, 22) |
| `robust-paraply-med-uv-skydd` | kategorin solskydd och paviljonger | uv paraply (390, 12) |
| `4-pack-glas-ribbad-design` | **`/alla-produkter`** | ribbat glas (480, 28) |

Den sista bryter både runbookens och redirect-workflowens regel: en
redirect till `/alla-produkter` räknar Google som en soft 404. Katalogen har
inga räfflade dricksglas, alltså finns ingen ersättare, och målet bör vara
en köks- eller glaskategori. Raden är inte ändrad här. Det är Leonards
beslut.

## Ommätning

Mät samma sökord igen om 4–6 veckor (kring 2026-10-29) med samma
Semrush-anrop, och jämför mot `baslinje-2026-09-24.tsv`. De fem skrivna
sidorna ska jämföras mot de 62 orörda. De orörda är kontrollgruppen, så en
allmän rörelse i sökresultaten inte tas för en effekt av passet.
