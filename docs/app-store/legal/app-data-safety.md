# Google Play – Data Safety Form

**Senast uppdaterad: 2 juni 2026**

Detta dokument sammanställer Fyndplats-appens datainsamling i det format som
Google Play Console kräver under **App content → Data safety**. Fyll i konsolen
fält för fält enligt tabellerna nedan.

Privacy policy URL att ange i formuläret:
<https://www.fyndplats.se/integritetspolicy-app>

## Översikt (sammanfattningsfrågor)

| Fråga i konsolen | Svar |
|---|---|
| Samlar eller delar appen användardata? | **Ja** |
| Krypteras data vid överföring (in transit)? | **Ja** (HTTPS/TLS) |
| Kan användare begära att data raderas? | **Ja** (i appen + via info@fyndplats.com) |
| Har appen genomgått oberoende säkerhetsgranskning? | Nej |
| Är appen riktad till barn? | **Nej** (ej under 13) |

## Datatyper – detaljerad mappning

Kolumnerna matchar Googles formulär: **Collected** (samlas in), **Shared**
(delas med tredjepart), **Krävs/Valfritt**, **Ändamål** och **Raderbar**.

### Personlig information

| Datatyp | Collected | Shared | Krävs för funktion | Ändamål | Användare kan radera |
|---|---|---|---|---|---|
| **E-postadress** | Ja | Nej | Valfritt (krävs för konto) | Konto, kundtjänst | Ja |
| **Namn** | Ja | Ja (Klarna, Resend) | Krävs vid köp | Order & leverans, mail | Ja |
| **Fysisk adress** | Ja | Ja (Klarna, fraktpartner) | Krävs vid köp | Leverans | Ja |
| **Telefonnummer** | Ja | Ja (Klarna) | Krävs vid köp | Order, leveransavisering | Ja |

### Finansiell information

| Datatyp | Collected | Shared | Krävs för funktion | Ändamål | Användare kan radera |
|---|---|---|---|---|---|
| **Köphistorik** | Ja | Nej | Krävs vid köp | Visa orderhistorik & status | Ja |
| **Betalningsinformation** | Nej (hanteras av Klarna) | — | — | Betalning sker hos Klarna | — |

> Betalkort-/faktureringsuppgifter samlas **aldrig** in eller lagras av
> Fyndplats – de hanteras direkt av Klarna i den hostade kassan.

### App-aktivitet

| Datatyp | Collected | Shared | Krävs för funktion | Ändamål | Användare kan radera |
|---|---|---|---|---|---|
| **App-interaktioner** (sid-/produktvisningar, köp) | Ja | Ja (Meta – endast vid samtycke) | Valfritt | Analys, annonsmätning | Ja |
| **Sökhistorik i appen** | Nej | — | — | — | — |

### App-information och prestanda

| Datatyp | Collected | Shared | Krävs för funktion | Ändamål | Användare kan radera |
|---|---|---|---|---|---|
| **Kraschloggar** | Ja | Nej | — | Stabilitet, felsökning | N/A (ej kopplat till identitet) |
| **Diagnostik / prestanda** | Ja | Nej | — | Förbättra appen | N/A |

### Enhets- eller andra ID:n

| Datatyp | Collected | Shared | Krävs för funktion | Ändamål | Användare kan radera |
|---|---|---|---|---|---|
| **Enhets-/annons-ID** | Ja – **endast vid ATT-/cookiesamtycke** | Ja (Meta) | Valfritt | Annonsmätning | Ja (återkalla samtycke) |
| **Push-token** | Ja (om notiser tillåts) | Nej | Valfritt | Order-/restock-notiser | Ja |

## Syften (Purposes) – så som de markeras i Google

- **App functionality** – konto, kundvagn, order, leverans.
- **Analytics** – app-aktivitet, krasch/prestanda.
- **Advertising or marketing** – Meta-händelser, **endast vid samtycke**.
- **Account management** – e-post, profil.

Inga datatyper används för **kreditvärdering** eller säljs vidare till
datamäklare.

## Datadelning – sammanfattning av tredjeparter

| Tredjepart | Delad data | Grund |
|---|---|---|
| Klarna | Namn, adress, telefon, ordersumma | Genomföra betalning (egen pers.ansvarig) |
| Resend | Namn, e-post, orderinfo | Skicka transaktionsmail (biträde) |
| Meta | Hashad e-post/telefon, händelsedata | Annonsmätning – endast vid samtycke |
| Wix | Konto-, order-, produktdata | Backend/lagring (biträde) |
