# T118: loungesetet `58c5bc3a` — rena bilder per färg och Mörk Khaki utan grått set (2026-11-07)

Leonards skärmbild 2026-11-07 (21:58 svensk tid) på `/produkt/loungeset-rotting-5-delar` med färgen Mörk Khaki vald: *"Är detta en aosom
produkt? Den har inte så många rena bilder per alternativ så hämta rena och mörk khaki har en fel bild kopplad också till sig."*

## Är det en Aosom-produkt?

**Varan är en Aosom-vara, men sidan är en AliExpress-sida i vårt system.**

- Mappningsraden har ingen leverantör (`supplier: null`, alltså en äldre AliExpress-rad), `needsAiPolish: false`, `draftStatus: published`,
  `hasEuWarehouse: true` och ingen Aosom-synk (`aosomSyncedAt: null`). Prisregeln gäller inte raden (priset 4 899 kr följer en äldre regel).
- AliExpress-listningen (`ae-skubilder.yml`, 21:06 UTC) har tre SKU:er (DARK GRAY, LIGHT GRAY, Dark Khaki), sex galleribilder och nio beskrivningsbilder.
  Beskrivningsbilderna är spanska Aosom-bilder (säljartext på spanska, Aosoms *¿Quiénes somos?*-panel, fraktbegränsning för Kanarieöarna m.m.), och
  den mörkgrå måttskissen serveras från Aosoms egen bilddomän. Varan skickas från Spanien.
- Aosoms egen feed (6 487 rader) har ingen rad för den: sökningarna *Rattan Glastisch*, *Rattan Glastisch 5*, *Lounge Set 5*, *Rattan 5-teilig*,
  *Rattan Hocker Sofa Tisch* och *Modular Rattan* gav bara andra varor (ett fyradelsset med saldo 0, ätgrupper med fyra stolar och ett bord).
  Sidan kan därför inte mappas om till Aosom (`aosom-remap` kräver en feedrad), och `aosom-fargtillagg` och `aosom-bildkandidater` gäller den inte.
- Den stod redan på `farger-fler-bilder-2026-10-21/flaggade.tsv` (AliExpress, sämsta färgen 1 bild) och i
  `tva-axlar-revision-2026-10-23/delade-lankar.tsv` (*grå rotting och grå dynor på alla tre*).

## Vad som var fel

Måttskissen (`acadb2`) och de två korten (`cfd468`, `c2a232`) var länkade till alla tre färgerna, men visar ett **grått** set. Mörk Khaki är ett set med
**mörkbrun rotting och gräddvita dynor**, så färgen visade bilder av en annan vara än den som valts. Måttskissen visar dessutom de **ljusgrå** dynorna
(mätt: medel-RGB 134, 145, 142 mot 136, 145, 145 för Ljusgrå och 88, 98, 98 för Mörkgrå), alltså fel nyans också för Mörkgrå.

Före (`live-galleri.mjs`, 21:15 UTC): Mörkgrå 5 bilder, Mörk Khaki 4 (en egen, tre gemensamma som visar det grå setet), Ljusgrå 4 (en egen, tre gemensamma).

## Bilder ur listningen (granskade på kontaktark före texten, OCR och ögon)

