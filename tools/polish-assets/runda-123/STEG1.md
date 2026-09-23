# Runda 123 Steg 1 — verktygsvagnar, nio av fyrtiotvå

## Svepet

| | |
|---|--:|
| sidor | **57** |
| utkast | **3 105** |
| publicerade | **2 518** |
| katalogen | **5 623** |

✅ Kvitterat mot runda 122: den mätte 3 108 / 2 515 och publicerade sedan tre.
Exakt tre åt vardera hållet.

## ☠️ Familjen är 42 utkast — runda 122:s svep såg bara fyra

Runda 122 fångade verktygsvagnarna av misstag, på ordet `Servicewagen` som
leverantören använder om både städ- och verktygsvagnar. Ett svep på familjens
EGNA ord (`Werkzeugwagen`, `Werkstattwagen`, `Werkzeugschrank`,
`Werkzeugkiste`, `Werkzeugkoffer`, `Rollwagen` + svenska motsvarigheter) ger
**42 utkast och 15 publicerade sidor**.

⚠️ Det är alltså en TIOFALDIGT större familj än den såg ut att vara.
Uppgift #421 en gång till: ett svep som matchar fel ord mäter fel familj.

## Rundans nio: ÖPPNA hyllvagnar

Familjen delar sig rent i två klasser, och bara den ena tas här:

| klass | utkast | tas nu |
|---|--:|---|
| **öppna hyllvagnar** (inga lådor, hyllplan/backar) | **9** | ✅ |
| lådskåp och verktygslådor (`Schubladen`, `Koffer`, `Kiste`) | 33 | nej |

Skälet är kundens fråga: en öppen hyllvagn och ett låsbart lådskåp löser inte
samma problem, och att blanda dem i en runda ger korslänkar som inte hjälper.

| id | pris | totalmått | maxlast | vikt | material | särdrag |
|---|--:|---|---|--:|---|---|
| `887d388d` | 819 | 83 × 43 × 97 | 91 kg | 8 | plast | hål i hyllplanen |
| `7be028f5` | 829 | 81 × 43 × 96 | 68 kg | 8 | plast | släta hyllplan |
| `46a5eeda` | 929 | 56,5 × 47,5 × 89 | 91 kg | 11 | plast | 10 krokar |
| `c8105590` | 939 | 70,5 × 35 × 82,5 | 120 kg | 9,8 | metall + plast | sidohållare |
| `df9475dc` | 969 | 83 × 35,3 × 76 | 150 kg, 50 per plan | 10,8 | kallvalsat stål | 3 plan |
| `4e0a06c0` | 999 | 84,5 × 38 × 84 | 150 kg | 10,8 | kallvalsat stål | 2 plan |
| `db2f05f9` | 1 119 | 102,6 × 43,5 × 84,5 | 227 kg | 16 | plast | 2 plan, störst |
| `2bf00891` | 1 199 | 64 × 37 × 84 | 68 kg | 8,5 | plast + stål | HOPFÄLLBAR |
| `12cb8a2c` | 1 279 | 78 × 35 × 73 | 90 kg, 30 per plan | 17 | stål + plast | låsbar låda |

## ☠️ Dubblettgrinden: tre misstänkta par, NOLL dubbletter

Tre par såg ut som dubbletter på siffrorna. Alla tre avgjordes av BILDEN, och
alla tre föll:

| par | vad siffrorna sa | vad bilden sa | dom |
|---|---|---|---|
| `887d388d` ↔ `7be028f5` | 83 × 43 × 97 mot 81 × 43 × 96, **samma vikt 8 kg**, paket ±1 cm | `887d388d` har **gjutna hål** i mellan- och bottenplanet; `7be028f5` har släta | **skilda** |
| `df9475dc` ↔ publicerade `8723db20` | 83 × 35,3 × 76 mot 82 × 35 × 76 — nästan identiskt | den publicerade är **röd med låda och två hålplåtar**, utkastet **svart utan låda** | **skilda** |
| `df9475dc` ↔ `4e0a06c0` | **samma vikt 10,8 kg, samma last 150 kg**, samma material | tre hyllplan mot **två** | **skilda** |

☠️ **Två av paren delar vikt på grammet och last på kilot.** Uppgift #420 säger
att identiska mått + identisk vikt betyder färgsyskon; här är vikten identisk
men måtten inte, och konstruktionen skiljer sig synligt. Siffrorna ensamma hade
gett fel svar i båda riktningarna — det är därför grinden slutar med ett öga,
inte med en tabell.

Kontrollmätt också: **noll byte-identiska bilder** i hela uppsättningen
(`md5sum` över de nedladdade filerna).

## ☠️ Steg 8: minst en SKU-krock redan i importen

| SKU idag | bärs av |
|---|---|
| `FP-werkzeugwagen-mit-3` | `887d388d`, `7be028f5` |

Importens fel (uppgift #272). Båda får en egen i Steg 8.

## Sökordskrocken: femton publicerade sidor på samma huvudord

`verktygsvagn-…`, `verkstadsvagn-…` och `verktygsskap-…` är redan tagna av
femton sidor. Rundans nio måste därför namnges på det som SKILJER — antal
hyllplan, material, mått — inte på huvudordet ensamt. Samma avvägning som
runda 120:s barstolar och runda 122:s soptunnor.
