# Konstväxtfamiljen: dubblettskärm på BYTE-IDENTISKA bilder (2026-09-12)

Efter runda L2 stod en oro kvar: sju–åtta `Zypresse`- och `Buchsbaum`-utkast
har namn som knappt går att skilja åt, och två par har **samma bladantal och
nästan samma pris**. Frågan var om de är samma artikel under två artikelnummer
— den tredje dubblettklassen (#243), som hörnsoffan `69c5e15c`/`34341c4f`
avslöjade.

## Metoden

Facit för den klassen är att Aosom levererar **samma fotofiler** för samma
artikel. Wix importerar om varje uppladdning, så fil-id skiljer alltid — det
säger ingenting. Bytena gör det.

Sexton utkast, fem bilder var, alla hämtade och md5-summerade:

```
80 filer, 80 unika md5
delade hashar över produkter:  INGA
parvis överlapp:               INGET par delar någon bild
```

## ✅ Utfallet är ett rent NEJ — men bara på den frågan

Klustret är alltså **inte** den L1/L2-klass där två artikelnummer bär identiska
foton. Det är värt att skriva ned som mätning och inte bara som lättnad: #243
konstaterade klassen på EN rad och lämnade storleken omätt. Här är sexton rader
mätta, och svaret är noll.

⚠️ **Ett negativt md5-utfall är inte bevis för att varorna är olika** (#194,
som rättade #187 för att vara för tvärsäker). Det utesluter bara den ena
klassen. Därför granskades huvudbilderna också, och DE ger förklaringen till
varför namnen liknar varandra:

| par | vad namnen antyder | vad fotot visar |
| :-- | :-- | :-- |
| `39c90d59` 1 169 · `5a2bd33d` 1 099 | båda "831 Blätter" | **kruka mot markspett** — samma träd, två monteringar |
| `72c55471` 849 · `d59d9b40` 719 | identiska namn | **pelarform i svart kruka** mot **klot på stam i rottingkruka** |
| `74330920` 819 · `47f6059d` 849 | båda "2er-Set Kunstpflanze" | **buskig cypress på spett** mot **tvåkulligt med vita blommor** |
| `85619689` 779 · `007e8c7b` 799 | båda cypress 90 cm | **två gråbläddriga i grå krukor** mot **EN gulgrön spiral** |

Bladantalet som matchar är alltså väntat: det är samma lövdel monterad på två
sätt, inte samma vara två gånger. Skillnaderna är verkliga produktskillnader
som kunden ser direkt.

**Slutsats: alla sexton går att polera som egna sidor på den här grunden.**

## Två saker att bära med till nästa runda

1. ⚠️ **`45fd6bc6` (1 029) och `8802b999` (1 039) är klot på spett, tio kronor
   isär.** Det enda som skiljer på bilden är lövverket: `45fd6bc6` är mörkare
   och tätare, `8802b999` ljusare gulgrönt med annan bladform. Det är
   färgsyskonklassen (#156, #207) — polera dem som en JÄMFÖRELSEGRUPP, inte en
   i taget i två rundor.
2. ⚠️ **Trekulligt är nu tre sidor.** L1 `0dd83b50` (publicerad, 2-pack 90 cm,
   största klotet ÖVERST), L2 `2c76f251` (publicerad, 2-pack 100 cm, största
   klotet NEDERST) och utkastet `0f36e5a0` (879 kr, **ETT** träd, 3 klot).
   De två publicerade skiljer redan ut sig i text. `0f36e5a0` måste göra samma
   sak — och dess tydligaste särdrag är att det är ett enstaka träd, inte ett
   par.

⚠️ `e8c4c9d7` (699) är inte en cypress alls trots att den låg i urvalslistan:
fotot visar ett stort klot med **lavendelblommor**. Namnet säger bara
"in Kugelform".

## Underlaget

`md5.json` och kontaktarket ligger i sessionens scratchpad, inte i repot —
80 bilder är 150 MB och går att hämta om på fyra minuter. Tabellen ovan är det
som behövde bevaras.
