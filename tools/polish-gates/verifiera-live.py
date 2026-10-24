#!/usr/bin/env python3
"""verifiera-live.py <plan.json> <webblasare-utskrift.txt>: jämför butikens vy per kombination, mätt i en riktig webbläsare, med planens ägare (2026-10-24).

Skriver ingenting. Exit 1 vid minsta avvikelse.

<plan.json> är en ägarplan för tools/polish-gates/bygg-agare.py (`agare-<id8>.json`, bara första posten läses). <webblasare-utskrift.txt> är utskriften från
live-galleri.mjs (valen som färgrutor eller knappar) eller live-galleri-kortfarg.mjs (färgen som kort, storleken som knappar): en rad `KOMBO ... {"val":"Färg=X | Storlek=Y","galleri":"hex6,hex6"}`
per kombination. live-galleri-kort.mjs (båda axlarna som kort) skriver samma form och går också.

Regeln som räknas är butikens (`imageKopplingar`, synligaBilderForKombination på headless-site sedan 2026-10-24): en bild syns när den, i VARJE option som kopplar den, är
kopplad till det valda valet. Flera val i samma option betyder "något av dem". Bilden `-` har ingen ägare och syns alltid. Valens namn knyts till sin option genom vilka val
webbläsaren faktiskt visade, så ett namn som finns i båda optionerna går inte att knyta ("?" och en avvikelse).

Varför ett eget skript (2026-10-24, de 17 sidorna efter butiksmergen): kolla-agare.py läser butikens sidodata (vad butiken tänker visa), men bara webbläsaren visar vad kunden
SER. De två kan skilja sig åt när sidans cache är gammal (age 600 s gav fyra falska ☠️ i första körningen) eller när väljaren i butiken inte klickar som man tror.
Det här skriptet kontrollerar webbläsarens galleri mot planen, en kombination i taget, utan att läsa någon sidodata.

☠️ Butikens cache fylls på var femte minut efter en ändring i Wix (cron `uppdatera-andrade`). Ett ☠️ direkt efter en skrivning är oftast en gammal sida: mät om efter några minuter
innan du kallar den trasig.
☠️ Bilder som tagits bort med flit ska också tas bort ur planen innan körningen, annars svarar skriptet "saknas" på dem (samma fälla som kolla-agare.py, lärdom 177).
"""
import json
import sys

if len(sys.argv) != 3:
    sys.exit(__doc__)
plan = json.load(open(sys.argv[1], encoding="utf-8"))[0]["agare"]
rader = [l for l in open(sys.argv[2], encoding="utf-8") if l.startswith("KOMBO") and '"galleri"' in l]
komb = []
for l in rader:
    j = json.loads(l[l.index("{"):])
    val = [p.split("=", 1) for p in j["val"].split(" | ")]
    komb.append(({k.strip().lower(): v.strip().lower() for k, v in val}, [h for h in j["galleri"].split(",") if h]))
if not komb:
    print("inga kombinationer lästes")
    sys.exit(1)
optioner = sorted({k for sel, _ in komb for k in sel})
varden = {o: {sel[o] for sel, _ in komb if o in sel} for o in optioner}


def option_av(namn):
    n = namn.strip().lower()
    return [o for o in optioner if n in varden[o]]


avv = 0
for sel, galleri in komb:
    vantat = set()
    for h, a in plan.items():
        if a == "-":
            vantat.add(h)
            continue
        lista = a if isinstance(a, list) else [a]
        grupper = {}
        okand = False
        for n in lista:
            t = option_av(n)
            if len(t) != 1:
                okand = True
                break
            grupper.setdefault(t[0], set()).add(n.strip().lower())
        if okand:
            print("  ? ägaren", lista, "för", h, "går inte att knyta till en option")
            avv += 1
            continue
        if all(sel.get(o) in g for o, g in grupper.items()):
            vantat.add(h)
    sett = set(galleri)
    saknas, extra = sorted(vantat - sett), sorted(sett - vantat)
    status = "OK " if not saknas and not extra else "☠️ "
    if status != "OK ":
        avv += 1
    print(status + " × ".join(sel[o] for o in optioner if o in sel).ljust(46), len(galleri), "bilder", ("saknas " + ",".join(saknas)) if saknas else "", ("extra " + ",".join(extra)) if extra else "")
print("AVVIKELSER:", avv)
sys.exit(1 if avv else 0)
