# Samtyckesflöde i Fyndplats-appen

**Senast uppdaterad: 2 juni 2026**

Detta dokument beskriver exakt vilka samtyckes-prompts appen visar, i vilken
ordning, och den text som visas. Det ligger till grund för Apples App
Privacy-granskning och Googles Data Safety-formulär.

## Översikt av prompts

| # | Prompt | Plattform | Trigger | Styr |
|---|---|---|---|---|
| 1 | Push-notiser | iOS + Android | Vid första relevanta tillfället (t.ex. bevakning) | Order-/restock-notiser |
| 2 | App Tracking Transparency (ATT) | iOS | Före någon Meta-spårning | Meta Pixel + Conversions API |
| 3 | GDPR cookie-/datasamtycke | iOS + Android (webview) | När Wix-kassan öppnas | Marknadsförings-/analyscookies i kassan |

Ordning: notisbehörighet och ATT begärs separat och först **efter** en kort
för-prompt (pre-permission) som förklarar nyttan, så att andelen som tillåter
blir högre och en avböjd systemprompt inte låser oss ute permanent.

---

## 1. Push-notiser

**När:** När användaren aktiverar en produktbevakning eller efter onboarding –
aldrig direkt vid första appstart.

**För-prompt (egen UI, innan systemdialogen):**

> **Vill du få notiser?**
> Vi meddelar dig när din order skickas och när en bevakad vara kommer i lager
> igen. Du kan stänga av notiser när som helst.
> [Inte nu] [Tillåt notiser]

Väljer användaren "Tillåt notiser" visas systemets behörighetsdialog. En
Expo-push-token sparas (kopplad till kontot i `FyndplatsPushTokens`) endast om
behörighet ges.

---

## 2. iOS App Tracking Transparency (ATT)

**När:** Innan Meta Pixel / Conversions API aktiveras. Visas efter en för-prompt
som förklarar varför.

**För-prompt (egen UI, innan systemdialogen):**

> **Hjälp oss visa relevanta erbjudanden**
> Om du tillåter spårning kan vi mäta vilka annonser som leder till köp och visa
> dig mer relevanta erbjudanden på Facebook och Instagram. Det är helt frivilligt
> och påverkar inte hur appen fungerar.
> [Nej tack] [Fortsätt]

**ATT-systemprompt – `NSUserTrackingUsageDescription` (Info.plist):**

> "Fyndplats använder detta för att mäta annonseffekt och visa dig mer relevanta
> erbjudanden. Vi delar aldrig dina uppgifter för att identifiera dig personligen."

Engelsk variant (för icke-svenska enheter):

> "Fyndplats uses this to measure ad performance and show you more relevant
> offers. We never share your data to identify you personally."

**Logik:**
- Anropas via `ATTrackingManager.requestTrackingAuthorization`.
- **`authorized`** → Meta Pixel + CAPI aktiveras (matchar webbens
  `fp_cookie_consent === "all"`-grind, se `lib/meta.ts` / `lib/consent.ts`).
- **`denied` / `restricted`** → ingen Meta-signal skickas; inga annons-ID:n läses.
- Valet kan ändras under *iOS-inställningar → Integritet & säkerhet → Spårning*.

---

## 3. GDPR cookie-/datasamtycke (webview)

**När:** Betalningssteget öppnar den Wix-hostade kassan
(`checkout.fyndplats.se`) i en webview.

**Vad visas:** Wix/Fyndplats cookiebanner inuti webview:n med valen:

> **Vi använder cookies**
> Nödvändiga cookies krävs för att kassan ska fungera. Vi använder även analys-
> och marknadsföringscookies om du godkänner.
> [Endast nödvändiga] [Anpassa] [Godkänn alla]

- **Endast nödvändiga** → bara cookies som krävs för att genomföra köpet.
- **Godkänn alla** → aktiverar även analys- (GA4) och marknadsförings-cookies
  (Meta). Detta speglar samma `fp_cookie_consent === "all"`-grind som styr
  Pixeln/CAPI på webben.

På iOS gäller dessutom ATT-valet (prompt 2) som en övergripande grind: även om
användaren klickar "Godkänn alla" i kassan skickas ingen Meta-spårning om ATT
nekats.

---

## Sammanfattning av grindar

| Signal | Krav iOS | Krav Android |
|---|---|---|
| Meta Pixel / CAPI | ATT `authorized` **och** cookie-samtycke "all" | Cookie-samtycke "all" |
| GA4 (webview) | Cookie-samtycke "all" | Cookie-samtycke "all" |
| Push-notiser | Notisbehörighet | Notisbehörighet (Android 13+) |
| Nödvändig funktion (cart, order) | Inget samtycke krävs | Inget samtycke krävs |
