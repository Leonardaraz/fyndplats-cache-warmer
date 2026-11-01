### ☠️ En levande fyndauktion äger priset (2026-10-13)

Sedan priskörningarna går 09:20 och 15:20 UTC ligger två av dem mitt i
auktionstimmarna (07–19 svensk tid). Auktionen sänker priset ett steg i
timmen, och tick-cronen skriver bara när steget byts. Hade synken skrivit
regelpriset över steget hade det stått kvar till nästa steg, och auktionen
återställer sitt eget listpris när dagen är slut.

`lasAuktionsprodukter` läser produkterna med en auktion i status `live` en
gång per körning, och synken rör inte deras pris. Lagret synkas som vanligt.
`iAuktion` och `iAuktionProdukter` (Wix-id) står i svaret, loggraden,
audit-raden och workflow-summeringen.

Fyra egenskaper som inte ska tas bort:

1. ☠️ **En främjad auktion som inte startat räknas också.** Listpriset lästes
   när den främjades, och ett nytt pris före starten hade gjort startpriset
   till ett annat än det kunden såg dagen före.
2. ☠️ **Går auktionerna inte att läsa skrivs inga priser alls i körningen**,
   men lagret synkas. Felet står i `prislistaFel` och fäller workflow-jobbet.
3. **Spärren ligger före uträkningen**, som `prisLast`, så en produkt i
   auktion hamnar aldrig i `varningar`.
4. **Depen är obligatorisk**, av samma skäl som `lasMappningar`.

När auktionen är slut skriver nästa priskörning regelpriset.
