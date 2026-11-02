### ✅ Stämpeln läggs på den färska raden — synken skriver inte över (2026-09-30)

Synken läser alla mappningar när den startar och sparade tillbaka hela raden
som den såg ut då: `{ ...p.m, … }`. En körning tar minuter, och allt som
skrevs på raden under tiden försvann tyst. Spegeln `4117e161` tappade sin
sammanslagning så 03:20 (B71 i `tools/polish-gates/FLAGGADE.md`), och nästa
sammanslagning vägrades (`behall_har_redan_optioner`). Samma väg kunde ta
tillbaka poleringens SKU och status, ångra en ommappning och återskapa en
raderad rad.

Nu läses raden om strax före stämpeln, för hela tuggan i ett anrop sedan
2026-10-29 (`lasMappningar` → `getMappingsByWixProductIds`, se nästa avsnitt),
och `stampelPaFarskRad` lägger bara synkens egna fält på den färska raden:
`aosomSyncedQty` och `aosomSyncedAt`, och per variant `aosomSyncedQty`,
`grossSek`, `landedCostSek` och `costUsd`. Varianterna matchas på Wix-id och
artikel, aldrig på plats i listan, så en färg som lagts till under körningen
lämnas orörd.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **Hellre ingen stämpel än en som ljuger.** Har raden raderats, bytt
   artikel, bytt form (vanlig ↔ sammanslagen) eller tappat en variant som
   skulle stämplas, skrivs ingenting. Wix är redan skrivet. Nästa körning läser
   den färska raden och stämplar då, eller rättar driften.
2. ☠️ **Det räknas.** `stampelHoppade` står i svaret, loggraden, audit-raden
   och workflow-summeringen, med skälet i `errors`. Talet ska vara noll utanför
   en sammanslagning eller ommappning.
3. **Depen är obligatorisk**, av samma skäl som `listaRecensionsbilder` i
   media-städningen: en valfri dep glöms av nästa anropare.
4. **Torrkörningen läser inte om raden.** Den stämplar ingenting, så det finns
   inget att skydda.

⚠️ Stämplarna sparas fortfarande med en villkorslös upsert, så ett fönster
mellan omläsningen och skrivningen finns kvar: tuggans två anrop, under en
sekund. Förut var fönstret hela körningen.

⚠️ **En överhoppad stämpel efter en PRISskrivning läker inte av sig själv.**
Wix har det nya priset, men mappningens `grossSek`, `landedCostSek` och
`costUsd` står kvar på det gamla. Nästa körning jämför mot butiken, ser samma
pris och skriver inget. Det är samma klass som de tjugo drivande raderna, men
bara för en rad som ändrats mitt i en prisskrivning, och priser skrivs bara
03:20 och vid skarpa körningar för hand. En omkörning hjälper inte, av samma
skäl. Står `stampelHoppade` över noll efter en körning med priser, titta på
produkten i `errors`: mappningens pris kan vara det gamla tills kostnaden
ändras nästa gång.
