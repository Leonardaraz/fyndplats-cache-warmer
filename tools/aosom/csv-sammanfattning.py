#!/usr/bin/env python3
"""Sammanfattar Aosoms bulkorder-CSV utan att skriva ut något känsligt.

☠️ VARFÖR DEN HÄR FILEN FINNS, OCH INTE EN RAD I WORKFLOWEN.

Filen den läser bär `Full name`, `Address line 1`, `Address line 2`,
`Postal code`, `City` och `Phone` per order, plus Aosoms artikelnummer —
den strängen dealproffsen.se publicerar som sku/mpn. Repot är publikt och
Actions-loggar går att läsa utan inloggning, så allt som skrivs här är
publicerat.

Första försöket var ett `cat` rakt till loggen. Andra försöket var en awk
med `-F'","'`, alltså ett antagande om att varje fält är citerat. Det är
det inte: `falt()` i lib/aosom/bulk-order.ts citerar BARA värden som
innehåller `"`, `,` eller `;`. En order med ETT artikelnummer och ett namn
utan komma blir därför helt ociterad, awk hittar ingen avgränsare alls, och
`$NF` blir HELA RADEN. Uppmätt: den "redigerade" utskriften skrev ut namn,
gatuadress, postnummer, ort och telefon på varje rad — precis den läcka den
byggdes för att stoppa.

Därför: en riktig CSV-parser, kolumner slagna på NAMN och inte på position,
och en allowlist över vad som får skrivas ut. Och därför en egen fil i
stället för en rad i YAML — en rad i en workflow går inte att testa, och det
var oprövbarheten som lät båda felen gå igenom.
"""

import csv
import sys

# ☠️ ALLOWLIST, INTE DENYLIST. Ett nytt kundfält i CSV_KOLUMNER ska inte
# börja läcka bara för att ingen kom ihåg att lägga till det i en
# förbudslista — samma skäl som allowlisten i /api/admin/mapping.
SKUS = "SKUs"
REFERENS = "Reference"


def sammanfatta(fil):
    with open(fil, newline="", encoding="utf-8") as f:
        rader = csv.reader(f)
        try:
            kolumner = next(rader)
        except StopIteration:
            print("::error::CSV:n är tom — ingen rubrikrad", file=sys.stderr)
            return 1

        # Saknas en kolumn ska jobbet FALLA, inte gissa på position. En
        # positionsgissning är hur `sku`-förväxlingen uppstod.
        for namn in (SKUS, REFERENS):
            if namn not in kolumner:
                print(f"::error::CSV:n saknar kolumnen {namn!r}", file=sys.stderr)
                return 1
        i_skus = kolumner.index(SKUS)
        i_ref = kolumner.index(REFERENS)

        antal = 0
        for rad in rader:
            if not rad or all(not f.strip() for f in rad):
                continue
            antal += 1
            skus = [s for s in rad[i_skus].split(",") if s.strip()]
            print(f"    rad {antal}: {len(skus)} artikelnummer, referens {rad[i_ref]}")

        if antal == 0:
            print("::error::CSV:n har rubrik men inga orderrader", file=sys.stderr)
            return 1
        return 0


if __name__ == "__main__":
    sys.exit(sammanfatta(sys.argv[1] if len(sys.argv) > 1 else "aosom-bulkorder.csv"))
