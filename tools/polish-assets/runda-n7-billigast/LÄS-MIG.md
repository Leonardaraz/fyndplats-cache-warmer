# Runda N7 — nio produkter 1 019–1 029 kr

Urvalet fortsätter **billigast uppåt** bland produkter där vi är billigare än
dealproffsen (Leonards regel). N2 täckte 599–699 kr, N3 699–879, N4 899–939,
N5 949–969, N6 979–999, den här 1 019–1 029.

| kort | vårt | deras | gap | produkt |
| :-- | --: | --: | --: | :-- |
| 358f4559 | 1 019 | 1 039 | +20 | Elektrisk barnquad med släpvagn |
| bd24e5f9 | 1 019 | 1 039 | +20 | Sidobord 2-pack, stapelbara |
| f5964946 | 1 019 | 1 029 | +10 | Vattenkokare 2 200 W, 1,7 liter |
| 7f1a45a6 | 1 019 | 1 279 | +260 | Fotbollsnät med returfunktion |
| b45d2544 | 1 029 | 1 319 | +290 | Byrå med åtta tyglådor |
| 62d2a0a9 | 1 029 | 1 299 | +270 | Väggdekor i metall, världskarta i tre delar |
| 85c4c097 | 1 029 | 1 249 | +220 | Sittbänk med förvaring, oval |
| 77d3bfc2 | 1 029 | 1 179 | +150 | Sit-up-bänk, höjdjusterbar |
| 8df525e3 | 1 029 | 1 159 | +130 | Agilityset för hund, 7 delar |

De fyra på 1 019 kr är hela nivån. På 1 029 finns nio rena kandidater och
fem valdes på gapets storlek; de fyra andra står i `bortvalda.tsv` som
reserver till nästa runda.

## Urvalet kom ur en FULLSTÄNDIG mätning

Prisjämförelsen kördes med `fran_pris=1000` och slutade på **0 prefix kvar**
i tre varv — alltså är "de säljer den inte" ett besked och inte ett golv.
2 636 produkter i katalogen där vi är billigare.

## ☠️ MÅTTSKÄRMENS FILTER VAR EN NO-OP — och det syntes bara på ett tal

Första svepet läste **5 748** produkter och kallade dem publicerade. Katalogen
har ~2 800 publicerade sidor. Talet var alltså dubbelt så stort som det kunde
vara, och det var det enda som avslöjade att `filter: {visible: true}` aldrig
hade tillämpats.

Uppmätt mot skarpa V3, åt båda hållen:

| filtrets plats | synliga | osynliga |
|---|---:|---:|
| kroppens **toppnivå** | 6 | **94** |
| inuti `search` | **100** | 0 |
| inuti `search`, `visible: false` | 0 | **100** |
| inuti `search` + markör | **400 SE-1141** | — |

