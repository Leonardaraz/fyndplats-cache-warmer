# Åldersgräns & innehållsklassificering (IARC)

Båda butikerna kräver att du fyller i ett innehållsfrågeformulär som genererar en
åldersgräns. Google Play och flera regioner använder **IARC**; Apple har sitt
eget formulär i App Store Connect. Svaren nedan gäller för Fyndplats e-handelsapp.

## Sammanfattning av svar

| Fråga | Svar |
|---|---|
| Vuxet/sexuellt innehåll | **Nej** |
| Våld (tecknat eller realistiskt) | **Nej** |
| Skräck / skrämmande innehåll | **Nej** |
| Svordomar / grovt språk | **Nej** |
| Alkohol, tobak, droger | **Nej** (säljs ej, refereras ej) |
| Hasardspel / gambling (simulerat eller riktigt) | **Nej** |
| Användargenererat innehåll / obegränsad webb | **Nej** |
| Delar användarens position | Nej (ingen platsbaserad funktion krävs) |
| Köp i appen (In-App Purchases / IAP) | **Nej** – se not nedan |
| Oövervakad social interaktion (chatt) | **Nej** |

## Förväntad rating

| Butik | Förväntad åldersgräns |
|---|---|
| Apple App Store | **4+** |
| Google Play (IARC) | **All Ages / 3+** (PEGI 3, ESRB Everyone) |

## Viktigt: Klarna är inte "In-App Purchase"

Frågeformulären frågar om **In-App Purchases** i Apples/Googles mening, dvs.
digitala varor köpta via Apples/Googles betalsystem (StoreKit / Google Play
Billing). Fyndplats säljer **fysiska varor** som betalas via **Klarna** i den
Wix-hostade kassan — det är *fysisk handel via tredjepartsbetalning*, inte IAP.

- Svara **Nej** på "Innehåller appen köp i appen?" i klassificeringsformuläret.
- Detta är skilt från Apples regel 3.1.3(e)/3.1.5: försäljning av fysiska varor
  och tjänster **ska** ske utanför IAP, vilket vi gör. Se
  [`app-store-pricing.md`](app-store-pricing.md) för betalnings-/IAP-detaljer.

## Anteckningar

- Klassificeringen fylls i per butik (App Store Connect → *App Information → Age
  Rating*; Play Console → *Content rating*). Den genereras av svaren, sätts inte
  manuellt.
- Om appen i framtiden lägger till t.ex. användarrecensioner med fritext eller
  chatt måste formuläret fyllas i på nytt — det kan höja åldersgränsen.
