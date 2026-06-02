# Pris & affärsmodell

## Pris

| | |
|---|---|
| App-pris | **Gratis** (Free) |
| In-App Purchases (IAP) | **Inga** |
| Prenumerationer | **Inga** |
| Annonser | **Inga** |

Fyndplats är en e-handelsapp — själva appen är gratis att ladda ner och använda.
Intäkterna kommer från försäljning av **fysiska varor**, inte från app-priset.

## Betalning sker utanför App Store/Play Billing

Köp av varor genomförs med **Klarna** i den Wix-hostade kassan
(`checkout.fyndplats.se`), utanför Apples och Googles betalsystem.

- **Apple:** Detta är tillåtet och korrekt. Apples regel 3.1.3(e) /
  3.1.5(a) säger att försäljning av **fysiska varor och tjänster** *ska* ske via
  annan betalmetod än In-App Purchase. Vi använder alltså avsiktligt **inte** IAP.
- **Google:** Google Play Billing krävs endast för **digitalt** innehåll. Fysiska
  varor får och ska säljas via annan betallösning (Klarna).
- I klassificeringsformuläret svarar vi därför **Nej** på "köp i appen" — se
  [`rating-questionnaire.md`](rating-questionnaire.md).

## Tillgänglighet

- **Territorier:** Sverige (primär marknad). Utöka vid behov i respektive konsol.
- Engelsk store-listning finns förberedd ([`release-notes-en.md`](release-notes-en.md))
  om listningen ska visas i fler länder.

## Anteckningar

- Pris och tillgänglighet sätts i App Store Connect (*Pricing and Availability*)
  respektive Play Console (*Pricing*), inte i kod.
- Eftersom appen är gratis och saknar IAP krävs **inget** Paid Apps-avtal hos
  Apple — men ett aktivt Apple Developer Program-medlemskap (USD 99/år) och ett
  Google Play Developer-konto (engångs-USD 25) krävs ändå för att publicera.
