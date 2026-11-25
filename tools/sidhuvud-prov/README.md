# Sidhuvudsprovet: mekanismen på en riktig telefon

Telefonens sidhuvud följer fingret (`lib/huvud-gom.ts`,
`components/huvud-gom.tsx`, avsnittet "Telefonens sidhuvud följer fingret" i
`CLAUDE.md`). Första versionen mättes bara i Chromium och såg ut som ett hopp
på Leonards iPhone. Det här provet kör samma räkning i Safari på en riktig
iPhone, utan att förhandsvisningens länk lämnas ut och utan egen server.

## Vad det är

`bygg.cjs` bygger en fristående sida: en remsa, ett sidhuvud i omslaget
`.huvudspar`, nittio rader innehåll, räkningen ur `lib/huvud-gom.ts` (läst ur
källan varje gång) och samma steg som komponenten gör, i ren JavaScript. Sidan
kör ett självprov i nitton delar och skriver resultatet i en ruta längst ner
och i sidans titel: `OK 19`, eller `FEL n`.

Självprovet flyttar sidan med `scrollBy` en bildruta i taget och läser
sidhuvudets läge i varje bildruta. Det provar att sidhuvudet följer sidan pixel
för pixel utan att något skrivs, att fästet läggs rätt vid vila, glidet den
sista biten (att det börjar stilla), ett avbrutet glid, en vändning utan vila,
ett långsamt drag, sidans topp och botten och att sidan under står still.

☠️ **Det provar inte ett finger.** `scrollBy` går genom sidans egen tråd. Ett
finger på en iPhone scrollar i skärmens tråd, och sidans kod får veta det en
eller ett par bildrutor senare. Provet säger alltså att Safaris layout gör det
räkningen väntar sig, inte hur det känns. Det måste någon se på en telefon.

☠️ **Komponentens steg står två gånger**, här och i
`components/huvud-gom.tsx`. Ändras komponenten ska stegen här följa med.
Landningen efter sidbyte, sökläget och märket `data-huvud-borta` finns inte i
provsidan: de mäts i butiken.

## Så körs det

```
node tools/sidhuvud-prov/bygg.cjs /tmp/sidhuvud
```

Det skriver `prov.html` och `adress.txt`.

- **Lokalt:** öppna `prov.html` i en webbläsare i telefonstorlek, eller låt
  Playwright öppna den och vänta på titeln.
- **På en riktig telefon (BrowserStack, `devicecontrol`):** `navigate_to` med
  adressen i `adress.txt`, sedan `get_title` tills den börjar med `OK` eller
  `FEL`, och `find_element` på `#ut` med `get_element_text` för raderna.

## Varför adressen ser ut som den gör

- ☠️ Safari på iPhone öppnar inte en `data:`-adress: `navigate_to` svarar utan
  fel och sidan står kvar där den var.
- ☠️ `httpbin.org/base64/…` svarar med ren text, så Safari visar källkoden.
- Adressen går därför till `postman-echo.com/response-headers`, som svarar med
  den innehållstyp man ber om och upprepar frågesträngen i svaret. Där ligger
  en laddsida på en rad. Provsidan själv ligger gzip-packad i adressens
  fragment, som aldrig skickas till någon server. Laddsidan packar upp den
  (`DecompressionStream`, Safari 16.4 och senare) och skriver ut den.
- Ingenting ur butiken, inga kunduppgifter och ingen länk till en
  förhandsvisning finns i adressen.

## Mätt 2026-11-25

| | Chromium 390 × 844 | iPhone 15, Safari 27 | iPhone 16, iOS 18.6 | iPhone 14, iOS 16.4 |
|---|---|---|---|---|
| Delprov | 19 av 19 | 19 av 19 | 18 av 19 (första provsidan) | 19 av 19 |
| Upp 60 efter en vila: läget plus det synliga | konstant, 0 skrivningar | konstant, 0 skrivningar | konstant, 0 skrivningar | konstant, 0 skrivningar |
| Glidets första steg per bildruta | 0,7 2,6 5,4 9,4 12,5 | 0,8 2,6 5,7 9,8 12,1 | 0,7 2,7 5,3 9,6 12,7 | 0,7 2,5 5,4 9,3 12 |
| Vändning utan vila: största egna steg | 2 px | 2 px | 2 px | 2 px |
| Sidan under | står still | står still | står still | står still |

## ☠️ Vad telefonerna visade som Chromium inte visade

1. **En telefon utför inte alltid varje liten förflyttning.** iOS 16.4 på en
   iPhone 14: sidan gick 272 px av 400 när varje bildruta bad om 8 px till, och
   13 px av 20. iOS 18.6 låg en bildruta efter. Första provsidan räknade med
   avstånden och sa 18 och 16 av 19, sedan 12 av 19. Nu styr draget mot ett mål
   i sidan och läser det verkliga läget i varje bildruta, väntar tills läget
   stått still i tre bildrutor, och delproven räknar med hur långt sidan
   faktiskt gick (`p.gick`).
2. **Safari 27: det fästa sidhuvudets avlästa läge står en bildruta efter
   sidans** medan `scrollTo` flyttar sidan: 125 i stället för 133 vid 8 px per
   bildruta, i alla tio rutor i zonen, och 133 när sidan stannat. Zonen läses
   därför när sidan står still, och provet skriver ut hur många rutor som låg
   efter. Det ledde till en ändring i butikens kod (`sparAvbrutet`).
3. **Ändras bara fragmentet laddar Safari inte om sidan.** Efter `navigate_to`
   till en ny provsida på samma adress: `refresh_page`.
