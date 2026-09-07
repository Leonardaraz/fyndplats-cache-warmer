# Runda 90 — Steg 2, 4 och 5

Sju utkast: två modell G, tre modell C, en modell A och en hopfällbar
cityscooter. Steg 1 fällde två dubbletter ur den ursprungliga batchen; de är
pensionerade och ligger inte här.

## Steg 1 igen: modell C mot modell B — sex mått skiljer

Familjekartan hade B och C som skilda modeller. Talen ligger så nära att det
måste mätas, inte antas: **`2b8297df` är en BLÅ modell B och `9518db1e` är en
BLÅ modell C.**

| | B (publicerad ×3) | C (utkast ×3) |
|---|---|---|
| längd | 118 cm | **115 cm** |
| bredd | 52 cm | **50 cm** |
| fotplatta | 32 × 11 cm | **31 × 10,8 cm** |
| vikt | 7 kg | **6,5 kg** |
| paketmått | 101 × 14 × 45 cm | **102 × 14 × 45 cm** |
| ålder | 6–12 år | **5–12 år** |
| stödben | nej | **ja** |

Sex mått åt olika håll, och **paketet är LÄNGRE på den kortare scootern** —
det utesluter mätslarv i en riktning. Pixelgrinden bekräftar: noll par under
1,0 mellan C-utkasten och B:s eller A:s publicerade bilder.

⚠️ `68f8f1a7-4` ÄR däremot 0,00 mot `41269686-4` och `b1dcd424-3`. Bilden är
närbilden på den svarta styrdynan — en komponent hela modell A delar. Rundans
egen regel gäller: **0,00 på en delad komponent bevisar samma MODELL, inte
samma produkt.** `68f8f1a7` är rosa, de andra vinröda och blå. Rosa är den
färg familjen saknar.

## ☠️ Steg 4: tre bilder bär TYSK TEXT i pixlarna

`9518db1e-2`, `473084eb-2` och `85be4535-2` — samma måttskiss på alla tre
modell C — bär **`Empfohlenes Alter: 5-12 Jahre`** och **`Gewichtsgrenze:
50 kg`** inbränt. En `grep` över källkoden svarar grönt medan kundens öga
läser tyska. Samma klass som runda 89:s `c4375606-3`.

Bilderna tas ur galleriet. Måtten de bär skrivs i stället i texten — skissen
ger **11 cm markfrigång**, ett tal den tyska brödtexten saknar för modell C.

## Steg 4: måttskissen ger tre tal texten saknar — och ett den motsäger

Modell G:s skiss (`5129f6b0-2`) märker ut **fotplattan 36 cm** och **hjulet
41 cm**. Brödtexten säger `Reifendurchmesser: Ø40 cm`.

- **36 cm** är entydigt och skrivs.
- **41 mot 40** är samma hjul mätt två gånger (16 tum = 40,6 cm). **Ø40 cm**
  skrivs, eftersom det är talet spec-tabellen och synken bär. 41 skrivs inte.
- ☠️ Skissens **12,5 cm är TVETYDIG** — pilen går från fotplattans slut upp
  till bakskärmen och går inte att tolka entydigt. **Skrivs inte.** Ett mått
  man inte kan namnge är ett mått man inte kan skriva.

## ☠️ Steg 5: fyra påståenden som inte får gå vidare

1. **"Rostfreier Stahlrahmen"** (modell G, båda). En lackerad stålram på en
   barnsparkcykel är inte rostfritt stål. Runda 57 fällde exakt samma
   påstående (uppgift #261). **Skrivs inte.** Ramen är stål och aluminium.

2. ☠️ **"Punkteringsfri" får ALDRIG stå på modell G.** Modell A och C har
   massiva EVA-däck och ÄR punkteringsfria; modell G har **luftfyllda
   gummidäck på ekerfälg** och kan gå platt. Grinden är därför PER PRODUKT,
   inte per runda — runda 89:s variant hade släppt igenom felet här.

3. ☠️ **`eb4418ad`: markfrigången motsägs.** Brödtexten säger `9 cm (Höhe vom
   Boden)`, måttskissen säger **11 cm**. Två tal för samma egenskap, och inget
   sätt att avgöra vilket. **Ingetdera skrivs.**

4. ☠️ **`eb4418ad`: åldern går inte ihop med kroppslängden.** Leverantören
   anger `6-12 Jahre` OCH `Körpergröße 110-130 cm`. En tolvåring är omkring
   150 cm och ryms inte i det spannet. Texten skriver **från 6 år** och låter
   **kroppslängden 110–130 cm** vara det som avgör — det är det mätbara måttet
   och det som faktiskt styr om barnet får plats. **"Till 12 år" skrivs inte.**

⚠️ **`eb4418ad`: materialet motsägs också.** Brödtext `Kunststoff, PU, Metall`,
spec-tabell `PP`. Brödtextens lista stämmer med bilden (metallram, PU-hjul,
plastskärmar) och används; `PP` ensamt är fel för hela varan.

⚠️ **`68f8f1a7`: styrbredden.** Leverantören anger `Lenkerbreite: 50 cm` men
`Gesamtgröße L120 x B52`. De tre publicerade modell A-sidorna skriver
`Styrbredd: 52 cm`. Talen motsäger inte varandra — 52 är bredden över styret,
50 är spannet mellan handtagen — och sidan följer familjen med **52 cm**. 50
skrivs ingenstans, så ingen sida kan motsäga en annan.

## Steg 2: laglighet

Leksaksprodukt för barn. Inget påstående om certifiering skrivs: bara
`a06e46b7` av de publicerade nämner EN 71, och underlaget för de här sju säger
ingenting om det. **Ogrundad certifiering skrivs inte** (uppgift #252).

Monteringen kräver en vuxen (`68f8f1a7`s underlag säger det uttryckligen) och
skyddsutrustning nämns för samtliga — det är leverantörens egen text och en
äkta säkerhetsupplysning, inte ett skäl att avstå.

## Bildgrind: logotypsvepet är rent

Övre vänstra hörnet granskat på alla 35 bilder. **Noll leverantörslogotyper.**
`eb4418ad` bär en gul-röd dekal på styrstammen och hela familjen bär ordet
SCOOTER tryckt på ram och styrdyna — allt sitter FYSISKT på varan och rörs
inte, men namnges aldrig i text eller alt-text.
