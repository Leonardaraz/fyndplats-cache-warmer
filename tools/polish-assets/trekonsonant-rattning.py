# -*- coding: utf-8 -*-
"""Uppgift #509: ORDLISTAN för trekonsonantsrättningen på publicerade sidor.

☠️ FILEN FINNS FÖR ATT LISTAN SKA GÅ ATT GRINDA INNAN DEN LÄMNAR CHATTEN.
   Runbokens mätning 2026-09-04: text skriven inline i ett API-anrop gav 9 fel,
   text som passerat en fil och en grind gav 0. Här är det inte prosa som
   skrivs utan en SLUTEN substitutionskarta — och det är kartan som ska
   grindas. Tre krav, alla mekaniska:

     1. utfallet får inte bära tre lika konsonanter,
     2. utfallet ska skilja sig från indata med EXAKT ett borttaget tecken,
        och det tecknet ska vara samma bokstav som de två som blir kvar,
     3. varje par ska ha samma inledande versal/gemen som originalet.

   Krav 2 är det som gör listan ofarlig: en rättning kan per konstruktion
   inte skriva om meningen, bara stryka en bokstav.

⚠️ Listan rör ALDRIG sluggen. En slug är en URL; att ändra den kräver en
   redirect och är ett eget beslut.
"""
import re
import sys

# sammansättning → korrekt form. Alla följer samma regel som `buss`+`station`.
RATTNING = {
    "hoppplattform": "hopplattform",
    "Hoppplattform": "Hopplattform",
    "kryssstag": "krysstag",
    "kryssstagad": "krysstagad",
    "kryssstagen": "krysstagen",
    "platttrycks": "plattrycks",
    "dörrramen": "dörramen",
    "kattträd": "katträd",
    "Kattträd": "Katträd",
    "kattträdet": "katträdet",
    "Kattträdet": "Katträdet",
    "hisssen": "hissen",
    "rodddragningen": "roddragningen",
    "snabbboll": "snabboll",
    "spännnät": "spännät",
    "Spännnät": "Spännät",
    "giraffform": "girafform",
    "soffform": "sofform",
    "soffformad": "sofformad",
}

# ☠️ `www` ÄR INTE ETT SVENSKT ORD. Grinden fällde det på fjorton publicerade
#    sidor — varenda en bara för att brödtexten länkar till www.fyndplats.se.
#    En förkortning av tre initialer lyder inte under en regel om
#    SAMMANSÄTTNINGAR, och ett larm som fyrar på varje korrekt sida lär
#    mottagaren att sluta läsa. Undantaget bor i `grindar.TREKONSONANT_OK`.
EJ_FEL = {"www"}


def _sjalvtest():
    fel = []
    trek = re.compile(r"([bcdfghjklmnpqrstvwxz])\1\1", re.I)
    for fran, till in RATTNING.items():
        if trek.search(till):
            fel.append("%r bär fortfarande tre lika konsonanter" % till)
        if len(fran) - len(till) != 1:
            fel.append("%r → %r stryker %d tecken, ska stryka exakt 1"
                       % (fran, till, len(fran) - len(till)))
            continue
        # Exakt ETT struket tecken, och det ska vara den upprepade bokstaven.
        i = 0
        while i < len(till) and fran[i] == till[i]:
            i += 1
        if fran[:i] + fran[i + 1:] != till:
            fel.append("%r → %r är inte EN struken bokstav" % (fran, till))
        elif i > 0 and fran[i].lower() != fran[i - 1].lower():
            fel.append("%r stryker %r som inte upprepar föregående bokstav"
                       % (fran, fran[i]))
        if fran[0].isupper() != till[0].isupper():
            fel.append("%r → %r byter versalläge" % (fran, till))
    return fel, len(RATTNING)


if __name__ == "__main__":
    f, n = _sjalvtest()
    print("trekonsonant-rattning: %d par, %d fel" % (n, len(f)))
    for x in f:
        print("  ☠️", x)
    sys.exit(1 if f else 0)
