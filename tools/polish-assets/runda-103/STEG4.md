# Runda 103 Steg 4 — måttritningen fällde en av fem

Bilderna hämtade i 900 px och granskade en och en: övre vänstra hörnet efter
leverantörslogotyp, och måttritningen mot spec-blocket.

## Logotypsvep: rent

Fyra huvudbilder, fyra måttritningar, noll logotyper och noll tysk text i
pixlarna. Vit botten på alla fyra huvudbilder.

## ☠️ `a0760ed1` är INTE modell A — och dess egen text ljuger

Steg 1 verifierade den mot spec-BLOCKET och godkände den. Det var fel, och det
var fel på precis det sätt som går att undvika: **texten är det som är
kopierat.** Måttritningen är oberoende bevis, och den säger något annat.

| | `c396356f` · `a7f029bf` · `7e84e482` | `a0760ed1` |
|---|---|---|
| Mått (B × D × H) | 82 × 99 × 103 | **85 × 94 × 104** |
| Utfälld | 165 × 78 | **162 × 80** |
| Sitsbredd | 54 | **56** |
| Sitsdjup | 57 | **53** |
| Sitthöjd | 49 | 49 |
| Ryggstöd, höjd | 61 | **63** |
| Ryggläge | 145° | **150°** |
| Maxlast | **135 kg** | **150 kg** |

Alla tre ritningarna i batchen säger samma sak — 82 × 99 × 103, 145°, 135 kg,
165/78, sits 54/57/49, ryggstöd 61, mugghållare Ø 9 cm. `a0760ed1`:s ritning
säger tio andra tal.

**Två oberoende spår pekar åt samma håll och båda missades i Steg 1:**

1. **Leverantörens egen URL** heter `…massagesessel-manuell-150-beheizbar…`
   — **150**, inte 145. Jag läste den och avfärdade den som marknadsföringsslug.
   Ritningen säger också 150°. De två är alltså överens, och det är
   spec-blocket som är udda.
2. **Konstruktionen skiljer sig på bilden.** `a0760ed1` har en slät påsydd
   sidoficka och en **blank kromad** vridbas; de tre andra har en veckad ficka
   och en **svart** bas.

☠️ **Och artikelnumrets bas höll inte heller.** `700-050V94` är identisk på
alla fyra — `LR`, `GY`, `DR`, `CW`. Runda 61:s mekaniska syskongrind (bas =
modell, suffix = färg) svarade alltså "samma modell" på två olika stolar. Basen
är en SERIE hos den här leverantören, inte en modell.

**Regeln, skärpt en gång till:** spec-blocket kan vara kopierat mellan modeller
av leverantören själv, och artikelnumrets bas kan vara en serie. Det enda som
bär egen information är **måttritningen** — den är renderad per produkt och per
färg, och den tar inte order av texten bredvid.

Runda 103 blir alltså **tre** produkter. `a0760ed1` får en egen omgång, och den
omgången måste skriva ritningens tal, inte textens.

## Batchen efter Steg 4

| id8 | färg | pris | mått bekräftat på ritning |
|---|---|--:|---|
| `c396356f` | ljusgrå | 4 579 | ✅ 82 × 99 × 103, 145°, 135 kg |
| `a7f029bf` | mörkbrun | 4 619 | ✅ 82 × 99 × 103, 145°, 135 kg |
| `7e84e482` | cremevit | 4 819 | ✅ 82 × 99 × 103, 145°, 135 kg |
| ~~`a0760ed1`~~ | ljusbrun | 4 419 | ❌ **utgår — annan stol** |

Publicerat syskon att korslänka mot: **`297d8979`**, svart, 4 979 kr, publicerad
av den andra sessionen 15:22 samma dag.

⚠️ Mörkbrun är verkligt mörkbrun på bilden, inte svart — ingen krock med det
publicerade svarta syskonet.

## Nytt mått som ritningen ger och texten inte har

**Mugghållarna är Ø 9 cm.** Står på alla tre ritningarna, saknas i spec-blocket.
Det är ett tal en kund faktiskt använder — får muggen plats? — och det är mätt i
bilden, inte gissat.
