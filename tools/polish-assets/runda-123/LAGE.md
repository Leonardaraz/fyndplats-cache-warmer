# Runda 123 — LÄGE

## ✅ Sju verktygsvagnar LIVE, två hålls tillbaka

| id | slug | pris | status |
|---|---|--:|---|
| `887d388d` | `verktygsvagn-83-cm-tre-plan-verktygshal` | 819 | **LIVE** |
| `7be028f5` | `verktygsvagn-81-cm-tre-slata-plan` | 829 | **LIVE** |
| `46a5eeda` | `verktygsvagn-smal-56-cm-tio-krokar` | 929 | utkast, saldo 0 |
| `c8105590` | `verkstadsvagn-metall-70-cm-tre-plan` | 939 | **LIVE** |
| `df9475dc` | `verktygsvagn-stal-83-cm-hoga-kanter` | 969 | **LIVE** |
| `4e0a06c0` | `verkstadsvagn-stal-tva-djupa-plan` | 999 | **LIVE** |
| `db2f05f9` | `verktygsvagn-102-cm-verktygsplatta` | 1 119 | utkast, saldo 0 |
| `2bf00891` | `verktygsvagn-hopfallbar-18-cm` | 1 199 | **LIVE** |
| `12cb8a2c` | `verkstadsvagn-stal-lasbar-lada` | 1 279 | **LIVE** |

## Kvitton — mätta, inte antagna

| steg | kvitto |
|---|---|
| 3 prisgrind | **9 av 9** stämmer mot regeln (×1,2, charm99) |
| 4 bilder | **45 granskade** — 0 tysk text, 0 logotyp, 0 byte-identiska |
| 5 källkritik | 3 källor per tal; **7 fynd**, se STEG2-5.md |
| 7 transkription | **9 av 9 EXAKT** (teckenantal + teckensumma) |
| 7 länkar | **0** `https:/produkt` på alla nio |
| 7 flikar | **5 `<h2>`** på var och en |
| 8 SKU | 9 av 9 skrivna; SKU-krocken upplöst |
| 8 pris | **orört på alla nio** — 819, 829, 929, 939, 969, 999, 1 119, 1 199, 1 279 |
| 9 alt-text | **45 av 45** svenska, 0 tomma, 0 tyska |
| 10 kategori | **9 av 9** i Verktyg, återlästa |
| 13 publicering | 7 av 7; `visible:false` bevarat på de två slutsålda |
| 14 live-grind | **7 av 7 GRÖNA på första körningen** |

## Lämnat till Leonard

1. ☠️ **`db2f05f9`: 227 kg maxlast står INTE på sidan.** Familjens högsta tal,
   på dess enda plastvagn med två plan, 51 % över stålvagnar som väger lika
   mycket. Be Aosom bekräfta innan siffran används. Produkten är ändå slutsåld.
2. **Två slutsålda att publicera när lagret kommer tillbaka**: `46a5eeda`
   (929 kr) och `db2f05f9` (1 119 kr). Båda är färdigpolerade — bara
   `visible:true` och en stämpling återstår.
3. ⚠️ **`4e0a06c0`:s stålsort är oavgjord** mellan två källor (kallvalsat mot
   legerat). Sidan skriver `stål` naket. Vill du ha bestämningen behöver den
   bekräftas hos Aosom.
4. ⚠️ **`12cb8a2c`:s svenska spec-block säger BARA plast** om en vagn som tre
   andra källor beskriver som pulverlackerat stål. Sidan skriver stål.
   Feed-kolumnen är fel och rättas inte av poleringen.
5. ⚠️ **Kategoriträdet har inget löv för verkstadsvagnar.** Alla nio ligger på
   `Verktyg`, tillsammans med lådskåp, verktygssatser och väggskåp. Samma
   observation som uppgift #402 och #444 — hör hemma i städningen.

## Kvar i familjen

**33 lådskåp och verktygslådor** (`Schubladen`, `Koffer`, `Kiste`) är
deferrade med flit: en öppen hyllvagn och ett låsbart lådskåp löser inte
samma problem för kunden, och att blanda dem ger korslänkar som inte hjälper.
De är nästa runda.

## Tre fynd om ARBETSSÄTTET, alla av samma familj

☠️ **Ett svar utan fel är inget kvitto — och ett svar MED fel är inte heller
alltid ett bevis.** Rundan mötte båda riktningarna på en timme:

1. **En `curl` gav exit 0 och skrev `bad file: media/…` som en 63-byte `.jpg`.**
   Filen fanns, kommandot var grönt, bilden gick inte att öppna. Hämtningen har
   nu ett storleksassert och tre försök.
2. **Ett insättningsskript matchade `PUNKTER` i stället för `FAQ`** — det
   första `"<pid>": [` i filen — och skrev ändå ut "sex FAQ-poster tillagda".
   Sex FAQ-tuplar hamnade i en lista av strängar. Assert:en var på antalet
   substitutioner, inte på resultatet.
3. ☠️ **Alt-text-PATCHen rapporterade `bilder: 0` på alla nio — och hade
   lyckats.** En PATCH-respons bär inget `?fields`, så `media.itemsInfo.items`
   kommer tillbaka TOM även när datan är rätt. En kontrollmätning med
   `?fields=MEDIA_ITEMS_INFO` visade 5 bilder och rätt svensk alt-text på
   varje. **Kvittot läste fel fält, inte fel data.** Samma familj som uppgift
   #392 och #394 — och den farligaste riktningen är att TRO på nollan och
   skriva om galleriet.

☠️ **Och en homoglyf: ett kyrilliskt `а` i en skötseltext.** Grinden fångade
den före första API-anropet. Lärdomen är formen på lagningen: `G.homoglyfer`
läser EN SIDA i taget och hittade tecknet bara för att det råkade ligga där.
Källkodssvepet i `grind.kallkodssvep()` läser nu HELA filen och fäller på varje
tecken utanför svensk text — regeln "rätta per ORD, inte per förekomst"
mekaniserad. Mätt över `texter.py`: 12 tecken utanför uppsättningen, 11 är
☠️/🔒-markörer i kommentarer, ett var felet.
