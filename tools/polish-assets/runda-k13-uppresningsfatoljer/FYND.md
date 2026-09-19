# Runda K13 — vad kontaktarken visade

Lästa FÖRE första meningen (J1-regeln). 40 bilder, åtta stryks, 32 kvar.

## ☠️ `501a52e1` faller till TVÅ bilder — och tre säljfakta försvinner med dem

Tre av fem bär tysk text: måttritningen (`Geeignet für Benutzer Höhe:
150-200cm`), funktionskollaget (`USB-Ladeanschlüsse` / `Gepolsterte Armlehne`
/ `Seitentasche`) och närbilden (`VERSAND IN 2 PAKETEN`).

Kvar: produktbild och en livsstilsbild. **Ingen måttritning.** Det är den
dyraste sidan i rundan (6 629 kr) med minst foton — samma läge som `522103fd`
(#216), `46f475c4` (#212) och `7cdc167c` (#166).

⚠️ Fakta som bara fanns i de strukna bilderna och därför MÅSTE in i texten:
**USB-uttag**, **passar kroppslängd 150–200 cm**, **levereras i två paket**.
Det sista är ett leveransbesked kunden vill ha innan köp av en 6 629-kronors
möbel, inte efter.

## ⚠️ Fyra av åtta är HJÄLPMEDEL, och bilderna säger det tydligare än namnen

`bf2447a6`, `485cf3e8`, `d3ee8cea` och `fcac3d22` visar alla en äldre person
som reser sig ur stolen **med käpp bredvid**. Det är inte en tv-fåtölj som
råkar ha en motor — det är en uppresningsfåtölj, och köparen är någon som har
svårt att komma upp. Texten ska säga det i första stycket, som `ed03b52f` i
K12, inte gömma det bland massagelägena.

## Materialen skiljer sig mer än namnen antyder

| | material (ur bilderna) |
|---|---|
| `bf2447a6` | mörkgrått tyg, kraftig kanalsöm |
| `501a52e1` | antracit tyg, slät rygg |
| `a3a8d261` | ljusgrått tyg |
| `485cf3e8` | **svart konstläder** — enda i rundan |
| `4635adcb` | **brun manchester** — ribbat, syns i närbild #4 och #5 |
| `d3ee8cea` | grå chenille, **öronlappsrygg** — enda med vingar |
| `fcac3d22` | ljusgrå chenille |
| `8151ce59` | **ljusgrå manchester** — ribbat, närbild #4 och #5 |

Två manchester, ett konstläder, en öronlappsrygg. Det är de fyra sidor som
går att skilja åt på en produktbild; de andra fyra måste skiljas i text.

## Måttritningarna bär tal som namnen inte har

- `bf2447a6` **150 kg** — högst i rundan, och det står bara i ritningen.
- `485cf3e8` 135 kg · `d3ee8cea` **120 kg** — lägst.
- `fcac3d22` sitthöjd 48 cm, sits 54 cm, utfälld 156 cm.
- `8151ce59` utfälld 158 cm, sitthöjd 47 cm.

☠️ Hämta talen ur ritningen och tekniska data — **aldrig ur produktnamnet**
(K12:s `c79c22f7`, #217).

---

# Vad källtexterna avgjorde

## ☠️ `8151ce59`:s spec-flik bär SYSKONETS mått — importen skrev fel

`4635adcb` och `8151ce59` har **ordagrant identisk** brödtext i källan: samma
inledning, samma åtta punkter, samma "Power Lifting Stuhl", 14 cm stoppning,
12 V / 14,4 W, 1,75 m kabel, 150 kg. Bara måtten och färgen skiljer.

Och där går det fel:

```
8151ce59  tyska blocket:  79B x 97T x 103H cm   ← rätt
8151ce59  svenska Mått:   83B x 93T x 110H cm   ← 4635adcbs mått
4635adcb  båda:           83B x 93T x 110H cm
```

☠️ **Hade dubblettkollen läst `Mått:`-raden hade de två sett IDENTISKA ut**
och den ena hade sorterats bort som färgsyskon. Det är exakt varför
`DUBBLETTMATNING.md` säger trippel i texten och inte den etiketterade raden —
här hade etiketten ljugit.

De är två olika stolar: 79 × 97 × 103 mot 83 × 93 × 110, och de fälls till
153 respektive 158 cm. Texten till `8151ce59` skrivs ur det TYSKA blocket.

## ☠️ `bf2447a6` bär Aosoms artikelnummer i klartext

`✔ Artikelnummer: 713-…V90GY` står mitt i källtexten (numret maskat även
HÄR — repot är publikt, och en anteckning som parar artikelnumret med vårt
produkt-id och vårt pris är samma koppling regeln finns för att bryta). Det hör hemma på
`supplierProductId` och ingen annanstans — dealproffsen.se publicerar samma
sträng som `sku`/`mpn`. Talet **713** finns därför i facit och måste inte
förväxlas med ett mått.

## ☠️ `a3a8d261` bär en tysk leveransklausul (#124)

*"WICHTIG: Wir liefern Ihnen den Artikel kostenfrei bis Bordsteinkante"* —
leverans till trottoarkant. Den beskriver AOSOMS leveransvillkor till en tysk
kund, inte våra till en svensk. Får aldrig följa med.

## ⚠️ `501a52e1` har INGEN uppresningshjälp

Den ligger i en runda med sju uppresningsfåtöljer men är en ren recliner:
135° steglöst med fotstöd, fjärrkontroll — ingen lyft, inget som reser
kunden upp. Att beskriva den som ett hjälpmedel vore fel om produkten.

## ⚠️ `a3a8d261` lyfter HYDRAULISKT, inte med motor

*"Aufstehhilfe durch einen hydraulischen Zylinder."* De sex andra lyfter med
elmotor. Skillnaden är verklig för köparen: en hydraulcylinder är tystare och
har inget att koppla in, men den ställs inte in steglöst på samma sätt.

## ⚠️ Färgen i specen motsäger fotot på `a3a8d261`

Källan säger `Farbe: Dunkelgrau`; produktbilden visar en tydligt LJUSGRÅ stol.
Samma klass som `4de34dce` (#189). Texten säger ljusgrå — fotot är det kunden
ser, och det är fotot som avgör en färg.

## Det som faktiskt skiljer de åtta åt

| | lyft | rygg | last | material | särdrag |
|---|---|---|---|---|---|
| `bf2447a6` | **60°** el | 135° | **150 kg** | frotté | USB-A **och** USB-C, 40 cm vägg |
| `501a52e1` | **ingen** | 135° steglöst | 150 kg | sammet | 150–200 cm, två paket |
| `a3a8d261` | **hydraulisk** | 150° | 150 kg | linnelook | två fjärrar, lyft 142 cm |
| `485cf3e8` | 45° el | **150°** | 135 kg | **konstläder** | mugghållare båda sidor |
| `4635adcb` | el | 150° | 150 kg | **manchester** | två fjärrar, 14 cm dyna |
| `d3ee8cea` | el, **dubbelmotor** | **155°** | **120 kg** | chenille | öronlappsrygg, 60 cm vägg |
| `fcac3d22` | el | recliner | 150 kg | chenille | **nio program**, åtta punkter |
| `8151ce59` | el | 150° | 150 kg | **manchester** | 79 × 97 × 103, fälls 153 cm |
