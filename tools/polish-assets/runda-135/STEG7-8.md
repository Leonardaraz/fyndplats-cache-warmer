# Runda 135 — Steg 7 och 8

Åtta klösmöbelutkast. Allt nedan är MÄTT i en separat läsning, inte läst ur
PATCH-svaret.

## Steg 7 — text, slug och SEO

| pid | slug | namn | titel | meta |
|---|---|--:|--:|--:|
| 0696efce | `klospelare-87-cm-bollbana` | 65 | 51 | 103 |
| 7564dcfb | `klospelare-87-cm-med-badd` | 55 | 47 | 105 |
| 5d64f423 | `klostrad-lagt-tra-och-jute` | 68 | 43 | 110 |
| 82efeeaf | `klostrad-86-cm-klosklot` | 66 | 46 | 93 |
| bdc7e768 | `klostrad-98-cm-fardesign-tunnel` | 68 | 49 | 111 |
| e2c8b0f3 | `klostrad-98-cm-bladkrona` | 63 | 40 | 98 |
| cc5da788 | `klostrad-100-cm-flatad-kupol` | 62 | 49 | 103 |
| 741c5723 | `klostrad-132-cm-borstpelare` | 61 | 43 | 101 |

Alla under taken (namn 80, titel 60, meta 155), och ingen titel är identisk
med namnet — då hade butiken renderat mallen `{name} | Fyndplats` i stället
och en titel räknad till 52 blivit 64 live.

☠️ **`visible` skickades INTE**, och står kvar `false` på alla åtta. Ett
`visible: false` i payloaden speglas ned på VARIANTEN, och en variant med
`visible: false` betyder att sidan saknar köpbar variant den dag den
publiceras (uppmätt runda 120).

### Kvittot: `kvitto-steg7.py`, 56 jämförelser, 0 avvikelser

☠️ **FÖRSTA FÖRSÖKET GAV 16 AVVIKELSER PÅ ÅTTA KORREKTA PRODUKTER.** Varje
beskrivning låg exakt 415 tecken längre i Wix. Orsaken är inte ett fel utan
Wix normalisering vid lagring, och regeln fanns redan i runbooken som PROSA
med koden i ett citatblock — alltså en tvilling varje runda skrev av på nytt.
Den bor i `grindar.wix_normalisera` nu, med åtta självtestfall.

## Steg 8 — SKU:n i BÅDA leden

Sluggen är bytt, så importens tyska SKU stämmer inte längre. Båda halvorna är
körda; den ena räcker inte (uppmätt runda 108: mappningen grön, Wix kvar på
tyska och dessutom krockande inom varje par).

| pid | Wix-SKU FÖRE | EFTER |
|---|---|---|
| 0696efce | `FP-3-in-1-kratzbaum-mit` | `FP-klospelare-87-cm` |
| 7564dcfb | `FP-katzenbaum-87-cm` | `FP-klospelare-87-cm-badd` |
| 5d64f423 | `FP-katzenbaum-61-5-cm-mit` | `FP-klostrad-lagt-tra-jute` |
| 82efeeaf | `FP-kratzbaum-mit-2-etagen` | `FP-klostrad-86-cm-klosklot` |
| bdc7e768 | `FP-katzenbaum-im-schaf` | `FP-klostrad-98-cm-fardesign` |
| e2c8b0f3 | `FP-kratzbaum-98-cm-hoch` | `FP-klostrad-98-cm-bladkrona` |
| cc5da788 | `FP-kratzbaum-100-cm` | `FP-klostrad-100-cm-flatad` |
| 741c5723 | `FP-132-cm-katzenbaum-mit` | `FP-klostrad-132-cm` |

Strängarna är räknade av `grindar.sku_bas` ur den polerade sluggen — inte
skrivna för hand. Fyra handskrivna SKU:er stod ett token för korta i runda 128.

☠️ **`sku` ligger TOPPNIVÅ på varianten, inte i `physicalProperties`.** Mätt
på skarpa V3 före skrivningen, just för att läsningens fallback annars döljer
vilket fält som gäller.

☠️ **`visible` skickades explicit i BÅDA leden** — produktens `false` för att
PATCH:en annars publicerar utkastet, variantens `true` för att produktens
`false` annars speglas ned.

**Priset rördes inte.** Varianterna skickades tillbaka verbatim med bara `sku`
bytt, och priset lästes före och efter: oförändrat på alla åtta
(899/899/899/869/829/799/999/969).

**Bilderna överlevde.** Uppgift #501 säger att en `variantsInfo`-PATCH kan
radera variantens media, så antalet räknades efter: 5 bilder + huvudbild på
alla åtta.

### Krockkontroll mot katalogen

Katalogens 61 publicerade `klo…`-sidor hämtades och deras SKU-baser räknades
med samma `sku_bas`. **Noll krockar** mot rundans åtta, och noll inbördes.

☠️ Mätningen bekräftar samtidigt uppgift #515 exakt: **tre baser delas av åtta
redan publicerade sidor** — `FP-klostrad-fem-plan-230` (3),
`FP-klostrad-takhogt-228-260` (3) och `FP-klostunna-100-cm-tva` (2). Det är
färgsyskon, alltså samma fälla som hundvagnarna: färgen ligger i sluggens
svans och `PRODUCT_PART_MAX = 24` klipper bort just den.

### Mappningshalvan

Åtta `stampla`-körningar via `polish-mapping.yml`, alla gröna. ☠️ Grönt är
inget kvitto — mappningsraden lästes därför tillbaka med `las` på 741c5723:

```
"wixVariantId": "f50277a1-0ab4-45c3-9d0b-59d7743f3a4f"
"sku": "FP-klostrad-132-cm"
prisgrinden: faktiskt 969, stammer true, regel x1.2 charm99
```

⚠️ De övriga sju vilar på ruttens egen förhandsvalidering (okänt
`wixVariantId` avvisas med 422 FÖRE skrivningen) och läses tillbaka i Steg 13,
där en `las` ändå körs per produkt.

`needs_ai_polish` och `draft_status` skickades TOMMA — de är Steg 13:s, och en
ifylld `draft_status` hade publicerat åtta opolerade utkast.
