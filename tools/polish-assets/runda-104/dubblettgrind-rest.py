# -*- coding: utf-8 -*-
"""Riktad dubblettgrind för rundans tre sista utkast.

Rundans stora måttsvep kördes mot 54 barnfordonssidor och gav noll. Det här är
en SMALARE och HÅRDARE kontroll mot just de familjer utkasten tillhör —
fyrhjulingar och motorcyklar — eftersom de är de enda där en dubblett är
trolig, och eftersom sitemapen släpar (den kan inte ha med sidor som
publicerats de senaste timmarna).

☠️ Nyckeln SORTERAS. Leverantören kastar om L/B/H mellan sina egna sidor, så
   `100 × 65 × 73` och `73 × 100 × 65` är samma vara.
☠️ KONTROLLMÄTNING: varje utkasts EGEN trippel måste hittas av mönstret, annars
   är det mönstret som är trasigt och inte katalogen som är ren.
"""
import re, sys, urllib.request

TRIPPEL = re.compile(
    r"(\d{1,3}(?:[,.]\d+)?)\s*(?:cm)?\s*[LBHlbh]?\s*[x×]\s*"
    r"(\d{1,3}(?:[,.]\d+)?)\s*(?:cm)?\s*[LBHlbh]?\s*[x×]\s*"
    r"(\d{1,3}(?:[,.]\d+)?)\s*(?:cm|[LBHlbh])", re.I)


def nyckel(a, b, c):
    return tuple(sorted(float(x.replace(",", ".")) for x in (a, b, c)))


def tripplar(text):
    return {nyckel(*m) for m in TRIPPEL.findall(text)}


UTKAST = {
    "5e9cc2d2": nyckel("106,5", "56", "80"),
    "1e27f7e0": nyckel("106,5", "56", "80"),
    "883db249": nyckel("100", "65", "73"),
}

SIDOR = [
    "elfyrhjuling-barn-12v-atv-2-motorer-led-musik",
    "elfyrhjuling-barn-12v-gul",
    "elfyrhjuling-barn-24v-tvasitsig",
    "elfyrhjuling-barn-6v",
    "elfyrhjuling-barn-6v-72-cm",
    "akbil-barn-fyrhjuling",
    "elbil-barn-suv-12v-svart-akbil-fjarrkontroll",
    "gravmaskin-akbil-barn",
    "trampbil-barn-gokart",
    "elgokart-barn-24v-driftlage",
    "elgokart-barn-rod", "elgokart-barn-rosa", "elgokart-barn-vit",
    "mercedes-amg-f1-elgokart-barn",
    "trampgokart-104-cm-handbroms-vaxelspak",
    "trampgokart-barn-pedaler-eva-hjul",
    "akbil-barn-18-36-manader-stralkastare",
    "driftkart-barn-musik-ljus-12v",
]

if __name__ == "__main__":
    # kontrollmätning: hittar mönstret utkastens egna mått i deras egen text?
    prov = "Gesamtabmessungen: 106,5L x 56B x 80H cm och Gesamtmaße: 100L x 65B x 73H cm"
    hittade = tripplar(prov)
    for pid, k in UTKAST.items():
        if k not in hittade:
            raise SystemExit("☠️ KONTROLLMÄTNINGEN FÖLL: mönstret hittar inte %s (%s)" % (pid, k))
    print("✅ kontrollmätning: mönstret hittar alla tre utkastens trippel\n")

    fel = trafar = 0
    for slug in SIDOR:
        url = "https://www.fyndplats.se/produkt/" + slug
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            html = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "replace")
        except Exception as e:
            print("  ☠️ %-46s HÄMTNINGSFEL %s" % (slug, e)); fel += 1; continue
        if len(html) < 50000:
            print("  ☠️ %-46s HALV SIDA (%d B)" % (slug, len(html))); fel += 1; continue
        ts = tripplar(html)
        krock = [p for p, k in UTKAST.items() if k in ts]
        print("  %-46s %2d trippel  %s" % (slug, len(ts), "☠️ KROCK " + ",".join(krock) if krock else "rent"))
        trafar += len(krock)
    print()
    if fel:
        raise SystemExit("☠️ %d sidor kunde inte mätas — svepet är INTE giltigt" % fel)
    print("✅ %d sidor mätta, %d krockar" % (len(SIDOR), trafar))
