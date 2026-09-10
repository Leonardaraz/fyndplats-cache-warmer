# -*- coding: utf-8 -*-
"""Bygger facit-live.json ur skrivning.json — det som FAKTISKT skrevs till Wix.

⚠️ Facit är alltså "det vi skrev", och den RENDERADE SIDAN är den oberoende
sidan av jämförelsen. Runda 119 läste facit ur katalogen efter publiceringen;
här är källan `skrivning.json`, som är samma sträng som PATCH-kroppen bar.
Namn, slug och titel är dessutom kvitterade ur PATCH-svaren.
"""
import json
import re

import matt as M

d = json.load(open("skrivning.json"))
ut = {}
for pid in M.ALLA:
    s = d[pid]
    text = " ".join([s["namn"], s["titel"], s["meta"],
                     re.sub(r"<[^>]+>", " ", s["html"])])
    ut[pid] = {
        "slug": s["slug"],
        "namn": s["namn"],
        "titel": s["titel"],
        "tal": sorted(set(re.findall(r"\d+(?:,\d+)?", text))),
        # ☠️ `farg` är ETT INTERNT licensfält för textgrindens
        #    färgkontroll och står inte nödvändigtvis på sidan:
        #    c88b5bbb bär `farg="ekfärgad"` medan varje mening
        #    säger "ljus ekoptik". `farg_lang` ÄR spec-tabellens
        #    renderade "Färg:"-värde — alltså det sidan påstår.
        "farg": M.M[pid]["farg_lang"],
    }
json.dump(ut, open("facit-live.json", "w"), ensure_ascii=False, indent=1)
print(f"facit-live.json: {len(ut)} produkter, "
      f"{sum(len(v['tal']) for v in ut.values())} tal")
