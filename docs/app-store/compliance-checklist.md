# Compliance-checklista (iOS + Android)

Checklista som måste vara avbockad **innan** submission. Bocka av i PR/issue när
respektive punkt är verifierad i den faktiska app-buildet (denna katalog
dokumenterar krav — den implementerar dem inte).

---

## iOS — App Tracking Transparency (ATT)

- [ ] Om appen spårar användaren över andra appar/sajter (Meta Pixel/CAPI-matchning
      räknas som spårning) **måste** `AppTrackingTransparency`-dialogen visas
      *innan* någon spårningsidentifierare läses.
- [ ] `NSUserTrackingUsageDescription` finns i `Info.plist` med en svensk
      förklaringstext, t.ex.:
      *"Vi använder detta för att visa relevanta annonser och mäta hur våra
      kampanjer fungerar."*
- [ ] Ingen IDFA/spårning sker före användarens "Tillåt" — gata spårningen på
      ATT-status **och** appens egen cookie-consent (`fp_cookie_consent === "all"`,
      samma princip som webbens Meta Pixel-gate, se projektets CLAUDE.md).
- [ ] Om appen **inte** spårar: deklarera "Data Not Used to Track You" i Privacy
      Labels och hoppa över ATT-dialogen (då får den inte visas alls).

> Beslut som måste fattas: spårar app-buildet via Meta/annonsnätverk? Om ja →
> ATT obligatoriskt. Om nej → deklarera ingen spårning. Detta avgör flera punkter
> nedan.

## iOS — Privacy Manifest (`PrivacyInfo.xcprivacy`)

Krävs av Apple för alla nya appar/uppdateringar. Ska deklarera:

- [ ] **Insamlade datatyper** (`NSPrivacyCollectedDataTypes`) — för Fyndplats
      sannolikt:
  - Kontaktuppgifter (namn, e-post, telefon — vid köp/konto)
  - Köp-/orderhistorik
  - Identifierare (enhets-/användar-ID, push-token)
  - Användningsdata & diagnostik (analytics: GA4, Vercel)
  - *Vid spårning:* annonsdata kopplad till identitet (Meta)
- [ ] **Required Reason API**-deklarationer (`NSPrivacyAccessedAPITypes`) för t.ex.
      UserDefaults, file timestamp, system boot time om dessa används.
- [ ] **Tracking-domäner** (`NSPrivacyTrackingDomains`) listade om ATT-spårning
      sker (t.ex. Meta-endpoints).
- [ ] Datatyperna här **matchar** Privacy Nutrition Labels i App Store Connect
      och sekretesspolicyn ([`privacy-url.md`](privacy-url.md)).

## iOS — Push notifications

- [ ] `UNUserNotificationCenter`-permission begärs med tydlig kontext innan
      systemdialogen visas (appen har push-backend, se memory `push-notifications`).
- [ ] Push används inte för annonsering utan separat samtycke.

---

## Android — Google Play Data Safety

- [ ] **Data Safety**-formuläret i Play Console ifyllt och matchar faktisk
      datainsamling + sekretesspolicyn. Deklarera:
  - Personuppgifter (namn, e-post, telefon)
  - Finansiell info (köphistorik; **ej** kortdata — hanteras av Klarna)
  - App-aktivitet (analytics)
  - Enhets-/andra identifierare (push-token, analytics-ID)
- [ ] Ange för varje datatyp: **samlas in?**, **delas med tredje part?**,
      **krypteras i transit?**, **kan användaren begära radering?**
- [ ] Deklarera datadelning med tredjepart där det gäller (Meta vid annonsspårning,
      analytics-leverantörer).
- [ ] Länk till radering av konto/data tillgänglig (Googles krav på
      account-deletion om konton stöds).

## Android — Behörigheter & notiser

- [ ] `POST_NOTIFICATIONS`-permission (Android 13+) begärs i kontext.
- [ ] Inga onödiga behörigheter i `AndroidManifest.xml` — varje behörighet måste
      kunna motiveras vid granskning.

---

## GDPR (gäller hela EU/Sverige, båda plattformar)

- [ ] Samtyckesmekanism för icke-nödvändig data (analytics/annonser) i appen,
      i linje med webbens consent-modell (`lib/consent.ts`, gate på `"all"`).
- [ ] Meta Pixel/CAPI och annonsspårning fyrar **bara** efter uttryckligt samtycke.
- [ ] Sekretesspolicy live och länkad ([`privacy-url.md`](privacy-url.md)),
      beskriver ändamål, laglig grund, lagringstid och registrerades rättigheter
      (tillgång, rättelse, radering, dataportabilitet, återkalla samtycke).
- [ ] Rutin för att hantera radering-/utdragsbegäran finns (svensk kundtjänst).
- [ ] Personuppgiftsbiträdesavtal (DPA) på plats med databehandlare (Wix, Vercel,
      Klarna, Meta, analytics) — verifiera att alla är täckta.

## Barns integritet (Children's Privacy)

- [ ] Appen är **inte** riktad mot barn under 13 — målgrupp: vuxna shoppare.
- [ ] Apple: åldersgrupp sätts så att appen inte hamnar i "Kids"-kategorin.
- [ ] Google Play: i **Target audience and content** anges målgrupp **18+ / vuxna**,
      *inte* barn — då utlöses inte Families Policy / COPPA-kraven.
- [ ] Ingen åldersgrindad eller barninriktad funktionalitet. Förväntad rating
      4+/All Ages handlar om *innehållet*, inte om att appen riktas mot barn — se
      [`rating-questionnaire.md`](rating-questionnaire.md).

---

## Generellt innan submission

- [ ] Alla store-URL:er svarar 200 (support, marketing, privacy).
- [ ] Privacy Labels (Apple) ↔ Data Safety (Google) ↔ Privacy Manifest ↔
      sekretesspolicy är **inbördes konsistenta** — granskare jämför dem.
- [ ] App-build testad på fysisk enhet (iOS + Android) före inlämning.
- [ ] Demo-/testkonto tillhandahållet till granskare om inloggning krävs för att
      se appens fulla funktion.

> **Öppna beslut för Leonard:**
> 1. Spårar app-buildet via Meta/annonsnätverk? → avgör ATT + tracking-domäner +
>    "data used to track" i båda formulären.
> 2. Stödjer appen användarkonton? → om ja krävs account-deletion-flöde (Googles
>    krav) och kontorelaterade datatyper i båda formulären.
