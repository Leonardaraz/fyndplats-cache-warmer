# Fyndplats — Velo-kod för automatiska triggade mejl

Den här mappen innehåller färdig Velo-kod som triggar de två 0-skickade
mejlen automatiskt:

- **"Ditt paket är på väg!"** (`VKnRVoH`) → skickas när du markerar en order
  som skickad i Wix Stores.
- **"Ditt paket är framme!"** (`VKnSIqs`) → skickas när 17TRACK pingar en
  webhook med leveransstatus = DELIVERED.

## Snabb installation (10 min)

1. **Öppna Fyndplats i Wix Editor / Studio**
   (Wix Dashboard → klicka på `Edit Site`)

2. **Aktivera Velo** om det inte är på:
   `Dev Mode` (övre menyn) → `Turn On Dev Mode` / `Enable Velo`.

3. **Klistra in `backend/events.js`:**
   - Vänster meny: `Code Files` (eller `</>`) → `Backend`
   - Skapa fil: `events.js` (skippa om den finns — då slå ihop innehållet)
   - Klistra in HELA innehållet från `wix-velo/backend/events.js`

4. **Klistra in `backend/http-functions.js`:**
   - Samma plats: `Code Files → Backend`
   - Skapa fil: `http-functions.js` (skippa om den finns — slå ihop)
   - Klistra in HELA innehållet från `wix-velo/backend/http-functions.js`

5. **Lägg till en hemlighet för "Framme"-webhooken:**
   - Dashboard → `Developer Tools` → `Secrets Manager` → `+ Add Secret`
   - Namn: `DELIVERED_WEBHOOK_SECRET`
   - Värde: en lång slumpsträng (t.ex. öppna terminal och skriv
     `openssl rand -hex 32` eller använd 1Password). Kopiera värdet — du
     behöver det till 17TRACK i steg 8.

6. **Publish** (uppe till höger).

7. **Testa "Ditt paket är på väg!"-flödet:**
   - Lägg en testorder på Fyndplats (köp en billig produkt).
   - Gå till `Wix Stores → Orders` → öppna ordern.
   - Klicka `Mark as fulfilled` (lägg gärna in ett spårningsnummer).
   - Inom 1–2 minuter ska mejlet komma till köparens adress.
   - Verifiera även i Dashboard → `Developer Tools → Triggered Emails` att
     siffran för "Ditt paket är på väg!" ökat från 0 till 1.

8. **Wire upp "Ditt paket är framme!" mot 17TRACK:**
   - Logga in på 17TRACK Dashboard
   - `Settings → Notifications → Webhook` (eller liknande beroende på
     17TRACK-plan)
   - URL:
     ```
     https://www.fyndplats.se/_functions/delivered?secret=<DIN_SECRET>
     ```
   - Method: POST
   - Trigger on: DELIVERED
   - Body / payload: ska minst innehålla `contactId` och `orderNumber`.
     Hur du mappar fälten i 17TRACK beror på hur du registrerar paket där —
     vanligtvis stoppar du in metadata vid registrering så 17TRACK kan
     skicka tillbaka samma fält när det levereras.
   - Spara.

9. **Snabbtest av "Framme"-mejlet utan att vänta på leverans:**
   ```
   GET https://www.fyndplats.se/_functions/delivered-test?secret=<DIN_SECRET>&contactId=<DIN_CONTACT_ID>&orderNumber=TEST123
   ```
   (Hämta ditt contactId från Wix Dashboard → Contacts → klicka på dig själv → URL-end)

## Felsökning

- **Mejlet skickas inte men ingen error i loggen:** kontrollera att mall-ID:t
  fortfarande är `VKnRVoH` resp `VKnSIqs` (öppna i Triggered Emails och kolla
  Mejl-ID-kolumnen). Om mallen är dupliserad/återskapad har den ett nytt ID.
- **`Site Monitoring → Logs`** i Wix Dashboard visar `console.log`/`console.error`
  från Velo-koden. Använd vid felsökning.
- **`emailContact failed: contact not found`** — kunden är inte registrerad
  som contact i Wix CRM. För dropship-flödet skapar Wix Stores normalt en
  contact per order; om så inte skett, falla tillbaka på `emailMember()`
  eller skapa contact först.

## Säkerhet

- `events.js` körs internt — ingen extern auth behövs.
- `http-functions.js` har en `?secret=...`-spärr för 17TRACK-webhooken.
  Använd en LÅNG slumpsträng. Webhooken är publikt anropbar utan secret.

## Varför Velo och inte REST?

Wix har avsiktligt inte exponerat varken `triggeredEmails.emailContact()`
eller "skapa automation" som publik REST-API. Det enda sättet att
programmatiskt skicka ett triggat mejl är via Velo-kod inne i sajten.
Den här mappen är så nära "färdigt åt dig" som det går från utsidan.
