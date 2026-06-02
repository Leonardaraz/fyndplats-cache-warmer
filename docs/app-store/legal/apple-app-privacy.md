# Apple App Store – App Privacy ("Nutrition Label")

**Senast uppdaterad: 2 juni 2026**

Detta dokument sammanställer Fyndplats-appens datainsamling i det format som
**App Store Connect → App Privacy** kräver. Fyll i panelen sektion för sektion
enligt nedan.

Privacy policy URL att ange:
<https://www.fyndplats.se/integritetspolicy-app>

## Sammanfattning

| Apple-sektion | Status |
|---|---|
| Data Used to Track You | **Yes** (Meta Pixel – endast om användaren godkänner ATT) |
| Data Linked to You | **Yes** |
| Data Not Linked to You | **Yes** |

---

## 1. Data Used to Track You

> "Tracking" enligt Apple = att koppla samman användar-/enhetsdata med data från
> andra appar/sajter för riktad annonsering eller delning med datamäklare.

Spårning sker **endast** om användaren godkänner **App Tracking Transparency
(ATT)**-prompten. Markeras därför som *Used for Tracking*:

| Data Type | Kategori | Villkor |
|---|---|---|
| Purchase History | Purchases | Endast vid ATT-samtycke (Meta Pixel/CAPI) |
| Product Interaction | Usage Data | Endast vid ATT-samtycke |
| Device ID / Advertising Data | Identifiers | Endast vid ATT-samtycke |
| Email Address (hashad) | Contact Info | Endast vid ATT-samtycke (CAPI-matchning) |

Avböjer användaren ATT sker **ingen** spårning och dessa datatyper skickas inte
till Meta.

---

## 2. Data Linked to You

Data kopplad till användarens identitet (konto/order):

| Apple Data Type | Exempel | Purpose |
|---|---|---|
| **Email Address** | Inloggning, konto | App Functionality, Account Management |
| **Name** | Beställning | App Functionality |
| **Physical Address** | Leveransadress | App Functionality |
| **Phone Number** | Beställning, leverans | App Functionality |
| **Purchase History** | Orderhistorik | App Functionality, (Analytics/Advertising vid samtycke) |
| **Product Interaction** | Sid-/produktvisningar, köp | Analytics, (Advertising vid samtycke) |

Purposes som markeras: **App Functionality**, **Analytics**, och **Product
Personalization / Third-Party Advertising** (de två sista endast vid samtycke).

---

## 3. Data Not Linked to You

Data som inte kopplas till användarens identitet:

| Apple Data Type | Exempel | Purpose |
|---|---|---|
| **Crash Data** | Kraschloggar | App Functionality / Diagnostics |
| **Performance Data** | Latens, prestandamått | Diagnostics |
| **Other Diagnostic Data** | Felsökningslogg | Diagnostics |

---

## Frågor Apple ställer per datatyp (mall)

För varje datatyp ovan, svara i App Store Connect:

1. **Do you collect this data?** → Ja för listade typer.
2. **Is it linked to the user's identity?** → Enligt sektion 2 vs 3.
3. **Is it used for tracking?** → Endast typerna i sektion 1, och endast vid
   ATT-samtycke.
4. **Purposes?** → Enligt tabellerna (App Functionality / Analytics /
   Advertising / Product Personalization).

## Viktigt om ATT

Eftersom Meta-spårning är consent-gated bakom ATT **måste** appen visa
`ATTrackingManager`-prompten innan någon spårningssignal skickas. Se
[`consent-flow.md`](consent-flow.md) för exakt prompt-text och flöde. Saknas
ATT-prompten samtidigt som "Used for Tracking" är ifyllt → avslag vid Apples
granskning.
