## 7. Recensionerna

*(Leonard 2026-10-30)* Den som polerar en produkt tar också dess recensioner, i samma
runda. Importen sparar leverantörens recensioner dolda (`pending`) på originalspråket, och
de syns först när någon har översatt dem. Mätt 2026-10-30: de flesta produkter har 4–10
väntande recensioner, högst 15 på en VEVOR-produkt och 30 på en Aosom-produkt.

☠️ **Steget går inte att hoppa över.** Workflowen i steg 9 prövar recensionerna för varje
produkt i planen innan den skriver något, och vägrar `skriv` om en produkt har väntande
recensioner utan beslut. En saknad `recensioner.json` räknas som inga beslut. Efter
produkterna skriver den recensionerna, läser tillbaka varje rad och säger till butiken, så
att produktsidan visar dem direkt. Annars cachas de i sex timmar.

1. **Läs.** Kör **"Polering — recensionerna till rundans produkter"**
   (`polish-recensioner.yml`) med `ref` satt till poleringsgrenen, `runda` satt till
   katalogens namn och läget `las`. Den läser produkterna ur `ids.tsv`, skriver
   `recensioner-kalla.json` till rundans katalog och committar den. Per kort står de
   väntande recensionerna: id, betyg, datum, språk, `kopt` (varianten kunden köpte, på en
   VEVOR-familj), antal foton och originaltexten. Inga namn och inget land, och
   artikelnummerformer är redigerade. Står recensentens namn eller en signatur i texten är
   den bortredigerad (`‹NAMN›`) och raden märkt `namn: true`: den döljs, eftersom originalet
   inte får översättas *(husets regel sedan 2026-09-30)*. Butikens egna kunders omdömen är
   inte med. `ids.tsv` måste vara pushad innan du kör `las`, och kolumn 2 ska vara produktens
   Wix-id. Hämta grenen efteråt (`git pull`), eftersom workflowen har committat filen.
2. **Besluta varje recension** i `recensioner.json`:
   ```json
   { "<kort>": { "oversatt": { "<id>": "<svensk text>" }, "dolj": { "<id>": "<skäl>" } } }
   ```
   En översatt recension publiceras. En dold avvisas och går att visa igen i
   `/admin/reviews`. En produkt utan väntande recensioner behöver ingen rad.
3. **Pröva** med samma workflow i läget `torr`, efter att ha pushat `recensioner.json`.
   Felen står per kort och recensions-id. Steg 9:s `torr` gör samma prövning.

**Översättningen** ska låta som en människa skrev den, inte som en översättning *(Leonard
2026-10-31)*: samma längd och ton som originalet, vardaglig svenska och korta meningar
(CLAUDE.md, *Recensionernas svenska ska låta som en kund*). Innehållet ändras aldrig, och
kritik står kvar.

- **Skriv som kunden skrev.** Saknar originalet punkt sist saknar svenskan den också.
  Smilisar och emojis står kvar som de är (`:)`, `;)`, `:-)`, `😊`), och grinden släpper
  semikolonet i en smilis *(Leonard 2026-10-31)*.
- Inga tankstreck, semikolon mellan satser, citattecken eller `…`, och inga AI-fraser som
  *sammantaget* eller *helt och hållet*.
- Ta bort varumärken och marknadsplatser, budfirmor, priser, säljaren och kundtjänst,
  leveranstider som säljaren lovat och namn. Blir meningen fel utan det, dölj recensionen
  i stället.
- **En allmän rad om leveransen står kvar** när recensionen också handlar om produkten:
  *snabb leverans*, *kom fort*, *väl förpackat* *(Leonard 2026-10-31)*. Bara budfirmans namn
  stryks.

**Dölj** med ett kort skäl, eftersom loggen är publik, när recensionen:

- bara handlar om leveransen, returen eller kundtjänsten. Säger den också något om
  produkten står den kvar, med leveransraden (se ovan),
- gäller en annan vara, färg eller storlek än sidans,
- bär ett namn, en signatur eller hälsouppgifter (`namn: true` i läsningen),
- säger emot sidans fakta, till exempel ett annat mått. Lista den då också i `FLAGGADE.md`
  åt Leonard,
- handlar om ett yngre barn än sidans åldersgräns, eller påstår något om tillverkningslandet,
- handlar om en färg som sidan inte har, när färgen är poängen (på en sammanslagen sida är
  alla sidans färger dess egna),
- är reklam eller inte går att förstå.

En recension som redan är publicerad rättas i `/admin/reviews`, inte med workflowen: den
vägrar ett id som inte väntar.

**Prövningen** fäller hela rundan och skriver ingenting när:

- en produkt i rundan har en väntande recension utan beslut, eller en recension står både
  som översatt och dold,
- ett id inte finns på produkten eller är butikens eget kundomdöme (de godkänner Leonard
  i `/admin/reviews`),
- en översättning är oöversatt, för kort eller för lång jämfört med originalet, har
  engelska kvar eller bryter mot stilen: tankstreck, semikolon mellan satser (en smilis som
  `;)` går igenom), citattecken, tre punkter, AI-fras, marknadsplats eller leverantör,
  budfirma, pris, säljare eller kundtjänst, artikelnummer.

**VEVOR.** VEVOR visar en familjs recensioner på varje artikel i familjen. På en
VEVOR-produkt tar `las` därför bara med recensioner om produktens egna artiklar. De andra
räknas som `annan artikel` och `okänd artikel`, får inget beslut och stoppar inte rundan.
Prövningen fäller ett beslut om dem. Verktyget **"VEVOR — recensioner om en annan
artikel"** döljer de förra; kör det före **"VEVOR — recensionernas foton"**, som hoppar över
dolda rader. En okänd artikels recension avgörs om VEVOR-läsaren åter hittar dess text på
sidan (utkast läses en gång per dygn, publicerade sidor var fjärde timme), och då hamnar den
på restlistan nedan. En äldre rad vars text inte längre står på VEVOR:s sida förblir okänd
och räknas bara. Recensioner som importeras efter att PR #839 driftsatts bär sin artikel och
blir aldrig okända.

En VEVOR-vara utan komplett GPSR skrivs men publiceras inte. Dess recensioner skrivs ändå
och syns när varan publiceras.

**Restlistan.** Recensioner kan bli väntande efter poleringen: en senare inläsning
(Aosom-inläsningen tar publicerade produkter), recensioner som kopieras från en givare vid
en sammanslagning, eller en VEVOR-rad vars artikel blivit känd. Kör läget `kvar` (ingen
runda behövs) i början av varje poleringsdag. Det listar varje publicerad produkt med
väntande recensioner att besluta, i `ids.tsv`-form. Ta dem som egna rundor om högst 20
produkter (workflowens tak): `ids.tsv`, `las`, `recensioner.json`, `torr` och `skriv` i
samma workflow.
Mätt 2026-10-30, innan steget fanns: 263 publicerade produkter hade 1 451 sådana
recensioner, alla från Aosom.
