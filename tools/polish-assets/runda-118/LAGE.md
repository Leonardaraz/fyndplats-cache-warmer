# Runda 118 — läget

## Nio serverings- och barvagnar, åtta publicerade

| id | slug | pris | vad |
|---|---|--:|---|
| `764a3efc` | `rullvagn-fyra-utdragslador-24-cm` | 749 | fyra plåtlådor, 24 cm djup |
| `820d076b` | `hopfallbar-barvagn-bambu-66-cm` | 779 | HOPFÄLLBAR, bambu, tre flaskplatser |
| `15d6fcef` | `koksvagn-fyra-utdragskorgar-stenlook` | 819 | fyra utdragskorgar, ljus stenlook |
| `0fd65541` | `koksvagn-fyra-utdragskorgar-ek` | 879 | samma vagn, ekfärgad skiva |
| `2e292a70` | `gronsaksvagn-fyra-vridbara-korgar` | 899 | vridbara trådkorgar, monteringsfri |
| `a4ee97c1` | `rullbord-61-cm-lada-hangkorg-svart` | 959 | låg vagn med låda och hängkorg |
| `8a73caf4` | `barvagn-utomhus-97-cm-flaskhallare` | 1 219 | utomhus, gran, fyra flaskhållare |
| `fcb86875` | `barvagn-konstrotting-rund-50-cm` | 1 239 | rund, konstrotting, två plan |
| `ca20d60e` | `serveringsvagn-utomhus-107-cm-gran` | 1 359 | ☠️ **EJ PUBLICERAD — slut hos leverantören** |

**Priserna är oförändrade** — samma tal som utkasten bar, verifierat i varje
skrivning och i publiceringssvaret.

## Vad som skrevs, och kvittot för varje sak

| steg | skrivning | kvitto |
|---|---|---|
| 1 | familjen vald | 5 623 rader, `avhuggen: false`, svept på BÅDE tyska och svenska stamord |
| 4 | prisgrinden | 9/9 `stämmer: true` (×1,20 + charm99), lästa via workflowen |
| 7 | namn, slug, SEO, brödtext | **9/9 ordsumma IDENTISK** |
| 8 | variant-SKU | 9/9, priset oförändrat, produkten kvar som utkast |
| 9 | kort uppladdade | 9/9 **byte-verifierade** mot de lokala filerna |
| 9 | galleri + alt | 9/9 sex bilder, kort på plats 3, 0 tomma alt, 0 tyska |
| 10 | kategorier | 9/9 förälder + löv, båda läsningarna eniga |
| 13 | publicering | **8/8** `visible: true` inkl. varianten |
| 13 | mappningsraden | 9/9 workflow-körningar `success` (runs 2373–2381) |
| 14 | live-grind | **8/8 gröna**, 18 självtestfall, 0 fel — efter EN lagning i grinden själv |

## ☠️ ca20d60e publiceras INTE — och det är prisgrinden som sa till

Prisgrind-workflowen svarade `saldo: 0 — SLUTSALD hos Aosom`, med
`aosomSyncedAt: 2026-08-30`. Elva dygn utan feedrad. Enligt CLAUDE.md är en
försvunnen rad ett LAGERBESKED, inte en utgången produkt — saldot nollas och
sidan får ligga kvar — men en sida som publiceras med noll i lager säljer
ingenting.

Sidan är därför **helt klar**: text, bilder, kort, kategori, SKU och
mappningsrad. Den saknar bara `visible: true`. Mappningen stämplades med
`needsAiPolish: false` men BEHÖLL `pending_review`, så den ligger kvar som en
sida att publicera i stället för att försvinna ur kön.

## Tre fel som ingen grind kunde se — och en grind som inte gick att utlösa

Alla tre hittades genom att LÄSA den renderade utdatan innan den skrevs.

1. ☠️ **Ett spårbart tal kan vara FEL tal.** Ingressen på `820d076b` sa
   "Två brickor på 66 × 40 cm" — vagnens fotavtryck, inte brickans (54 × 33).
   Båda talen står i `matt.py`, så talgrinden såg ingenting.
2. **Punktlistorna började med gemen**, för att flera inleds med
   `{antal_fack}`, som är gement i `matt.py` eftersom samma fält också
   används mitt i meningar. Samma sak i två FAQ-svar (`{flaskor}`, `{krokar}`).
