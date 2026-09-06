#!/usr/bin/env python3
"""Bygger Steg 8-kroppen MEKANISKT ur filer — inget skrivs för hand i API-anropet.

☠️ Variantobjektet får aldrig byggas från grunden (CLAUDE.md): ett handbyggt
objekt tappar tyst varje fält man inte råkade tänka på, och `visible` är det
dyraste av dem — det gjorde 31 sidor oköpbara. Här byggs det ur mätta värden
och grindas mot alt.tsv och namn.tsv innan det skickas.

Uppmätt 2026-09-06: variantens `media` går INTE att sätta med referens.
Varken utelämnat, `{id}` eller `{id, altText, mediaType}` fastnar — Wix
svarar 200 och släpper fältet. Därför skickas hela blobben.
"""
import csv, json, sys

def las(fil):
    return list(csv.DictReader(open(fil), delimiter="\t"))

alt1 = {}
for rad in open("alt.tsv"):
    c = rad.rstrip("\n").split("\t")
    if len(c) >= 3 and c[1] == "1":
        alt1[c[0]] = c[2]

namn = {}
for rad in open("namn.tsv"):
    c = rad.rstrip("\n").split("\t")
    if len(c) >= 5:
        namn[c[1]] = {"sku": c[4], "pris": c[2], "namn": c[3]}

bild = {r["kort"]: r for r in las("bildmeta.tsv")}
rader = las("steg8.tsv")

fel = []
produkter = []
for r in rader:
    kort, pid = r["kort"], r["wixProductId"]
    n = namn.get(pid)
    b = bild.get(kort)
    a = alt1.get(kort)
    if not n: fel.append(f"{kort}: saknas i namn.tsv"); continue
    if not b: fel.append(f"{kort}: saknas i bildmeta.tsv"); continue
    if not a: fel.append(f"{kort}: saknar alt-text pos 1"); continue
    if n["sku"] != r["nySku"]: fel.append(f"{kort}: SKU {r['nySku']!r} != namn.tsv {n['sku']!r}")
    if n["pris"] != r["pris"]: fel.append(f"{kort}: pris {r['pris']} != namn.tsv {n['pris']}")
    if "kratzbaum" in r["nySku"].lower(): fel.append(f"{kort}: tysk rest i SKU")

    mid = r["mediaId"]
    produkter.append({"product": {
        "id": pid,
        "revision": r["revision"],
        "visible": True,
        "variantsInfo": {"variants": [{
            "id": r["variantId"],
            "visible": True,
            "sku": r["nySku"],
            "choices": [],
            "price": {"actualPrice": {"amount": r["pris"]}},
            "media": {
                "id": mid,
                "altText": a,
                "image": {
                    "id": mid,
                    "url": f"https://static.wixstatic.com/media/{mid}",
                    "height": int(b["hojd"]),
                    "width": int(b["bredd"]),
                    "altText": a,
                    "filename": b["filnamn"],
                    "sizeInBytes": b["bytes"],
                },
                "mediaType": "IMAGE",
                "uploadId": mid,
            },
        }]},
    }})

skus = [r["nySku"] for r in rader]
if len(set(skus)) != len(skus): fel.append("dubblett-SKU i batchen")
if fel:
    print("GRIND FALLER:\n" + "\n".join(fel)); sys.exit(1)

json.dump({"products": produkter}, open("patch-steg8.json", "w"), ensure_ascii=False, indent=2)
bara = sys.argv[1] if len(sys.argv) > 1 else None
if bara:
    p = [x for x in produkter if x["product"]["id"].startswith(bara)]
    json.dump({"products": p}, open("patch-steg8-prov.json", "w"), ensure_ascii=False, indent=2)
    print(json.dumps({"products": p}, ensure_ascii=False))
else:
    print(f"GRIND REN: {len(produkter)} produkter byggda till patch-steg8.json")
