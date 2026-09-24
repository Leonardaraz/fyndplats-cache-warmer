# Runda S2 — 87 sidor vars SEO-titel var lika med namnet, eller saknades

Hittad i runda S1 (fynd 2). Butiken (`lib/products.ts` på `headless-site`)
använder den sparade `seoData` bara när titeln skiljer sig från namnet:

```ts
curatedSeoTitle = rawSeoTitle !== name ? rawSeoTitle : undefined
curatedSeoDesc  = curatedSeoTitle && rawSeoDesc
```

En titel som är ordagrant lika med namnet stänger alltså av HELA `seoData`.
Sidan får `{namn} | Fyndplats` som titel och beskrivningens första stycke,
kapat vid 155 tecken, som metabeskrivning — ofta mitt i en mening:

```
lagrat:  Kontorsstol med utdragbart fotstöd och ryggen fällbar 140 grader.
         Klösbeständigt konstläder, sits 46–54 cm, 120 kg.
visat:   En kontorsstol som fälls bakåt 140 grader och har ett fotstöd som
         dras ut under sitsen. Klädseln är ett klösbeständigt konstläder som borstar av sig
```

Katalogsvep 2026-09-23: **78 av 3 334 publicerade** hade titel = namn och
**9 saknade titel helt** (foliehusen ur runda 145, med tomma taggar av typen
`description`/`property` och fokusord utan `origin`).

## Utfallet

| | |
|---|--:|
| Sidor | **87** |
| — titel = namn + ` \| Fyndplats` (ryms inom 60 tecken) | 43 |
| — titel kortad för hand (namn + suffix över 60) | 35 |
| — titel och metabeskrivning skrivna från grunden | 9 |
| Metabeskrivningar som rättades innan de visades för första gången | 7 |
| Fokusord (`settings.keywords`) i slug-stil (`dorr`, `vaxthus`) rättade till svenska | 12 |
| Filgrind (`gate-seo.py`, siffror mot livesidan) | **0 fynd** |
| Säkerhetskopia (`fore/`), kontrollsumma per post | **87/87 exakta** |
| Skrivning, kontrollsumma räknad i SAMMA anrop som skrivningen | **87/87, 0 fel** |
| Återläsning i eget anrop, lagrad `seoData` mot filens summa | **87/87 LIKA** |
| Fortfarande publicerade efter skrivningen | 87/87 |
| **Live: `<title>`, meta, `og:title`, `og:description` exakt lika `seo.tsv`** | **87/87** |

Live-jämförelsen gjordes två gånger: av `livegrind.py`:s SEO-svep och av en egen
jämförelse, som också fick ett planterat fel och fällde det. Sidorna var
renderade efter skrivningen (`age` ~200 s vid hämtningen, skrivningen låg
över 15 minuter tidigare).

☠️ **De lagrade titlarna var bra — det var regeln i butiken som kastade dem.**
För 43 av 78 räckte det att lägga på suffixet: titeln på sidan blev
oförändrad, och den granskade metabeskrivningen syns nu i stället för det
kapade första stycket.

## Rättat på vägen

- **`4ff03bbd` keramikvärmaren** hade *"EU-lager."* sist i metabeskrivningen
  — lagerlandsregeln. Den hade aldrig visats; nu visas den utan.
- **Förvaringsbänken** (`à`), **boxbollen** (`ø` → `Ø`) och **CNC-fräsen**
  (`≤`) föll på teckengrinden och skrevs om.
- Tre växthustexter med `drivbänk-växthus` och `Genomgångsbart` fick bättre
  svenska, utan att ett enda sakpåstående ändrades.
- **Två tunnelväxthus (`75b88995`, `b8496223`) skrev *"(leverantörens egen
  skala)"*** i beskrivningen — mot kunden är vi leverantören. Bytt till
  *"tillverkarens egen skala"* på servern, frasen krävd exakt en gång, och
  återläst i eget anrop: summa lika, gammal fras 0, ny fras 1.

## ⚠️ Live-grinden hittade 110 äldre brister i INNEHÅLLET — inga i SEO

| fynd | sidor | vad det är |
|---|--:|---|
| `FLIK SAKNAS` (Användning och skötsel) | 50 | krav sedan 2026-08-30 |
| `ALT/TYSKT` | 30 | tyska alt-texter kvar på bilderna |
| `SLUTSALD` | 15 | **kontrollerat: saldo 0 och varianterna synliga på alla 15** — riktiga slutförsäljningar, inte variantfelet från #148 |
| `KATEGORI SAKNAS` | 7 | brödsmulan går `Hem / Butik / produkt` |
| `SIDA/TYSKT` | 6 | **alla sex är ordet *robust*** — svenska också; ordlistan får bara växa, så de står kvar som kända falsklarm |
| `SIDA/LEVERANTOR` | 2 | lagade, se ovan |

Ingen av dem rör rundans skrivning. Skötselflikarna och alt-texterna är ett
eget poleringsjobb av samma slag som `runda-s1-semrush/skotsel/`.

De nio foliehusen ur runda 145 har dessutom råa beskrivningar (bock-listor,
*"Tekniska data:"*, *"Användning och skötsel:"* som löptext i stället för flik).

## Filerna

| fil | vad |
|---|---|
| `ids.txt` · `slugs.txt` | wix-id, slug och typ (`EQ` titel = namn, `INGEN` utan titel) |
| `fore/del1–5.json` | **återställningen** — exakt `seoData` före skrivningen, med kontrollsumma per post |
| `kontroll.py` | kontrollsumman (samma som i skrivanropen) och verifieringen av säkerhetskopian |
| `overrides.tsv` | de handskrivna titlarna och metabeskrivningarna |
| `seo.tsv` | det som skrevs (källan för grindarna) |
| `bygg-seoplan.py` · `skrivplan.json` | skrivplanen med kontrollsumma per rad (hette `bygg-skrivplan.py` till 2026-09-24, då det namnet blev en kanonisk grind i `tools/polish-gates/`) |
| `skrivlogg.txt` | revision före/efter per produkt |
