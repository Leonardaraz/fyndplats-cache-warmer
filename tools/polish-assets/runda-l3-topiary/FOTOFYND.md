# Runda L3 — vad fotona sa innan en enda rad text skrevs

Kontaktarken byggdes FÖRE brödtexten (J1-regeln, #175). Åtta fynd, och fem av
dem hade ingen grind kunnat fånga: de är riktiga utsagor om produkter som inte
finns, eller tysta felöversättningar av ett fält.

## 1. `8802b999` — ingen kruka ingår, och varje livsstilsbild visar en

`Lieferumfang: 2 x Künstliche Pflanze`. Leveransen är **klot + svart tallrik +
spett**, ingenting annat. Men fyra av fem bilder visar kloten nedstuckna i
krukor: en vit kruka i måttritningen, terrakotta i trädgårdsbilden, keramik i
vardagsrummet. Måttritningen dimensionerar till och med spettet (16 cm) NER I
en vit kruka.

Exakt samma klass som L1:s `0e520c93`, där bilderna visade ett par träd och
lådan innehöll ett. Det måste stå rakt ut i texten.

Bladen är dessutom **tvåfärgade** — ljust gulgröna och mörkgröna runda blad om
vartannat. Det är den tydligaste skillnaden mot `45fd6bc6`.

## 2. `45fd6bc6` — måttritningen är i TUM

`27.6"` och `15.7"` står i bild 3, alltså 70 cm och 40 cm. Kunden som tittar på
bilden ser tum; vår spec ger cm. Alt-texten ska ge centimetrarna.

Detaljbilden (4) visar en **grön plaststam**, en svart tallrik och ett
fyrkantigt svart spett — ingen träimitation någonstans. Källan säger PE, och
bilden motsäger den inte.

☠️ **Och den avfärdar #247:s notering om ett färgsyskonpar.** `45fd6bc6` och
`8802b999` är inte samma vara i två färger. De har olika bladtyp (buxbom mot
eukalyptus), olika täthet, olika totalhöjd (70 mot 56 cm) och olika spettlängd
(26 mot 16 cm). Det är två produkter, inte två färger — och det gick bara att
se på fotot.

## 3. `0f36e5a0` — det STÖRSTA klotet sitter ÖVERST

Källan ger `Ø20 cm, Ø25 cm, Ø30 cm` men säger ingenting om ordningen. Både
produktbilden och måttritningen visar största klotet högst upp, mellersta i
mitten, minsta nederst. Det är tvärtemot hur en formklippt stapel oftast ser
ut, alltså värt att säga i klartext.

Stammen är **två sammanflätade grenar**, inte en rak stam, och kloten sitter
förskjutna i sidled — omväxlande åt vänster och höger. Det är det som får den
att läsa som ett träd i stället för en stapel.

⚠️ **Och det är ETT träd.** `Lieferumfang: 1 x künstliche Pflanze` — ensam i
rundan om det; de sju andra är 2-pack. Krukan är en enkel svart odlingskruka,
vilket källan själv säger är meningen ("bereit, in Ihren Lieblings-Dekotopf
gestellt zu werden").

## 4. `cf111505` — källan säger BLADEN, fotot säger PLANTAN

Källan, två gånger: `306 PE-Blättern in Tränenform` och
`Realistisch geformte, tränentropfenförmige Blätter`.

På fotot är bladen små, runda, vanliga buxbomsblad. Det som är droppformat är
**hela busken**: bred nedtill, avsmalnande mot en rundad topp.

⚠️ Ingen grind kunde ha fångat det. Siffergrinden är ren (306 står i källan),
svenskan är korrekt, mönstergrindarna är rena. Felet hade varit en riktig
utsaga om ett blad som inte finns — samma klass som J1:s golvlampa med två
skärmar.

Stammen är ett rakt svart plaströr; krukan är svart med grön flockad "jord" på
ytan. Plantan är bredare än krukans Ø20.

## 5. `47f6059d` — `Farbe: Weiß` är BLOMMANS färg, inte plantans

En rak översättning av specraden hade gett `Färg: vit` och beskrivit en vit
växt. Plantan är grön; det vita är lavendelblommorna.

Det är dessutom ett **tvåkulligt** träd — källan säger bara totalhöjd. Och
`Gesamtgröße: Ø15 cm` är KRUKANS mått: måttritningen ger nedre klotet 25 cm,
alltså tio centimeter bredare än specradens `15L x 15B`. Skriv aldrig Ø15 som
plantans bredd.

## 6. `11749e12` — mindre klotet sitter överst

Måttritningen märker övre klotet `22 cm` och nedre `27 cm`. Källan ger båda
talen utan ordning; ritningen avgör.

Stammen har **barktextur** men materiallistan säger `PE, Zement`. Skriv
utseendet, inte materialet. Små skott sitter kvar nedtill på stammen ovanför
krukkanten. Bild 4 och 5 är rena bladstudier — bra alt-material.

## 7. `72c55471` — oval, inte klot

En enda avlång kropp på kort stam, i en klassisk konisk kruka med kant. Jorden
är grön och flockad, tydligt synlig. Vid 60 cm är den lika mycket en bordsväxt
som en golvväxt, och bilderna säger samma sak: tre av fem visar den på en
byrå eller ett sideboard.

## 8. `d59d9b40` — enda produkten i rundan med en dekorativ kruka

Fyrkantig flätad gråbrun plastkruka 15 × 15 × 15 med dekorsten ovanpå. De
övriga sju har svarta odlingskrukor eller ingen kruka alls. Den är också
billigast i rundan och den enda vars bilder uteslutande är inomhus, på bord
och hyllor.

## ☠️ Två bilder bär tysk text inbränd i pixlarna

`72c55471-5` och `d59d9b40-5` är fotograferade i samma rumsmiljö, och i båda
hänger en inramad affisch som fyller övre halvan av bilden:

```
ICH WILL NICHT OHNE DICH SEIN,
LASS UNS TEILEN, WAS WIR HABEN
```

Den går inte att polera bort. Båda står i `bilder-bort.tsv`. Kvar blir fyra
bilder per produkt, vilket är över gränsen för eget spec-kort.

Inga andra av rundans 40 bilder bär text. Kontaktarken lästes vid 430 px per
cell, och affischen var läsbar där — upplösningen räcker för inbränd text,
som är rubriksatt när den förekommer.
