# Förslag: sökordskategorin *Julgranar* — GENOMFÖRT 2026-09-24

Pilot för punkt 3 i README. Genomfört efter Leonards ja — se README punkt 4.
Texten som publicerades står i `julgranar-text.json` och skiljer sig från
utkastet nedan där utkastet inte höll mot produktbeskrivningarna.

## Varför just nu

| sökord | vol/mån | KD |
|---|--:|--:|
| julgran | 22 200 | 25 |
| plastgran | 5 400 | 25 |
| julgran med belysning | 5 400 | 18 |
| konstgjord julgran · julgran konstgjord | 390 · 260 | 20 · 18 |

Sökningarna toppar i november–december. En ny sida behöver veckor för att
indexeras och klättra, så den ska finnas ute i oktober, inte i december.

I dag ligger granarna i *Dekoration & Prydnad* under *Hem & Inredning*,
tillsammans med 196 andra dekorationer. Den som söker "julgran" och landar där
ser julbyar, kransar och ljusstakar.

## Sortimentet (publicerat och i lager, läst ur Wix 2026-09-24)

**56 granar**, från **57 cm** (2-pack med LED) till **225 cm**, 459–1 679 kr:

- **smala pelargranar**, 46–54 cm breda;
- **täta granar** med 1 942, 2 380, 2 419 och 4 030 grenspetsar;
- **snötäckta** och **vita** modeller;
- **med LED monterad från fabrik** (50, 100, 200, 250, 300 och 700 LED);
- fiberoptisk gran, gran i kruka, gran i lykta, set i tre storlekar;
- tillbehör: julgranskrage i trä och ett julgranståg som hängs i granen.

Uppblåsbara figurer räknas inte som granar och kopplas inte.

## Del 1 — Wix (additivt, ingen produkt lämnar sin listning)

- Ny kategori **Julgranar**, slug `julgranar`, under *Hem & Inredning*.
- Koppla granarna med `bulk/categories/{id}/add-items`. Facit är
  bulk-svarets `bulkActionMetadata` per rad, eftersom läsningen släpar.
- ⚠️ Menyn byggs ur Wix-trädet, så kategorin syns i navigationen direkt.

## Del 2 — butiken (`headless-site`, samåker med nästa deploy)

`lib/category-seo.ts`:

```ts
"julgranar": {
  title: "Konstgjord julgran – plastgranar 57–225 cm",
  description:
    "Konstgjorda julgranar från 57 till 225 cm: smala pelargranar, täta granar med över 2 000 grenspetsar, snötäckta modeller och granar med LED-belysning.",
},
```

`lib/category-content.ts`:

```ts
"julgranar": {
  intro: [
    "En konstgjord julgran ställer du upp varje december i många år – utan barr på golvet och utan vattning. Här samlar vi alla våra julgranar, från små granar på 57 cm till 225 cm höga granar för rum med högt i tak, och från smala pelarmodeller som bara är 46 cm breda till täta granar med över 4 000 grenspetsar.",
    "Välj efter rummet. Mät takhöjden och lämna plats för toppen, och tänk på bredden: en bred gran på 180 cm kan vara över en meter i diameter, medan en smal modell får plats bredvid soffan. Vill du slippa trassla med ljusslingan finns granar med LED monterad från fabrik, och de snötäckta modellerna ger vinterkänsla direkt.",
    "Du betalar tryggt med Klarna, frakten är fri över 499 kr och du har 30 dagars öppet köp.",
  ],
  faq: [
    { q: "Hur hög julgran ska jag välja?",
      a: "Utgå från takhöjden och dra av 20–30 cm för toppen och stjärnan. I ett rum med 2,4 meter i tak passar en gran på 180–210 cm. Har du ont om golvyta är en smal modell ofta rätt – våra smalaste är 46 cm breda." },
    { q: "Vad betyder antalet grenspetsar?",
      a: "Det säger hur tät granen ser ut. Samma höjd kan ha från några hundra till över 4 000 spetsar – ju fler, desto fylligare gran. Antalet står i varje produktbeskrivning." },
    { q: "Hur förvarar jag en konstgjord julgran?",
      a: "Många av våra granar tas isär i sektioner och har en fot som fälls ihop, så de ryms i en låda till nästa jul. Förvara granen torrt och fluffa upp grenarna när du ställer upp den igen." },
  ],
},
```

⚠️ Innan texten publiceras ska den grindas som all annan kundtext
(`gate.py`-mönstren, siffrorna mot sortimentet). Påståendena ovan är avstämda
mot produktnamnen, inte mot varje produktsida.
