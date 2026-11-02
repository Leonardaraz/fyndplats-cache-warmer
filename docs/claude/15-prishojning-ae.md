## Prishöjning på AE-halvan (`lib/pricing/ae-prishojning.ts`)

Leonards beslut 2026-09-13: **alla AliExpress-produkter +10 %, och en nia på
slutet.** Genomförd samma dag — **732 produkter höjda, noll misslyckade.**

Höjningen är meningsfull BARA på AE-halvan, och det är inte en smaksak:
Aosom-raderna räknas om ur kostnaden var sjätte timme, så en höjning där hade
skrivits tillbaka inom ett dygn. AE-raderna räknas aldrig om (se `#159`), så
en höjning står kvar tills någon rör den igen.

☠️ **Facit är BUTIKEN, inte mappningen.** Höjningen räknas på `listV3ProductPrices`,
aldrig på `grossSek` — samma förväxling som kostade prissynken en månad.

### Sex grindar som inte ska tas bort

1. ☠️ **Kontrollsumman räknas om i SAMMA anrop som skriver.** Den ersätter
   prisreparationens "det finns ingen kör-allt-flagga": på tusen rader vore en
   id-uppräkning teater, så summan gör samma jobb mekaniskt. En kontroll i ett
   eget, tidigare anrop bevisar bara att just DEN planen såg rätt ut — samma
   skäl som transkriberingsspärren i poleringen.
2. ☠️ **Kampanjnamnet ÄR idempotensen.** Rutten har 300 sekunder och katalogen
   ~1 000 AE-rader, så körningen KOMMER att köras om. Utan stämpeln tar en
   omkörning 599 → 659 → 725, och svaret ser likadant ut båda gångerna.
3. ☠️ **Priset måste sluta på 9 — en grind, inte en förhoppning.**
   Avrundningsstrategin bor i `FyndplatsPricingConfig`, alltså utanför koden,
   och ett efterföljande blanksteg där har redan en gång tyst stängt av
   charm-prissättningen. `ejNiokrona` räknar i stället för att örespriser når kund.
4. ☠️ **Alla varianter eller ingen** (`variantavvikelse`). Ett halvt höjt pris
   är svårare att upptäcka än ett orört.
5. ☠️ **Okänt butikspris gissas aldrig** (`utanWixPris`), och **ett låst pris
   rörs aldrig** (`prisLasta`).
6. ☠️ **En höjning som skett men tappat sin stämpel höjs ALDRIG igen** — se nedan.

### ☠️ En tappad stämpel gör omkörningen till 499 → 549 → 609

Hittad av ARITMETIKEN, inte av ett fel. 478 redan höjda + 201 skrivna med noll
misslyckade skulle ge 679; nästa plan sa **678** och en rad mer att höja. Exakt
en produkt hade fått sitt PRIS skrivet utan att få sin STÄMPEL.

Skrivfönstret 17:58–18:02 låg rakt över AE-synkens `0 */2 * * *`, och synken gör
läs-ändra-skriv på samma mappningsrad på fyra ställen. En lost update skriver
över stämpeln utan att något kastar — rutten svarar 200, workflowen går grön.

Stämpeln är hela idempotensen, så en stämpel som kan gå förlorad är en
idempotens som kan gå förlorad.

☠️ **Grinden är ARITMETISK, inte en riktning — och första utkastet var fel på
just den punkten.** Det gatade på "butiken högre än mappningen" och fällde
`räknar på BUTIKEN`-testet, som hade rätt: butiken högre är också signaturen för
husets DOKUMENTERADE drift, där bäddsoffan `efaa0c7b` bar `grossSek: 3529` mot
4 539 kr i Wix. En sådan rad har aldrig höjts och SKA höjas.

Det som skiljer är att en tappad stämpel lämnar butikspriset på EXAKT det tal
kampanjen skulle ha skrivit. Grinden räknar därför om höjningen ur mappningens
tal och kräver exakt träff, ur samma `roundPrice` som planen själv använder.

⚠️ **Grinden hittade TVÅ, inte den ena aritmetiken pekade ut** — och de låg
inom de tolv drivande raderna, så det är ingen slump. De höjs inte, de RÄKNAS,
och sedan 2026-09-13 står deras wix-id i svaret och workflow-summeringen:
ett tal utan id är en oro, ett tal med id är ett beslut. Raderna kan ingen
annan mätning hitta i efterhand — de har varken stämpel eller drift kvar att
känna igen dem på.

### Kvittot

| | |
|---|---:|
| granskade mappningar | 5 745 |
| höjda | **732** |
| misslyckade | **0** |
| ej AliExpress (Aosom) | 4 754 |
| utan entydigt butikspris | 191 |
| variantavvikelse | 66 |
| redan höjd, stämpel tappad | 2 |
| **drivande efter körningen** | **0** |

Sista raden är kvittot: mappningen och butiken är i fas över hela AE-halvan —
samma sak som `jamforelsePris` byggdes för på Aosom-sidan. Live-verifierat på
tre sidor genom butiken (549, 1 749 och 4 899 kr), inte bara i API-svaret.

⚠️ **Vänta ut ISR:en vid den verifieringen.** Första hämtningen gav
`x-vercel-cache: STALE`, `age: 42 781` och det GAMLA priset; nästa hämtning gav
`HIT`, `age: 20` och det nya. Ett API-svar är inget kvitto, och en enstaka
sidhämtning är det inte heller.
