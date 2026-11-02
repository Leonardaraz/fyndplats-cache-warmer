### Postnummer dit Aosom inte levererar (2026-10-26)

Leonards lista: 10005, 13025, 13033, 13034, 13036, 13038, 13039, 13042, 13043,
13055, 13056, 37022, 43080–43099, 45204–45205, 47112–47115, 47500–47599,
62000–62999, 74296–74297, 76017–76019 och 91803. Där ska Aosom-varor inte gå att
beställa. Listan bor i `lib/aosom/postnummer-sparr.ts`, och ett test fäller om
koden glider från den. Varor från andra leverantörer rörs inte.

☠️ **Wix fraktinställningar kan inte spärra ett postnummer.** Delivery Profiles
tar bara land och län (mätt mot API-schemat samma dag), och adressen skrivs in i
Wix egen kassa. Spärren sitter därför på tre ställen:

| var | vad som händer |
|---|---|
| kassan, `/api/wix-validering/v1/get-violations` | Wix tillägg Ecom Validations frågar motorn, och en Aosom-vara till ett spärrat postnummer stoppar köpet med ett felmeddelande (`lib/aosom/kassa-validering.ts`) |
| ordern, `/api/wix-order` | en order som ändå kommer in larmar `OPS_ALERT_EMAIL` och skriver en audit-rad, en gång per order |
| bulkordern | raderna hålls i `hoppadeOver` med skälet och skickas aldrig till Aosom |

Tre egenskaper som inte ska tas bort:

1. ☠️ **Kassan släpper igenom köpet vid fel, efter tre sekunder och när anropet
   inte går att verifiera.** Rutten svarar alltid 200, aldrig en felkod. Wix
   dokumentation säger inte vad kassan gör med ett felsvar, och en databas som
   hackar eller en fel nyckel får inte stänga kassan för alla kunder. Det som
   slinker igenom fångas av larmet och av bulkordern.
2. ☠️ **Svaret bär EN överträdelse med målet `other`**, den form Wix
   dokumentation visar i alla exempel. En form Wix inte känner igen hade gjort att
   spärren tyst uteblev.
3. ☠️ **Anropet är ett JWT signerat med Fyndplats kassas nyckel, och `aud` ska
   vara appens id.** Båda står i `lib/wix/fyndplats-kassa.ts`, eftersom nyckeln
   är publik (appens panel: Home → … → View ID & keys → Public key). Varje
   Wix-app har en egen nyckel, så orderwebhookens nyckel
   (`WIX_WEBHOOK_PUBLIC_KEY`) verifierar inte kassans anrop och provas inte.
   Byter Wix nyckeln läggs den nya i `WIX_VALIDERING_PUBLIC_KEY` (flera PEM går
   bra), som provas efter den i koden. Raden `[wix-validering] ogiltig
   signatur` i Vercels logg betyder att det behövs. Appens hemliga nyckel (App
   Secret Key) används inte av motorn och hör inte hemma i repot.

⚠️ **Tillägget sitter på appen Fyndplats kassa** (`97c377e3-…`), Wix CLI-appen
som bär kassans trygghetsblock och är installerad på butiken: Anpassade appar →
Fyndplats kassa → Extensions → Ecom Validations "Postnummerspärr Aosom", med
`deploymentUri` `https://fyndplats-cache-warmer.vercel.app/api/wix-validering`.
Wix lägger själv till `/v1/get-violations`. Ett utkast av tillägget ligger också
på My New App-4 (2026-10-27). Den appen är inte installerad på butiken, så
utkastet gör ingenting, men släpp inte en version av den för tilläggets skull.
Larmet och bulkorderns spärr gäller oavsett tillägget.

☠️ **Ett tillägg gäller först när appen släppts i en ny version och butiken
uppdaterats.** Tillägget krävde en major-version (2.0, släppt 2026-10-27):
Distribute → Release Version, sedan Hantera appar → Fyndplats kassa →
Uppdatera på butiken. Wix frågade då om trygghetsblocket skulle ersättas av den
nya versionens. Svaret är Ersätt, för det är samma block.

⚠️ **Appen är en CLI-app, och tillägget finns bara i appens panel.** Det är
inte prövat om en release med `wix app release` från CLI-projektet behåller ett
tillägg som projektet inte känner till. Kontrollera att Ecom Validations finns
kvar under Extensions efter en sådan release.

☠️ **Spara tillägget först när rutten svarar i produktion.** `deploymentUri`
pekar på produktionen, och före deployen svarar adressen 404 på varje kassa.

**Verifierat i drift 2026-10-27**, efter deployen av #775 (03:49 UTC). Tre
provkassor skapades via Wix API (Create Checkout, utan e-post och utan order):

| kassa | överträdelser före #775 | efter #775 |
|---|--:|--:|
| Aosom-vara till 621 52 | 0 | **1** (`ERROR`) |
| samma vara till 111 22 | 0 | 0 |
| AliExpress-vara till 621 52 | 0 | 0 |

Överträdelsen bar husets text ("Vi kan tyvärr inte leverera … till postnummer
621 52. Ta bort varan ur kundvagnen eller välj en annan leveransadress.").
Mätningen före #775 gjordes med version 2.0 installerad på butiken. Då provade
rutten orderwebhookens nyckel, och varje anrop föll på signaturen. Överträdelsen
står redan i svaret på Create Checkout, så Wix frågar tillägget också för en
kassa som skapas via API. Kassasidan i webbläsaren är inte mätt.
