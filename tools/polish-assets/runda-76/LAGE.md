# Runda 76 — kontorsstolar, tre modeller i åtta kulörer

Alla fjorton steg klara. Åtta sidor publicerade och live-verifierade.

| id8 | slug | SKU | pris | färg: källan → skrivs |
|---|---|---|--:|---|
| 10235819 | `chefsstol-ljusgra-fotstod` | `FP-chefsstol-ljusgra` | 2 039 | Hellgrau → ljusgrå |
| 4fa0ae0a | `chefsstol-gra-fotstod` | `FP-chefsstol-gra-fotstod` | 2 039 | Dunkelgrau → **grå** |
| 143f9b2d | `skrivbordsstol-turkos-natrygg` | `FP-skrivbordsstol-turkos` | 899 | Grün → **turkos** |
| 6e05f8b7 | `skrivbordsstol-rosa-natrygg` | `FP-skrivbordsstol-rosa` | 899 | Rosa → rosa |
| 4293c5ce | `skrivbordsstol-ljusgra-natrygg` | `FP-skrivbordsstol-ljusgra` | 919 | Grau → **ljusgrå** |
| a5454821 | `sminkstol-rosa-teddytyg` | `FP-sminkstol-rosa-teddytyg` | 1 269 | Rosa → rosa |
| 0f7021fb | `sminkstol-gra-teddytyg` | `FP-sminkstol-gra-teddytyg` | 1 279 | Grau → grå |
| ce10bfe8 | `sminkstol-graddvit-teddytyg` | `FP-sminkstol-graddvit` | 1 269 | Cremeweiß → gräddvit |

Tre modeller: **D** chefsstol i mikrofibertyg med utdragbart fotstöd och rygg
som fälls till 148 cm djup (2 st) · **E** skrivbordsstol med nätrygg, 8,5 kg
(3 st) · **F** sminkstol i teddytyg med låg rygg, 37 cm (3 st).

Fyra av åtta färgord är MÄTTA fram, inte översatta: källan kallar en turkos stol
`Grün`, en ljusgrå `Dunkelgrau` och en grå `Grau`.

## Kvitton

| steg | kvitto |
|---|---|
| lint | 0 fel i 8 produkter |
| mutationstest | **42/42 fångade**, orörd text 0 fel |
| kort (Steg 9) | 8/8 byte-identiska i Wix, `sourceUrl` mot `runda-76/kort/` |
| bilder (Steg 9) | 8/8 antal + alt-texthash STÄMMER, kortet på position 3, 0 tomma alt |
| kategori (Steg 10) | `totalSuccesses: 1` × 8 |
| prisgrind (Steg 11) | 8/8 gröna `las` (1439–1446), `stammer true`, alla priser oförändrade |
| SKU (Steg 8) | 8/8 skrivna, alla distinkta, butikens gamla värde läst och rapporterat |
| publicering (Steg 12) | 8/8 `visible=true` + `variant.visible=true`, priser och bilder orörda |
| stämpling (Steg 13) | 8/8 gröna `stampla` (1447–1454) + oberoende `las` på en per modellgrupp (1455–1457) |
| **live (Steg 14)** | **8/8 `200`, cache `MISS`, text byte-identisk med facit**, eget kort i sidkällan |

## ☠️ Importens SKU-krock är uppmätt igen — åtta produkter, tre krockande grupper

Steg 8 läser butiken innan den skriver, och det butiken svarade var:

| importens SKU | bars av |
|---|--:|
| `FP-ergonomischer-burostuhl` | **2** produkter |
| `FP-burostuhl-ergonomisch` | **3** produkter |
| `FP-homeoffice-stuhl` | **3** produkter |

Åtta produkter, **tre** distinkta SKU:er. Efter Steg 8 är de åtta distinkta.

Det är samma fynd som #272 redan bär, men med ett tal: krocken skapas av
IMPORTEN (`lib/import/sku.ts` bygger ur den råa tyska sluggen, och tre
modellfamiljer delar rå titel), inte av poleringen. Runda 75 fann fem av sju
krockande; den här fann åtta av åtta.

⚠️ **Att läsa butiken före skrivningen är det enda som gör talet synligt.**
Hade Steg 8 skrivit ur planen hade utfallet varit identiskt och krocken osedd.

## ☠️ Bildpostens form är PLATT — `{image:{id}}` avvisas

Steg 9:s första försök byggde varje bildpost som `{image:{id:…},altText:…}`,
vilket är formen svaret LÄSER tillbaka. Skrivningen kräver den platta:

```
400  product.media.itemsInfo.items[0]: "id or url must not be empty"
     violatedRule: REQUIRED_ONE_OF_FIELD   supported: ["id","url"]
```

Läsformen och skrivformen är alltså olika, och läsningen visar BÅDA
(`{"id":…,"altText":…,"image":{"id":…,"url":…}}`) — den som bygger skrivningen
ur ett läst svar väljer därför lätt fel gren. Rätt post är `{id, altText}`.

✅ Felet var högljutt: PATCH:en avvisades och ingenting skrevs. Det kostade ett
anrop, inte en felskriven produkt. `mediajs.py` bär mätningen i sin docstring.

## ⚠️ `bilder=0` i publiceringens svar är ekot, inte en förlust

Steg 12:s PATCH-eko räknade noll bilder på alla åtta. Bilderna satt kvar —
en separat läsning med `?fields=MEDIA_ITEMS_INFO` gav 6/6 med oförändrad hash
på varenda produkt, före och efter publiceringen.

Det är runda 74:s regel en gång till: **ett PATCH-eko utelämnar media och är
inget kvitto.** Hade rundan grindat på ekot hade den rapporterat en
bildförlust som aldrig hände — och nästa runda hade "lagat" något helt.

## ☠️ `rosa` fick INTE stå i live-grindens tyska ordlista

Tre av rundans åtta stolar är rosa, och ordet är lika svenskt som tyskt. Ett
`rosa` i listan hade fällt tre korrekta sidor — samma klass som `Gelb` inuti
*re·gelb·undet* (runda 61).

Kvar i listan står `grau`, `braun`, `grün` och `weiß`: inget av dem inleder ett
svenskt ord. `ergonomisch` är säkert trots svenskans *ergonomisk* — mönstret
kräver ett `c` där svenskan har ett `k`.

Grinden bevisar sig själv: noll fel på åtta sidor betyder både att ingen tysk
sträng nådde kunden OCH att ingen post i listan är ett falsklarm mot vår text.

## Nästa

Kontorsstolsfamiljen har ~171 utkast kvar.
