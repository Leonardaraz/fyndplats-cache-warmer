# -*- coding: utf-8 -*-
"""Rattar en DOD KORSLANK pa en publicerad sida.

☠️ Rundan publicerade 9ee2fa6e med en lank till `hundsoffa-snackrygg-gra`
   (c11948ac) — som medvetet INTE publicerades, eftersom den ar OUT_OF_STOCK.
   Uppmatt: den URL:en svarar 404 medan den grona sidan svarar 200. Rundan
   satte alltsa en dod lank pa en LIVE kundsida.

   Dessutom lovade FAQ:n "Modellen finns i tva farger — se lankarna hogre
   upp". Loftet gick inte att infria: den andra fargen ar just den doda
   lanken.

✅ Lagningen byter den doda lanken mot `hundsoffa-sammet-102-cm` (4c5d4687),
   som REDAN lankar hit utan att fa nagot tillbaka — samma envagsmonster som
   #480. En rattning som stanger tva hal.

☠️ Sokt i HELA batchen, inte bara dar fyndet syntes: exakt EN publicerad sida
   bar den doda sluggen. Batch 64:s `dognsvarv` lagades tre ganger for att
   varje fynd rattades dar det stod.

Texten byggs av `texter.bygg` — ingen handavskrift behovs for rundans EGNA
sidor, till skillnad fran grannsidan i `bygg-kors-64f5d64b.py`.
"""
import io, json, sys

sys.path.insert(0, "..")
import grind, grindar, texter                                     # noqa: E402

PID = "9ee2fa6e"
REVISION = "7"
DOD = texter.SLUG["c11948ac"]
NY = texter.SLUG["4c5d4687"]

html = texter.bygg(PID)

fel = list(grind.granska(PID, html))
if DOD in html:
    fel.append("den doda sluggen %s star kvar" % DOD)
if NY not in html:
    fel.append("den nya lanken %s saknas" % NY)
if "två färger" in html:
    fel.append("fargloftet star kvar utan nabar andra farg")
for tecken in grindar.homoglyfer(html):
    fel.append("osynligt/homoglyf: %r" % (tecken,))
for artnr in grindar.ARTNR.findall(html):
    fel.append("ARTIKELNUMMER: %r" % (artnr,))

# Ingen annan publicerad sida far bara den doda sluggen heller.
for p in texter.SLUG:
    if p not in (PID, "c11948ac") and DOD in texter.bygg(p):
        fel.append("aven %s bar den doda sluggen" % p)

if fel:
    print("GRINDEN FALLER — inget skrivet:")
    for f in fel:
        print("  ☠️", f)
    raise SystemExit(1)

payload = {"product": {"revision": REVISION, "plainDescription": html},
           "fieldMask": ["plainDescription"]}
assert set(payload["product"]) == {"revision", "plainDescription"}
json.dump(payload, io.open("dodlank-9ee2fa6e.json", "w", encoding="utf-8"),
          ensure_ascii=False)
print("GRINDEN GRON — dodlank-9ee2fa6e.json skriven")
print("  revision   ", REVISION)
print("  beskrivning", len(html), "tecken")
print()
i = html.index("Passar inte")
print(html[i - 10:i + 320])
