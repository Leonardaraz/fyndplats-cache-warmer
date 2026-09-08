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

## ⚠️ Kollen är ett SCREEN, inte en dödslista (tillägg samma dag)

Körd över hela fåtöljbeståndet gav den vida kollen 40 krockar på 121 kluster.
Minst tre av dem är falsklarm, och alla tre av samma orsak: **kandidatens
trippel var inte produktens fotavtryck.**

```
9276f63e  81 × 33 × 62   mot en kontorsstol      ← paketmått
b47f2372  30 × 24 × 10   mot en gamingstol       ← fjärrkontroll eller kartong
6afc0a29  87 × 88 × 108  mot en publicerad tv-fåtölj
```

Den sista är den lärorika. Måtten ligger inom toleransen, men produkterna är
olika: **100 kg mot 135, ingen lyft mot elektrisk 45°, konstläder mot
linnelook.** Tre spec-fält skiljer dem åt, och bara ett öga på specen ser det.

Två följder:

1. **Kräv att trippeln är rimlig som fotavtryck** innan den jämförs — för en
   möbel: största måttet ≥ 60 cm. Utan det matchar en kartong mot en stol.
2. ☠️ **En träff är ett SKÄL ATT TITTA, aldrig ett beslut.** Samma hållning som
   `utanKatalogreferens` i mediainventeringen: listan är ett underlag för en
   människa. Bekräfta mot maxlast, mekanism och material innan något kallas
   dubblett — och innan något kallas rent.

## ✅ En ANNAN session kom fram till samma sak samma dag — oberoende

Grenen `claude/seo-polering-runbook-review-bz3j9l` byggde om sin "runda 103"
2026-09-08 och skrev i sitt commit-meddelande:

> Deras klustring gick på MÅTTEN och hittade en till.
> Regeln skärps: kluster på måttraden, aldrig på namnet — inte ens på hela
> namnet.

Den sessionen hade valt sin batch på hela det tyska produktnamnet och fått
FYRA identiska stolar; K12:s urval gick på måtten och fick FEM. Den femte,
`a0760ed1`, heter `Massagesessel mit Wärmefunktion, drehbarer Schaukelsessel`
i stället för `…mit Wipp-, Liege- & Wärmefunktion` — samma stol, annat namn.

Det är #218 uppmätt från andra hållet: **familjefiltret är ett NAMNfilter.**
Två sessioner, två olika sortiment, samma slutsats på en dag — och det är
skälet att lita på den. En mätning som bara en session gjort kan vara ett
artefakt av just det urvalet.

⚠️ Två sessioner polerar dessutom samma katalog samtidigt (#144, #262, #302 i
deras räkning). Läs den andra grenens senaste commit innan en batch väljs;
`505eb413` låg i BÅDA rundornas urval och togs bort ur deras.

## ☠️ Skärmen jämför utkast mot PUBLICERADE — aldrig utkast mot utkast (2026-09-08)

Hela mätningen ovan, och den K13 byggde på, ställer en kandidat mot katalogens
publicerade sidor. Den frågar aldrig om två KANDIDATER är samma vara. Uppmätt
under K14:s urval, hela utkastbeståndet:

| | |
|---|---:|
| Utkast i lager med fotavtryck | 2 254 |
| Kollisioner mot publicerade sidor | 604 |
| **Kvar efter den skärmen** | **1 650** |
| Fotavtryckskluster bland dessa | 1 268 |
| Ensamma i sitt kluster | 848 |

⚠️ **Talet 1 406 "i flerkluster" är INTE 1 406 dubbletter, och får inte skrivas
så.** Klustringen är transitiv (union-find): A liknar B, B liknar C, alltså
hamnar A och C i samma kluster även när de inte liknar varandra. Det syns i
utfallet — det största klustret har 26 medlemmar och spänner 899–8 399 kr, och
en soffa på 5 249 kr kedjades in i ett kluster med konstgjorda krukväxter via
ett delat tillbehörsmått. Samma fälla som paketmåtten: **en träff är ett skäl
att titta, aldrig ett beslut.**

Det som däremot är hårt är PAR med samma namn OCH samma trippel:

```
34341c4f : 3e6f2d24    8 769 / 8 769   spann      0 kr
828ccd93 : e071b2a6    6 839 / 6 669   spann    170 kr
94d330fb : de22ee2a    5 799 / 5 279   spann    520 kr
5531de28 : 59aeb88a    5 339 / 4 699   spann    640 kr
4ac48a3f : 5439026e    5 249 / 5 239   spann     10 kr
53b4a3b9 : 04f305ad : 213ddf65         spann    540 kr
```

**Regeln: en batch måste skärmas mot sig själv och mot resten av utkasten, inte
bara mot butiken.** Utan det steget kan en runda publicera två sidor för samma
vara i samma svep — precis den interna dubblett Google straffar, och den som
avsnittet "Den farliga dubbletten är intern" i CLAUDE.md handlar om.

### ☠️ Och den FÖRSTA raden i tabellen är den föräldralösa produkten

`3e6f2d24` är utkastet CLAUDE.md dokumenterar som föräldralöst: nattkörningen
2026-08-31 skapade produkten och föll sedan på Wix postgräns, så ingen
mappningsrad pekar på den. Anteckningen säger att den ska granskas av en
människa. Den säger INTE det som nu är mätt:

```
34341c4f  L-förmiges Ecksofa …  8 769 kr  revision 1  beskrivning 2 330 tecken
3e6f2d24  L-förmiges Ecksofa …  8 769 kr  revision 1  beskrivning 2 330 tecken
slug:     …-couch-mit-2-3   respektive   …-couch-mit-2
```

Identiska på varje fält. Den föräldralösa produkten är alltså inte bara
bokföringslöst skräp — den är en **dubblett av en levande kandidat**, och den låg
på plats två i urvalslistan sorterad på pris. Utan den här skärmen hade den
kunnat poleras: den ser i katalogen ut som vilket utkast som helst, och det är
först `/api/admin/mapping` som svarar 404 på den.

⚠️ Wix suffix `-3` på syskonets slug betyder att slug-basen krockat mer än en
gång. Ett tredje exemplar är alltså möjligt — det syns inte i den här mätningen
eftersom skärmen bara läser utkast som är IN_STOCK och bär ett fotavtryck.
