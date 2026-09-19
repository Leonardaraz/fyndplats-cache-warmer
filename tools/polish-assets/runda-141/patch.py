# -*- coding: utf-8 -*-
"""Bygger PATCH-kroppen ur den GRINDADE texten och skriver den till fil.

☠️ Kroppen far aldrig komponeras for hand i chatten (batch 64). Den byggs
   har, grindas en sista gang, och skrivs till `patch/<pid>.json`. Det som
   klistras in i API-anropet ar alltsa filens exakta innehall — och Steg 9
   laser tillbaka och jamfor mot `texter.bygg(pid)`, sa en felaktig avskrift
   fangas av en matning och inte av oga.
"""
import io, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import grind as _grind
import texter as T

REVISION = {
    "8de3c3ef": "2", "7b818c3b": "1", "8a0e05f4": "1", "b4961e6f": "2",
    "83b2cf8b": "1", "a4bbe667": "2", "18b94738": "1",
}


def kropp(pid):
    fel = _grind.granska(pid)
    assert not fel, "GRINDEN FALLER pa %s: %r" % (pid, fel)
    namn, titel, meta = T.NAMN[pid], T.TITEL[pid], T.META[pid]
    return {"product": {
        "revision": REVISION[pid],
        "name": namn,
        "slug": T.SLUG[pid],
        "plainDescription": T.bygg(pid),
        "seoData": {
            "tags": [
                {"type": "title", "children": titel, "custom": False,
                 "disabled": False},
                {"type": "meta", "props": {"property": "og:title",
                                           "content": titel},
                 "children": "", "custom": True, "disabled": False},
                {"type": "meta", "props": {"name": "description",
                                           "content": meta},
                 "children": "", "custom": True, "disabled": False},
                {"type": "meta", "props": {"property": "og:description",
                                           "content": meta},
                 "children": "", "custom": True, "disabled": False},
                {"type": "meta", "props": {"property": "og:type",
                                           "content": "product"},
                 "children": "", "custom": True, "disabled": False},
            ],
            "settings": {"preventAutoRedirect": False, "keywords": [
                {"term": o, "isMain": i == 0, "origin": "USER"}
                for i, o in enumerate(T.SOKORD[pid])]},
        },
    }}


if __name__ == "__main__":
    os.makedirs("patch", exist_ok=True)
    for pid in sys.argv[1:] or sorted(T.SLUG):
        j = json.dumps(kropp(pid), ensure_ascii=False, separators=(",", ":"))
        io.open("patch/%s.json" % pid, "w", encoding="utf-8").write(j)
        print("%s  %d tecken" % (pid, len(j)))
