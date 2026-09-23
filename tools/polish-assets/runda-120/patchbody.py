"""Bygger Steg 7-PATCH-kroppen ur skrivning.json. En siffra, en källa."""
import json
import sys

PID = {
    "441d2209": "441d2209-...",
}


def bygg(pid, wixid, revision):
    d = json.load(open("skrivning.json"))[pid]
    sok = d["sokord"]
    return {
        "product": {
            "id": wixid,
            "revision": str(revision),
            "name": d["namn"],
            "slug": d["slug"],
            "plainDescription": d["html"],
            "seoData": {
                "tags": [
                    {"type": "title", "children": d["titel"],
                     "custom": False, "disabled": False},
                    {"type": "meta",
                     "props": {"name": "description", "content": d["meta"]},
                     "children": "", "custom": True, "disabled": False},
                ],
                "settings": {
                    "preventAutoRedirect": False,
                    "keywords": [
                        {"term": t, "isMain": i == 0, "origin": "USER"}
                        for i, t in enumerate(sok)
                    ],
                },
            },
        }
    }


if __name__ == "__main__":
    pid, wixid, rev = sys.argv[1], sys.argv[2], sys.argv[3]
    print(json.dumps(bygg(pid, wixid, rev), ensure_ascii=False))
