# Runda 135 — Steg 2 till 5

## Steg 2 — laglighetsgrinden

Klösmöbler är **möbler, inte djurhållning**: SJVFS 2019:15 reglerar utrymmen
för hållna djur, och en klösmöbel är inget djurutrymme. Runda 25:s grind för
familjen (tippskydd, takspänne, maxvikt) gäller oförändrad.

⚠️ **Ingen av de åtta levereras med väggrem eller takspänne.** Varje
`Lieferumfang` är `1 x Kratzbaum` plus en manual — ingenting annat. Den
högsta är `741c5723` på 132 cm över en 55 × 44 cm sockel. Alltså får **ingen
tippskyddsutfästelse göras på någon av sidorna**, och ingen egen
säkerhetsformulering hittas på.

## ☠️ Steg 3 — leverantörens NAMN motsäger sina egna mått på tre av åtta

Uppgift #462, en gång till. Namnet är ingen källa; `Gesamtabmessungen` är det.

| id8 | leverantörens namn säger | måtten säger | vad talet i namnet ÄR |
|---|---|---|---|
| `0696efce` | „bis 10 kg, **39,5**" | 39,5 × 39,5 × **87 H** | sockelns BREDD, inte höjden |
| `bdc7e768` | ingen höjd alls | 48 × 34 × **98 H** | — |
| `82efeeaf` | „bis **7**" | 56 × 54 × **86 H** | maxlasten i kg |

⚠️ Och två PAR delar höjd inom rundan: `0696efce` och `7564dcfb` är båda
87 cm, `bdc7e768` och `e2c8b0f3` båda 98 cm. Höjden ensam duger därför inte
som kvalificerare — konstruktionen måste in i namn, slug OCH titel.

## ☠️ Steg 3 — ETT ARTIKELNUMMER ligger i leverantörens tyska text

`e2c8b0f3`s `Technische Daten` slutar med raden `✔ Ref.: D30-…`. Det är
Aosoms artikelnummer, mitt i den text poleringen skriver om.

Det är uppgift #470:s klass och förklaringen till de fyra publicerade sidor
som bär numret (#414): det står i KÄLLAN, så en polering som lyfter över
spec-raderna tar det med sig. Grinden `grindar.ARTNR` fäller det, och rundans
egen `grind.py` kör den på varje fält.

☠️ Numret skrivs INTE ut här, inte i rundans filer och inte i någon commit —
repot är publikt, och det är exakt det misstaget #414 handlar om.

## Steg 4 — bilderna

Alla åtta har fem bilder. Kontaktarken ligger i `ark-<id8>.jpg`.

### Sex märken granskade — fem sitter FYSISKT PÅ VARAN

Leonards regel, ordagrant: *"om märket sitter fysiskt på varan så gör vi
inget åt det, det är så produkten ser ut."* Avgörande-testet är om det skulle
synas på ett eget foto efter uppackning.

| id8 | vad | dom |
|---|---|---|
| `0696efce` | metallplatta skruvad i sockeln | **rör den inte** |
| `bdc7e768` | vävd etikett på sockeln | **rör den inte** |
| `5d64f423` | vävd etikett på jutebasen | **rör den inte** |
| `e2c8b0f3` | liten dekal på husets tak | **rör den inte** |
| `741c5723` | ingen märkning | — |

### ☠️ `cc5da788` bild 2 bär en FRANSK reklamtext i förgrunden

Inte en logotyp och inte på varan: en **papperskasse** ligger i nedre
vänstra hörnet och täcker ungefär en tredjedel av bilden med läsbar
fransk marknadsföringstext — *"…partir de papier végétal. 100 % naturel.
Double épaisseur 180 g/m² … Contenance : 33 litres … Écographik™"*, inklusive
ett varumärke som inte är vårt.

Det är rekvisita i scenen, alltså BAKGRUND enligt Leonards gräns, och får
röras. Men att ta bort ett stort föremål ur förgrunden är ommålning, inte den
bakgrundstvätt `bildmetoder.md` beskriver — och en halvlyckad ommålning är
värre än en bild mindre.

✅ **Bild 2 utgår ur galleriet.** Samma beslut som runda 134 tog om
leverantörsreklamen: plocka bort, inte laga. Kvar blir fyra leverantörsbilder
plus vårt eget Faktakort.

⚠️ Bild 3 på samma produkt bär en **skuggfigur med `180 cm` och `100 cm`** —
en skalajämförelse. Den är språkneutral (bara tal) och får ligga kvar; den
säger något kunden faktiskt vill veta.

## Steg 5 — leverantörens påståenden, verifierade

☠️ **`741c5723` anger maxvikten på TVÅ sätt som lätt läses fel.** Brödtexten
säger *"Geeignet für 1-2 Katzen, jeweils bis zu 6 kg"* och spec-raden säger
*"Empfohlenes Haustiergewicht: 12 kg"*. De motsäger inte varandra — 12 är
summan av två katter à 6 kg — men en rak översättning av spec-raden hade satt
**12 kg per katt** på sidan, alltså dubbelt så mycket som varan bär. Texten
ska säga *två katter på upp till 6 kg vardera*.

⚠️ **`5d64f423`: leverantören säger BÅDE `Spanplatte` OCH `Massiver
Holzpfosten` i `Birnbaumholz`.** Båda är sanna om olika delar — sockeln är
spånskiva, stolparna trä. Runda 134:s förbud mot "massivt trä" gällde en
produkt där källan bara sa spånskiva; här får konstruktionen beskrivas
delvis, aldrig som en helhetsutsaga.

⚠️ **`cc5da788`: `Rohrkolben` är kaveldun**, inte sisal. Det svenska
spec-blocket säger `Material: Sisal` — det är stolparna; huset är flätat
naturfiber. Båda ska med.

⚠️ **`cc5da788` påstår `MDF-Platte der Klasse E1`.** E1 är en
formaldehydklass, inte en säkerhetsnorm, och den går inte att verifiera.
Den lämnas UTE — samma hållning som mot certifieringspåståenden i runda 134.

⚠️ **Spec-tabellens `Vikt` är FRAKTVIKTEN** (uppgift #488) på alla åtta.
`bdc7e768` visar det tydligast: 5,4 kg i den svenska raden mot `Maximale
Belastung: 5 kg` i den tyska. Två helt olika tal om olika saker, och det ena
står i ett fält som heter "Vikt".
