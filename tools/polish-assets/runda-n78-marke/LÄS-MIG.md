# Runda N78 — de tretton som N77 lämnade

Åtta Aosom-utkast är polerade och publicerade: agilitybågar, ett katthjul, en
fristående hundgrind, tre agilityset, en täckt självrengörande kattlåda med app
och en kattlådemöbel. Fem syskon blev val på tre av sidorna i stället för egna
sidor: agilitybågarna finns i tre färger, katthjulet i tre färger och grinden i
två höjder. Rundan följde runbook v2 på main, utan prisjämförelse, och texterna
skrevs via workflowen "Polering — skriv en runda till Wix".

| id | produkt | SKU | huvudsökord (sökningar/mån, svårighet) | pris | saldo |
|---|---|---|---|---:|---:|
| `ee50f5bf` | Agilitybågar för hund, fyra stycken – för lätt träning, med bärväska | `FP-agilitybagar-hund` | agilitybågar för hund (inget mätvärde) | 659 kr | 179 |
| `4664e423` | Katthjul med klösmatta och broms – löphjul på 91 cm för katter under 5 kg | `FP-katthjul-klosmatta-broms` | katthjul med klösmatta (inget mätvärde) | 1 159 kr | 144 |
| `5f84f2c1` | Fristående hundgrind med dörr – fyra hopfällbara paneler, 205 cm bred | `FP-hundgrind-fristaende-dorr` | fristående hundgrind med dörr (inget mätvärde) | 869 kr | 36 |
| `8ad49cfe` | Agilityset i fyra delar för hund – vita bågar med orange slang, 99 cm höga | `FP-agilityset-fyra-delar` | agilityset i fyra delar (inget mätvärde) | 619 kr | 157 |
| `480eefad` | Agilityset med hoppring, hinder och slalom – pausruta, visselpipa och bärväska | `FP-agilityset-hoppring-slalom` | agilityset med hoppring (inget mätvärde) | 649 kr | 111 |
| `6a6bfd64` | Agilityset med två tunnlar – hoppring, två hopphinder, slalom och pausruta | `FP-agilityset-tva-tunnlar` | agilityset med två tunnlar (inget mätvärde) | 1 319 kr | 49 |
| `b60b0392` | Täckt självrengörande kattlåda med app och wifi – 80 liter, för katter 1–5 kg | `FP-sjalvrengorande-kattlada-tackt` | täckt självrengörande kattlåda (inget mätvärde) | 3 649 kr | 12 |
| `003ace14` | Kattlådemöbel för två katter – två skåp med kattlucka, vit, 145 cm | `FP-kattlademobel-tva-katter` | kattlådemöbel för två katter (inget mätvärde) | 2 099 kr | 120 |

Valen på de sammanslagna sidorna, med pris och saldo per val:

| sida | val |
|---|---|
| agilitybågarna `ee50f5bf` | orange 659 kr (179), gul 669 kr (36), vit 699 kr (109) |
| katthjulet `4664e423` | ek 1 159 kr (144), valnöt 1 199 kr (88), grå 1 119 kr (23) |
| hundgrinden `5f84f2c1` | 70 cm 869 kr (36), 91,5 cm 1 019 kr (47) |

**Inget pris är rört.** Varje val har det pris givaren hade i butiken, men se
*Det som överraskade* om nästa synk.

## Urvalet

N77 lämnade tretton utkast åt nästa runda, eftersom den rundan var full vid åtta.
N78 tog alla tretton:

- **8 polerades och publicerades.**
- **5 blev val:** agilitybågarna med gula `75a94825` och vita `d6283e97` bågar på
  `ee50f5bf`, katthjulen i valnöt `1e1f9dcb` och grått `fcb3dd7c` på `4664e423`,
  och grinden på 91,5 cm `edac20c7` som storlek på `5f84f2c1`.

Alla tretton gick genom N77:s dubblettskärm mot de 3 770 publicerade sidorna.
N78 jämförde dessutom med de publicerade sidor som namnen pekade på. Ingen av dem
var samma vara:

- **Katthjulet `7253f433`** är ett AliExpress-hjul i massivt trä, med ribbor som
  har 6 mm mellanrum och fem storlekar i tum. Utkasten är av flerskiktsskiva med
  klösmattor av wellpapp på insidan.
- **Agilitybanan `08230ec1` och agilitysetet `82fec275`** har andra mått än
  setet med två tunnlar `6a6bfd64`: hindret 72 × 93 × 92,5 cm mot 98 × 63 × 93
  cm, slalomet 350 mot 321 cm och rutan 87 mot 96 cm.