| Källa i listningen | Innehåll | Beslut |
|---|---|---|
| galleri 0 (= SKU Mörkgrå) | vit studiobild, mörkgrå dynor | finns redan på sidan (#1) |
| galleri 1 (= beskrivningsbild 7 i stor version) | miljöbild, kvinna som läser | finns redan (#2) |
| SKU Ljusgrå, SKU Dark Khaki | vita studiobilder | finns redan (#4, #3) |
| galleri 2 | måttskiss, ljusgrå dynor | finns redan (#5) |
| galleri 3 | familj i soffan (ljusgrå dynor), spansk rubrik överst och miniatyrer nederst | **används som utsnitt** (N3), rubrik och miniatyrer bortskurna |
| galleri 4 | kvinna och golden retriever i Khaki-setet, spansk text *COJÍN CÓMODO* och tre insatsbilder nederst | **används som utsnitt** (N1), texten bortskuren |
| galleri 5 | kvinna som torkar spillt kaffe på glasskivan (Khaki-setet), spansk text nederst | **används som utsnitt** (N2), texten bortskuren |
| beskrivning 4 | närbild på rottingens flätning (beige och grå), spansk text nederst | **används som utsnitt** (N5), texten bortskuren |
| beskrivning 6 | måttskiss, mörkgrå dynor | **används hel** (N4): bara tal och enheter, alla står redan på sidan |
| galleri 3–5 i sin helhet, beskrivning 5 | spansk säljtext, *¿Quiénes somos?*-panel | förkastade |
| beskrivning 0 | 931 × 35 px fraktnotis på spanska | förkastad |

Utsnitten görs med Wix egen crop-adress på de importerade originalen (inga leverantörsbilder i repot, och inga bildadresser). ☠️ De är **kvadratiska**: butikens galleri visar varje bild som en kvadrat ur mitten (`farg-krop.py`), så ett brett utsnitt hade tappat kanterna. Textens första rad hittades med en radskanning, och varje utsnitt är REN vid `ocr-forgranska.py` (ett första utsnitt av galleri 4 som var 40 px för högt gav TEXT, rubrikens överkant):

| Ny bild | Original | Utsnitt (x, y, bredd, höjd) | Färg |
|---|---|---|---|
| N1 | galleri 4 | 70, 0, 1150, 1150 | Mörk Khaki |
| N2 | galleri 5 | 440, 0, 1560, 1560 | Mörk Khaki |
| N3 | galleri 3 | 380, 480, 1100, 1100 | Ljusgrå |
| N4 | beskrivning 6 | hel (2000 × 2000) | Mörkgrå |
| N5 | beskrivning 4 | 400, 0, 1200, 1200 | Mörkgrå och Ljusgrå |

## Plan (måltillstånd, `skriv-lounge.js`)

Galleri: E1 E2 E3 N1 N2 E4 N3 N5 N4 E5 E6 E7 (sju bilder blir tolv, befintlig ordning bevarad).

| Färg | Före | Efter |
|---|---|---|
| Mörkgrå | E1, E2, E5, E6, E7 (5) | E1, E2, N5, N4, E6, E7 (6) — rätt måttskiss (mörkgrå dynor), närbild |
| Mörk Khaki | E3, E5, E6, E7 (4) | E3, N1, N2 (3) — bara bilder av Khaki-setet |
| Ljusgrå | E4, E5, E6, E7 (4) | E4, N3, N5, E5 (4) — miljöbild, närbild, rätt måttskiss behålls, korten (mörkgrått set) bort |

E6 och E7 är de två Fyndplats-korten som redan låg på sidan (*låt de som är gjort ligga kvar*, Leonard 2026-10-27). De visar det mörkgrå setet och
behålls därför bara på Mörkgrå: en bild på en viss färgs vara visas inte under en annan färg (Leonard 2026-10-23). Korten ligger kvar i galleriet,
ingenting raderas, och inga nya kort byggs. Khaki får ingen måttbild: listningen har ingen måttskiss för Khaki-setet.

## Utfall

- **Import och utsnitt** (21:30–21:31 UTC): de fem originalfilerna importerades med `UploadImageToWixSite` (alla READY, 2000 × 2000) och paras mot originalen på bildinnehåll
  (medelavstånd 0,0–0,4; bara beskrivning 6 var byte-identisk, de andra kom i en bättre kodning än den vi laddat ner). Fyra utsnitt skapades med Wix crop-adress och
  kontrollerades mot de lokala utsnitten (storlek och medelavstånd 0,5–0,7) och med OCR (REN).
- **Skrivning** (21:32 UTC, `skriv-lounge.js`, `TORR = false`): galleriet 7 → 12, länkarna Mörkgrå 6, Mörk Khaki 3 och Ljusgrå 4, `ok: true` utan avvikelser. Separat
  återläsning 21:35: galleriets ordning, alt-texter, länkar och variantbilder som planen, SKU:erna och synligheten oförändrade.
- **Variantbilder** (`variantbild.yml`, skarp, 21:33): 1 kontrollerad, 1 rättad, 0 kvar fel.
- **Live** (21:36 UTC, `age` 50–57 s, `live-galleri.mjs`): Mörkgrå 6 bilder, Mörk Khaki 3 (*slut i lager*), Ljusgrå 4. Inget grått set under Mörk Khaki.
- **Pris och lager ändrades av något annat jobb** mellan 21:14 och 21:32 UTC (priset 4 899 → 4 999 kr, Mörk Khaki 15 → 0, Ljusgrå 0 → 15 i lager, som AliExpress visar).
  Skrivningen jämförde varianternas id, SKU, synlighet, pris och kostnad före och efter och rörde dem inte.

Skriptet läser utgångsläget först och skriver ingenting om galleriet eller länkarna inte är som när planen gjordes. Omkörning efter skrivningen vägras därför.
