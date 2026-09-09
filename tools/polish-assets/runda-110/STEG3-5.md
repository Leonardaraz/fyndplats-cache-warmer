# Runda 110, Steg 3–5 — sex mappningsrader, 30 bilder och åtta fynd

## Steg 3: mappningsraderna (workflowen `polish-mapping.yml`, läge `las`)

| id | artnr | pris | landedCostSek | prisgrind | lager | fraktandel | Wix-SKU |
|---|---|--:|--:|:-:|--:|--:|---|
| `a999f2b1` | 830-816V01WT | 1 199 | 1 004,97 | ✅ | 11 | 0,447 | `FP-raumteiler-4-teilig` |
| `c35f9d4f` | 830-816V01DR | 1 099 | 907,01 | ✅ | 52 | 0,463 | `FP-raumteiler-4-teilig` |
| `d72bde5e` | 830-700V00ND | 1 179 | 982,38 | ✅ | 42 | 0,444 | `FP-4-teiliger-raumteiler` |
| `316f9945` | 830-311 | 1 179 | 981,54 | ✅ | 52 | 0,444 | `FP-raumteiler-faltbar` |
| `f8fd1b62` | 830-716V01ND | 1 339 | 1 108,80 | ✅ | 54 | 0,393 | `FP-4-teiliger-raumteiler` |
| `309076e2` | 830-716V00ND | 1 299 | 1 082,53 | ✅ | 15 | 0,403 | `FP-raumteiler-klappbare` |

Alla sex: `supplier: aosom`, `hasEuWarehouse: true`, `draftStatus: pending_review`,
`needsAiPolish: true`, `visible: false`, en variant, kategori bara `All Products`.
Prisgrinden stämmer på alla sex — **priset rörs inte.**

☠️ **TVÅ SKU-KROCKAR I SAMMA BATCH**, inte en. `FP-raumteiler-4-teilig` bärs av
BÅDA A-sidorna och `FP-4-teiliger-raumteiler` av `d72bde5e` OCH `f8fd1b62` —
och det andra paret är inte ens samma modell. Uppgift #272 igen: krocken skapas
av IMPORTEN (SKU:n härleds ur den tyska titeln, som två olika produkter delar),
inte av poleringen. Steg 8 löser båda paren, båda halvorna.

## Steg 4: 30 bilder, tre ark

`kontaktark.jpg` (30 bilder) · `logogrind.jpg` (30 övre remsor) · `zoom.jpg`
(12 snitt i 1,3–1,5×) · `mattark.jpg` (sex måttritningar).

✅ **Logotypgrinden: 30 av 30 rena.** Ingen `HOMCOM by Aosom` i något hörn,
ingen tysk text inbränd i pixlarna. Remsan togs över HELA bredden och inte
bara vänsterhörnet — en logotyp uppe till höger läcker exakt lika mycket, och
att bara titta där förra fyndet låg är att leta under lyktstolpen.

