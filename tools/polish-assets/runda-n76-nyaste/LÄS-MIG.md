# Runda N76 — sex av de nyaste utkasten

Sex Aosom-utkast ur importens första dag, 2026-08-28, är polerade och
publicerade: en kattlåda, ett klösträd och fyra agilityset för hund. Rundan
följde samma regler som N64–N75, utan prisjämförelse, och allt skrevs via
workflowen "Polering — skriv en runda till Wix".

| id | produkt | SKU | huvudsökord (sökningar/mån, svårighet) | pris | saldo |
|---|---|---|---|---:|---:|
| `135d0f48` | Kattlåda med lock och tråg i rostfritt stål – ingång fram och utgång upptill | `FP-kattlada-lock-rostfritt-trag` | kattlåda med lock (inget mätvärde) | 749 kr | 127 |
| `e3cdd25f` | Klösträd 131 cm med stege och hus i sjögräs – tak överst, beige och kaffebrunt | `FP-klostrad-stege-sjograshus` | klösträd med stege (inget mätvärde) | 1 179 kr | 37 |
| `6d35a04f` | Hinderset med koner för hund – sex hinder i tre höjder, blått och gult | `FP-hinderset-koner-hund` | hinderset med koner (inget mätvärde) | 729 kr | 64 |
| `61a19bac` | Slalomset för hund med sex stänger – 305 cm bana, väska ingår, vitt och blått | `FP-slalomset-hund-sex-stanger` | slalomset för hund (inget mätvärde) | 699 kr | 157 |
| `d3c91eb3` | Hopphinder med fyllbar fot för hund – fyra hinder, höjd 15–95 cm, gult och rött | `FP-hopphinder-fyllbar-fot` | hopphinder med fyllbar fot (inget mätvärde) | 669 kr | 75 |
| `f6ab1dd4` | Agilityset med tunnel för hund – slalom, hinder och startfält, blått och gult | `FP-agilityset-tunnel-slalom` | agilityset med tunnel (inget mätvärde) | 749 kr | 129 |

**Inget pris är rört.**

## Urvalet

N76 tog de 120 nyaste utkasten efter N75 i tre omgångar om 40, alla skapade
2026-08-28 16:58–17:39 och nästan alla djur- och husdjursvaror. Enligt N64:s
regel gäller bara skyddsreglerna för de nyaste. De som inte redan bar ett
skyddsskäl dubblettskärmades mot hela den publicerade katalogen (kalibrering
4 av 4 och 2 av 2, självtest 9 av 9 i alla tre omgångarna), och huvudbilderna
jämfördes med de publicerade sidor som skärmen och ett namnsvep pekade ut.
Sex publicerades. 114 föll, vart och ett med exakt ett skäl i `FLAGGADE.md`
(kontrollerat med skript):

- **45 är djurbostäder**: hönshus, burar för gnagare och smådjur,
  sköldpaddshus, terrarier, en kattbur, elva katthus för utomhus och åtta
  fågelburar och voljärer.
- **26 rörs av main:s Runda-serie**: nio kattlådor, fem katthus och
  kattkorgar, två katttunnor, fyra klösträd, en klättervägg, en hundramp och
  fyra matstationer.
- **7 är slutsålda eller har saldo under 4.**
- **3 är redan kända dubbletter**: tre kattlådor som är samma låda som den
  publicerade `adb8c31b`.
- **17 bär ett märke på varan**: husmärkets skylt eller logotyp på själva
  varan eller på väskan, bland dem katthjulen, kattlådsskåpet och grindarna.
- **13 är samma varor som redan ligger ute**, i en annan färg eller som
  samma vara, och väntar på Leonards beslut.
- **3 är syskon inom rundan**: en ljusgrå kattlåda, blå hopphinder och ett
  agilityset med åtta slalomstänger.

## Det som överraskade

- **Tre utkast är samma varor som publicerade sidor, men mycket billigare.**
  Det grå klättersetet `2306bf9b` (699 kr) är samma set i samma färg som den
  publicerade `38c00989` (1 199 kr), den bruna XXL-kattlådan `161439a2`
  (1 099 kr) är samma kattlåda som `97d850b2` (1 529 kr), och A-hindret
  `bf3ae611` (1 199 kr) är samma hinder som `fdefa04b` (1 349 kr) i en annan
  färg.
- **Två publicerade sidor är samma vara.** Agilitysetet i tre delar ligger
  ute två gånger: `cc7ab001` (659 kr) och `1746334e` (759 kr).
- **Husmärkets skylt syntes först i förstoring.** Katthjulen, kattlådsskåpet
  och de fristående grindarna bär en liten skylt med husmärket på själva
  varan, som inte går att läsa i kontaktarkets storlek.
- **Fotot vann över källan.** Hopphindrens fötter är röda, fast källan säger
  orange, och ribbans längd (100 cm) står bara på måttbilden. Hinderkonernas
  stänger på 40 cm sätts ihop två och två till hinder på 80 cm.
- **Fem bilder ströks**: husmärkets logotyp och tysk text på kattlådan,
  hinderkonerna och hopphindren.

## Livekontrollen

Workflowen skrev, verifierade och stämplade alla sex i samma körning: 6 av 6
helt verifierade i en separat läsning 90 sekunder efter skrivningen,
kategorierna inräknade, och 6 stämplade utan stämpelfel.

Sidorna hämtades efter butikens cachefönster, alla med HTTP 200. Adresserna är
nya, så varje rendering är gjord efter skrivningen, som var klar 06:38 (UTC).
Vid den skarpa hämtningen var sidorna 96–137 sekunder gamla. Orddiffen mot
källfilerna gav **0 på alla sex**, livegrinden gav inga avvikelser, och
livekollen gav 6 av 6 OK med alla 25 alt-texter och en brödsmula genom en av
de tilldelade kategorierna. Alla sex har oförändrat pris.

**Pushen med rundans filer byggde inte.** Den slutade som CANCELED i både
fyndplats-cache-warmer och fyndplats-headless, alltså hoppade filtret över den
som det ska.

## Frågor till Leonard

1. 13 utkast är samma varor som redan ligger ute (listan med id och priser
   står i `FLAGGADE.md` under N76). Nio av dem är billigare än sina
   publicerade motsvarigheter, bland dem de tre ovan. Ska de bli färgval på
   de publicerade sidorna, egna sidor, eller ska de publicerade sidorna få de
   billigare artiklarna?
2. Agilitysetet i tre delar ligger ute två gånger, `cc7ab001` (659 kr) och
   `1746334e` (759 kr). Ska den ena avpubliceras?
3. Frågorna från N69–N75 står kvar.
