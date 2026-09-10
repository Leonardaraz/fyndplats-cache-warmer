# Runda 121 Steg 2 och 5 — laglighetsgrind och leverantörens påståenden

## Steg 2: laglighetsgrinden är kort här, och det är ett svar

Åtta manuella städvagnar. **Ingen elektrisk del, ingen motor, inget batteri**
— alltså inget CE-, energimärknings- eller elsäkerhetskrav att bära på sidan.
Ingen av dem är avsedd för barn, så EN 71 är irrelevant. Ingen livsmedels-
kontakt. Kvar står tre saker som ska bevakas i texten:

1. **Maxlasten är ett säkerhetstal**, inte en säljpunkt — den skrivs som
   leverantören anger den, per hylla där han delar upp den.
2. **"Professionell" är inte en certifiering.** Leverantören skriver
   *"professionelle Bodenpflege"* och *"gewerblicher Einsatz"*. Det får bli
   *"tål att användas dagligen"* eller *"byggd för storstädning"* — aldrig en
   påhittad standard eller HACCP-hänvisning.
3. ☠️ **Moppen ingår INTE.** Fem av åtta säger det uttryckligen i versaler
   (*"HINWEIS: Der Mopp ist NICHT enthalten"*). Det måste stå på sidan, för
   det är precis vad en kund antar ingår i en mopphink.

## Steg 5: sju motsägelser i leverantörens eget underlag

### ☠️ 1. `75fcdcfb` anger TVÅ olika färger om sig själv

| var | vad det står |
|---|---|
| tyska spec-blocket | `Farbe: Schwarz+Blau` |
| svenska spec-raden | `Färg: Blau` |

Avgörs på bilden, inte på raden. Samma klass som runda 120:s färgsyskon.

### ☠️ 2. `e526fd01` anger två olika BREDDER

`Gesamtabmessungen: 54L x 41,5B x 91,5H` mot svenska `Mått: 54L x 41B x 91,5H`.
En halv centimeter, och det är den svenska raden som tappat den. **Tyska
blocket är källan** — den svenska raden är importens sammanfattning.

### ☠️ 3. `74ea10dc` beskriver TVÅ hinkar men specar EN

Brödtexten: *"Zwei Eimer trennen klar von schmutzigem Wasser"*. Spec-blocket
anger bara `Kapazität: 26 L` och pressens mått. Ingen andra hink, ingen
delvolym. Materialraden motsäger sig också själv (`Kunststoff, Metall` tyskt,
`Kunststoff` svenskt).

⚠️ **Vattendelningen skrivs alltså bara om bilden visar den.** Det är exakt
den sorts påstående som säljer produkten, och därför det farligaste att ärva
oprövat.

### ☠️ 4. `45bac2cb` / `731c8bfc`: två korgar i texten, en i måtten, noll i lådan

| var | antal korgar |
|---|---|
| brödtext | *"einen großen 26-Liter-Eimer und **zwei Körbe**"* |
| spec | `Abmessungen des Korbs` — **en** måttrad |
| `Lieferumfang` | `1 x Wischmoppeimer mit Auspressvorrichtung` — **ingen korg** |

Tre källor, tre svar. Bilden avgör.

### ⚠️ 5. `da0f30b2` / `d8ebb279`: 25 liters hink på en vagn som anges tåla 15 kg

25 liter vatten väger 25 kg. Antingen gäller `Max. Gesamtbelastbarkeit: 15 kg`
bara hyllorna och korgen, eller så får hinken inte fyllas — och leverantören
säger inte vilket.

🔒 **Följden för texten: inget totalt lasttal skrivs för de två.** Korgens
5 kg står uttryckligen och får stå kvar. Att ärva 15 kg hade varit att skriva
ut ett tal som motsäger produktens egen huvudfunktion. Flaggas till Leonard.

### ⚠️ 6. `9aa46e31` tål 10 kg TOTALT — på en 121 cm vagn med tre hyllplan

Talet är lågt men entydigt och står bara på ett ställe, till skillnad från
punkt 5. Det skrivs som det är. Storasystern `75fcdcfb` anger 70 kg totalt
fördelat 40 / 10 / 10 / 10, och den summan går ihop.

### ⚠️ 7. Platshållaren `[BRAND NAME]` har strippats och lämnat skräp

`e526fd01`: *"industriellen Reinigungswagen von ."* · `9aa46e31`:
*"Reinigungswagen von –"*. Mekaniskt fel med mekaniskt svar; texten skrivs om
från grunden ändå.

## ☠️ SKU-krockar: tre produkter delar en SKU, två gånger om

| SKU | bärs av |
|---|---|
| `FP-reinigungseimer` | `45bac2cb`, `731c8bfc`, `74ea10dc` |
| `FP-reinigungswagen` | `da0f30b2`, `d8ebb279`, `9aa46e31` |

Sex av åtta produkter bär alltså två SKU:er mellan sig. Det är importens fel
(uppgift #272), inte poleringens, och Steg 8 löser det genom att synka SKU:n
mot den nya sluggen. **Men det måste göras för alla sex**, inte bara för
färgsyskonparen — `74ea10dc` och `9aa46e31` är helt andra modeller som råkat
få samma namnstam.

⚠️ **Prisnotering, ingen åtgärd:** `45bac2cb` (gul) kostar 1 179 kr och
`731c8bfc` (blå) 1 129 kr trots identisk konstruktion och identiska mått. Priset
rörs inte — det är Leonards beslut — men skillnaden ska nämnas i syskonlänken
så kunden inte tror att den dyrare färgen är en annan produkt.
