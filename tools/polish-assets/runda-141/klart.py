# -*- coding: utf-8 -*-
"""Klart-kriteriet (runbookens checklista före Steg 13) som GRIND, inte som ögon.

Det här är den OFFLINE-halvan: allt som går att avgöra ur `texter.py` innan
någonting skrivits till Wix. Live-halvan (`<summary>` på den renderade sidan)
hör till Steg 14 och körs av `flikkoll.py` / `liverunda.py`.

☠️ Varför en egen fil och inte fler rader i `grind.py`: `grind.py` grindar
   RUNDANS PÅSTÅENDEN (mått, material, maxlast). Det här grindar SIDANS FORM
   — fält som måste finnas, rubriker som måste stå i rätt ordning, fält som
   ingen annan kontroll tittar på. Två frågor, två filer.

☠️ `seoData.settings.keywords` är punkten som motiverar hela filen. Importen
   lägger leverantörens TYSKA rubrik där, Steg 7 skriver bara `seoData.tags`,
   och fältet renderas inte — alltså är det ett fält ingen kontroll någonsin
   tittar på om den inte skrivs. Mätt i runda 52 på 8 av 8 produkter.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import grindar as G          # noqa: E402
import texter as T           # noqa: E402

H2 = re.compile(r"<h2>(.*?)</h2>")

# Tyska ordstammar ur runbookens checklista + rundans egna. ☠️ En ordgräns,
# inte en naken `in` — `wohn` finns i ingenting svenskt, men `rest` gör det.
TYSKT = re.compile(r"\b(zelt|wohn\w*|schwarz|weiss|weiß|abmess\w*|lieferumfang|"
                   r"hantel(?:bank|scheibe)\w*|trainingsbank|klappbar|"
                   r"gewicht|rückenlehne|ruckenlehne|sitzbank|stahl|"
                   r"belastbar\w*|maße|masse\b)", re.I)

# Block som runbooken uttryckligen förbjuder i beskrivningen.
FORBJUDNA_BLOCK = re.compile(r"Det du bör veta innan du köper|Bra att veta", re.I)


def _fel(pid):
    fel = []
    html = T.bygg(pid)
    namn = T.NAMN[pid]
    slug = T.SLUG[pid]

    # ── 1. Namnet ──────────────────────────────────────────────────────────
    # 80-teckentaket är Wix hårda gräns; `granska_namn` bär den + märkes-
    # och jargonggrindarna.
    fel.extend("NAMN: " + x for x in G.granska_namn(namn))

    # ── 2. Flikstrukturen ──────────────────────────────────────────────────
    # ☠️ Ordningen i HTML:en är INTE fri: `splitFlikar` lägger allt EFTER en
    #    flikrubrik i den fliken, fram till nästa. Ett block mellan två
    #    flikrubriker hamnar alltså i den FÖREGÅENDE fliken — så runda 120:s
    #    skötseltext och korslänkar hamnade inne i spec-tabellen.
    rubriker = H2.findall(html)
    forsta = next((i for i, r in enumerate(rubriker)
                   if r in G.FLIKAR_SOM_KRAVS), None)
    if forsta is None:
        fel.append("FLIK: ingen av de tre flikrubrikerna finns")
    else:
        efter = rubriker[forsta:]
        stray = [r for r in efter if r not in G.FLIKAR_SOM_KRAVS]
        if stray:
            fel.append("FLIK: %r ligger EFTER första flikrubriken och hamnar "
                       "inne i föregående flik" % (stray,))
        if efter != list(G.FLIKAR_SOM_KRAVS):
            fel.append("FLIK: flikrubrikerna är %r, väntade %r"
                       % (efter, list(G.FLIKAR_SOM_KRAVS)))

    # ── 3. Tyska rester — i ALLA fält, inte bara i brödtexten ──────────────
    # ☠️ Sökorden är det fält som överlever hela poleringen. Färgvärdet i
    #    spec-tabellen är det andra importen lämnar oöversatt.
    falt = {"namn": namn, "slug": slug, "titel": T.TITEL[pid],
            "meta": T.META[pid], "beskrivning": G.strip_taggar(html)}
    for i, s in enumerate(T.SOKORD[pid]):
        falt["sökord[%d]" % i] = s
    for nyckel, varde in falt.items():
        for m in TYSKT.finditer(varde):
            fel.append("TYSKT: %r i %s" % (m.group(0), nyckel))

    # ── 4. Sökorden måste vara SATTA och svenska ──────────────────────────
    if not T.SOKORD.get(pid):
        fel.append("SÖKORD: settings.keywords är tomt — importens tyska rubrik "
                   "ligger kvar i Wix om PATCH:en inte skriver fältet")

    # ── 5. Förbjudna block ────────────────────────────────────────────────
    for m in FORBJUDNA_BLOCK.finditer(html):
        fel.append("BLOCK: %r — leverantörsfel rättas i löptexten, inte som "
                   "varningslista" % m.group(0))

    # ── 6. SKU:n härleds ur den POLERADE sluggen ──────────────────────────
    vantad = "FP-" + G.sku_bas(slug)
    if T.SKU[pid] != vantad:
        fel.append("SKU: %r, härlett ur sluggen blir %r"
                   % (T.SKU[pid], vantad))

    # ── 7. Wix-variantens id måste finnas — utan det avvisas stämplingen ──
    if not T.WIX_VARIANT.get(pid):
        fel.append("VARIANT: wixVariantId saknas — stämplingen svarar 422 och "
                   "skriver INGENTING, inte heller de andra fälten")

    return fel


def _batchfel():
    """Fel som bara syns när batchen ses som helhet."""
    fel = []
    for falt, namn in ((T.SLUG, "slug"), (T.SKU, "SKU"), (T.NAMN, "namn"),
                       (T.TITEL, "titel")):
        sett = {}
        for pid, v in falt.items():
            sett.setdefault(v, []).append(pid)
        for v, pids in sett.items():
            if len(pids) > 1:
                fel.append("KROCK: %s %r delas av %s" % (namn, v, pids))
    # ☠️ Korslänkarnas mål måste finnas — en länk till ett tillbakahållet
    #    syskon blir en 404 på en publicerad sida (#544).
    egna = set(T.SLUG.values()) | {T.PUB_ROD}
    kanda = set(json.load(open("sitemap-slugs.json"))) | egna
    for pid in T.SLUG:
        for m in re.finditer(r'href="[^"]*/produkt/([^"]+)"', T.bygg(pid)):
            if m.group(1) not in kanda:
                fel.append("LÄNK: %s pekar på okänd slug %r" % (pid, m.group(1)))
    return fel


def _sjalvtest():
    """En grind som inte kan fälla är ingen grind. Plantera varje regel."""
    brister = []
    prov = sorted(T.SLUG)[0]

    def med(falt, pid, varde, vantat):
        spar = falt[pid]
        falt[pid] = varde
        try:
            f = _fel(pid)
        finally:
            falt[pid] = spar
        if not any(vantat in x for x in f):
            brister.append("PLANTERAT FEL FÅNGADES INTE: %s (väntade %r, fick %r)"
                           % (vantat, vantat, f))

    med(T.SOKORD, prov, [], "SÖKORD")
    med(T.SOKORD, prov, ["hantelbank klappbar schwarz"], "TYSKT")
    med(T.META, prov, "Rückenlehne i tre lägen.", "TYSKT")
    med(T.WIX_VARIANT, prov, "", "VARIANT")
    med(T.SLUG, prov, "en-helt-annan-slug", "SKU:")

    # Ett block mellan två flikrubriker — runda 120:s verkliga fel.
    spar = T.SKOTSEL[prov]
    T.SKOTSEL[prov] = spar + "</p><h2>Passar inte det här?</h2><p>x"
    try:
        f = _fel(prov)
    finally:
        T.SKOTSEL[prov] = spar
    if not any("FLIK:" in x for x in f):
        brister.append("PLANTERAT FEL FÅNGADES INTE: h2 mellan flikrubrikerna")

    return brister


if __name__ == "__main__":
    brister = _sjalvtest()
    for b in brister:
        print("☠️ SJÄLVTEST: " + b)
    totalt = 0
    for pid in sorted(T.SLUG):
        f = _fel(pid)
        totalt += len(f)
        print("%s  %-46s %s" % (pid, T.SLUG[pid], "OK" if not f else ""))
        for x in f:
            print("    ☠️ " + x)
    for x in _batchfel():
        totalt += 1
        print("☠️ " + x)
    print("klart-kriteriet: %d produkter, %d fel, %d självtestbrister"
          % (len(T.SLUG), totalt, len(brister)))
    raise SystemExit(1 if (totalt or brister) else 0)
