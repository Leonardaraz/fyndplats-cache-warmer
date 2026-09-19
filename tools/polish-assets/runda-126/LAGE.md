# Runda 126 — läge

## Sex LIVE, ingen hålls tillbaka

Saldo över noll och EU-lager på varenda en (STEG1-5.md, Steg 3).

| id | slug | pris | konstruktion |
|---|---|--:|---|
| `3afe7275` | stodbockar-2-pack-80-130-cm | 869 | 2-pack, teleskop 80–130 cm, 6 lägen |
| `17e683e0` | sagbockar-2-pack-orange-250-kg | 1 229 | 2-pack, 4 höjdlägen 71–85,5 cm |
| `ed44170a` | arbetsbockar-2-pack-roda-580-kg | 1 499 | 2-pack, 7 höjdlägen, 580 kg/bock |
| `4a8e7f21` | kapsagstativ-rullstod-245-cm | 1 499 | två rullstöd, 123,5–245 cm |
| `941867cb` | verkstadsbank-pa-hjul-hopfallbar | 1 549 | hålplank, viks till 9 cm bredd |
| `9e9c78b9` | verkstadsbank-155-cm-med-lada | 1 749 | fast bänk, låda + två hyllplan |

## Kvitton

| | |
|---|---|
| Prisgrind Steg 3 | **6 av 6** — Actions **2495–2500**, loggen läst: `stammer true`, `regel: x1.2, avrundning charm99` |
| Avskrift (tecken + teckenkodssumma) | **6 av 6 EXAKTA** |
| `<h2>` per sida | 5 |
| Trasiga `https:/`-länkar | 0 |
| Märke (`brand`) | `null` på alla sex |
| Alt-texter | **28**, noll utan alt, noll tyska |
| Bilder borttagna | `ed44170a` 5 → 3 (position 4 och 5 bar stor tysk text) |
| Kategori Verktyg + All Products | 6 av 6 |
| SKU i Wix-varianten | 6 av 6, variant-id och priser oförändrade |
| Publicering | 6 av 6, `visible:true` återläst på varje |
| Stämplingar | Actions **2501–2506**, sex `success`, loggen läst: `uppdaterad — needsAiPolish, draftStatus, variantSkus` |
| Mappningen återläst | `3afe7275` (2507) och `9e9c78b9` (2508) — `needsAiPolish:false`, `draftStatus:"published"`, rätt SKU på rätt `wixVariantId` |
| Källgrind | **50 självtestfall 0 fel · 6 sidor 0 fel** |
| Mutationstest | **9 mutationer, 0 missar** |
| Runda 123 + 124 + 125 omkörda mot lagade `grindar.py` | **30 sidor, 0 fel, ingen drift** |
| **Steg 14 live** | **6 sidor, 0 fel** |

## Tio fynd som hade nått kund

1. ☠️ **`349b7403` är publicerade `cef0d96a`** (arbetsplattform i aluminium) —
   tre byte-identiska bildpar (dHash 0,00) och fyra tal identiska på decimalen
   (110 × 32 × 50, 77 × 32 × 16, 4,8 kg, 150 kg). Utkastet 1 049 kr, den
   publicerade 819 kr. **Inte polerad** — uppgift #471, Leonards beslut.
2. ☠️ **Sökordssvepet måste gå på sluggens STAM.** En handskriven ordlista
   missade `arbetsplattform` och dolde därmed exakt den publicerade sida
   dubbletten ovan måste mätas mot. Uppgift #473:s syskon.
3. ☠️ **SKU-krocken syns INTE i sluggen — den uppstår i den KAPADE strängen**
   (uppgift #473). Två olika sluggar kapade till samma 24 tecken. Löst genom
   att byta HUVUDORD, inte genom att lägga till ett bestämningsord.
4. ☠️ **Båda textkällorna ljuger om färgen, åt olika håll i samma batch**
   (uppgift #472) — spec-blocket säger en färg, leverantörens tyska
   `Technische Daten` en annan. Bara BILDEN är facit.
5. ☠️ **Artikelnumret står i leverantörens egen tyska `Technische Daten`**
   (uppgift #470). Det är mekanismen bakom de fyra publicerade sidor som
   läcker numret: den som polerar läser specen och skriver av.
6. ☠️ **`grindar.ARTNR` var BLIND för hälften av Aosoms nummer** (uppgift
   #474) — de som börjar med en BOKSTAV (`B71-…`). Hittad av mutationstestet,
   inte av ögon. Mönstret matchar nu FORMEN, sju nya självtestfall låser den,
   och runda 123–125 är omkörda utan drift.
7. `ed44170a` position 4 och 5 bar stor tysk text i pixlarna — borttagna.
8. `9e9c78b9`: leverantören påstår att pulverlackerat stål är rostbeständigt.
   Sidan säger i stället att lacken skyddar **så länge den är hel**, och
   `ROSTGRINDEN` är POSITIV på den formuleringen.
9. `3afe7275` bär två motstridiga vikter (8 och 8,8 kg) i samma källa. Sidan
   anger det HÖGRE talet.
10. ☠️ **`ed44170a`:s leverantörsnamn säljer PARETS summa (1 160 kg) som om den
    vore per bock.** `PARLASTGRINDEN` kräver därför båda talen med rätt ord
    intill: `per bock` vid det ena, `paret`/`båda`/`tillsammans` vid det andra.

## Två grindfynd i den delade modulen

- ☠️ **Säkerhetslöftesgrinden kände inte omvänd svensk ordföljd.** Den fyrade
  på `aldrig tippar` men inte på `tippar aldrig`. Vidgad — och den fällde då
  min EGEN text: *"EVA så att virket inte glider"* är ett absolut löfte på en
  580 kg-bock. Omskrivet till *"ger friktion mot virket"* på tre ställen,
  hellre än att försvaga grinden.
- ☠️ **Rostgrinden läste EN mening.** En FAQ-frågas kvalificering ligger i
  SVARET, alltså utanför fönstret — samma klass som uppgift #415. Den läser
  nu mening + nästa mening, i både käll- och live-grinden.

## Kvar till Leonard

| | |
|---|---|
| #471 | `349b7403` mot publicerade `cef0d96a` — bevisad dubblett, opolerad |
| #461 | tredjepartslogotyper i livsstilsbilder; rundan lägger till `9e9c78b9` position 5 med tre läsbara märken |
| #470 | hur många publicerade sidor bär ett artikelnummer ur leverantörens `Technische Daten` |
| #474 | hur många publicerade sidor bär ett BOKSTAVSINLETT nummer den gamla grinden inte kunde se |

## Kvar i familjen (runda 127+)

- **Tolv arkivskåp och rullcontainrar** — `709f7aac`, `66866eb7`, `4d5b3bb5`,
  `521aec3c`, `9ba9af92`, `9b8c7308`, `21a12739`, `3273d2ee`, `6df0ce88`,
  `5a0f9799`, `beeada22`, `81c123fa`. ☠️ **Fyra delar identiskt namn och två
  par till delar namn** — de kräver en intern dubblettmätning FÖRE
  batchurvalet, inte efter.
- **Åtta rullande verktygsskåp** — `1db06f83`, `f2495eee`, `1654dd75`,
  `fc6fdd63`, `b920d526`, `d9965552`, `bc2e7191`, `88eb3627`. Kräver
  måttjämförelse mot familjens fjorton publicerade sidor.
