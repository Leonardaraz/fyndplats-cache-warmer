# -*- coding: utf-8 -*-
"""Runda 125 Steg 14 — grindar den PUBLICERADE sidan, inte utkastet.

Alla tio publicerades: saldo över noll och EU-lager på varenda en
(STEG1-5.md, Steg 3). Ingen hålls tillbaka.

Skillnaden mot källgrinden (`grind.py`) är inte vilka regler som gäller
utan VAD de läser. Källgrinden läser `T.bygg(pid)`; den här läser HTML:en
butiken faktiskt levererar — med rekommendationsraden, grannarnas namn i
två serialiseringar och React-payloaden i `<script>`.

☠️ FÄRGGRINDEN SLÄPPER IN SYSKONETS FÄRG, precis som källgrinden gör.
   Fyra färgpar i rundan jämför sig med sitt syskon i klartext, och det är
   sidans EGNA mening, inte en ankartext — `egna_meningar` kan alltså inte
   skilja ut den. En grind som förbjöd varje främmande färgord hade fällt
   åtta korrekta sidor.

   Den farliga riktningen är stängd på annat håll: `grind.granska` kräver
   att NAMN, TITEL och META bär exakt produktens egen färg och ingen annans.

☠️ LÅDANTALSGRINDEN MÅSTE FÖLJA MED HIT. Tre av tio bär lådantalet i
   spec-blockets `Mått`-fält från leverantören, och rundans farligaste
   påstående är just antalet: samma kartong och samma stomme bär 5 eller 7
   lådor. Grinden är negativ mot familjens ANDRA tal — och undantagen
   (delmängder, delnamn) måste vara identiska med källgrindens, annars
   fäller den korrekta sidor.

☠️ Grannstrykningen är obligatorisk. Butikens rekommendationsrad bär
   GRANNARNAS namn i två serialiseringar, och rundans korslänkar bär
   grannens färg i ankartexten.
"""
import re
import sys

sys.path.insert(0, "..")

import grindar as G          # noqa: E402
import grind as GR           # noqa: E402
import texter as T           # noqa: E402

FORBJUDET = [m for m, _ in GR.FORBJUDET if m is not G.ARTNR] + [G.ARTNR]
ETIKETT = {m: e for m, e in GR.FORBJUDET}

# ☠️ TVÄTTEN BOR I `grindar.butikstvatt`, INTE HÄR (uppgift #452).
_tvatta = G.butikstvatt


def _las(pid, egna, fel):
    """Tre besked som utesluter varandra — samma tre som källgrinden."""
    if pid in GR.NYCKLAR:
        if not re.search(r"\b(cylinderlås|centrallås|nyckellås)\b", egna, re.I):
            fel.append("LÅSGRINDEN: sidan säger inte HUR den låses")
        if not re.search(r"två\s+nycklar[^.!?]{0,30}(ingår|följer|medföljer)"
                         r"|(ingår|följer|medföljer)[^.!?]{0,30}två\s+nycklar",
                         egna, re.I):
            fel.append("LÅSGRINDEN: sidan säger inte att två nycklar ingår")
        if re.search(r"hänglås", egna, re.I):
            fel.append("LÅSGRINDEN: den här har cylinderlås, inte hänglåsögla")
    elif pid in GR.LAS_UTAN_NYCKEL:
        if not re.search(r"\b(cylinderlås|centrallås|nyckellås)\b", egna, re.I):
            fel.append("LÅSGRINDEN: sidan säger inte HUR den låses")
        if re.search(r"\bnyck(el|lar)\w*\s*[^.!?]{0,30}\b(ingår|följer|medföljer)"
                     r"(?!\s+(inte|ej))", egna, re.I):
            fel.append("LÅSGRINDEN: leveransen listar INGA nycklar — lova inga")
    else:
        for m in re.finditer(r"hänglås|nyckellås|cylinderlås|centrallås|låsbar",
                             egna, re.I):
            fel.append(f"LÅSGRINDEN: modellen har inget lås — "
                       f"…{G.mening_kring(egna, m.start())}…")


def _lador(pid, egna, fel):
    """Identisk med källgrindens — inklusive båda undantagen."""
    n = GR.LADOR[pid]

    def tal(x):
        return rf"(?:\b{GR.RAKNEORD[x]}\b|(?<![\d,]){x}(?![\d,]))"

    if not (re.search(rf"{tal(n)}[^.!?]{{0,30}}\blåd", egna, re.I)
            or re.search(rf"\blådor\b[^.!?]{{0,12}}{tal(n)}", egna, re.I)):
        fel.append(f"LÅDANTALET {n} står inte på den live sidan")

    DEL_EFTER = r"(?:grunda|djupa|små|stora|breda)\s+"
    DELNAMN = (r"\b(?:överkist\w*|rullskåp\w*|mellankist\w*|mittkist\w*|"
               r"kistan|kistans|skåpet|skåpets|underdel\w*|per|varje|"
               r"drar?\s+ut|dra\s+ut|öppna\w*)\b")
    for fel_n in sorted(set(GR.LADOR.values())):
        if fel_n == n:
            continue
        for m in re.finditer(rf"{tal(fel_n)}\s+({DEL_EFTER})?låd", egna, re.I):
            if m.group(1):
                continue
            a = max(egna.rfind(".", 0, m.start()), egna.rfind(":", 0, m.start()),
                    egna.rfind("?", 0, m.start()))
            if re.search(DELNAMN, egna[a + 1:m.start()], re.I):
                continue
            fel.append(f"FEL LÅDANTAL {fel_n} (rätt är {n}) — "
                       f"…{G.mening_kring(egna, m.start())}…")


