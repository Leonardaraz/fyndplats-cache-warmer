# Runda M4 — körlogg

Åtta julgranar, 1 259–1 599 kr. Alla Aosom-utkast, alla publicerade.

## Steg för steg, med kvitton

| steg | utfall |
| :-- | :-- |
| Källor hämtade ordagrant | 8/8, kontrollsumma räknad i anropet |
| Källor bevisade mot `kvitto-kalla.json` | **8/8 LIKA** |
| Lagergrind i urvalet | 8/8 spårat saldo, 7–197 |
| Dubblettskärm på huvudbildens hash | 8 unika huvudbilder, 39 unika av 39 filer |
| Kontaktark byggt FÖRE brödtexten | 8 ark, 39 bilder |
| Homoglyfsvep före grindning | **0 fynd** |
| Grindar (siffer/axel/alt/seo/sku/superlativ/länk) | rena |
| Prisgrind via `las` | **8/8 `stammer: true`** |
| Transkriberingsspärr FÖRE varje skrivning | **8/8** — och den FÄLLDE en gång, se nedan |
| Bilder skrivna | 39 (noll borttagna — första granrundan utan en enda tysk bild) |
| Alt-texter skrivna | 39, noll tyska |
| SEO skriven | 8 × två taggar, keywords rensade |
| Variant-SKU skriven | 8/8 svenska, unika, i eget sista anrop |
| Kategorier | **16/16 kopplade**, noll fel, noll odetaljerade |
| Wix-återläsning mot facit | **80 kontroller, 0 fel** |
| Mappningsraderna stämplade | 8/8, alla tre fälten, rutten läste tillbaka |
| **Live-grind på publicerad sida** | **8/8 REN, orddiff 0** |

