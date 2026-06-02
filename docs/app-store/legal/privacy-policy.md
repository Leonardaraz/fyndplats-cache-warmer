# Integritetspolicy – Fyndplats-appen

**Senast uppdaterad: 2 juni 2026**

Denna integritetspolicy beskriver hur **Fyndplats** ("vi", "oss") samlar in,
använder och skyddar dina personuppgifter när du använder Fyndplats-appen för
iOS och Android. Policyn kompletterar vår allmänna [sekretesspolicy](https://www.fyndplats.se/sekretesspolicy)
för webbplatsen och är anpassad efter kraven i Apple App Store och Google Play.

Webbversion: <https://www.fyndplats.se/integritetspolicy-app>

## Personuppgiftsansvarig

**Fyndplats**
Bergviksgatan 10, 152 44 Södertälje, Sverige
Org.nr: 199509144037
E-post: <info@fyndplats.com>

Fyndplats är personuppgiftsansvarig för behandlingen av dina personuppgifter och
ansvarar för att behandlingen sker enligt EU:s dataskyddsförordning (GDPR).

## Vilka uppgifter samlar appen in?

| Uppgift | När den samlas in | Ändamål |
|---|---|---|
| **E-postadress** | När du loggar in / skapar konto | Identifiera dig, koppla din orderhistorik, kundtjänst |
| **Namn, leverans- och fakturaadress, telefonnummer** | Vid beställning | Fullgöra och leverera din order |
| **Orderhistorik** | När du genomför köp (lagras i Wix Data) | Visa dina tidigare köp och orderstatus i appen |
| **Spårningsdata (Meta Pixel)** | Endast om du godkänner ATT-prompten (iOS) och cookie-/datasamtycke | Mäta annonseffekt och visa relevanta annonser på Meta-plattformar |
| **App-aktivitet** (sidvisningar, produktvisningar, köp) | Vid användning | Analys och förbättring av appen |
| **Krasch- och prestandadata** | Automatiskt vid fel | Stabilitet och felsökning (ej kopplat till din identitet) |
| **Push-token** | Om du tillåter notiser | Skicka order- och restock-notiser |

Vi samlar **inte** in din exakta platsdata, dina kontakter eller din enhets
fotobibliotek.

## Hur och var lagras dina uppgifter?

- **Wix Data** – kund-, order- och produktdata lagras hos vår backend-leverantör
  Wix.
- **Vercel** – appens API-anrop går via servrar hostade på Vercel.
- **Resend** – transaktions- och marknadsföringsmejl skickas via Resend.
- **Lokalt på din enhet** – kundvagn lagras i `AsyncStorage`; inloggnings-token
  (JWT) lagras krypterat i `SecureStore` (iOS Keychain / Android Keystore).

Vi strävar efter att behandla uppgifter inom EU/EES. Sker överföring utanför
EU/EES säkerställer vi laglig grund, t.ex. via EU-kommissionens
standardavtalsklausuler.

## Tredjeparter vi delar uppgifter med

| Part | Roll | Vad delas |
|---|---|---|
| **Klarna** | Betalleverantör (egen personuppgiftsansvarig) | Betalnings- och orderuppgifter vid köp |
| **Wix** | Backend / datalagring (personuppgiftsbiträde) | Konto-, order- och produktdata |
| **Meta** (Facebook/Instagram) | Annonsering – **endast vid samtycke** | Hashad e-post/telefon, händelsedata (Pixel + Conversions API) |
| **Resend** | E-postutskick (personuppgiftsbiträde) | Namn, e-post, orderinformation |
| **Google Analytics (GA4)** | Trafikanalys för webbplatsen | Pseudonymiserad användningsdata |

Leverantörer som behandlar uppgifter för vår räkning är personuppgiftsbiträden
med biträdesavtal som säkerställer säker behandling enligt våra instruktioner.

## iOS App Tracking Transparency (ATT)

På iOS visar appen en **App Tracking Transparency-prompt** innan någon
spårning sker. Meta Pixel och Conversions API aktiveras **endast** om du
uttryckligen godkänner prompten. Avböjer du sker ingen annons­spårning – appen
fungerar oförändrat i övrigt. Du kan när som helst ändra valet under
*Inställningar → Integritet & säkerhet → Spårning* på din iPhone.

## Cookies och lokal lagring i appen

- **AsyncStorage** – sparar din kundvagn lokalt så den finns kvar mellan sessioner.
- **SecureStore** – lagrar din inloggnings-JWT krypterat på enheten.
- **Webview-cookies** – Wix-hostade kassan (`checkout.fyndplats.se`) använder
  nödvändiga cookies för att genomföra betalning. Marknadsförings- och
  analyscookies aktiveras endast vid samtycke.

## Barn

Fyndplats-appen är **inte riktad till barn under 13 år**. Vi samlar inte
medvetet in personuppgifter från barn under 13. Om du tror att ett barn lämnat
uppgifter till oss, kontakta <info@fyndplats.com> så raderar vi dem.

## Dina rättigheter (GDPR)

Du har rätt till:

- **Tillgång** – begära ett registerutdrag över de uppgifter vi har om dig.
- **Rättelse** – få felaktiga uppgifter korrigerade.
- **Radering** – få dina uppgifter raderade ("rätten att bli bortglömd").
- **Begränsning** och **invändning** mot behandling som sker med stöd av
  berättigat intresse, samt mot direktmarknadsföring.
- **Dataportabilitet** – få ut dina uppgifter i ett maskinläsbart format.
- **Återkalla samtycke** när som helst, där behandlingen grundar sig på samtycke.

Kontakta <info@fyndplats.com> för att utöva dina rättigheter. Du kan också radera
ditt konto direkt i appen, vilket tar bort din profil och kopplade uppgifter
(orderdata kan behållas så länge bokföringslagen kräver, upp till sju år).

Anser du att vi behandlar dina uppgifter felaktigt har du rätt att klaga till
**Integritetsskyddsmyndigheten (IMY)**, <https://www.imy.se>.

## Ändringar

Vi kan komma att uppdatera denna policy. Den senaste versionen finns alltid på
<https://www.fyndplats.se/integritetspolicy-app>. Vid väsentliga ändringar
informerar vi i appen.

## Kontakt

Fyndplats
Bergviksgatan 10, 152 44 Södertälje, Sverige
E-post: <info@fyndplats.com>
