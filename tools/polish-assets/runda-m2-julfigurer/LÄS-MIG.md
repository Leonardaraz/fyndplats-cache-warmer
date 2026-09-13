# Runda M2 — körlogg

## Steg för steg, med kvitton

| steg | utfall |
| :-- | :-- |
| Källor hämtade ordagrant | 8/8, kontrollsumma räknad i anropet |
| Källor bevisade mot `kvitto-kalla.json` | **8/8 LIKA** |
| Lagergrind i urvalet | 8/8 spårat saldo, 93–197 |
| Dubblettskärm på huvudbildens hash | 8 unika, noll delade |
| Kontaktark byggt FÖRE brödtexten | 8 ark, 39 bilder |
| Homoglyfsvep före grindning | **2 fynd**, båda rättade |
| Grindar (siffer/axel/alt/seo/sku/superlativ/länk) | 7 rena, noll varningar |
| Bilder skrivna | 34 (5 reklamplanscher borta) |
| Alt-texter skrivna | 34, noll tyska |
| SEO skriven | 8 × två taggar, keywords rensade |
| Variant-SKU skriven | 8/8 svenska, unika |
| Kategorier | **24/24** kopplade, noll fel |
| `las` (prisgrind) | **8/8 gröna** — körningar 2898–2905 |
| `stampla` | **8/8 gröna** — körningar 2906–2913 |
| Wix-återläsning mot facit | **8/8**, noll fel på nio kontroller per produkt |

Alla sexton workflow-körningar kördes med `ref` satt till den här grenen,
aldrig mot `main` (#181).

## ☠️ Två skrivmönster som skulle ha smugit förbi

### 1. SKU:n tappas tyst i en kombinerad PATCH

Första batchens skrivning gjorde en PATCH med `name` + `slug` +
`plainDescription` + `seoData` + `visible` + `variantsInfo`, följd av en
media-PATCH. Allt tog UTOM variantens SKU, på **tre av fyra** produkter.

```
skickat   variantsInfo.variants[0].sku = "FP-tomte-240-klappsack"
lagrat    variantsInfo.variants[0].sku = "FP-weihnachtsmann-2-40-m"
svar      200, inget felmeddelande
```

Den fjärde (`321bdedf`) fick sin SKU för att den råkade skrivas i ett eget,
senare anrop under felsökningen. Skriven ensam efter mediaskrivningen tog den
på alla åtta.

**Regeln: skriv variant-SKU:n SIST och i ett eget anrop.** Elfte gången i
samma familj — ett svar utan fel är inget kvitto, och här fanns inte ens ett
`bulkActionMetadata` att läsa.

### 2. ☠️ En omedelbar återläsning kan servera en FÖRÅLDRAD projektion

Batchens verifiering läste tillbaka varje produkt direkt efter skrivningen.
För `321bdedf` och `80e1a550` rapporterade den att ingenting hade skrivits:
gammal tysk text (kontrollsumman stämde exakt mot KÄLLAN), gammal slug,
`visible: false`, fem seo-taggar.

En läsning en stund senare:

```
revision      2 → 4        (två PATCH hade tagit)
visible       true
slug          uppblasbar-pepparkaksgubbe-245-cm-med-polkagriskapp
plainDescription  3 962 tecken, summa 881571526   = filens facit
```

Skrivningen hade alltså tagit hela tiden. Det var LÄSNINGEN som ljög.

Runbooken har det sedan tidigare om KATEGORIER ("läsprojektionen släpar efter
skrivningen; facit är bulk-svaret"). Det gäller **produktläsningen också**, och
det är farligare där, eftersom det inte finns något bulk-svar att falla tillbaka
på.

⚠️ **Och felriktningen är den dyra.** Ett falskt "ingenting skrevs" lockar till
en omskrivning av något som redan stämmer — i värsta fall med en revision som
hunnit bli inaktuell. Läs om innan du kallar en skrivning misslyckad.

**Regeln, nu i tre led:**
1. PATCH-svaret är ingen återläsning (#253).
2. En återläsning i samma anrop är inte heller ett kvitto.
3. Det som räknas är en SEPARAT läsning, en stund senare, mot ett facit
   räknat ur filen.
