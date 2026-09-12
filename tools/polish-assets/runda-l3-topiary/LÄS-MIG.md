# Runda L3 — buxbom och formklippta konstväxter, 719–1 039 kr

Åtta produkter valda som **jämförelsegrupp**, vilket samtidigt stänger de två
noteringar #247 lämnade efter sig: det påstådda färgsyskonparet hamnar i samma
runda, och det ensamma trekulliga trädet står bredvid sina tvåkulliga syskon.

| kort | form | antal | höjd | kruka | pris | saldo |
|---|---|---|---:|---|---:|---:|
| `8802b999` | klot på spett, eukalyptusblad | 2 | 56 med spett | **ingen** | 1 039 | 65 |
| `45fd6bc6` | klot på spett, buxbom 440 blad | 2 | 70 med spett | **ingen** | 1 029 | 60 |
| `0f36e5a0` | tre klot, trästam | **1** | 100 | enkel svart | 879 | 155 |
| `cf111505` | droppform, 306 blad | 2 | 90 | svart Ø20 | 859 | 46 |
| `11749e12` | två klot, 314 blad | 2 | 91,6 | svart Ø18 | 859 | 38 |
| `47f6059d` | lavendelträd, vita blommor | 2 | 70 | svart Ø15 | 849 | 46 |
| `72c55471` | oval krona, 322 blad | 2 | 60 | konisk Ø17,5 | 849 | 72 |
| `d59d9b40` | klot på stam | 2 | 50 | **flätad med sten** | 719 | 171 |

## Så här togs den fram

1. **Lagergrind i urvalet.** `a1aed632` föll på saldo 1 och ligger kvar som
   utkast — se `utesluten/`. Det var `gate-lager.py` som fällde den, inte en
   slump i ett senare steg.
2. **Källorna hämtade ordagrant ur Wix och bevisade.** Åtta av åtta stämmer
   exakt mot `plainDescription`, se `kvitto-kalla.json`. Inget artikelnummer
   finns i rundans katalog — kontrollerat med ett stramt mönster, noll träffar.
3. **Dubblettskärm på byte-identiska bilder.** 40 bilder, 40 unika md5, noll
   delade och noll parvis överlapp (`md5.json`). Den tredje dubblettklassen
   (#243) finns inte i den här gruppen heller.
4. **Kontaktark FÖRE brödtexten** (J1-regeln). Åtta fynd, se `FOTOFYND.md` —
   fem av dem hade ingen textgrind kunnat se.
5. **Texterna skrivna i fil**, aldrig inline i ett API-anrop.
6. **Grindarna körda**, alla gröna.

## ☠️ #247:s färgsyskonpar var inte ett färgsyskonpar

`8802b999` och `45fd6bc6` noterades som "samma vara i två färger" och skulle
poleras ihop. Fotot säger något annat, och därför står de som två produkter:

| | `8802b999` | `45fd6bc6` |
|---|---|---|
| bladtyp | eukalyptus, runda blad | buxbom, avlånga blad |
| färg | **tvåfärgad**, ljust och mörkt | enfärgat mörkgrön |
| antal blad | anges inte | **440** |
| totalhöjd | 56 cm | **70 cm** |
| spett | 16 cm, aluminium | **26 cm** |

De delar bara klotdiametern. Ett par som poleras som "samma vara i två färger"
hade fått två texter som skiljer sig på färgordet och ingenting annat.

## Vad som INTE gick igenom

`bilder-bort.tsv` tar bort en bild från `72c55471` och en från `d59d9b40`.
Båda är fotograferade i samma rumsmiljö och bär en inramad tysk affisch som
fyller övre halvan av bilden. Kvar blir fyra bilder per produkt.

## En grind lagades på vägen

`gate-axel.py` fällde en KORREKT spec-rad på `8802b999` och rapporterade två
källkonflikter som inte fanns. Två hål, båda samma familj som grindens egen
docstring redan beskriver en gång:

1. **En Ø-diameter har ingen axelbokstav.** `Ø40 x 56H` och `Ø40 x 40H` gör 40
   till både diameter och höjd i tyskan, medan den svenska spec-fliken skriver
   diametern som `40L x 40B`. Grinden läste det som "40 är H i tyskan men L i
   svenskan". Ø-tal jämförs inte längre.
2. **En axel kan ha flera legitima tal.** `djupMax` fanns för soffans
   87/156-djup, men samma sak gäller höjden så snart en del går att ta av:
   klotet är 56 cm med spett och 40 cm utan, och båda står ordagrant i källan.
   Varje axel får nu vara en lista; skalären och `djupMax` fungerar oförändrat.

Verifierad åt båda hållen: ett planterat axelfel (`40 cm djup`) fäller och
namnger nu BREDD/HOJD, en planterad äkta källkonflikt utan Ø ger två träffar,
och rundans åtta texter går rena.

## Och normaliseraren var en byte fel — i varje runda

`wixnorm.py` modellerade fyra av Wix fem åtgärder vid sparandet. Den femte är
att filens AVSLUTANDE radbrytning strippas. Regel 1 (`>\n<` → `><`) kräver ett
`<` efter radbrytningen, så filens sista `\n` — som inte har något efter sig —
överlevde normaliseringen men inte Wix.

| | förväntat | lagrat i Wix |
|---|---:|---:|
| `8802b999` | 3038 | **3037** |
| `45fd6bc6` | 3124 | **3123** |

Med radbrytningen bortstrippad stämmer båda checksummorna exakt, och så gör
alla åtta.

⚠️ **Och en första slutsats här var för bred — mätt, och fel.** Raden påstod
att varje runda vars fil slutar med radbrytning bar ett kvitto som låg en byte
fel. Det gör de inte: L1:s och L2:s lagrade kvitton är räknade PÅ den
strippade texten och stämmer exakt. Felet fanns bara i den här rundan, för att
den var den första som anropade `wixnorm.normalisera` rakt av i stället för att
kompensera i ett eget skript. Modulen hade hålet; rundorna före hade det inte.

⚠️ **En byte ser ut som en struntsak och är just därför farlig:** avvikelsen är
omöjlig att skilja från ett äkta transkriberingsfel på ett tecken, och den som
sett den tillräckligt många gånger slutar titta efter vilket det var.
Verifierad åt båda hållen: rundans åtta texter stämmer exakt, och ett planterat
en-teckensfel (`Ø11,5` → `Ø11,6`) faller fortfarande.

## Filer

| fil | vad |
|---|---|
| `kallor.json` + `kvitto-kalla.json` | källtexterna ordagrant, med checksummebevis |
| `<kort>.html` | de svenska texterna |
| `FOTOFYND.md` | vad fotona sa innan texten skrevs |
| `foto-tal.txt` | tal som bara går att läsa på bilden |
| `alt.tsv` | 38 alt-texter |
| `bilder-bort.tsv` | två bilder med tysk affisch |
| `namn.tsv`, `slugs.txt`, `sku.tsv`, `seo.tsv` | namn, slug, SKU, sökresultat |
| `kategori.tsv` | kategorikopplingar |
| `ids.tsv`, `lager.tsv` | urvalets facit och saldo |
| `axelfacit.json` | genererad server-side ur `plainDescription` |
| `md5.json` | bildernas checksummor |