def granska(pid, html, slug):
    fel = G.flikfel(html)
    egna, kors = G.egna_meningar(html, slug, T.NAMN[pid], _tvatta)

    for m in FORBJUDET:
        for t in m.finditer(egna):
            fel.append(f"{ETIKETT.get(m, 'FÖRBJUDET')}: …{G.mening_kring(egna, t.start())}…")
    for m, e in GR.TONGRINDAR:
        for t in m.finditer(egna):
            fel.append(f"{e}: …{G.mening_kring(egna, t.start())}…")

    # ☠️ FÄRGGRINDEN, med `G.fargformer` — `röd\w*` matchar inte `rött`.
    tillatna = (GR.FARG[pid] | GR.DELFARG.get(pid, set())
                | GR.SYSKONFARG.get(pid, set()))
    for ord_ in G.FARGORD:
        if ord_ in tillatna:
            continue
        for m in re.finditer(G.fargformer(ord_), egna, re.I):
            mening = G.mening_kring(egna, m.start())
            if re.search(r"slist|skena|handtag|nyckel|krom", mening, re.I):
                continue
            fel.append(f"FÄRGORD {ord_!r} — uppmätt är "
                       f"{sorted(GR.FARG[pid] | GR.DELFARG.get(pid, set()))} "
                       f"— …{mening}…")

    _las(pid, egna, fel)
    _lador(pid, egna, fel)

    # Lastgrinden — talet är verifierat mot källan.
    if not re.search(rf"\b(tål|bär)\b[^.!?]{{0,80}}\b{GR.LAST[pid]}\s*(kg|kilo)",
                     egna, re.I):
        fel.append(f"LASTGRINDEN: sidan säger inte att den tål {GR.LAST[pid]} kg")

    # ☠️ MATERIALGRINDEN — spec-blocket säger plast, stommen är stål.
    if pid == "5745c3cb":
        if not re.search(r"\bstål\w*\b", egna, re.I):
            fel.append("MATERIALGRINDEN: stommen är STÅL och sidan säger det inte")

    # ☠️ UTDRAGSGRINDEN, bara bdd01b5f.
    if pid == "bdd01b5f":
        for t in ("70", "130"):
            if not re.search(rf"\b{t}\s*(cm|centimeter)", egna, re.I):
                fel.append(f"UTDRAGSGRINDEN: måttet {t} cm saknas")
        if not re.search(r"tyngdpunkt|utanför\s+hjulen|lasta\w*\s+lättare|"
                         r"belasta\w*\s+.{0,20}lättare", egna, re.I):
            fel.append("UTDRAGSGRINDEN: tyngdpunktsvarningen saknas")

    # Namn, titel och meta ska stå på sidan.
    for falt, varde in (("namn", T.NAMN[pid]), ("titel", T.TITEL[pid])):
        if varde not in html:
            fel.append(f"{falt.upper()} saknas på sidan")
    if T.META[pid] not in html:
        fel.append("METAN saknas på sidan")

    # ☠️ Introt ska stå EXAKT en gång.
    intro = T.INTRO[pid][:60]
    n = egna.count(intro)
    if n != 1:
        fel.append(f"INTROT står {n} gånger, väntade 1")
    return fel


if __name__ == "__main__":
    import json
    d = json.load(open("skrivning.json"))
    totalt = 0
    # ☠️ Grinden prövar SIG SJÄLV innan den prövar sidorna (uppgift #452).
    sjalvfel, antal = G._sjalvtest()
    print(f"grindar._sjalvtest(): {antal} fall, {len(sjalvfel)} fel")
    for f in sjalvfel + G.tvillingsvep():
        print("  ☠️ GRIND:", f)
        totalt += 1
    for pid, v in d.items():
        url = f"https://www.fyndplats.se/produkt/{v['slug']}"
        try:
            html, _ = G.hamta_isr(url)
        except Exception as e:
            print(f"FEL  {pid}  hämtning: {e}")
            totalt += 1
            continue
        fel = granska(pid, html, v["slug"])
        totalt += len(fel)
        print(f"{'FEL ' if fel else 'OK  '}{pid}  {v['slug']}")
        for f in fel:
            print("      ☠️", f)
    print(f"\n{len(d)} sidor, {totalt} fel")
    sys.exit(1 if totalt else 0)
