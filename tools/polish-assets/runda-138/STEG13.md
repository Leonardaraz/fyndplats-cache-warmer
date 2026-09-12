# Runda 138 — Steg 13: publicerade, stämplade, och en korslänk som saknades

## Båda halvorna, i rätt ordning

☠️ **Steget har två halvor och bara den ena går via workflowen.** Wix-sidan
publiceras med en PATCH; mappningsraden stämplas med `polish-mapping.yml`.
Båda är gjorda, och båda har ett kvitto som inte är "svaret var 200".

### Halva 1 — Wix: `visible: true` på PRODUKTEN, ingen `variantsInfo`-PATCH

Runbooken säger att den avslutande PATCH:en ska bära `visible: true` på
**både produkt och variant**, annars går sidan live utan att varan går att
lägga i varukorgen. Det mättes i stället för att antas:

| | |
|---|---|
| Alla sju varianter | redan `visible: true`, med Steg 8:s SKU |
| `variantsInfo`-PATCH | **utelämnad** |

☠️ **Och det var inte lathet — den PATCH:en är farlig här.** Ett försök
svarade `400 price must not be empty` (en `variantsInfo`-skrivning kräver
`price`, alltså hade priset behövt skickas med på sidor där regeln är *rör
aldrig priset*), och uppgift #501 har mätt att **varje** `variantsInfo`-PATCH
raderar variantens media — även en som inte skickar media. Med varianten
redan synlig gör produktnivåskrivningen ensam hela jobbet.

**Regeln: läs variantens tillstånd innan du skriver det. En blankettinstruktion
som redan är uppfylld är en skrivning med blast-radie och noll nytta.**

Kvitto, en separat GET per produkt (PATCH-svaret bär inget `?fields`):

| pid | slug | produkt | variant | sku | bilder | utan alt | text |
|---|---|:--:|:--:|:--:|--:|--:|--:|
| `1366a476` | klostrad-200-cm-beige-halor | ✅ | ✅ | ✅ | 4/4 | 0 | 4 733 |
| `839a2ef5` | klostrad-230-275-cm-gront-katthus | ✅ | ✅ | ✅ | 5/5 | 0 | 4 406 |
| `68bc6c0c` | klostrad-225-255-cm-fyra-plan-bomullsrep | ✅ | ✅ | ✅ | 5/5 | 0 | 4 313 |
| `e5b31270` | klostrad-225-255-cm-rund-bas-sammet | ✅ | ✅ | ✅ | 6/6 | 0 | 4 053 |
| `fecadb3e` | klostrad-240-260-cm-trafarg-katthus | ✅ | ✅ | ✅ | 6/6 | 0 | 4 224 |
| `505a0dde` | klospelare-220-260-cm-tva-liggytor | ✅ | ✅ | ✅ | 6/6 | 0 | 3 714 |
| `7bdc47b8` | klostrad-ljusgratt-240-260-cm | ✅ | ✅ | ✅ | 6/6 | 0 | 3 827 |

### Halva 2 — mappningen: sju `stampla`-körningar

Läst först (`las`), sedan skrivet. Läsningen är kvittot på att Steg 8:s
mappningshalva faktiskt gjordes: **alla sju bar redan den svenska SKU:n**, så
`variant_skus` lämnades tomt och bara poleringsflaggan skrevs.

| pid | mappningens `sku` | prisgrind | före | efter |
|---|---|:--:|---|---|
| `1366a476` | `FP-klostrad-200-cm-beige` | stämmer | `pending_review` | `published` |
| `839a2ef5` | `FP-klostrad-230-275-cm` | stämmer | `pending_review` | `published` |
| `68bc6c0c` | `FP-klostrad-225-255-cm-fyra` | stämmer | `pending_review` | `published` |
| `e5b31270` | `FP-klostrad-225-255-cm-rund` | stämmer | `pending_review` | `published` |
| `fecadb3e` | `FP-klostrad-240-260-cm` | stämmer | `pending_review` | `published` |
| `505a0dde` | `FP-klospelare-220-260-cm` | stämmer | `pending_review` | `published` |
| `7bdc47b8` | `FP-klostrad-ljusgratt-240` | stämmer | `pending_review` | `published` |

