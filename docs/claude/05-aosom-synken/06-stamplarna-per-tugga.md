### Stämplarna läses och sparas en tugga i taget (2026-10-29)

Efter flytten till Wix CMS stannade lagerkörningen på tidsbudgeten. Körningen
00:20 UTC skrev 470 saldon, granskade 3 150 av 4 809 och lämnade 1 659 till
nästa. Stämpeln läste och sparade en rad i taget, alltså två Wix-anrop per
skriven produkt. Uppmätt samma dag tog en läsning 110–220 ms, och stämplarna
åt runt 200 av 240 sekunder. I Postgres tog samma anrop millisekunder.

Nu stämplas en tugga i taget (`stamplaTuggan`). Tuggans rader läses om i ett
anrop (`lasMappningar` → `getMappingsByWixProductIds`, `$in` på `_id`, femtio
rader på 140–270 ms), och stämplarna sparas i ett (`sparaMappningar` →
`saveMappings` → `sparaManga`). Det blir två anrop per tugga om femtio i
stället för upp till hundra.

Tre egenskaper som inte ska tas bort:

1. ☠️ **Stämplarna läggs efter tuggans alla Wix-skrivningar**, och bara för
   produkter vars skrivning gick igenom. "Wix före mappningen" gäller som
   förut, per produkt.
2. ☠️ **Går omläsningen inte att göra stämplas ingen i tuggan**, och varje
   produkt räknas som misslyckad. Förut föll bara den produkt vars läsning
   föll. En stämpel på ögonblicksbilden hade kunnat skriva över det som hänt
   under körningen. Nästa körning ser driften mot butiken och stämplar då.
3. **En rad räknas som sparad bara när Wix bekräftat den** (`sparaManga`, samma
   regler som `tolkaBulkUtfall`). En rad som inte sparades räknas som
   misslyckad, och de andra står kvar.
