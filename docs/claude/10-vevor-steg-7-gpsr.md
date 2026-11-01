## VEVOR: steg 7, publiceringsspärren och produktsäkerheten (2026-10-29)

EU:s produktsäkerhetsförordning (EU 2023/988, artikel 19) kräver att
produktsidan visar tillverkarens namn, postadress och e-post, och när
tillverkaren finns utanför EU samma tre uppgifter för den ansvariga i EU.
VEVOR:s tillverkare finns i Kina, så båda parterna behövs. Undantaget i
artikel 9.7 gäller bruksanvisningen, inte parterna: en vara utan manual
publiceras så fort parterna finns.

**En VEVOR-vara publiceras bara när GPSR är komplett** (`lib/publicering.ts`).
Komplett betyder båda parterna med namn, adress och e-post
(`lib/vevor/gpsr.ts`). Spärren går inte att tvinga förbi och sitter i varje väg
i motorn som gör en produkt synlig:

| väg | vad som händer med en VEVOR-vara |
|---|---|
| poleringens textsteg | text, bilder, kategorier och SKU skrivs, men `visible: false`; verifieringen kräver att den är dold |
| poleringens stämpel | `needsAiPolish: false`, men inte `draftStatus: "published"` |
| köns knapp och API | aldrig, inte ens komplett: den publiceras genom poleringen |
| `/api/admin/mapping` | `draftStatus: "published"` svarar 409 |
| för hand i Wix | går inte att stoppa; morgonmejlet listar sidan med Wix-id |

Aosom, AliExpress och okända leverantörer har inget hinder.

**Märket VEVOR** sätts av poleringens textsteg (`brand: {id}`, id:t slås upp
eller skapas med `lib/polish/marke.ts`). Går det inte att sätta publiceras
varan inte. Verifieringen kontrollerar märket.

**Uppgifterna bor i Wix CMS** (`FyndplatsVevorGpsr`, behörighet ADMIN, skapad
2026-10-29), aldrig i en incheckad fil: repot är publikt. En rad per artikel,
och raden `standard` gäller alla VEVOR-varor utan egen rad
(`lib/vevor/gpsr-standard.ts`). En egen rad går alltid före.

✅ **Standardraden är Leonards beslut 2026-10-29.** VEVOR har inte svarat på
vem som är EU-ansvarig (ärendet stängdes 28 oktober). Leonard valde att visa
INDEPSALE TECHNOLOGY LIMITED i Dublin, som säljer till oss och står i VEVOR:s
villkor, med supportadressen därifrån, och som tillverkare bolaget som
manualerna anger. Svarar VEVOR något annat skrivs standardraden om, och då
ändras alla varor på en gång.

Workflowen **"VEVOR — produktsäkerhet (GPSR)"** → `/api/admin/vevor-gpsr`:
`status` · `las` · `satt` · `rensa` · `standard` · `rensa-standard`. Torrt om
inte `skarp` är `ja`. En part skrivs "namn | adress | e-post".

Fem egenskaper som inte ska tas bort:

1. ☠️ **Spärren läser raderna, inte mappningens status.** `vevorGranskning.gpsr`
   är importens status och följer inte standardraden; kön visar status som
   spärren ser den.
2. ☠️ **En part prövas igen vid läsningen.** En rad som ändrats för hand i Wix
   CMS blir aldrig "komplett" med en halv part.
3. ☠️ **Webbadresser, artikelnummer och taggar vägras** i parterna, eftersom
   rutten svarar till en publik Actions-logg.
4. **`/api/gpsr` svarar 404 utan cache** när uppgifterna inte är kompletta, så
   en sida som publiceras strax efter får sin flik direkt. Butiken visar då
   ingen flik.
5. ☠️ **Morgonmejlets vakt läser bara VEVOR-varornas synlighet** (hundra id per
   anrop), inte hela katalogen, och kastar om Wix svarar om en produkt vi inte
   frågade efter: då bet filtret inte.

**Butiken** (`headless-site`, `lib/gpsr-flik.ts`) visar VEVOR:s två parter var
för sig ("Tillverkare" och "Ansvarig i EU") och raden om bruksanvisningen
villkorad. Aosoms flik är byte för byte som förut. Mergas före motorn.
