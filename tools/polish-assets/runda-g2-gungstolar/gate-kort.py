#!/usr/bin/env python3
"""Grindar runda G2:s åtta kort mot produktens EGEN källtext.

Raderna byggs mekaniskt ur <kort>.html, så de kan inte drifta — grinden
bevisar det i stället för att lita på det. Det som ÄR handskrivet är kickern
och titeln, och de gatas som all annan kundtext.

☠️ SYSKONREGELN. Sex av åtta delar sina mått med ett syskon. Ett kort vars
rubrikpar (kicker + titel) är identiskt med ett annat korts säger ingenting
om vilken av de två man tittar på — då är kortet en dubblett, inte ett kort.
"""
import re, sys, os

src = open("bygg-kort.py", encoding="utf-8").read()
ns = {"re": re, "os": os}
# ⚠️ Grinden läser byggarens EGNA definitioner ur källan — allt före RUBRIK
# (hjälparna, inklusive kort_rader) och sedan RUBRIK-tabellen. Delningen får
# inte hänga på en kommentar: G2 tog bort den G1 delade på, och grinden dog med
# ett AttributeError i stället för att gata.
exec(src.split("RUBRIK = {")[0]
        .replace('import cardkit as ck', 'ck = None')
        .replace('sys.path.insert(0, "/home/user/fyndplats-cache-warmer/scripts")', ''), ns)
exec("RUBRIK = {" + src.split("RUBRIK = {")[1].split("\nnamn = []")[0], ns)
kort_rader, RUBRIK = ns["kort_rader"], ns["RUBRIK"]

MARKEN = ("HOMCOM","Outsunny","PawHut","Aiyaplay","Aosom","SportNow","Vinsetto","Kleankin","Zonekiz","Durhand")
ARTNR  = r"\b\d{3}-\d{3}[A-Z0-9]*\b|\b\d{2}[A-Z]-\d{3}"
LAND   = r"\b(Tyskland|tysk[at]?|Spanien|spansk|Polen|polsk|Kina|kines|EU-lager|skickas fr[åa]n)\b"
LEV    = r"\b([Ll]everant[öo]r\w*|[Tt]illverkaren anger|vi vet inte)\b"
TAL    = re.compile(r"\d+(?:[,.]\d+)?")

fel, sedda = [], {}
for kort, (kicker, titel) in RUBRIK.items():
    rader, s = kort_rader(kort)          # exakt de rader kortet renderar
    kalla = re.sub(r"<[^>]+>", " ", open(f"{kort}.html", encoding="utf-8").read())
    kalla_tal = set(TAL.findall(kalla))

    # 1. Varje RENDERAT radvärde måste stå ordagrant i produktens egen sida.
    #    ☠️ Grinden läste tidigare en EGEN etikettlista i stället för byggarens
    #    rader — en handskriven rad i byggaren gatades då inte alls. Uppmätt
    #    med ett påhittat "Ekfanér och läder", som gick rakt igenom.
    if len(rader) != 8:
        fel.append(f"{kort}: {len(rader)} rader, väntade 8")
    for etikett, varde in rader:
        # Kortet bär &nbsp; mellan tal och enhet så raden aldrig bryts —
        # jämförelsen normaliserar bort både entiteten och tecknet.
        rent = re.sub(r"<[^>]+>", "", varde).replace("&nbsp;", " ").replace("\xa0", " ")
        if rent not in kalla:
            fel.append(f"{kort}: radvärdet {rent!r} ({etikett}) står inte i {kort}.html")

    # 2. Handskriven rubrik: mönster + siffror.
    text = f"{kicker} {titel}"
    for m in MARKEN:
        if m.lower() in text.lower(): fel.append(f"{kort}: husmärke {m} i rubriken")
    for namn_, m in (("ARTIKELNUMMER", ARTNR), ("FRAKTLAND", LAND), ("LEVERANTÖR", LEV)):
        if re.search(m, text): fel.append(f"{kort}: {namn_} i rubriken: {text!r}")
    for t in TAL.findall(text):
        if t not in kalla_tal: fel.append(f"{kort}: talet {t} i rubriken finns inte i {kort}.html")

    # 3. Syskonregeln.
    if text in sedda:
        fel.append(f"{kort}: identiskt rubrikpar som {sedda[text]} — kortet skiljer inte syskonen åt")
    sedda[text] = kort

print("\n".join(fel) if fel else
      f"GRIND REN: {len(RUBRIK)} kort, varje radvärde belagt i produktens egen sida, alla rubrikpar unika")
sys.exit(1 if fel else 0)
