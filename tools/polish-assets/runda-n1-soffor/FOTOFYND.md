# Vad fotona sa INNAN texten skrevs — runda N1

Kontaktarket byggdes före brödtexten (regeln från J1). 40 bilder över åtta
soffor, alla 40 unika på md5. Rundan gav fyra fynd, och två av dem kunde ingen
textgrind ha sett.

## ☠️ `b99570fd` är VIT — källan säger `Farbe: Grau`

Både den tyska källan och dealproffsens namn kallar den grå:

```
✔ Farbe: Grau
Modulsoffa Grå 146 cm Konstläder 2-sits        (dealproffsen)
```

Alla fem fotona visar en **gräddvit/benvit** soffa. Bild 4 är dessutom
leverantörens egen ljusplansch: samma soffa återgiven under fem
ljusinställningar (Dim · Natürlich · Warm · Cool · Hell), och ingen av de fem
är grå. Materialet stämmer — ytan är slät och sömmad som konstläder, inte
vävd — men färgordet gör det inte.

☠️ Samma klass som M4:s `86fdd9af` (`Farbe: Grün` på en vit gran) och som den
röda bilen som skeppades i färgen "Nät": **ett färgord kan vara hämtat rakt ur
källan, passera varje grind, och ändå beskriva fel produkt.** Texten och
spec-fliken skriver därför `Gräddvit`. Skriver vi `grå` får kunden en vit soffa
i kartongen.

## ⚠️ `8aad177d`: källan säger `Samt`, väven syns på närbilderna

Bild 4 och 5 visar en finkornig, matt vävstruktur — inte en luggad sammet.
Beskrivningen håller sig därför till hur tyget KÄNNS och ser ut ("finvävt,
mjukt") i stället för att upprepa materialordet. Samma familj som `4de34dce`
(#189), fast mildare: här är materialgruppen rätt, bara ordvalet trubbigt.

## ☠️ Fyra av åtta förlorar sin MÅTTRITNING till en tysk banner

Det är rundans dyraste bildfynd. Aosom lägger samma marknadsföringsmening —
`Lassen Sie es 72 Stunden lang "atmen"` — ovanpå just den bild som bär måtten:

| kort | bilden som ryker | vad som går förlorat |
| :-- | --: | :-- |
| `b99570fd` | 3 | 146 × 85 × 78, sitsdjup 62, sitthöjd 40, 240 kg |
| `617ce9ff` | 3 | 117 × 65 × 78,5, sits 112 × 50 × 48, 220 kg |
| `45e68631` | 3 | 218 × 79 × 91, sits 175 × 49 × 50, 360 kg |
| `59aeb88a` | 3 | 212 × 80 × 88, sits 176 × 56 × 45, 450 kg |

Varje tal finns i källtexten, så ingenting går förlorat för TEXTEN — men
kunden får ingen ritning att titta på. De fyra är kandidater för ett eget
svenskt måttkort (samma behov som #216, #223 och #242).

⚠️ `617ce9ff`:s banner är **engelsk**, inte tysk (`Suitable for Small Spaces`).
Huset har strukit engelsk inbränd text två gånger förut, så den går samma väg —
men en grind som bara letar tyska hade släppt igenom den.

## ☠️ `b99570fd` bild 4 bär husmärket i pixlarna

`HOMCOM by Aosom` står tryckt uppe till vänster. Den kan inte poleras bort och
får inte nå kund — samma skäl som husmärkena stryks ur texten.

## Vad fotona TILLFÖRDE som texten inte hade

- **`1fd11824` har inga armstöd alls.** Det syns direkt på bild 1 och är hela
  skälet till att den får plats där en soffa inte gör det. Källan nämner det
  aldrig; den skriver bara "extra breiter Sitz".
- **`d372e8e9` skickas i två paket** (bild 5) och **`45e68631` likaså** (bild 3),
  med 30 minuters montering. Uppgifterna satt bara i de tyska bannerna — de
  följer med in i den svenska texten i stället, där de hör hemma.
- **`fe56b0e6`:s schäslong är vändbar, och bilderna visar det**: bild 1 har den
  till höger, bild 3 till vänster. Källan påstår det, fotona bevisar det.

## Kvar efter städningen

33 av 40 bilder. Tre produkter behåller alla fem (`1fd11824`, `8aad177d`,
`fe56b0e6`), tre får fyra, två får tre.

## Kategori: `Hem & Inredning` utan löv

Trädet har inget möbel- eller sittmöbelblad — kontrollerat mot alla 54
kategorier. `Hem & Inredning` har sju barn (Badrum & Hemtextil, Belysning,
Dekoration & Prydnad, Förvaring & Organisering, Hushållsapparater, Kalas &
Fest, Verktyg & Hemmafix) och ingen av dem rymmer en soffa. Runbooken säger
att toppkategorin räcker då, och det är vad som kopplas — precis som för
sittmöblerna i #149.