✅ **Måttritningen ligger på plats 3 på alla sex** (uppgift #371 igen).
Galleriets form: 1 studio, 2 miljö, 3 måttritning, 4–5 närbild — **utom
`c35f9d4f`, som har TRE miljöbilder och ingen enda närbild.** Samma sak som
runda 109 mätte upp på det vita sexpanelsutkastet: två sidor i samma familj
har inte samma galleri, och en ärvd alt-rad hade skrivit "närbild på väven"
om ett rumsfoto.

## Steg 5: åtta fynd

### ☠️ 1. Grupp A:s väv är PLAST — och spec-blocket säger trä

Leverantörens egen text om `a999f2b1` och `c35f9d4f`, ordagrant:

```
Die Polypropylenkonstruktion sorgt für maximale Privatsphäre und ist
stabiler als herkömmliche Papierfasern.
Ein Rahmen aus Kiefernholz und Polypropylengeflecht …
✔ Materialien: Polypropylen, Kiefernholz
```

Det SVENSKA spec-blocket som importen byggde säger `Material: Kiefernholz`.
`buildSpecifications` tog **första** materialet ur listan och tappade det som
utgör hela den synliga ytan. En kund som läser spec-tabellen tror att väven
är trä.

✅ **Kontrollerat mot de åtta LIVE-sidorna i runda 108/109** (samma
konstruktion, modellbas 830-814): de säger redan `polypropenväv på tallram` i
namn, brödtext och spec-tabell. **Ingen publicerad sida beskriver plasten som
trä.** Oron var obefogad — och kontrollen tog en `grep`.

Grinden kräver nu ordet `polypropen` i grupp A:s text, plus ett eget mönster
som fäller ett PÅSTÅENDE om att väven vore rotting, papper eller bambu.

### ☠️ 2. `c35f9d4f` bär TVÅ olika färger i sina egna två spec-block

`Farbe: Waschschwarz` i den tyska, `Färg: Bräune` i den svenska. Samma
produkt, samma sida. Zoomen (4,1×) visar en **mörkt gråbrun** väv över ljusa
trälister. Bilden avgör (Steg 5, punkt 1) → **gråbrun**.

Steg 1:s tabell sa "brun", hämtat ur det svenska blocket — alltså ur den
mindre auktoritativa av två källor som dessutom säger olika.

### ☠️ 3. `316f9945` är SVART först och brun sedan

Ramen är svartmålad; väven är svart med gräddvita band och kopparbruna
trådar. Leverantören skriver själv `Braun+Schwarz`; Steg 1 skrev bara "brun".
Det första kunden ser är en svart skärm.

### ✅ 4. `316f9945`:s "självmotsägelse" fanns inte

Steg 1 flaggade spec 1,9 cm mot ritningens 7,6 och 5,5. Alla tre stämmer:
**4 × 1,9 = 7,6** är det hopfällda djupet, och 5,5 cm är `Höhe der Füße` —
fothöjd, inte djup. Ingen motsägelse.

### ✅ 5. `316f9945`:s material stämmer också

Namnet säger `Kiefernholz/Bambus`, spec-blocket `Material: Bambus`. Båda är
sanna om olika delar: **tallram, bambuväv** (`Solide Struktur … aus
Kiefernholz und geflochtenem Bambus`). Bilden bekräftar.

### ⚠️ 6. Grupp C:s L/B/H-etiketter är kastade om

`Paneelgröße (einzeln): 170L x 1,8B x 40H cm` — panelen är 40 cm BRED och
170 cm HÖG, inte tvärtom. Talen är rätt, bokstäverna fel. Ritningen avgör
(Steg 5, punkt 9) och sidan skriver måtten i svensk ordning: bredd × djup ×
höjd.

### ☠️ 7. Tre av sex lovar att skärmen dämpar LJUD

`störendes Licht oder Hintergrundgeräusche zu minimieren` står i `d72bde5e`,
`f8fd1b62` och `309076e2`. En öppen spjälväv dämpar inget ljud, och det finns
inget mätvärde bakom påståendet. Steg 5, punkt 5: upprepas aldrig. Egen
grind (`LJUDLÖFTE`) med två självtestfall.

### ✅ 8. "Massiv tall" — runda 109:s öppna fråga är stängd

Runda 109 noterade att den kunde ta bort "massiv tall" med fel motivering men
inte längre mäta efter, eftersom källtexten inte sparades. Den här rundans
grupp A säger ordagrant `Rahmen aus massivem Kiefernholz bietet starke
Unterstützung`. Samma textmall, samma familj: leverantören SKRIVER massiv
tall. Sidorna här gör det därför också.

**Lärdomen är den runda 109 redan drog:** spara leverantörens råtext i
rundans egen mapp. Den här rundan gör det — `steg3.py` bär leverantörens
`Beschreibung` och `Technische Daten` för alla sex, plus importens svenska
spec-block bredvid, så avvikelserna går att läsa utan ett nytt API-anrop.
Filen har en egen **citatkontroll**: den fäller om någon av de tolv fraser
det här dokumentet citerar saknas i avskriften.

## Grinden

22 självtestfall, 6 sidor, **0 fel**, 6 unika SKU:er, inga meta- eller
titelkrockar.

☠️ **Korsproduktgrinden fångade ett verkligt fel.** A-parets två
meta-descriptions var byte-identiska innan färgen lades in — två publicerade
sidor med samma meta är dubblettinnehåll mot Google, och det är osynligt i en
grind som bara ser en sida i taget.

☠️ **Och nekandevakten mjukades upp — bundet.** Runda 108:s vakt mätte bara
GRANNORDET och gav falsklarm på "Den räcker inte för att mörklägga". Att söka
i hela meningen är precis det runda 108 avvisade med mätning. Fönstret är
därför bundet åt två håll: **högst tre ord bakåt, aldrig över en satsgräns.**
Båda riktningarna har ett eget självtestfall, så uppmjukningen inte kan glida
vidare vid nästa rättelse.
