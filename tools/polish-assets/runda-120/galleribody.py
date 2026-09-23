import json
import sys

g = json.load(open("galleri.json"))
p = json.load(open("produkter.json"))
pid = sys.argv[1]
print(json.dumps({
    "product": {"id": p[pid]["id"], "revision": (sys.argv[2] if len(sys.argv) > 2 else g[pid]["revision"]),
                "media": {"itemsInfo": {"items": g[pid]["items"]}}},
    "fieldMask": {"paths": ["media"]},
}, ensure_ascii=True))
