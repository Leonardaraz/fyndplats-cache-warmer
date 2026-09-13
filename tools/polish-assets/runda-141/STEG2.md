# Runda 141 — Steg 2: laglighetsgrind för träningsbänkarna

Familjen är **inte** en djurbostad, inte en elprodukt och inte en barnvara, så
L80, elsäkerhet och EN 71 gäller inte. Två saker gäller i stället, och båda är
mätta i leverantörens egen text — inte antagna.

## ☠️ 1. "300 kg" är INTE vad kunden får väga

Tre av de tre hittills lästa utkasten anger flera olika kapaciteter, och den
STÖRSTA siffran är den som står i marknadsföringen:

| pid | marknadsraden säger | leverantörens egen tekniska data |
|---|---|---|
| `8de3c3ef` | *"Stahlrahmen … belastbar bis 300 kg"* | Gesamtbelastbarkeit **300 kg**, **Maximales Benutzergewicht 120 kg** |
| `a4bbe667` | — | 25 kg bensträckarstång · 25 kg bicepsstång · 150 kg skivstångsställ · **150 kg max användarvikt** · 300 kg bänk |
| `18b94738` | *"Maximale Belastung 120 kg"* | Belastbarkeit **120 kg** (konsekvent, ingen motsägelse) |

En kund som läser "bärs upp till 300 kg" drar slutsatsen att hen får väga
300 kg. Det gör hen inte: på `8de3c3ef` är gränsen **120 kg**, på `a4bbe667`
**150 kg**. Skillnaden är faktorn 2–2,5 på en produkt där brott betyder att
någon faller baklänges med en skivstång över bröstet.

☠️ **Regeln för rundan: den siffra som får stå som "maxlast" är
`Maximales Benutzergewicht`.** Totalkapaciteten får nämnas, men bara
etiketterad som vad den är, och aldrig ensam. Den publicerade grannen
`justerbar-traningsbank` gör redan exakt rätt och är facit för formen:

```
Maxlast (användare): 120 kg
Viktstöd: max 25 kg; total kapacitet 300 kg
```

⚠️ Detta är samma klass som #289 (fyra fåtöljer med två olika maxlaster för
samma konstruktion), men dyrare: där var motsägelsen mellan två källor, här
är det två OLIKA STORHETER som ser ut som samma sak.

## ☠️ 2. Materialpåståendet på `8de3c3ef` är motsagt av leverantören själv

| källa | säger |
|---|---|
| brödtexten | *"Der stabile **Stahlrahmen** trägt bis 300 kg"* |
| punktlistan | *"Robuster und stabiler **Stahlrahmen**…"* |
| **Technische Daten** | **Sperrholz, EPE-Schaumstoff, PVC** |
| **spec-blocket (feedens kolumner)** | **Holz/Polyvinylchlorid** |

Två tekniska källor säger trä, två marknadsrader säger stål. Fraktvikten
**10 kg** talar för trä — en stålbänk i den storleken väger mer.

**Ingen "stålram" får skrivas.** Bilden avgör i Steg 4/5; tills dess är
materialet oskrivet. Samma familj som #259 (MDF är inte massivt trä) och
#472 (spec och tyska ljuger åt olika håll) — men här är det marknadsraden
som är den ensamma avvikaren, vilket gör den lätt att falla för.

⚠️ `18b94738` påstår `Massivholz` i punktlistan och `Buche` i tekniska data.
Bok ÄR ett massivträslag, så de motsäger inte varandra — men "massivt" är
ändå ett påstående om konstruktionen, inte om träslaget, och ska bekräftas
på bilden innan det skrivs.

## ⚠️ 3. Vad som INTE ingår måste stå

`a4bbe667`: *"Hantelscheiben nicht im Lieferumfang enthalten"* — vikterna
ingår inte. Sidan säljer en bänk med skivstångsställ; en kund som tror att
skivorna följer med får en tom order. Lieferumfang är kontraktet (#468):
`1 x Hantelbank, 1 x Anleitung`, punkt.

`8de3c3ef` heter *"mit Beinstrecker"* men varken Lieferumfang eller
Technische Daten nämner en bensträckare. **Namnet är inte en källa** (#462)
— bilden får avgöra, annars stryks ordet.

## Vad grinden INTE fäller

Ingen av produkterna kräver CE-märkning i någon direktivfamilj vi kan belägga,
och ingen svensk myndighetsregel styr hemmaträningsutrustning. `EN 957`/
`EN 20957` finns som standard för stationär träningsutrustning, men **inget i
leverantörens underlag säger att bänkarna är provade mot den** — och ett
standardnamn utan belägg är exakt den ogrundade certifieringen som fälldes i
runda 54 (#252). Skrivs inte.
