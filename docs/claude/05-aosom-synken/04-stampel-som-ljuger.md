### ✅ En stämpel som ljuger rättas mot butiken (2026-09-30)

Hundburen `6297606f` gjorde driften akut. Sammanslagningen (B71 i
`tools/polish-gates/FLAGGADE.md`) stämplade 90 cm (`22f4cf42`) med givarens
saldo, alltså flödets tal. Synken 03:20 hade läst mappningarna innan dess, såg
90 cm som en okänd variant och nollade den i butiken 03:24. Sedan sa stämpeln
"redan skrivet" och butiken 0 — och synken skrev bara när FLÖDET skilde sig
från stämpeln. Varianten hade stått som slutsåld tills Aosoms saldo på
artikeln ändrades. `lagerDrift` räknade den hela tiden: 5 av 4 486 i
torrkörningen 19:5x UTC samma dag.

`motButikensSaldo` (`lib/aosom/sync.ts`) jämför butikens saldo, som körningen
redan läste, med stämpeln. Skiljer de sig åt är stämpeln opålitlig, och
flödets saldo planeras för skrivning även när stämpeln redan säger det. Per
variant på en sammanslagen sida, på radens egna poster på en vanlig rad. Allt
annat står kvar: `LAGER_BUFFERT`, exakt `limit` (rättelserna ryms i tuggan),
alla-eller-ingen per produkt, bekräftelsen per rad (`tolkaBulkUtfall`),
massfelsspärrarna och att torrkörningen läser lagret.

Två nya fält, i svaret, loggraden, audit-raden och workflow-summeringen:
`lagerDriftRattade` — produkter där driften lade till minst en lagerrad, alltså
de extra skrivningarna — och `lagerDriftProdukter`, deras Wix-id. `lagerDrift`
räknar som förut driften när körningen kom, och ska vara noll efter en skarp
körning.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Ett okänt saldo är ingen drift.** En post utan `quantity` gick inte att
   läsa, och då gäller stämpeln — samma hållning som `aterkomnaLagerrader`.
2. ☠️ **Bara radens EGNA poster räknas på en vanlig rad** (`delaPoster`, samma
   uppdelning som skrivningen). Mätningen läste tidigare `poster[0]`, som kan
   vara en okänd färgs post. En okänd variant nollas ändå och är ingen drift.
3. **En rättelse som föll stämplas inte**, som alla andra skrivningar. Nästa
   körning ser driften igen och försöker på nytt.
4. **En rättelse från 0 är en återkomst.** Bevakarna mejlas som vid varje
   annan återkomst (`aterkomnaLagerrader`), och torrkörningen räknar den.

☠️ **En försäljning räknas också som drift — det är en beteendeändring.** Wix
drar av saldot vid köp, så butiken hamnar under stämpeln, och nästa synk
skriver tillbaka flödets tal. Förut låg avdraget kvar tills Aosoms tal för
artikeln ändrades. Nu skrivs det över vid varje körning tills Aosoms flöde
visar vår order. Regeln skiljer inte en försäljning från en nollning, och ett
test låser det (`en försäljning räknas som drift`).

☠️ **Det som hindrar att samma sista enhet säljs igen är `medSaldaAvdragna`**
(sedan 2026-10-01). Varje orderrad som är såld hos oss men som Aosoms flöde
inte visar än dras av från flödets saldo innan planen jämförs med butiken. Fram
till dess var det `LAGER_BUFFERT` på 3 som skyddade, och det räckte inte:
golvlampan `65ca6f6d` hade 4 hos Aosom, butiken visade 1, order 10056 tog den,
och nästa körning skrev 1 igen. Med avdraget blir samma rad 4 − 1 = 3 (med
bufferten på 1, som gällde fram till 2026-10-06, blev den 2).

Fem egenskaper som inte ska tas bort:

