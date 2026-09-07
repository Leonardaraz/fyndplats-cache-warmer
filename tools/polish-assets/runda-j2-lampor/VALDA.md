# Runda J2 — åtta lampor 639–1 249 kr

Urvalet är gjort på SPRIDNING, inte på pris. Lampfamiljen har 55 tyska utkast
kvar, och den bär täta syskonkluster: tre rader heter ordagrant "Stehlampe mit
Fernbedienung, höhenverstellbar, Stoffschirm" och fyra heter "Stehlampe mit
Regalen, Stehleuchte, Holz, 26 x 26 x 160 cm". Att ta åtta ur ett sådant kluster
hade gett åtta nästan identiska sidor — precis mönstret i #131, #139, #141 och
#153. Här är i stället en av varje typ: golvlampa, båglampa, bordslampor,
hyllampa, LED-stav, taklampa och vägglampor.

| kort | pris | saldo | vad det är |
|---|---:|---:|---|
| 839326a2 | 1 249 | 104 | RGB-belyst vitrinhylla, 4 plan, 157 cm |
| 21c72bf0 | 1 119 | 163 | Båglampa, marmorfot, 167 cm, silver |
| e206fdd8 | 1 029 | 11 | Bordslampor 2-pack, bärnstensglas + linneskärm |
| 53e66496 | 849 | 108 | Golvlampa med tre hyllor, vit/trä, 159 cm |
| d286370d | 799 | 43 | Golvlampa, guldstål, smal linneskärm, 157 cm |
| fbddd5b6 | 779 | 95 | LED-stavlampa 150 cm, 3000–6000 K, fjärrkontroll |
| 8f8c287e | 699 | 82 | Taklampa, räfflad akrylskärm, Ø32 cm |
| 4311c3a2 | 639 | 108 | Vägglampor 2-pack, gallerdesign, 3 ljusfärger |

**Lagersaldot är kollat FÖRE poleringen** (#173), lägsta är 11. Ingen av de åtta
är slutsåld, alltså kan ingen falla på `slutsald` i prisgrinden.

## Vad kontaktarket ändrade — och det gjorde det innan en rad text skrevs

Regeln från 2026-09-07 säger att bilderna ska läsas före texten. Den betalade
sig direkt: **två av åtta produkter är inte det den tyska texten säger.**

1. ☠️ **`839326a2` är ingen golvlampa.** Feeden kallar den "Stehlampe mit
   Glasregalen" och namnet säger "4-Ebenen-LED-Stehleuchte". Bilden visar en
   fristående **hylla** i svart metall med glashyllplan och RGB-slingor i
   stommen — den lyser UPP hyllan, den lyser inte upp rummet att läsa i. Hade
   texten skrivits ur den tyska titeln hade kunden beställt en läslampa och
   fått en vitrinhylla.
2. ☠️ **`53e66496` är ingen "Deckenfluter".** Ordet betyder uplight, och den
   tyska texten använder det två gånger. Bilden visar en **sluten fyrkantig
   tygskärm** som lyser genom tyget åt alla håll, inte upp i taket. Ett
   uplight-löfte hade varit fel om produktens enda funktion.

Två mätfel i källans siffror rättade på samma sätt: `d286370d` anger
"Basisabmessungen: Ø2,5 x 2,8H cm" — måttritningen säger **Ø25 cm**, och en
fot på 2,5 cm bär ingen 157 cm hög lampa. `e206fdd8` anger "Lieferumfang: 1 x
Tischlampe" men namnet, punktlistan OCH båda produktbilderna säger två — och
5,5 kg i en 59 × 44 × 26-kartong är två lampor, inte en.

## ⚠️ En syskonrelation som ska stå skriven, inte återupptäckas

`53e66496` (849 kr) och J1:s redan publicerade `d2dfd1fa` (949 kr) är samma
FORMAT: en 26 × 26 cm pelare med tre hyllplan, 39 cm mellan planen, fyrkantig
tygskärm och drag­omkopplare. Det är nära nog att de hamnar bredvid varandra i
en listning.

⚠️ **Men de är INTE färgsyskon, och den första versionen av det här stycket
påstod det.** Specarna skiljer på mer än färgen:

| | 53e66496 (849 kr) | d2dfd1fa (949 kr) |
|---|---|---|
| Uttag i sockeln | inga | USB-A, USB-C och eluttag |
| Ljuskälla | E27, ingår inte | LED 6 W ingår, 700 lm, 5000 K |
| Dimning | nej | ja, via kedjan |
| Bärighet per plan | 2,5 kg | 2 kg |
| Färg | vit med bruna hyllplan | svart med vit skärm |

Hundralappen betalar alltså för uttagen och ljuskällan, inte för färgen. Det
är ett verkligt val för kunden, och båda sidorna är därmed motiverade — men
namnen måste bära skillnaden, annars ser paret ut som två priser på en vara.
J1:s titel säger redan "USB-A"; den här säger "vit med bruna hyllor".

Båglamporna är däremot INTE syskon, trots att båda är bågar: J1:s `9e81d573`
är svart med tygtrumskärm, 190 cm hög och 105 cm räckvidd; `21c72bf0` är
silver med metallkupa, 167 cm och 100 cm. Olika skärmtyp, olika fotmaterial
(metall mot marmor), olika höjd.

## Skrivet och verifierat

Alla åtta publicerade, kategoriserade och stämplade 2026-09-07.

| kontroll | utfall |
|---|---|
| Textgrind + siffergrind (`gate.py`) | 0 fynd i 8 filer |
| SEO-grind (`gate-seo.py`) | 0 fynd i 8 rader |
| Alt-grind (`gate-alt.py`) | 0 fynd, 40 alt-texter |
| Återläsning mot `vantat-hash.tsv` | **8/8 LIKA** |
| `visible` på produkt och variant | 8/8 true |
| Kategori (Hem & Inredning + Belysning) | 16/16 lyckade |

☠️ **Hashen är kvittot, inte PATCH-svaret.** Skrivsvaret ekar tillbaka exakt
det som skickades, så ett transkriberingsfel bekräftas som "sparat" —
`fontagen-weight` (2026-09-06) syntes bara i en diff mot filen.

⚠️ Siffergrinden fällde tre rader i första omgången, och alla tre var samma
sak: källan SKRIVER UT små tal ("drei Glasregale", "zwei AAA-Batterien") medan
jag satt siffra. Rättningen gick åt rätt håll — texten skriver nu talet som
källan gör. Att i stället lära grinden översätta tyska räkneord till siffror
hade varit en stor och opålitlig yta, och den hade släppt igenom en verkligt
påhittad trea så fort källan råkade innehålla ordet "drei" om något annat.
