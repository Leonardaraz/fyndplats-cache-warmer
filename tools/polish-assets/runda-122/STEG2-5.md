# Runda 122 Steg 2 och 5 — laggrind och sju motsägelser

## Steg 2: laggrinden

| fråga | dom |
|---|---|
| El i produkten? | **Nej.** Ingen av de fyra har sladd, motor eller batteri. |
| CE-märkning? | **Får inte påstås.** Ingen elsäkerhets- eller maskindirektivsgrund. |
| Energimärkning? | Ej tillämplig. |
| Barnprodukt (EN 71)? | Nej — arbetsredskap för vuxna. |
| Livsmedelskontakt? | Nej. |

⚠️ **"Professionell" är ingen certifiering.** Ordet får beskriva var vagnen
är tänkt att användas (hotell, skola, kontor) — aldrig som ett kvalitetsintyg.
Samma avgränsning som runda 121.

☠️ **Moppen INGÅR INTE på någon av de fyra.** Leverantörens `Lieferumfang`
säger `1 x Reinigungswagen` plus monteringsanvisning på tre av dem, och bara
`1 x Putzwagen` på den fjärde. Varje sida måste säga det rakt ut — och
`0cbffcd9` är den där det spelar mest roll, se Steg 4.

## ☠️ Maxlasten är obrukbar på ALLA FYRA — samma fälla som runda 121

Leverantören anger ett totalt lasttal per vagn. Det går inte ihop med
hinkvolymen, och han säger inte vilket av talen som gäller vad:

| vagn | angiven maxlast | hinkvolym | vatten väger då |
|---|--:|---|--:|
| `6490e360` | 15 kg | 2 hinkar à 37,5 × 35 × 31,5 cm | långt över 15 kg |
| `0cbffcd9` | 25 kg | 2 × 18 L | **36 kg** |
| `740fa6d0` | 25 kg | 2 × 18 L | **36 kg** |
| `832f9eec` | 25 kg | 2 × 18 L + 2 × 6 L | **48 kg** |

Ett fyllt hinkpar väger alltså mer än vagnen sägs tåla, på varenda modell.
Antingen är talet bara hyllornas, eller så får hinkarna inte fyllas — och
leverantören skiljer inte på det.

**Beslut: talet står inte på sidan.** Samma väg som runda 121 valde för
`da0f30b2` och `d8ebb279`. Att skriva ut "tål 25 kg" bredvid "två 18-litershinkar"
hade varit en instruktion kunden inte kan följa, och att gissa vilken del talet
gäller vore ett påhittat tal. Frågan går till Leonard.

## Steg 5: sju motsägelser i leverantörens egen data

Importens svenska spec-block byggs ur feedens STRUKTURERADE kolumner; den tyska
brödtexten är leverantörens marknadstext. De två är oense sju gånger, och tre
gånger avgörs det av bilden (uppgift #447: tre källor, inte två).

| # | produkt | fält | feedens kolumn | tysk text | bilden | dom |
|---|---|---|---|---|---|---|
| 1 | `6490e360` | färg | Grau, **Grün**, Schwarz | Blau + Rot | blå + röd hink, grått chassi | **bilden** |
| 2 | `740fa6d0` | färg | Schwarz, **Beige, Braun** | Schwarz+Blau+Orange | svart ram, blå säck, orange + blå hinkar | **bilden** |
| 3 | `832f9eec` | mått | 100 × 70 × 103 | **93 × 80 × 97** | **93 × 80 × 97** | **tysk text + bild** |
| 4 | `832f9eec` | vikt | 21,7 kg | "ca. 20 kg" | — | **utelämnas** |
| 5 | `832f9eec` | material | Eisen | Eisen, PP, Oxford | plasthinkar + tygsäck | **tysk text + bild** |
| 6 | `832f9eec` | ingår | — | bara `1 x Putzwagen` | — | ingen anvisning nämns |
| 7 | alla fyra | mopp | — | nämns inte i `Lieferumfang` | syns i bruk på en bild | **ingår inte** |

☠️ **Grönt, beige och brunt finns inte på produkterna.** Feedens färgkolumn är
fel på två av fyra rader — inte otydlig, utan direkt motsagd av fotot. Hade den
skrivits av rakt hade två sidor sålt en färg vi inte kan skicka. Samma klass
som uppgift #330.

☠️ **Och måttet på `832f9eec` skiljer 7 cm i längd och 10 i bredd.** Feedens
kolumn säger 100 × 70, den tyska texten 93 × 80, och måttritningen 93 × 80.
Två källor mot en, och den som förlorar är den strukturerade kolumnen — tvärtemot
vad man skulle gissa. Det är precis därför Steg 3 kräver tre källor.

⚠️ **Vikten på `832f9eec` går inte att avgöra** (21,7 mot "cirka 20"), och
eftersom SAMMA kolumn redan bevisat sig fel om måtten är den inte längre
trovärdig som ensam källa. Talet utelämnas hellre än gissas.

## ✅ `0cbffcd9` och `740fa6d0` är BEVISADE färgsyskon

Inte antaget på likhet — mätt på varenda tal leverantören anger:

| fält | `0cbffcd9` | `740fa6d0` |
|---|---|---|
| totalmått | 111 × 63,3 × 103 | **samma** |
| hyllans mått | 49,6 × 32,4 × 12 | **samma** |
| sopsäckens mått | 69 × 37 | **samma** |
| pressens mått | 26,5 × 20,5 × 56,5 | **samma** |
| hinkvolym | 18 L | **samma** |
| vikt | 22,2 kg | **samma** |
| paketmått | 93 × 52 × 46 | **samma** |
| brödtext | — | **ordagrant identisk** |
| ram | **grå** | **svart** |

Nio fält, ett enda skiljer. De ska korslänka varandra och beskrivas som en
konstruktion i två färger — inte som två vagnar.
