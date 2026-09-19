# Runda 104 — de tre sista utkasten

Två Aprilia-motorcyklar i olika färg och en fyrhjuling. Alla tre är nu
publicerade, stämplade och live-grindade.

| id8 | sida | pris | bilder | SKU |
|---|---|--:|--:|---|
| `5e9cc2d2` | `aprilia-elmotorcykel-barn-12v-vit` | 1 759 | 6 | `FP-aprilia-12v-vit` |
| `1e27f7e0` | `aprilia-elmotorcykel-barn-12v-svart-gul` | 1 799 | 6 | `FP-aprilia-12v-svart-gul` |
| `883db249` | `elfyrhjuling-barn-12v-back-mp3-orange` | 3 079 | 4 | `FP-elfyrhjuling-12v-orange` |

---

## Steg 1 — dubblettgrind

Rundans stora måttsvep täckte 54 barnfordonssidor. Utöver det kördes en
smalare grind mot de 18 publicerade sidorna i de familjer utkasten hör till
(fyrhjulingar, gokarter, trampbilar, åkbilar) med SORTERAD nyckel, eftersom
leverantören kastar om L/B/H mellan sina egna sidor.

**18 sidor mätta, 0 krockar.** Kontrollmätningen ligger i skriptet: mönstret
måste hitta utkastens egna trippel i en känd sträng, annars är det mönstret
som är trasigt och inte katalogen som är ren.

⚠️ `gravmaskin-akbil-barn` gav **noll** trippel — den sidan bär inget
`a × b × c`-mått alls och kan alltså inte prövas den här vägen. Ingen risk här
(en grävmaskin är inte en motorcykel), men en sida utan mått är osynlig för
måttgrinden och det ska stå någonstans.

---

## Steg 5 — vad källan påstod och vad som stämde

☠️ **`1e27f7e0` anges som `Gelb` i källan. Bilen är SVART med gula dekaler.**
Felet går ned i leverantörens egen artikelnummersvans och i produkt-URL:en, så
det är inte ett skrivfel i ett fält utan i hela raden. Sidan heter därför
"svart" och beskriver gula dekaler på svart kaross.

☠️ **Måttritningen avgjorde 35 mot 36 cm.** På ett kontaktark i 300 px gick
sitsens etikett att läsa som `36cm`. En förstoring av ritningens sitsruta visar
`35cm` och `14cm` — samma tal som spec-blocket. Talet hade annars stått fel på
både sidan och kortet. **Läs alltid av en ritning i förstoring, aldrig på ett
kontaktark.**

