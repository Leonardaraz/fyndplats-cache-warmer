# -*- coding: utf-8 -*-
"""Runda 89 Steg 9: galleriordning + alt-texter.

Ordningen är husets: **kortet på plats 3, måttritningen sist.** Feedens
rena positioner kom hem som produkt-på-vitt, livsstil, MÅTTRITNING, detalj,
detalj — ritningen flyttas alltså bakåt och kortet skjuts in som tredje bild.

☠️ `c4375606` HAR INGEN MÅTTRITNING, och dess fjärde bild bär TYSK TEXT
   inbränd i pixlarna ("PERFEKTES GESCHENK FÜR IHR KIND!" med fyra tyska
   punkter). Den plockas därför bort helt: produkten får FEM bilder, inte
   sex, och `LIVSSTIL`-platsen fylls av husfotot. Att behålla den och hoppas
   att ingen zoomar är samma fel som att skriva ut artikelnumret.

   ⚠️ Filen ligger kvar i Media Manager efter borttagningen. Den blir
   föräldralös och städas av nattens `aosom-media-cleanup` — den enda vägen
   som faktiskt frigör lagring (papperskorgen räknas fortfarande).

☠️ Skickas `id` och ALDRIG `url` för filer som redan ligger i Media Manager.
   En wixstatic-adress i `url`-fältet får Wix att importera om bilden till en
   NY fil — halva lagringen var kopior innan det mättes upp 2026-08-28.

☠️ `media.main` skickas inte alls: den är read-only i V3 och härleds ur
   första posten.

⚠️ Alt-texterna är unika över HELA rundan, inte bara inom produkten. Två
   färgsyskon med samma alt-text är två sidor som säger samma sak till Google
   — och den här rundan har tre par som skiljs bara på färgen.
"""
import json
import os

HAR = os.path.dirname(os.path.abspath(__file__))
L = lambda n: json.load(open(os.path.join(HAR, n), encoding="utf-8"))
bilder = L("bilder.json")
vid = L("variantid.json")
kortfiler = L("kort-ids.json")

# kort -> (råbildsindex i ordning, alt-texter). KORT står som None.
PLAN = {
 "c4375606": ([0, 2, None, 4, 1], [
  "Svart sparkcykel för barn med 16-tumshjul och flicka i hjälm bredvid",
  "Flicka åker svart sparkcykel på en uppfart framför ett hus",
  "Faktakort för svart sparkcykel barn: 143 cm lång, V-broms och maxlast 100 kg",
  "Närbild på bakhjulets V-broms och ekerfälg på svart sparkcykel",
  "Pojke med ryggsäck står på svart sparkcykel med kromad gaffel"]),
 "79186373": ([0, 1, None, 3, 4, 2], [
  "Rosa sparkcykel för barn med 16-tumshjul och flicka i hjälm",
  "Flicka åker rosa sparkcykel på en asfalterad parkväg",
  "Faktakort för rosa sparkcykel barn: 143 cm lång och två lika stora 16-tumshjul",
  "Fotplattan på rosa sparkcykel sedd snett uppifrån",
  "Närbild på bromshandtag och handtag på rosa sparkcykel",
  "Måttritning för sparkcykel: 143 cm lång, 58 cm bred och styre 92–100 cm"]),
 "479e9c2e": ([0, 1, None, 3, 4, 2], [
  "Svart sparkcykel med röd framgaffel och pojke i hjälm som visar tummen upp",
  "Svart sparkcykel med röd framgaffel parkerad på stenplattor",
  "Faktakort för svart sparkcykel barn: 120 cm lång, styre från 75 cm och 8,2 kg",
  "Närbild på det breda styret med bromshandtag på svart sparkcykel",
  "Närbild på röd framgaffel och Ø12-tumshjul med silverfärgad ekerfälg",
  "Måttritning för sparkcykel: 120 cm lång, 58 cm bred och styre 75–80 cm"]),
 "d9239c8e": ([0, 1, None, 3, 4, 2], [
  "Turkos sparkcykel för barn med lågt styre och pojke i hjälm",
  "Turkos sparkcykel med lågt styre parkerad på stenplattor",
  "Faktakort för turkos sparkcykel barn: 120 cm lång, 8,2 kg och maxlast 100 kg",
  "Turkos sparkcykel sedd från sidan med utfällt stöd",
  "Turkos sparkcykel snett bakifrån med fotplattan i blickfånget",
  "Måttritning för turkos sparkcykel: 120 × 58 cm och styre 75–80 cm"]),
 "4fd26086": ([0, 1, None, 3, 4, 2], [
  "Orange sparkcykel med stort framhjul och pojke i hjälm bredvid",
  "Pojke åker orange sparkcykel med stort framhjul på en gångväg",
  "Faktakort för orange sparkcykel barn: framhjul Ø41 cm och bakhjul Ø30 cm",
  "Närbild på det stora framhjulet Ø41 cm på orange sparkcykel",
  "Närbild på styret och styrstammen på orange sparkcykel",
  "Måttritning för sparkcykel med stort framhjul: 135 cm lång och styre 88–94 cm"]),
 "89deaca7": ([0, 1, None, 3, 4, 2], [
  "Turkos sparkcykel med stort framhjul och pojke i hjälm bredvid",
  "Pojke åker turkos sparkcykel med stort framhjul på en gångväg",
  "Faktakort för turkos sparkcykel barn: framhjul Ø41 cm och maxlast 100 kg",
  "Närbild på det stora framhjulets däck och ekerfälg på turkos sparkcykel",
  "Närbild på det svarta styret på turkos sparkcykel",
  "Måttritning för turkos sparkcykel: 135 × 58 cm och styre 88–94 cm"]),
}

# ── Grindar innan något genereras ────────────────────────────────────────
sedda = {}
for k, (ordning, alt) in PLAN.items():
    if len(ordning) != len(alt):
        raise SystemExit("%s: %d bilder men %d alt-texter"
                         % (k, len(ordning), len(alt)))
    if ordning.count(None) != 1:
        raise SystemExit("%s: kortet ska förekomma exakt en gång" % k)
    if ordning[2] is not None:
        raise SystemExit("%s: kortet ligger inte på plats 3" % k)
    for t in alt:
        if t in sedda:
            raise SystemExit("alt-texten %r delas av %s och %s" % (t, sedda[t], k))
        sedda[t] = k
        for ord_ in ("HOMCOM", "Outsunny", "PawHut", "Aiyaplay", "Aosom",
                     "Tyskland", "Kina", "Spanien", "Polen", "artikelnummer"):
            if ord_.lower() in t.lower():
                raise SystemExit("alt-texten nämner %r: %r" % (ord_, t))

rader = []
for k, (ordning, alt) in PLAN.items():
    b = bilder[k]
    if len(b) != 5:
        raise SystemExit("%s har %d råbilder, väntade 5" % (k, len(b)))
    filer = [kortfiler[k] if i is None else b[i] for i in ordning]
    if len(set(filer)) != len(filer):
        raise SystemExit("%s: samma fil två gånger i galleriet" % k)
    rader.append({"kort": k, "id": vid[k]["id"],
                  "items": [{"id": f, "altText": a} for f, a in zip(filer, alt)]})

json.dump(rader, open(os.path.join(HAR, "media-plan.json"), "w",
                      encoding="utf-8"), ensure_ascii=False, indent=1)
print("media-plan.json: %d produkter, %d bilder"
      % (len(rader), sum(len(r["items"]) for r in rader)))
