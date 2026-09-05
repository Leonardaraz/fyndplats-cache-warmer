#!/usr/bin/env python3
"""Filgrind för poleringsrunda A.

Två sorters kontroll, och den andra är den som biter:

1. Mönstergrind — husmärken, artikelnummer, fraktland, leverantörsomnämnanden,
   tyska rester, kända stavfel, homoglyfer.
2. ☠️ SIFFERGRIND — varje tal i den svenska texten måste finnas i källtexten.
   Det är den som fångar transkriberingsfel, och den behöver inte veta vilka
   mönster någon råkat tänka på i förväg. Ett påhittat mått är den dyraste
   sortens fel: det ser korrekt ut och ingen kan se att det är fel utan källan.
"""
import re, sys, json, glob, os

MARKEN = r"HOMCOM|Outsunny|PawHut|Aiyaplay|Aosom|SportNow|Vinsetto|Kleankin|Zonekiz|Durhand"
ARTNR  = r"\b\d{3}-\d{3}[A-Z0-9]*\b|\b\d{2}[A-Z]-\d{3}"
LAND   = r"\b(Tyskland|Deutschland|tysk[at]?|Spanien|spansk|Polen|polsk|Kina|kines|EU-lager|skickas fr[åa]n|lagerland)\b"
LEV    = r"\b([Ll]everant[öo]r\w*|[Tt]illverkaren anger|vi vet inte|enligt uppgift)\b"
# cm. och ca. är svenska meningsslut — de hörde aldrig hemma här.
TYSKA  = r"(?<![a-zåäöéü])(und|mit|für|der|die|das|ist|sind|Kinder|Sessel|Sofa|Jahre|Maße|Farbe|Gewicht|Lieferumfang|Montage|Rückenlehne|weich|robust|niedlich|gemütlich)(?![a-zåäöéü])"
STAV   = r"\b(dögnsvarv|engangsjobb|ihopsattningen|for hard|hallbar|fatolj|hojd|langd|sakerhet|storlek(?!en|ar))\b"
HOMO   = r"[Ѐ-ӿͰ-Ͽ]"

GRINDAR = [("HUSMÄRKE", MARKEN), ("ARTIKELNUMMER", ARTNR), ("FRAKTLAND", LAND),
           ("LEVERANTÖR", LEV), ("TYSK REST", TYSKA), ("STAVNING", STAV), ("HOMOGLYF", HOMO)]

def kropp(html):
    # ☠️ HREF MASTE BORT FORE SIFFERGRINDEN. En slug bar produktens matt
    # ("baddfatolj-190-cm"), och de siffrorna ar en ADRESS, inte ett
    # pastaende om varan. Utan det har fyrar grinden pa varje korslank och
    # man lar sig klicka forbi den — och da ar aven det akta fyndet borta.
    html = re.sub(r'href="[^"]*"', 'href=""', html)
    return re.sub(r"<[^>]+>", " ", html)

def tal(text):
    """Alla tal, normaliserade så 44,5 och 44.5 jämförs lika."""
    return {t.replace(".", ",").rstrip(",") for t in re.findall(r"\d+(?:[.,]\d+)?", text)}

def main(katalog, kallfil):
    kallor = json.load(open(kallfil, encoding="utf-8"))
    fynd = 0
    filer = sorted(glob.glob(os.path.join(katalog, "*.html")))
    for f in filer:
        kort = os.path.basename(f).replace(".html", "")
        txt = open(f, encoding="utf-8").read()
        k = kropp(txt)

        for namn, mönster in GRINDAR:
            for m in re.finditer(mönster, k):
                print(f"  {kort}: [{namn}] {m.group(0)!r} …{k[max(0,m.start()-45):m.end()+45].strip()}…")
                fynd += 1

        # Siffergrinden
        källa = kallor.get(kort)
        if källa is None:
            print(f"  {kort}: [KÄLLA SAKNAS] ingen källtext att jämföra mot")
            fynd += 1
            continue
        mina = tal(k)
        deras = tal(kropp(källa))
        # Tal som är rena räkneord i löptext ("två barn", "tre år") skrivs med
        # bokstäver, så allt numeriskt ska gå att belägga.
        påhittade = sorted(mina - deras, key=lambda x: (len(x), x))
        for t in påhittade:
            träff = re.search(r"[^.]*\b" + re.escape(t.replace(",", "[.,]")) + r"\b[^.]*", k)
            print(f"  {kort}: [SIFFRA UTAN KÄLLA] {t!r}")
            fynd += 1

    print()
    print(f"GRIND: {fynd} fynd i {len(filer)} filer")
    return 1 if fynd else 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2]))
