# Runda 140 — Steg 14: live-grinden, och korslänken som stängde ringen

## Svepet

```
grind.sjalvtest():     saknas — rundans grind självtestas i mutation.py
grindar._sjalvtest():  78 fall, 0 fel
kontrollsida hundsoffa-stor-hund-upphojd  1 träffar som är BUTIKENS

01fcdf1d  hundsoffa-98-cm-ljusgra      HIT  0 fel      c9ccf5a3  hundbadd-kantstod-90-cm       HIT  0 fel
bb3cd4ed  hundsoffa-98-cm-gron         HIT  0 fel      4c5d4687  hundsoffa-sammet-102-cm       HIT  0 fel
881540a6  hundsoffa-98-cm-bla          HIT  0 fel      68f8cae9  hundbadd-96-cm-petrol         HIT  0 fel
5b8162d1  hundsoffa-64-cm-ljusgra      HIT  0 fel      ee19a8c8  husdjurssoffa-70-cm-krem      HIT  0 fel
1835c144  hundsoffa-64-cm-petrol       HIT  0 fel      2ba6baf0  hundsoffa-sammet-82-cm        HIT  0 fel
9ee2fa6e  hundsoffa-snackrygg-gron     HIT  0 fel      22c7de56  husdjurssoffa-rund-gron       HIT  0 fel
                                                      07ac9918  husdjurssoffa-med-forvaring   HIT  0 fel

SUMMA: 13 sidor, 0 fel
```

`c11948ac` är inte med: den är OUT_OF_STOCK och hölls medvetet tillbaka i
Steg 13. En opublicerad sida svarar 404, och en 404 räknas som FEL — att ta
med den hade gett ett rött svep för ett beslut som var riktigt.

## ⚠️ Kontrollsidans enda träff är grindens egen produktspecificitet

Kontrollsidan gav ETT fynd: **`☠️ MATERIALLÖGN — stommen är MDF på den här
modellen`**. Det ser ut som ett fel på en publicerad sida och är det inte.

`liverunda.kor` graderar kontrollsidan under `pids[0]` = `01fcdf1d`, som är
en av de fem MDF-stommarna, så `massiv`-förbudet slår till. Kontrollsidan är
en ANNAN produkt, och läser man vad den faktiskt skriver är den invändningsfri:

| kontrollsidans text | |
|---|---|
| `Material: polyester, MDF, skumstoppning och furu` | stommen är MDF — och sidan SÄGER det |
| `Ben: massiv furu, benhöjd 8 cm` | **benen** är massiva, inte stommen |

Den skiljer alltså på stomme och ben, vilket är precis den skillnad förbudet
finns för att skydda. Subtraktionen är korrekt; ingenting maskeras.

## ✅ #480 — korslänken gick bara åt ett håll

Steg 1 mätte fram att den publicerade `64f5d64b` är samma modell som grupp A
i en femte färg (samma totalmått, sittyta, dyna, benhöjd och hundgräns — och
**samma måttritning**, omfärgad). Rundans tre färger länkar alla dit
(`samma soffa i mörkgrått`). Sidan hade **inget `Passar inte den här?`-block
alls** och länkade därför ingenstans tillbaka.

Blocket är tillagt: `hundsoffa-98-cm-ljusgra` · `-gron` · `-bla`.
Revision 13 → 14, `fieldMask: ["plainDescription"]`, återläst med
`?fields=PLAIN_DESCRIPTION` (ett PATCH-svar bär inget `?fields` — #425/#457).
`visible`, variantens SKU, media och pris orörda; ingen `variantsInfo`-PATCH,
alltså ingen raderad variantmedia (#501).

### Tre grindar före skrivningen, och de svarar på olika frågor

☠️ **Handavskriften grindades mot den RENDERADE sidan.** Wix ersätter hela
`plainDescription`, så den gamla texten måste passera mina händer — och en
återläsning som jämför mot samma avskrift bevisar ingenting. Det är runda
128:s fynd ordagrant (#485: *"Kvittot jämförde Wix mot MIN EGEN felskrivning,
inte mot facit"*). Butikens renderade sida är den enda källa som inte gått
genom mig: **31 av 31 element ordagrant.**

⚠️ Första försöket delade på MENING och rapporterade fyra saknade rader. Alla
fyra var rubrik + nästa stycke hopklistrade — rubriker slutar inte med punkt.
Delaren var fel, inte avskriften. **En grind som delar på fel enhet fäller
korrekt text**, och det är samma familj som falsklarmen i #452 och #507.

☠️ **Blocket får inte innehålla ett ord som inte redan passerat rundans fulla
grind.** Boilerplaten är `texter.KORS_INGRESS`/`KORS_TEXT` ordagrant och
färgorden står i grupp A:s egna korslänkar, så hela blocket är redan granskad
text — granskad på tretton sidor, inte av ett nytt regeluttryck.

☠️ **Kontrollsidan är rundans egen mätinstrument.** Allt som skrivs där
SUBTRAHERAS från de tretton sidorna som "butikens". Ett fynd i det nya
blocket hade alltså maskerat samma fynd på tretton sidor. Ordningen är därför
medveten — svepet kördes FÖRE skrivningen, mot en sida rundan inte rört — och
att blocket inte förstör kontrollen är **mätt**: samma mönster kört över den
gamla och den nya beskrivningen ger samma mängd, ett fynd båda gångerna.

### ⚠️ Butiken renderar blocket först när ISR-cachen går ut

Uppmätt direkt efter skrivningen: `x-vercel-cache: HIT`, `age` 170 → 221 s och
stigande, blocket inte i HTML:en. Cachen ligger en timme och
`/api/admin/revalidate` kräver `ADMIN_SECRET`, som inte finns här. Wix-
återläsningen är kvittot på att skrivningen tog; renderingen följer av sig
själv. **En hämtning direkt efter en skrivning mäter cachen, inte sidan.**

## Vad rundan landade på

| | |
|---|---:|
| Sidor live och grindade | **13** |
| Fel i svepet | **0** |
| Hållna tillbaka (slutsålt) | 1 (`c11948ac`) |
| Publicerade grannar rättade på vägen | 1 (`64f5d64b` — kategorilöv + korslänk) |