`filter` hör alltså INUTI `search`, exakt som `cursorPaging` (#191). På
toppnivån **kastas den bort utan ett ord** — svaret är 200 och listan ser ut
som en filtrerad lista.

☠️ **Och det gör paginering med filter omöjlig.** Med filtret på rätt plats
avvisas markören (`SE-1141`); med filtret på fel plats "fungerar" markören men
filtret finns inte. Enda korrekta vägen för ett flersidigt svep är därför:
**svep OFILTRERAT och filtrera i koden.**

⚠️ **Och husets egen anteckning om `SE-1141` blir tydligare av det här.** Den
säger att sida två ska skickas med bara markören. Det stämmer — men bara när
filtret låg rätt från början. Ligger det på toppnivån får man aldrig felet,
och då ser en OFILTRERAD lista ut som svaret på en filtrerad fråga. Samma
klass som SKU-kollen som itererade en tom lista: **en kontroll som inte KAN
fälla räknas ändå som gjord.**

Skärmen kördes om och bär nu tre egenskaper som inte ska tas bort:

1. **Ofiltrerat svep, filtrering i koden.** 5 727 lästa, 2 826 publicerade,
   2 901 utkast.
2. **Kandidaten jämförs aldrig med sig själv.** Utan den spärren "krockade"
   varenda kandidat med sin egen rad, och elva av trettio träffar var brus.
3. **Publicerat och utkast hålls isär.** En krock mot en publicerad sida
   FÄLLER; en krock mot ett annat utkast är en pensionering att göra, inte ett
   skäl att avstå. Det är #224:s blinda fläck, och den syns bara när de två
   räknas var för sig.

## Fem kandidater föll, och två av dem mot sidor vi redan säljer

| utkast | föll på | bevis |
|---|---|---|
| `1f0598ee` konstgjord palm | lagergrinden | `OUT_OF_STOCK` |
| `601ae5f5` växthus | säsong | trädgård/ute, mitten av september |
| `727e95ba` insynsskydd | säsong | trädgård/ute |
| `85aa4691` hundvagn | **publicerad sida** | **5 av 5** tripplar mot `0783b515` |
| `6fb7b740` sittbänk | **publicerad sida** | 2 av 3 mot `9383d686` hallbänk 102 cm |

☠️ **Hundvagnen är den lärorika.** `0783b515` publicerades i runda N6 en timme
tidigare, i samma session. Utan skärmen hade den här rundan lagt ut en andra
sida för samma vara samma dag — precis den interna dubbletten Google straffar.

## Tre kandidater är OGRANSKADE, inte rena

`1f0fed54`, `207753f5` och `6e8783a3` har bara EN måtttrippel i källan.
Skärmen kräver TVÅ delade tripplar, så en kandidat med en enda trippel kan
grinden aldrig fälla — den svarar "inga krockar" utan att ha kunnat jämföra
(#274). De räknas därför som ogranskade och väntar.

## Bildhashen gav ett ÄKTA negativt

De nio kandidaternas huvudbilder jämfördes på Wix filhash + bytestorlek mot
huvudbilden på **2 826 publicerade produkter**: **noll träffar**, och noll
interna krockar. Den byte-identiska klassen finns alltså inte här — och det är
precis därför måttskärmen ovan behövdes. De två grindarna fångar olika klasser.

## ⚠️ Fem misstänkta tvillingpar — måtten säger ja, bilderna säger inget

| par | delade tripplar | huvudbilderna |
|---|---|---|
| `f5964946` ≡ `40a1f491` vattenkokare | **4 av 4**, identiskt namn | olika (833 kB mot 924 kB) |
| `358f4559` ≡ `5dae95cd` barnquad | 4 av 4 | olika |
| `7f1a45a6` ≡ `4a19cec9` fotbollsnät | 3 av 3 | olika |
| `618b1de9` ≡ `294cfb55` soptunna | 2 av 3 | olika |
| `85aa4691` ≡ `28e7dc6e` hundvagn | 5 av 5 | olika |

Noll byte-identiska par. Det är samma äkta negativ som N2 mätte på
kattlådorna: **bildgrinden ser bara den byte-identiska klassen**, och Aosom
fotograferar samma vara flera gånger. Måtten är facit här, inte bilderna.

⚠️ Pensioneringarna görs inte i den här rundan. Att publicera EN av två
identiska utkast skapar ingen dubblett på sajten — den andra ligger osynlig
och kostar ingenting. Paret står nedskrivet så det inte behöver återupptäckas.

## Lagersaldo

Nio av nio köpbara, en lagerrad var, kvantitetsspårning på:

| kort | saldo |
|---|---:|
| 358f4559 | **8** |
| b45d2544 | 12 |
| 62d2a0a9 | 18 |
| 7f1a45a6 | 61 |
| 85c4c097 | 81 |
| 77d3bfc2 | 87 |
| bd24e5f9 | 93 |
| f5964946 | 99 |
| 8df525e3 | 118 |

⚠️ Barnquaden har bara åtta kvar.

---

# Kvitto: rundan är klar

Nio produkter publicerade 2026-09-16. Varje steg har ett tal, och talet kommer
ur en mätning och inte ur ett API-svar som svarade 200.

| steg | utfall |
|---|---|
| Text + namn + slug + SEO + visible | **9 av 9**, transkriberingsspärren passerade på första försöket |
| Media ensam (`fieldMask: media`) | **9 av 9**, alt-textspärren passerade |
| Kategorier | **18 av 18** kopplingar, per rad ur bulk-svarets `itemMetadata` |
| `variantsInfo` sist och ensam | **9 av 9**, variant + produkt `visible: true` på alla |
| Stämpling av mappningsraden | **9 av 9** gröna (körning 3123–3131) |
| Separat återläsning, en stund senare | **9 av 9 LIKA** mot facit ur källfilerna |
| Live-grind, `age` 104–144 s mot 90 s paus | **9 av 9 REN**, orddiff **0** på alla nio |

## Korten är bevisade i BÅDA ändarna

☠️ `UploadImageToWixSite` svarar med en lista id **utan att säga vilket id som
kom från vilken adress** — samma attribution-på-ordning som huset redan vägrat
lita på i lagersynken. Därför två oberoende bevis:

- **Vid uppladdningen.** Varje fil hemhämtad från wixstatic och md5-jämförd mot
  sin lokala kopia: **9 av 9 byte-identiska**, och `kort-filer.tsv` byggdes ur
  md5-matchningen med ett skript, aldrig ur svarets ordning.
- **På mottagarsidan.** Både Wix-mediaid:t och den lokala uppladdningsfilens
  namn (`image.filename = kort-<kort>.png`) pekar på **SAMMA** mediapost,
  9 av 9. Kortet ligger **sist** och huvudbilden är ett **foto** på alla nio.
  52 mediaposter, **noll utan alt-text**.

## ☠️ Tre grindar som varje runda byggt om för hand bor nu i polish-gates

De var inte kod förrän nu. De fanns som resonemang i varje rundas anrop — och
det är exakt formen ett husfel tar innan någon upptäcker det (`SHIP_AXIS_RE`,
`EU_TULL_CODES`, `hasha.py` i N2, de nitton grindkopiorna, `wixnorm` i N2).

| fil | vad den äger |
|---|---|
| `raahash.py` | rå kontrollsumma → `raa-hash.tsv`, SKRIVNINGENS facit |
| `bygg-skrivning.py` | emitterar steg 1:s anrop ur filerna |
| `bygg-medieskrivning.py` | lägger kortet sist + räknar alt-textfacit |

⚠️ **Ingen av dem är antagen.** `raahash.py` reproducerar N6:s handbyggda
`raa-hash.tsv` EXAKT på 9 av 9 rader, och alt-textfaciten reproducerar N6:s
`media-hash.tsv` på 9 av 9. Det är skillnaden mellan en fjärde tvilling och en
enda definition — och det är ett test som inte hade gått att göra i efterhand
om rundorna städats bort.

☠️ Och `raahash.py` bär **M4:s lärdom i koden i stället för i minnet**: facit
räknas på strängen SOM DEN SKICKAS (`rstrip("\n")`), inte på filen. M4 avbröts
på ETT tecken av 3 515 för att en template-literal som slutar med `</p>` inte
bär filens avslutande radbrytning — samma byte som `wixnorm.py` punkt 5 redan
dokumenterade på LÄSNINGENS sida. Regeln gällde åt båda hållen hela tiden, och
bara den ena halvan var nedskriven.

⚠️ **Tre av nio kontrollsummor ändrades** när de räknades om ur de NUVARANDE
filerna — `7f1a45a6`, `b45d2544` och `62d2a0a9`, de tre som redigerades efter
siffergrinden. De sex andra stämde exakt mot de gamla talen. Det är
korskontrollen som gör omräkningen trovärdig i stället för bara nödvändig: om
ALLA nio hade ändrats vore facit misstänkt, inte filerna.

## ☠️ Live-grinden är verifierad ÅT BÅDA HÅLLEN på just den här rundan

Att en grind FINNS säger ingenting om att den kan SE — runda J2 publicerade
fyrtio tyska alt-texter med en påslagen, dokumenterad och räknad alt-grind.
Därför planterade fel i två av de nio hämtade sidorna, ett per svep:

| planterat | vilket svep som fällde |
|---|---|
| `mit Gewicht` i `<title>` | SIDA/TYSKT ×2 + SEO/TITEL + SEO/BESKRIVNING |
| `Kunststoff Hocker mit Stauraum` i en `alt` | ALT/TYSKT ×3 |
| kyrilliskt `а` (U+0430) i brödtexten | ORDDIFF ×2 + HOMOGLYF + SIDA/HOMOGLYF |

**10 fynd på 85c4c097, 4 på 77d3bfc2, noll på de sju andra** — och 0 av 0 efter
att filerna återställts. Grinden fäller alltså på rätt produkt, på rätt svep,
och går ren när den ska.

## Kategorierna

| kort | kategori |
|---|---|
| 358f4559 | Barn & Familj + Leksaker & Spel |
| bd24e5f9 · b45d2544 · 85c4c097 | Hem & Inredning + Förvaring & Organisering |
| 7f1a45a6 | Trädgård & Utemöbler + Utelek & Spel |
| 62d2a0a9 | Hem & Inredning + Dekoration & Prydnad |
| 77d3bfc2 · 9ab9eda7 | Sport & Fritid + Träning & Gym |
| 8df525e3 | Husdjur + Lek & Tillbehör för husdjur |

⚠️ Returnätet hamnade under **Utelek & Spel** och inte under Sport & Fritid:
trädet har inget bollsportlöv, och en returnätsram är utelek i den här butiken.
Toppkategorin ensam hade varit det andra alternativet.

## Städat efter sig

`kort-n7-tmp` är raderad, och **verifierad genom att läsa remoten** — inte
genom att jobbet gick grönt. `branch-cleanup.yml` defaultar till `scan`, så ett
grönt jobb kan mycket väl ha raderat ingenting (#277). Noll `kort-n*-tmp`-grenar
kvar på origin.
