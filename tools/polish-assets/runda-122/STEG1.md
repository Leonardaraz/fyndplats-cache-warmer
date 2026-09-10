# Runda 122 Steg 1 — städvagnarnas fyra sista, och en bevisad dubblett

## Svepet: hela katalogen, `cursor === null`

| | |
|---|--:|
| sidor | **57** |
| utkast | **3 108** |
| publicerade | **2 515** |
| katalogen | **5 623** |

✅ **Kvitterat mot runda 121:s oberoende mätning.** Den mätte 3 116 utkast /
2 507 publicerade och publicerade sedan åtta sidor. Nu: exakt åtta åt vardera
hållet. Ett svep som stämmer mot en tidigare mätning minus det man själv gjort
är kvitterat, inte antaget.

## ☠️ Familjesvepet gav ÅTTA utkast — men de är TVÅ familjer

Mönstret bar både svenska och tyska ord (uppgift #421). Träffarna delade sig
rent på huvudord:

| grupp | utkast | vad de är |
|---|--:|---|
| **städvagnar** (`Putzwagen`/`Reinigungswagen`) | **4** | rundans batch |
| verktygsvagnar (`Werkzeugwagen`/`Werkstattwagen`) | 4 | ANNAN familj |

Verktygsvagnarna fastnade i svepet på ordet `Servicewagen`, som leverantören
använder om båda sorterna. Att polera dem i samma runda hade varit runda 120:s
barstolsfall: **nio publicerade sidor heter redan `verktygsvagn-…` eller
`verkstadsvagn-…`**, och åtta nya sidor på samma huvudord kannibaliserar dem.

## ☠️ DUBBLETTGRINDEN FÄLLDE EN: `a389ddaa` ÄR den publicerade `5b27721d`

Mätt fält för fält mot den publicerade sidans egen spec-tabell — inte
uppskattat på likhet i namnet:

| | utkastet `a389ddaa` | publicerade `5b27721d` |
|---|---|---|
| totalmått | 95 L × 43 B × 96 H cm | **95 × 43 × 96 cm** |
| maxlast | 130 kg totalt | **130 kg totalt** |
| hyllplan | tre | **tre** |
| hålskivor | två | **två** |
| krokar | åtta | **åtta** |
| hink | `Werkzeugbehälter` | **avtagbar hink** |
| material | Kunststoff | **PP-plast** |
| färg | Schwarz+Rot | **svart och röd** |

Åtta fält, åtta träffar. Det är inte färgsyskon (uppgift #420 kräver skilda
FÄRGER vid identiska mått) — färgen är också densamma. **Utkastet ska inte
poleras.** Beslutet om ommappning är Leonards; underlaget ligger i uppgift #453.

## De tre andra verktygsvagnarna är NYA — mätt, inte antaget

| utkast | totalmått | maxlast | material | närmaste publicerade | dom |
|---|---|--:|---|---|---|
| `12cb8a2c` | 78 × 35 × 73 | 90 kg | stål, svart | `8723db20` 82 × 35 × 76, 60 kg, röd | **skilda** |
| `c8105590` | 70,5 × 35 × 82,5 | 120 kg | metall, svart | ingen | **ny** |
| `887d388d` | 83 × 43 × 97 | 91 kg | plast, svart+röd | ingen | **ny** |

Tre olika mått, tre olika laster. De går till en egen runda.

## Rundans batch: fyra städvagnar

| id | rev | pris | totalmått | maxlast | färg |
|---|--:|--:|---|--:|---|
| `6490e360` | 2 | 1 299 | 73 × 45 × 92 | 15 kg | blå + röd |
| `0cbffcd9` | 3 | 2 339 | 111 × 63,3 × 103 | 25 kg | grå + blå + orange |
| `740fa6d0` | 3 | 2 429 | 111 × 63,3 × 103 | 25 kg | svart + blå + orange |
| `832f9eec` | 3 | 2 699 | 93 × 80 × 97 | 25 kg | blå + orange |

⚠️ **`0cbffcd9` och `740fa6d0` är FÄRGSYSKON.** Identiska totalmått, identisk
hylla, identisk sopsäck, identisk press, identisk hinkvolym, identisk maxlast —
och leverantörens brödtext är ORDAGRANT densamma. Enda skillnaden är att
ramen är grå respektive svart. De ska korslänka varandra, inte beskrivas som
två konstruktioner.

⚠️ **Och de kostar 90 kr olika** (2 339 mot 2 429) trots identisk konstruktion.
Samma klass som runda 121:s 50-kronorspar. Priset är inte poleringens att röra —
det är ett beslut för Leonard.

## ☠️ Steg 8: ALLA FYRA delar en enda SKU

| SKU idag | bärs av |
|---|---|
| `FP-putzwagen` | `6490e360`, `0cbffcd9`, `740fa6d0`, `832f9eec` |

Fyra produkter, en identitet. Importens fel (uppgift #272), inte poleringens —
men det är den här rundans jobb att ge var och en en egen.

## Sökordskrocken: noll

De åtta publicerade sidorna från runda 121 heter `mopphink-…`, `moppvagn-…`
och `stadvagn-…`. Rundans fyra är **systemvagnar med press**, alltså en
storleks- och funktionsklass ovanför `moppvagn-25-liter-…`. De ska korslänka
runda 121:s sidor, inte konkurrera med dem: en kund som söker en mopphink till
hemmet ska INTE landa på en 2 699-kronors systemvagn för hotell.
