# Dubblettkollen: matcha TRIPPEL, inte etikett och inte lösa tal (2026-09-08)

Ett utkast får inte publiceras om samma fysiska vara redan ligger ute. Två
egna URL:er med samma foton är den dubblett Google faktiskt straffar, och
katalogen är full av dem: Aosom listar samma stol under flera namn.

## Mätningen som avgjorde metoden

Åtta kandidater ur `Relaxsessel`-familjen, ställda mot HELA den publicerade
katalogen på två sätt samma dag:

| | |
|---|---:|
| Publicerade sidor | 2 378 |
| …med tolkbar `Mått:`-rad | **454 (19 %)** |
| …med NÅGON trippel `a × b × c cm` i texten | **1 698 (71 %)** |

| metod | träffar |
|---|---:|
| strikt: bara mot `Mått:`-raden | **0** |
| vid: varje trippel var som helst i texten | **8** (minst 7 äkta) |

Den strikta kollen hittade alltså **ingenting** — och sju av de åtta är
riktiga dubbletter, två av dem i samma FÄRG som en levande sida.

## ☠️ Regeln, och varför den föregående var fel

Matcha på **trippeln** (bredd, djup, höjd) med ±1 / ±1 / ±2 cm, var som helst
i beskrivningen. Aldrig på lösa tal. Aldrig bara på den etiketterade raden.

`#187` skrev "jämför mot måttraden, inte mot varje siffra på sidan" efter att
en lös jämförelse gett fyra falsklarm i K12. Slutsatsen blandade ihop två
olika saker:

- **Varje löst TAL** ger falsklarm — en sida innehåller dussintals tal.
- **Varje TRIPPEL** är lika strikt som måttraden, för tre tal i ordning med
  `cm` efter sig är ett mått och inget annat.

Skillnaden är täckningen. Etiketten varierar per runda (`Mått`, `Måtten`,
`Mått och material`, …) — det är samma glidning som `#146` beskriver. Trippeln
varierar inte.

## ⚠️ En nolla från den strikta kollen är inget friskintyg

Den mäter etiketten, inte katalogen. Samma familj som SEO-backfillens nolla
(2026-09-07): *en nolla från en klassificerare mäter klassificeraren.*

Och den vida kollen är i sin tur ett GOLV: 29 % av de publicerade sidorna bär
ingen trippel alls och kan inte prövas den här vägen. För dem gäller
bildgrinden (`dubblettgrind.py`) — de två fångar OLIKA dubbletter (`#194`).

## Kopiera det här

```js
const trip = [...text.matchAll(/(\d{2,3}(?:,\d)?)\s*[×x]\s*(\d{2,3}(?:,\d)?)\s*[×x]\s*(\d{2,3}(?:,\d)?)\s*cm/g)]
  .map(m => m.slice(1, 4).map(x => parseFloat(x.replace(",", "."))));
const träff = trip.some(t =>
  Math.abs(t[0] - kb) <= 1 && Math.abs(t[1] - kd) <= 1 && Math.abs(t[2] - kh) <= 2);
```

Räkna alltid ut och skriv ned täckningen (hur många publicerade sidor som bar
en trippel) tillsammans med antalet träffar. Utan täckningen går en nolla inte
att läsa.
