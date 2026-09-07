# Runda 99 — läget

**Alla sju är LIVE, köpbara, kategoriserade och stämplade.**
Foderstationsfamiljen är därmed slut: 26 utkast, fyra modeller, tre rundor.

| id8 | slug | pris | SKU | bilder |
|---|---|--:|---|--:|
| `8c1d08c5` | `matskap-hund-36-cm-lada-21-liter-gratt` | 929 | `FP-matskap-36-lada-gra` | 6 |
| `3710a0c3` | `matskap-hund-36-cm-lada-21-liter-brunt` | 959 | `FP-matskap-36-lada-brun` | 6 |
| `5eb270ed` | `matskap-hund-36-cm-lada-21-liter-svart` | 969 | `FP-matskap-36-lada-svart` | 6 |
| `31d6a3df` | `matskap-hund-36-cm-lada-21-liter-vitt` | 999 | `FP-matskap-36-lada-vit` | 5 |
| `a8e376e7` | `matstation-hund-41-cm-lyftbar-skiva-vitt` | 799 | `FP-matstation-41-vit` | 6 |
| `5d7aab1b` | `matstation-hund-41-cm-lyftbar-skiva-gratt` | 899 | `FP-matstation-41-gra` | 5 |
| `edd89684` | `matstation-hund-41-cm-lyftbar-skiva-brunt` | 899 | `FP-matstation-41-brun` | 5 |

## Kvitton

| vad | utfall |
|---|---|
| `lint.py` | **49/49 självtest, 0 brister** |
| transkription | hash-exakt på alla sju, läst i ett EGET anrop efter skrivningen |
| live-grind | **varje mening ur den lokala källan står ordagrant på sidan** |
| korslänkar | 9 av 9 på varje sida, ingen självlänk i brödtexten |
| bilder | 12 uppladdade, alla `200`, alla `1.0000` mot lokalfilen (`fit`, aldrig `fill`) |
| galleri | rätt antal och ordning, 0 utan alt-text, 0 tyska |
| kategorier | 14 av 14 kopplingar, noll fel |
| stämpling | 7 av 7 workflow-körningar `success` |
| köpbarhet | 7 av 7: produkt synlig, variant synlig, rätt SKU, rätt pris, i lager |

Live-grinden fällde bara på `Skickas från` — det är butikens EGEN EU-lager-ribbon
(`Skickas från EU-lager – ingen importtull…`), alltså den sanktionerade platsen.
Landgrinden är två regler, och den samlade formen fäller korrekta sidor
(runbokens lärdom 2026-09-05). LandsNAMN: noll träffar.

## Vad som kostade tid, och vad som stoppade det

☠️ **SKU-skrivningen PUBLICERADE alla sju utkasten.** En `variantsInfo`-PATCH
publicerar, och Steg 8 gör exakt det anropet. Sidorna låg live med rätt text men
leverantörens tyska bildset i ~4 minuter innan de sattes tillbaka. Runboken har
fått vakten: skicka `visible` uttryckligen i Steg 8, med variantens `visible:true`
i samma anrop så kaskaden inte gör produkten oköpbar.

☠️ **Variantens `media` går inte att skriva alls.** Runda 98 mätte att den inte gick
att reparera. Här ekades hela mediaobjektet tillbaka på sju produkter som ALLA hade
det kvar — och alla sju fick `null`. Det är fältets beteende, inte en
reparationsgräns. Kundeffekt noll på en envariantsprodukt utan val.

✅ **Grindarna betalade sig innan något nådde Wix.** Regel 4 fällde MIN EGEN ingress:
jag hade skrivit "Under den ligger hela lådan öppen" på modell D, som inte har någon
låda. Regel 7 fällde `Vi anger inget invändigt mått` — ett FÖRNEKANDE, inte ett
påstående — och den träffen byggde `positiv()`, som nu delas av båda reglerna.
Och regel 6 var först uppfylld av spec-tabellen den skulle bevaka; den mäter prosan
sedan dess, för en regel som läser sin egen källa fäller aldrig.

## Öppet efter rundan

- ⚠️ Runda 98:s fem kapade måttritningar ligger publicerade i **liggande** format och
  tappar sina sidoetiketter i PDP:ns centrumbeskärning. Uppmätt, inte lagat.
- ⚠️ `31d6a3df` bär PawHut-logotypen fysiskt på lådfronten. Leonards regel: den
  stannar, och den nämns aldrig i text eller alt-text.
- ⚠️ `5d7aab1b`:s färg är en dov grågrön i leverantörens studiobild och kaki i
  miljöbilden. Publicerad som `grå`, den konservativa läsningen.