Alla workflow-körningar kördes med `ref` satt till den här grenen, aldrig mot
`main` (#181).

## ☠️ Transkriberingsspärren fällde — och felet var mitt facit, inte texten

Första skrivningen av `3523deaa` avbröts:

```
{"AVBRUTET":"transkriberingsfel — ingenting skrivet",
 "fick":833814621,"vantat":848253086,"tecken":3514}
```

Ett tecken av 3 515. Orsaken var **filens avslutande radbrytning**: facit
räknades på filen, men det som skickas är filen UTAN den — en template-literal
som slutar med `</p>` bär ingen sista `\n`.

⚠️ Det är samma byte som `wixnorm.py` punkt 5 redan dokumenterar på
LÄSNINGENS sida (Wix strippar den vid sparandet). Den gällde alltså åt båda
hållen hela tiden, och ingen hade skrivit ned skrivningens halva.
`kvitto-text.json` räknas nu på `rstrip("\n")` och bär skälet i klartext.

☠️ **Och det är precis den avvikelse som är farligast:** en byte ser ut som en
struntsak, är omöjlig att skilja från ett äkta transkriberingsfel på ett
tecken, och den som sett den tillräckligt många gånger slutar titta efter
vilket det var. Spärren gjorde rätt som fällde; det som saknades var ett facit
som mätte samma sträng.

## Sex fel som ingen grind kunde se

Alla sex hittades vid genomläsning av filerna, efter att varje maskinell grind
gått ren:

| fel | var | varför grinden var blind |
| :-- | :-- | :-- |
| `standardhöjd` — en norm utan källa | 17392493, 3523deaa | siffergrinden såg bara ett oförankrat "tre" |
| `drygt en och en halv kvadratmeter` på Ø122 cm (= 1,17 m² som cirkel, 1,49 som kvadrat) | 3523deaa | talet står i ORD |
| "ungefär samma golvyta som en golvlampa" på Ø70 cm | 86fdd9af | ett påstående om en annan sak |
| "Fukt drar åt sig konstsnön" — bakvänt orsakssamband | 86fdd9af | språkligt felfritt |
| "den lättaste sortens gran i den här höjden" | 86fdd9af | superlativ om MARKNADEN, se nedan |
| `toppprydnaden` — tre lika konsonanter | 17392493 | inte i någon ordlista |

☠️ **`gate-superlativ.py` kan bara se superlativ om VÅRT sortiment.** Den
kräver ett omfång som syftar på katalogen (`i vårt sortiment`, `i serien`).
"Den lättaste sortens gran i den här höjden" handlar om marknaden — ett
bredare och mindre verifierbart påstående, och osynligt för grinden. Det är
inte en bugg i den; det är en lucka som är värd att veta om.

Och två fel rättades **per ORD över hela batchen** i stället för där de syntes:
`N cm över` (elva gånger i sju filer) och bindningen av 180 cm till HÖJDEN,
som `gate-axel.py` varnade för på fyra produkter.

## ☠️ Axelfacit-generatorn behövde en spärr, och regressionen hittade den

`86fdd9af` har `Gesamtabmessung: Ø70 x 210 cm` — en riktig totalrad UTAN
axelbokstav, alltså noll par och en generator som avbryter. Den svenska
spec-raden bär bokstaven (`Ø70 x 210H cm`), så generatorn läser den när den
tyska tiger.

Första utkastet villkorade bara på att en svensk rad fanns. Regressionen mot
M1 visade direkt vad det kostar: isbjörnsparet `5a14cc4d` har INGEN tysk
totalrad (två figurer, bara `Große`/`Kleine Bärenabmessungen`) men en svensk
`Mått:`-rad med den STORA björnens tal. Fallbacken gjorde om ett korrekt
`axellos` till ett facit som påstår att setet är 80 × 30 × 60.

**Ett facit som ljuger är värre än inget facit** — grinden faller då på
korrekt text i stället för att säga "jämförde inte".

Två spärrar, och var och en räcker själv (uppmätt genom att återinföra dem en
i taget): fallbacken kräver att källan PÅSTÅR ett totalmått, och de två
radernas tal måste vara samma tal. `lib/polish/axelfacit.test.ts` låser båda.
M1, M2 och M3 regenererar byte-identiskt.

## Vad fotona gav

Se `FOTOFYND.md`. Fem fynd, fyra av dem osynliga för varje textgrind — den
dyraste är att `86fdd9af` är en VIT gran medan källan säger `Farbe: Grün`.

## Bilder

Noll borttagna. Första julgransrundan utan en enda tysk grafik eller inbränd
text — alla 39 är produktfotografi.

⚠️ `5814c7e1` har fyra bildplatser men bara TRE bilder: position 1 och 4 är
byte-identiska (md5 `20de9acd…`). Alt-texten beskriver därför båda ärligt som
samma motiv. Kandidat för bildreparation.

## Tre alt-texter skriver medvetet FÄRRE tal än ritningen visar

| kort | vad ritningen säger | vad alt-texten säger | varför |
| :-- | :-- | :-- | :-- |
| `17392493` | höjd 180 cm | bara bredden 122 cm | källan säger 183 tre gånger; två höjder på samma sida vore värre än en |
| `5f646ce6` | bredd 180 cm | bara höjden 180 cm | ritningens breddfält är höjdmåttet dubblerat (källan: 115) |
| `86fdd9af`, `17392493` | `180cm` vid en människosiluett | aldrig | talet är SILUETTENS höjd, inte produktens |

## Sju av åtta delade samma tyska variant-SKU

`FP-kunstlicher` på sju produkter, `FP-weihnachtsbaum-kunstlich` på den
åttonde. Var och en har nu ett eget svenskt SKU som säger vad som skiljer
granen från syskonen, skrivet på BÅDA sidorna (Wix-variantens `sku` och
mappningsradens).

## Live-verifieringen: 8/8 REN

Orddiff 0 på alla åtta, och `REN` täcker varje svep i grinden — sid- och
alt-svep, SEO mot `seo.tsv`, homoglyfer, brödsmulan, skötselfliken,
köpbarheten och korslänken.

Verifierad åt båda hållen med tre planterade fel i tre olika klasser:

| planterat | var | grinden svarade |
| :-- | :-- | :-- |
| `golv` → `parkett` i brödtexten | 3523deaa | `ORDDIFF - golv` / `+ parkett` |
| tysk alt-text | 86fdd9af | `ALT/TYSKT 'mit'` + `'und'` |
| SEO-titel 961 → 962 spetsar | fc68547e | `SEO/TITEL avviker fran seo.tsv` |

Fem fynd på rätt tre sidor, och noll på de fem andra. Återställd: 0 igen.

## ☠️ En hämtad sida var AVHUGGEN — och loggen sa något annat

`hamta-live.sh` rapporterade `138094B` för `5814c7e1`, och filen på disk var
**32 768 byte** (exakt 32 KiB). De övriga sju stämde exakt mot sina loggrader.
En omhämtning gav 146 880 byte.

**Mekanismen är oförklarad.** Skriptet läser storleken med `wc -c` från just
den filen, så talet var sant när det lästes. Vad som krympte filen därefter
vet jag inte, och det skrivs inte ned som om jag visste.

⚠️ **Det gamla golvet kunde inte se det:** `size -gt 1000` släpper igenom
32 768, så `brist` stod kvar på noll och skriptet sa KLART.

✅ **Men grinden är INTE blind för det, och det är mätt i stället för antaget.**
Samma fil avhuggen till 32 768 ger **16 fynd** i `livegrind.py`, med ett
uttryckligt `HITTAR INTE TEXTEN PA SIDAN` och tre saknade flikar. En avhuggen
sida är alltså inte samma sak som en tom — den skriker.

Spärren är ändå värd sin rad: den sparar en bortkastad grindcykel och en
omhämtning. Golvet är **relativt batchens egen median** (halva), för
produktsidor i en runda är ungefär lika stora och ett absolut tal hade fått
gissas om butiken byter mall. Verifierad åt båda hållen: avhuggen fil fäller
mot median 142 208 B, hel fil går igenom.
