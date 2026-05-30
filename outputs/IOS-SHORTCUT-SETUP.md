# iOS Shortcut: vidarebefordra paket-SMS till Fyndplats

Den här guiden visar steg-för-steg hur Leonard sätter upp en iOS-genväg
(Shortcut) på sin iPhone så att alla paket-SMS från transportörerna
(PostNord, DHL, DPD, Instabox, Budbee m.fl.) automatiskt skickas vidare
till `https://www.fyndplats.se/api/sms-inbound`.

Webhooken parsear sedan SMS:et, slår upp ordern via spårningsnumret och
skickar ett Fyndplats-brandat leveransmejl till den riktiga kunden — som
aldrig får se transportörens text "Ditt paket från AliExpress C/o ...".

---

## Vad du behöver innan du börjar

1. En iPhone med iOS 16 eller senare (Genvägar-appen är förinstallerad).
2. `SMS_INBOUND_SECRET` — den hemliga nyckeln som webhooken kräver. Den
   ska redan vara satt i Vercel; be teamet om värdet om du inte har det.
3. Att din iPhone tar emot SMS från avsändarna ovan. Om du inte ser några
   SMS på telefonen finns det inget att vidarebefordra.

---

## Steg 1 – Skapa en ny Automation

Genvägar har två flikar längst ner: **Mina genvägar** och **Automatisering**.
Vi använder **Automatisering** eftersom den kan triggas av inkommande SMS.

1. Öppna appen **Genvägar** (Shortcuts).
2. Tryck på fliken **Automatisering** längst ner.
3. Tryck på **+** uppe till höger → **Skapa personlig automation**.
4. Bläddra ned och välj **Meddelande** (Message).
5. I fältet **Meddelande innehåller** kan du lämna tomt om du vill fånga
   alla SMS. Vi rekommenderar att filtrera på avsändarna direkt här för
   att minska brus — fyll i de namn du oftast får SMS från:

   ```
   PostNord
   DHL
   DPD
   Instabox
   Budbee
   Bring
   Schenker
   GLS
   ```

   (Tryck på **Lägg till** mellan varje.)
6. Tryck **Nästa**.

---

## Steg 2 – Lägg till "Hämta innehåll från URL"

Nu definierar vi vad som ska hända när ett SMS kommer in.

1. Tryck på **Lägg till åtgärd** (Add Action).
2. Sök efter **Hämta innehåll från URL** (Get Contents of URL). Lägg till den.
3. I URL-fältet, skriv:

   ```
   https://www.fyndplats.se/api/sms-inbound
   ```

4. Tryck på **Visa mer** (eller pilen) för att fälla ut fler alternativ:
   - **Metod**: `POST`
   - **Begäran**: lämna oförändrad
   - **Rubriker** (Headers):
     - `Content-Type` → `application/json`
     - `X-Sms-Secret` → *(klistra in värdet från `SMS_INBOUND_SECRET`)*
   - **Begäransstruktur** (Request Body) → välj **JSON**
   - Lägg till två fält:
     - `from` → tryck på fältet, välj **Variabel** → välj **Avsändare**
       (variabeln från Meddelande-triggern).
     - `text` → tryck på fältet, välj **Variabel** → välj **Innehåll**
       (eller **Meddelande** beroende på iOS-version).

   Slutresultatet ska bli ett JSON-objekt som liknar:

   ```json
   { "from": "<Sender>", "text": "<Meddelande>" }
   ```

---

## Steg 3 – Stäng av bekräftelseprompten

Genvägar frågar normalt "Kör automation?" varje gång. Det vill vi inte.

1. Tryck **Nästa** uppe till höger.
2. Stäng av **Fråga innan körning** (Ask Before Running).
3. iPhone varnar att den kommer köra utan bekräftelse — bekräfta med
   **Fråga inte**.
4. Tryck **Klart**.

---

## Steg 4 – Testa att det funkar

Skicka ett test-SMS till din egen iPhone från en annan telefon med
texten:

```
PostNord
Ditt paket från Fyndplats är nu vid ICA Maxi Södertälje. Hämtkod: 1234
```

(Avsändaren spelar roll — den måste innehålla något av carrier-namnen
som parsern känner igen, t.ex. PostNord, DHL, DPD, Instabox, Budbee.)

Inom någon sekund ska iPhones notifikationscentrum visa "Kör Automation"
och därefter försvinna utan fel. Verifiera att webhooken tog emot
anropet:

```bash
curl -X GET \
  -H "X-Dev-Secret: $DEV_SECRET" \
  https://www.fyndplats.se/api/dev/tracking-map
```

Du ska se SMS:et i fältet `recent_audit`.

---

## Felsökning

- **"Kunde inte verifiera URL"** → fel `X-Sms-Secret`. Dubbelkolla värdet
  i Vercel.
- **Automatisering kör inte alls** → kontrollera att SMS-avsändaren
  matchar något av namnen i triggern. Sätt triggern till tom-värde om du
  vill fånga alla SMS (du kan filtrera senare i webhooken).
- **Du får meddelande "Genväg misslyckades"** → öppna **Genvägar →
  Automatisering**, tryck på automationen, lägg in en **Visa meddelande**
  efter "Hämta innehåll från URL" som visar variabeln **Innehåll från URL**
  så ser du serverns svar.

---

## Säkerhetsnotis

- `X-Sms-Secret` är den enda spärren mot att någon annan postar
  webhook-anrop. Behandla den som ett lösenord — om du tror den läckt,
  rotera den i Vercel (`SMS_INBOUND_SECRET`).
- iPhone-genvägar exporteras med signeringar — den här filen är inte en
  färdig genväg, utan en uppställning du gör själv på telefonen. Vi
  delar avsiktligt inte en `.shortcut`-fil eftersom Apple kräver att den
  signeras av en specifik enhet.