3. ☠️ **`Ø Ø 45 cm` på fem ställen** — `matt.py` bär Ø i `skiva`/`fack` och
   mallen la på ett till.

☠️ **Och lagningen på (2) gjorde sin egen grind omöjlig att utlösa.** Den
självklara fixen var en grind i `granska()`: fäll på `<li>` följt av gemen.
Den går inte att pröva — `bygg()` versaliserar redan, så ingen mutation kan
producera en gemen punkt. Samma anti-mönster som runda 117:s `vi vet inte`:
den ser riktig ut i källkoden och tiger för alltid. Rätt form är att pröva
NORMALISERINGEN i stället för utfallet, och det gör `byggartest()` nu.

## ☠️ Måttgrinden gav 3 av 3 på `764a3efc` — och bilden friade den

Utkastet delar yttermått OCH lådmått med två publicerade rullvagnar. Fyra tal
av fem stämmer; det femte, maxlasten, skiljer med 50 %. Zoomen avgjorde:
`764a3efc` har hela plåtlådor med uppvikt kant, de publicerade har öppna
trådkorgar. Två olika möbler. **En måttmatchning är ett såll, inte en dom** —
men utan grinden hade ingen tittat på lådorna.

☠️ **De två publicerade är däremot färgsyskon av varandra** —
`rullvagn-med-korgar-vit` (519) och `rullvagn-4-korgar-rustik` (689), samma
40 × 24 × 82, samma korg, samma 15 kg. Det är en LIVE dubblett som inte är den
här rundans att laga.

## ☠️ Live-grinden fällde `fcb86875` för sin EGEN korshänvisning

Grinden sa `HOPFÄLLNING på en sida som inte har det: …Hopfällbar barvagn i
bambu…`. Det är sant om `820d076b` och står i `fcb86875`:s text — som en
LÄNK dit. Sidan påstår ingenting; den hänvisar vidare.

`grind.py` löser redan exakt det: den delar texten på ankare och kör de
produktegna grindarna på `egna`, medan länkmeningarna prövas mot MÅLETS facit.
Live-grinden ärvde ordlistorna men inte delningen — samma familj som uppgift
#398, ett lager längre in.

☠️ **Sidan bär sin egen brödtext TVÅ gånger, och bara den ena formen syns för
delningen.** Uppmätt: ordet `Hopfällbar` står på sex ställen på sidan.

| var | antal | vad som fångade det |
|---|--:|---|
| en GRANNES namn (`alt`, `pname`, båda serialiseringarna) | 4 | grannstrykningen, sedan runda 117 |
| vår EGEN länk i renderad DOM | 1 | **ingenting** |
| vår EGEN länk i RSC-payloadens `<script>` | 1 | **ingenting** |

DOM:en har riktiga `<a href="…">`; payloaden bär samma stycke escapat som
`\u003ca href=\"…\"`, och `dela_pa_ankare` känner bara den första formen.

☠️ **Att AVKODA payloaden var den uppenbara fixen och den fel.** Provkörd:
delningen såg då båda formerna — men grannstrykningens två halvor kan inte
längre köras i samma ordning. NAMNEN måste strykas FÖRE `BILDADRESS` (dess
`\S+` äter annars halva grannens namn ur ett `src`-attribut, runda 117:s
mätning), medan SLUGGEN måste strykas EFTER delningen (den står i href:en och
ÄR länkens mål). Med payloaden avkodad fälldes **sex av åtta korrekta sidor**
på grannen "Uppvärmt torkställ … hopfällbart".

✅ **Payloaden droppas i stället.** Den är en KOPIA av DOM:en, och DOM:en är
det kunden läser — alltså rätt facit för en live-grind. Samma iakttagelse som
uppgift #413.

Tre självtestfall köptes av felet, och de prövar tre olika saker: att vår egen
länk inte fäller oss i DOM:en, att den inte gör det i payloaden heller, och —
det som gör att lagningen inte bara TYSTAR korshänvisningarna — att en länk som
LJUGER om grannen fortfarande fälls.

