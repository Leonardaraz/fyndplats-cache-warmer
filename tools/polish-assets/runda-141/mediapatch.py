# -*- coding: utf-8 -*-
"""Bygger media-PATCH-kroppen ur galleri-facit + alt-texterna.

☠️ KROPPEN KOMPONERAS ALDRIG FÖR HAND. `ExecuteWixAPI` svarar 403, så
   skrivningen går via `CallWixSiteAPI` där kroppen klistras in — och det är
   precis den risk husets fil-regel finns för. Filen genereras här ur
   `galleri-facit.json` (ordningen) och `alttexter.ALT` (texterna), grindas
   av `alttexter.granska` först, och det som klistras in är filens innehåll.

☠️ FORMEN ÄR MÄTT, inte gissad — den speglar `lib/wix/client.ts#setProductMedia`:
   `id` för en fil som redan ligger i Media Manager (skickas `url` importerar
   Wix om den till en NY fil), `media.main` skickas ALDRIG (read-only i V3,
   härleds ur första posten), och fältmasken är `["media"]`.
"""
import io
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import alttexter as A      # noqa: E402
import texter as T         # noqa: E402

HAR = os.path.dirname(os.path.abspath(__file__))
GALLERI = json.load(io.open(os.path.join(HAR, "galleri-facit.json"),
                            encoding="utf-8"))
IDS = json.load(io.open(os.path.join(HAR, "ids.json"), encoding="utf-8"))

# Revisioner lästa ur publiceringens PATCH-svar (Steg 13).
REVISION = {
    "8de3c3ef": "8", "7b818c3b": "6", "8a0e05f4": "6", "b4961e6f": "8",
    "83b2cf8b": "7", "a4bbe667": "8", "18b94738": "7",
}


def kropp(pid):
    fel = A.granska(pid) + A._kortformkoll()
    assert not fel, "ALT-GRINDEN FALLER på %s: %r" % (pid, fel)
    rader = GALLERI[pid]["rader"]
    items = []
    for r in rader:
        alt = A.ALT[pid][r["pos"]]
        items.append({"id": r["id"], "altText": alt})
    assert len(items) == GALLERI[pid]["antal"], "fel antal poster"
    return {"product": {"revision": REVISION[pid],
                        "media": {"itemsInfo": {"items": items}}},
            "fieldMask": {"paths": ["media"]}}


if __name__ == "__main__":
    os.makedirs(os.path.join(HAR, "patch-media"), exist_ok=True)
    for pid in sys.argv[1:] or sorted(T.SLUG):
        j = json.dumps(kropp(pid), ensure_ascii=False, separators=(",", ":"))
        io.open(os.path.join(HAR, "patch-media", pid + ".json"), "w",
                encoding="utf-8").write(j)
        kort = [i for i in kropp(pid)["product"]["media"]["itemsInfo"]["items"]
                if i["altText"].startswith("Faktakort")]
        print("%s  %s  %d poster, %d kort, %d tecken"
              % (pid, IDS[pid][:8], len(kropp(pid)["product"]["media"]
                                        ["itemsInfo"]["items"]),
                 len(kort), len(j)))
