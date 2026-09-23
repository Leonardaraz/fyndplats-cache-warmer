# ☠️ Polisbilen var en dubblett — och det syntes inte i något namn

`9308a7dc` (2 079 kr, `visible:false`) var näst på tur att poleras. Den blev
aldrig skriven: en dubblettkoll mot de publicerade sidorna hittade
**`elbil-barn-polisbil-12v-fjarrkontroll`**, `4e85a6b7`, 2 339 kr, live sedan
2026-07-01.

## Beviset är TALEN, inte namnen

De tyska och svenska namnen har ingenting gemensamt. Nio tal har det:

| | utkastet `9308a7dc` | publicerade `4e85a6b7` |
|---|---|---|
| Mått | 96 × 60 × 45 cm | **96 × 60 × 45 cm** |
| Sits | 33 × 21 cm | **33 × 21 cm** |
| Sitthöjd | 21,5 cm | **21,5 cm** |
| Hjul | Ø24 cm | **Ø24 cm** |
| Batteri | 12 V 4,5 Ah | **12 V 4,5 Ah** |
| Hastighet | 3–7 km/h | **3–7 km/h** |
| Körtid | 45 min | **45 min** |
| Laddtid | 8–10 h / 8–12 h | **8–10 h / 8–12 h** |
| Fjärrkontroll | 15 m | **15 m** |

Och bilderna avgör det bortom tvivel: samma dekaler (`POLICE`, `999`,
`AGENCY`, `PURSUIT 9-9-9`), samma blågula rutmönster, samma navkapslar med
`P`, samma registreringsskylt.

## Det är precis den dubblett `CLAUDE.md` beskriver

Den publicerade sidan är en **AliExpress**-rad — och säljaren är Aosoms egen
butik:

```
supplierProductId  1005010017272881
sourceUrl          aliexpress.com/item/1005010017272881.html
supplierName       "Sold ByAosom ES (EU) Store(Trader)"
```

Feed-importens dubblettspärr nycklar på `supplierProductId` och kan omöjligt
se det: `aosom:370-402V90MX` och `1005010017272881` är två olika strängar för
samma fysiska vara. Spärren gjorde alltså exakt vad den är byggd för, och
missade ändå.

## Utfall: ommappad enligt Leonards regel 2026-09-03

Sidan vi BEHÅLLER pekar nu på Aosoms artikelnummer; utkastet är pensionerat.

| | före | efter |
|---|--:|--:|
| leverantör | aliexpress | **aosom:370-402V90MX** |
| landad kostnad (inkl. moms) | 1 779,54 kr | **1 726,60 kr** |
| kundpris | 2 339 kr | **2 339 kr (ORÖRT)** |
| marginal | 23,92 % | **26,18 %** |
| fraktandel | — | 0,212 |

Bytet är alltså inte bara en dubblettstädning: samma vara direkt ur feeden är
53 kr billigare i inköp, och fraktandelen på 21 % är långt under medianens
40 %. Verifierat vid återläsning av rutten.

## ☠️ Och det ändrar Steg 1 för hela familjen

Runda 104:s Steg 1 valde batchen ur POLERINGSKÖN och kontrollerade inte
utkasten mot publicerade sidor. Det är samma fel som `#346` beskriver, ett steg
till: kön vet inte vad butiken redan säljer.

Måttsvepet är därför byggt och kört på resten av rundan — se
`STEG1-MATTSVEP.md`.
