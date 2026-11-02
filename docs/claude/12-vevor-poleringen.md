## VEVOR-poleringen (2026-10-30)

Leonard börjar SEO-polera VEVOR-utkasten 2026-10-31. Arbetsgången står i
runbooken (`docs/seo-polish-runbook.md`) och VEVOR-chattens startdokument
(`docs/polish/vevor.md`, egen chatt för VEVOR och för Aosom sedan Leonards beslut 2026-10-31).
Hans beslut samma kväll, svar på tre frågor:

| fråga | beslut |
|---|---|
| Kontrollera frakten på en billig vara före publiceringen? | Nej. Priset räknar med 0 kr i frakt. |
| Returadress för VEVOR i butiken? | Inte nu ("skiti"). En kund som returnerar en VEVOR-vara får adressen per mejl (`lib/returadress.ts` på headless-site ger ingen adress). |
| Stryks bilder med engelsk säljtext, som de tyska? | Ja. VEVOR-loggan på varan får stå (2026-10-28). |

Tre ändringar i koden samma dag:

1. **Prisgrinden gäller VEVOR-rader** (`REGELN_GALLER.vevor`,
   `lib/polish/mapping-access.ts`). Importen sätter regelpriset och VEVOR-synken
   skriver det med kostnaden, så en avvikelse är drift och fäller jobbet, som
   för Aosom. Förut svarade grinden "ej avgörbar, inte en Aosom-import".
2. ☠️ **`gatelib.ARTNR` fäller VEVOR:s artikelnummer** (19 eller 22 tecken,
   versaler och siffror i ett) i kundtexten, i rundans filer och i skrivplanen
   (`lib/polish/skrivplan.ts`, tecken för tecken samma uttryck). Mätt före
   ändringen: 17–24 tecken gav sex träffar i `tools/polish-assets` (längd 17
   och 20, i kortens HTML), 19 och 22 gav noll. Nummer med bindestreck eller
   punkt (2,1 % av VEVOR:s) fångas inte.
3. **Workflowens texter** säger "hos leverantören" i stället för "hos Aosom".
4. ☠️ **VEVOR:s modellnummer syns aldrig hos oss** (Leonard 2026-10-31: "ta bort det från
   oss så man inte kan söka upp"). En sökning på numret leder till VEVOR:s egen sida med
   deras pris. Mätt samma dag på 15 297 avläsningar: raden *Artikelmodellnummer* på 12 539,
   *Modell* på 1 147 och *Artikelnummer* på 605. Tre spärrar:
   - Importen tar bort raderna ur specifikationen (`arIdentifierarRad` i
     `lib/vevor/to-product.ts`), också i en familjs flik. *Modell* tas bara bort när värdet
     är en kod. Sedan 2026-11-01 tas varje rad som grinden nedan fäller bort
     (`radHarModellnummer`), och en etikett som VEVOR lagt sist i värdet skärs bort. Rader om
     vad varan passar till (*Kompatibel bilmodell*, *OE-nummer*) står kvar så länge grinden
     inte fäller dem.
   - **"VEVOR — specifikationen på utkast som saknar den"** byter ut fliken på äldre utkast
     som bär en sådan rad (`flikHarModellnummer`, också på en enskild artikel), med samma
     regel för raderna.
   - Poleringens grind `MODELLNR` (`gatelib.py`, och tecken för tecken i
     `lib/polish/modellnummer.ts`, som importen, verktyget och skrivplanen läser) fäller
     etiketten. Vårt eget `FP-…` efter *Artikelnummer* och en modell med ord får stå. Numret
     i löpande text ser grinden inte.
