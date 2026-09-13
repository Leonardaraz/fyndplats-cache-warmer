# Runda 139 — Steg 7: texten

All kundtext ligger i `texter.py` och grindas av `grind.py` FÖRE skrivning.
Grinden: **11 självtestfall, 10 produkter, 0 fel.**

## ☠️ Grinden fällde tre saker i mitt EGET utkast

### 1. `Leverantören anger` — åtta gånger

Frasen stod i åtta av tio FAQ-svar. Det är exakt husregelbrottet batch 64
mätte upp 2026-09-04: **mot kunden är VI leverantören.** Att skjuta ansvaret
uppåt i ledet är dessutom en sämre mening — kunden köper av oss, inte av
någon annan.

Rättat **per ORD över hela batchen**, inte per förekomst — batch 64:s
`dögnsvarv` hittades tre gånger i tre rundor för att varje fynd lagades där
det syntes. En sökning på `leverantör|tillverkar|grossist` i all kundtext ger
nu noll.

### 2. `hoppplan` — tre p

`hopp` + `plan` blir tre konsonanter i rad, vilket svenskan reducerar. Det är
tredje gången husets trekonsonantsregel biter (#509), och den här gången
fångade grinden det innan texten lämnade filen. Ordet är `hoppyta` nu.

### 3. En SJÄLVLÄNK och ett superlativ

`3addfbf8` korslänkade till sin egen slug. Och `3a96740e`:s brukstext sa
"mår bäst intill en vägg" — inte ett marknadsföringssuperlativ, men grinden
är trubbig med flit, och formuleringen gick lika bra att skriva om.

## ⚠️ `G.flikfel` är en LIVE-grind, inte en källkodsgrind

Den letar efter `<summary>`, som butiken skapar först vid rendering. På
källtexten fällde den alla tio på en struktur som är korrekt. Steg 7 har
därför en egen flikkontroll: varje rubrik i allowlisten ska finnas exakt en
gång som `<h2>`, och i rätt ordning. `G.flikfel` hör hemma i Steg 14.

## Rundans egna förbud

| förbud | varför |
|---|---|
| `kattlåda` på `4faf9f4c` och `90573e36` | Utrymmet är en HÅLA — 19 × 19 respektive 20 × 22 cm dörröppning |
| CE-påstående | Ingen CE-direktivsfamilj täcker kattmöbler |
| Jordbruksverket / L80 | L80 gäller förvaringsutrymmen, inte inredning |
| `massivt trä`, `tekniskt trä` | Stommen är spånskiva på alla tio |
| attribution uppåt i ledet | Mot kunden är vi leverantören |

## Positiva villkor som grinden KRÄVER

Grinden fäller om något av dem saknas — ett förbud ensamt skulle ha släppt
igenom en text som bara utelämnar det farliga.

- **Kattvikten** i brödtexten på de nio som har en gräns
- **Spånskiva** på alla tio
- **Takhöjden 220–240 cm** på `90573e36`
- **`regel eller betong`** och **`skruv och plugg efter väggtypen`** på båda
  väggseten

## Korslänkarna

28 mål: sju inom batchen, 21 externa. Alla 21 är belagda mot de 92 publicerade
klösmöbelsidor som mättes i Steg 1 — noll döda länkar. Alla ligger FÖRE första
flikrubriken, och alla är absoluta URL:er (en rotrelativ href skrivs om av Wix
till `https:/produkt/…`, alltså en död länk).

`a4d8feca` länkar till sitt färgsyskon `klostunna-60-cm-ljusgra`, och det
syskonet ska få en länk tillbaka (#480).

## SKU

Alla tio SKU-baser är mätta mot katalogens 5 695 sluggar: noll krockar.
