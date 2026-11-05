# Utkast: integritetstextens tillägg för E2 och E3

Avsnittet Medlemskonto på /sekretesspolicy (godkänt 2026-11-05) beskriver bara
E1. CLAUDE.md säger att medlemspriser (E2) och företag (E3) kräver ett tillägg
innan de slås på. Det här är tillägget, för Leonards godkännande. Varje mening
är kontrollerad mot fälten i koden (`lib/medlem/lager.ts`, `foretag.ts`,
`offert.ts`, `sparade.ts`, `session.ts`) och mot motorns borttagning av konto
(`taBortKonto`).

☠️ **Det ska stå på sidan när E2 mergas, inte först när växeln slås på.**
Kakan `fp_medlem_inne` sätts vid varje inloggning från och med E2, också när
prisväxeln är av. Resten av tillägget gäller det som växeln släpper fram, men
det är enklast att allt publiceras i samma PR som E2 och E3.

Tre saker att ta ställning till står sist.

---

Tillägget infogas i avsnittet Medlemskonto, efter "Vad vi sparar" (punkterna
nedan läggs till i den listan) och med två nya underrubriker.

**Vad vi sparar** (nya punkter)

- När du handlar med medlemspris: ett prisbeslut för varukorgen, med din nivå
  och rabatt, varje varas pris och vad du sparade. Det är underlaget för
  priset du betalade.
- Har du ett företagskonto: företagets namn, organisationsnummer och form,
  faktura- och leveransadress, vilken version av företagsvillkoren du godkände
  och när, och när ansökan beslutades.
- Begär du en offert: vilka varor och hur många, ditt meddelande, offertens
  priser och hur länge den gäller.
- Sparar du en varukorg: namnet du gav den, vilka varor och hur många, och när
  den sparades. Vi sparar inte priset; när du lägger korgen i varukorgen
  gäller dagens pris.

**Företagskonto**

För en enskild firma är organisationsnumret ditt personnummer. Det visas
maskerat på Mina sidor och skrivs aldrig ut på kvitton eller fakturor; bara vi
ser hela numret, för att kontrollera företaget mot Bolagsverkets register.
Kvitton och fakturor för köp som företag får företagets namn och adress, och
för ett aktiebolag eller en annan juridisk person organisationsnumret.

Vi mejlar dig när ansökan är beslutad och när en offert du begärt är klar.

**Varför** (nya punkter)

- Medlemspriset, företagskontot, offerterna och de sparade varukorgarna är en
  del av avtalet om medlemskapet och om köpen (GDPR artikel 6.1 b).
- Prisbeslutet och en offert som blev ett köp är underlag för bokföringen.
  Det är en rättslig förpliktelse (artikel 6.1 c, bokföringslagen).

**Kakor** (ny mening)

När du är inloggad sparar vi också kakan `fp_medlem_inne`, högst lika länge
som inloggningen. Den säger bara att du är inloggad och om du handlar som
privatperson eller som företag, så att sidan kan visa rätt pris. Den ger
ingen behörighet och kräver inget samtycke.

**Hur länge** (nya punkter)

- Prisbeslut sparas i sju år, som annat underlag för bokföringen.
- Företagsuppgifterna, offerterna och de sparade varukorgarna sparas tills du
  tar bort kontot. En sparad varukorg kan du också ta bort själv på Mina
  sidor.
- En offert som blev ett köp sparas lika länge som ordern.

**Ta bort kontot** (ny mening efter den som finns)

Företagsuppgifterna, de sparade varukorgarna och offerterna som inte blev
köp tas bort med kontot. Prisbeslut och offerter som blev köp hör till dina
ordrar och finns kvar lika länge som de.

---

## Att ta ställning till

1. **Rättslig grund för prisbesluten (6.1 c).** Specens beslut D1 säger sju
   år. Prisbeslutet visar hur priset på en order sattes, och bokföringslagen
   räknar "avtal och andra handlingar av betydelse för att belysa
   affärshändelserna" som räkenskapsinformation (1 kap. 2 §), som sparas till
   och med det sjunde året efter räkenskapsårets slut (7 kap. 2 §). Det är min
   läsning av lagen, inte en jurists. Alternativet är berättigat intresse
   (6.1 f) med samma tid.
2. **Bolagsverket.** Tills nycklarna finns kontrolleras företaget för hand mot
   Bolagsverkets öppna sökning. När uppslaget byggs skickas
   organisationsnumret till Bolagsverket; då ska Bolagsverket stå under "Vem
   delar vi uppgifter med?". Meningen ovan håller i båda fallen.
3. **Städningen efter sju år är inte byggd.** Ingen rad i
   `FyndplatsPrisbeslut` är äldre än november 2026, så första raden att ta
   bort är från 2033. Ett jobb som tar bort äldre beslut behövs före dess; det
   står i motorns ämnesfil 46.

## Vad koden gör i dag (kontrollerat 2026-11-05)

- `taBortKonto` (motorn): tar kontot, profilerna (också företagsprofilen),
  nivåbytena, inloggningarna, de sparade varukorgarna och offerterna utom de
  betalda. Orderliggaren och prisbesluten står kvar.
- Att spara en varukorg följer växeln för E2/E3 (`sparadeSektion`); korgar
  som redan finns syns alltid.
- Kvittot för ett köp i kassan skriver bara ett bolags nummer
  (`arJuridisktOrgnr` i motorn), och prisbeslutet bär aldrig en enskild firmas
  nummer (`foretagPaBeslut`).
- `fp_medlem_inne` har `httpOnly: false` (sidans skript läser den), samma
  `maxAge` som sessionen och värdet `1` eller `f`.
