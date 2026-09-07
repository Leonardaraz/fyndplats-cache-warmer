# Runda 91 — Steg 1, 2, 4 och 5

Modell E:s fyra färger, sparkcykelfamiljens sista sammanhållna grupp.

| id8 | färg (källan) | färg (MÄTT i zoom) | pris | paketmått |
|---|---|---|--:|---|
| `369b4b2c` | Schwarz | svart | 1 169 | 89 × 16 × 44 |
| `feac1d03` | **Hellblau** | ☠️ **turkos** | 1 199 | 89 × 16 × 44 |
| `c851d101` | Weiß | vit | 1 219 | ⚠️ **90 × 44,5 × 16** |
| `1b1d4842` | Beige | gräddvit/beige | 1 249 | 89 × 16 × 44 |

## Steg 1: dubblettgrinden är ren, och svepet är fullständigt

**Pixelgrinden** (`abs(gray(a)-gray(b)).mean()` på 320 × 320) kördes mot **alla
107 bilder på familjens 19 publicerade sidor** och inbördes mellan de fyra:

| jämförelse | par under 1,0 |
|---|--:|
| modell E mot allt publicerat | **0** |
| E-syskonen inbördes | **0** |

Noll även inbördes betyder att varje färg är egen-fotograferad — här finns inte
ens runda 90:s falska signal från en delad komponentnärbild.

**Slug-krock:** hela katalogen svept i ETT anrop — **56 sidor, 5 527 rader,
5 527 unika, `avhuggen: false`**, och den kända publicerade
`sparkcykel-barn-120-cm-lagt-styre-turkos` hittades. **Noll krockar** på de
fyra kandidatsluggarna.

⚠️ Krockkontrollen kördes TVÅ gånger, och den andra var nödvändig: zoomen
ändrade `feac1d03` från "ljusblå" till turkos, alltså ändrades sluggen efter
att den första kontrollen redan var grön. **En slug som ändras måste kollas om.**

## ☠️ Modell E är INTE modell D — och den enda skillnaden är styrhöjden

Familjekartan i runda 90 satte dem som skilda modeller på bilden. Talen säger
samma sak, men bara på ett ställe:

| | D (publicerad ×2) | E (utkast ×4) |
|---|---|---|
| längd × bredd | 120 × 58 cm | 120 × 58 cm |
| **styrhöjd** | **75–80 cm** | **85–95 cm** |
| hjul | Ø12 tum | Ø30 cm |
| maxlast | 100 kg | 100 kg |

Styrhöjden är hela skillnaden, och den är stor: E:s LÄGSTA läge (85 cm) ligger
över D:s HÖGSTA (80 cm). De två kan alltså inte passa samma barn. Sluggarna
skiljer på just det — `lagt-styre` mot `hogt-styre` — och varje sida korslänkar
till den andra.

## ☠️ Steg 5: fotbollsmönstret finns inte. Igen.

Tre av fyra (`369b4b2c`, `c851d101`, `1b1d4842`) lovar *"Langlebige aufblasbare
Gummiräder im Fußballdesign"*. **Runda 89 fällde exakt samma påstående på
modell F** och skrev in det som en grind: *"Zoomat är framhjulet ett vanligt
grovmönstrat gummidäck. ORDET FOTBOLL FÅR INTE FÖREKOMMA."*

Zoomat här på `369b4b2c-3` och `feac1d03-4`: samma sak. Ett vanligt
grovmönstrat offroad-däck. **Ordet skrivs inte.**

## ☠️ Steg 5: fyra påståenden till

1. **Ø30 mot Ø30,5 cm.** `369b4b2c` säger Ø30,5, de andra tre Ø30. Till
   skillnad från runda 90:s markfrigång (9 mot 11 cm — en femtedels skillnad i
   ett mått som avgör om plattan skrapar) är det här **samma mått avrundat två
   gånger**: 12 tum = 30,48 cm. **Ø30 cm skrivs** — tre av fyra säger det, och
   det är talet familjens publicerade sidor bär.

2. ⚠️ **Paketmåttet skiljer på `c851d101`**: `90 × 44,5 × 16` mot syskonens
   `89 × 16 × 44`. Både talen OCH ordningen. Att räkna om det till syskonens
   ordning vore tolkning, inte mätning. **Varje sida bär sitt eget tal**,
   ordagrant ur sin egen rad.

3. ✅ **"Stahlrahmen mit rostbeständiger Pulverbeschichtung"** är sant och
   skrivbart som **pulverlackerad stålram**. Det är INTE "rostfri" — runda 57
   och 90 fällde det ordet, och det gäller fortfarande. Beläggningen skrivs;
   korrosionslöftet skrivs inte.

4. ☠️ **`feac1d03` är TURKOS, inte "Hellblau".** Zoomad hjältebild: en klart
   blågrön ram med guld- och svartrandning. Samma leverantörsvana som runda 89
   mätte (*"Källan säger 'Blau' om två ramar som är turkosa i bild"*).

## ✅ Två saker bilderna GER som ingen text har

- **Fotplattan är 30 × 11 cm.** Utmärkt på måttskissen (`feac1d03-2`,
  `c851d101-2`). Ingen av de fyra tyska texterna nämner den.
- **Alla fyra har stödben.** Bara `feac1d03`s text nämner det
  (*"inklusive eines Ständers"*); de andra tre är tysta om det. Fjädrande
  metallstöd, synligt i hjältebilden och skissen på samtliga.

⚠️ Och `feac1d03`s brödtext är över huvud taget en annan text än syskonens —
den räknar upp 12"-hjul, stödben och bred plattform där de tre andra räknar upp
fotbollsmönster och stålram. **Måtten är identiska på alla fyra.** Det är två
marknadsföringstexter för en produkt, inte två produkter.

## Steg 2: laglighet

Leksaksprodukt för barn. **Ingen standard nämns någonstans i underlaget** —
"godkänd", "certifierad", "CE-märkt" och "testad enligt" är lika obelagda
(uppgift #252). Hjälm skrivs som rekommendation, aldrig som lag: en vanlig
sparkcykel är ett lekfordon och föraren är gående enligt trafikförordningen
1 kap 4 §. Monteringen ska göras av en vuxen.

## Bildgrind: logotypsvepet är rent

Övre vänstra hörnet granskat på alla **20** bilder. **Noll leverantörslogotyper.**
Ordet SCOOTER i guld sitter tryckt på ramen på samtliga — fysiskt på varan, rörs
inte, namnges aldrig i text eller alt-text.
