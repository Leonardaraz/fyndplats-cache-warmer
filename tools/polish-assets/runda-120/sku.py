"""Steg 8: nya variant-SKU:er ur de polerade sluggarna.

Regeln i lib/import/sku.ts kapar produkt-delen vid 24 tecken på ordgräns.
På tre rader kapar den bort just det som SKILJER produkterna åt, och då
gäller runbookens färgfamiljsundantag: behåll den särskiljande svansen och
kapa mitten i stället.
"""
import json
import re
import unicodedata

BINDEORD = {"for", "med", "i", "och", "the", "with", "pa", "av"}
MARKEN = {"succebuy", "vevor", "homcom", "pawhut", "outsunny", "giantex",
          "costway", "tobbi", "aosom", "sportnow", "vinsetto", "aiyaplay",
          "zonekiz", "kleankin"}
SKU_MAX = 40
PRODUKT_MAX = 24

# Rader där regeln kapar bort särskiljningen. Värdet är HELA SKU:n.
HANDPLOCKAD = {
    # färgsyskonen: regeln ger "…-fyra-pallar-ljus" och "…-fyra-pallar",
    # alltså tappar den bruna sin färg helt.
    "c88b5bbb": "FP-barbord-fyra-pallar-ek",
    "63a37524": "FP-barbord-fyra-pallar-brun",
    # regeln ger "FP-barbord-100-cm-tva" — sant men intetsägande; hyllplanen
    # är hela skillnaden mot de andra 100-centimetrarna.
    "c3bda64a": "FP-barbord-100-hyllplan",
}


def slugga(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", s))


def tokens(s):
    d = [t for t in slugga(s).split("-") if t]
    while len(d) > 1 and d[0] in MARKEN:
        d.pop(0)
    kvar = [t for t in d if t not in BINDEORD]
    return kvar or d


def foga(toks, max_):
    ut = ""
    for t in toks:
        kand = f"{ut}-{t}" if ut else t
        if len(kand) > max_:
            break
        ut = kand
    return ut or toks[0][:max_]


def bygg(pid, slug):
    return HANDPLOCKAD.get(pid) or ("FP-" + foga(tokens(slug), PRODUKT_MAX))


def kontroll():
    """Fäller på tomma, för långa, icke-ASCII och krockande SKU:er."""
    d = json.load(open("skrivning.json"))
    m = json.load(open("mappningar.json"))
    fel, sedda = [], {}
    for pid, rad in d.items():
        sku = bygg(pid, rad["slug"])
        if not sku.startswith("FP-") or len(sku) <= 3:
            fel.append(f"{pid}: tom SKU {sku!r}")
        if len(sku) > SKU_MAX:
            fel.append(f"{pid}: {len(sku)} tecken > {SKU_MAX} — {sku}")
        if not re.fullmatch(r"[A-Za-z0-9-]+", sku):
            fel.append(f"{pid}: icke-ASCII i {sku!r}")
        if sku in sedda:
            fel.append(f"{pid}: KROCKAR med {sedda[sku]} — {sku}")
        sedda[sku] = pid
        if sku == m[pid]["raSku"]:
            fel.append(f"{pid}: oförändrad mot råa SKU:n — {sku}")
        # svansen som skiljer syskonen åt måste överleva kapningen
        if pid in ("c88b5bbb", "63a37524") and sku == "FP-barbord-fyra-pallar":
            fel.append(f"{pid}: färgen bortkapad — {sku}")
    return fel


if __name__ == "__main__":
    d = json.load(open("skrivning.json"))
    m = json.load(open("mappningar.json"))
    import matt
    ut = {}
    for pid in matt.ALLA:
        sku = bygg(pid, d[pid]["slug"])
        ut[pid] = {"wixVariantId": m[pid]["wixVariantId"],
                   "fran": m[pid]["raSku"], "till": sku}
        mark = " (handplockad)" if pid in HANDPLOCKAD else ""
        print(f"{pid}  {m[pid]['raSku']:28s} → {sku:28s} {len(sku):2d}{mark}")
    fel = kontroll()
    print()
    print(f"kontroll: {len(fel)} fel")
    for f in fel:
        print("  ✗", f)
    if not fel:
        json.dump(ut, open("skuer.json", "w"), ensure_ascii=False, indent=1)
        print("skuer.json skriven")
