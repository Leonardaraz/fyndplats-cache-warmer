# -*- coding: utf-8 -*-
"""Runda 88 Steg 9: galleriordning + alt-texter.

Ordningen är husets: **kortet på plats 3, måttritningen sist.** Importen
lade bilderna i ordningen produkt-på-vitt, livsstil, MÅTTRITNING, detalj,
detalj (positionerna 1, 2, 3, 8 och 9 ur feeden). Ritningen flyttas därför
bakåt och kortet skjuts in som tredje bild.

☠️ Skickas `id` och ALDRIG `url` för filer som redan ligger i Media Manager.
   En wixstatic-adress i `url`-fältet får Wix att importera om bilden till
   en NY fil — halva lagringen var kopior innan det mättes upp 2026-08-28.

☠️ `media.main` skickas inte alls: den är read-only i V3 och härleds ur
   första posten.

⚠️ Alt-texterna är unika över hela rundan, inte bara inom produkten. Två
   färgsyskon med samma alt-text är två sidor som säger samma sak till
   Google.
"""
import json
import os

HAR = os.path.dirname(os.path.abspath(__file__))
L = lambda n: json.load(open(os.path.join(HAR, n), encoding="utf-8"))
bilder = L("bilder.json")
vid = L("variantid.json")
kortfiler = L("kort-ids.json")

ALT = {
 "b1dcd424": [
  "Blå sparkcykel för barn med svarta hjul och pojke i hjälm",
  "Pojke i hjälm på blå sparkcykel framför en glasfasad",
  "Faktakort för blå sparkcykel barn: 120 cm lång, 12-tumshjul, maxlast 50 kg",
  "Närbild på BMX-styret med tvärstag och stoppning",
  "Närbild på blå framgaffel och 12-tumshjul med EVA-däck",
  "Måttritning för sparkcykel: 120 cm lång, 52 cm bred, styre 80–88 cm"],
 "41269686": [
  "Vinröd sparkcykel för barn med svarta hjul och flicka i hjälm",
  "Vinröd sparkcykel med utfällt stöd på plattgång",
  "Faktakort för vinröd sparkcykel barn: 12-tumshjul och handbroms på bakhjulet",
  "Närbild på styret med bromshandtag på vinröd sparkcykel",
  "Närbild på styrets stoppning och fotplattan med stödet nedfällt",
  "Måttritning för vinröd sparkcykel: 120 × 52 cm och styre 80–88 cm"],
 "82b5a517": [
  "Helsvart sparkcykel för barn med pojke i hjälm bredvid",
  "Pojke i hjälm på svart sparkcykel i en park",
  "Faktakort för svart sparkcykel barn: 120 cm lång och maxlast 50 kg",
  "Närbild på svart framgaffel och 12-tumshjul",
  "Närbild på svart fotplatta med parkeringsstöd",
  "Måttritning för svart sparkcykel: 120 cm lång och styre 80–88 cm"],
 "e9cfa7bf": [
  "Vinröd sparkcykel med röda maghjul och röda handtag",
  "Barn med knäskydd på sparkcykel med röda hjul",
  "Faktakort för sparkcykel barn med röda hjul: Ø30 cm och 7 kg",
  "Närbild på den halkfria fotplattan sedd uppifrån",
  "Närbild på det raka styret med röda handtag",
  "Måttritning för sparkcykel med röda hjul: 118 cm lång och 11 cm markfrigång"],
 "2b8297df": [
  "Mörkblå sparkcykel med blå maghjul och blå handtag",
  "Barn med knäskydd på sparkcykel med blå hjul",
  "Faktakort för sparkcykel barn med blå hjul: Ø30 cm och maxlast 50 kg",
  "Närbild på fotplattan på mörkblå sparkcykel",
  "Närbild på styrets stoppning på mörkblå sparkcykel",
  "Måttritning för sparkcykel med blå hjul: 118 × 52 cm och styre 80–88 cm"],
 "9941383e": [
  "Mörkgrön sparkcykel med gröna maghjul och gröna handtag",
  "Barn med knäskydd på sparkcykel med gröna hjul",
  "Faktakort för sparkcykel barn med gröna hjul: Ø30 cm och 7 kg",
  "Närbild på grönt handtag och styrets stoppning",
  "Närbild på den halkfria fotplattan på grön sparkcykel",
  "Måttritning för sparkcykel med gröna hjul: 118 cm lång och 11 cm markfrigång"],
 "e4e5a8ef": [
  "Blå sparkcykel med korg och stänkskärmar, flicka i hjälm åker",
  "Flicka i hjälm åker blå sparkcykel med korg framför ett hus",
  "Faktakort för blå sparkcykel med korg: 139 cm lång och maxlast 100 kg",
  "Blå sparkcykel med blommor i korgen vid en gräsmatta",
  "Närbild på bromshandtag och handtag på blå sparkcykel",
  "Måttritning för sparkcykel med korg: 139 cm lång, 58 cm bred, fotplatta 37 cm"],
 "b03784dc": [
  "Rosa sparkcykel med vit korg och vita skärmar, flicka i hjälm åker",
  "Flicka i hjälm åker rosa sparkcykel med vit korg framför ett hus",
  "Faktakort för rosa sparkcykel med korg: 139 cm lång och maxlast 100 kg",
  "Rosa sparkcykel med vit korg parkerad vid en stenmur",
  "Närbild på den vita korgen på rosa sparkcykel",
  "Måttritning för rosa sparkcykel med korg: 139 × 58 cm och styre 90–96 cm"],
}

# ── Grindar innan något genereras ────────────────────────────────────────
sedda = {}
for k, texter in ALT.items():
    if len(texter) != 6:
        raise SystemExit("%s har %d alt-texter, ska vara 6" % (k, len(texter)))
    for t in texter:
        if t in sedda:
            raise SystemExit("alt-texten %r delas av %s och %s" % (t, sedda[t], k))
        sedda[t] = k
        for ord_ in ("HOMCOM", "Outsunny", "PawHut", "Aiyaplay", "Aosom",
                     "Tyskland", "Kina", "Spanien", "Polen"):
            if ord_.lower() in t.lower():
                raise SystemExit("alt-texten nämner %r: %r" % (ord_, t))

rader = []
for k, b in bilder.items():
    if len(b) != 5:
        raise SystemExit("%s har %d råbilder, väntade 5" % (k, len(b)))
    # produkt, livsstil, KORT, detalj, detalj, MÅTTRITNING
    ordning = [b[0], b[1], kortfiler[k], b[3], b[4], b[2]]
    rader.append({"kort": k, "id": vid[k]["id"],
                  "items": [{"id": f, "altText": a}
                            for f, a in zip(ordning, ALT[k])]})

json.dump(rader, open(os.path.join(HAR, "media-plan.json"), "w",
                      encoding="utf-8"), ensure_ascii=False, indent=1)
print("media-plan.json: %d produkter, %d bilder" % (len(rader), 6 * len(rader)))