☠️ **Fyrhjulingen har INGEN måttritning.** Måtten vilar då på spec-blocket
ensamt, alltså precis det läge där runda 103 hittade ett block **kopierat från
en annan modell** (#366). Kontrollen blev fotot i stället:

| | |
|---|--:|
| hjulets andel av produktens höjd i studiobilden | ~47 % |
| specens 36 / 73 cm | 49 % |

Talen hör ihop inom perspektivfelet, så blocket är inte hämtat från en annan
modell. **Ett foto duger som andra källa när ritningen saknas — men bara för
proportioner, aldrig för ett absolut mått.**

☠️ **Leverantören motsäger sig själv om laddaren.** Punktlistan säger
*"Ladegerät im Lieferumfang enthalten"*, medan innehållsförteckningen bara
listar quad + anvisning. Sidan påstår därför INGENTING om en laddare — samma
hållning som polisbilen och Maseratin fick. Frågan till Aosom står kvar.

---

## Steg 9 — två tyska textkort ur fyrhjulingens galleri

Fyrhjulingens bild 4 och 5 var **tyska textkort i pixlarna**:
`FEDERUNGSSYSTEM / Es bietet ein komfortables und sanftes Sitzerlebnis` och
`GEEIGNET FÜR VERSCHIEDENE STRASSEN` med `Gras · Ziegelstraße · Sand ·
Asphaltstraße`. De kan inte visas för en svensk kund och är borttagna. Kvar
blir fyra bilder: hjälte, verklighetsbild, vårt kort, verklighetsbild.

Motorcyklarna behöll alla fem och fick kortet insatt på plats 3 med ritningen
flyttad sist — samma ordningsfel som rundans övriga sju sidor hade.

Live-grinden prövar uttryckligen att de två borttagna bild-id:na INTE ligger
kvar, och att verklighetsbilden på plats 2 finns kvar.

⚠️ **Grindens första version fällde en korrekt sida.** `3122e6c3` stod i
`far_ej` — men det är verklighetsbilden som SKA ligga kvar, inte ett av de
tyska korten. Rättat och kommenterat i skriptet: en grind som fäller rätt sida
lär mottagaren att sluta läsa, alltså exakt det fel den finns för att fånga.

---

## Steg 8 — och samma SKU-defekt en gång till

Båda motorcyklarna bar `FP-12v-kinder-motorrad-mit`, fyrhjulingen
`FP-12v-kinderfahrzeug-mit`. Tyska, och den ena delad av två produkter.

De nya är valda enligt barstolsregeln och kontrollerade lediga mot alla 2 389
publicerade sluggars härledda SKU. Att regeln behöver hjälp syns direkt:

| slug | regelns mekaniska kapning | vald i stället |
|---|---|---|
| `aprilia-elmotorcykel-barn-12v-vit` | `FP-aprilia-elmotorcykel` | `FP-aprilia-12v-vit` |
| `aprilia-elmotorcykel-barn-12v-svart-gul` | `FP-aprilia-elmotorcykel` ← samma | `FP-aprilia-12v-svart-gul` |
| `elfyrhjuling-barn-12v-back-mp3-orange` | `FP-elfyrhjuling-barn-12v` ← krockar med TVÅ publicerade | `FP-elfyrhjuling-12v-orange` |

Alltså: kapningen ger en delad sträng för färgsyskonen OCH en krock med två
levande sidor. Det är runbookens dokumenterade färgfamiljsproblem, mätt igen.

---

## Två API-fynd som gäller alla framtida rundor

### ☠️ `products/query`:s markör flyttar sig INTE — den tysta varianten

Utkasten skulle hittas på sitt id-prefix, och svepet läste "2 000 rader på 40
sidor" utan en enda träff. Talen var påhittade av API:t: varje sida var samma
50 rader.

| anropsform | första id | sista id | ny markör |
|---|---|---|---|
| sida 1 | `ca3d32d0` | `b8d21670` | = markören |
| markör + filter + limit | `ca3d32d0` | `b8d21670` | = markören |
| BARA markören | `ca3d32d0` | `b8d21670` | = markören |

Ingen form flyttar den. **`products/search` gör det** — och den ERRAR i stället
för att tiga när anropet är fel:

```
400 SE-1141  Invalid usage of cursor paging:
             Search, filter and aggregations cannot be specified together with cursor
```

Alltså: skicka `filter` bara på FÖRSTA sidan, därefter enbart `cursorPaging.cursor`.
Så gjort läste svepet **3 158 unika utkast på 32 sidor** — `unika == lästa`, vilket
är kontrollmätningen. `search` respekterar dessutom `limit: 100` där `query`
kapar på 50.

**Regeln, en gång till: ett svar utan fel är inget kvitto — och ett svar med
plausibla TAL är det inte heller.**

### ☠️ `bulk/categories/add-item` kräver `treeReference`

Utan den svarar Wix `400 treeReference must not be empty`. Formen är
`{ appNamespace: "@wix/stores" }`, och den går att läsa ur vilken kategori som
helst i `categories/v1/categories/query`.

⚠️ Och kategorierna syns INTE i en återläsning i samma anrop som skrivningen —
`directCategoriesInfo` släpar. Två av tre visade bara `All Products` direkt
efter en skrivning som rapporterade `totalSuccesses: 2`; en egen läsning en
halv minut senare visade alla tre kompletta. Det är #357, mätt igen.