Sju `OK: <id> uppdaterad — needsAiPolish, draftStatus` i sju jobbloggar.

⚠️ **`success` på jobbet är inget kvitto — raden är det.** Och den raden ÄR
ett kvitto, till skillnad från de flesta: `/api/admin/mapping` läser tillbaka
raden efter `saveMapping` och svarar `500` om fälten inte kom fram. Ett `ok:
true` betyder alltså "verifierat", inte "skickat".

☠️ **Tomma fält betyder "rör inte" — och `variant_skus` lämnades tomt med
flit.** Fram till 2026-09-02 hade `needs_ai_polish` och `draft_status`
defaultvärden, och en stämpling som bara ville skriva SKU:er publicerade
produkten på köpet. Här är riktningen den omvända: SKU:erna satt redan, och
att skriva om dem hade varit en skrivning utan fråga.

## ☠️ Färgsyskonets länk gick bara åt ETT håll

Uppgift #480 säger att länken inom ett färgpar går åt **båda** håll.
`7bdc47b8` (ljusgrå) fick sin länk till den publicerade mörkgrå sidan i
Steg 7. Den mörkgrå sidan mätt mot skarpa Wix:

```
klostrad-takspant-240-260-cm   revision 5   visible: true
barLjusgratt: false            "Passar inte det här?" → (ingen korslänkssektion)
```

Den hade alltså **ingen korslänkssektion alls** — inte bara en saknad rad.
Det är den redan indexerade sidan som kan skicka vidare till den
nypublicerade, så envägsriktningen var fel väg.

**Lagat**: samma rubrik och samma ingress som rundans egna sidor, färgsyskonet
först, byggt i `korslank-mork.py` och skrivet till revision 6.

Tre saker som gjorde skrivningen ofarlig, och ingen av dem är "jag var noggrann":

1. ☠️ **Blocket infogas FÖRE första flikrubriken.** Butikens `splitFlikar`
   lägger allt efter en matchande rubrik i den fliken, ända fram till nästa
   match — ett block mellan `Tekniska specifikationer` och `Vanliga frågor`
   hade hamnat INNE i spec-tabellen. Runda 120 mätte det på åtta sidor.
2. ☠️ **De 3 730 tecknen skrevs aldrig av för hand.** Anropet läser sidans
   egen lagrade text, kontrollerar dess hash mot filens facit, och infogar
   blocket. Bara de 402 tecknen i blocket passerar chatten. Batch 64 mätte
   9 fel mot 0 på exakt den skillnaden, och den här rundan gjorde om samma
   misstag i Steg 9 med två påhittade fil-id.
3. **Grinden mutationstestades innan den godkände något.** Sju mutationer,
   sju rätt gren: tal i ankartext, block efter flikrubriken, text utanför
   blocket ändrad, dubblerad flikrubrik, kyrillisk homoglyf, artikelnummer,
   och en länk till sidan själv.

Kvitto — och det krävde `wix_normalisera`, inte en rå jämförelse:

| | |
|---|--:|
| källa i filen | 4 132 tecken |
| `G.wix_normalisera(källa)` | **4 177**, hash `682443076` |
| Wix lagrade | **4 177**, hash `682443076` |
| revision | 5 → **6**, `visible: true` oförändrat |

⚠️ Ett LÄNGDTAL hade inte dugt: `stammer_med_facit` sa `false` på första
läsningen, och det var normaliseringen (`<strong>` → `<span style=…>`,
`<li>` → `<li><p>`, `target="_self"`) — inte ett fel. Det är just därför
regeln bor i `grindar.wix_normalisera` i stället för i varje rundas huvud.
