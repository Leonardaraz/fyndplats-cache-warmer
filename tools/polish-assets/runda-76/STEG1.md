# Runda 76, Steg 1 — familjen, svepet och dubblettgrinden

## Svepet är komplett, och det är kvittot som räknas

| | |
|---|--:|
| Produkter i katalogen | **5 502** |
| Publicerade | **2 032** |
| `avhuggen` (markören kvar) | **false** |
| Kontorsstolar, publicerade | **49** |
| Kontorsstolar, utkast | **184** |

☠️ Svepet kördes i två etapper om ≤30 sidor och markören skickades vidare.
Kvittot är `avhuggen: false`, inte radantalet — 30 × 100 är precis taket, och
en avhuggen läsning ser exakt likadan ut som en färdig.

⚠️ **49 publicerade, inte 37.** Den gamla siffran i `FORDELNING.md` räknade
bara `kontorsstol`-slugar. Svepet här tar också `snurrstol`, `gamingstol`,
`arbetsstol` och `skrivbordsstol` — och sju av de 49 är runda 75:s egna.

## ☠️ Måttet i utkastet är PAKETET om man tar första trippeln

Första försöket plockade `52 × 50 × 23 cm` som "produktmått" för en kontors-
stol. Ingen stol är 23 cm hög. Orsaken står i den tyska texten:

```
✔ Gesamtabmessungen: 74L x 65B x 120-128H cm     ← produkten
…
Paketmått: 86 × 38 × 65 cm                        ← förpackningen
```

Produktmåttet skrivs med **`x` och L/B/H-suffix mellan talen**; paketmåttet
med ett riktigt `×`. En regex som söker "första trippeln med ×" träffar
alltså ALLTID förpackningen, och gör det tyst. Extraktorn ankras nu på
etiketten `Gesamtabmessungen`.

Det är tredje gången paketmåttet lurar den här familjen: runda 74 tog det för
en modellsignatur (falsk positiv), runda 75 jämförde det mot publicerade
sidors produktmått (falsk negativ), och här läste det sig in som produktmått.
**Paketmåttet duger till precis ingenting i dubblettgrinden.**

## ⚠️ `PLAIN_DESCRIPTION` måste begäras — annars är beskrivningen TOM

En `GET /products/{id}` utan projektion returnerar **ingen** `plainDescription`
alls. Första måttkörningen svarade därför "(ingen Mått-rad)" på alla 26
publicerade sidorna — inte ett fel, bara en tystare projektion, precis som
`getProductMedia` och `MEDIA_ITEMS_INFO`. Giltiga namn är `DESCRIPTION`,
`PLAIN_DESCRIPTION`, `INFO_SECTION`, `MEDIA_ITEMS_INFO`,
`VARIANT_OPTION_CHOICE_NAMES`, `BREADCRUMBS_INFO`, `MERCHANT_DATA`;
`INFO_SECTIONS`, `DESCRIPTION_INFO` och `CATEGORY_IDS` avvisas med 400.

## Dubblettgrinden: tjugo utkast mätta mot 47 publicerade

Massage- och värmemodellerna är medvetet uteslutna ur urvalet — de kräver en
egen Steg 2-grind (el + hälsopåståenden) som inte är körd.

| kandidatmått | antal | närmaste publicerade | dom |
|---|--:|---|---|
| **74 × 65 × 120–128** | 2 | inget inom ±5 cm | ✅ **REN — grupp D** |
| **56 × 61 × 76–86** | 3 | inget inom ±5 cm | ✅ **REN — grupp F** |
| **55 × 48 × 82,5–94,5** | 3 | ±5: `armlos-skrivbordsstol-ljusbla` (53 × 43 × 85–93) | ✅ **REN vid ±2 — grupp E** |
| 53 × 59,5 × 81–89 | 2 | ±5: `skrivbordsstol-teddyfleece-bjornoron` | ⏭ sparas |
| 52 × 59 × 75,5–84,5 | 2 | ±5: `snurrstol-bojtra-svart-pu` (52 × 54 × 74–84) | ⏭ sparas |
| 45 × 56 × 78–88 | 2 | ±5: `skrivbordsstol-teddyfleece-bjornoron` | ⏭ sparas |
| 65 × 65 × 84–94 | 2 | ±5: `kontorsstol-bred-sits` (62 × 67 × 83–93) | ⏭ sparas |
| 60 × 61 × 104,5–121,5 | 2 | ±5: `kontorsstol-mesh` (58 × 61 × 102–119) | ⏭ sparas |
| ☠️ **64 × 63 × 115–125** | 2 | **±2: `gamingstol-rosa-lutning-150` OCH `gamingstol-med-fotstod-kattoron`** | ☠️ **VÄGRAS** |

**Rundan blir grupp D + E + F = åtta produkter**, alla färgsyskon inom sin
modell. Samma form som runda 75: 2 + 3 + 3.

☠️ **Paret på 64 × 63 × 115–125 tas inte.** Två publicerade gamingstolar
ligger inom ±2 cm på alla tre axlar, och runbokens egen dom i det läget är
att bilderna får avgöra — inte att man chansar. De lämnas till en runda som
gör den granskningen ordentligt.

## ⚠️ Fynd i grinden: två PUBLICERADE sidor delar mått exakt

| | |
|---|---|
| `e1a46c56` | `kontorsstol-utdragbart-fotstod-140-grader` — 65 × 67 × 111–119 |
| `494da920` | `kontorsstol-med-fotstod` — 65 × 67 × 111–119 |

Båda ligger live, båda beskriver utdragbart fotstöd och 140° ryggläge, och
måtten stämmer på alla tre axlarna. Runbooken har redan noterat att
`e1a46c56` matchade `kontorsstol-med-fotstod` "på alla fem tal inklusive
vilomåtten" — men noteringen står som ett fångat kandidatfall, och båda
sidorna är ändå publicerade. Det är precis den interna dubbletten Google
straffar. **Rapporterat som eget ärende, inte åtgärdat i den här rundan.**

## Sökordskrock

De 49 publicerade delar redan huvudorden `kontorsstol`, `snurrstol`,
`gamingstol`, `arbetsstol` och `skrivbordsstol`. Varje ny sida måste därför
bära en kvalificerare i **namn, slug OCH titel** — färgen räcker inte ensam
när femtio sidor konkurrerar. Vinklarna sätts i Steg 7 mot modellens
egenskap: fotstöd (D), kompakt utan armstöd (E), lågsittande (F).