- **Hundgrindarna `03207c35` och `c6554568`** är vita, saknar dörr och har andra
  mått (206 × 35,5 × 76 cm och 203,5 × 29,5 × 61 cm).

**Bilderna:** 40 bilder på de åtta sidorna blev 31. Tysk text i bilden strök
katthjulets bild 4, grindens bild 3 och 4, hoppringssetets bild 4, kattlådans
bild 3 och 4 och kattlådemöbelns bild 4. Agilitybågarnas bild 5 ströks för engelsk
reklamtext och husmärkets logotyp, och tunnelsetets bild 5 för att den visar en
ramp och en hundpool som inte ingår. Den självrengörande kattlådan har en gul
varningsetikett med läsbar text på sex språk. Etiketten sitter på själva varan,
så bilden behölls enligt runbooken. Alla åtta behöll minst tre bilder.

## Syskonen blev val

Syskonens tyska källtexter är desamma som sidans, utom färgen eller höjden och
det som följer av den. Agilitybågarna skiljer i fraktvikt och paket, 6 kg med
orange bågar och 4,5 kg med gula eller vita, och grindarna i alla höjdmått,
fraktvikt och paket. Katthjulens syskon har dessutom en rad om tysta gummihjul i
foten, som stämmer med sidans text. Varje syskon lades in med workflowen
*Dubbletter — lägg ett utkast som färg eller storlek på en publicerad sida*,
`plan` och `byt` i den ordningen.

- Återläsningen efter varje körning gav rätt antal varianter, varje val med sin
  egen bild kopplad och en artikel per variant i mappningen.
- Givarna är pensionerade (`rejected`), inte raderade.
- Färg-, fraktvikt- och paketraderna på agilitybågarna, färgraden på katthjulet
  och de mått som beror på höjden på grinden skrevs om efteråt, liksom grindens
  fråga om dörren. Skrivningen var en PATCH av bara `plainDescription`, med
  kontrollsumman prövad mot filen i samma anrop. En separat läsning gav samma
  hash som `vantat-hash.tsv` på alla tre, och valen, varianterna och bilderna
  var orörda.
- De tre `.html`-filerna bär därför texten efter sammanslagningen, medan
  `skrivplan.json` visar vad rundans skrivning skickade. `kallor.json` har för
  de tre sidorna fått syskonens källrader tillagda, så att siffergrinden täcker
  de nya talen, och `foto-tal.txt` har grindens mankhöjd för 91,5 cm, avläst på
  syskonets bild 3.
- Live, efter butikens cache: varje val byter till sitt eget foto, priset följer
  valet och alla står som *I lager*.

## Det som överraskade

- **Hoppringssetets källtext hör till ett annat set.** Källan för `480eefad`
  räknar upp två tunnlar och två hopphinder, men fotot och förpackningslistan
  visar hoppring, ett hopphinder, slalom och pausruta. Texten följer fotot och
  förpackningslistan, och en fråga i FAQ:n säger att ingen tunnel ingår.
- **Grindens mankhöjd står bara i bilderna.** Under 45 cm lästes av på bild 3,
  som sedan ströks för sin tyska text. Under 60 cm för den höga grinden lästes
  av på syskonets bild 3, som inte följde med till sidan.
- **Priset på de fem nya valen kan ändras vid nästa synk.** Som egna utkast
  följde de konkurrentregeln. Som val följer de husets regel från nästa körning
  av Aosom-synken. Planen varnade för det, och det är verktygets dokumenterade
  beteende, samma sak som för den rosa sparkcykeln i N77.
- **Givarnas bilder har verktygets alt-text.** Den byggs av sidans namn och
  valet, till exempel *… med bärväska i färgen gul*. Den är svensk och klarar
  alt-svepet, men den beskriver inte bilden.

## Livekontrollen

Workflowen skrev, verifierade och stämplade alla åtta i samma körning: text,
media, 16 kategorirader och SKU, 8 av 8 verifierade i en separat läsning. Efter
sammanslagningarna och texträttningen gav orddiffen mot källfilerna **0 på alla
åtta**, livegrinden gav inga avvikelser och livekollen gav 8 av 8 OK med alla
31 alt-texter. Semrush-enheterna var slut (403), så sökorden är valda på
produkttypen. Alla åtta slugar prövades mot hela katalogen utan krock.

## Frågor till Leonard

1. **Priset på de nya valen:** räcker husets regel från nästa synk, eller ska
   något av dem ha ett annat pris?
2. **Alt-texten på givarnas bilder:** ska jag skriva en egen som beskriver
   bilden, som på sidornas övriga bilder?
3. Frågorna från N69–N77 står kvar.
