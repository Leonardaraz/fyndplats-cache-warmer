# Runda 85, Steg 1 — sex sopsorteringstunnor med flera fack

Soptunnefamiljen är **50 utkast mot 19 publicerade sidor** efter runda 84.
Sensordelen är i praktiken mättad: publicerade volymer är 20, 30, 42, 45,
48, 50, 55, 58, 60 och 68 liter, och varenda kvarvarande sensorutkast
ligger på en volym som redan har en sida. Rundan går därför till
**flerfackstunnorna**, där kunden söker på något annat ord —
*sopsorteringstunna*, *soptunna med två fack* — och där bara fyra sidor
finns publicerade.

⚠️ **Svepet krävde två etapper.** Första försöket loopade 30 sidor, gav
`avhuggen: true` och missade den kända publicerade sidan
`soptunna-med-sensor`. Katalogen är **5 502 produkter** = 56 sidor; kört
klart i två etapper med markören vidareskickad ger `avhuggen: false`,
`cursor: null` och kändträffen. Runbokens grind gjorde sitt jobb.

## Publicerade flerfackstunnor — det som är upptaget

| slug | fack | volym | mått | vikt |
|---|---|--:|---|--:|
| `soptunna-med-2-fack-50-liter` | 2 × 25 | 50 L | 47,7 × 37,5 × 56 | 8,2 |
| `soptunna-med-2-fack-56-liter` | 2 × 28 | 56 L | 53,4 × 30 × 67 | 10,5 |
| `soptunna-med-3-fack-45-liter` | 3 × 15 | 45 L | 61,9 × 36,6 × 43,2 | 9,8 |
| `soptunna-med-3-fack-60-liter` | 3 × 20 | 60 L | 61,9 × 36,6 × 56,7 | 11 |
| `utdragbar-soptunna-koksskap-30-liter` | 20 + 10 | 30 L | 52 × 26 × 40,8 | 5,6 |

## Rundans sex

| id8 | fack | volym | mått (B × D × H) | vikt | färg | vad som skiljer |
|---|---|--:|---|--:|---|---|
| `17fb1869` | 2 × 15 | **30 L** | 41,7 × 36,6 × 43,2 | 6,4 | svart | ledig volym, lägsta i familjen |
| `b10b80ee` | 2 × 20 | **40 L** | 45,8 × 36 × 51,6 | 7,3 | silver | ledig volym |
| `10c47f8e` | 2 × 20 | 40 L | 45,8 × 36 × 51,6 | 7,3 | svart | färgsyskon till `b10b80ee` |
| `213be879` | 2 × 20 | 40 L | **40 × 34,8 × 59** | 7,2 | silver | **smal** — 6 cm smalare, 7 cm högre |
| `a00882ed` | 2 × 30 | **60 L** | 48,8 × 39,5 × 67 | 10,6 | vit | ledig volym för TVÅ fack |
| `ec672f4d` | 15 + 8 + 8 | **31 L** | 48 × 34,3 × 35,1 | 5,3 | ljusgrå | utdragbar, **tre** fack |

## ☠️ Fyra fynd — och tre av dem hade blivit publicerade dubbletter

### 1. `e42eca69` ÄR den publicerade 45-litersidan, inte en ny produkt

| | utkastet `e42eca69` | publicerade `c841717c` |
|---|---|---|
| Mått | 61,9 × 36,6 × 43,2 cm | 61,9 × 36,6 × 43,2 cm |
| Volym | 3 × 15 L | 3 × 15 L |
| Vikt | 9,8 kg | 9,8 kg |
| Paketmått | 69 × 42 × 53 cm | 69 × 42 × 53 cm |
| Färg | svart | svart |

Fyra tal av fyra, på decimalen, plus färgen. **Samma vara.** Utkastet är
vägt bort.

☠️ **Och källan motsäger sig själv om just det tal som avgör.** Det tyska
NAMNET säger `Mülleimer mit 3 x 20 L Fächern` — alltså 60 liter, den
volym som hör till den ANDRA publicerade sidan. Spec-raden säger
`Volumen: 3 x 15L`. Hade jag valt på namnet hade jag trott att den var en
60-litare och publicerat en dubblett av 45-litaren under fel volym i
titeln. **Måtten avgör, inte namnet** — runbokens regel, och här är den
mätt två gånger om.

### 2. `300a9113` och `43ea33bd` är samma vara som varandra

Identiska på varenda rad: 45,5 × 36,5 × 51 cm, 2 × 20 L, 6,8 kg, paket
52 × 43 × 57, båda svarta, båda `Metall, Kunststoff`. Inte ett färgpar —
en ren dubblett i utkastshögen. Båda lämnas för ett sortimentsbeslut.

⚠️ De ligger dessutom nära `b10b80ee` (45,8 × 36 × 51,6, 7,3 kg): en halv
centimeter och en halv kilo isär. Skillnaden är materialet — `410
Edelstahl` mot `Metall, Kunststoff` — så de är sannolikt samma
konstruktion i lackad plåt i stället för rostfritt. Ytterligare ett skäl
att inte publicera båda.

### 3. Fyra olika 40-litersmodeller, och bara två får en sida

| id8 | mått | vikt | material |
|---|---|--:|---|
| `b10b80ee` / `10c47f8e` | 45,8 × 36 × 51,6 | 7,3 | 410 rostfritt |
| `213be879` | 40 × 34,8 × 59 | 7,2 | 410 rostfritt |
| `56b32f2f` | 41,8 × 36,7 × 58 | 7,9 | rostfritt |
| `300a9113` / `43ea33bd` | 45,5 × 36,5 × 51 | 6,8 | metall/plast |

Rundan tar `b10b80ee`/`10c47f8e` (**låg**, 51,6 cm) och `213be879`
(**smal**, 40 cm bred). De två skiljer sig 5,8 cm i bredd och 7,4 cm i
höjd — en verklig skillnad som en kund väljer på, och ordet står i namn,
slug OCH titel.

`56b32f2f` ligger mitt emellan de två (41,8 bred, 58 hög) och har ingen
egen särskiljare. Den lämnas — inte för att den är dålig, utan för att en
tredje 40-litare bara hade delat samma sökord.

### 4. 56-litersmodellerna är en NY modell på en UPPTAGEN volym

`a23f72f3` (silver) och `3b452c6e` (svart) är 45,8 × 36 × 67,6 cm och
10,83 kg mot den publicerade 56-litarens 53,4 × 30 × 67 och 10,5 kg —
alltså en annan konstruktion, inte en dubblett. Men volymen och sökordet
är desamma, och två sidor som båda heter "soptunna med 2 fack 56 liter"
kannibaliserar varandra. Lämnade.

## Vad `ec672f4d` skiljs på

Den publicerade utdragbara har **två** fack (20 + 10) och är 52 cm bred,
26 cm djup. Utkastet har **tre** (15 + 8 + 8), är 48 cm brett och 34,3 cm
djupt. De passar alltså olika skåp, och antalet fack står i namn, slug och
titel. Ramen mäter 47 × 33 × 32 cm — det är det måttet kunden ska mäta
skåpet mot, inte ytterhöljets.
