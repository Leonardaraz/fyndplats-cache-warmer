# -*- coding: utf-8 -*-
"""Runda 115 Steg 8 — SKU:erna RÄKNAS ur husregeln, de skrivs inte för hand.

☠️ Runda 51 hade tre fel-SKU:er och runda 53 två, båda gångerna för att
   24-teckensgränsen kapades ur minnet i stället för ur koden. Reglerna här är
   en avskrift av `lib/import/sku.ts` — `skuSlugify`, `stripBrandPrefix`,
   `dropConnectors`, `joinWithinLimit` — och `kontroll()` fäller om resultatet
   inte är sju DISTINKTA strängar under 40 tecken.

☠️ OCH DEN MEKANISKA KAPNINGEN KOLLAPSAR I EN SYSKONBATCH. Tre av rundans
   sluggar börjar `sparktraktor-slap-…`; 24-teckensgränsen på hel-ords-gräns
   ger `sparktraktor-slap` för alla tre. Barstolarna 2026-09-02 fick sju
   identiska SKU:er av precis det. Regeln som gäller: behåll den SKILJANDE
   svansen och kapa MITTEN — det görs i SKILJANDE nedan, och kontroll() fäller
   om någon rad blir lika med den mekaniska kollapsen.
"""
import re
import unicodedata

import texter as T

SKU_MAX = 40
PRODUKT_MAX = 24
BINDEORD = {"for", "med", "i", "och", "the", "with", "pa", "av"}
MARKEN = {"succebuy", "vevor", "homcom", "pawhut", "outsunny", "giantex",
          "costway", "tobbi", "aosom", "sportnow", "vinsetto", "aiyaplay",
          "zonekiz", "kleankin"}


def skuslug(s):
    s = unicodedata.normalize("NFD", (s or "").lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", s))


def strippa_marke(slug):
    d = [p for p in slug.split("-") if p]
    while len(d) > 1 and d[0] in MARKEN:
        d.pop(0)
    return d


def strippa_bindeord(d):
    kvar = [t for t in d if t not in BINDEORD]
    return kvar or d


def foga(tokens, max_):
    ut = ""
    for w in tokens:
        if not w:
            continue
        if not ut:
            ut = w if len(w) <= max_ else w[:max_]
            if len(w) > max_:
                break
        elif len(ut + "-" + w) <= max_:
            ut += "-" + w
        else:
            break
    return ut or "-".join(tokens)[:max_]


def mekanisk(slug):
    """Exakt vad husregeln ger — utan att röra tokenordningen."""
    return "FP-" + (foga(strippa_bindeord(strippa_marke(skuslug(slug))),
                         PRODUKT_MAX) or "produkt")


# ☠️ De SKILJANDE tokens per produkt, valda inom produkt-delens 24 tecken.
#    Alla sju sluggar delar sina ledande ord med minst en syskonsida, så den
#    mekaniska kapningen kollapsar. Här står de token som faktiskt skiljer.
SKILJANDE = {
    "cc6b56f9": ["gravmaskin", "sitta", "85"],
    "fb142c5c": ["hjullastare", "sitta", "78"],
    "738ca991": ["bandgravare", "larvband"],
    "0c05c1a0": ["frontlastare", "sitta", "80"],
    "23ba27a5": ["sparktraktor", "skopa", "grep"],
    # ⚠️ `sandleksaker` sprängde produkt-delens 24 tecken, så `foga` stannade
    #    efter `sparktraktor` och BÅDA traktorerna blev `FP-sparktraktor`.
    #    Grinden fällde det. Färgen är det som skiljer och den ryms.
    "39d85f18": ["sparktraktor", "gul"],
    "389ac5ac": ["sparktraktor", "bla"],
}


def sku(k):
    s = "FP-" + foga(SKILJANDE[k], PRODUKT_MAX)
    if len(s) > SKU_MAX:
        raise SystemExit(f"☠️ {k}: SKU {s!r} är {len(s)} tecken, taket är {SKU_MAX}")
    return s


def kontroll():
    alla = {k: sku(k) for k in T.SLUG}
    if len(set(alla.values())) != len(alla):
        raise SystemExit(f"☠️ SKU-KROCK INOM RUNDAN: {alla}")
    for k, s in alla.items():
        if len(s) > SKU_MAX:
            raise SystemExit(f"☠️ {k}: {len(s)} tecken")
        if not re.fullmatch(r"FP-[a-z0-9-]+", s):
            raise SystemExit(f"☠️ {k}: {s!r} är inte ren ASCII-slug")
        for t in s[3:].split("-"):
            if t in MARKEN:
                raise SystemExit(f"☠️ {k}: husmärket {t!r} läcker in i SKU:n")
        # Varje SKU-token ska finnas i produktens EGEN slug — annars är den
        # påhittad snarare än härledd.
        for t in s[3:].split("-"):
            if t not in skuslug(T.SLUG[k]).split("-"):
                raise SystemExit(f"☠️ {k}: token {t!r} finns inte i sluggen "
                                 f"{T.SLUG[k]!r}")
    # ☠️ Bevisa att den mekaniska kapningen VERKLIGEN kollapsar — annars är
    #    SKILJANDE en onödig avvikelse från husregeln och ska tas bort.
    mek = {k: mekanisk(T.SLUG[k]) for k in T.SLUG}
    krockar = len(mek) - len(set(mek.values()))
    if krockar == 0:
        raise SystemExit("☠️ Husregeln ger redan sju distinkta SKU:er — "
                         "SKILJANDE behövs inte och ska tas bort")
    print(f"sku.kontroll: {len(alla)} distinkta SKU:er, längsta "
          f"{max(len(v) for v in alla.values())} tecken; husregelns mekaniska "
          f"kapning hade gett {len(set(mek.values()))} unika av {len(mek)} "
          f"({krockar} krockar)")
    return alla


if __name__ == "__main__":
    a = kontroll()
    for k in T.SLUG:
        print(f"  {k}  {a[k]:<34} (mekaniskt: {mekanisk(T.SLUG[k])})")
