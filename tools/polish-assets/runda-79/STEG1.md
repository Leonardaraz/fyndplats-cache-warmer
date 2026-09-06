# Runda 79, Steg 1 — rullpallsfamiljens sista utkast

## ☠️ Runda 78:s svepregex missade ordet `pall`

Runda 78 svepte katalogen med `(stol|sessel|stuhl|hocker|chair)`. Den regexen
matchar **inte `pall`** — och katalogen hade fem publicerade pallsidor som
därmed var osynliga för rundans krockgrind:

| publicerad sida | pris |
|---|--:|
| `arbetspall-med-hjul` | 849 |
| `sadelpall-hjul-49-61-cm-brun` | 809 |
| `verkstadspall-med-verktygsbricka-37-cm` | 599 |
| `hopfallbar-knapall-sittpall` | 489 |
| `tradgardspall-pa-hjul` | 1 249 |

Svepet var alltså komplett (`avhuggen: false`, 5 502 rader) och FILTRET var
hålet. Det är samma klass som runda 77:s sida-31-fynd, men värre: där stannade
läsningen för tidigt, här läste den allt och kastade rätt rader.

**Regeln: sveptermen ska vara produkttypens svenska ord, inte källans tyska.**
Familjen hette `Rollhocker` på tyska och blev `rullpall` på svenska — och det
var det svenska ordet konkurrenten på hyllan redan bar.

## ☠️ Två publicerade sidor matchar på fyra tal

### `sadelpall-hjul-49-61-cm-brun` (publicerad) = `20782c24` (utkast)

| | publicerad | utkast |
|---|---|---|
| sitthöjd | **49–61 cm** | **49–61 cm** |
| sits | **35 × 36 cm**, sadelformad | **35 × 36 cm** |
| yttermått | **52 × 53 cm** | **52 × 53 cm** |
| maxlast | **120 kg** | **120 kg** |
| färg | brun | **rosa** |

☠️ **Bilderna avgör, inte talen.** Sida vid sida (`ark-dubblett.jpg`): identisk
sadelform, identiskt kromat femarmat kryss, identiskt gaslyftshandtag på samma
sida. Det är **samma modell i en annan kulör** — alltså ett FÄRGSYSKON, inte
en dubblett.

Följden för namngivningen är hela poängen: utkastet får INTE ett nytt sökord.
Det heter `sadelpall-hjul-49-61-cm-rosa`, ärver den publicerade sidans
namnmönster och korslänkar till den.

⚠️ **Och den publicerade sidans syskonlista måste uppdateras** — den vet inte
att en rosa finns. Samma klass som #295.

### `arbetspall-med-hjul` (publicerad) mot runda 78:s `rullpallar-2-pack-48-63-cm`

| | publicerad | runda 78 |
|---|---|---|
| sitthöjd | **48–63 cm** | **48–63 cm** |
| sits | rund ø **35,5 cm** | ø **35,5 cm** |
| bas | femarmad ø **48,5 cm** | fotkryss **48,5 cm** |
| maxlast | **120 kg** | **120 kg per pall** |

Fyra tal, alla identiska. Bilden skiljer dem: den publicerade har **slät** rund
sits, runda 78:s har **rutstickad**. Samma chassi, olika klädsel — och den
publicerade säljs som **ett stycke i vit eller svart**, min som **2-pack i
svart**.

⚠️ **Det är inte en dubblett, men det är en lucka jag själv skapade.** Runda
78:s sida nämner inte att enstycket finns, och den publicerade nämner inte
2-packet. Två sidor för samma pall utan korslänk är exakt vad krockgrinden
finns för. Åtgärdas som en egen rättning, inte tyst.

### `verkstadspall-med-verktygsbricka-37-cm` mot runda 78:s `verkstadspall-med-lador-135-kg`

| | publicerad | runda 78 |
|---|---|--:|
| yttermått | 38 × 35 × 37 cm | 64,5 × 33 × 35 cm |
| sits | 36 × 19 cm | 44 × 25 cm |
| maxlast | 100 kg | 135 kg |
| förvaring | verktygsbricka 34 × 30 | två fack + låda |

**INGA gemensamma tal.** Två olika verkstadspallar, och sluggarna bär redan var
sin särskiljare. Men de äger samma sökord utan att korslänka — samma åtgärd som
ovan.

## ☠️ `12ce97db` är en TREDJE sadelpall, inte en fjärde färg

Samma sadelsits 35 × 36 som de två ovan, men bilden visar **svart nylonfot**
i stället för kromat kryss, och specen ger 48 × 47 × 45–59 mot 52 × 53 × 49–61.
Lägre, smalare, annan fot. Egen sida med egen särskiljare.

## Rundans sju, och vad var och en blir

| id8 | pris | mått | maxlast | färg | blir |
|---|--:|---|--:|---|---|
| 983fe163 | 799 | 32 × 40 × 70–86 | 120 | Weiß | hög salongspall med rygg, **vit** |
| 98c1b3cb | 799 | 32 × 40 × 70–86 | 120 | Schwarz | samma, **svart** — färgsyskon |
| 711f7859 | 899 | Ø50 × 63–83 | 120 | Weiß | hög pall, sits Ø35, 53–73 cm |
| c328a7c0 | 1 229 | 38 × 38 × 57–72 | 120 | Schwarz | sits 37 × 33, sitthöjd 47–62 |
| 12ce97db | 829 | 48 × 47 × 45–59 | 120 | Schwarz | sadelpall, **svart fot** |
| 20782c24 | 899 | 52 × 53 × 49–61 | 120 | Rosa | **färgsyskon** till publicerad brun |
| b9ab45db | 1 449 | 60 × 60 × 79–91 | 136 | Grau | ☠️ INGEN pall — se nedan |

## ☠️ `b9ab45db` är ingen rullpall

Källan säljer den som `Arbeitshocker Drehhocker`, men specen säger
60 × 60 × 79–91 cm, ryggstöd **46 × 35,5 cm**, armstöd, sitthöjd 44,5–57 cm och
**10,4 kg**. Det är en snurrstol med rygg och armstöd — ungefär dubbelt så tung
som familjens pallar.

Mot de publicerade snurrstolarna: `snurrstol-gra-fast-fot` och
`snurrstol-benvit-fast-fot` är 67 × 68 × 103–113 med sitthöjd 46–54 och 120 kg;
`snurrstol-bojtra-svart-pu` är 52 × 54 × 74–84 och 135 kg. Ingen matchar.
Produkten är alltså äkta och opolerad — men den hör till **snurrstolsfamiljen**,
inte hit, och tas i en egen runda med de sidorna som krockunderlag.

## ☠️ Importens SKU-krock, femte rundan i rad

| importens SKU | bars av |
|---|--:|
| `FP-rollhocker-drehbarer-und` | **2** |
| `FP-arbeitshocker-drehhocker` | **2** |
| `FP-rollhocker` | **2** |
| `FP-rollhocker-mit` | 1 |

Sju produkter, **fyra** distinkta SKU:er.
