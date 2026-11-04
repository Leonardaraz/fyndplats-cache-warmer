## Långsvansen bärs av smala kategorier, inte av produktsidor (2026-09-24)

Leonards fråga: ett sämre sökord på sida 1 ger mer trafik än det bästa på
sida 3. Det stämmer, och det är mätt. Av domänens 30 sökord på sida 1 har 26
under 200 sökningar i månaden, och av 62 sökord över 500 ligger inget där.

Men sidtypen avgör. dealproffsen.se säljer samma Aosom-varor och ligger topp
10 på 1 425 sökord, mot våra 30. Deras produktsidor ligger topp 10 på 120
långsvansord över 200 sökningar. Vi syns i topp 100 på 8 av dem, även där vår
titel börjar med exakt ordet (*Hundsoffa 98 cm i blått*). Titeln är inte
bromsen, sidans styrka är.

☠️ **Lägg därför ett mindre sökord på en smal kategori, inte på en
produktsida.** Efter #647 länkas varje underkategori från varje sida via
menyn, och produktsidorna har inga sådana länkar. Välj ord där en jämnstor
konkurrent redan rankar med samma sidtyp. Urvalsregeln och mätningen står i
`tools/polish-assets/runda-s14-langsvans-kategorier/`.

⚠️ **Omätningen 2026-10-30 är provet.** Om S14-sidorna inte rör sig medan
dealproffsen ligger på plats 1–5 med samma upplägg, är det domänens styrka som
bromsar. Då är nästa steg externa länkar, inte fler sidor.

### Brödsmulan: produktens egen avdelning först (2026-11-04)

ChatGPT:s audit 2026-11-03 hittade en uppresningsfåtölj med brödsmulan Skönhet & Hälsa →
Massage & Återhämtning, medan bläddringsraden sa "4 av 244 i Fåtöljer". Det var två fel:

- **Data:** tre stolar var aldrig kopplade till Uppresningsfåtöljer (runda n328 m.fl.).
  Kopplade 2026-11-04.
- **Regeln:** butiken tog den smalaste underkategorin oavsett avdelning, och bläddringsraden
  valde med en annan regel.

Butiken (headless-site `lib/breadcrumb-category.ts`) väljer nu den smalaste underkategorin
bland produktens EGNA avdelningar först, och bläddringsraden följer brödsmulan.
Långsvansregeln ovan står kvar inom avdelningen. Kategoristeget i polerrundan stoppar
dessutom en plan där namnets huvudfras pekar ut en kategori som saknas
(`lib/polish/typkategori.ts`).

**Kategorikollen** (workflow "Kategorikoll", `app/api/admin/kategorikoll`) räknar över hela
katalogen. Den bara läser, och loggen bär antal, kategorinamn och Wix-id. Den räknar:

- brödsmulan före och efter regeln, grupperad från → till;
- produkterna vars namn pekar ut en kategori de inte ligger i.

Regeln i `lib/kategorikoll/brodsmula.ts` är en kopia av butikens och används bara till
mätningen. Testfallen är butikens, så att en skillnad syns.