1. ☠️ **Två slags orderrader räknas** (`vantarPaFlodet`): tasks med status
   `pending`, och tasks med status `ordered` i tolv timmar efter att de
   markerats beställda (`orderedAt`, som workflowen "Order — beställd eller
   skickad för hand" sätter). Flödet exporteras tre gånger per dygn, så en nyss
   lagd order syns inte där direkt, och bufferten (0 sedan 2026-10-06) skyddar
   inga beställda enheter. Visar flödet redan ordern dras den av två gånger under
   resten av fönstret, och det är åt det säkra hållet. En `ordered`-rad utan
   `orderedAt` räknas inte.
2. ☠️ **Raderna läses för varje tugga, direkt EFTER butikens lager.** Lästes de
   en gång när körningen startade kunde en försäljning mitt i körningen synas i
   butiken men inte i avdraget, och driften hade lagt tillbaka den. Kvar är
   webhookens sekunder mellan köpet och orderraden.
3. ☠️ **Depen är obligatorisk (`lasSaldaOrderrader`), och ett läsfel stoppar
   tuggans lagerskrivningar**, som när lagret inte går att läsa. Produkterna
   som ville skrivas räknas som misslyckade. En körning utan avdraget hade lagt
   tillbaka varje såld enhet.
4. ☠️ **På en sammanslagen sida dras varje orderrad från sin egen färg**, avgjord
   som beställningsfilen avgör den (`aosomArtikelForTask`). En rad som inte går
   att knyta till en färg dras från ALLA färger.
5. **Avdraget räknas och syns:** `saldaAvdragna` och `saldaAvdragnaProdukter`
   (Wix-id) står i svaret, loggraden, audit-raden och workflow-summeringen. Det
   är ett mått, inget fel, och talet sjunker när ordrarna lagts och syns i
   flödet.

⚠️ **Markera Aosom-ordern beställd när den läggs.** En task som står kvar som
`pending` efter att ordern lagts dras av en gång till när flödet visar ordern.
Sidan visar då en enhet för lite tills tasken markerats beställd eller skickad.

**Verifierat i drift 2026-10-01**, i den ordning körningarna gick:

| körning | tid (UTC) | granskade | lager | sålda avdragna | fel |
|---|---|---:|---:|---:|---:|
| torr, gammal kod (buffert 3) | 01:10–01:13 | 4 484 | 0 | — | 0 |
| torr, ny kod | 01:31–01:53 | 4 484 | 4 076 (skulle) | 0 | 0 |
| skarpt lagersvep (`lager`) | 01:56–01:58 | 4 484 | **4 076** | 0 | **0** |
| torr direkt efteråt | 02:03–02:06 | 4 484 | **0** | 0 | 0 |

Sista raden är kvittot: ett skarpt svep, och sedan vill ingenting skrivas om.
Noll okända varianter, noll tvetydiga och noll lagerdrift i alla tre körningarna
med ny kod. 59 produkter gick från slutsåld till köpbar. Inga restock-mejl gick
och inga föll.

Avdraget blev noll för att ingen Aosom-order väntade (bulkorderns plan: 0 rader).
Golvlampan `65ca6f6d` står därför på **3**, inte på de 2 som räknades fram ovan.
Order 10056 hade markerats beställd innan `orderedAt` fanns, och en sådan rad
räknas inte (punkt 1). Hade flödet ännu inte visat den ordern saknade sidan
buffert fram till nästa export. Luckan försvinner av sig själv: varje order som
markeras beställd från och med nu får sin tidsstämpel.

⚠️ **Racet i B71 lagades på mappningssidan samma kväll** — se nästa avsnitt.
Kvar är Wix-sidan: en körning som planerat ur en rad från före en
sammanslagning kan fortfarande nolla den nya varianten som okänd. Mappningen
behåller nu varianten och dess stämpel, så nästa körning ser driften och
rättar saldot. Kör ändå ingen sammanslagning mellan xx:18 och xx:27 vid
synktimmarna (var tredje timme: 00, 03, 06, 09, 12, 15, 18 och 21 UTC).

**Verifierat i drift 2026-09-30**, i den ordning körningarna gick:

| körning | kod | lager | lagerdrift | rättade | fel |
|---|---|---:|---:|---:|---:|
| torr 19:43 | före | 936 (skulle) | 5 | — | 0 |
| skarp 20:43 | ny från varv 2 | **939** | 6 | **5** | **0** |
| torr 20:54 | ny | **0** | **0** | 0 | 0 |

Den skarpa körningen startades av en annan session (ett godkänt prishopp) och
rättade hundburen, `6297606f`, bland de fem. En läsning direkt i Wix efteråt
gav 90 cm (`22f4cf42`) **122**, `IN_STOCK`, skrivet 20:51:22. Varianten hade
stått på 0 sedan 03:24.

☠️ **En torrkörning som går SAMTIDIGT som en skarp mäter ingenting.** En
torrkörning startad 20:44, en minut efter den skarpa, gav 923 "lagerdrift".
Den hade läst mappningarna innan den skarpa körningen hann stämpla dem, men
butiken efter att den hunnit skrivas. Kolla att ingen annan körning av
workflowen pågår innan du startar en mätning.