✅ **Rutinen bor i `grindar.py` som de sex tidigare uppmjukningarna**
(`egna_meningar`), inte i rundans egen fil. Runda 119 ärver den utan att veta
om den. Ordningen mellan grannstrykningens två halvor — namnen FÖRE tvätten,
sluggen EFTER delningen — är det enda som inte går att förenkla, och den står
skriven vid funktionen.

## Kvar för Leonard

- **`ca20d60e`** publiceras när varan är tillbaka hos leverantören.
- **`6cf7cfcf`** (1 569 kr) ligger kvar sedan runda 117 — samma mått och
  funktioner som publicerade `cc1eb1d9` (1 599 kr).
- **Åtta utkast kvar i familjen:** tre köksöar i 2 629–3 679 kr
  (`9e5e788c`, `d8bbbdde`, `e0fed2c9`) och fem köksvagnar i 1 379–2 039 kr
  (`ad390a36`, `dac7a904`, `c86ff1a6`, `5d1696db`, `36526a8d`). Köksöarna hör
  ihop och ska poleras tillsammans mot de två publicerade sidorna
  `kokso-pa-hjul-fallbar-bankskiva-kryddhyllor` (2 919) och
  `kokso-pa-hjul-glasdorrar-fallbar-bankskiva` (2 069).

## ☠️ Efterrättelse 2026-09-10: flikrubriken matchade ingenting (uppgift #449)

Hittad mitt i runda 120:s Steg 14, inte av en grind här. Butikens flikdelare
(`components/productview.tsx` → `FLIK_TITLE_PATTERNS`) är en **allowlist på
exakt fyra strängar**. `Montering och skötsel` står inte i den. Rubriken blev
alltså ingen flik alls: `splitFlikar` lägger allt EFTER en träff i den fliken
tills nästa träff, så skötseltexten och korslänkarna hamnade inne i
**Tekniska specifikationer**, och den obligatoriska tredje fliken saknades på
alla nio sidor.

☠️ **Textgrinden kunde inte se det, och det är hela lärdomen.** Den mätte att
skötselstycket FANNS. Frågan sidan ställer är var det HAMNAR. En grind som
mäter närvaro svarar inte på en fråga om struktur (uppgift #450).

Två ändringar i `texter.py`, och båda behövs:

1. Rubriken heter **`Användning och skötsel`** — ordagrant, en av de fyra.
2. **Korslänkarna flyttades FÖRE `<h2>Tekniska specifikationer</h2>`.** Efter
   den hade de legat inne i spec-fliken. Blockordningen i HTML:en är alltså
   inte fri när delaren är en allowlist.

⚠️ **Sökorden var tyska på alla nio.** Uppmätt i samma svep: `seoData.settings
.keywords` bar leverantörens tyska termer. De skrevs om i samma PATCH — och
`seoData` som skickas med BARA `settings` **bevarar `tags`**, alltså överlever
`seoTitle`/`seoDescription`. Mätt på `ca20d60e` innan de åtta live-sidorna
rördes.

☠️ **`omgenerera.py` skriver inte över `skrivning.json` utan bevis.** Den
räknar om `ordsumma`, `ord` och `synliga_tecken` ur den GAMLA lagrade texten
först och kastar om något tal inte reproduceras. Utan den hade en tyst drift
mellan `texter.py` och `skrivning.json` blivit en tyst omskrivning av en
publicerad sida. Den fällde också ett verkligt fall i runda 119.

⚠️ **`ordsumma` går INTE att jämföra mellan rundor.** Runda 118/119 stryker
taggar med `re.sub(r"<[^>]+>", " ", html)` (mellanslag), runda 120 med `""`.
Ett tecken, och checksummorna blir oförenliga. Inom en runda är de giltiga.

**Kvitto:** 8 av 8 live-sidor bär nu de tre `<summary>`-flikarna. `ca20d60e`
är fortfarande utkast och rättades i samma svep, så den publiceras med rätt
flikrad när varan är tillbaka.

⚠️ **Två fynd på vägen, båda lämnade:** tre av sidorna bär tyska
leverantörsfilnamn i sina bilder (`servierwagen-…`, `mehrzweckwagen-…`,
`outdoor-servierwagen-…` — uppgift #340), och `8a73caf4`:s korslänk pekar på
`serveringsvagn-utomhus-107-cm-gran`, som är `visible:false`. Den länken är
alltså en live-länk till en 404 tills `ca20d60e` publiceras.
